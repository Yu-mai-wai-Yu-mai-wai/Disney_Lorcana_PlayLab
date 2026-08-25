const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'docs', 'DocUpdate24_08_2026', 'images', 'aws_icons');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 200, height: 200 }, deviceScaleFactor: 4 });
  const svgs = fs.readdirSync(DIR).filter(f => f.endsWith('.svg'));
  for (const f of svgs) {
    const svg = fs.readFileSync(path.join(DIR, f), 'utf8');
    await page.setContent(`<html><body style="margin:0;background:#232f3e;width:200px;height:200px;display:flex;align-items:center;justify-content:center">${svg.replace('<svg ', '<svg width="140" height="140" ')}</body></html>`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, f.replace('.svg', '.png')), clip: { x: 0, y: 0, width: 200, height: 200 } });
    console.log('png:', f.replace('.svg', '.png'));
  }
  await browser.close();
})();
