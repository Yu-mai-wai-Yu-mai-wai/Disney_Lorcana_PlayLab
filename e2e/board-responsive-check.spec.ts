import { test } from '@playwright/test';

const BASE = 'http://localhost:4173/';
const viewports = [
  { name: 'board-mobile-360-portrait', width: 360, height: 800 },
  { name: 'board-mobile-390-portrait', width: 390, height: 844 },
  { name: 'board-mobile-430-landscape', width: 915, height: 430 },
  { name: 'board-ipad-768-portrait', width: 768, height: 1024 },
  { name: 'board-ipad-1024-landscape', width: 1024, height: 768 },
  { name: 'board-desktop-1920', width: 1920, height: 1080 },
];

for (const vp of viewports) {
  test(`board ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    // Navigate to Sandbox board via hub CTA button
    try {
      const cta = page.locator('button', { hasText: 'เริ่มเล่นโต๊ะ Sandbox' }).first();
      await cta.click({ timeout: 8000 });
    } catch (e) {
      console.log(`[${vp.name}] nav fallback: ${e.message.split('\n')[0]}`);
    }
    await page.waitForTimeout(2500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`[${vp.name}] hOverflow=${overflow}px url=${page.url()}`);
    await page.screenshot({ path: `test-results/responsive/${vp.name}.png` });
  });
}
