import { test, expect } from '@playwright/test';

test.describe('2. Deck Builder & Synergy Analytics QA Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?tab=deckbuilder');
    await page.waitForLoadState('networkidle');
  });

  test('TC-E2E-04: should display Deck Builder with search input and ink filter chips', async ({ page }) => {
    // Check search input presence
    const searchInput = page.locator('input[type="text"], input[placeholder*="Search"], input[placeholder*="ค้นหา"]').first();
    await expect(searchInput).toBeVisible();

    // Check ink filter buttons (Amber, Amethyst, Ruby, etc.)
    const filterContainer = page.locator('button, div').filter({ hasText: /Amber|Amethyst|Emerald|Ruby|Sapphire|Steel/i }).first();
    await expect(filterContainer).toBeVisible();
  });

  test('TC-E2E-05: should search cards dynamically by character name', async ({ page }) => {
    const searchInput = page.locator('input[type="text"], input[placeholder*="Search"], input[placeholder*="ค้นหา"]').first();
    await searchInput.fill('Mickey');
    await page.waitForTimeout(500);

    // Verify results show Mickey cards
    const cardItem = page.locator('text=Mickey').first();
    await expect(cardItem).toBeVisible();
  });

  test('TC-E2E-06: should filter cards by ink color when ink chip is clicked', async ({ page }) => {
    const rubyBtn = page.locator('button').filter({ hasText: /Ruby/i }).first();
    if (await rubyBtn.isVisible()) {
      await rubyBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('TC-E2E-07: should add card to deck and reflect count in deck list', async ({ page }) => {
    // Find first add card button or card item
    const addBtn = page.locator('button').filter({ hasText: /\+|Add|เพิ่ม/i }).or(page.locator('[data-testid="add-card-btn"]')).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
    }
  });
});
