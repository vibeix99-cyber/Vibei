/**
 * Wave 3 round 1, N2 (N-2): opening a History row's "Edit brew" by pointer or touch does not move the page.
 *
 * The row the person tapped stays where they saw it (|Δtop| ≤ 2 px, `scrollY` unchanged) from the moment of the tap,
 * through the sheet being open and settled, and after it closes (Close, Escape) or saves. The row's place is read on
 * every animation frame from the tap until the sheet has been open and still for five frames, so a scroll that comes
 * and goes cannot slip between two reads. (After Save the page may be scrolled by the height of the "Brew updated" strip
 * that arrives above the list, to keep what is in view still; the row is what must not move.)
 *
 *   KETTLE_PORT=5565 npx playwright test tests/w3-history-focus-scroll.spec.ts --project=chromium
 *
 * Each test is its own browser context (a disposable profile) with a frozen start date. The page is scrolled to put the
 * target row in the middle of the screen (instant, by script), then the tap is real input: mouse down / up on desktop
 * sizes, a touch tap on the phone.
 */
import { test, expect, type Browser, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */

const MONDAY = Date.parse('2026-10-12T07:40:00Z');
test.use({ trace: 'off' });
/** The most a row may move (px) between where the person saw it and any frame of the open, the close or the save. */
const TOL = 2;

type Cfg = { id: string; w: number; h: number; pct: 100 | 200; reduced: boolean; theme: 'light' | 'dark'; touch: boolean };
const CFGS: Cfg[] = [
  { id: '1440×900 @200 % reduced motion, light (where X-11 was found)', w: 1440, h: 900, pct: 200, reduced: true, theme: 'light', touch: false },
  { id: '1440×900 @100 %, light', w: 1440, h: 900, pct: 100, reduced: false, theme: 'light', touch: false },
  { id: '390×844 phone, touch, light', w: 390, h: 844, pct: 100, reduced: false, theme: 'light', touch: true },
  { id: '390×844 phone, touch, dark', w: 390, h: 844, pct: 100, reduced: false, theme: 'dark', touch: true },
];

const PRIME = `(() => {
  try {
    if (localStorage.getItem('kettle:settings')) return;
    const state = { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true };
    localStorage.setItem('kettle:settings', JSON.stringify({ state, version: 1 }));
  } catch {}
})();`;

async function boot(browser: Browser, c: Cfg) {
  const ctx = await browser.newContext({
    viewport: { width: c.w, height: c.h },
    deviceScaleFactor: c.touch ? 2 : 1,
    isMobile: c.touch,
    hasTouch: c.touch,
    colorScheme: c.theme,
    reducedMotion: c.reduced ? 'reduce' : 'no-preference',
  });
  await ctx.addInitScript(PRIME);
  if (c.pct !== 100)
    await ctx.addInitScript((pct) => {
      addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = `html{font-size:${pct}%!important}`;
        document.head.appendChild(s);
      });
    }, c.pct);
  const page = await ctx.newPage();
  await page.clock.install({ time: MONDAY });
  await page.clock.resume();
  await page.goto(`/?debug&seed=veteran&theme=${c.theme}#/stats`);
  await page.waitForFunction(() => !!(window as any).__kettle?.timerInfo, null, { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const rows = page.locator('main button[aria-label*="Edit"]');
  await rows.first().waitFor({ timeout: 15_000 });
  return { ctx, page, rows };
}

/** Start recording the row's top and the page's `scrollY` on every frame (until `stopRec`). */
const startRec = (page: Page, i: number) =>
  page.evaluate((i) => {
    const li = [...document.querySelectorAll('main button[aria-label*="Edit"]')][i].closest('li')!;
    const rec = ((window as any).__rec = { frames: [] as [number, number, number][], stop: false });
    const f = () => {
      if (rec.stop) return;
      rec.frames.push([Math.round(performance.now()), li.getBoundingClientRect().top, scrollY]);
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }, i);

/** Wait until the row and the page have been still for `n` frames (cap `ms`); resolves with the last frame read. */
const still = (page: Page, i: number, n = 5, ms = 4000) =>
  page.evaluate(
    ([i, n, ms]) =>
      new Promise<{ top: number; sy: number; settled: boolean }>((done) => {
        const li = [...document.querySelectorAll('main button[aria-label*="Edit"]')][i as number].closest('li')!;
        const t0 = performance.now();
        let last = `${li.getBoundingClientRect().top}:${scrollY}`;
        let count = 0;
        const f = () => {
          const top = li.getBoundingClientRect().top;
          const now = `${top}:${scrollY}`;
          count = now === last ? count + 1 : 0;
          last = now;
          if (count >= (n as number) || performance.now() - t0 > (ms as number)) done({ top, sy: scrollY, settled: count >= (n as number) });
          else requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }),
    [i, n, ms] as const,
  );

/** Stop recording; how far the row and the page strayed from where they were seen, over every recorded frame. */
async function stopRec(page: Page, seen: { top: number; sy: number }) {
  return page.evaluate((seen) => {
    const rec = (window as any).__rec;
    rec.stop = true;
    const fr: [number, number, number][] = rec.frames;
    let dTop = 0;
    let dSy = 0;
    for (const [, top, sy] of fr) {
      dTop = Math.max(dTop, Math.abs(top - seen.top));
      dSy = Math.max(dSy, Math.abs(sy - seen.sy));
    }
    return { frames: fr.length, dTop, dSy };
  }, seen);
}

/** Put row `i` in the middle of the screen (instant), and wait until it is still. Returns where the person sees it. */
async function showMid(page: Page, i: number) {
  await page.evaluate((i) => {
    const li = [...document.querySelectorAll('main button[aria-label*="Edit"]')][i].closest('li')!;
    const r = li.getBoundingClientRect();
    window.scrollTo({ top: scrollY + r.top - (innerHeight / 2 - r.height / 2), behavior: 'instant' as ScrollBehavior });
  }, i);
  await page.waitForTimeout(300);
  await still(page, i, 8);
  return page.evaluate((i) => {
    const b = [...document.querySelectorAll('main button[aria-label*="Edit"]')][i] as HTMLElement;
    const q = b.getBoundingClientRect();
    return { top: b.closest('li')!.getBoundingClientRect().top, sy: scrollY, x: q.left + q.width / 2, y: q.top + q.height / 2, h: q.height };
  }, i);
}

/** A real tap on the row's middle: pointer down and up (mouse), or a touch tap. Checks the row is what is hit there. */
async function tapRow(page: Page, c: Cfg, i: number, at: { x: number; y: number }) {
  const hit = await page.evaluate(([i, x, y]) => {
    const b = [...document.querySelectorAll('main button[aria-label*="Edit"]')][i as number];
    const e = document.elementFromPoint(x as number, y as number);
    return !!e && b.contains(e);
  }, [i, at.x, at.y] as const);
  expect(hit, 'the row is what is under the finger').toBe(true);
  if (c.touch) await page.touchscreen.tap(at.x, at.y);
  else {
    await page.mouse.move(at.x, at.y);
    await page.waitForTimeout(60);
    await page.mouse.down();
    await page.waitForTimeout(50);
    await page.mouse.up();
  }
}

const IDX = 2;

for (const c of CFGS) {
  test.describe(c.id, () => {
    test('a tap on a History row opens Edit brew and the row, and the page, stay where the person saw them; Close and Escape too', async ({ browser }) => {
      const { ctx, page, rows } = await boot(browser, c);
      try {
        for (const how of ['Close', 'Escape'] as const) {
          const seen = await showMid(page, IDX);
          await startRec(page, IDX);
          await tapRow(page, c, IDX, seen);
          const edit = page.getByRole('dialog', { name: 'Edit brew' });
          await edit.waitFor({ timeout: 10_000 });
          // Open and settled: the sheet's spring is over and the row has been still for five frames.
          await page.waitForTimeout(700);
          const open = await still(page, IDX, 5);
          expect(open.settled, `${how}: the row and the page are still once the sheet is open`).toBe(true);
          const dOpen = await stopRec(page, seen);
          expect(dOpen.dSy, `${how}: scrollY never moved from the tap to the open sheet (${dOpen.frames} frames; seen ${seen.sy})`).toBeLessThanOrEqual(0);
          expect(dOpen.dTop, `${how}: the row never moved more than ${TOL} px from the tap to the open sheet (seen at ${seen.top})`).toBeLessThanOrEqual(TOL);

          await startRec(page, IDX);
          if (how === 'Close') await edit.getByRole('button', { name: 'Close' }).click();
          else await page.keyboard.press('Escape');
          await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 });
          await page.waitForTimeout(300);
          const closed = await still(page, IDX, 5);
          expect(closed.settled).toBe(true);
          const dClose = await stopRec(page, seen);
          expect(dClose.dSy, `${how}: scrollY never moved from the close to after it`).toBeLessThanOrEqual(0);
          expect(dClose.dTop, `${how}: the row stays where it was seen through the close`).toBeLessThanOrEqual(TOL);
          expect(Math.abs(closed.top - seen.top), `${how}: the row is where it was seen after the sheet has closed`).toBeLessThanOrEqual(TOL);
          expect(await rows.nth(IDX).evaluate((b) => document.activeElement === b), `${how}: focus returns to the row`).toBe(true);
        }
      } finally {
        await ctx.close();
      }
    });

    test('Save: the row stays where it was seen', async ({ browser }) => {
      const { ctx, page } = await boot(browser, c);
      try {
        const seen = await showMid(page, IDX);
        await tapRow(page, c, IDX, seen);
        const edit = page.getByRole('dialog', { name: 'Edit brew' });
        await edit.waitFor({ timeout: 10_000 });
        await page.waitForTimeout(700);
        await startRec(page, IDX);
        const save = edit.getByRole('button', { name: 'Save' });
        await save.scrollIntoViewIfNeeded();
        if (c.touch) {
          const b = (await save.boundingBox())!;
          await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
        } else await save.click();
        await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 });
        await page.waitForTimeout(300);
        const after = await still(page, IDX, 5);
        expect(after.settled).toBe(true);
        const d = await stopRec(page, seen);
        // Saving raises "Brew updated" in the page's notice strip, above the list: the strip's arrival is kept out of
        // view by scrolling the page by its height in the same frame (src/ui/moment.ts keepStill; the I10 rule). So
        // `scrollY` may change here by the strip's height; what the person sees, the row, must not.
        test.info().annotations.push({ type: 'save scrollY change (the notice strip kept out of view)', description: `${Math.round(d.dSy)} px` });
        expect(d.dTop, 'the row stays where it was seen through Save').toBeLessThanOrEqual(TOL);
        expect(Math.abs(after.top - seen.top)).toBeLessThanOrEqual(TOL);
      } finally {
        await ctx.close();
      }
    });
  });
}

