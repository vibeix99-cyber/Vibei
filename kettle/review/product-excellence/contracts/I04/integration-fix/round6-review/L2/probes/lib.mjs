// L2 (interaction) review lane, round 6. Shared helpers. Real input only (page.mouse.wheel, CDP touch events, real
// clicks); the debug API (window.__kettle) is used for SETUP only (seed, quota fill, start a brew, fast-forward the
// brew clock, end it). Toasts run on their real timers. Every run uses its own fresh browser context (a new,
// disposable, in-memory profile); every Chromium launch goes through tools/slots.py.
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

export const SW = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
export const launch = () => chromium.launch({ args: SW });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const WARN = 'toast-kettle:save-failed';

/** A fresh context: phone (w < 900: mobile + touch) or desktop window, optional large text, optional video. */
export async function newCtx(browser, { w, h, theme = 'light', text = 100, video, dpr } = {}) {
  const phone = w < 900;
  const opts = {
    viewport: { width: w, height: h },
    deviceScaleFactor: dpr ?? (phone ? 2 : 1),
    isMobile: phone,
    hasTouch: phone,
    colorScheme: theme,
    reducedMotion: 'no-preference',
    acceptDownloads: true,
  };
  if (video) { mkdirSync(video, { recursive: true }); opts.recordVideo = { dir: video, size: { width: w, height: h } }; }
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript((pct) => {
    try {
      if (!localStorage.getItem('kettle:settings'))
        localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
    } catch {}
    if (pct !== 100)
      addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = `html{font-size:${pct}%!important}`;
        document.head.appendChild(s);
      });
  }, text);
  return ctx;
}

export const ready = (page) =>
  page.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60_000 });

/** Newbie profile on Today. */
export async function openNewbie(page, base, theme) {
  await page.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
  await ready(page);
  await page.evaluate(() => window.__kettle.seed('newbie'));
  await page.reload();
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  await sleep(600);
}

/** Storage really full (QuotaExceededError checked). */
export const fillQuota = (page) =>
  page.evaluate(() => {
    let c = 'x'.repeat(1 << 20), i = 0;
    while (c.length >= 1) { try { localStorage.setItem(`filler${i++}`, c); } catch { c = c.slice(0, c.length / 2); } }
    try { localStorage.setItem('probe', 'x'.repeat(64)); return 'no error'; } catch (e) { return e.name; }
  });

export const levelUpSetup = (page) =>
  page.evaluate(async () => {
    const { leavesForLevel, levelFromLeaves } = await import('/src/progress/levels.ts');
    const L = levelFromLeaves(window.__kettle.progress.getState().leaves).level;
    window.__kettle.progress.setState({ leaves: leavesForLevel(L + 1) - 1 });
  });

/**
 * In-page per-frame recorder (requestAnimationFrame). Installed BEFORE the warning is raised, so its first frames are
 * seen. Per frame: time, toast count, the warning's opacity/box, list and warning scroll offsets, whether its FIRST
 * line is wholly visible (inside the toast box, the list's scrollport, the screen and above the docked start; not
 * covered; hit-tested at three points), how many of its lines are, whether "Save backup" hit-tests as itself, the
 * warning against the docked start and the toast region, plus the docked start's and every toast's rectangle.
 * Lines ever seen wholly visible are kept per toast.
 */
