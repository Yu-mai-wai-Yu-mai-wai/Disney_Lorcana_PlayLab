import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'UsersTable';

// Dynamic CORS & Security Headers Resolver
const ALLOWED_ORIGIN_ENV = process.env.ALLOWED_ORIGIN || '';
const ALLOWED_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
  /^https:\/\/yu-mai-wai-yu-mai-wai\.github\.io$/,
];

function getSecurityHeaders(eventHeaders: Record<string, string | undefined> = {}) {
  const origin = eventHeaders.origin || eventHeaders.Origin || '';
  let matchedOrigin = 'https://yu-mai-wai-yu-mai-wai.github.io';

  if (ALLOWED_ORIGIN_ENV && origin === ALLOWED_ORIGIN_ENV) {
    matchedOrigin = origin;
  } else if (ALLOWED_PATTERNS.some((pattern) => pattern.test(origin))) {
    matchedOrigin = origin;
  } else if (origin === '') {
    matchedOrigin = '*';
  }

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': matchedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headersMap = event.headers || {};
  const headers = getSecurityHeaders(headersMap);

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

    // Input Validation & Sanitization
    const trimmedUsername = String(username).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username must be between 3 and 30 characters' }),
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email address format' }),
      };
    }

    if (cleanPassword.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 6 characters long' }),
      };
    }

    // Check if user already exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { username: trimmedUsername },
      })
    );

    if (existing.Item) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Username already exists' }),
      };
    }

    // Hash password with 10 salt rounds
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    const createdAt = new Date().toISOString();

    const newUser = {
      username: trimmedUsername,
      email: trimmedEmail,
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
        user: { username: trimmedUsername, email: trimmedEmail, createdAt },
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
