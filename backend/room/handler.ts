import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ROOM_TABLE = process.env.ROOM_TABLE || 'LorcanaRoomStateV2';
const MATCHMAKING_TABLE = process.env.MATCHMAKING_TABLE || 'LorcanaMatchmaking';

export const handler = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const routeKey = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId;
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;

  console.log(`[WebSocket] Route: ${routeKey}, Connection: ${connectionId}`);

  // Create ApiGatewayManagementApi client for broadcasting back to connected clients
  const callbackUrl = `https://${domainName}/${stage}`;
  const apigwManagementApi = new ApiGatewayManagementApiClient({ endpoint: callbackUrl });

  // 1. $connect Route
  if (routeKey === '$connect') {
    return { statusCode: 200, body: 'Connected' };
  }

  // 2. $disconnect Route
  if (routeKey === '$disconnect') {
    try {
      // Find room user was in and notify opponent
      const scanRes = await docClient.send(
        new ScanCommand({
          TableName: ROOM_TABLE,
          FilterExpression: 'connectionId = :cid',
          ExpressionAttributeValues: { ':cid': connectionId },
        })
      );

      if (scanRes.Items && scanRes.Items.length > 0) {
        const userItem = scanRes.Items[0];
        const roomId = userItem.roomId;

        // Mark user as disconnected instead of instant delete to allow rejoin within grace period
        await docClient.send(
          new PutCommand({
            TableName: ROOM_TABLE,
            Item: {
              ...userItem,
              status: 'disconnected',
              disconnectedAt: new Date().toISOString(),
            },
          })
        );

        // Notify remaining room members that player disconnected temporarily
        const roomMembers = await getRoomMembers(roomId);
        for (const member of roomMembers) {
          if (member.connectionId !== connectionId && member.status !== 'disconnected') {
            await sendMessageToConnection(apigwManagementApi, member.connectionId, {
              action: 'OPPONENT_DISCONNECTED',
              gameAction: 'OPPONENT_DISCONNECTED',
              roomId,
              username: userItem.username,
              role: userItem.role,
            });
          }
        }
      }
    } catch (err) {
      console.error('[WebSocket Disconnect Error]', err);
    }
    return { statusCode: 200, body: 'Disconnected' };
  }

  // Parse Body for custom actions (JOIN_ROOM, sendAction, LEAVE_ROOM)
  let body: any = {};
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (err) {
    console.error('[JSON Parse Error]', err);
  }

  const action = body.gameAction || body.realAction || body.type || body.action || routeKey;

  // 3. REJOIN_ROOM — Reconnect to active room after network disconnect
  if (action === 'REJOIN_ROOM') {
    const roomId = body.roomId;
    const username = body.username;
    const role = body.role;

    if (!roomId) {
      await sendMessageToConnection(apigwManagementApi, connectionId, { action: 'ERROR', message: 'Room ID is required to rejoin.' });
      return { statusCode: 400, body: 'Missing roomId' };
    }

    try {
      const roomMembers = await getRoomMembers(roomId);
      if (roomMembers.length === 0) {
        await sendMessageToConnection(apigwManagementApi, connectionId, { action: 'ERROR', message: 'Room no longer exists or expired.' });
        return { statusCode: 404, body: 'Room not found' };
      }

      // Find user entry in room (either by username or role)
      const existingUser: any = roomMembers.find((m: any) => m.username === username || m.role === role);
      if (!existingUser) {
        await sendMessageToConnection(apigwManagementApi, connectionId, { action: 'ERROR', message: 'Player session not found in this room.' });
        return { statusCode: 403, body: 'Not a member' };
      }

      // Delete old connection record
      if (existingUser.connectionId !== connectionId) {
        await docClient.send(
          new DeleteCommand({
            TableName: ROOM_TABLE,
            Key: { roomId, connectionId: existingUser.connectionId },
          })
        ).catch(() => {});
      }

      // Insert updated connection record
      const updatedUser: any = {
        ...existingUser,
        connectionId,
        status: 'active',
        rejoinedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: ROOM_TABLE,
          Item: updatedUser,
        })
      );

      // Notify the rejoining player of success
      await sendMessageToConnection(apigwManagementApi, connectionId, {
        action: 'PLAYER_RECONNECTED',
        gameAction: 'PLAYER_RECONNECTED',
        roomId,
        role: updatedUser.role,
        username: updatedUser.username,
        deckId: updatedUser.deckId,
        deckName: updatedUser.deckName,
        isSelf: true,
      });

      // Notify other room members
      const activeMembers = await getRoomMembers(roomId);
      for (const member of activeMembers) {
        if (member.connectionId !== connectionId) {
          await sendMessageToConnection(apigwManagementApi, member.connectionId, {
            action: 'PLAYER_RECONNECTED',
            gameAction: 'PLAYER_RECONNECTED',
            roomId,
            role: updatedUser.role,
            username: updatedUser.username,
            isSelf: false,
          });
        }
      }

      return { statusCode: 200, body: 'Rejoined successfully' };
    } catch (err: any) {
      console.error('[Rejoin Error]', err);
      return { statusCode: 500, body: err.message };
    }
  }

  // 3.5 REQUEST_UNDO & RESPOND_UNDO — Vote to Undo / Return Last Action
  if (action === 'REQUEST_UNDO' || action === 'UNDO_REQUESTED') {
    const roomId = body.roomId;
    const requesterUsername = body.requesterUsername || body.username || 'Player';
    const requesterRole = body.requesterRole || body.role || 'player1';
    const previousState = body.previousState || body.payload?.previousState || null;

    try {
      const roomMembers = await getRoomMembers(roomId);
      for (const member of roomMembers) {
        if (member.connectionId !== connectionId) {
          await sendMessageToConnection(apigwManagementApi, member.connectionId, {
            action: 'UNDO_REQUESTED',
            gameAction: 'UNDO_REQUESTED',
            type: 'UNDO_REQUESTED',
            roomId,
            username: requesterUsername,
            role: requesterRole,
            requesterUsername,
            requesterRole,
            previousState,
            payload: {
              roomId,
              requesterUsername,
              requesterRole,
              previousState,
            },
          });
        }
      }
      return { statusCode: 200, body: 'Undo Requested' };
    } catch (err: any) {
      console.error('[Request Undo Error]', err);
      return { statusCode: 500, body: err.message };
    }
  }

  if (action === 'RESPOND_UNDO' || action === 'UNDO_RESOLVED') {
    const roomId = body.roomId;
    const voteAccepted = body.voteAccepted === true || body.payload?.voteAccepted === true;
    const previousState = body.previousState || body.payload?.previousState || null;
    const respondedBy = body.respondedBy || body.username || 'Opponent';

    try {
      const roomMembers = await getRoomMembers(roomId);
      for (const member of roomMembers) {
        await sendMessageToConnection(apigwManagementApi, member.connectionId, {
          action: 'UNDO_RESOLVED',
          gameAction: 'UNDO_RESOLVED',
          type: 'UNDO_RESOLVED',
          roomId,
          voteAccepted,
          previousState,
          respondedBy,
          username: respondedBy,
          payload: {
            roomId,
            voteAccepted,
            previousState,
            respondedBy,
          },
        });
      }
      return { statusCode: 200, body: 'Undo Response Broadcasted' };
    } catch (err: any) {
      console.error('[Respond Undo Error]', err);
      return { statusCode: 500, body: err.message };
    }
  }

  // 4. CREATE_ROOM — host creates a lobby room with a 6-digit code
  if (action === 'CREATE_ROOM') {
    const username = body.username || `Player_${connectionId.substring(0, 4)}`;
    const deckId = body.deckId || '';
    const deckName = body.deckName || 'Untitled Deck';

    // Generate unique 6-digit room code
    let roomId = '';
    let attempts = 0;
    while (attempts < 10) {
      const candidate = String(Math.floor(100000 + Math.random() * 900000));
      const existing = await getRoomMembers(candidate);
      if (existing.length === 0) { roomId = candidate; break; }
      attempts++;
    }
    if (!roomId) return { statusCode: 500, body: JSON.stringify({ error: 'Could not allocate room' }) };

    await docClient.send(
      new PutCommand({
        TableName: ROOM_TABLE,
        Item: { roomId, connectionId, username, role: 'player1', deckId, deckName, joinedAt: new Date().toISOString() },
      })
    );

    // Reply to host with the room code
    await sendMessageToConnection(apigwManagementApi, connectionId, {
      action: 'ROOM_CREATED', gameAction: 'ROOM_CREATED', roomId, role: 'player1', username, deckId, deckName,
    });

    return { statusCode: 200, body: JSON.stringify({ roomId }) };
  }

  // 5. JOIN_ROOM with deck — friend joins via 6-digit code
  if (action === 'JOIN_ROOM') {
    const roomId = body.roomId || '108249';
    const username = body.username || `Player_${connectionId.substring(0, 4)}`;
    const deckId = body.deckId || '';
    const deckName = body.deckName || 'Untitled Deck';

    try {
      const roomMembers = await getRoomMembers(roomId);
      if (roomMembers.length === 0) {
        await sendMessageToConnection(apigwManagementApi, connectionId, { action: 'ERROR', message: 'Room not found. Please verify the 6-digit code.' });
        return { statusCode: 200, body: 'Room not found' };
      }
      if (roomMembers.length >= 2) {
        await sendMessageToConnection(apigwManagementApi, connectionId, { action: 'ERROR', message: 'Room is full (Maximum 2 players).' });
        return { statusCode: 200, body: 'Room full' };
      }

      // Check if trying to join own room with the same account
      const host = roomMembers[0];
      if (host.connectionId === connectionId || host.username.toLowerCase() === username.toLowerCase()) {
        await sendMessageToConnection(apigwManagementApi, connectionId, {
          action: 'ERROR',
          message: 'Cannot join your own room with the same account. Please use a different user account in another browser/device.',
        });
        return { statusCode: 200, body: 'Duplicate account rejected' };
      }

      const role = 'player2';
      const newItem = { roomId, connectionId, username, role, deckId, deckName, joinedAt: new Date().toISOString() };
      await docClient.send(new PutCommand({ TableName: ROOM_TABLE, Item: newItem }));

      const updatedMembers = [...roomMembers, newItem];

      // Broadcast updated room state to all members
      for (const member of updatedMembers) {
        await sendMessageToConnection(apigwManagementApi, member.connectionId, {
          action: 'ROOM_STATE',
          gameAction: 'ROOM_STATE',
          roomId,
          role: member.role,
          username: member.username,
          players: updatedMembers.map((m) => ({ connectionId: m.connectionId, username: m.username, role: m.role, deckId: m.deckId, deckName: m.deckName })),
        });
      }

      // When 2 players present → GAME_START to both
      if (updatedMembers.length === 2) {
        for (const member of updatedMembers) {
          await sendMessageToConnection(apigwManagementApi, member.connectionId, {
            action: 'GAME_START',
            gameAction: 'GAME_START',
            roomId,
            players: updatedMembers.map((m) => ({ username: m.username, role: m.role, deckId: m.deckId, deckName: m.deckName })),
          });
        }
      }

      return { statusCode: 200, body: 'Joined Room' };
    } catch (err: any) {
      console.error('[Join Room Error]', err);
      return { statusCode: 500, body: err.message };
    }
  }

  // 6. MATCHMAKING_JOIN — enter the matchmaking queue (auto pair)
  if (action === 'MATCHMAKING_JOIN') {
    const username = body.username || `Player_${connectionId.substring(0, 4)}`;
    const deckId = body.deckId || '';
    const deckName = body.deckName || 'Untitled Deck';

    try {
      // Look for a waiting opponent (filter out self: cannot match against own account or same connection)
      const waiting = await docClient.send(
        new ScanCommand({
          TableName: MATCHMAKING_TABLE,
          FilterExpression: '#st = :s',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: { ':s': 'waiting' },
        })
      );

      const candidateOpponents = (waiting.Items || []).filter(
        (item) => item.connectionId !== connectionId && item.username.toLowerCase() !== username.toLowerCase()
      );

      if (candidateOpponents.length > 0) {
        const opponent = candidateOpponents[0];
        // Clean up opponent's queue entry
        await docClient.send(new DeleteCommand({
          TableName: MATCHMAKING_TABLE,
          Key: { connectionId: opponent.connectionId },
        }));

        // Clean up self queue entry if existed
        await docClient.send(new DeleteCommand({
          TableName: MATCHMAKING_TABLE,
          Key: { connectionId },
        })).catch(() => {});

        // Create a room for both
        let roomId = '';
        let attempts = 0;
        while (attempts < 10) {
          const candidate = String(Math.floor(100000 + Math.random() * 900000));
          const existing = await getRoomMembers(candidate);
          if (existing.length === 0) { roomId = candidate; break; }
          attempts++;
        }

        const p1 = { roomId, connectionId: opponent.connectionId, username: opponent.username, role: 'player1', deckId: opponent.deckId, deckName: opponent.deckName, joinedAt: new Date().toISOString() };
        const p2 = { roomId, connectionId, username, role: 'player2', deckId, deckName, joinedAt: new Date().toISOString() };
        await docClient.send(new PutCommand({ TableName: ROOM_TABLE, Item: p1 }));
        await docClient.send(new PutCommand({ TableName: ROOM_TABLE, Item: p2 }));

        // MATCH_FOUND to both
        const players = [p1, p2].map((m) => ({ username: m.username, role: m.role, deckId: m.deckId, deckName: m.deckName }));
        await sendMessageToConnection(apigwManagementApi, opponent.connectionId, { action: 'MATCH_FOUND', gameAction: 'MATCH_FOUND', roomId, players });
        await sendMessageToConnection(apigwManagementApi, connectionId, { action: 'MATCH_FOUND', gameAction: 'MATCH_FOUND', roomId, players });

        return { statusCode: 200, body: JSON.stringify({ roomId }) };
      }

      // No other opponent yet → upsert into queue
      await docClient.send(new PutCommand({
        TableName: MATCHMAKING_TABLE,
        Item: { connectionId, username, deckId, deckName, status: 'waiting', queuedAt: new Date().toISOString() },
      }));
      await sendMessageToConnection(apigwManagementApi, connectionId, { action: 'WAITING', message: 'Searching for opponent...' });

      return { statusCode: 200, body: 'In queue' };
    } catch (err: any) {
      console.error('[Matchmaking Error]', err);
      return { statusCode: 500, body: err.message };
    }
  }

  // 7. MATCHMAKING_LEAVE — cancel the queue
  if (action === 'MATCHMAKING_LEAVE') {
    try {
      await docClient.send(new DeleteCommand({ TableName: MATCHMAKING_TABLE, Key: { connectionId } }));
      return { statusCode: 200, body: 'Left queue' };
    } catch (err: any) {
      console.error('[Matchmaking Leave Error]', err);
      return { statusCode: 500, body: err.message };
    }
  }

  // 8. Relay Live Actions (CARD_MOVED, CARD_EXERTED, INK_PLAYED, LORE_UPDATED, QUEST, CHALLENGE, TURN, DICE, CHAT, etc.)
  if (
    action === 'CARD_MOVED' ||
    action === 'CARD_EXERTED' ||
    action === 'CARD_DRAWN' ||
    action === 'INK_PLAYED' ||
    action === 'LORE_UPDATED' ||
    action === 'QUEST_DONE' ||
    action === 'CHALLENGE_DONE' ||
    action === 'TURN_PASSED' ||
    action === 'DECK_SELECTED' ||
    action === 'CHAT_MESSAGE' ||
    action === 'DICE_CHOICE' ||
    action === 'DICE_ROLLED' ||
    action === 'DICE_REROLL' ||
    action === 'FIRST_PLAYER_CHOSEN' ||
    action === 'GAME_RESTART' ||
    action === 'PLAYER_RECONNECTED' ||
    action === 'REQUEST_STATE_SYNC' ||
    action === 'STATE_SYNC_RESPONSE' ||
    action === 'UNDO_REQUESTED' ||
    action === 'UNDO_RESOLVED' ||
    action === 'ACTION_PLAYED' ||
    action === 'ABILITY_TRIGGERED' ||
    action === 'sendAction' ||
    (body.roomId && action !== 'CREATE_ROOM' && action !== 'JOIN_ROOM' && action !== 'MATCHMAKING_JOIN' && action !== 'MATCHMAKING_LEAVE')
  ) {
    const roomId = body.roomId || '108249';
    try {
      const roomMembers = await getRoomMembers(roomId);
      // Relay to all connection IDs in room EXCEPT sender
      const resolvedAction = body.gameAction || body.realAction || body.type || body.action;
      const relayMessage = {
        ...body,
        action: resolvedAction,
        gameAction: resolvedAction,
        type: resolvedAction,
      };

      for (const member of roomMembers) {
        if (member.connectionId !== connectionId) {
          await sendMessageToConnection(apigwManagementApi, member.connectionId, relayMessage);
        }
      }
      return { statusCode: 200, body: 'Action Relayed' };
    } catch (err: any) {
      console.error('[Relay Action Error]', err);
      return { statusCode: 500, body: err.message };
    }
  }

  return { statusCode: 200, body: 'OK' };
};

// Helper: Query members of a room
async function getRoomMembers(roomId: string) {
  const res = await docClient.send(
    new QueryCommand({
      TableName: ROOM_TABLE,
      KeyConditionExpression: 'roomId = :rid',
      ExpressionAttributeValues: { ':rid': roomId },
    })
  );
  return res.Items || [];
}

// Helper: Send JSON to client via ApiGatewayManagementApi
async function sendMessageToConnection(apiClient: ApiGatewayManagementApiClient, connectionId: string, data: any) {
  try {
    await apiClient.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(data)),
      })
    );
  } catch (err: any) {
    if (err.$metadata && err.$metadata.httpStatusCode === 410) {
      console.log(`[Stale Connection] ${connectionId}`);
    } else {
      console.error(`[PostToConnection Failed] ${connectionId}`, err);
    }
  }
}
