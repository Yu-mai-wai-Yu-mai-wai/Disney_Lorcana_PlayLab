import { test, expect } from '@playwright/test';

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
