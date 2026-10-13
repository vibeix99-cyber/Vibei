/**
 * The tea break and Break's over at 200 % text (I04, round-6 follow-up 12): every control can be reached by a real
 * mouse wheel, a real touch drag and the keyboard (Tab, then Shift+Tab back, the browser bringing the focused control
 * into view) — on a short phone, a tall phone and a landscape phone. Pressing "Pause break" keeps "Resume break" under
 * the finger. At 100 % text nothing there needs scrolling.
 *
 * Before the fix the session panel cut these controls off below the screen's edge, with nothing that scrolled (document
 * 0/0, no scrolling ancestor): "Resume break" at y 706 of 667, "That's all for now" at 840 of 667 and 927 of 844, and
 * "Resume break" / "Mark it done" / "Put the kettle on" at 428 / 430 / 548 of 390.
 *
 * Reaching is done with real input only (page.mouse.wheel, CDP touch events, page.keyboard): never scrollIntoView,
 * scrollTo or scrollTop from the test. The debug API is used to set the state up (start a brew, finish the clock,
 * pause the break); "Tea time" is pressed by a real tap.
 *
 *   KETTLE_PORT=5227 npx playwright test tests/break-reach.spec.ts --project=chromium
 */
import { test, expect, type Browser, type Page, type CDPSession } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
test.use({ trace: 'off' });

type Theme = 'light' | 'dark';
type Spot = { top: number; bottom: number; cx: number; cy: number; vis: [number, number]; full: boolean; hit: boolean; ok: boolean; focused: boolean; aim: { x: number; top: number; bottom: number } };

const SKIP = /^Skip break$/;
const PAUSE = /^Pause break$/;
const RESUME = /^Resume break$/;
const NEXT = /^Start next brew$/;
const MARK = /^Mark it done/;
const PUT = /^Put the kettle on/;
const LEAVE = /^That's all for now$/;

/**
 * The seven weekdays, frozen (page.clock.install + resume: the date is fixed, time then runs). The day's recipes depend
 * on it: on recipe-completion days (Monday, Thursday) the break's end raises "Recipe done", which is now in the panel's
 * notice strip (src/ui/Toast.tsx), in the page flow, so it can never take the scroll gesture (I10, W2R3).
 */
const DAYS = {
  Mon: '2026-10-12T07:40:00.000Z',
  Tue: '2026-10-13T07:40:00.000Z',
  Wed: '2026-10-14T07:40:00.000Z',
  Thu: '2026-10-15T07:40:00.000Z',
  Fri: '2026-10-16T07:40:00.000Z',
  Sat: '2026-10-17T07:40:00.000Z',
  Sun: '2026-10-18T07:40:00.000Z',
} as const;
type Day = keyof typeof DAYS;

async function phone(browser: Browser, w: number, h: number, theme: Theme, pct: number, day: Day = 'Sun') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  await ctx.addInitScript((pct) => {
    try {
      if (!localStorage.getItem('kettle:settings'))
        localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
    } catch {
      /* private mode: defaults */
    }
    if (pct !== 100)
      addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = `html{font-size:${pct}%!important}`;
        document.head.appendChild(s);
      });
  }, pct);
  const page = await ctx.newPage();
  await page.clock.install({ time: Date.parse(DAYS[day]) });
  await page.clock.resume();
  return { ctx, page, cdp: await ctx.newCDPSession(page) };
}

