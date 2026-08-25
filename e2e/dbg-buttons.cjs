const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const btns = await p.locator('button').allTextContents();
  console.log(JSON.stringify(btns.slice(0, 25)));
  await b.close();
})();
