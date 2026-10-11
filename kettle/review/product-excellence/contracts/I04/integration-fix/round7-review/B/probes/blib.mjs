// Lane B (round-7 review) shared helpers. Observation only: nothing here changes app code; the debug API is used for
// setup (seed, quota fill, a save that fails, ff). Inputs in the probes are real (mouse wheel, CDP touch, keyboard).
import { chromium } from 'playwright';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const launch = () => chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
export const parseCfgs = (s) => s.split(',').filter(Boolean).map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); if (!m) throw new Error('bad cfg ' + c); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
export const WARN_RE = /storage is full|storage’s full|can’t save|couldn’t save|Not saved/i;

export async function newCtx(b, { W, H, text, theme, video, videoDir }) {
  const phone = W < 900;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: true, colorScheme: theme, acceptDownloads: true, ...(video ? { recordVideo: { dir: videoDir, size: { width: W, height: H } } } : {}) });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  // Observation: every localStorage write's outcome (kettle:* keys), and every addition to a live region.
  await ctx.addInitScript(() => {
    const W = (window.__obs = { writes: [], said: [], warnEv: [] });
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      try { const r = orig.call(this, k, v); if (String(k).startsWith('kettle:')) W.writes.push([Math.round(performance.now()), k, 'ok']); return r; }
      catch (e) { if (String(k).startsWith('kettle:')) W.writes.push([Math.round(performance.now()), k, e.name]); throw e; }
    };
    const RE = /storage is full|can’t save|couldn’t save|Not saved/i;
    addEventListener('DOMContentLoaded', () => {
      const regionOf = (n) => { for (let e = n.nodeType === 1 ? n : n.parentElement; e; e = e.parentElement) { if (e.getAttribute?.('aria-live') || /^(status|alert|log)$/.test(e.getAttribute?.('role') || '')) return e; } return null; };
      new MutationObserver((ms) => {
        const t = Math.round(performance.now());
        for (const m of ms) {
          const reg = regionOf(m.target);
          if (reg) {
            const added = m.type === 'characterData' ? [m.target] : [...m.addedNodes];
            for (const a of added) { const tx = (a.textContent || '').trim(); if (tx && RE.test(tx)) W.said.push([t, reg.id || reg.getAttribute('aria-label') || reg.tagName, reg.getAttribute('aria-live') || reg.getAttribute('role'), tx.slice(0, 90)]); }
          }
          for (const a of m.addedNodes) if (a.nodeType === 1 && (a.matches?.('[data-save-warning]') || a.id === 'toast-kettle:save-failed' || a.querySelector?.('[data-save-warning]'))) W.warnEv.push([t, '+', a.id || a.tagName, location.hash]);
          for (const a of m.removedNodes) if (a.nodeType === 1 && (a.matches?.('[data-save-warning]') || a.id === 'toast-kettle:save-failed' || a.querySelector?.('[data-save-warning]'))) W.warnEv.push([t, '-', a.id || a.tagName, location.hash]);
        }
      }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    });
  });
  return ctx;
}

