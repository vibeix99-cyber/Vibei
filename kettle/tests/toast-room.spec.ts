/**
 * Notices and the storage-full banner (I04 R4-D1, R5-D1, LEAD-D1, round 7 R7-D1, round 8), carried to I10 (W2R3:
 * notices without overlays). The banner is in Today's page (src/app/SaveWarning.tsx); notices are in each screen's
 * in-flow strip (src/ui/Toast.tsx), one at a time. With REAL input (mouse wheel, touch drag) and the notices' REAL
 * clocks (none held), every frame: the banner is never removed, never below full opacity, its "Save backup" inside its
 * own box, and it never moves on screen under the person (no layout move of it within 1.15 s of their input or while
 * they touch; a strip that changes while it is above the view is compensated in the same frame); every notice is drawn
 * whole when it is shown. Recorded every frame, for 2 s past the last input.
 *
 *   KETTLE_PORT=5222 npx playwright test tests/toast-room.spec.ts --project=chromium
 */
import { test, expect, type Page, type BrowserContext, type CDPSession } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
const BANNER = 'section[data-save-warning]';
// Real input must follow at a person's pace; tracing (a snapshot per action) would slow every step and hide races.
test.use({ trace: 'off' });

async function setUp(ctx: BrowserContext, pct: number) {
  await ctx.addInitScript((pct) => {
    try {
      if (!localStorage.getItem('kettle:settings'))
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
  }, pct);
}

/** Storage really full, a brew ended after 12 minutes (with a level-up: two toasts): Today with the banner. */
async function bannerAfterEnd(page: Page, url: string, { levelUp = false, theme = 'light' }: { levelUp?: boolean; theme?: 'light' | 'dark' } = {}) {
  const ready = () =>
    page.waitForFunction(() => {
      const i = (window as any).__kettle?.timerInfo?.();
      return !!(i && i.leader && i.leaderForMs > 400 && !i.settling);
    }, null, { timeout: 60_000 });
  await page.goto(`${url}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
  await ready();
  await page.evaluate(() => (window as any).__kettle.seed('newbie'));
  await page.reload();
  await ready();
  await page.evaluate(() => document.fonts.ready);
  if (levelUp)
    await page.evaluate(async () => {
      const { leavesForLevel, levelFromLeaves } = await import('/src/progress/levels.ts' as string);
      const L = levelFromLeaves((window as any).__kettle.progress.getState().leaves).level;
      (window as any).__kettle.progress.setState({ leaves: leavesForLevel(L + 1) - 1 });
    });
  const quota = await page.evaluate(() => {
    let c = 'x'.repeat(1 << 20);
    let i = 0;
    while (c.length >= 1) {
      try {
        localStorage.setItem(`filler${i++}`, c);
      } catch {
        c = c.slice(0, c.length / 2);
      }
    }
    try {
      localStorage.setItem('probe', 'x'.repeat(64));
      return 'no error';
    } catch (e) {
      return (e as Error).name;
    }
  });
  expect(quota).toBe('QuotaExceededError');
  await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(2500);
  await page.evaluate(() => (window as any).__kettle.ff(12 * 60_000 + 5_000));
  await page.waitForTimeout(500);
  await page.evaluate(() => (window as any).__kettle.timer.getState().end('user'));
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
  await page.waitForSelector(BANNER, { timeout: 10_000 });
  // Today has finished cross-fading in from the session screen (the whole page fades in; the banner with it).
  await page.waitForTimeout(1200);
  // From here on: every time the banner leaves the page, and every frame.
  await record(page);
}

/** The frame recorder: the banner (gone, faded, clipped, moved on screen by layout near input) and every notice drawn. */
async function record(page: Page) {
  await page.evaluate((B) => {
    const R: any = ((window as any).__rec = { frames: [], gone: 0, toasts: new Set<string>(), whole: new Set<string>(), notWholeFrames: 0, movedNearInput: [], lastInput: -1e9, down: 0 });
    for (const t of ['pointerdown', 'pointerup', 'pointercancel', 'wheel', 'touchstart', 'touchmove', 'touchend', 'keydown'])
      addEventListener(
        t,
        (e) => {
          R.lastInput = performance.now();
          if (e.type === 'pointerdown') R.down++;
          if (e.type === 'pointerup' || e.type === 'pointercancel') R.down = Math.max(0, R.down - 1);
        },
        { capture: true, passive: true },
      );
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.removedNodes) if (n instanceof Element && (n.matches(B) || n.querySelector(B))) R.gone++;
    }).observe(document.body, { childList: true, subtree: true });
    let prev: { top: number; page: number } | null = null;
    const tick = () => {
      if (R.stop) return;
      const now = performance.now();
      const b = document.querySelector(B) as HTMLElement | null;
      let op = 0;
      for (let e: HTMLElement | null = b, o = 1; e && e !== document.documentElement; e = e.parentElement) op = o *= +getComputedStyle(e).opacity;
      const r = b?.getBoundingClientRect();
      const a = b?.querySelector('button')?.getBoundingClientRect();
      const inside = !!(r && a && a.top >= r.top - 0.5 && a.bottom <= r.bottom + 0.5 && a.left >= r.left - 0.5 && a.right <= r.right + 0.5);
      R.frames.push([now, b ? op : 0, r ? r.top + scrollY : null, inside ? 1 : 0]);
      if (r) {
        const cur = { top: r.top, page: r.top + scrollY };
        // Moved within the page (layout, not scrolling) AND on screen, within 1.15 s of input or while touching.
        if (prev && Math.abs(cur.page - prev.page) > 0.5 && Math.abs(cur.top - prev.top) > 0.5 && (now - R.lastInput < 1150 || R.down > 0))
          R.movedNearInput.push({ at: Math.round(now), by: Math.round(cur.page - prev.page), sinceInput: Math.round(now - R.lastInput) });
        prev = cur;
      }
      // Every notice drawn: whole (its own height laid out, wholly on screen, on top at its middle) or not yet in view.
      for (const li of document.querySelectorAll('[data-notice-strip] li') as NodeListOf<HTMLElement>) {
        R.toasts.add(li.id);
        const q = li.getBoundingClientRect();
        const hit = document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2);
        if (li.scrollHeight > li.clientHeight + 1) R.notWholeFrames++;
        if (q.top >= -0.5 && q.bottom <= innerHeight + 0.5 && hit && li.contains(hit)) R.whole.add(li.id);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, BANNER);
}

async function scroll(page: Page, cdp: CDPSession | null, x: number, y: number, dy: number) {
  if (!cdp) {
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, dy);
  } else {
    // A finger drag: the content follows the finger, so scrolling the content down drags the finger up.
    const dir = dy > 0 ? -1 : 1;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(x), y: Math.round(y) }] });
    for (let i = 1; i <= Math.round(Math.abs(dy) / 8); i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(x), y: Math.round(y + dir * i * 8) }] });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await page.waitForTimeout(140);
}

/** Where the person reads the notice now (its middle), or null when none is drawn. */
const noticeAt = (page: Page) =>
  page.evaluate(() => {
    const li = document.querySelector('[data-notice-strip] li');
    if (!li) return null;
    const q = li.getBoundingClientRect();
    return { x: (q.left + q.right) / 2, y: Math.min(innerHeight - 10, Math.max(10, (q.top + q.bottom) / 2)), id: li.id };
  });

async function finish(page: Page) {
  const lastInput = await page.evaluate(() => performance.now());
  await page.waitForTimeout(2200);
  return page.evaluate((t) => {
    const R = (window as any).__rec;
    R.stop = true;
    return {
      frames: R.frames.length,
      msAfter: R.frames.length ? R.frames[R.frames.length - 1][0] - t : 0,
      gone: R.gone,
      faded: R.frames.filter((f: number[]) => f[1] < 0.98).length,
      clipped: R.frames.filter((f: number[]) => !f[3]).length,
      movedNearInput: R.movedNearInput,
      notWholeFrames: R.notWholeFrames,
      notWhole: [...R.toasts].filter((id: string) => !R.whole.has(id)),
      toasts: R.toasts.size,
    };
  }, lastInput);
}

const queueLength = (page: Page) => page.evaluate(() => (window as any).__kettle.notices().queue.length as number);

for (const [w, h, pct, levelUp] of [
  [375, 667, 200, false],
  [844, 390, 200, false],
  // End after 12 minutes with a level-up: two notices, one after the other.
  [667, 375, 200, true],
] as const) {
  for (const how of ['wheel', 'touch'] as const) {
    test(`the storage-full banner stays in the page, whole and steady, while ${levelUp ? 'every notice' : 'the notices'} in the strip ${levelUp ? 'is' : 'are'} read by ${how} (${w}×${h}, ${pct} % text)`, async ({
      browser,
      baseURL,
    }) => {
      test.setTimeout(120_000);
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
      await setUp(ctx, pct);
      const page = await ctx.newPage();
      await bannerAfterEnd(page, base(baseURL), { levelUp });
      const cdp: CDPSession | null = how === 'touch' ? await ctx.newCDPSession(page) : null;
      // The page, scrolled over the notice and back (each notice on its real clock, nothing held): down until the strip
      // has left the view, then back up to the top.
      for (const dir of [1, -1]) {
        // Down 12 steps; then back up until the page is at its top again (a touch drag can fling further than it went).
        for (let i = 0; i < (dir > 0 ? 12 : 60); i++) {
          const at = (await noticeAt(page)) ?? { x: Math.round(w / 2), y: Math.round(h / 3) };
          await scroll(page, cdp, at.x, at.y, dir * 40);
          const top = await page.evaluate(() => scrollY);
          if (dir < 0 && top <= 0) break;
        }
      }
      expect(await page.evaluate(() => scrollY), 'back at the top, where the strip is').toBe(0);
      // Until every notice has been shown and has gone (the clock runs only while the strip is in view).
      if (!cdp) await page.mouse.move(2, 2);
      await expect.poll(() => queueLength(page), { timeout: 30_000 }).toBe(0);
      await expect(page.locator('[data-notice-strip] li')).toHaveCount(0, { timeout: 10_000 });
      // The page: the banner scrolls with it; bring its "Save backup" into view by real input and use it.
      const pageAt = async () => page.locator(BANNER).getByRole('button', { name: 'Save backup' }).boundingBox();
      const dockTop = () => page.evaluate(() => document.querySelector('[data-length], [class*="ctaDock"]')?.getBoundingClientRect().top ?? innerHeight);
      for (let i = 0; i < 40; i++) {
        const a = (await pageAt())!;
        const d = Math.min(await dockTop(), h * 0.55);
        if (a.y >= 0 && a.y + a.height <= d - 2) break;
        const x = Math.round(a.x + a.width / 2);
        await scroll(page, cdp, x, Math.round(Math.max(10, Math.min(a.y + a.height / 2, d - 10))), a.y < 0 ? -40 : 40);
      }
      if (!cdp) await page.mouse.move(2, 2);
      const r = await finish(page);
      expect(r.msAfter, 'recorded past the last input').toBeGreaterThanOrEqual(2000);
      expect(r.gone, 'times the banner left the page').toBe(0);
      expect(r.faded, `frames without the banner at full opacity (of ${r.frames})`).toBe(0);
      expect(r.movedNearInput, 'the banner moved on screen by layout within 1.15 s of input').toEqual([]);
      expect(r.clipped, 'frames with Save backup outside the banner').toBe(0);
      expect(r.toasts, 'notices shown').toBeGreaterThanOrEqual(levelUp ? 2 : 1);
      expect(r.notWhole, 'notices never wholly on screen').toEqual([]);
      expect(r.notWholeFrames, 'frames with a notice cut short').toBe(0);
      await expect
        .poll(() =>
          page.locator(BANNER).getByRole('button', { name: 'Save backup' }).evaluate((el) => {
            const q = el.getBoundingClientRect();
            const top = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2);
            return !!top && el.contains(top) ? true : `${Math.round(q.y)}–${Math.round(q.bottom)} under ${top?.tagName}.${top?.className}`;
          }),
          { timeout: 15_000 },
        )
        .toBe(true);
      const a = (await pageAt())!;
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        how === 'touch' ? page.touchscreen.tap(a.x + a.width / 2, a.y + a.height / 2) : page.mouse.click(a.x + a.width / 2, a.y + a.height / 2),
      ]);
      expect(await download.suggestedFilename()).toMatch(/\.json$/);
      await ctx.close();
    });
  }
}

// R5-D1 / LEAD-D1 shapes: notices time out on their real clocks while the person scrolls; the update prompt (no end)
// waits its turn behind them and then stays. The banner must not move under the person, fade or go.
for (const theme of ['light', 'dark'] as const) {
  test(`notices timing out, and the endless update prompt, never move the banner under the person (375×667, 200 % text, wheel, ${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
    await setUp(ctx, 200);
    const page = await ctx.newPage();
    await bannerAfterEnd(page, base(baseURL), { levelUp: true, theme });
    // (Setup) the PwaUpdatePrompt's notice, through the app's own toast(): no service-worker update on a dev server.
    await page.evaluate(() => (window as any).__kettle.toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => {} } }));
    for (let k = 0; k < 6; k++) {
      for (const dir of [1, -1]) {
        const at = (await noticeAt(page)) ?? { x: 187, y: 200 };
        await scroll(page, null, at.x, at.y, dir * 20);
        await page.waitForTimeout(400);
      }
    }
    await page.mouse.move(2, 2);
    // Every timed notice has been shown and gone by now; the prompt is the one left, shown.
    await expect.poll(() => page.evaluate(() => (window as any).__kettle.notices()), { timeout: 30_000 }).toMatchObject({ queue: [{ id: 'pwa-update' }], shown: 'pwa-update' });
    await expect(page.locator('[data-notice-strip] li')).toHaveCount(1);
    const r = await finish(page);
    expect(r.gone, 'times the banner left the page').toBe(0);
    expect(r.faded, `frames without the banner at full opacity (of ${r.frames})`).toBe(0);
    expect(r.movedNearInput, 'the banner moved on screen by layout within 1.15 s of input').toEqual([]);
    expect(r.clipped, 'frames with Save backup outside the banner').toBe(0);
    expect(r.notWholeFrames, 'frames with a notice cut short').toBe(0);
    await ctx.close();
  });
}

