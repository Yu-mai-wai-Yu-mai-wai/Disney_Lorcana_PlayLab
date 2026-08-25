const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('http://localhost:4174/', { waitUntil: 'networkidle' });
  await p.locator('button', { hasText: 'เริ่มเล่นโต๊ะ Sandbox' }).first().click({ timeout: 8000 });
  await p.waitForTimeout(3000);
  // Measure sidebar: does content fill full height?
  const m = await p.evaluate(() => {
    const aside = document.querySelector('aside:not([class*="fixed"])');
    if (!aside) return { found: false };
    const r = aside.getBoundingClientRect();
    const last = aside.lastElementChild.getBoundingClientRect();
    return { found: true, asideH: Math.round(r.height), lastBottom: Math.round(last.bottom), gap: Math.round(r.bottom - last.bottom) };
  });
  console.log(JSON.stringify(m));
  await p.screenshot({ path: 'test-results/responsive/sidebar-fix-1920.png' });
  await b.close();
})();
