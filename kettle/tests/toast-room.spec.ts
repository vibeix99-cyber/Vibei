/**
 * Toasts in a short room (I04 R4-D1, R5-D1): a storage-full warning taller than the room above Today's docked start can
 * be read to its end, and an older toast stacked with it revealed, with REAL input (mouse wheel, touch drag), while the
 * app's warning watcher runs; and an older toast timing out on its real timer in a scrolled list never moves it. The
 * warning must stay on screen at full opacity the whole time, its drawn box never reaching below its room or over the
 * docked start (the watcher measures that box and would take the warning away), never taken away from End on (its
 * entry included), and the list must stay where it was scrolled. Recorded every frame, for 2 s past the last input (the
 * watcher ticks every 250 ms).
 *
 *   KETTLE_PORT=5222 npx playwright test tests/toast-room.spec.ts --project=chromium
 */
import { test, expect, type Page, type BrowserContext, type CDPSession } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
const WARNING = 'toast-kettle:save-failed';
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

/** Storage really full, a brew ended within its first minute: Today shows "Kettle's off" and the warning. */
async function warningAfterEarlyEnd(page: Page, url: string, { levelUp = false, theme = 'light' }: { levelUp?: boolean; theme?: 'light' | 'dark' } = {}) {
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
  // With a level-up: the profile one leaf below its next cozy level, so ending after 12 minutes brings three toasts
  // ("Cozy level N!", "Saved 12 minutes of focus", the warning).
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
  if (levelUp) await page.evaluate(() => (window as any).__kettle.ff(12 * 60_000 + 5_000));
  // From End on: every time the warning's element leaves the page (taken away by the hold rule, or its own end).
  await page.evaluate((W) => {
    const gone: number[] = ((window as any).__warningGone = []);
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.removedNodes) if ((n as Element).id === W) gone.push(performance.now());
    }).observe(document.body, { childList: true, subtree: true });
  }, WARNING);
  await page.evaluate(() => (window as any).__kettle.timer.getState().end('user'));
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
  await page.waitForSelector(`[id="${WARNING}"]`, { timeout: 10_000 });
  await page.waitForTimeout(1500);
}

