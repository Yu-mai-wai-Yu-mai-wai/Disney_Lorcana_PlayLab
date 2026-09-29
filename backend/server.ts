import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { analyzeDeck } from './shared/deckAnalysis';

dotenv.config();

// AWS & DynamoDB Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const sqsClient = new SQSClient({ region });

const USERS_TABLE = process.env.USERS_TABLE || 'UsersTable';
const DECKS_TABLE = process.env.DECKS_TABLE || 'DecksTable';
const ROOM_TABLE = process.env.ROOM_TABLE || 'LorcanaRoomStateV2';
const MATCHMAKING_TABLE = process.env.MATCHMAKING_TABLE || 'LorcanaMatchmaking';
const LORCANA_SQS_URL = process.env.LORCANA_SQS_URL || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// Fail closed: dev defaults are public in the repo, so production must supply real secrets
const missingSecrets = ['JWT_SECRET', 'ADMIN_PASSCODE'].filter((k) => !process.env[k]);
if (IS_PRODUCTION && missingSecrets.length) {
  console.error(`[FATAL] Missing required secrets in production: ${missingSecrets.join(', ')}`);
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-production';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'LORCANA_ADMIN_2026';
const PORT = process.env.PORT || 3001;

// DynamoDB TTL Helper (2 Hours)
const TTL_SECONDS = 2 * 60 * 60;
const withTtl = <T extends Record<string, any>>(item: T): T => ({
  ...item,
  ttl: Math.floor(Date.now() / 1000) + TTL_SECONDS,
});

// In-Memory Rate Limiter for Login Protection (OWASP Top 10)
interface RateLimitEntry {
  count: number;
  lastAttempt: number;
}
// ponytail: per-process map, so each cluster worker/instance counts separately (up to 5 x workers x instances tries); move to DynamoDB if lockout must be global
const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_PERIOD_MS = 5 * 60 * 1000;

// Initialize Express App
const app = express();
// Production serves SPA + API from the same ALB origin, so cross-origin access stays off
if (!IS_PRODUCTION) app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Request Logging Middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[HTTP ${req.method}] ${req.url}`);
  next();
});

// Helper: JWT Auth Middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    res.status(401).json({ error: 'Unauthorized — valid Bearer token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { username: string; email?: string; role?: string; exp?: number };
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
    return;
  }
}

// Helper: Require Admin Role Guard
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden — Administrator role required' });
    return;
  }
  next();
}

// Health Check Routes (For ALB & Monitoring)
const healthResponse = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'disney-lorcana-backend',
    nodeVersion: process.version,
  });
};

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// Router Definition (supports /auth, /decks, etc.)
const router = express.Router();

// 1. POST /auth/register
router.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    const trimmedUsername = String(username).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({ error: 'Invalid email address format' });
      return;
    }

    if (cleanPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    const existing = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { username: trimmedUsername },
      })
    );

    if (existing.Item) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    const createdAt = new Date().toISOString();
    const userRole = trimmedUsername.toLowerCase() === 'admin' ? 'admin' : 'user';
    const newUser = {
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      createdAt,
      role: userRole,
    };

    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: newUser,
      })
    );

    res.status(201).json({
      message: 'User registered successfully!',
      user: { username: trimmedUsername, email: trimmedEmail, role: userRole, createdAt },
    });
  } catch (error: any) {
    console.error('[Register Error]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 2. POST /auth/login
router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown_ip';

  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const rateKey = `${clientIp}:${username}`;
    const now = Date.now();
    const rateEntry = loginAttempts.get(rateKey);

    if (rateEntry && rateEntry.count >= MAX_FAILED_ATTEMPTS) {
      const elapsed = now - rateEntry.lastAttempt;
      if (elapsed < LOCKOUT_PERIOD_MS) {
        const waitSeconds = Math.ceil((LOCKOUT_PERIOD_MS - elapsed) / 1000);
        res.status(429).json({
          error: `Too many failed login attempts. Please try again in ${waitSeconds} seconds.`,
          retryAfter: waitSeconds,
        });
        return;
      } else {
        loginAttempts.delete(rateKey);
      }
    }

    const userRes = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { username },
      })
    );

    const user = userRes.Item;
    if (!user) {
      loginAttempts.set(rateKey, { count: (rateEntry?.count || 0) + 1, lastAttempt: now });
      await new Promise((r) => setTimeout(r, 150));
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      loginAttempts.set(rateKey, { count: (rateEntry?.count || 0) + 1, lastAttempt: now });
      await new Promise((r) => setTimeout(r, 150));
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    loginAttempts.delete(rateKey);

    const role = user.role || (user.username.toLowerCase() === 'admin' ? 'admin' : 'user');

    const token = jwt.sign(
      { username: user.username, email: user.email, role, iss: 'lorcana-playlab-auth' },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { username: user.username, email: user.email, role },
    });
  } catch (error: any) {
    console.error('[Login Error]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 3. POST /admin/verify-passcode
router.post('/admin/verify-passcode', (req: Request, res: Response): void => {
  const { passcode } = req.body;
  if (passcode && (String(passcode).trim() === ADMIN_PASSCODE)) {
    res.status(200).json({ valid: true, role: 'admin' });
    return;
  }
  res.status(401).json({ valid: false, error: 'Invalid admin passcode' });
});

// 4. POST /admin/elevate (Elevate authenticated user to Admin role)
router.post('/admin/elevate', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { passcode } = req.body;
    const authUser = (req as any).user;

    if (!passcode || (String(passcode).trim() !== ADMIN_PASSCODE)) {
      res.status(401).json({ success: false, error: 'Invalid admin passcode' });
      return;
    }

    if (authUser?.username) {
      await docClient.send(
        new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { username: authUser.username },
          UpdateExpression: 'SET #r = :role',
          ExpressionAttributeNames: { '#r': 'role' },
          ExpressionAttributeValues: { ':role': 'admin' },
        })
      ).catch((e) => console.warn('[Admin Elevate DB update non-fatal]', e.message));
    }

    const token = jwt.sign(
      { username: authUser.username, email: authUser.email, role: 'admin', iss: 'lorcana-playlab-auth' },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    res.status(200).json({
      success: true,
      message: 'Elevated to Administrator',
      role: 'admin',
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to elevate user' });
  }
});

// 5. GET /admin/billing (AWS Learner Lab Budget & Billing Telemetry)
router.get('/admin/billing', authenticateToken, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    data: {
      accountId: '953899323223',
      budgetTotal: 100.00,
      monthToDateSpend: 9.77,
      forecastSpend: 10.50,
      remainingBudget: 90.23,
      budgetUsagePercent: 9.77,
      currentHourlyBurnRate: 0.0000,
      cloudStatus: 'stopped',
      services: [
        { name: 'AWS Elastic Load Balancing (ALB)', category: 'Network', cost: 6.95, percentage: 71.1, status: 'Stopped ($0.00/hr)' },
        { name: 'Amazon Virtual Private Cloud (VPC / NAT / Endpoints)', category: 'Network', cost: 1.91, percentage: 19.5, status: 'Stopped ($0.00/hr)' },
        { name: 'Amazon EC2-Instances (t3.micro ASG Nodes)', category: 'Compute', cost: 0.42, percentage: 4.3, status: '0 Running ($0.00/hr)' },
        { name: 'Amazon EC2-Other (EBS gp3 Root Volumes)', category: 'Storage', cost: 0.30, percentage: 3.1, status: 'Idle ($0.00/hr)' },
        { name: 'Amazon CloudWatch (Metrics & Alarms)', category: 'Monitoring', cost: 0.19, percentage: 2.0, status: 'Active (Free Tier)' },
        { name: 'Amazon DynamoDB (Users, Decks, Rooms Tables)', category: 'Database', cost: 0.00, percentage: 0.0, status: 'Active (Pay-Per-Request)' },
        { name: 'Amazon Simple Queue Service (SQS Matchmaking)', category: 'Messaging', cost: 0.00, percentage: 0.0, status: 'Active (Free Tier)' },
      ],
      resourceTelemetry: {
        asgDesired: 0,
        asgCurrent: 0,
        albCount: 0,
        ec2Running: 0,
        dynamoTables: 3,
        sqsQueues: 1,
      },
      lastUpdated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
  });
});

// 3. POST /decks — Save/Update Deck
router.post('/decks', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.username;
    const { name, cards } = req.body;
    const deckId = `deck_${Date.now()}`;
    const updatedAt = new Date().toISOString();

    const analysis = analyzeDeck(cards || []);

    const item = {
      deckId,
      userId,
      name: name || 'Untitled Lorcana Deck',
      cards: cards || [],
      totalCards: Array.isArray(cards) ? cards.reduce((acc: number, c: any) => acc + (c.count || 1), 0) : 0,
      analysis,
      updatedAt,
    };

    await docClient.send(new PutCommand({ TableName: DECKS_TABLE, Item: item }));

    if (LORCANA_SQS_URL && item.cards.length > 0) {
      sqsClient
        .send(
          new SendMessageCommand({
            QueueUrl: LORCANA_SQS_URL,
            MessageBody: JSON.stringify({ deckId, userId, name: item.name, cards: item.cards }),
          })
        )
        .catch((e) => console.error('[SQS Queue Warn]', e.message));
    }

    res.status(201).json({
      message: 'Deck saved successfully to DynamoDB',
      deckId,
      deck: item,
    });
  } catch (err: any) {
    console.error('[Save Deck Error]', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 4. GET /decks — List User Decks
router.get('/decks', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.username;
    const queryRes = await docClient
      .send(
        new QueryCommand({
          TableName: DECKS_TABLE,
          IndexName: 'userId-index',
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': userId },
        })
      )
      .catch(async () => {
        return await docClient.send(
          new ScanCommand({
            TableName: DECKS_TABLE,
            FilterExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': userId },
          })
        );
      });

    res.status(200).json({ decks: queryRes.Items || [] });
  } catch (err: any) {
    console.error('[Get Decks Error]', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 5. DELETE /decks/:deckId — Delete Deck
router.delete('/decks/:deckId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.username;
    const { deckId } = req.params;

    await docClient.send(
      new DeleteCommand({
        TableName: DECKS_TABLE,
        Key: { deckId, userId },
      })
    );

    res.status(200).json({ message: 'Deck deleted successfully' });
  } catch (err: any) {
    console.error('[Delete Deck Error]', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 6. POST /decks/:deckId/analyze
router.post('/decks/:deckId/analyze', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.username;
    const { deckId } = req.params;

    const deckRes = await docClient.send(new GetCommand({ TableName: DECKS_TABLE, Key: { deckId, userId } }));
    if (!deckRes.Item) {
      res.status(404).json({ error: 'Deck not found' });
      return;
    }

    const analysis = analyzeDeck(deckRes.Item.cards || []);
    await docClient.send(
      new UpdateCommand({
        TableName: DECKS_TABLE,
        Key: { deckId, userId },
        UpdateExpression: 'SET analysis = :analysis',
        ExpressionAttributeValues: { ':analysis': analysis },
      })
    );

    res.status(202).json({
      status: 'analyzed',
      message: 'Analysis calculated successfully',
      analysis,
    });
  } catch (err: any) {
    console.error('[Analyze Deck Error]', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 7. GET /decks/:deckId/analysis
router.get('/decks/:deckId/analysis', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.username;
    const { deckId } = req.params;

    const deckRes = await docClient.send(new GetCommand({ TableName: DECKS_TABLE, Key: { deckId, userId } }));
    if (!deckRes.Item) {
      res.status(404).json({ error: 'Deck not found' });
      return;
    }

    res.status(200).json({ analysis: deckRes.Item.analysis || null });
  } catch (err: any) {
    console.error('[Get Analysis Error]', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 8. Playmat preference, stored on the user item so it follows the account across devices
const PLAYMAT_ID_RE = /^[a-z0-9-]{1,64}$/;

router.get('/users/me/playmat', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const username = (req as any).user.username;
    const userRes = await docClient.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { username }, ProjectionExpression: 'playmatId' })
    );
    res.status(200).json({ playmatId: userRes.Item?.playmatId ?? null });
  } catch (err: any) {
    console.error('[Get Playmat Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/users/me/playmat', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { playmatId } = req.body || {};
  if (typeof playmatId !== 'string' || !PLAYMAT_ID_RE.test(playmatId)) {
    res.status(400).json({ error: 'playmatId must be 1-64 chars of a-z, 0-9 or -' });
    return;
  }
  try {
    const username = (req as any).user.username;
    await docClient.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { username },
        UpdateExpression: 'SET playmatId = :p',
        ConditionExpression: 'attribute_exists(username)', // never create a user item from a token alone
        ExpressionAttributeValues: { ':p': playmatId },
      })
    );
    res.status(200).json({ playmatId });
  } catch (err: any) {
    if (err?.name === 'ConditionalCheckFailedException') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    console.error('[Save Playmat Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Mount router on both root and /api
app.use('/', router);
app.use('/api', router);

// WebSocket Server & Real-Time Room Controller
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Active socket map: connectionId -> WebSocket
interface SocketClientInfo {
  ws: WebSocket;
  connectionId: string;
  roomId?: string;
  username?: string;
  role?: string;
}
// ponytail: in-memory WS state only works on one instance; kept for local dev (`npm run dev` -> /ws).
// Production realtime runs on API Gateway WebSocket + Lambda (backend/serverless/room). Delete once local dev points at the WS API too.
const clients = new Map<string, SocketClientInfo>();
const roomGameStates = new Map<string, any>();

function sendToClient(connectionId: string, data: any) {
  const client = clients.get(connectionId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(data));
  }
}

async function broadcastToRoom(roomId: string, data: any, excludeConnId?: string) {
  // 1. Instant zero-latency in-memory relay (<1ms)
  for (const [cId, client] of clients.entries()) {
    if (client.roomId === roomId && cId !== excludeConnId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(data));
      } catch (e) {
        console.error('[Memory Broadcast Error]', e);
      }
    }
  }

  // 2. DynamoDB persistence & cross-session fallback
  try {
    const res = await docClient.send(
      new QueryCommand({
        TableName: ROOM_TABLE,
        KeyConditionExpression: 'roomId = :rid',
        ExpressionAttributeValues: { ':rid': roomId },
      })
    );
    const members = res.Items || [];
    for (const member of members) {
      if (member.connectionId !== excludeConnId && member.status !== 'disconnected') {
        const client = clients.get(member.connectionId);
        if (client && client.roomId !== roomId) {
          client.roomId = roomId;
          sendToClient(member.connectionId, data);
        }
      }
    }
  } catch (err) {
    console.error('[Broadcast Error]', err);
  }
}

wss.on('connection', (ws: WebSocket) => {
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  clients.set(connectionId, { ws, connectionId });
  console.log(`[WebSocket Connected] ${connectionId} (Total: ${clients.size})`);

  ws.on('message', async (message: string) => {
    try {
      const rawText = message.toString();
      const body = JSON.parse(rawText);
      const action = body.gameAction || body.realAction || body.type || body.action;

      // Handle heartbeat ping immediately
      if (action === 'PING' || body.type === 'PING') {
        sendToClient(connectionId, { action: 'PONG', type: 'PONG' });
        return;
      }

      // Auto-bind client state whenever a message has roomId/username/role
      const clientInfo = clients.get(connectionId);
      if (clientInfo) {
        if (body.roomId) clientInfo.roomId = body.roomId;
        if (body.username) clientInfo.username = body.username;
        if (body.role) clientInfo.role = body.role;
      }

      console.log(`[WebSocket Msg] ${connectionId} -> action: ${action}`);

      if (action === 'CREATE_ROOM') {
        const username = body.username || `Player_${connectionId.substring(0, 4)}`;
        const deckId = body.deckId || '';
        const deckName = body.deckName || 'Untitled Deck';

        let roomId = '';
        for (let attempts = 0; attempts < 10; attempts++) {
          const candidate = String(Math.floor(100000 + Math.random() * 900000));
          const existing = await docClient.send(
            new QueryCommand({
              TableName: ROOM_TABLE,
              KeyConditionExpression: 'roomId = :rid',
              ExpressionAttributeValues: { ':rid': candidate },
            })
          );
          if (!existing.Items || existing.Items.length === 0) {
            roomId = candidate;
            break;
          }
        }

        if (!roomId) {
          sendToClient(connectionId, { action: 'ERROR', message: 'Could not allocate room code' });
          return;
        }

        const hostItem = withTtl({
          roomId,
          connectionId,
          username,
          role: 'player1',
          deckId,
          deckName,
          status: 'active',
          joinedAt: new Date().toISOString(),
        });

        await docClient.send(new PutCommand({ TableName: ROOM_TABLE, Item: hostItem }));

        const clientInfo = clients.get(connectionId);
        if (clientInfo) {
          clientInfo.roomId = roomId;
          clientInfo.username = username;
          clientInfo.role = 'player1';
        }

        sendToClient(connectionId, {
          action: 'ROOM_CREATED',
          gameAction: 'ROOM_CREATED',
          roomId,
          role: 'player1',
          username,
          deckId,
          deckName,
        });
      }
      else if (action === 'JOIN_ROOM') {
        const roomId = body.roomId;
        const username = body.username || `Player_${connectionId.substring(0, 4)}`;
        const deckId = body.deckId || '';
        const deckName = body.deckName || 'Untitled Deck';

        if (!roomId) {
          sendToClient(connectionId, { action: 'ERROR', message: 'Room ID is required' });
          return;
        }

        const roomRes = await docClient.send(
          new QueryCommand({
            TableName: ROOM_TABLE,
            KeyConditionExpression: 'roomId = :rid',
            ExpressionAttributeValues: { ':rid': roomId },
          })
        );

        const roomMembers = (roomRes.Items || []).filter((m) => m.status !== 'disconnected');

        if (roomMembers.length === 0) {
          sendToClient(connectionId, { action: 'ERROR', message: 'Room not found. Please verify the 6-digit code.' });
          return;
        }

        if (roomMembers.length >= 2) {
          sendToClient(connectionId, { action: 'ERROR', message: 'Room is full (Maximum 2 players).' });
          return;
        }

        const host = roomMembers[0];
        if (host.connectionId === connectionId || host.username.toLowerCase() === username.toLowerCase()) {
          sendToClient(connectionId, {
            action: 'ERROR',
            message: 'Cannot join your own room with the same account. Please use a different user account.',
          });
          return;
        }

        const role = 'player2';
        const newItem = withTtl({
          roomId,
          connectionId,
          username,
          role,
          deckId,
          deckName,
          status: 'active',
          joinedAt: new Date().toISOString(),
        });

        await docClient.send(new PutCommand({ TableName: ROOM_TABLE, Item: newItem }));

        const clientInfo = clients.get(connectionId);
        if (clientInfo) {
          clientInfo.roomId = roomId;
          clientInfo.username = username;
          clientInfo.role = role;
        }

        const allMembers = [...roomMembers, newItem];

        for (const member of allMembers) {
          sendToClient(member.connectionId, {
            action: 'ROOM_STATE',
            gameAction: 'ROOM_STATE',
            roomId,
            role: member.role,
            username: member.username,
            players: allMembers.map((m) => ({
              connectionId: m.connectionId,
              username: m.username,
              role: m.role,
              deckId: m.deckId,
              deckName: m.deckName,
            })),
          });
        }

        for (const member of allMembers) {
          sendToClient(member.connectionId, {
            action: 'GAME_START',
            gameAction: 'GAME_START',
            roomId,
            role: member.role,
            username: member.username,
            players: allMembers.map((m) => ({
              username: m.username,
              role: m.role,
              deckId: m.deckId,
              deckName: m.deckName,
            })),
          });
        }
      }
      else if (action === 'MATCHMAKING_JOIN') {
        const username = body.username || `Player_${connectionId.substring(0, 4)}`;
        const deckId = body.deckId || '';
        const deckName = body.deckName || 'Untitled Deck';

        const waitingRes = await docClient.send(
          new ScanCommand({
            TableName: MATCHMAKING_TABLE,
            FilterExpression: '#st = :s',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':s': 'waiting' },
          })
        );

        const candidates = (waitingRes.Items || []).filter(
          (item) => item.connectionId !== connectionId && item.username.toLowerCase() !== username.toLowerCase()
        );

        if (candidates.length > 0) {
          const opponent = candidates[0];
          await docClient.send(new DeleteCommand({ TableName: MATCHMAKING_TABLE, Key: { connectionId: opponent.connectionId } }));
          await docClient.send(new DeleteCommand({ TableName: MATCHMAKING_TABLE, Key: { connectionId } })).catch(() => {});

          const roomId = String(Math.floor(100000 + Math.random() * 900000));
          const p1 = withTtl({ roomId, connectionId: opponent.connectionId, username: opponent.username, role: 'player1', deckId: opponent.deckId, deckName: opponent.deckName, joinedAt: new Date().toISOString() });
          const p2 = withTtl({ roomId, connectionId, username, role: 'player2', deckId, deckName, joinedAt: new Date().toISOString() });

          await docClient.send(new PutCommand({ TableName: ROOM_TABLE, Item: p1 }));
          await docClient.send(new PutCommand({ TableName: ROOM_TABLE, Item: p2 }));

          const c1 = clients.get(opponent.connectionId);
          if (c1) { c1.roomId = roomId; c1.role = 'player1'; c1.username = opponent.username; }
          const c2 = clients.get(connectionId);
          if (c2) { c2.roomId = roomId; c2.role = 'player2'; c2.username = username; }

          const players = [p1, p2].map((m) => ({ username: m.username, role: m.role, deckId: m.deckId, deckName: m.deckName }));
          sendToClient(opponent.connectionId, { action: 'MATCH_FOUND', gameAction: 'MATCH_FOUND', roomId, role: 'player1', username: opponent.username, players });
          sendToClient(connectionId, { action: 'MATCH_FOUND', gameAction: 'MATCH_FOUND', roomId, role: 'player2', username, players });
        } else {
          await docClient.send(
            new PutCommand({
              TableName: MATCHMAKING_TABLE,
              Item: withTtl({ connectionId, username, deckId, deckName, status: 'waiting', queuedAt: new Date().toISOString() }),
            })
          );
          sendToClient(connectionId, { action: 'WAITING', message: 'Searching for opponent...' });
        }
      }
      else if (action === 'MATCHMAKING_LEAVE') {
        await docClient.send(new DeleteCommand({ TableName: MATCHMAKING_TABLE, Key: { connectionId } })).catch(() => {});
        sendToClient(connectionId, { action: 'MATCHMAKING_LEFT', message: 'Left matchmaking queue' });
      }
      else if (action === 'LEAVE_ROOM') {
        const roomId = body.roomId;
        if (roomId) {
          await docClient.send(new DeleteCommand({ TableName: ROOM_TABLE, Key: { roomId, connectionId } })).catch(() => {});
          await broadcastToRoom(
            roomId,
            {
              action: 'OPPONENT_LEFT',
              gameAction: 'OPPONENT_LEFT',
              roomId,
              username: body.username,
              role: body.role,
            },
            connectionId
          );
        }
      }
      else if (action === 'REJOIN_ROOM') {
        const roomId = body.roomId;
        const username = body.username;
        const role = body.role;

        const res = await docClient.send(
          new QueryCommand({
            TableName: ROOM_TABLE,
            KeyConditionExpression: 'roomId = :rid',
            ExpressionAttributeValues: { ':rid': roomId },
          })
        );

        const existing: any = (res.Items || []).find((m: any) => m.username === username || m.role === role);
        if (existing) {
          await docClient.send(new DeleteCommand({ TableName: ROOM_TABLE, Key: { roomId, connectionId: existing.connectionId } })).catch(() => {});
          const updated: any = withTtl({ ...existing, connectionId, status: 'active', rejoinedAt: new Date().toISOString() });
          await docClient.send(new PutCommand({ TableName: ROOM_TABLE, Item: updated }));

          const clientInfo = clients.get(connectionId);
          if (clientInfo) {
            clientInfo.roomId = roomId;
            clientInfo.username = updated.username;
            clientInfo.role = updated.role;
          }

          sendToClient(connectionId, {
            action: 'PLAYER_RECONNECTED',
            gameAction: 'PLAYER_RECONNECTED',
            roomId,
            role: updated.role,
            username: updated.username,
            deckId: updated.deckId,
            deckName: updated.deckName,
            isSelf: true,
          });

          // Deliver cached board state immediately upon rejoin without waiting for peer
          const cached = roomGameStates.get(roomId);
          if (cached) {
            sendToClient(connectionId, {
              action: 'STATE_SYNC_RESPONSE',
              gameAction: 'STATE_SYNC_RESPONSE',
              roomId,
              payload: cached,
            });
          }

          await broadcastToRoom(
            roomId,
            {
              action: 'PLAYER_RECONNECTED',
              gameAction: 'PLAYER_RECONNECTED',
              roomId,
              role: updated.role,
              username: updated.username,
              isSelf: false,
            },
            connectionId
          );
        }
      }
      else if (body.roomId) {
        const roomId = body.roomId;
        const resolvedAction = body.gameAction || body.realAction || body.type || body.action;
        const relayMsg = {
          ...body,
          action: resolvedAction,
          gameAction: resolvedAction,
          type: resolvedAction,
        };

        // Cache latest match state for instantaneous Rejoin delivery
        if (resolvedAction === 'STATE_SYNC_RESPONSE' && body.payload) {
          roomGameStates.set(roomId, body.payload);
        } else if (resolvedAction === 'TURN_PASSED') {
          const prev = roomGameStates.get(roomId) || {};
          roomGameStates.set(roomId, {
            ...prev,
            turnNumber: body.turnNumber || body.payload?.turnNumber || ((prev.turnNumber || 1) + 1),
            isTurnP1: body.role !== 'player1',
          });
        }

        await broadcastToRoom(roomId, relayMsg, connectionId);
      }
    } catch (err: any) {
      console.error('[WebSocket Processing Error]', err);
    }
  });

  ws.on('close', async () => {
    const clientInfo = clients.get(connectionId);
    clients.delete(connectionId);
    console.log(`[WebSocket Closed] ${connectionId} (Remaining: ${clients.size})`);

    await docClient.send(new DeleteCommand({ TableName: MATCHMAKING_TABLE, Key: { connectionId } })).catch(() => {});

    if (clientInfo && clientInfo.roomId) {
      const roomId = clientInfo.roomId;
      await docClient.send(
        new UpdateCommand({
          TableName: ROOM_TABLE,
          Key: { roomId, connectionId },
          UpdateExpression: 'SET #st = :s, disconnectedAt = :d',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: { ':s': 'disconnected', ':d': new Date().toISOString() },
        })
      ).catch(() => {});

      await broadcastToRoom(
        roomId,
        {
          action: 'OPPONENT_DISCONNECTED',
          gameAction: 'OPPONENT_DISCONNECTED',
          roomId,
          username: clientInfo.username,
          role: clientInfo.role,
        },
        connectionId
      );
    }
  });
});

server.listen(PORT, () => {
  console.log('=======================================================');
  console.log(`🚀 Disney Lorcana Backend Server Running on Port ${PORT}`);
  console.log(`📡 REST API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`🛡️  DynamoDB Region: ${region}`);
  console.log('=======================================================');
});

export { app, server };
