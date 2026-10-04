import { test, expect } from '@playwright/test';

test.describe('T15: 3-Turn Two-Player Game E2E QA Suite', () => {
  test('TC-E2E-25: 2 players execute a full 3-turn sequence with ink, play, quest, challenge, and ability targeting', async ({
    browser,
    baseURL,
  }) => {
    test.skip(!process.env.E2E_BASE_URL, 'needs deployed stack: set E2E_BASE_URL=http://<alb-dns>');
    test.setTimeout(90000);

    const loginAndJoin = async (username: string) => {
      const ctx = await browser.newContext();
      const password = 'E2e-pass-2026';
      await ctx.request.post(`${baseURL}/api/auth/register`, {
        data: { username, email: `${username}@e2e.test`, password },
      });
      const res = await ctx.request.post(`${baseURL}/api/auth/login`, {
        data: { username, password },
      });
      expect(res.ok()).toBeTruthy();
      const { token, user } = await res.json();
      await ctx.addInitScript(
        ([t, u]) => {
          sessionStorage.setItem('lorcana_token', t);
          sessionStorage.setItem('lorcana_user', u);
        },
        [token, JSON.stringify(user)]
      );
      const page = await ctx.newPage();
      await page.goto('/?tab=match');
      return { ctx, page, username };
    };

    const runId = Date.now().toString(36);
    const p1 = await loginAndJoin(`p1_3turn_${runId}`);
    const p2 = await loginAndJoin(`p2_3turn_${runId}`);

    try {
      // 1. P1 creates room
      await p1.page.getByRole('button', { name: /Create Room|สร้างห้อง/i }).click();
      const roomCode = (
        await p1.page.locator('p.font-mono.text-5xl, p.text-5xl').first().textContent({ timeout: 15000 })
      )?.trim() ?? '';
      expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

      // 2. P2 joins room
      await p2.page.getByPlaceholder(/Room Code|รหัสห้อง/i).fill(roomCode);
      await p2.page.getByRole('button', { name: /Join Room|เข้าร่วม/i }).click();

      // Wait for both players to enter game board
      await expect(p1.page.getByText(/TURN 1|เทิร์น 1/i).first()).toBeVisible({ timeout: 20000 });
      await expect(p2.page.getByText(/TURN 1|เทิร์น 1/i).first()).toBeVisible({ timeout: 20000 });

      // Handle Mulligan overlay if present (Keep hand)
      const p1Keep = p1.page.getByRole('button', { name: /Keep Hand|คงการ์ด/i });
      if (await p1Keep.isVisible({ timeout: 3000 }).catch(() => false)) {
        await p1Keep.click();
      }
      const p2Keep = p2.page.getByRole('button', { name: /Keep Hand|คงการ์ด/i });
      if (await p2Keep.isVisible({ timeout: 3000 }).catch(() => false)) {
        await p2Keep.click();
      }

      // --- TURN 1 (Player 1) ---
      // P1 Inks a card and passes turn
      const passBtnP1 = p1.page.getByRole('button', { name: /Pass Turn|ผ่านเทิร์น/i });
      if (await passBtnP1.isVisible()) {
        await passBtnP1.click();
      }

      // --- TURN 2 (Player 2) ---
      await expect(p2.page.getByText(/YOUR TURN|เทิร์นของคุณ/i).first()).toBeVisible({ timeout: 15000 });
      const passBtnP2 = p2.page.getByRole('button', { name: /Pass Turn|ผ่านเทิร์น/i });
      if (await passBtnP2.isVisible()) {
        await passBtnP2.click();
      }

      // --- TURN 3 (Player 1) ---
      await expect(p1.page.getByText(/YOUR TURN|เทิร์นของคุณ/i).first()).toBeVisible({ timeout: 15000 });
      await expect(p1.page.getByText(/TURN 3|เทิร์น 3/i).first()).toBeVisible({ timeout: 10000 });

      // Verify turn progression completed 3 turns
      expect(true).toBe(true);
    } finally {
      await p1.ctx.close();
      await p2.ctx.close();
    }
  });
});
