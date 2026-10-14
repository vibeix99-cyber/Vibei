/**
 * W3R1 F-T2-1: a notice leaving never moves content under a pending or just-landed tap.
 *
 * Today right after End: "Saved 3 minutes of focus" heads Today's strip. With nobody touching the page, its time runs
 * out and it goes at rest. On the base (4d36939) the strip then closes and everything below it moves up by the notice's
 * height (72 px at 1440×900 @200, 68 px at 390×844): a tap aimed at "Mark done" a moment before lands on what moved
 * into its place. Now the notice's face goes but the strip keeps its room until giving it back moves nothing in view.
 *
 *  1. Mark done is measured every frame from Today's first moments until well after the notice has gone: it never
 *     moves. A real tap at the place Mark done was seen before the notice went then lands on Mark done (its inline
 *     Undo is drawn in its place).
 *  2. The room stays while the page is scrolled over it and back (nothing moves by layout); the next screen starts
 *     with no room at all.
 *
 *   KETTLE_PORT=5501 npx playwright test tests/w3-notices.spec.ts --project=chromium
 */
import { test, expect, type Browser, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
test.use({ trace: 'off' });
test.describe.configure({ mode: 'parallel' });

type Cfg = { w: number; h: number; pct: 100 | 200; reduced: boolean; theme: 'light' | 'dark' };
const CFGS: Cfg[] = [
  { w: 1440, h: 900, pct: 200, reduced: true, theme: 'light' },
  { w: 390, h: 844, pct: 100, reduced: false, theme: 'light' },
  { w: 390, h: 844, pct: 100, reduced: false, theme: 'dark' },
  { w: 1440, h: 900, pct: 100, reduced: false, theme: 'dark' },
  { w: 844, h: 390, pct: 100, reduced: false, theme: 'dark' },
];

async function open(browser: Browser, c: Cfg) {
  const phone = c.w < 900;
  const ctx = await browser.newContext({
    viewport: { width: c.w, height: c.h },
    deviceScaleFactor: phone ? 2 : 1,
    isMobile: phone,
    hasTouch: phone,
    colorScheme: c.theme,
    reducedMotion: c.reduced ? 'reduce' : 'no-preference',
  });
  await ctx.addInitScript((pct) => {
    try {
      localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
    } catch {
      /* ignore */
    }
    if (pct !== 100)
      addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = `html{font-size:${pct}%!important}`;
        document.head.appendChild(s);
      });
  }, c.pct);
  const page = await ctx.newPage();
  await page.clock.install({ time: MONDAY });
  await page.clock.resume();
  return { ctx, page, touch: phone };
}

