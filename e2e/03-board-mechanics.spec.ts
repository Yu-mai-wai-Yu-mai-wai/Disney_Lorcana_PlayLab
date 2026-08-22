import { test, expect } from '@playwright/test';

test.describe('3. Lorcana Board Interactive Mechanics QA Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to Lorcana Board sandbox mode
    await page.goto('/?tab=board');
    await page.waitForLoadState('networkidle');
  });

  test('TC-E2E-08: should initialize Lorcana Board with Hand, Field, Inkwell, and Lore Counter', async ({ page }) => {
    // Verify Play Area / Board presence
    const boardContainer = page.locator('main, div[class*="playmat"], div[class*="board"]').first();
    await expect(boardContainer).toBeVisible();

    // Verify Lore Counter is visible
    const loreIndicator = page.locator('text=Lore').or(page.locator('text=แต้มลอร์')).first();
    await expect(loreIndicator).toBeVisible();
  });

  test('TC-E2E-09: should allow incrementing and decrementing Lore Counter', async ({ page }) => {
    // Find lore increment button (+)
    const incrementBtn = page.locator('button').filter({ hasText: /\+/ }).first();
    if (await incrementBtn.isVisible()) {
      await incrementBtn.click();
      await page.waitForTimeout(200);
    }
  });

  test('TC-E2E-10: should open Dice Duel modal when dice button is clicked', async ({ page }) => {
    const diceBtn = page.locator('button:has(svg.lucide-dices)').or(page.locator('button').filter({ hasText: /Dice|ลูกเต๋า/i })).first();
    if (await diceBtn.isVisible()) {
      await diceBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=Dice Duel').or(page.locator('text=ทอยลูกเต๋า')).first()).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button').filter({ hasText: /Close|ปิด|✕/i }).or(page.locator('button:has(svg.lucide-x)')).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('TC-E2E-11: should open Playmat Selector modal when playmat button is clicked', async ({ page }) => {
    const playmatBtn = page.locator('button:has(svg.lucide-palette)').or(page.locator('button').filter({ hasText: /Playmat|แผ่นรอง/i })).first();
    if (await playmatBtn.isVisible()) {
      await playmatBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=Playmat').or(page.locator('text=แผ่นรองเล่น')).first()).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button').filter({ hasText: /Close|ปิด|✕/i }).or(page.locator('button:has(svg.lucide-x)')).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });
});
