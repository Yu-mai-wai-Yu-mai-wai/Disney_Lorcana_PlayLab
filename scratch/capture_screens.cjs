const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'docs', 'DocUpdate24_08_2026', 'images');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  const shot = (n, full) => page.screenshot({ path: `${OUT}\\cap_${n}.png`, fullPage: !!full });

  // 1. Landing
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await shot('01_landing_hero');
  await shot('02_landing_full', true);
  console.log('landing ok');

  // 2. Open login modal
  try {
    await page.locator("button:has-text('เข้าสู่ระบบ'), button:has-text('Login'), button:has-text('Sign in')").first().click();
    await page.waitForTimeout(1500);
    await shot('03_login_modal');
    console.log('login modal ok');
  } catch (e) { console.log('login btn fail:', e.message); }

  // 3. Fill credentials io5 / io5io5
  try {
    const u = page.locator("input[type='text'], input[type='email']").first();
    const pw = page.locator("input[type='password']").first();
    await u.fill('io5'); await pw.fill('io5io5');
    await shot('04_login_filled');
    await page.locator("button[type='submit'], button:has-text('เข้าสู่ระบบ')").last().click();
    await page.waitForTimeout(5000);
    await shot('05_after_login_full', true);
    await shot('06_after_login_view');
    console.log('after login ok url:', page.url());
  } catch (e) { console.log('cred fail:', e.message); }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