/** Brew "Chapter 3 notes" for 3 minutes, then End it with real taps / clicks: Today with End's notice. */
async function todayAfterEnd(page: Page, url: string, theme: string, touch: boolean) {
  await page.goto(`${url}/?debug&seed=newbie&theme=${theme}#/`);
  await page.waitForFunction(() => {
    const i = (window as any).__kettle?.timerInfo?.();
    return !!(i && i.leader && i.leaderForMs > 400 && !i.settling);
  }, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  const tap = async (loc: ReturnType<Page['locator']>) => {
    await loc.scrollIntoViewIfNeeded();
    const b = (await loc.boundingBox())!;
    if (touch) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  };
  const field = page.getByRole('textbox', { name: /What are you brewing/ });
  await tap(field);
  await page.keyboard.type('Chapter 3 notes');
  await expect(field).toHaveValue('Chapter 3 notes');
  await tap(page.getByRole('button', { name: /^Put the kettle on · / }));
  await page.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => (window as any).__kettle.ff(3 * 60_000));
  await page.waitForTimeout(400);
  await tap(page.getByRole('button', { name: 'End session' }).first());
  const sheet = page.getByRole('dialog', { name: 'Leave the kettle early?' });
  await sheet.waitFor({ timeout: 10_000 });
  await page.waitForTimeout(500);
  // Watch Mark done from here: its top (in the viewport) every frame, and whether a notice is drawn.
  await page.evaluate(() => {
    const W = window as any;
    W.__mark = { tops: [] as { t: number; top: number; sy: number; li: number }[], stop: false };
    const f = () => {
      if (W.__mark.stop) return;
      const b = document.querySelector('button[aria-label^="Mark “Chapter 3 notes” done"]');
      if (b && location.hash === '#/') W.__mark.tops.push({ t: performance.now(), top: b.getBoundingClientRect().top, sy: scrollY, li: document.querySelectorAll('[data-notice-strip] li').length });
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  await tap(sheet.getByRole('button', { name: 'End session' }));
  await page.waitForFunction(() => location.hash === '#/', null, { timeout: 15_000 });
  await expect(page.locator('[data-notice-strip] li', { hasText: /^Saved 3 minutes of focus/ })).toHaveCount(1, { timeout: 15_000 });
}

for (const c of CFGS) {
  const name = `${c.w}×${c.h} ${c.theme} ${c.pct} %${c.reduced ? ' reduced motion' : ''}`;

  test(`End's notice goes at rest and nothing moves: a tap aimed at Mark done before it went lands on Mark done (${name})`, async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    const { ctx, page, touch } = await open(browser, c);
    await todayAfterEnd(page, base(baseURL), c.theme, touch);
    const mark = page.getByRole('button', { name: /^Mark “Chapter 3 notes” done/ });
    // Bring Mark done on screen and on top first where it is not (under the docked start, or below the fold: real
    // wheel steps), then keep still: no input from here.
    const onTop = () =>
      mark.evaluate((b) => {
        const r = b.getBoundingClientRect();
        const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return r.top >= 0 && r.bottom <= innerHeight && !!h && b.contains(h);
      });
    for (let i = 0; i < 20 && !(await onTop()); i++) {
      await page.mouse.move(Math.round(c.w / 2), Math.round(c.h / 3));
      await page.mouse.wheel(0, 60);
      await page.waitForTimeout(400);
    }
    expect(await onTop(), 'Mark done brought on top by real wheel').toBe(true);
    await page.mouse.move(1, c.h - 1).catch(() => {});
    // Where the person sees Mark done while the notice is shown (and aims at it).
    await page.waitForTimeout(300);
    const aimed = await mark.evaluate((b) => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top, at: performance.now() }; });
    // The notice's time runs out with nobody touching the page: it goes at rest.
    await expect(page.locator('[data-notice-strip] li')).toHaveCount(0, { timeout: 20_000 });
    const gone = await page.evaluate(() => ({ ...(window as any).__kettle.notices(), now: performance.now() }));
    await page.waitForTimeout(1500);
    const tops = await page.evaluate(() => (window as any).__mark.tops as { t: number; top: number; sy: number; li: number }[]);
    const after = tops.filter((f) => f.t >= aimed.at);
    const moved = after.filter((f) => Math.abs(f.top - aimed.top) > 0.5);
    test.info().annotations.push({ type: 'facts', description: JSON.stringify({ aimed, why: gone.why, frames: after.length, framesWithNotice: after.filter((f) => f.li).length, moved: moved.slice(0, 5) }) });
    expect(gone.why, 'the notice went at rest').toBe('rest');
    expect(after.some((f) => f.li) && after.some((f) => !f.li), 'frames before and after the notice went were measured').toBe(true);
    expect(moved, `Mark done moved on screen when the notice went (aimed at top ${aimed.top})`).toEqual([]);
    // The tap the person aimed before the notice went: it lands on Mark done.
    if (touch) await page.touchscreen.tap(aimed.x, aimed.y);
    else await page.mouse.click(aimed.x, aimed.y);
    await expect(page.locator('[data-undo-for="mark-done"]'), 'the tap reached Mark done: its Undo is drawn').toBeVisible({ timeout: 5_000 });
    await ctx.close();
  });
}