export const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
export async function open(p, base, theme) {
  await p.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
  await ready(p);
  await p.evaluate(() => document.fonts.ready);
}
// SETUP: newbie seed, a saved timer, localStorage filled to QuotaExceededError.
export async function seedAndFill(p, { seed = true } = {}) {
  if (seed) { await p.evaluate(() => window.__kettle.seed('newbie')); await p.reload(); await ready(p); await p.evaluate(() => document.fonts.ready); }
  await p.evaluate(() => window.__kettle.timer.setState({}));
  return fill(p);
}
export const fill = (p) => p.evaluate(() => { let c = 'x'.repeat(1 << 20), k = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${k++}`, c); } catch { c = c.slice(0, c.length / 2); } } try { localStorage.setItem('filler-probe', 'x'.repeat(4096)); return 'no error'; } catch (e) { return e.name; } });
// SETUP: a save the app makes that needs one more byte (settings: the name gains a trailing space, invisible on screen;
// grown 1, 2, 4 … spaces until a write really fails; trailing spaces collapse on screen) — with storage full it really fails (QuotaExceededError).
// (Re-saving an unchanged value replaces it in place and does not fail, so `timer.setState({})` is not enough.)
export const failASave = (p) => p.evaluate(async () => {
  const t = Math.round(performance.now()); const k = window.__kettle; const failed = () => window.__obs.writes.some((w) => w[0] >= t && w[2] !== 'ok');
  const base = (k.settings.getState().name ?? '').replace(/\s+$/, '');
  for (let i = 0; i < 10 && !failed(); i++) { k.settings.getState().set({ name: base + ' '.repeat(2 ** i) }); await new Promise((r) => setTimeout(r, 30)); }
  return t;
});
export const freeRoom = (p) => p.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('filler')) localStorage.removeItem(k); return Math.round(performance.now()); });

// The warning element on either design: R7's in-page banner/note, or INT's warning toast.
export const WARN_FN = `(() => document.querySelector('section[data-save-warning]') || document.getElementById('toast-kettle:save-failed'))`;

// Lines of the warning's text (not its button), and whether each is drawn unobstructed in the viewport now.
export const measureLines = (p) => p.evaluate((WF) => {
  const w = eval(WF)();
  if (!w) return null;
  const tw = document.createTreeWalker(w, NodeFilter.SHOW_TEXT);
  const rects = [];
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (!n.textContent.trim() || n.parentElement.closest('button')) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const q of r.getClientRects()) if (q.width > 1) rects.push({ t: q.top, b: q.bottom, l: q.left, r: q.right });
  }
  const lines = [];
  for (const q of rects.sort((a, b) => a.t - b.t)) { const L = lines.find((x) => Math.abs(x.t - q.t) < 4); if (L) { L.l = Math.min(L.l, q.l); L.r = Math.max(L.r, q.r); L.b = Math.max(L.b, q.b); } else lines.push({ ...q }); }
  const wr = w.getBoundingClientRect();
  const sr = w.scrollTop !== undefined ? 0 : 0;
  const out = lines.map((L, i) => {
    const y = (L.t + L.b) / 2;
    const inV = L.t >= -0.5 && L.b <= innerHeight + 0.5 && L.l >= -0.5 && L.r <= innerWidth + 0.5;
    let hits = 0, pts = 0;
    if (inV) for (const x of [L.l + 3, (L.l + L.r) / 2, L.r - 3]) { pts++; const h = document.elementFromPoint(x, y); if (h && w.contains(h)) hits++; }
    return { i, t: Math.round(L.t), b: Math.round(L.b), ok: inV && pts > 0 && hits === pts };
  });
  const sb = [...w.querySelectorAll('button')].find((x) => /Save backup/.test(x.textContent));
  let sbOk = false, sbBox = null;
  if (sb) { const q = sb.getBoundingClientRect(); sbBox = [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)]; const cx = q.left + q.width / 2, cy = q.top + q.height / 2; if (cy >= 0 && cy < innerHeight && cx >= 0 && cx < innerWidth) { const h = document.elementFromPoint(cx, cy); sbOk = !!h && sb.contains(h); } }
  return { lines: out, box: [Math.round(wr.left), Math.round(wr.top), Math.round(wr.width), Math.round(wr.height)], sbOk, sbBox, scrollY: Math.round(scrollY), pos: getComputedStyle(w).position, tag: w.tagName, id: w.id };
}, WARN_FN);

export function relLum(rgb) { const a = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
export function contrast(c1, c2) { const L1 = relLum(c1), L2 = relLum(c2); return +(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2)); }
export function parseRgb(s) { const m = String(s).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
export function hsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0; const l = (mx + mn) / 2; const d = mx - mn; const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); if (d) { if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4); } if (h < 0) h += 360; return [Math.round(h), +s.toFixed(2), +l.toFixed(2)]; }

// CDP touch drag: finger from (x,y0) moving by dy (negative = finger up = content scrolls down), in n moves.
export async function touchDrag(cdp, x, y0, dy, n = 8, gap = 16) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let k = 1; k <= n; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 + (dy * k) / n) }] }); await sleep(gap); }
  await sleep(gap * 3);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
