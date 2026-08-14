import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ROOM_TABLE = process.env.ROOM_TABLE || 'LorcanaRoomState';
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

        // Delete from table
        await docClient.send(
          new DeleteCommand({
            TableName: ROOM_TABLE,
            Key: { roomId, connectionId },
          })
        );

        // Notify remaining room members
        const roomMembers = await getRoomMembers(roomId);
        for (const member of roomMembers) {
          if (member.connectionId !== connectionId) {
            await sendMessageToConnection(apigwManagementApi, member.connectionId, {
              action: 'OPPONENT_DISCONNECTED',
              roomId,
              username: userItem.username,
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

  const action = body.action || routeKey;

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
      action: 'ROOM_CREATED', roomId, role: 'player1', username, deckId, deckName,
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
      if (roomMembers.length >= 2) {
        await sendMessageToConnection(apigwManagementApi, connectionId, { action: 'ERROR', message: 'Room is full' });
        return { statusCode: 200, body: 'Room full' };
      }
      const role = roomMembers.length === 0 ? 'player1' : 'player2';

      const newItem = { roomId, connectionId, username, role, deckId, deckName, joinedAt: new Date().toISOString() };
      await docClient.send(new PutCommand({ TableName: ROOM_TABLE, Item: newItem }));

      const updatedMembers = [...roomMembers, newItem];

      // Broadcast updated room state to all members
      for (const member of updatedMembers) {
        await sendMessageToConnection(apigwManagementApi, member.connectionId, {
          action: 'ROOM_STATE',
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
            action: 'GAME_START', roomId,
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
      // Look for a waiting opponent (scan for status=waiting, limit 1)
      const waiting = await docClient.send(
        new ScanCommand({
          TableName: MATCHMAKING_TABLE,
          FilterExpression: '#st = :s',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: { ':s': 'waiting' },
          Limit: 1,
        })
      );

      if (waiting.Items && waiting.Items.length > 0) {
        const opponent = waiting.Items[0];
        // Clean up opponent's queue entry
        await docClient.send(new DeleteCommand({
          TableName: MATCHMAKING_TABLE,
          Key: { connectionId: opponent.connectionId },
        }));

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
        await sendMessageToConnection(apigwManagementApi, opponent.connectionId, { action: 'MATCH_FOUND', roomId, players });
        await sendMessageToConnection(apigwManagementApi, connectionId, { action: 'MATCH_FOUND', roomId, players });

        return { statusCode: 200, body: JSON.stringify({ roomId }) };
      }

      // No opponent yet → enter queue
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

  // 8. Relay Live Actions (CARD_MOVED, CARD_EXERTED, INK_PLAYED, LORE_UPDATED, QUEST, CHALLENGE, TURN)
  if (
    action === 'CARD_MOVED' ||
    action === 'CARD_EXERTED' ||
    action === 'INK_PLAYED' ||
    action === 'LORE_UPDATED' ||
    action === 'QUEST_DONE' ||
    action === 'CHALLENGE_DONE' ||
    action === 'TURN_PASSED' ||
    action === 'DECK_SELECTED' ||
    action === 'sendAction'
  ) {
    const roomId = body.roomId || '108249';
    try {
      const roomMembers = await getRoomMembers(roomId);
      // Relay to all connection IDs in room EXCEPT sender
      for (const member of roomMembers) {
        if (member.connectionId !== connectionId) {
          await sendMessageToConnection(apigwManagementApi, member.connectionId, body);
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