export const RECORDER = (WARN) => {
  const R = (window.__rec = { frames: [], seen: {}, total: {}, whole: {}, ev: [], stop: false, t0: performance.now(), dir: 0, meta: null });
  const now = () => Math.round((performance.now() - R.t0) * 10) / 10;
  let serial = 0;
  new MutationObserver((ms) => {
    // a node React MOVES within the list shows up as a removal plus an addition of the same node: not a hide / re-show
    const added = new Set(), removed = new Set();
    for (const m of ms) {
      for (const n of m.addedNodes) if (n.tagName === 'LI') added.add(n);
      for (const n of m.removedNodes) if (n.tagName === 'LI') removed.add(n);
    }
    for (const n of added) { if (removed.has(n)) { R.ev.push([now(), '~', n.id, n.__s]); continue; } n.__s = ++serial; R.ev.push([now(), '+', n.id, n.__s]); }
    for (const n of removed) { if (added.has(n) || n.isConnected) continue; R.ev.push([now(), '-', n.id, n.__s]); }
  }).observe(document.body, { childList: true, subtree: true });
  // the toast region's own `bottom` (the lift) is applied by a React effect: stamp every change (works when rAF is starved)
  const regEl = document.querySelector('[aria-label="Notifications"]')?.parentElement;
  if (regEl) new MutationObserver(() => R.ev.push([now(), 's', regEl.style.bottom || '(stylesheet)'])).observe(regEl, { attributes: true, attributeFilter: ['style'] });
  const inter = (a, b) => a.bottom > b.top + 0.5 && a.top < b.bottom - 0.5 && a.right > b.left + 0.5 && a.left < b.right - 0.5;
  const zi = (li) => +getComputedStyle(li).zIndex || 0;
  const opacityOf = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
  const tick = () => {
    if (R.stop) return;
    const live = document.querySelector('[aria-label="Notifications"]');
    const list = live?.querySelector('ol');
    const lis = list ? [...list.querySelectorAll(':scope > li')] : [];
    const region = live?.parentElement;
    const rr = region?.getBoundingClientRect();
    const docks = [...document.querySelectorAll('[data-toast-above]')].filter((d) => !d.closest('[aria-hidden="true"], [inert]')).map((d) => d.getBoundingClientRect()).filter((r) => r.height > 0 && r.top < innerHeight);
    const dockTop = docks.length ? Math.min(...docks.map((r) => r.top)) : innerHeight;
    const dockR = docks.length ? docks.reduce((a, b) => (a.top <= b.top ? a : b)) : null;
    const lr = list?.getBoundingClientRect();
    const visTop = Math.max(0, lr ? lr.top + list.clientTop : 0);
    const visBottom = Math.min(innerHeight, lr ? lr.top + list.clientTop + list.clientHeight : innerHeight, dockTop);
    const w = document.getElementById(WARN);
    const wr = w?.getBoundingClientRect();
    const wop = w ? opacityOf(w) : 0;
    const rects = lis.map((li) => li.getBoundingClientRect());
    const zs = lis.map(zi);
    let firstVis = 0, linesVis = 0;
    lis.forEach((li, i) => {
      const id = li.id || `li${i}`;
      const r = rects[i];
      if (opacityOf(li) < 0.5) return;
      const above = rects.filter((_, j) => j !== i && (zs[j] > zs[i] || (zs[j] === zs[i] && j > i)));
      if (r.top >= visTop - 0.5 && r.bottom <= visBottom + 0.5 && !above.some((a) => inter(a, r))) R.whole[id] = true;
      const msg = li.querySelector('span[class*="message"]');
      if (!msg) return;
      const act = li.querySelector('button')?.getBoundingClientRect();
      const rg = document.createRange();
      rg.selectNodeContents(msg);
      const qs = [...rg.getClientRects()].filter((q) => q.width > 0 && q.height > 0);
      if (!qs.length) return;
      const mtop = msg.getBoundingClientRect().top;
      const lh = Math.max(...qs.map((q) => q.height));
      const idx = (q) => Math.round((q.top - mtop) / lh);
      const total = new Set(qs.map(idx)).size;
      R.total[id] = Math.max(R.total[id] ?? 0, total);
      for (const q of qs) {
        const k = idx(q);
        const inV = q.top >= Math.max(visTop, r.top) - 0.5 && q.bottom <= Math.min(visBottom, r.bottom) + 0.5;
        const inH = q.left >= Math.max(0, r.left) - 0.5 && q.right <= Math.min(innerWidth, r.right) + 0.5;
        if (!inV || !inH) continue;
        if (act && inter(q, act)) continue;
        if (above.some((a) => inter(a, q))) continue;
        const y = (q.top + q.bottom) / 2;
        const pts = [q.left + 2, (q.left + q.right) / 2, q.right - 2];
        if (!pts.every((x) => { const hit = document.elementFromPoint(x, y); return hit && li.contains(hit); })) continue;
        (R.seen[id] ??= {})[k] = 1;
        if (id === WARN) { linesVis++; if (k === 0) firstVis = 1; }
      }
    });
    const btn = w?.querySelector('button');
    let btnHit = 0;
    if (btn) {
      const b = btn.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      if (cx >= 0 && cx < innerWidth && cy >= 0 && cy < innerHeight) { const h = document.elementFromPoint(cx, cy); btnHit = h && btn.contains(h) ? 1 : 0; }
    }
    const rd = (n) => Math.round(n * 10) / 10;
    R.frames.push([
      now(), lis.length, w ? rd(wop * 1000) / 1000 : 0,
      wr ? rd(wr.top) : null, wr ? rd(wr.bottom) : null, wr ? rd(wr.left) : null, wr ? rd(wr.right) : null,
      list ? Math.round(list.scrollTop) : null, w ? Math.round(w.scrollTop) : null,
      firstVis, linesVis, btnHit,
      dockR ? rd(dockR.top) : null, dockR ? rd(dockR.bottom) : null, dockR ? rd(dockR.left) : null, dockR ? rd(dockR.right) : null,
      rr ? rd(rr.top) : null, rr ? rd(rr.bottom) : null,
      R.dir,
      lis.map((li, i) => [li.id.replace(/^toast-/, '').slice(0, 14), rd(rects[i].top), rd(rects[i].bottom), rd(opacityOf(li) * 100) / 100, rd(rects[i].left), rd(rects[i].right)]),
    ]);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
// frame indices
export const F = { t: 0, n: 1, op: 2, top: 3, bot: 4, left: 5, right: 6, lst: 7, wst: 8, first: 9, lines: 10, btn: 11, dTop: 12, dBot: 13, dL: 14, dR: 15, rTop: 16, rBot: 17, dir: 18, toasts: 19 };

export const mark = (page) => page.evaluate(() => performance.now() - window.__rec.t0);
export const setDir = (page, d) => page.evaluate((d) => { window.__rec.dir = d; }, d);

/** Real-input helpers bound to a page/context. */
export function inputs(page, ctx, { W, H, how }) {
  let cdp = null;
  const getCdp = async () => (cdp ??= await ctx.newCDPSession(page));
  const touch = how === 'touch' || how === 'flick';
  const step = how.startsWith('wheel') ? +how.slice(5) : how === 'flick' ? 120 : 24;
  const wheelGap = how === 'wheel100' ? 200 : how === 'wheel53' ? 140 : 120;
  const move = async (x, y) => { await page.mouse.move(Math.round(x), Math.round(y)); };
  /** One notch / one drag at (x, y): dy > 0 scrolls the content down (finger moves up). */
  const input = async (x, y, dy) => {
    x = Math.round(x); y = Math.round(Math.min(Math.max(y, 6), H - 6));
    if (!touch) { await page.mouse.move(x, y); await page.mouse.wheel(0, dy); await sleep(wheelGap); return; }
    const c = await getCdp();
    const dir = dy > 0 ? -1 : 1;
    const n = how === 'flick' ? 4 : Math.max(1, Math.round(Math.abs(dy) / 8));
    const px = Math.abs(dy) / n;
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= n; i++) {
      await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y + dir * i * px) }] });
      await sleep(how === 'flick' ? 8 : 16);
    }
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(how === 'flick' ? 600 : 160);
  };
  return { input, step, touch, move, getCdp };
}