// The last notice leaving on its own clock: never over the docked start (it is in the page flow, above it), and gone
// only at a safe moment (src/ui/moment.ts): here, with the person not touching, at rest.
for (const [w, h] of [
  [375, 667],
  [844, 390],
] as const) {
  test(`the last notice leaves where it was, never over the docked start (${w}×${h}, 200 % text)`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await setUp(ctx, 200);
    const page = await ctx.newPage();
    await page.goto(`${base(baseURL)}/?debug&seed=veteran&theme=light&nooktime=day#/`);
    await page.waitForFunction(() => !!(window as any).__kettle);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    await page.evaluate(() => (window as any).__kettle.toast.dismiss());
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const R: any = ((window as any).__exit = { frames: 0, over: 0, seen: false });
      const tick = () => {
        if (R.stop) return;
        const ctrls = [...document.querySelectorAll('[data-length] :is(button, a[href], [role="button"], [role="radio"]), main button')]
          .filter((c) => !c.closest('[data-notice-strip]'))
          .map((c) => c.getBoundingClientRect())
          .filter((r) => r.width && r.height);
        for (const li of document.querySelectorAll('[data-notice-strip] li')) {
          R.seen = true;
          const d = li.getBoundingClientRect();
          if (+getComputedStyle(li).opacity > 0.02 && ctrls.some((c) => d.right > c.left + 0.5 && d.left < c.right - 0.5 && d.bottom > c.top + 0.5 && d.top < c.bottom - 0.5)) R.over++;
        }
        R.frames++;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.evaluate(() =>
      (window as any).__kettle.toast('Kettle couldn’t save your latest changes: this browser’s storage is full. Save a backup to keep them.', { tone: 'warning', duration: 1500, action: { label: 'Save backup', onClick() {} } }),
    );
    await page.waitForFunction(() => (window as any).__exit.seen && document.querySelectorAll('[data-notice-strip] li').length === 0, null, { timeout: 10_000, polling: 'raf' });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const R = (window as any).__exit;
      R.stop = true;
      return { frames: R.frames, over: R.over, why: (window as any).__kettle.notices().why };
    });
    expect(r.over, `frames with the notice over a control (of ${r.frames})`).toBe(0);
    expect(r.why, 'it went at rest').toBe('rest');
    await ctx.close();
  });
}

