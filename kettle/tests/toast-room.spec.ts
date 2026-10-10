/**
 * Toasts in a short room (I04 R4-D1): a storage-full warning taller than the room above Today's docked start can be
 * read to its end, and an older toast stacked with it revealed, with REAL input (mouse wheel, touch drag), while the
 * app's warning watcher runs. The warning must stay on screen at full opacity the whole time, its drawn box never
 * reaching the docked start (the watcher measures that box and would take the warning away), and the list must stay
 * where it was scrolled. Recorded every frame, for 2 s past the last input (the watcher ticks every 250 ms).
 *
 *   KETTLE_PORT=5222 npx playwright test tests/toast-room.spec.ts --project=chromium
 */
import { test, expect, type Page, type BrowserContext, type CDPSession } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
const WARNING = 'toast-kettle:save-failed';

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

/** Storage really full, a brew ended within its first minute: Today shows "Kettle's off" and the warning. */
async function warningAfterEarlyEnd(page: Page, url: string) {
  const ready = () =>
    page.waitForFunction(() => {
      const i = (window as any).__kettle?.timerInfo?.();
      return !!(i && i.leader && i.leaderForMs > 400 && !i.settling);
    }, null, { timeout: 60_000 });
  await page.goto(`${url}/?debug&theme=light&nooktime=day#/`);
  await ready();
  await page.evaluate(() => (window as any).__kettle.seed('newbie'));
  await page.reload();
  await ready();
  await page.evaluate(() => document.fonts.ready);
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
  await page.evaluate(() => (window as any).__kettle.timer.getState().end('user'));
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
  await page.waitForSelector(`[id="${WARNING}"]`, { timeout: 10_000 });
  await page.waitForTimeout(1500);
}

/** Start recording every frame (and hold every toast's timer, as a finger or pointer resting on the stack does). */
async function record(page: Page) {
  await page.evaluate((W) => {
    const R: any = ((window as any).__rec = { frames: [], seen: new Set<number>(), all: new Set<number>(), olderWhole: false });
    const tick = () => {
      if (R.stop) return;
      const list = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement | null;
      const lis = list ? ([...list.querySelectorAll(':scope > li')] as HTMLElement[]) : [];
      lis.forEach((li) => li.dispatchEvent(new PointerEvent('pointerenter')));
      const w = document.getElementById(W);
      const dock = document.querySelector('[data-toast-above]');
      const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
      const lr = list?.getBoundingClientRect();
      const visTop = Math.max(0, lr ? lr.top : 0);
      const visBottom = Math.min(innerHeight, lr ? lr.bottom : innerHeight, dockTop);
      let op = 0;
      for (let e: HTMLElement | null = w, o = 1; e && e !== document.documentElement; e = e.parentElement) op = o *= +getComputedStyle(e).opacity;
      const wr = w?.getBoundingClientRect();
      R.frames.push([performance.now(), w ? op : 0, wr ? wr.bottom - dockTop : null, list ? list.scrollTop : null]);
      const wi = w ? lis.indexOf(w) : -1;
      const older = lis.slice(0, Math.max(0, wi)).map((li) => li.getBoundingClientRect());
      const inter = (a: DOMRect, c: DOMRect) => a.bottom > c.top && a.top < c.bottom && a.right > c.left && a.left < c.right;
      for (const r of older) if (r.top >= visTop - 1 && r.bottom <= visBottom + 1) R.olderWhole = true;
      if (w && wr && op >= 0.98) {
        const msg = w.querySelector('span[class*="message"]') as HTMLElement;
        const act = w.querySelector('button')?.getBoundingClientRect();
        const rg = document.createRange();
        rg.selectNodeContents(msg);
        const mt = msg.getBoundingClientRect().top;
        for (const q of rg.getClientRects()) {
          const k = Math.round((q.top - mt) / Math.max(1, q.height));
          R.all.add(k);
          const inView = q.top >= Math.max(visTop, wr.top) - 1 && q.bottom <= Math.min(visBottom, wr.bottom) + 1;
          if (inView && !(act && inter(q, act)) && !older.some((o) => inter(q, o))) R.seen.add(k);
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, WARNING);
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

for (const [w, h, pct] of [
  [375, 667, 200],
  [844, 390, 200],
] as const) {
  for (const how of ['wheel', 'touch'] as const) {
    test(`the storage-full warning can be read and an older toast revealed by ${how} without the warning going away (${w}×${h}, ${pct} % text)`, async ({
      browser,
      baseURL,
    }) => {
      test.setTimeout(120_000);
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
      await setUp(ctx, pct);
      const page = await ctx.newPage();
      await warningAfterEarlyEnd(page, base(baseURL));
      await record(page);
      const cdp = how === 'touch' ? await ctx.newCDPSession(page) : null;
      const state = () =>
        page.evaluate((W) => {
          const list = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement;
          const el = document.getElementById(W)!;
          const r = el.getBoundingClientRect();
          const lr = list.getBoundingClientRect();
          return { x: (r.left + r.right) / 2, top: Math.max(0, r.top), bottom: r.bottom, at: el.scrollTop, end: el.scrollHeight - el.clientHeight, lTop: Math.max(0, lr.top), lst: list.scrollTop, lmin: -(list.scrollHeight - list.clientHeight) };
        }, WARNING);
      // Read the warning to its end, then go back up past its opening to the older toast above it.
      for (let i = 0; i < 20; i++) {
        const s = await state();
        if (s.at >= s.end - 1) break;
        await scroll(page, cdp, s.x, s.top + Math.max(12, 0.35 * (s.bottom - s.top)), 40);
      }
      for (let i = 0; i < 40; i++) {
        const s = await state();
        if (s.at <= 0 && s.lst <= s.lmin + 1) break;
        await scroll(page, cdp, s.x, s.lTop + 20, -40);
      }
      const lastInput = await page.evaluate(() => performance.now());
      await page.waitForTimeout(2200);
      const r = await page.evaluate((t) => {
        const R = (window as any).__rec;
        R.stop = true;
        const after = R.frames.filter((f: number[]) => f[0] >= t);
        const sts = after.map((f: number[]) => f[3]);
        return {
          frames: R.frames.length,
          msAfter: after.length ? after[after.length - 1][0] - after[0][0] : 0,
          gone: R.frames.filter((f: number[]) => f[1] < 0.98).length,
          overDock: R.frames.filter((f: (number | null)[]) => f[2] !== null && (f[2] as number) > 0.5).length,
          scrollMoved: Math.max(...sts) - Math.min(...sts),
          lines: [R.seen.size, R.all.size],
          olderWhole: R.olderWhole,
        };
      }, lastInput);
      expect(r.msAfter, 'recorded past the last input').toBeGreaterThanOrEqual(2000);
      expect(r.gone, `frames without the warning at full opacity (of ${r.frames})`).toBe(0);
      expect(r.overDock, 'frames with the warning over the docked start').toBe(0);
      expect(r.scrollMoved, 'the list moved after the last input').toBeLessThanOrEqual(1);
      expect(r.lines[0], 'lines of the warning read').toBe(r.lines[1]);
      expect(r.olderWhole, 'the older toast wholly on screen at some point').toBe(true);
      await ctx.close();
    });
  }
}
