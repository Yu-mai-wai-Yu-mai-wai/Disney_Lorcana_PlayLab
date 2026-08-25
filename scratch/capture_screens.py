import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
OUT = r"D:\Tawanagent\TAWAN-OS\02_STUDY\2026-Semester\Cloud_Computing\Cloud_Project\DISNEY_LORCANA_PLAYLAB_CLOUD\docs\DocUpdate24_08_2026\images"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width":1440,"height":900}, device_scale_factor=2)
        page = await ctx.new_page()
        page.set_default_timeout(20000)

        # 1. Landing page
        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(2500)
        await page.screenshot(path=f"{OUT}\\cap_01_landing_full.png", full_page=True)
        await page.screenshot(path=f"{OUT}\\cap_01_landing_hero.png")
        print("landing ok")

        # 2. Login with test account io5 / io5io5
        try:
            login_btn = page.locator("button:has-text('เข้าสู่ระบบ'), button:has-text('Login'), [class*=login]").first
            await login_btn.click(timeout=8000)
            await page.wait_for_timeout(1500)
            await page.screenshot(path=f"{OUT}\\cap_02_login_modal.png")
            print("login modal ok")
        except Exception as e:
            print("login btn fail:", e)

        # fill credentials (try common inputs)
        try:
            u = page.locator("input[type=text], input[type=email], input[name*=user], input[placeholder*='ชื่อ'], input[placeholder*='User']").first
            pw = page.locator("input[type=password]").first
            await u.fill("io5"); await pw.fill("io5io5")
            await page.screenshot(path=f"{OUT}\\cap_03_login_filled.png")
            sub = page.locator("button[type=submit], button:has-text('เข้าสู่ระบบ')").first
            await sub.click()
            await page.wait_for_timeout(4000)
            await page.screenshot(path=f"{OUT}\\cap_04_after_login.png", full_page=True)
            print("after login ok, url:", page.url)
        except Exception as e:
            print("cred fail:", e)

        await browser.close()

asyncio.run(main())
