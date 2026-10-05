import { test, expect, type Page } from '@playwright/test';

// Mulberry32 seeded Math.random: the dice duel and the opening hands repeat between runs.
// ponytail: the hand depends on how often the app calls Math.random; if a run cannot ink/play, change SEED.
const SEED = 0xc0ffee;
const seedRandom = `(() => { let s = ${SEED}; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;

const handToggle = /Your Hand|การ์ดบนมือ/i;
const inkBtn = /Add to Inkwell|ใส่เป็นหมึก/i;
const playBtn = /Play to Field|ลงสู่สนาม/i;

// The tray opens on mouse hover and closes 150 ms after the mouse leaves; the same button also toggles on
// click, so a click would close it again. Hover again before every card because the card dialog moves the
// mouse outside the tray.
const ensureHandOpen = async (page: Page) => {
  await page.getByRole('button', { name: handToggle }).hover();
  await expect(page.getByTestId('hand-card').first()).toBeVisible();
};

// Open each hand card in turn and press the first enabled action button that matches `action`.
const useHandCard = async (page: Page, action: RegExp, what: string) => {
  await ensureHandOpen(page);
  const count = await page.getByTestId('hand-card').count();
  for (let i = 0; i < count; i++) {
    await ensureHandOpen(page);
    await page.getByTestId('hand-card').nth(i).click({ timeout: 5000 });
    const btn = page.getByRole('button', { name: action });
    if ((await btn.count()) > 0 && (await btn.first().isEnabled())) {
      await btn.first().click({ timeout: 5000 });
      // The card dialog may stay open after the action; close it so it cannot cover the next card
      await page.getByRole('button', { name: 'Close', exact: true }).click({ timeout: 1000 }).catch(() => {});
      return;
    }
    await page.getByRole('button', { name: 'Close', exact: true }).click({ timeout: 2000 }).catch(() => {});
  }
  throw new Error(`no card in hand could ${what}; change SEED in e2e/07-four-turn-game.spec.ts`);
};

const passTurn = async (page: Page) => {
  // PlayerControlsBar owns the button: "Pass Turn" in English, "จบเทิร์น" in Thai
  const btn = page.getByRole('button', { name: /Pass Turn|จบเทิร์น/i });
  // Move off any card so a hover tooltip cannot sit over the bottom-right controls
  await page.mouse.move(5, 5);
  await expect(btn).toBeEnabled({ timeout: 10000 });
  await btn.click();
};

const waitMyTurn = async (page: Page, turn: number) => {
  await expect(page.getByText(/YOUR TURN/i).first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(new RegExp(`TURN ${turn}\\b`)).first()).toBeVisible({ timeout: 10000 });
};

test.describe('T15: 4-turn two-player game E2E QA suite', () => {
  test('TC-E2E-25: 2 players run dice duel, mulligan, ink, play, quest and challenge over 4 turns', async ({
    browser,
    baseURL,
  }) => {
    test.skip(!process.env.E2E_BASE_URL, 'needs deployed stack: set E2E_BASE_URL=http://<alb-dns>');
    test.setTimeout(180000);

    const loginAndJoin = async (username: string) => {
      const ctx = await browser.newContext();
      const password = 'E2e-pass-2026';
      await ctx.request.post(`${baseURL}/api/auth/register`, {
        data: { username, email: `${username}@e2e.test`, password },
      });
      const res = await ctx.request.post(`${baseURL}/api/auth/login`, {
        data: { username, password },
      });
      expect(res.ok()).toBeTruthy();
      const { token, user } = await res.json();
      await ctx.addInitScript(seedRandom);
      await ctx.addInitScript(
        ([t, u]) => {
          sessionStorage.setItem('lorcana_token', t);
          sessionStorage.setItem('lorcana_user', u);
        },
        [token, JSON.stringify(user)]
      );
      const page = await ctx.newPage();
      await page.goto('/?tab=match');
      return { ctx, page, username };
    };

    const runId = Date.now().toString(36);
    const p1 = await loginAndJoin(`p1_4turn_${runId}`);
    const p2 = await loginAndJoin(`p2_4turn_${runId}`);

    try {
      // Room
      await p1.page.getByRole('button', { name: /Create Room|สร้างห้อง/i }).click();
      const roomCode =
        (await p1.page.locator('p.font-mono.text-5xl, p.text-5xl').first().textContent({ timeout: 15000 }))?.trim() ?? '';
      expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
      await p2.page.getByPlaceholder(/Room Code|รหัสห้อง/i).fill(roomCode);
      await p2.page.getByRole('button', { name: /Join Room|เข้าร่วม/i }).click();

      // Dice duel: P1 picks ODD, P2 picks EVEN, so exactly one of them wins (no tie)
      await p1.page.getByTestId('dice-odd').click({ timeout: 20000 });
      await p2.page.getByTestId('dice-even').click({ timeout: 20000 });
      // Locators of two different pages cannot be combined with .or(), so poll both pages
      const p1PlayFirst = p1.page.getByTestId('dice-play-first');
      const p2PlayFirst = p2.page.getByTestId('dice-play-first');
      const waitForWinner = async (): Promise<boolean> => {
        for (const end = Date.now() + 25000; Date.now() < end; ) {
          if (await p1PlayFirst.isVisible()) return true;
          if (await p2PlayFirst.isVisible()) return false;
          await p1.page.waitForTimeout(250);
        }
        throw new Error('dice duel: neither player was offered the turn-order choice within 25 s');
      };
      const p1Won = await waitForWinner();
      await (p1Won ? p1PlayFirst : p2PlayFirst).click();
      const [first, second] = p1Won ? [p1, p2] : [p2, p1];

      // Mulligan: both keep
      for (const p of [first, second]) {
        await expect(p.page.getByTestId('mulligan-keep')).toBeVisible({ timeout: 20000 });
        await p.page.getByTestId('mulligan-keep').click();
        await expect(p.page.getByRole('dialog')).toBeHidden();
      }
      await expect(first.page.getByText(/YOUR TURN/i).first()).toBeVisible({ timeout: 15000 });
      await expect(second.page.getByText(/OPPONENT'S TURN/i).first()).toBeVisible({ timeout: 15000 });

      // TURN 1 (first): ink, play a character, state syncs to the opponent's screen
      await useHandCard(first.page, inkBtn, 'be added to the inkwell');
      await useHandCard(first.page, playBtn, 'be played with 1 ink');
      await expect(first.page.getByTestId('field-card')).toHaveCount(1);
      await expect(second.page.getByTestId('opp-card')).toHaveCount(1, { timeout: 10000 });
      await passTurn(first.page);

      // TURN 2 (second): same
      await waitMyTurn(second.page, 2);
      await useHandCard(second.page, inkBtn, 'be added to the inkwell');
      await useHandCard(second.page, playBtn, 'be played with 1 ink');
      await expect(second.page.getByTestId('field-card')).toHaveCount(1);
      await expect(first.page.getByTestId('opp-card')).toHaveCount(1, { timeout: 10000 });
      await passTurn(second.page);

      // TURN 3 (first): quest with the character from turn 1; it exerts and cannot quest twice
      await waitMyTurn(first.page, 3);
      const quest = first.page.getByRole('button', { name: 'Quest', exact: true }).first();
      await expect(quest).toBeEnabled();
      await quest.click();
      await expect(quest).toBeDisabled();
      await passTurn(first.page);

      // TURN 4 (second): challenge the exerted character; attacker exerts, so its Quest button disables
      await waitMyTurn(second.page, 4);
      await second.page.getByTestId('challenge-attacker').first().click();
      await second.page.getByTestId('opp-card').first().click();
      // The challenge resolved: the defender was either banished (gone from both screens) or took damage.
      // Two cheap characters often banish each other, so do not assume the attacker survives.
      await expect
        .poll(
          async () =>
            (await second.page.getByTestId('opp-card').count()) === 0 ||
            (await second.page.getByText(/^-\d+$/).count()) > 0,
          { timeout: 10000 }
        )
        .toBe(true);
      if ((await second.page.getByTestId('opp-card').count()) === 0) {
        // Banish must sync: the defender's owner no longer has it on the field
        await expect(first.page.getByTestId('field-card')).toHaveCount(0, { timeout: 10000 });
      }
    } finally {
      await p1.ctx.close();
      await p2.ctx.close();
    }
  });
});
