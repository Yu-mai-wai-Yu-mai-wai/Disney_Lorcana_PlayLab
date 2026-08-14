import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ROOM_TABLE = process.env.ROOM_TABLE || 'LorcanaRoomState';

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

  // 3. JOIN_ROOM Action
  if (action === 'JOIN_ROOM') {
    const roomId = body.roomId || '108249';
    const username = body.username || `Player_${connectionId.substring(0, 4)}`;

    try {
      const roomMembers = await getRoomMembers(roomId);
      const role = roomMembers.length === 0 ? 'player1' : 'player2';

      // Save connection to DynamoDB
      const newItem = {
        roomId,
        connectionId,
        username,
        role,
        joinedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: ROOM_TABLE,
          Item: newItem,
        })
      );

      const updatedMembers = [...roomMembers, newItem];

      // Broadcast updated room state to all members in room
      for (const member of updatedMembers) {
        await sendMessageToConnection(apigwManagementApi, member.connectionId, {
          action: 'ROOM_STATE',
          roomId,
          role: member.role,
          username: member.username,
          players: updatedMembers.map((m) => ({
            connectionId: m.connectionId,
            username: m.username,
            role: m.role,
          })),
        });
      }

      return { statusCode: 200, body: 'Joined Room' };
    } catch (err: any) {
      console.error('[Join Room Error]', err);
      return { statusCode: 500, body: err.message };
    }
  }

  // 4. Relay Live Actions (CARD_MOVED, CARD_EXERTED, INK_PLAYED, LORE_UPDATED, QUEST, CHALLENGE, TURN)
  if (
    action === 'CARD_MOVED' ||
    action === 'CARD_EXERTED' ||
    action === 'INK_PLAYED' ||
    action === 'LORE_UPDATED' ||
    action === 'QUEST_DONE' ||
    action === 'CHALLENGE_DONE' ||
    action === 'TURN_PASSED' ||
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
