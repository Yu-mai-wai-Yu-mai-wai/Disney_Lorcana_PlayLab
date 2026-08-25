const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'docs', 'DocUpdate24_08_2026', 'images');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:9200/?static=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/qa_dashboard_summary.png`, timeout: 60000 });
  console.log('summary ok');
  await page.screenshot({ path: `${OUT}/qa_dashboard_full.png`, fullPage: true, timeout: 120000 });
  console.log('full ok');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
