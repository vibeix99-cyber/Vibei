/**
 * Toasts in a short room with storage full (I04 R4-D1, R5-D1, LEAD-D1 → round 7): the storage-full warning is no
 * longer a toast but a banner in Today's page (src/app/SaveWarning.tsx), so no toast can move it, cover its action
 * for good or take it away. With REAL input (mouse wheel, touch drag) over the toasts and the page, and the toasts'
 * REAL timers (none held), the banner must stay in the page the whole time: never removed, at full opacity, at the
 * same place in the page (it scrolls with the page, nothing else moves it), its "Save backup" inside its own box;
 * and every toast in the room can still be brought wholly into view (the round-6 room behaviour). Recorded every
 * frame, for 2 s past the last input.
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
  await page.evaluate((B) => {
    const R: any = ((window as any).__rec = { frames: [], gone: 0, toasts: new Set<string>(), whole: new Set<string>() });
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.removedNodes) if (n instanceof Element && (n.matches(B) || n.querySelector(B))) R.gone++;
    }).observe(document.body, { childList: true, subtree: true });
    const tick = () => {
      if (R.stop) return;
      const b = document.querySelector(B) as HTMLElement | null;
      let op = 0;
      for (let e: HTMLElement | null = b, o = 1; e && e !== document.documentElement; e = e.parentElement) op = o *= +getComputedStyle(e).opacity;
      const r = b?.getBoundingClientRect();
      const a = b?.querySelector('button')?.getBoundingClientRect();
      const inside = !!(r && a && a.top >= r.top - 0.5 && a.bottom <= r.bottom + 0.5 && a.left >= r.left - 0.5 && a.right <= r.right + 0.5);
      R.frames.push([performance.now(), b ? op : 0, r ? r.top + scrollY : null, inside ? 1 : 0]);
      // Every toast in the room, and whether it is wholly on screen and on top (hit-tested at its middle).
      const list = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement | null;
      const lr = list?.getBoundingClientRect();
      const dockTop = document.querySelector('[data-toast-above]')?.getBoundingClientRect().top ?? innerHeight;
      for (const li of list ? ([...list.querySelectorAll(':scope > li')] as HTMLElement[]) : []) {
        R.toasts.add(li.id);
        const q = li.getBoundingClientRect();
        const hit = document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2);
        if (lr && q.top >= Math.max(0, lr.top) - 1 && q.bottom <= Math.min(innerHeight, lr.bottom, dockTop) + 1 && hit && li.contains(hit)) R.whole.add(li.id);
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

const toastState = (page: Page) =>
  page.evaluate(() => {
    const list = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement | null;
    if (!list || !list.children.length) return null;
    const lr = list.getBoundingClientRect();
    // Where a finger or pointer can rest on the stack: the toast with the most of it in view.
    let best: { h: number; x: number; y: number } | null = null;
    for (const li of list.children) {
      const q = li.getBoundingClientRect();
      const t = Math.max(q.top, lr.top, 0);
      const b = Math.min(q.bottom, lr.bottom, innerHeight);
      if (b - t > 8 && (!best || b - t > best.h)) best = { h: b - t, x: (q.left + q.right) / 2, y: (t + b) / 2 };
    }
    return best ? { ...best, st: list.scrollTop, max: list.scrollHeight - list.clientHeight, n: list.children.length } : null;
  });

async function finish(page: Page) {
  const lastInput = await page.evaluate(() => performance.now());
  await page.waitForTimeout(2200);
  return page.evaluate((t) => {
    const R = (window as any).__rec;
    R.stop = true;
    const tops = R.frames.filter((f: (number | null)[]) => f[2] !== null).map((f: number[]) => f[2]);
    return {
      frames: R.frames.length,
      msAfter: R.frames.length ? R.frames[R.frames.length - 1][0] - t : 0,
      gone: R.gone,
      faded: R.frames.filter((f: number[]) => f[1] < 0.98).length,
      drift: tops.length ? Math.max(...tops) - Math.min(...tops) : Infinity,
      clipped: R.frames.filter((f: number[]) => !f[3]).length,
      notWhole: [...R.toasts].filter((id: string) => !R.whole.has(id)),
      toasts: R.toasts.size,
    };
  }, lastInput);
}

for (const [w, h, pct, levelUp] of [
  [375, 667, 200, false],
  [844, 390, 200, false],
  // A 60 px room: End after 12 minutes with a level-up stacks two toasts nearly as tall as the room.
  [667, 375, 200, true],
] as const) {
  for (const how of ['wheel', 'touch'] as const) {
    test(`the storage-full banner stays in the page, whole and steady, while ${levelUp ? 'every toast' : 'the toasts'} in the room ${levelUp ? 'is' : 'are'} read by ${how} (${w}×${h}, ${pct} % text)`, async ({
      browser,
      baseURL,
    }) => {
      test.setTimeout(120_000);
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
      await setUp(ctx, pct);
      const page = await ctx.newPage();
      await bannerAfterEnd(page, base(baseURL), { levelUp });
      const cdp: CDPSession | null = how === 'touch' ? await ctx.newCDPSession(page) : null;
      // The toasts: down as far as the stack goes, then back up (each toast on its real timer, nothing held).
      for (const dir of [1, -1]) {
        for (let i = 0, still = 0; i < 40 && still < 2; i++) {
          const s = await toastState(page);
          if (!s) break;
          await scroll(page, cdp, s.x, s.y, dir * 20);
          const n = await toastState(page);
          still = n && n.st === s.st && n.n === s.n ? still + 1 : 0;
        }
      }
      // The page: the banner scrolls with it; bring its "Save backup" into view by real input and use it.
      // (Above the docked start: at 200 % text in landscape that leaves a strip of about 75 px, as for everything in
      // that column.)
      // (The toasts leave on their own timers first: a drag that starts on a toast scrolls the toasts.)
      if (!cdp) await page.mouse.move(2, 2);
      await expect(page.locator('[aria-label="Notifications"] li')).toHaveCount(0, { timeout: 20_000 });
      const pageAt = async () => page.locator(BANNER).getByRole('button', { name: 'Save backup' }).boundingBox();
      const dockTop = () => page.evaluate(() => document.querySelector('[data-toast-above]')?.getBoundingClientRect().top ?? innerHeight);
      for (let i = 0; i < 40; i++) {
        const a = (await pageAt())!;
        const d = Math.min(await dockTop(), h * 0.55);
        if (a.y >= 0 && a.y + a.height <= d - 2) break;
        const x = Math.round(a.x + a.width / 2);
        await scroll(page, cdp, x, Math.round(Math.max(10, Math.min(a.y + a.height / 2, d - 10))), a.y < 0 ? -40 : 40);
      }
      // The pointer leaves the stack (a resting pointer holds a toast's timer, as it should).
      if (!cdp) await page.mouse.move(2, 2);
      const r = await finish(page);
      expect(r.msAfter, 'recorded past the last input').toBeGreaterThanOrEqual(2000);
      expect(r.gone, 'times the banner left the page').toBe(0);
      expect(r.faded, `frames without the banner at full opacity (of ${r.frames})`).toBe(0);
      expect(r.drift, 'how far the banner moved within the page').toBeLessThanOrEqual(0.5);
      expect(r.clipped, 'frames with Save backup outside the banner').toBe(0);
      expect(r.toasts, 'toasts in the room').toBeGreaterThanOrEqual(levelUp ? 2 : 1);
      test.info().annotations.push({ type: 'toasts never wholly on screen (real timers, none held)', description: JSON.stringify(r.notWhole) });
      // Toasts float over the page (round-6 behaviour, unchanged) and leave on their own timers: once none is over it,
      // "Save backup" takes a real tap / click and saves a file.
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

// R5-D1 / LEAD-D1 shapes: the toasts time out on their real timers while the person scrolls; an action toast with
// no end (the update prompt's shape) sits in the room the whole time. The banner must not move, fade or go.
for (const theme of ['light', 'dark'] as const) {
  test(`toasts timing out, and an endless action toast, never move the banner (375×667, 200 % text, wheel, ${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
    await setUp(ctx, 200);
    const page = await ctx.newPage();
    await bannerAfterEnd(page, base(baseURL), { levelUp: true, theme });
    // (Setup) the PwaUpdatePrompt's toast, through the app's own toast(): no service-worker update on a dev server.
    await page.evaluate(async () => {
      const { toast } = await import('/src/ui/Toast.tsx' as string);
      toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => {} } });
    });
    for (let k = 0; k < 6; k++) {
      for (const dir of [1, -1]) {
        const s = await toastState(page);
        if (s) await scroll(page, null, s.x, s.y, dir * 20);
        await page.waitForTimeout(400);
      }
    }
    // Every toast but the endless one has timed out by now.
    await expect(page.locator('[aria-label="Notifications"] li')).toHaveCount(1, { timeout: 10_000 });
    const r = await finish(page);
    expect(r.gone, 'times the banner left the page').toBe(0);
    expect(r.faded, `frames without the banner at full opacity (of ${r.frames})`).toBe(0);
    expect(r.drift, 'how far the banner moved within the page').toBeLessThanOrEqual(0.5);
    expect(r.clipped, 'frames with Save backup outside the banner').toBe(0);
    await ctx.close();
  });
}

// The last toast leaving on its own timer: the list empties the moment it times out, but it is drawn (fading out) until
// its exit ends; the toasts' region must stay lifted until then, or it is drawn over the docked start meanwhile.
for (const [w, h] of [
  [375, 667],
  [844, 390],
] as const) {
  test(`the last toast fades out where it was, never over the docked start (${w}×${h}, 200 % text)`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await setUp(ctx, 200);
    const page = await ctx.newPage();
    await page.goto(`${base(baseURL)}/?debug&seed=veteran&theme=light&nooktime=day#/`);
    await page.waitForFunction(() => !!(window as any).__kettle);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    await page.evaluate(async () => (await import('/src/ui/Toast.tsx' as string)).toast.dismiss());
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const R: any = ((window as any).__exit = { frames: 0, over: 0, seen: false });
      const tick = () => {
        if (R.stop) return;
        const list = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement;
        const lr = list.getBoundingClientRect();
        const ctrls = [...document.querySelectorAll('[data-toast-above] :is(button, a[href], [role="button"])')].map((c) => c.getBoundingClientRect()).filter((r) => r.width && r.height);
        for (const li of list.querySelectorAll(':scope > li')) {
          R.seen = true;
          const r = li.getBoundingClientRect();
          const d = { l: Math.max(r.left, lr.left), t: Math.max(r.top, lr.top), r: Math.min(r.right, lr.right), b: Math.min(r.bottom, lr.bottom) };
          const drawn = +getComputedStyle(li).opacity > 0.02 && d.r > d.l && d.b > d.t;
          if (drawn && ctrls.some((c) => d.r > c.left + 0.5 && d.l < c.right - 0.5 && d.b > c.top + 0.5 && d.t < c.bottom - 0.5)) R.over++;
        }
        R.frames++;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.evaluate(async () => {
      const { toast } = await import('/src/ui/Toast.tsx' as string);
      toast('Kettle couldn’t save your latest changes: this browser’s storage is full. Save a backup to keep them.', { tone: 'warning', duration: 1500, action: { label: 'Save backup', onClick() {} } });
    });
    await page.waitForFunction(() => (window as any).__exit.seen && document.querySelectorAll('[aria-label="Notifications"] li').length === 0, null, { timeout: 10_000, polling: 'raf' });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => { const R = (window as any).__exit; R.stop = true; return { frames: R.frames, over: R.over }; });
    expect(r.over, `frames with the leaving toast drawn over the docked start (of ${r.frames})`).toBe(0);
    await ctx.close();
  });
}

// Round 7: with the session panel scrollable at 200 % text (break reach), Break's over scrolled to its end leaves a
// room from the top bar down to the action group; three toasts used to fill it up over the top bar's Close. The room
// now starts below the screen's top bar. Real wheel to the end, three toasts on their own timers, every frame checked
// for Close and every Break's over control, then a real click on Close while the three toasts are up.
for (const theme of ['light', 'dark'] as const) {
  test(`three toasts never cover the session top bar's Close or a Break's over control, panel scrolled to its end (375×667, 200 % text, ${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
    await setUp(ctx, 200);
    const page = await ctx.newPage();
    await page.goto(`${base(baseURL)}/?debug&seed=newbie&theme=${theme}#/`);
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
    await expect(page.locator('[aria-label="Notifications"] li')).toHaveCount(0, { timeout: 15_000 });
    // Scroll the panel to its end with the wheel.
    for (let i = 0; i < 30; i++) {
      const p = await page.evaluate(() => {
        const m = document.querySelector('[data-focus-view] main') as HTMLElement;
        const r = m.getBoundingClientRect();
        return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round((r.left + r.right) / 2), y: Math.round((Math.max(0, r.top) + Math.min(innerHeight, r.bottom)) / 2) };
      });
      if (p.st >= p.max - 1) break;
      await page.mouse.move(p.x, p.y);
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(200);
    }
    await page.mouse.move(2, 2);
    const names = ['^Close$', '^Mark it done', '^Put the kettle on', "^That's all for now$"];
    await page.evaluate((N) => {
      const w = window as any;
      const R = (w.__cc = { frames: 0, with3: 0, covered: {} as Record<string, number>, stop: false, clicks: [] as string[] });
      addEventListener('click', (e) => R.clicks.push(((e.target as Element).closest('button')?.getAttribute('aria-label') || '').trim()), { capture: true });
      const norm = (s: string) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
      const f = () => {
        if (R.stop) return;
        const ol = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement | null;
        const lis = [...document.querySelectorAll('[aria-label="Notifications"] li')];
        const clip = ol && getComputedStyle(ol).overflowY !== 'visible' ? ol.getBoundingClientRect() : null;
        const toasts = lis
          .map((li) => {
            const q = li.getBoundingClientRect();
            const r = clip ? { l: Math.max(q.left, clip.left), t: Math.max(q.top, clip.top), r: Math.min(q.right, clip.right), b: Math.min(q.bottom, clip.bottom) } : { l: q.left, t: q.top, r: q.right, b: q.bottom };
            return +getComputedStyle(li).opacity > 0.02 && r.r > r.l && r.b > r.t ? r : null;
          })
          .filter(Boolean) as { l: number; t: number; r: number; b: number }[];
        if (lis.length === 3) R.with3++;
        for (const n of N) {
          const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => new RegExp(n).test(norm(b.getAttribute('aria-label') || b.textContent || '')));
          if (!el) continue;
          const q = el.getBoundingClientRect();
          const t = Math.max(q.top, 0), b = Math.min(q.bottom, innerHeight);
          if (b - t < 8) continue;
          const hit = document.elementFromPoint(q.left + q.width / 2, (t + b) / 2);
          const under = toasts.some((o) => o.b > t + 1 && o.t < b - 1 && o.r > q.left + 1 && o.l < q.right - 1);
          if (!(hit && el.contains(hit)) || under) R.covered[n] = (R.covered[n] || 0) + 1;
        }
        R.frames++;
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }, names);
    await page.evaluate(async () => {
      const { toast } = await import('/src/ui/Toast.tsx' as string);
      for (const [m, tone] of [['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['Saved 12 minutes of focus', 'info'], ['Cozy level 5!', 'success']]) toast(m, { tone });
    });
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const w = window as any;
      w.__cc.stop = true;
      return { frames: w.__cc.frames, with3: w.__cc.with3, covered: w.__cc.covered };
    });
    expect(r.with3, 'frames with three toasts up').toBeGreaterThan(20);
    expect(r.covered, `controls covered (frames, of ${r.frames})`).toEqual({});
    // A real click on Close while the three toasts are still up reaches Close.
    await expect(page.locator('[aria-label="Notifications"] li')).toHaveCount(3);
    const close = (await page.getByRole('button', { name: 'Close' }).boundingBox())!;
    await page.mouse.click(close.x + close.width / 2, close.y + close.height / 2);
    expect(await page.evaluate(() => (window as any).__cc.clicks)).toContain('Close');
    await ctx.close();
  });
}

// Round 8 (I04 R7-D1): on a landscape phone at 200 % text, Break's over scrolled to its end (the only way to reach
// "Put the kettle on" there) brings its whole action group to the top of the screen. The room above it was a 27–42 px
// strip: the update prompt showed 11–26 of its px over the top bar's "Next: brew 2 of" line and Update could not be
// hit. With no room above the controls the stack now floats over the stage (a column with no control in it), every toast
// whole (or folded to its first line when three do not fit), every action hit-testable. REAL wheel or touch to the end;
// the update prompt is PwaUpdatePrompt's shape; the other toasts run on their own timers. Every frame: no Break's over
// control and no Close under a toast; at rest: every toast wholly in view, its action on top at its centre, no top-bar
// words under a toast; then a real click (wheel run) or CDP tap (touch run) on Update reaches it.
for (const [w, h, how, theme] of [
  [667, 375, 'wheel', 'light'],
  [844, 390, 'touch', 'dark'],
] as const) {
  test(`the update prompt and every toast stay whole and tappable, never over a control, on Break's over scrolled to its end (${w}×${h}, 200 % text, ${how}, ${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
    await setUp(ctx, 200);
    const page = await ctx.newPage();
    const cdp = how === 'touch' ? await ctx.newCDPSession(page) : null;
    await page.goto(`${base(baseURL)}/?debug&seed=newbie&theme=${theme}#/`);
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
    await expect(page.locator('[aria-label="Notifications"] li')).toHaveCount(0, { timeout: 15_000 });
    // The update prompt, as PwaUpdatePrompt raises it, with the panel at its top.
    await page.evaluate(async () => {
      const { toast } = await import('/src/ui/Toast.tsx' as string);
      const w = window as any;
      w.__upd = 0;
      toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => w.__upd++ } });
    });
    await page.waitForTimeout(800);
    // Every frame from here: no Break's over control and no Close under a toast.
    const names = ['^Close$', '^Mark it done', '^Put the kettle on', "^That's all for now$"];
    await page.evaluate((N) => {
      const w = window as any;
      const R = (w.__dc = { frames: 0, covered: {} as Record<string, number>, stop: false });
      const norm = (s: string) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
      const f = () => {
        if (R.stop) return;
        const ol = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement | null;
        const clip = ol && getComputedStyle(ol).overflowY !== 'visible' ? ol.getBoundingClientRect() : null;
        const boxes = [...document.querySelectorAll('[aria-label="Notifications"] li')]
          .map((li) => {
            const q = li.getBoundingClientRect();
            const r = clip ? { l: Math.max(q.left, clip.left), t: Math.max(q.top, clip.top), r: Math.min(q.right, clip.right), b: Math.min(q.bottom, clip.bottom) } : { l: q.left, t: q.top, r: q.right, b: q.bottom };
            return +getComputedStyle(li).opacity > 0.02 && r.r > r.l && r.b > r.t ? r : null;
          })
          .filter(Boolean) as { l: number; t: number; r: number; b: number }[];
        const main = document.querySelector('[data-focus-view] main') as HTMLElement;
        const mr = main.getBoundingClientRect();
        for (const n of N) {
          const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => new RegExp(n).test(norm(b.getAttribute('aria-label') || b.textContent || '')));
          if (!el) continue;
          const q = el.getBoundingClientRect();
          const inPanel = main.contains(el);
          const t = Math.max(q.top, 0, inPanel ? mr.top : 0), b = Math.min(q.bottom, innerHeight, inPanel ? mr.bottom : innerHeight);
          if (b - t < 8) continue;
          const hit = document.elementFromPoint(q.left + q.width / 2, (t + b) / 2);
          const under = boxes.some((o) => o.b > t + 1 && o.t < b - 1 && o.r > q.left + 1 && o.l < q.right - 1);
          if (!(hit && el.contains(hit)) || under) R.covered[n] = (R.covered[n] || 0) + 1;
        }
        R.frames++;
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }, names);
    // The panel to its end by REAL wheel / touch, aimed at its lower right corner (not at a toast).
    for (let i = 0; i < 40; i++) {
      const p = await page.evaluate(() => {
        const m = document.querySelector('[data-focus-view] main') as HTMLElement;
        const r = m.getBoundingClientRect();
        return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round(r.right - 24), y: Math.round(Math.min(innerHeight, r.bottom) - 40) };
      });
      expect(p.max, 'Break’s over scrolls at this size').toBeGreaterThan(100);
      if (p.st >= p.max - 1) break;
      await scroll(page, cdp, p.x, p.y, 80);
    }
    await page.waitForTimeout(800);
    const atRest = () =>
      page.evaluate(() => {
        const ol = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement;
        const clip = getComputedStyle(ol).overflowY !== 'visible' ? ol.getBoundingClientRect() : null;
        const hdr = document.querySelector('[data-focus-view] header') as HTMLElement;
        const words = [...hdr.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.textContent || '').trim()).map((e) => e.getBoundingClientRect()).filter((q) => q.width > 0);
        return [...ol.querySelectorAll(':scope > li')].map((li) => {
          const q = li.getBoundingClientRect();
          const t = Math.max(q.top, 0, clip ? clip.top : 0), b = Math.min(q.bottom, innerHeight, clip ? clip.bottom : innerHeight);
          const act = li.querySelector('button');
          let actionOnTop: boolean | null = null;
          if (act) {
            const a = act.getBoundingClientRect();
            const hit = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2);
            actionOnTop = !!hit && act.contains(hit);
          }
          const overBar = words.some((x) => q.right > x.left + 1 && q.left < x.right - 1 && t < x.bottom - 1 && b > x.top + 1);
          return { text: (li.textContent || '').slice(0, 20), box: Math.round(q.height), own: (li as HTMLElement).scrollHeight, visible: Math.round(b - t), actionOnTop, overBar };
        });
      });
    const whole = (rows: Awaited<ReturnType<typeof atRest>>) => rows.filter((r) => r.visible < r.box - 1 || r.own > r.box + 1 || r.actionOnTop === false || r.overBar);
    const one = await atRest();
    expect(one).toHaveLength(1);
    expect(whole(one), 'the update prompt whole, Update on top, no top-bar words under it').toEqual([]);
    // Two more toasts on their own timers (one with an action): all three whole (or folded), every action on top.
    await page.evaluate(async () => {
      const { toast } = await import('/src/ui/Toast.tsx' as string);
      const w = window as any;
      w.__undo = 0;
      toast('Cozy level 5!', { tone: 'success' });
      toast('Marked “Chapter 3 notes” done', { tone: 'success', action: { label: 'Undo', onClick: () => w.__undo++ } });
    });
    await page.waitForTimeout(900);
    const three = await atRest();
    expect(three).toHaveLength(3);
    expect(whole(three), 'three toasts: each whole, each action on top').toEqual([]);
    // A real click or tap on Undo and on Update reaches them.
    for (const [label, key] of [['Undo', '__undo'], ['Update', '__upd']] as const) {
      const box = (await page.locator('[aria-label="Notifications"] li button', { hasText: label }).boundingBox())!;
      if (cdp) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
      expect(await page.evaluate((k) => (window as any)[k], key), `${label} reached`).toBe(1);
    }
    const r = await page.evaluate(() => {
      const w = window as any;
      w.__dc.stop = true;
      return { frames: w.__dc.frames, covered: w.__dc.covered };
    });
    expect(r.frames).toBeGreaterThan(60);
    expect(r.covered, `controls covered (frames, of ${r.frames})`).toEqual({});
    await ctx.close();
  });
}
