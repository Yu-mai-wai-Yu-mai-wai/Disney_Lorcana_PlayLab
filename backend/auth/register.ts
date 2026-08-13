import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'UsersTable';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { username, email, password } = JSON.parse(event.body);

    if (!username || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username, email, and password are required' }),
      };
    }

    // Check if user already exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { username },
      })
    );

    if (existing.Item) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Username already exists' }),
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt,
    };

    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: newUser,
      })
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User registered successfully!',
        user: { username, email, createdAt },
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