/** A Break's over at 200 % text: brew, finish, Tea time (a real tap), finish. */
async function breakOver(page: Page, url: string, theme: string) {
  await page.goto(`${url}/?debug&seed=newbie&theme=${theme}#/`);
  await page.waitForFunction(() => !!(window as any).__kettle, null, { timeout: 60_000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await page.waitForTimeout(1500);
  await page.evaluate(() => (window as any).__kettle.finish());
  const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
  await tea.waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForTimeout(2000);
  await tea.tap();
  await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => (window as any).__kettle.finish());
  await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached' });
  // Whatever the break's end brought (a recipe on some days) has been shown and gone.
  await expect.poll(() => queueLength(page), { timeout: 30_000 }).toBe(0);
  await expect(page.locator('[data-notice-strip] li')).toHaveCount(0, { timeout: 15_000 });
}

/** Every frame: these session controls on top at their middle and under no notice (counted per control). */
async function watchControls(page: Page, key: string, names: string[]) {
  await page.evaluate(
    ([K, N]) => {
      const w = window as any;
      const R = (w[K] = { frames: 0, drawn: 0, covered: {} as Record<string, number>, stop: false, clicks: [] as string[] });
      addEventListener('click', (e) => R.clicks.push(((e.target as Element).closest('button')?.getAttribute('aria-label') || (e.target as Element).closest('button')?.textContent || '').trim()), { capture: true });
      const norm = (s: string) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
      const f = () => {
        if (R.stop) return;
        // Each notice as drawn: clipped by every ancestor that clips (a strip scrolled up out of the panel is not drawn).
        const drawnBox = (li: Element) => {
          const q = li.getBoundingClientRect();
          let t = q.top, b = q.bottom, l = q.left, r = q.right;
          for (let e = li.parentElement; e && e !== document.documentElement; e = e.parentElement) {
            const cs = getComputedStyle(e);
            if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
            const c = e.getBoundingClientRect();
            t = Math.max(t, c.top); b = Math.min(b, c.bottom); l = Math.max(l, c.left); r = Math.min(r, c.right);
          }
          return { top: t, bottom: b, left: l, right: r, height: b - t, width: r - l };
        };
        const boxes = [...document.querySelectorAll('[data-notice-strip] li')].map(drawnBox).filter((q) => q.height > 0 && q.width > 0);
        if (boxes.length) R.drawn++;
        const main = document.querySelector('[data-focus-view] main') as HTMLElement;
        const mr = main.getBoundingClientRect();
        for (const n of N as string[]) {
          const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => new RegExp(n).test(norm(b.getAttribute('aria-label') || b.textContent || '')));
          if (!el) continue;
          const q = el.getBoundingClientRect();
          const inPanel = main.contains(el);
          const t = Math.max(q.top, 0, inPanel ? mr.top : 0), b = Math.min(q.bottom, innerHeight, inPanel ? mr.bottom : innerHeight);
          if (b - t < 8) continue;
          const hit = document.elementFromPoint(q.left + q.width / 2, (t + b) / 2);
          const under = boxes.some((o) => o.bottom > t + 0.5 && o.top < b - 0.5 && o.right > q.left + 0.5 && o.left < q.right - 0.5);
          if (!(hit && el.contains(hit)) || under) R.covered[n] = (R.covered[n] || 0) + 1;
        }
        R.frames++;
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    },
    [key, names] as const,
  );
}
const stopWatch = (page: Page, key: string) =>
  page.evaluate((K) => {
    const w = window as any;
    w[K].stop = true;
    return { frames: w[K].frames, drawn: w[K].drawn, covered: w[K].covered, clicks: w[K].clicks };
  }, key);

/** Scroll the session panel by real wheel / touch until `end` (its end, or its top). */
async function panelTo(page: Page, cdp: CDPSession | null, end: 'end' | 'top') {
  for (let i = 0; i < 40; i++) {
    const p = await page.evaluate(() => {
      const m = document.querySelector('[data-focus-view] main') as HTMLElement;
      const r = m.getBoundingClientRect();
      return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round(r.right - 24), y: Math.round(Math.min(innerHeight, r.bottom) - 40) };
    });
    if (end === 'end' ? p.st >= p.max - 1 : p.st <= 0) break;
    await scroll(page, cdp, p.x, p.y, end === 'end' ? 80 : -80);
  }
}

