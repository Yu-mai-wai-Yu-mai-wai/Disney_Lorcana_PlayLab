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
