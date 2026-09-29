import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { spawn, ChildProcess } from 'child_process';
import os from 'os';
import path from 'path';

const SERVER_JWT = 'x'.repeat(48);

describe('Decoupling & Match Recording QA Suite (T04)', () => {
  let serverProcess: ChildProcess;
  let baseUrl: string;

  beforeAll(async () => {
    const port = String(39100 + Math.floor(Math.random() * 800));
    const backendDir = path.resolve(__dirname, '..');
    serverProcess = spawn(
      process.execPath,
      [path.join(backendDir, 'node_modules/tsx/dist/cli.mjs'), path.join(backendDir, 'server.ts')],
      {
        cwd: os.tmpdir(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: port,
          JWT_SECRET: SERVER_JWT,
          ADMIN_PASSCODE: 'real-passcode-123',
        },
        stdio: 'ignore',
      }
    );
    baseUrl = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 40; i++) {
      if (await fetch(`${baseUrl}/health`).then((r) => r.ok, () => false)) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  }, 20000);

  afterAll(() => {
    if (serverProcess) serverProcess.kill();
  });

  const createToken = (username: string) =>
    jwt.sign({ username }, SERVER_JWT, { algorithm: 'HS256', expiresIn: '5m' });

  it('TC-MATCH-01: POST /api/matches without JWT returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: 'room123-1727610000',
        winner: 'player1',
        loser: 'player2',
        winnerLore: 20,
        loserLore: 12,
      }),
    });
    expect(res.status).toBe(401);
  });

  it('TC-MATCH-02: POST /api/matches with invalid or missing body fields returns 400 Bad Request', async () => {
    const token = createToken('player1');
    const badBodies = [
      {},
      { matchId: '' },
      { matchId: 'm1', winner: 'player1' }, // missing loser and lores
      { matchId: 'm1', winner: 'player1', loser: 'player2', winnerLore: -1, loserLore: 10 }, // negative lore
      { matchId: 'm1', winner: 'player1', loser: 'player2', winnerLore: 'twenty', loserLore: 10 }, // invalid types
    ];

    for (const body of badBodies) {
      const res = await fetch(`${baseUrl}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      expect(res.status).toBe(400);
    }
  });

  it('TC-MATCH-03: POST /api/matches from a user not in the match returns 403 Forbidden (OWASP A01)', async () => {
    const token = createToken('intruder_user');
    const res = await fetch(`${baseUrl}/api/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        matchId: 'room123-1727610000',
        winner: 'player1',
        loser: 'player2',
        winnerLore: 20,
        loserLore: 12,
        turns: 8,
      }),
    });
    expect(res.status).toBe(403);
  });

  it('TC-MATCH-04: POST /api/matches with valid participant returns 200/202', async () => {
    const token = createToken('player1');
    const res = await fetch(`${baseUrl}/api/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        matchId: 'room123-1727610000',
        winner: 'player1',
        loser: 'player2',
        winnerLore: 20,
        loserLore: 12,
        turns: 8,
      }),
    });
    // Server should accept match result
    expect([200, 202]).toContain(res.status);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
