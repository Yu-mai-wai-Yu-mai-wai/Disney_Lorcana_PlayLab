const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'docs', 'DocUpdate24_08_2026', 'images');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  try {
    await page.locator("button:has-text('เข้าสู่ระบบ')").first().click();
    await page.waitForTimeout(1200);
    await page.locator("input[type='text'], input[type='email']").first().fill('io5');
    await page.locator("input[type='password']").first().fill('io5io5');
    await page.locator("button[type='submit'], button:has-text('เข้าสู่ระบบ')").last().click();
    await page.waitForTimeout(4000);
  } catch (e) { console.log('login issue:', e.message); }

  const links = await page.$$eval('a', as => as.map(a => (a.textContent.trim().slice(0,40)) + ' => ' + a.getAttribute('href')));
  console.log([...new Set(links)].join('\n'));
  const btns = await page.$$eval('button', bs => [...new Set(bs.map(b => b.textContent.trim().slice(0,40)))].filter(t => t));
  console.log('BUTTONS:\n' + btns.join(' | '));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
