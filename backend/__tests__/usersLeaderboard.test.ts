import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { spawn, ChildProcess } from 'child_process';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';

// Boots the real server.ts and points the AWS SDK at an in-process fake of the DynamoDB JSON API
// (AWS_ENDPOINT_URL_DYNAMODB), so register/login/leaderboard run end to end without AWS.
// The fake implements only what these routes call: GetItem, PutItem (attribute_not_exists) and paged Scan.

type Item = Record<string, any>; // DynamoDB AttributeValue map, e.g. { username: { S: 'x' } }
const KEY: Record<string, string> = { UsersTable: 'username', LorcanaPlayerStats: 'userId' };
const SCAN_PAGE = 50; // smaller than the stats seeded below, so the leaderboard must follow LastEvaluatedKey
const tables: Record<string, Item[]> = {};
const hiddenFromGet = new Set<string>(); // simulates the register race: GetItem misses, PutItem collides
const failingTables = new Set<string>();

const keyOf = (table: string, item: Item) => item[KEY[table]]?.S;

function handle(target: string, body: any): [number, any] {
  const table: string = body.TableName;
  if (failingTables.has(table)) return [500, { __type: 'com.amazonaws.dynamodb.v20120810#InternalServerError', message: `secret internals of ${table}` }];
  const rows = (tables[table] ??= []);
  switch (target) {
    case 'GetItem': {
      const id = keyOf(table, body.Key);
      const found = rows.find((r) => keyOf(table, r) === id);
      return [200, found && !hiddenFromGet.has(id) ? { Item: found } : {}];
    }
    case 'PutItem': {
      const id = keyOf(table, body.Item);
      const idx = rows.findIndex((r) => keyOf(table, r) === id);
      if (idx >= 0 && /attribute_not_exists/.test(body.ConditionExpression || '')) {
        return [400, { __type: 'com.amazonaws.dynamodb.v20120810#ConditionalCheckFailedException', message: 'The conditional request failed' }];
      }
      if (idx >= 0) rows[idx] = body.Item;
      else rows.push(body.Item);
      return [200, {}];
    }
    case 'Scan': {
      const start = body.ExclusiveStartKey ? rows.findIndex((r) => keyOf(table, r) === keyOf(table, body.ExclusiveStartKey)) + 1 : 0;
      const size = Math.min(body.Limit ?? SCAN_PAGE, SCAN_PAGE);
      const Items = rows.slice(start, start + size);
      const more = start + size < rows.length;
      const last = Items[Items.length - 1];
      return [200, { Items, Count: Items.length, ...(more && last ? { LastEvaluatedKey: { [KEY[table]]: last[KEY[table]] } } : {}) }];
    }
    default:
      return [400, { __type: 'com.amazonaws.dynamodb.v20120810#UnknownOperationException', message: target }];
  }
}

const fakeDynamo = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    const target = String(req.headers['x-amz-target'] || '').split('.').pop() || '';
    const [status, payload] = handle(target, JSON.parse(raw || '{}'));
    res.writeHead(status, { 'Content-Type': 'application/x-amz-json-1.0' });
    res.end(JSON.stringify(payload));
  });
});

const SERVER_JWT = 'x'.repeat(48);
let server: ChildProcess;
let base: string;

beforeAll(async () => {
  await new Promise<void>((r) => fakeDynamo.listen(0, '127.0.0.1', r));
  const ddbPort = (fakeDynamo.address() as AddressInfo).port;
  const port = String(39900 + Math.floor(Math.random() * 90));
  const backendDir = path.resolve(__dirname, '..');
  server = spawn(process.execPath, [path.join(backendDir, 'node_modules/tsx/dist/cli.mjs'), path.join(backendDir, 'server.ts')], {
    cwd: os.tmpdir(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: port,
      JWT_SECRET: SERVER_JWT,
      ADMIN_PASSCODE: 'real-passcode-123',
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
      AWS_ENDPOINT_URL_DYNAMODB: `http://127.0.0.1:${ddbPort}`,
      CACHE_ENDPOINT: '',
      USERS_TABLE: 'UsersTable',
      PLAYER_STATS_TABLE: 'LorcanaPlayerStats',
    },
    stdio: 'ignore',
  });
  base = `http://127.0.0.1:${port}/api`;
  for (let i = 0; i < 60; i++) {
    if (await fetch(`${base}/health`).then((r) => r.ok, () => false)) break;
    await new Promise((r) => setTimeout(r, 250));
  }
}, 30000);