/** Start recording every frame (and hold every toast's timer, as a finger or pointer resting on the stack does). */
async function record(page: Page, hold = true) {
  await page.evaluate(([W, hold]) => {
    const R: any = ((window as any).__rec = { frames: [], seen: new Set<number>(), all: new Set<number>(), older: new Set<string>(), olderWhole: new Set<string>(), ev: [] });
    const t0 = performance.now();
    new MutationObserver((ms) => {
      for (const m of ms) {
        for (const n of m.addedNodes) if ((n as Element).tagName === 'LI') R.ev.push([performance.now() - t0, '+', (n as Element).id]);
        for (const n of m.removedNodes) if ((n as Element).tagName === 'LI') R.ev.push([performance.now() - t0, '-', (n as Element).id]);
      }
    }).observe(document.body, { childList: true, subtree: true });
    const tick = () => {
      if (R.stop) return;
      const list = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement | null;
      const lis = list ? ([...list.querySelectorAll(':scope > li')] as HTMLElement[]) : [];
      if (hold) lis.forEach((li) => li.dispatchEvent(new PointerEvent('pointerenter')));
      const w = document.getElementById(W);
      const dock = document.querySelector('[data-toast-above]');
      const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
      const lr = list?.getBoundingClientRect();
      // The room: the toast region's own box (the list's scroll box may reach past it: shadows above, a gap below).
      const room = list?.parentElement?.parentElement?.getBoundingClientRect();
      const visTop = Math.max(0, lr ? lr.top : 0);
      const visBottom = Math.min(innerHeight, lr ? lr.bottom : innerHeight, dockTop);
      let op = 0;
      for (let e: HTMLElement | null = w, o = 1; e && e !== document.documentElement; e = e.parentElement) op = o *= +getComputedStyle(e).opacity;
      const wr = w?.getBoundingClientRect();
      R.frames.push([performance.now(), w ? op : 0, wr ? wr.bottom - Math.min(dockTop, room ? room.bottom : innerHeight) : null, list ? list.scrollTop : null]);
      // Older toasts: every other toast, wherever the stack puts it (above or below the warning). One is wholly on
      // screen when its box is inside the list's visible part and nothing is drawn over it (hit-tested at its middle).
      const others = lis.filter((li) => li !== w);
      const older = others.map((li) => li.getBoundingClientRect());
      const inter = (a: DOMRect, c: DOMRect) => a.bottom > c.top && a.top < c.bottom && a.right > c.left && a.left < c.right;
      others.forEach((li, i) => {
        const r = older[i];
        R.older.add(li.id);
        const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
        if (r.top >= visTop - 1 && r.bottom <= visBottom + 1 && hit && li.contains(hit)) R.olderWhole.add(li.id);
      });
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
          const hit = document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2);
          if (inView && !(act && inter(q, act)) && hit && w.contains(hit)) R.seen.add(k);
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [WARNING, hold] as const);
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

for (const [w, h, pct, levelUp] of [
  [375, 667, 200, false],
  [844, 390, 200, false],
  // A 60 px room: the warning scrolls its 11 lines inside it, and End after 12 minutes with a level-up stacks two older
  // toasts nearly as tall as the room with it.
  [667, 375, 200, true],
] as const) {
  for (const how of ['wheel', 'touch'] as const) {
    test(`the storage-full warning can be read and ${levelUp ? 'every older toast' : 'an older toast'} revealed by ${how} without the warning going away (${w}×${h}, ${pct} % text)`, async ({
      browser,
      baseURL,
    }) => {
      test.setTimeout(120_000);
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
      await setUp(ctx, pct);
      const page = await ctx.newPage();
      await warningAfterEarlyEnd(page, base(baseURL), { levelUp });
      await record(page);
      const cdp = how === 'touch' ? await ctx.newCDPSession(page) : null;
      const state = () =>
        page.evaluate((W) => {
          const list = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement;
          const el = document.getElementById(W);
          if (!el) return null; // taken away (what this test guards against): the recording counts those frames
          const r = el.getBoundingClientRect();
          const lr = list.getBoundingClientRect();
          const x = (r.left + r.right) / 2;
          // Where a finger or pointer can rest on the stack (on a toast: the list between them lets input through),
          // nearest the bottom and nearest the top of what is in view.
          const onToast = (y: number) => !!document.elementFromPoint(x, y)?.closest('[aria-label="Notifications"] li');
          let low = lr.bottom - 20;
          while (low > lr.top && !onToast(low)) low -= 4;
          let high = Math.max(0, lr.top) + 20;
          while (high < lr.bottom && !onToast(high)) high += 4;
          return { x, top: Math.max(0, r.top), bottom: r.bottom, at: el.scrollTop, end: el.scrollHeight - el.clientHeight, low, high, lst: list.scrollTop };
        }, WARNING);
      // Read the warning to its end and go on down as far as the stack goes (older toasts below a warning that leads
      // the stack), then back up as far as it goes (older toasts above a warning at the bottom, and its opening).
      for (let i = 0, still = 0; i < 60 && still < 2; i++) {
        const s = await state();
        if (!s) {
          await page.waitForTimeout(100);
          continue;
        }
        await scroll(page, cdp, s.x, s.at < s.end - 1 ? s.top + Math.max(12, 0.35 * (s.bottom - s.top)) : s.low, s.at < s.end - 1 ? 40 : 20);
        const n = await state();
        still = n && n.at === s.at && n.lst === s.lst ? still + 1 : 0;
      }
      for (let i = 0, still = 0; i < 80 && still < 2; i++) {
        const s = await state();
        if (!s) {
          await page.waitForTimeout(100);
          continue;
        }
        await scroll(page, cdp, s.x, s.high, -20);
        const n = await state();
        still = n && n.at === s.at && n.lst === s.lst ? still + 1 : 0;
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
          older: [...R.older].filter((id: string) => !R.olderWhole.has(id)),
          olderCount: R.older.size,
        };
      }, lastInput);
      expect(r.msAfter, 'recorded past the last input').toBeGreaterThanOrEqual(2000);
      expect(await page.evaluate(() => (window as any).__warningGone.length), 'times the warning left the page since End').toBe(0);
      expect(r.gone, `frames without the warning at full opacity (of ${r.frames})`).toBe(0);
      expect(r.overDock, 'frames with the warning below its room or over the docked start').toBe(0);
      expect(r.scrollMoved, 'the list moved after the last input').toBeLessThanOrEqual(1);
      expect(r.lines[0], 'lines of the warning read').toBe(r.lines[1]);
      expect(r.olderCount, 'older toasts in the stack').toBe(levelUp ? 2 : 1);
      expect(r.older, 'older toasts never wholly on screen').toEqual([]);
      await ctx.close();
    });
  }
}