/* ---------------- what must not change: the keyboard and Delete ---------------- */

const KEYCFGS: Cfg[] = [CFGS[0], CFGS[2]];
const rowAt = (page: Page, i: number) =>
  page.evaluate((i) => {
    const b = [...document.querySelectorAll('main button[aria-label*="Edit"]')][i] as HTMLElement;
    const q = b.closest('li')!.getBoundingClientRect();
    return { top: q.top, bottom: q.bottom, sy: scrollY, ih: innerHeight };
  }, i);
/** Tab from the top of the page until a History row has focus (cap 200). Returns the index of that row. */
async function tabToRow(page: Page, from = 0) {
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    (document.activeElement as HTMLElement | null)?.blur();
  });
  await page.waitForTimeout(200);
  for (let n = 0; n < 200; n++) {
    await page.keyboard.press('Tab');
    const i = await page.evaluate(() => [...document.querySelectorAll('main button[aria-label*="Edit"]')].indexOf(document.activeElement as Element));
    if (i >= from) return i;
  }
  throw new Error('Tab never reached a History row');
}
const focusLabel = (page: Page) => page.evaluate(() => (document.activeElement?.getAttribute('aria-label') || (document.activeElement as HTMLElement | null)?.innerText || '').trim());

for (const c of KEYCFGS) {
  test.describe(`keyboard and Delete, ${c.id}`, () => {
    test('Tab brings an off-screen row into view; Enter and Space open Edit brew; closing returns focus to the row', async ({ browser }) => {
      const { ctx, page } = await boot(browser, c);
      try {
        const i = await tabToRow(page);
        const at = await rowAt(page, i);
        expect(at.sy, 'the page scrolled to bring the row it reached by Tab into view').toBeGreaterThan(0);
        expect(at.top >= -1 && at.bottom <= at.ih + 1, `the row reached by Tab is in view (${Math.round(at.top)}–${Math.round(at.bottom)} of ${at.ih})`).toBe(true);
        for (const key of ['Enter', 'Space'] as const) {
          const seen = await rowAt(page, i);
          await page.keyboard.press(key);
          const edit = page.getByRole('dialog', { name: 'Edit brew' });
          await edit.waitFor({ timeout: 10_000 });
          await page.waitForTimeout(700);
          await page.keyboard.press('Escape');
          await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 });
          await page.waitForTimeout(300);
          expect(await page.evaluate((i) => document.activeElement === [...document.querySelectorAll('main button[aria-label*="Edit"]')][i], i), `${key}: focus returns to the row`).toBe(true);
          const after = await rowAt(page, i);
          expect(Math.abs(after.top - seen.top), `${key}: the row has not moved`).toBeLessThanOrEqual(TOL);
        }
      } finally {
        await ctx.close();
      }
    });

    test('Delete from the keyboard: the row turns into its Undo in its exact place, focus lands on the Undo, Undo restores the row', async ({ browser }) => {
      const { ctx, page, rows } = await boot(browser, c);
      try {
        const before = await rows.count();
        const i = await tabToRow(page);
        const label = (await rows.nth(i).getAttribute('aria-label'))!;
        const seen = await rowAt(page, i);
        await page.keyboard.press('Enter');
        await page.getByRole('dialog', { name: 'Edit brew' }).waitFor({ timeout: 10_000 });
        await page.waitForTimeout(700);
        for (let n = 0; n < 30 && (await focusLabel(page)) !== 'Delete this brew'; n++) await page.keyboard.press('Tab');
        expect(await focusLabel(page)).toBe('Delete this brew');
        await page.keyboard.press('Enter');
        await page.getByRole('dialog', { name: 'Delete this brew?' }).waitFor({ timeout: 10_000 });
        await page.waitForTimeout(700);
        for (let n = 0; n < 6 && (await focusLabel(page)) !== 'Delete'; n++) await page.keyboard.press('Tab');
        expect(await focusLabel(page)).toBe('Delete');
        await page.keyboard.press('Enter');
        const undo = page.locator('[data-undo-for="history-delete"]');
        await expect(undo).toBeVisible();
        await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 });
        await page.waitForTimeout(400);
        const u = await undo.evaluate((r) => ({ top: r.getBoundingClientRect().top, sy: scrollY }));
        expect(Math.abs(u.top - seen.top), `the Undo is the deleted row, in place (row ${Math.round(seen.top)}, Undo ${Math.round(u.top)})`).toBeLessThanOrEqual(TOL);
        expect(
          await page.evaluate(() => !!document.activeElement?.closest('[data-undo-for="history-delete"]') && document.activeElement?.tagName === 'BUTTON'),
          'from the keyboard, focus lands on the Undo',
        ).toBe(true);
        await page.keyboard.press('Enter');
        await expect(rows).toHaveCount(before);
        expect(await rows.nth(i).getAttribute('aria-label')).toBe(label);
      } finally {
        await ctx.close();
      }
    });

    test('Delete by pointer or touch: the row turns into its Undo in its exact place; Undo restores the row', async ({ browser }) => {
      const { ctx, page, rows } = await boot(browser, c);
      try {
        const before = await rows.count();
        const seen = await showMid(page, IDX);
        const label = (await rows.nth(IDX).getAttribute('aria-label'))!;
        await tapRow(page, c, IDX, seen);
        const edit = page.getByRole('dialog', { name: 'Edit brew' });
        await edit.waitFor({ timeout: 10_000 });
        await page.waitForTimeout(700);
        const tap = async (name: string, dlg = edit) => {
          const b = dlg.getByRole('button', { name, exact: true });
          await b.scrollIntoViewIfNeeded();
          const q = (await b.boundingBox())!;
          if (c.touch) await page.touchscreen.tap(q.x + q.width / 2, q.y + q.height / 2);
          else await page.mouse.click(q.x + q.width / 2, q.y + q.height / 2);
        };
        await tap('Delete this brew');
        const confirm = page.getByRole('dialog', { name: 'Delete this brew?' });
        await confirm.waitFor({ timeout: 10_000 });
        await page.waitForTimeout(700);
        await tap('Delete', confirm);
        const undo = page.locator('[data-undo-for="history-delete"]');
        await expect(undo).toBeVisible();
        await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 });
        await page.waitForTimeout(400);
        const u = await undo.evaluate((r) => ({ top: r.getBoundingClientRect().top, sy: scrollY }));
        expect(Math.abs(u.top - seen.top), `the Undo is the deleted row, in place (row ${Math.round(seen.top)}, Undo ${Math.round(u.top)})`).toBeLessThanOrEqual(TOL);
        await undo.getByRole('button', { name: /^Undo/ }).click();
        await expect(rows).toHaveCount(before);
        expect(await rows.nth(IDX).getAttribute('aria-label')).toBe(label);
      } finally {
        await ctx.close();
      }
    });
  });
}