afterAll(() => {
  server?.kill();
  fakeDynamo.close();
});

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  hiddenFromGet.clear();
  failingTables.clear();
});

const post = (p: string, body: unknown) =>
  fetch(`${base}${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const register = (username: string) => post('/auth/register', { username, email: `${username}@test.dev`, password: 'secret123' });
const login = (username: string) => post('/auth/login', { username, password: 'secret123' });

describe('Accounts: role assignment and sign-up races', () => {
  it('TC-USER-01: any spelling of "admin" registers and logs in as a normal user', async () => {
    for (const name of ['admin', 'Admin', 'ADMIN']) {
      const reg = await register(name);
      expect(reg.status).toBe(201);
      expect((await reg.json()).user.role).toBe('user');

      const res = await login(name);
      expect(res.status).toBe(200);
      const { token, user } = await res.json();
      expect(user.role).toBe('user');
      expect((jwt.verify(token, SERVER_JWT) as any).role).toBe('user');
    }
  }, 20000);

  it('TC-USER-02: login keeps a stored admin role and defaults a missing role to user', async () => {
    const hash = await bcrypt.hash('secret123', 4);
    tables.UsersTable = [
      { username: { S: 'real_admin' }, email: { S: 'a@test.dev' }, password: { S: hash }, role: { S: 'admin' } },
      { username: { S: 'admin' }, email: { S: 'b@test.dev' }, password: { S: hash } }, // legacy item without role
    ];
    expect((await (await login('real_admin')).json()).user.role).toBe('admin');
    expect((await (await login('admin')).json()).user.role).toBe('user');
  });

  it('TC-USER-03: a duplicate that slips past the existence check is rejected by the conditional put', async () => {
    expect((await register('racer')).status).toBe(201);
    hiddenFromGet.add('racer'); // the second request's GetItem ran before the first request's PutItem
    const dup = await register('racer');
    expect(dup.status).toBe(409);
    expect(tables.UsersTable.filter((u) => u.username.S === 'racer')).toHaveLength(1);
  });

  it('TC-USER-04: database errors return a generic 500 without internal details', async () => {
    failingTables.add('UsersTable');
    const res = await register('someone');
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(JSON.parse(text).error).toBe('Internal Server Error');
    expect(text).not.toContain('secret internals');
  });
});

describe('Leaderboard reads every stats page', () => {
  it('TC-LEAD-06: a leader stored after the first scan pages is still ranked first', async () => {
    const row = (userId: string, wins: number, losses: number) => ({
      userId: { S: userId }, wins: { N: String(wins) }, losses: { N: String(losses) }, games: { N: String(wins + losses) },
    });
    tables.LorcanaPlayerStats = [
      ...Array.from({ length: 130 }, (_, i) => row(`player_${i}`, i % 7, 3)),
      { userId: { S: 'DEDUPE#match-1' }, matchId: { S: 'match-1' } },
      row('late_leader', 99, 1),
    ];

    const res = await fetch(`${base}/leaderboard`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('dynamodb');
    expect(body.count).toBe(25);
    expect(body.leaderboard[0]).toMatchObject({ rank: 1, userId: 'late_leader', wins: 99, winRate: 99 });
    expect(body.leaderboard.some((e: any) => e.userId.startsWith('DEDUPE#'))).toBe(false);
  });
});