// R5-D1: real toast timers. The older toasts are held only once, at the start, as a pointer resting on the stack would
// hold them; then the middle one's timer is released (the pointer has moved off it) after the list was scrolled through
// and back, so it times out and leaves the list while the person goes on scrolling. The warning must not move: no frame
// with its box below its room or over the docked start, none without it at full opacity.
for (const theme of ['light', 'dark'] as const) {
  test(`an older toast timing out after the list was scrolled never moves the warning out of its room (375×667, 200 % text, wheel, ${theme})`, async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(150_000);
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
    await setUp(ctx, 200);
    const page = await ctx.newPage();
    await warningAfterEarlyEnd(page, base(baseURL), { levelUp: true, theme });
    await expect(page.locator('[aria-label="Notifications"] li')).toHaveCount(3);
    await page.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').forEach((li) => li.dispatchEvent(new PointerEvent('pointerenter'))));
    await record(page, false);
    const state = () =>
      page.evaluate((W) => {
        const list = document.querySelector('[aria-label="Notifications"] ol') as HTMLElement;
        const el = document.getElementById(W);
        const r = el?.getBoundingClientRect();
        const lr = list.getBoundingClientRect();
        return { x: r ? (r.left + r.right) / 2 : (lr.left + lr.right) / 2, top: r ? Math.max(0, r.top) : 0, bottom: r ? r.bottom : lr.bottom, at: el?.scrollTop ?? 0, end: el ? el.scrollHeight - el.clientHeight : 0, lst: list.scrollTop, lBottom: lr.bottom };
      }, WARNING);
    const wheel = async (x: number, y: number, dy: number) => {
      await page.mouse.move(Math.round(x), Math.round(y));
      await page.mouse.wheel(0, dy);
      await page.waitForTimeout(120);
    };
    // Read the warning to its end; scroll up as far as the stack goes; rest; scroll back down to where it rests.
    let s = await state();
    for (let i = 0; i < 40 && s.at < s.end - 1; i++) {
      await wheel(s.x, s.top + Math.max(14, 0.4 * (s.bottom - s.top)), 20);
      s = await state();
    }
    for (let i = 0; i < 60; i++) {
      const before = await state();
      await wheel(before.x, before.top + Math.max(14, 0.4 * (before.bottom - before.top)), -20);
      s = await state();
      if (s.at === before.at && s.lst === before.lst) break;
    }
    await page.waitForTimeout(2300);
    // Back to where the list rests (offset 0); a list that scrolled up has a negative offset.
    for (let i = 0; i < 60; i++) {
      s = await state();
      if (s.lst >= -1) break;
      await wheel(s.x, s.lBottom - 30, 20);
    }
    // The middle older toast's timer runs out; once it has gone, one more step down.
    const older = await page.evaluate((W) => [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.id).filter((id) => id !== W), WARNING);
    const tRelease = await page.evaluate(() => performance.now());
    await page.evaluate((id) => document.getElementById(id)?.dispatchEvent(new PointerEvent('pointerleave')), older[1]);
    await page.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 2, null, { timeout: 8000, polling: 'raf' });
    await page.waitForTimeout(80);
    s = await state();
    await wheel(s.x, s.lBottom - 30, 20);
    const lastInput = await page.evaluate(() => performance.now());
    await page.waitForTimeout(2200);
    const r = await page.evaluate(
      ([t, last]) => {
        const R = (window as any).__rec;
        R.stop = true;
        const f = R.frames.filter((x: number[]) => x[0] >= t);
        return {
          frames: f.length,
          msAfter: f.length ? f[f.length - 1][0] - last : 0,
          gone: f.filter((x: number[]) => x[1] < 0.98).length,
          outOfRoom: f.filter((x: (number | null)[]) => x[2] !== null && (x[2] as number) > 0.5).length,
        };
      },
      [tRelease, lastInput] as const,
    );
    expect(r.msAfter, 'recorded past the last input').toBeGreaterThanOrEqual(2000);
    // Not taken away at any point since End, its entry included (the docked start settles as Today rises into place).
    expect(await page.evaluate(() => (window as any).__warningGone.length), 'times the warning left the page since End').toBe(0);
    expect(r.outOfRoom, `frames with the warning's box below its room or over the docked start (of ${r.frames})`).toBe(0);
    expect(r.gone, `frames without the warning at full opacity (of ${r.frames})`).toBe(0);
    await ctx.close();
  });
}