// Round 7 (R7-D1): Break's over scrolled to its end at 200 % text; three notices raised (one shown at a time, in the
// panel's strip, which has scrolled up with the panel): Close and every Break's over control stay on top and under no
// notice in every frame; a real click on Close while they wait reaches Close.
for (const theme of ['light', 'dark'] as const) {
  test(`three notices never cover the session top bar's Close or a Break's over control, panel scrolled to its end (375×667, 200 % text, ${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
    await setUp(ctx, 200);
    const page = await ctx.newPage();
    await breakOver(page, base(baseURL), theme);
    await panelTo(page, null, 'end');
    await page.mouse.move(2, 2);
    const names = ['^Close$', '^Mark it done', '^Put the kettle on', "^That's all for now$"];
    await watchControls(page, '__cc', names);
    await page.evaluate(() => {
      const k = (window as any).__kettle;
      for (const [m, tone] of [['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['Saved 12 minutes of focus', 'info'], ['Cozy level 5!', 'success']]) k.toast(m, { tone });
    });
    // The strip is above the view (scrolled with the panel): the first notice is laid out there at once, the page kept
    // still; it is drawn, waiting for the person to scroll up to it.
    await expect.poll(() => page.evaluate(() => (window as any).__kettle.notices().shown)).not.toBeNull();
    await page.waitForTimeout(1200);
    const r = await stopWatch(page, '__cc');
    expect(r.covered, `controls covered (frames, of ${r.frames})`).toEqual({});
    expect(await queueLength(page), 'all three waiting, none spent out of view').toBe(3);
    const close = (await page.getByRole('button', { name: 'Close' }).boundingBox())!;
    await page.mouse.click(close.x + close.width / 2, close.y + close.height / 2);
    expect(r.clicks.concat(await page.evaluate(() => (window as any).__cc.clicks))).toContain('Close');
    await ctx.close();
  });
}

// Round 8 (I04 R7-D1, landscape): Break's over at 200 % text, scrolled to its end by real wheel / touch and back; the
// update prompt, then two timed notices (one with an action). Every frame: no Break's over control and no Close under
// a notice. Each notice in turn whole, its action on top; a real click / tap on Undo and on Update reaches them.
for (const [w, h, how, theme] of [
  [667, 375, 'wheel', 'light'],
  [844, 390, 'touch', 'dark'],
] as const) {
  test(`the update prompt and every notice stay whole and tappable, never over a control, on Break's over scrolled to its end and back (${w}×${h}, 200 % text, ${how}, ${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
    await setUp(ctx, 200);
    const page = await ctx.newPage();
    const cdp = how === 'touch' ? await ctx.newCDPSession(page) : null;
    await breakOver(page, base(baseURL), theme);
    await page.evaluate(() => {
      const w = window as any;
      w.__upd = 0;
      w.__kettle.toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => w.__upd++ } });
    });
    await page.waitForTimeout(800);
    const names = ['^Close$', '^Mark it done', '^Put the kettle on', "^That's all for now$"];
    await watchControls(page, '__dc', names);
    const max = await page.evaluate(() => {
      const m = document.querySelector('[data-focus-view] main') as HTMLElement;
      return m.scrollHeight - m.clientHeight;
    });
    expect(max, 'Break’s over scrolls at this size').toBeGreaterThan(100);
    await panelTo(page, cdp, 'end');
    await page.waitForTimeout(400);
    await panelTo(page, cdp, 'top');
    const atRest = () =>
      page.evaluate(() => {
        const li = document.querySelector('[data-notice-strip] li') as HTMLElement | null;
        if (!li) return null;
        const q = li.getBoundingClientRect();
        const act = li.querySelector('button');
        let actionOnTop: boolean | null = null;
        if (act) {
          const a = act.getBoundingClientRect();
          const hit = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2);
          actionOnTop = !!hit && act.contains(hit) && a.width >= 24 && a.height >= 24;
        }
        return { text: (li.textContent || '').slice(0, 24), inView: q.top >= -0.5 && q.bottom <= innerHeight + 0.5, own: li.scrollHeight <= li.clientHeight + 1, actionOnTop };
      });
    expect(await atRest(), 'the update prompt whole, Update on top').toMatchObject({ text: expect.stringContaining('A fresh brew'), inView: true, own: true, actionOnTop: true });
    // Two timed notices: the prompt steps aside for them (at the next safe moment) and comes back after.
    await page.evaluate(() => {
      const w = window as any;
      w.__undo = 0;
      w.__kettle.toast('Cozy level 5!', { tone: 'success', duration: 60_000 });
      w.__kettle.toast('Marked “Chapter 3 notes” done', { tone: 'success', duration: 60_000, action: { label: 'Undo', onClick: () => w.__undo++ } });
    });
    if (!cdp) await page.mouse.move(2, 2);
    await expect.poll(async () => (await atRest())?.text ?? '', { timeout: 10_000 }).toContain('Marked');
    expect(await atRest(), 'the action notice whole, Undo on top').toMatchObject({ inView: true, own: true, actionOnTop: true });
    const tapOn = async (label: string) => {
      const box = (await page.locator('[data-notice-strip] li button', { hasText: label }).boundingBox())!;
      if (cdp) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
    };
    await tapOn('Undo');
    expect(await page.evaluate(() => (window as any).__undo), 'Undo reached').toBe(1);
    // Its going was the tap's answer: the next one ("Cozy level 5!") at once, whole.
    await expect.poll(async () => (await atRest())?.text ?? '', { timeout: 5_000 }).toContain('Cozy level');
    expect(await atRest()).toMatchObject({ inView: true, own: true });
    await page.evaluate(() => (window as any).__kettle.toast.dismiss(Object.values((window as any).__kettle.notices().queue).find((q: any) => /Cozy/.test(q.message)).id));
    await expect.poll(async () => (await atRest())?.text ?? '', { timeout: 10_000 }).toContain('A fresh brew');
    await tapOn('Update');
    expect(await page.evaluate(() => (window as any).__upd), 'Update reached').toBe(1);
    const r = await stopWatch(page, '__dc');
    expect(r.frames).toBeGreaterThan(60);
    expect(r.covered, `controls covered (frames, of ${r.frames})`).toEqual({});
    await ctx.close();
  });
}
