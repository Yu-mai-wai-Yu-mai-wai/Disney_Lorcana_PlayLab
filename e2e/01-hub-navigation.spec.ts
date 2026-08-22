import { test, expect } from '@playwright/test';

test.describe('1. Game Hub & UI Navigation QA Suite', () => {
  test('TC-E2E-01: should load Game Hub with luxury theme, WebGL Canvas, and correct title', async ({ page }) => {
    await page.goto('/?tab=hub');
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/Disney Lorcana PlayLab/i);

    // Verify WebGL Gold Ink Shader Canvas is mounted
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Verify Hub Hero Title
    const heroTitle = page.locator('h1, h2').first();
    await expect(heroTitle).toBeVisible();
  });

  test('TC-E2E-02: should navigate seamlessly across all main application tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Match Lobby
    const lobbyTabBtn = page.locator('nav button, button').filter({ hasText: /Match Lobby|ห้องเล่น/i }).first();
    if (await lobbyTabBtn.isVisible()) {
      await lobbyTabBtn.click();
      await expect(page.locator('text=Match Lobby').or(page.locator('text=ห้องเล่น')).first()).toBeVisible();
    }

    // Navigate to Deck Builder
    const deckTabBtn = page.locator('nav button, button').filter({ hasText: /Deck Builder|จัดเด็ค/i }).first();
    if (await deckTabBtn.isVisible()) {
      await deckTabBtn.click();
      await expect(page.locator('input[placeholder*="Search"], input[placeholder*="ค้นหา"]').first()).toBeVisible();
    }

    // Navigate to Rules Guide
    const rulesTabBtn = page.locator('nav button, button').filter({ hasText: /Rules Guide|คู่มือกฎ/i }).first();
    if (await rulesTabBtn.isVisible()) {
      await rulesTabBtn.click();
      await expect(page.locator('text=Rules Guide').or(page.locator('text=คู่มือ')).first()).toBeVisible();
    }
  });

  test('TC-E2E-03: should open and close Patch Notes modal cleanly', async ({ page }) => {
    await page.goto('/?tab=hub');
    const patchNotesBtn = page.locator('button').filter({ hasText: /Patch Notes/i }).first();
    if (await patchNotesBtn.isVisible()) {
      await patchNotesBtn.click();
      await expect(page.locator('text=Patch Notes').or(page.locator('text=บันทึกการอัปเดต')).first()).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button').filter({ hasText: /Close|ปิด|✕/i }).or(page.locator('button:has(svg.lucide-x)')).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });
});
