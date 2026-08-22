import { test, expect } from '@playwright/test';

test.describe('4. Responsive UI & Aesthetics Quality Audit', () => {
  const VIEWPORTS = [
    { name: 'Desktop HD', width: 1920, height: 1080 },
    { name: 'Standard Laptop', width: 1366, height: 768 },
    { name: 'Tablet iPad', width: 834, height: 1194 },
    { name: 'Mobile iPhone', width: 390, height: 844 },
  ];

  for (const vp of VIEWPORTS) {
    test(`TC-E2E-12: should render clean responsive layout on ${vp.name} (${vp.width}x${vp.height}) without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/?tab=hub');
      await page.waitForLoadState('networkidle');

      // Verify no unexpected horizontal scrollbar on main container
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 5;
      });
      expect(isOverflowing).toBe(false);

      // Verify navbar or header exists
      const header = page.locator('nav, header').first();
      await expect(header).toBeVisible();
    });
  }
});
