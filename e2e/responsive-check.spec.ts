import { test, devices } from '@playwright/test';

const BASE = 'http://localhost:4173/';
// Standard viewports, portrait + landscape
const viewports = [
  { name: 'mobile-360-portrait', width: 360, height: 800 },
  { name: 'mobile-390-portrait', width: 390, height: 844 },
  { name: 'mobile-430-landscape', width: 915, height: 430 },
  { name: 'tablet-ipad-portrait', width: 768, height: 1024 },
  { name: 'tablet-ipad-landscape', width: 1024, height: 768 },
  { name: 'tablet-ipad-pro-landscape', width: 1194, height: 834 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

for (const vp of viewports) {
  test(`responsive ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    // Check Login button visibility & overflow
    const loginBtn = page.locator('header button', { hasText: /เข้าสู่ระบบ|Sign In|Login|Account/i }).first();
    let loginVisible = false;
    try {
      loginVisible = await loginBtn.isVisible({ timeout: 3000 });
      if (loginVisible) {
        const box = await loginBtn.boundingBox();
        console.log(`[${vp.name}] login visible=${loginVisible} box=${JSON.stringify(box)}`);
      }
    } catch {
      console.log(`[${vp.name}] login visible=false (not found)`);
    }
    // Horizontal overflow check
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`[${vp.name}] hOverflow=${overflow}px`);
    await page.screenshot({ path: `test-results/responsive/${vp.name}.png`, fullPage: false });
  });
}
