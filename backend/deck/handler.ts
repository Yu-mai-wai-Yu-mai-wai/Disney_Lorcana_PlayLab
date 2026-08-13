import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import jwt from 'jsonwebtoken';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const DECKS_TABLE = process.env.DECKS_TABLE || 'DecksTable';
const JWT_SECRET = process.env.JWT_SECRET || 'disney_lorcana_secret_key_2026';

function verifyToken(authHeader?: string): { username: string } | null {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string };
  } catch (err) {
    return null;
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const authUser = verifyToken(event.headers.Authorization || event.headers.authorization);
  const userId = authUser ? authUser.username : 'anonymous_guest';

  try {
    // 1. POST /decks — Save/Update Deck
    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body required' }) };
      }
      const { name, cards } = JSON.parse(event.body);
      const deckId = `deck_${Date.now()}`;
      const updatedAt = new Date().toISOString();

      const item = {
        deckId,
        userId,
        name: name || 'Untitled Lorcana Deck',
        cards: cards || [],
        totalCards: Array.isArray(cards) ? cards.reduce((acc: number, c: any) => acc + (c.count || 1), 0) : 0,
        updatedAt,
      };

      await docClient.send(new PutCommand({ TableName: DECKS_TABLE, Item: item }));

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: 'Deck saved successfully to DynamoDB', deckId, deck: item }),
      };
    }

    // 2. GET /decks — List User Decks
    if (event.httpMethod === 'GET') {
      const res = await docClient.send(
        new QueryCommand({
          TableName: DECKS_TABLE,
          IndexName: 'userId-index',
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': userId },
        })
      ).catch(async () => {
        // Fallback scan if GSI is not created yet
        return await docClient.send(
          new ScanCommand({
            TableName: DECKS_TABLE,
            FilterExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': userId },
          })
        );
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ decks: res.Items || [] }),
      };
    }

    // 3. DELETE /decks/{deckId} — Delete Deck
    if (event.httpMethod === 'DELETE') {
      const deckId = event.pathParameters?.deckId;
      if (!deckId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'deckId param missing' }) };
      }

      await docClient.send(
        new DeleteCommand({
          TableName: DECKS_TABLE,
          Key: { deckId, userId },
        })
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Deck deleted successfully' }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
