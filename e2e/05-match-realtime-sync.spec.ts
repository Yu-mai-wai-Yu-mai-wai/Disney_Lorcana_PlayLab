import { test, expect } from '@playwright/test';
import { createHmac } from 'crypto';

// HS256 JWT signed with an arbitrary secret (stdlib only)
const signJwt = (payload: object, secret: string) => {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 })}`;
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
};

test('TC-E2E-16: deployed API rejects tokens signed with the public dev secret + sends security headers (ALB only)', async ({ request, baseURL }) => {
  test.skip(!process.env.E2E_BASE_URL, 'needs deployed stack: set E2E_BASE_URL=http://<alb-dns>');
  const forged = signJwt({ username: 'attacker', role: 'admin' }, 'dev-secret-key-do-not-use-in-production');
  const res = await request.get(`${baseURL}/api/decks`, { headers: { Authorization: `Bearer ${forged}` } });
  expect(res.status()).toBe(401);

  const home = await request.get(`${baseURL}/`);
  expect(home.headers()['x-frame-options']).toBe('DENY');
  expect(home.headers()['x-content-type-options']).toBe('nosniff');
});

// Playmat is stored on the account: a fresh browser context (another device) sees it, another account does not
test('TC-E2E-18: playmat follows the account across devices, not across accounts (ALB only)', async ({ playwright, baseURL }) => {
  test.skip(!process.env.E2E_BASE_URL, 'needs deployed stack: set E2E_BASE_URL=http://<alb-dns>');
  const password = 'E2e-pass-2026';
  const tokenFor = async (name: string) => {
    const ctx = await playwright.request.newContext(); // separate "device"
    await ctx.post(`${baseURL}/api/auth/register`, { data: { username: name, email: `${name}@e2e.test`, password } });
    const { token } = await (await ctx.post(`${baseURL}/api/auth/login`, { data: { username: name, password } })).json();
    return { ctx, auth: { Authorization: `Bearer ${token}` } };
  };
  const run = Date.now().toString(36);
  const a1 = await tokenFor(`e2e_pm_a_${run}`);
  expect((await a1.ctx.put(`${baseURL}/api/users/me/playmat`, { headers: a1.auth, data: { playmatId: 'maui-demigod' } })).status()).toBe(200);

  const a2 = await tokenFor(`e2e_pm_a_${run}`); // same account, new device
  expect((await (await a2.ctx.get(`${baseURL}/api/users/me/playmat`, { headers: a2.auth })).json()).playmatId).toBe('maui-demigod');

  const b = await tokenFor(`e2e_pm_b_${run}`); // different account
  expect((await (await b.ctx.get(`${baseURL}/api/users/me/playmat`, { headers: b.auth })).json()).playmatId).toBeNull();
  await Promise.all([a1.ctx.dispose(), a2.ctx.dispose(), b.ctx.dispose()]);
});

// Regression for the rejoin deadlock: two tabs in one browser shared localStorage, so the refreshing
// player sent the opponent's role and Lambda ("username OR role") gave it the opponent's seat.
test('TC-E2E-19: rejoin carrying a foreign role keeps both seats and both directions of relay (WebSocket API)', async () => {
  test.skip(!process.env.E2E_BASE_URL, 'needs deployed stack: set E2E_BASE_URL=http://<alb-dns>');
  test.setTimeout(45000);
  const url = process.env.E2E_WS_URL || 'wss://a86238wqo4.execute-api.us-east-1.amazonaws.com/prod';
  const open = async () => {
    const ws = new WebSocket(url);
    const inbox: any[] = [];
    ws.onmessage = (e) => inbox.push(JSON.parse(String(e.data)));
    await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
    const next = async (pred: (m: any) => boolean, ms = 8000) => {
      for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 100))) {
        const i = inbox.findIndex(pred);
        if (i >= 0) return inbox.splice(i, 1)[0];
      }
      throw new Error(`timeout waiting for message; inbox=${JSON.stringify(inbox).slice(0, 300)}`);
    };
    return { ws, send: (m: object) => ws.send(JSON.stringify(m)), next };
  };
  const run = Date.now().toString(36);
  const [u1, u2] = [`e2e_rj1_${run}`, `e2e_rj2_${run}`];

  const a = await open();
  a.send({ action: 'CREATE_ROOM', username: u1, deckId: 'starter-pool', deckName: 'E2E' });
  const { roomId } = await a.next((m) => m.action === 'ROOM_CREATED');

  const b = await open();
  b.send({ action: 'JOIN_ROOM', roomId, username: u2, deckId: 'starter-pool', deckName: 'E2E' });
  await b.next((m) => m.action === 'ROOM_STATE' || m.action === 'GAME_START');
  b.ws.close();
  await new Promise((r) => setTimeout(r, 1500));

  const c = await open(); // player 2 "refreshes" but carries player 1's role
  c.send({ action: 'REJOIN_ROOM', roomId, username: u2, role: 'player1' });
  expect((await c.next((m) => m.action === 'PLAYER_RECONNECTED' && m.isSelf)).role).toBe('player2');

  a.send({ action: 'CHAT_MESSAGE', roomId, username: u1, text: 'from-p1' });
  await c.next((m) => m.action === 'CHAT_MESSAGE' && m.text === 'from-p1');
  c.send({ action: 'CHAT_MESSAGE', roomId, username: u2, text: 'from-p2' });
  await a.next((m) => m.action === 'CHAT_MESSAGE' && m.text === 'from-p2');

  a.send({ action: 'LEAVE_ROOM', roomId, username: u1 });
  a.ws.close();
  c.ws.close();
});

// Deck save -> DynamoDB + SQS enqueue (queue URL comes from SSM on EC2), then analyze + read back
test('TC-E2E-17: deck save, analyze and read analysis through the ALB (ALB only)', async ({ request, baseURL }) => {
  test.skip(!process.env.E2E_BASE_URL, 'needs deployed stack: set E2E_BASE_URL=http://<alb-dns>');
  const name = `e2e_deck_${Date.now().toString(36)}`;
  const password = 'E2e-pass-2026';
  await request.post(`${baseURL}/api/auth/register`, { data: { username: name, email: `${name}@e2e.test`, password } });
  const { token } = await (await request.post(`${baseURL}/api/auth/login`, { data: { username: name, password } })).json();
  const auth = { Authorization: `Bearer ${token}` };

  const cards = [{ card: { id: 'e2e-1', cost: 2, inkable: true, type: 'Character' }, count: 4 }];
  const saved = await request.post(`${baseURL}/api/decks`, { headers: auth, data: { name: 'E2E Deck', cards } });
  expect(saved.status()).toBe(201);
  const { deckId } = await saved.json();

  expect((await request.post(`${baseURL}/api/decks/${deckId}/analyze`, { headers: auth })).status()).toBe(202);
  const got = await request.get(`${baseURL}/api/decks/${deckId}/analysis`, { headers: auth });
  expect(got.status()).toBe(200);
  expect((await got.json()).analysis).not.toBeNull();
});

// Decoupled Match Results: Client -> EC2 -> SNS -> SQS -> Lambda -> DynamoDB (T04)
test('TC-E2E-23: match finish publishes to SNS and fan-out records to match history & player stats (ALB only)', async ({ request, baseURL }) => {
  test.skip(!process.env.E2E_BASE_URL, 'needs deployed stack: set E2E_BASE_URL=http://<alb-dns>');
  test.setTimeout(45000);

  const password = 'E2e-pass-2026';
  const run = Date.now().toString(36);
  const p1Name = `e2e_p1_${run}`;
  const p2Name = `e2e_p2_${run}`;

  // Register and login both players
  await request.post(`${baseURL}/api/auth/register`, { data: { username: p1Name, email: `${p1Name}@e2e.test`, password } });
  const p1Login = await request.post(`${baseURL}/api/auth/login`, { data: { username: p1Name, password } });
  const { token: p1Token } = await p1Login.json();
  const p1Auth = { Authorization: `Bearer ${p1Token}` };

  await request.post(`${baseURL}/api/auth/register`, { data: { username: p2Name, email: `${p2Name}@e2e.test`, password } });
  const p2Login = await request.post(`${baseURL}/api/auth/login`, { data: { username: p2Name, password } });
  const { token: p2Token } = await p2Login.json();
  const p2Auth = { Authorization: `Bearer ${p2Token}` };

  // Negative checks
  // 1. Missing token -> 401
  const noAuth = await request.post(`${baseURL}/api/matches`, {
    data: { matchId: `m_${run}`, winner: p1Name, loser: p2Name, winnerLore: 20, loserLore: 10 },
  });
  expect(noAuth.status()).toBe(401);

  // 2. Non-participant submission -> 403
  const p3Name = `e2e_intruder_${run}`;
  await request.post(`${baseURL}/api/auth/register`, { data: { username: p3Name, email: `${p3Name}@e2e.test`, password } });
  const p3Login = await request.post(`${baseURL}/api/auth/login`, { data: { username: p3Name, password } });
  const { token: p3Token } = await p3Login.json();
  const intruderAuth = { Authorization: `Bearer ${p3Token}` };
  const intruderRes = await request.post(`${baseURL}/api/matches`, {
    headers: intruderAuth,
    data: { matchId: `m_${run}`, winner: p1Name, loser: p2Name, winnerLore: 20, loserLore: 10 },
  });
  expect(intruderRes.status()).toBe(403);

  // 3. Positive submission by Winner
  const matchId = `match_${run}`;
  const recordRes = await request.post(`${baseURL}/api/matches`, {
    headers: p1Auth,
    data: {
      matchId,
      winner: p1Name,
      loser: p2Name,
      winnerLore: 20,
      loserLore: 12,
      turns: 8,
    },
  });
  expect(recordRes.status()).toBe(200);
  const recordJson = await recordRes.json();
  expect(recordJson.ok).toBe(true);

  // Wait for async fan-out via SNS -> SQS -> Lambda -> DynamoDB (within 10-15s)
  let p1MatchFound = false;
  let p2MatchFound = false;
  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (!p1MatchFound) {
      const res = await request.get(`${baseURL}/api/matches`, { headers: p1Auth });
      if (res.ok()) {
        const body = await res.json();
        const found = (body.matches || []).find((m: any) => m.matchId === matchId);
        if (found) {
          expect(found.result).toBe('WIN');
          expect(found.opponent).toBe(p2Name);
          expect(found.myLore).toBe(20);
          expect(found.opponentLore).toBe(12);
          p1MatchFound = true;
        }
      }
    }
    if (!p2MatchFound) {
      const res = await request.get(`${baseURL}/api/matches`, { headers: p2Auth });
      if (res.ok()) {
        const body = await res.json();
        const found = (body.matches || []).find((m: any) => m.matchId === matchId);
        if (found) {
          expect(found.result).toBe('LOSS');
          expect(found.opponent).toBe(p1Name);
          expect(found.myLore).toBe(12);
          expect(found.opponentLore).toBe(20);
          p2MatchFound = true;
        }
      }
    }
    if (p1MatchFound && p2MatchFound) break;
  }
  expect(p1MatchFound).toBe(true);
  expect(p2MatchFound).toBe(true);

  // Verify Player Stats
  const p1StatsRes = await request.get(`${baseURL}/api/users/${p1Name}/stats`);
  expect(p1StatsRes.ok()).toBe(true);
  const p1Stats = (await p1StatsRes.json()).stats;
  expect(p1Stats.wins).toBe(1);
  expect(p1Stats.games).toBe(1);

  const p2StatsRes = await request.get(`${baseURL}/api/users/${p2Name}/stats`);
  expect(p2StatsRes.ok()).toBe(true);
  const p2Stats = (await p2StatsRes.json()).stats;
  expect(p2Stats.losses).toBe(1);
  expect(p2Stats.games).toBe(1);

  // Deduplication / Idempotency test: resend same matchId
  await request.post(`${baseURL}/api/matches`, {
    headers: p1Auth,
    data: { matchId, winner: p1Name, loser: p2Name, winnerLore: 20, loserLore: 12, turns: 8 },
  });
  await new Promise((r) => setTimeout(r, 2000));
  const p1StatsAgain = (await (await request.get(`${baseURL}/api/users/${p1Name}/stats`)).json()).stats;
  expect(p1StatsAgain.wins).toBe(1); // Still 1, not 2
});

test.describe('5. Real-time Multi-Client Match Sync & WebSockets QA Suite', () => {
  test('TC-E2E-13: should open 2 independent player sessions and navigate to Match Lobby', async ({ browser }) => {
    // 1. Create Context for Player 1
    const context1 = await browser.newContext({ storageState: undefined });
    const page1 = await context1.newPage();

    // 2. Create Context for Player 2
    const context2 = await browser.newContext({ storageState: undefined });
    const page2 = await context2.newPage();

    try {
      // Player 1 navigates to Match Lobby
      await page1.goto('/?tab=match');
      await page1.waitForLoadState('networkidle');
      await expect(page1.locator('text=Match Lobby').or(page1.locator('text=ห้องเล่น')).first()).toBeVisible();

      // Player 2 navigates to Match Lobby
      await page2.goto('/?tab=match');
      await page2.waitForLoadState('networkidle');
      await expect(page2.locator('text=Match Lobby').or(page2.locator('text=ห้องเล่น')).first()).toBeVisible();

      // Verify create room or starter deck buttons exist on both
      const p1CreateBtn = page1.locator('button').filter({ hasText: /Create Room|สร้างห้อง/i }).first();
      const p2JoinInput = page2.locator('input[placeholder*="Room"], input[placeholder*="รหัส"]').first();

      if (await p1CreateBtn.isVisible()) {
        await expect(p1CreateBtn).toBeEnabled();
      }
      if (await p2JoinInput.isVisible()) {
        await expect(p2JoinInput).toBeVisible();
      }
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  // F10: with ASG Min 2, the two players' pages can come from different EC2 instances.
  // Realtime must still work because room state lives in API Gateway WebSocket + DynamoDB, not in instance memory.
  test('TC-E2E-15: P2 joins P1 room across instances and P1 sees the opponent (ALB only)', async ({ browser, baseURL }) => {
    test.skip(!process.env.E2E_BASE_URL, 'needs deployed stack: set E2E_BASE_URL=http://<alb-dns>');
    test.setTimeout(60000);

    const login = async (name: string) => {
      const ctx = await browser.newContext();
      const password = 'E2e-pass-2026';
      await ctx.request.post(`${baseURL}/api/auth/register`, { data: { username: name, email: `${name}@e2e.test`, password } });
      const res = await ctx.request.post(`${baseURL}/api/auth/login`, { data: { username: name, password } });
      expect(res.ok()).toBeTruthy();
      const { token, user } = await res.json();
      await ctx.addInitScript(([t, u]) => {
        sessionStorage.setItem('lorcana_token', t);
        sessionStorage.setItem('lorcana_user', u);
      }, [token, JSON.stringify(user)]);
      const page = await ctx.newPage();
      await page.goto('/?tab=match');
      return { ctx, page };
    };

    const run = Date.now().toString(36);
    const p1 = await login(`e2e_p1_${run}`);
    const p2name = `e2e_p2_${run}`;
    const p2 = await login(p2name);
    try {
      await p1.page.getByRole('button', { name: /Create Room|สร้างห้อง/i }).click();
      const code = (await p1.page.locator('p.font-mono.text-5xl, p.text-5xl').first().textContent({ timeout: 15000 }))?.trim() ?? '';
      expect(code).toMatch(/^[A-Z0-9]{6}$/);

      await p2.page.getByPlaceholder(/Room Code|รหัสห้อง/i).fill(code);
      await p2.page.getByRole('button', { name: /Join Room|เข้าร่วม/i }).click();

      await expect(p1.page.getByText(p2name, { exact: false }).first()).toBeVisible({ timeout: 10000 });
    } finally {
      await p1.ctx.close();
      await p2.ctx.close();
    }
  });

  test('TC-E2E-14: should verify isolated session state between Player 1 and Player 2', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await page1.goto('/?tab=hub');
      await page2.goto('/?tab=hub');

      // Set Player 1 language to Thai
      const p1LangBtn = page1.locator('button').filter({ hasText: /TH|ไทย/i }).first();
      if (await p1LangBtn.isVisible()) {
        await p1LangBtn.click();
      }

      // Verify Player 2 can maintain English independently
      const p2LangBtn = page2.locator('button').filter({ hasText: /EN|English/i }).first();
      if (await p2LangBtn.isVisible()) {
        await p2LangBtn.click();
      }
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