/** Page-side snapshot used to aim input and to decide when to stop. */
export const snapshot = (page) =>
  page.evaluate((WARN) => {
    const list = document.querySelector('[aria-label="Notifications"] ol');
    if (!list) return null;
    const w = document.getElementById(WARN);
    const lis = [...list.querySelectorAll(':scope > li')];
    const lr = list.getBoundingClientRect();
    const r = w?.getBoundingClientRect();
    const x = r ? (r.left + r.right) / 2 : (lr.left + lr.right) / 2;
    const dock = [...document.querySelectorAll('[data-toast-above]')].map((d) => d.getBoundingClientRect()).filter((q) => q.height > 0 && q.top < innerHeight);
    const dockTop = dock.length ? Math.min(...dock.map((q) => q.top)) : innerHeight;
    const vb = Math.min(lr.bottom, innerHeight, dockTop), vt = Math.max(0, lr.top);
    const msg = w?.querySelector('span[class*="message"]');
    const mr = msg?.getBoundingClientRect();
    return {
      x,
      vt, vb,
      w: w ? { top: Math.max(0, r.top), bottom: Math.min(r.bottom, innerHeight), x, st: w.scrollTop, max: w.scrollHeight - w.clientHeight, msgTop: mr ? Math.max(0, mr.top) : null, msgBottom: mr ? Math.min(mr.bottom, innerHeight) : null } : null,
      l: { st: list.scrollTop, max: list.scrollHeight - list.clientHeight },
      others: lis.filter((li) => li !== w).map((li) => { const q = li.getBoundingClientRect(); return { id: li.id, top: q.top, bottom: q.bottom, st: li.scrollTop, max: li.scrollHeight - li.clientHeight }; }),
      all: lis.map((li) => { const q = li.getBoundingClientRect(); return { id: li.id, top: q.top, bottom: q.bottom, h: q.height, st: li.scrollTop, max: li.scrollHeight - li.clientHeight, sh: li.scrollHeight, ch: li.clientHeight }; }),
      room: (() => { const q = list.parentElement.parentElement.getBoundingClientRect(); return { top: q.top, bottom: q.bottom, h: q.height }; })(),
      n: lis.length,
    };
  }, WARN);

export const fmt = (o) => JSON.stringify(o);
