const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'docs', 'DocUpdate24_08_2026', 'images');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);

  // login
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  try {
    await page.locator("button:has-text('เข้าสู่ระบบ'), button:has-text('Login')").first().click();
    await page.waitForTimeout(1200);
    await page.locator("input[type='text'], input[type='email']").first().fill('io5');
    await page.locator("input[type='password']").first().fill('io5io5');
    await page.locator("button[type='submit'], button:has-text('เข้าสู่ระบบ')").last().click();
    await page.waitForTimeout(4000);
    console.log('logged in');
  } catch (e) { console.log('login issue:', e.message); }

  const navTargets = [
    ['สร้างเด็คการ์ด', '10_deck_builder'],
    ['บัญชี', '11_account'],
    ['โปรไฟล์', '11_account'],
    ['คลาการ์ดออนไลน์', '12_card_gallery'],
    ['โหมดทดลอง', '13_sandbox'],
    ['คู่มือ', '14_guide'],
  ];
  for (const [label, name] of navTargets) {
    try {
      await page.locator(`a:has-text("${label}"), button:has-text("${label}")`).first().click();
      await page.waitForTimeout(3500);
      await page.screenshot({ path: `${OUT}\\cap_${name}.png` });
      await page.screenshot({ path: `${OUT}\\cap_${name}_full.png`, fullPage: true });
      console.log('ok:', label, '->', page.url());
    } catch (e) { console.log('fail:', label, e.message.split('\n')[0]); }
  }

  // dump all nav hrefs for mapping
  const links = await page.$$eval('nav a, header a', as => as.map(a => a.textContent.trim() + ' => ' + a.getAttribute('href')));
  console.log(links.join('\n'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
