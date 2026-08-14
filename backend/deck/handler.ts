import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import jwt from 'jsonwebtoken';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const sqsClient = new SQSClient({});

const DECKS_TABLE = process.env.DECKS_TABLE || 'DecksTable';
const JWT_SECRET = process.env.JWT_SECRET || 'disney_lorcana_secret_key_2026';
const LORCANA_SQS_URL = process.env.LORCANA_SQS_URL;

function verifyToken(authHeader?: string): { username: string, exp?: number } | null {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string, exp?: number };
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }
    return decoded;
  } catch (err) {
    return null;
  }
}

export const handler = async (event: any): Promise<APIGatewayProxyResult> => {
  console.log('[DECK EVENT]', JSON.stringify(event));
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE',
  };

  // Support BOTH payload v1 (event.httpMethod) and v2 (event.requestContext.http.method)
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || '';
  const rawBody = event.body || '';
  const body = event.isBase64Encoded ? Buffer.from(rawBody, 'base64').toString('utf-8') : rawBody;
  const headersMap = event.headers || {};
  // resourcePath = path WITHOUT stage prefix — lives in requestContext for v1
  const path = event.resourcePath || event.requestContext?.resourcePath || event.rawPath || event.path || '';
  const pathParams = event.pathParameters || {};

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const authUser = verifyToken(headersMap.Authorization || headersMap.authorization);
  const userId = authUser ? authUser.username : 'anonymous_guest';

  try {
    // POST /decks/{deckId}/analyze
    if (httpMethod === 'POST' && path.match(/^\/decks\/[^/]+\/analyze$/)) {
      const deckId = pathParams.deckId || path.split('/')[2];
      if (!deckId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'deckId required' }) };

      const res = await docClient.send(new GetCommand({ TableName: DECKS_TABLE, Key: { deckId, userId } }));
      if (!res.Item) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Deck not found' }) };
      }

      if (!LORCANA_SQS_URL) {
        return { statusCode: 202, headers, body: JSON.stringify({ status: 'queued', message: 'SQS_URL not set, mocking queue success' }) };
      }

      await sqsClient.send(new SendMessageCommand({
        QueueUrl: LORCANA_SQS_URL,
        MessageBody: JSON.stringify({ deckId, userId, name: res.Item.name, cards: res.Item.cards }),
      }));

      return { statusCode: 202, headers, body: JSON.stringify({ status: 'queued', message: 'Analysis queued successfully' }) };
    }

    // GET /decks/{deckId}/analysis
    if (httpMethod === 'GET' && path.match(/^\/decks\/[^/]+\/analysis$/)) {
      const deckId = pathParams.deckId || path.split('/')[2];
      if (!deckId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'deckId required' }) };

      const res = await docClient.send(new GetCommand({ TableName: DECKS_TABLE, Key: { deckId, userId } }));
      if (!res.Item) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Deck not found' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ analysis: res.Item.analysis || null }) };
    }

    // 1. POST /decks — Save/Update Deck
    if (httpMethod === 'POST' && (path === '/decks' || path === '/decks/')) {
      if (!body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body required' }) };
      }
      const { name, cards } = JSON.parse(body);
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

      if (LORCANA_SQS_URL && item.cards.length > 0) {
        try {
          await sqsClient.send(new SendMessageCommand({
            QueueUrl: LORCANA_SQS_URL,
            MessageBody: JSON.stringify({ deckId, userId, name: item.name, cards: item.cards }),
          }));
        } catch (e) {
          console.error("Auto-queue failed", e);
        }
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: 'Deck saved successfully to DynamoDB', deckId, deck: item }),
      };
    }

    // 2. GET /decks — List User Decks
    if (httpMethod === 'GET' && (path === '/decks' || path === '/decks/')) {
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
    if (httpMethod === 'DELETE' && path.match(/^\/decks\/[^/]+$/)) {
      const deckId = pathParams.deckId || path.split('/')[2];
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