/** Today → a short brew (with or without a task) → the summary → "Tea time" by a real tap → the tea break. */
async function toBreak(page: Page, baseURL: string | undefined, theme: Theme, task: boolean) {
  await page.goto(`${base(baseURL)}/?debug&seed=newbie&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
  await page.waitForFunction(() => !!(window as any).__kettle, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  await page.evaluate((task) => (window as any).__kettle.timer.getState().startFocus(task ? { intention: 'Chapter 3 notes', tag: 'study' } : {}), task);
  await page.waitForTimeout(2000);
  await page.evaluate(() => (window as any).__kettle.nearEnd());
  await page.waitForTimeout(400);
  await page.evaluate(() => (window as any).__kettle.finish());
  const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
  await tea.waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForTimeout(2400);
  const b = (await tea.boundingBox())!;
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForTimeout(1800);
}

async function toBreakOver(page: Page) {
  await page.evaluate(() => (window as any).__kettle.finish());
  await page.getByRole('button', { name: PUT }).waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForTimeout(2400);
}

/** Where a session control is, and whether it is wholly on screen (inside every clipping ancestor) and hit-testable. */
function spot(page: Page, re: RegExp): Promise<Spot | null> {
  return page.evaluate((src) => {
    const rx = new RegExp(src);
    const name = (b: Element) => (b.getAttribute('aria-label') || b.textContent || '').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
    const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && !b.closest('[aria-hidden="true"], [inert]') && rx.test(name(b));
    });
    if (!el) return null;
    const r = el.getBoundingClientRect();
    let t = 0, b = innerHeight, l = 0, rt = innerWidth;
    for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const q = e.getBoundingClientRect();
      t = Math.max(t, q.top + e.clientTop);
      b = Math.min(b, q.top + e.clientTop + e.clientHeight);
      l = Math.max(l, q.left + e.clientLeft);
      rt = Math.min(rt, q.left + e.clientLeft + e.clientWidth);
    }
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const full = r.top >= t - 1 && r.bottom <= b + 1 && r.left >= l - 1 && r.right <= rt + 1;
    const at = cx >= l && cx < rt && cy >= t && cy < b ? document.elementFromPoint(cx, cy) : null;
    const hit = !!at && el.contains(at);
    const p = document.querySelector('[data-focus-view] main')!.getBoundingClientRect();
    return {
      top: r.top, bottom: r.bottom, cx, cy, vis: [t, b] as [number, number], full, hit, ok: full && hit, focused: document.activeElement === el,
      aim: { x: Math.round((Math.max(0, p.left) + Math.min(innerWidth, p.right)) / 2), top: Math.max(0, p.top), bottom: Math.min(innerHeight, p.bottom) },
    };
  }, re.source);
}

/** One wheel notch (dy) or one finger drag (sign of dy) over the panel. */
async function nudge(page: Page, cdp: CDPSession, how: 'wheel' | 'touch', aim: Spot['aim'], dy: number) {
  if (how === 'wheel') {
    await page.mouse.move(aim.x, Math.round((aim.top + aim.bottom) / 2));
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(250);
    return;
  }
  const span = Math.max(40, Math.min(160, aim.bottom - aim.top - 24));
  const y0 = dy > 0 ? Math.round(aim.bottom - 12) : Math.round(aim.top + 12);
  const y1 = dy > 0 ? y0 - span : y0 + span;
  const n = Math.max(4, Math.round(span / 8));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: aim.x, y: y0 }] });
  for (let i = 1; i <= n; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: aim.x, y: Math.round(y0 + ((y1 - y0) * i) / n) }] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(450);
}

/** Scroll toward the control (wheel notches or drags) until it is wholly on screen and hit-testable, or nothing moves. */
async function reach(page: Page, cdp: CDPSession, how: 'wheel' | 'touch', re: RegExp) {
  let s = await spot(page, re);
  let still = 0;
  for (let i = 0; s && !s.ok && i < 24 && still < 3; i++) {
    const below = (s.top + s.bottom) / 2 > (s.vis[0] + s.vis[1]) / 2;
    await nudge(page, cdp, how, s.aim, below ? 100 : -100);
    const n = await spot(page, re);
    still = n && Math.abs(n.top - s.top) < 1 ? still + 1 : 0;
    s = n;
  }
  return s;
}

/** Every control, top to bottom and back, by the wheel, then by touch, then by Tab / Shift+Tab. */
async function everyControlReached(page: Page, cdp: CDPSession, controls: RegExp[]) {
  for (const how of ['wheel', 'touch'] as const)
    for (const re of [...controls, ...[...controls].reverse()]) {
      const s = await reach(page, cdp, how, re);
      expect(s, `${re} is on the screen`).not.toBeNull();
      expect(s!.ok, `${how}: ${re} brought wholly into view (centre y ${Math.round(s!.cy)}, visible ${s!.vis.map(Math.round).join('–')})`).toBe(true);
    }
  for (const key of ['Tab', 'Shift+Tab'] as const) {
    const left = [...controls];
    for (let i = 0; i < 20 && left.length; i++) {
      await page.keyboard.press(key);
      await page.waitForTimeout(200);
      for (const re of [...left]) {
        const s = await spot(page, re);
        if (!s?.focused) continue;
        expect(s.ok, `${key}: focused ${re} is in view (centre y ${Math.round(s.cy)}, visible ${s.vis.map(Math.round).join('–')})`).toBe(true);
        left.splice(left.indexOf(re), 1);
      }
    }
    expect(left.map(String), `${key} reaches every control`).toEqual([]);
  }
}

const SIZES = [
  [375, 667, 'light'],
  [390, 844, 'dark'],
  [844, 390, 'light'],
] as const;

// Every weekday at the smallest size; the recipe days (Monday, Thursday) and a day without one (Sunday) at the others.
// BREAK_REACH_ALL_DAYS=1: all seven at every size.
const ALL_DAYS = Object.keys(DAYS) as Day[];
for (const [w, h, theme] of SIZES)
  for (const day of process.env.BREAK_REACH_ALL_DAYS || w === 375 ? ALL_DAYS : (['Mon', 'Thu', 'Sun'] as Day[]))
    test(`200 % text, ${w}×${h} ${theme}, ${day}: Break's over with a carried task — Mark it done, Put the kettle on and That's all for now reachable by wheel, touch and Tab`, async ({ browser, baseURL }) => {
      test.setTimeout(180_000);
      const { ctx, page, cdp } = await phone(browser, w, h, theme, 200, day);
      await toBreak(page, baseURL, theme, true);
      await toBreakOver(page);
      const said = await page.evaluate(() => [...((window as any).__kettle.noticesSaid()?.children ?? [])].map((p: Element) => p.textContent));
      test.info().annotations.push({ type: `notices on ${day}`, description: JSON.stringify(said) });
      await everyControlReached(page, cdp, [MARK, PUT, LEAVE]);
      await ctx.close();
    });

for (const [w, h, theme] of [
  [375, 667, 'dark'],
  [844, 390, 'dark'],
] as const)
  test(`200 % text, ${w}×${h} ${theme}: the paused tea break — Skip break, Resume break and Start next brew reachable by wheel, touch and Tab`, async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    const { ctx, page, cdp } = await phone(browser, w, h, theme, 200);
    await toBreak(page, baseURL, theme, false);
    await page.evaluate(() => (window as any).__kettle.timer.getState().pause());
    await page.getByRole('button', { name: 'Resume break' }).waitFor({ state: 'attached' });
    await page.waitForTimeout(1200);
    await everyControlReached(page, cdp, [SKIP, RESUME, NEXT]);
    await ctx.close();
  });

test('200 % text, 375×667: tapping Pause break leaves Resume break under the finger, and back', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const { ctx, page } = await phone(browser, 375, 667, 'light', 200);
  await toBreak(page, baseURL, 'light', false);
  const p = (await spot(page, PAUSE))!;
  expect(p.hit, 'Pause break can be tapped as the break opens').toBe(true);
  await page.touchscreen.tap(Math.round(p.cx), Math.round(p.cy));
  await page.getByRole('button', { name: 'Resume break' }).waitFor({ state: 'attached' });
  await page.waitForTimeout(900);
  const r = (await spot(page, RESUME))!;
  expect(r.hit, `Resume break is where the finger is (centre y ${Math.round(r.cy)})`).toBe(true);
  expect(Math.abs(r.cy - p.cy)).toBeLessThanOrEqual(2);
  await page.touchscreen.tap(Math.round(r.cx), Math.round(r.cy));
  await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached' });
  await page.waitForTimeout(900);
  const p2 = (await spot(page, PAUSE))!;
  expect(p2.hit, `Pause break is back under the finger (centre y ${Math.round(p2.cy)})`).toBe(true);
  await ctx.close();
});

test('100 % text, 375×667 and 390×844: the break and Break’s over fit without scrolling — every control wholly on screen', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  for (const [w, h] of [
    [375, 667],
    [390, 844],
  ] as const) {
    const { ctx, page } = await phone(browser, w, h, 'light', 100);
    await toBreak(page, baseURL, 'light', true);
    const scrolls = () => page.evaluate(() => { const m = document.querySelector('[data-focus-view] main')!; return m.scrollHeight - m.clientHeight; });
    // At rest: no notice in the panel's strip (on a recipe day the break's end shows one first, in the panel's flow).
    const noNotice = () => expect(page.locator('[data-focus-view] [data-notice-strip] li')).toHaveCount(0, { timeout: 15_000 });
    for (const re of [SKIP, PAUSE, NEXT]) expect((await spot(page, re))?.ok, `${w}×${h} break: ${re}`).toBe(true);
    expect(await scrolls(), `${w}×${h} break: nothing to scroll`).toBeLessThanOrEqual(0);
    await toBreakOver(page);
    await noNotice();
    for (const re of [MARK, PUT, LEAVE]) expect((await spot(page, re))?.ok, `${w}×${h} Break's over: ${re}`).toBe(true);
    expect(await scrolls(), `${w}×${h} Break's over: nothing to scroll`).toBeLessThanOrEqual(0);
    await ctx.close();
  }
});
