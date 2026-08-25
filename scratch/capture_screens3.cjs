const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'docs', 'DocUpdate24_08_2026', 'images');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  try {
    await page.locator("button:has-text('เข้าสู่ระบบ')").first().click();
    await page.waitForTimeout(1200);
    await page.locator("input[type='text'], input[type='email']").first().fill('io5');
    await page.locator("input[type='password']").first().fill('io5io5');
    await page.locator("button[type='submit'], button:has-text('เข้าสู่ระบบ')").last().click();
    await page.waitForTimeout(4500);
  } catch (e) { console.log('login issue:', e.message); }

  const shot = async (n, full=true) => {
    await page.screenshot({ path: `${OUT}\\cap_${n}.png`, fullPage: full });
    await page.screenshot({ path: `${OUT}\\cap_${n}_view.png` });
  };

  // Match Arena (real-time play / room select)
  try {
    await page.locator("button:has-text('ดวลการ์ดออนไลน์')").first().click();
    await page.waitForTimeout(4000);
    await shot('20_match_arena');
    console.log('arena ok');
  } catch (e) { console.log('arena fail:', e.message.split('\n')[0]); }

  // Deck Builder
  try {
    await page.locator("button:has-text('จัดเด็คการ์ด')").first().click();
    await page.waitForTimeout(4500);
    await shot('21_deck_builder');
    console.log('deckbuilder ok');
  } catch (e) { console.log('deck fail:', e.message.split('\n')[0]); }

  // Deck Analytics (account-ish dashboard)
  try {
    await page.locator("button:has-text('วิเคราะห์เด็ค')").first().click();
    await page.waitForTimeout(4000);
    await shot('22_deck_analytics');
    console.log('analytics ok');
  } catch (e) { console.log('analytics fail:', e.message.split('\n')[0]); }

  // Sandbox
  try {
    await page.locator("button:has-text('โต๊ะจำลอง Sandbox')").first().click();
    await page.waitForTimeout(4000);
    await shot('23_sandbox');
    console.log('sandbox ok');
  } catch (e) { console.log('sandbox fail:', e.message.split('\n')[0]); }

  // account menu (io5 badge)
  try {
    await page.locator("text=io5").first().click();
    await page.waitForTimeout(1500);
    await shot('24_account_menu', false);
    console.log('account menu ok');
  } catch (e) { console.log('account fail:', e.message.split('\n')[0]); }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
