import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'UsersTable';
const JWT_SECRET = process.env.JWT_SECRET || 'lorcana_jwt_secure_prod_2026_9b8f2d87e3a14c62b5d4e8a1c9e7f302';

// 1. Rate Limiting Cache (In-Memory per Lambda Container)
interface RateLimitEntry {
  count: number;
  lastAttempt: number;
}
const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

// 2. Dynamic CORS & Security Headers Resolver
const ALLOWED_ORIGIN_ENV = process.env.ALLOWED_ORIGIN || '';
const ALLOWED_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
  /^https:\/\/yu-mai-wai-yu-mai-wai\.github\.io$/,
];

function getSecurityHeaders(eventHeaders: Record<string, string | undefined> = {}) {
  const origin = eventHeaders.origin || eventHeaders.Origin || '';
  let matchedOrigin = 'https://yu-mai-wai-yu-mai-wai.github.io'; // Safe default

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

  const clientIp = event.requestContext?.identity?.sourceIp || 'unknown_ip';

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username and password are required' }),
      };
    }

    const rateKey = `${clientIp}:${username}`;
    const now = Date.now();
    const rateEntry = loginAttempts.get(rateKey);

    // Check rate limit
    if (rateEntry && rateEntry.count >= MAX_FAILED_ATTEMPTS) {
      const elapsed = now - rateEntry.lastAttempt;
      if (elapsed < LOCKOUT_PERIOD_MS) {
        const waitSeconds = Math.ceil((LOCKOUT_PERIOD_MS - elapsed) / 1000);
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            error: `Too many failed login attempts. Please try again in ${waitSeconds} seconds.`,
            retryAfter: waitSeconds,
          }),
        };
      } else {
        // Reset after lockout expired
        loginAttempts.delete(rateKey);
      }
    }

    const res = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { username },
      })
    );

    const user = res.Item;

    if (!user) {
      // Record failed attempt
      loginAttempts.set(rateKey, {
        count: (rateEntry?.count || 0) + 1,
        lastAttempt: now,
      });
      // Timing attack mitigation
      await new Promise((r) => setTimeout(r, 150));
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid username or password' }),
      };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Record failed attempt
      loginAttempts.set(rateKey, {
        count: (rateEntry?.count || 0) + 1,
        lastAttempt: now,
      });
      // Timing attack mitigation
      await new Promise((r) => setTimeout(r, 150));
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid username or password' }),
      };
    }

    // Reset failed attempts on success
    loginAttempts.delete(rateKey);

    const token = jwt.sign(
      {
        username: user.username,
        email: user.email,
        iss: 'lorcana-playlab-auth',
      },
      JWT_SECRET,
      { expiresIn: '2h', algorithm: 'HS256' }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        token,
        user: { username: user.username, email: user.email },
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