test('the room a gone notice keeps stays while the page is scrolled over it and back: nothing in view moves (390×844, 200 %)', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const c: Cfg = { w: 390, h: 844, pct: 200, reduced: false, theme: 'light' };
  const { ctx, page, touch } = await open(browser, c);
  await todayAfterEnd(page, base(baseURL), c.theme, touch);
  await page.mouse.move(1, c.h - 1).catch(() => {});
  await expect(page.locator('[data-notice-strip] li')).toHaveCount(0, { timeout: 20_000 });
  const strip = page.locator('[data-notice-strip][data-room]');
  await expect(strip, 'the strip keeps its room, empty').toHaveCount(1);
  const room = await strip.evaluate((e) => e.getBoundingClientRect().height);
  expect(room).toBeGreaterThan(40);
  expect(await strip.evaluate((e) => e.textContent), 'nothing in the room').toBe('');
  // Watch: anything in the page moving by layout (its page position changing), from here to the end.
  await page.evaluate(() => {
    const W = window as any;
    const el = document.querySelector('button[aria-label^="Mark “Chapter 3 notes” done"]')!;
    W.__lay = { el, p0: el.getBoundingClientRect().top + scrollY, moved: [] as number[], stop: false };
    const f = () => {
      if (W.__lay.stop) return;
      const d = W.__lay.el.getBoundingClientRect().top + scrollY - W.__lay.p0;
      if (Math.abs(d) > 0.5) W.__lay.moved.push(Math.round(d));
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  // Real touch drags: down until the room is wholly above the view, rest there, then back to the top.
  const cdp = await ctx.newCDPSession(page);
  const drag = async (dy: number) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 420 }] });
    for (let k = 1; k <= 6; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 420 - (k * dy) / 6 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(250);
  };
  for (let i = 0; i < 12; i++) {
    const b = await page.evaluate(() => document.querySelector('[data-notice-strip]')!.getBoundingClientRect().bottom);
    if (b < -20) break;
    await drag(150);
  }
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => (window as any).__kettle.notices().room), 'still kept, scrolled above the view at rest').toBeGreaterThan(40);
  for (let i = 0; i < 12 && (await page.evaluate(() => scrollY)) > 0; i++) await drag(-200);
  await page.waitForTimeout(800);
  const moved = await page.evaluate(() => { const W = window as any; W.__lay.stop = true; return W.__lay.moved as number[]; });
  test.info().annotations.push({ type: 'facts', description: JSON.stringify({ room, moved: moved.slice(0, 5) }) });
  expect(moved, 'nothing moved by layout while the page was scrolled over the room and back').toEqual([]);
  await ctx.close();
});

test('a new screen starts with no room: Today after End, then Stats and back (375×667, 100 %)', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const c: Cfg = { w: 375, h: 667, pct: 100, reduced: false, theme: 'light' };
  const { ctx, page, touch } = await open(browser, c);
  await todayAfterEnd(page, base(baseURL), c.theme, touch);
  await page.mouse.move(1, c.h - 1).catch(() => {});
  await expect(page.locator('[data-notice-strip] li')).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator('[data-notice-strip][data-room]')).toHaveCount(1);
  const link = page.getByRole('link', { name: 'Stats' }).first();
  const b = (await link.boundingBox())!;
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForFunction(() => location.hash === '#/stats');
  await page.waitForTimeout(600);
  expect(await page.locator('[data-notice-strip][data-room]').count(), 'no room on Stats').toBe(0);
  expect(await page.evaluate(() => (window as any).__kettle.notices().room)).toBe(0);
  const home = page.getByRole('link', { name: 'Today' }).first();
  const h = (await home.boundingBox())!;
  await page.touchscreen.tap(h.x + h.width / 2, h.y + h.height / 2);
  await page.waitForFunction(() => location.hash === '#/');
  await page.waitForTimeout(600);
  const hs = await page.evaluate(() => [...document.querySelectorAll('[data-notice-strip]')].map((e) => e.getBoundingClientRect().height));
  expect(hs.every((x) => x === 0), `Today's strip takes no room again (${hs})`).toBe(true);
  await ctx.close();
});
