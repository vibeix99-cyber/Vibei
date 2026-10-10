// L3 shared helpers (own file; Playwright imported by absolute path). Round-6 review, lane L3.
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';

export const REV = {
  R6: { name: 'R6', commit: 'e866118', dev: 'http://127.0.0.1:5301', prod: 'http://127.0.0.1:5321' },
  INT: { name: 'INT', commit: '0d58c5e', dev: 'http://127.0.0.1:5303', prod: 'http://127.0.0.1:5323' },
};
export const SW = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
export const launch = () => chromium.launch({ args: SW });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const OUT = process.env.L3_OUT || '/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L3';
export const SCR = '/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L3';

/** A fresh context (disposable profile). phone = w<900: mobile + touch + dpr 2. text = % of root font size. */
export async function newCtx(browser, { w, h, dpr, theme = 'light', text = 100, reduced = false, video, touch, mobile } = {}) {
  const phone = mobile ?? w < 900;
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: dpr ?? (phone ? 2 : 1),
    isMobile: phone,
    hasTouch: touch ?? phone,
    colorScheme: theme,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    acceptDownloads: true,
    ...(video ? { recordVideo: { dir: video, size: { width: w, height: h } } } : {}),
  });
  if (text !== 100) {
    await ctx.addInitScript((pct) => {
      const add = () => {
        const s = document.createElement('style');
        s.id = 'l3-text';
        s.textContent = `html{font-size:${pct}%!important}`;
        document.head.appendChild(s);
      };
      if (document.head) add();
      else addEventListener('DOMContentLoaded', add);
    }, text);
  }
  return ctx;
}

export const nt = (theme) => (theme === 'light' ? '&nooktime=day' : '');
export const ready = (page) =>
  page.waitForFunction(() => {
    const i = window.__kettle?.timerInfo?.();
    return !!(i && i.leader && i.leaderForMs > 400 && !i.settling);
  }, null, { timeout: 60_000 });

/** Open a fresh newbie profile (debug API for setup only), settings: no auto-start, muted. */
export async function openNewbie(page, base, { theme = 'light', motion } = {}) {
  await page.addInitScript(() => {
    try {
      if (!localStorage.getItem('kettle:settings'))
        localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
    } catch {}
  });
  await page.goto(`${base}/?debug&theme=${theme}${nt(theme)}${motion ? `&motion=${motion}` : ''}#/`, { waitUntil: 'load' });
  await ready(page);
  await page.evaluate(() => window.__kettle.seed('newbie'));
  await page.reload();
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__kettle.timer.setState({}));
  await page.waitForTimeout(600);
}

export const fillStorage = (page) =>
  page.evaluate(() => {
    let chunk = 'x'.repeat(1024 * 1024);
    let i = 0;
    while (chunk.length >= 8) {
      try { localStorage.setItem(`filler${i++}`, chunk); } catch { chunk = chunk.slice(0, chunk.length / 2); }
    }
    try { localStorage.setItem('filler-probe', 'x'.repeat(4096)); return 'no error'; } catch (e) { return e.name; }
  });
export const unfillStorage = (page) => page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('filler')) localStorage.removeItem(k); });

export const hash = (page) => page.evaluate(() => location.hash);
export const toasts = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.textContent));
export const warningUp = (page) => page.evaluate(() => !!document.getElementById('toast-kettle:save-failed'));
export const ffBy = (page, ms) => page.evaluate((m) => window.__kettle.ff(m), ms);
export const toEndMinus = (page, ms) => page.evaluate((b) => { const k = window.__kettle; const s = k.timer.getState(); k.ff(s.endsAt - k.clock.now() - b); }, ms);

export function logger(file) {
  mkdirSync(file.replace(/\/[^/]*$/, ''), { recursive: true });
  writeFileSync(file, '');
  return (...a) => { const line = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); console.log(line); appendFileSync(file, line + '\n'); };
}
export function args() {
  const o = {};
  for (const a of process.argv.slice(2)) { const m = a.match(/^--([^=]+)=(.*)$/); if (m) o[m[1]] = m[2]; else if (a.startsWith('--')) o[a.slice(2)] = '1'; }
  return o;
}

// ---- per-frame recorder for the storage-full warning (rAF): effective opacity, rect, protected controls it overlaps ----
export const REC_SRC = `(() => {
  if (window.__rec) return;
  const sel = 'button, a[href], [role="button"], input, textarea, select';
  const R = (window.__rec = { on: false, frames: [], t0: 0 });
  const eff = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const nm = (el) => (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\\s+/g, ' ').slice(0, 22);
  const loop = (now) => {
    if (!R.on) return;
    const w = document.getElementById('toast-kettle:save-failed');
    if (w) {
      const r = w.getBoundingClientRect(); const op = eff(w);
      const hits = [];
      if (op > 0.05 && r.width > 0 && r.height > 0) {
        const route = location.hash;
        const session = route === '#/focus' || route === '#/done';
        const cands = [...(session ? document.querySelectorAll('main ' + sel.split(', ').join(', main ')) : []), ...document.querySelectorAll('[data-toast-above] :is(' + sel + ')')];
        if (session) for (const t of document.querySelectorAll('main [role="timer"]')) if (t.parentElement) cands.push(t.parentElement);
        for (const el of new Set(cands)) {
          if (w.contains(el)) continue;
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) continue;
          if (inter(r, b) > 4) { const o = eff(el); if (o > 0.3) hits.push(nm(el) + '@' + o.toFixed(2)); }
        }
      }
      R.frames.push([Math.round(now - R.t0), +op.toFixed(2), Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right), hits.join(';')]);
    } else R.frames.push([Math.round(now - R.t0), null]);
    requestAnimationFrame(loop);
  };
  R.start = () => { R.frames = []; R.t0 = performance.now(); R.on = true; requestAnimationFrame(loop); };
  R.stop = () => { R.on = false; return R.frames; };
})()`;
export const recInstall = (page) => page.evaluate(REC_SRC);
export const recStart = (page) => page.evaluate(() => window.__rec.start());
export const recStop = (page) => page.evaluate(() => window.__rec.stop());
/** frames -> { frames, visibleMs, hitMs, segments:[{t0,t1,ms,maxOp,hits}], maxFrameGap } */
export function recSummary(frames) {
  const seg = []; let cur = null; let visibleMs = 0; let maxGap = 0;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]; const next = frames[i + 1];
    const dt = next ? next[0] - f[0] : 0;
    maxGap = Math.max(maxGap, dt);
    const vis = f[1] != null && f[1] > 0.05;
    if (vis) visibleMs += dt;
    const hit = vis && f[6];
    if (hit) { if (!cur) cur = { t0: f[0], t1: f[0], maxOp: 0, hits: new Set(), rect: [f[2], f[3]] }; cur.t1 = next ? next[0] : f[0]; cur.maxOp = Math.max(cur.maxOp, f[1]); f[6].split(';').forEach((h) => cur.hits.add(h.replace(/@.*/, ''))); }
    else if (cur) { cur.ms = cur.t1 - cur.t0; cur.hits = [...cur.hits]; seg.push(cur); cur = null; }
  }
  if (cur) { cur.ms = cur.t1 - cur.t0; cur.hits = [...cur.hits]; seg.push(cur); }
  return { frames: frames.length, visibleMs, hitMs: seg.reduce((s, x) => s + x.ms, 0), segments: seg, maxFrameGap: maxGap };
}
export const startBtn = (page) => page.getByRole('button', { name: /^Put the kettle on/ });
export const stamp = () => new Date().toISOString();

// ---- ordinary-toast recorder: every toast's rect/opacity vs the session readout parts (clock, status, meta) and controls ----
export const TREC_SRC = `(() => {
  if (window.__trec) return;
  const sel = 'button, a[href], [role="button"], input, textarea, select';
  const R = (window.__trec = { on: false, frames: [], t0: 0 });
  const eff = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const rr = (r) => [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
  const loop = (now) => {
    if (!R.on) return;
    const tl = [...document.querySelectorAll('[aria-label="Notifications"] li')];
    const f = { t: Math.round(now - R.t0), hash: location.hash, toasts: [] };
    const status = document.querySelector('main [role="timer"]');
    const parts = {};
    if (status) { const rd = status.parentElement; parts.readout = rd; parts.status = status; parts.meta = status.nextElementSibling; parts.clock = status.previousElementSibling; }
    const ctrls = [...document.querySelectorAll('main button')].filter((b) => eff(b) > 0.3);
    for (const li of tl) {
      const r = li.getBoundingClientRect(); const op = eff(li);
      const o = { text: li.textContent.trim().slice(0, 40), op: +op.toFixed(2), rect: rr(r), over: {} };
      if (op > 0.05) {
        for (const [k, el] of Object.entries(parts)) { if (!el) continue; const b = el.getBoundingClientRect(); const ar = inter(r, b); if (ar > 4) o.over[k] = Math.round(ar); }
        for (const c of ctrls) { const b = c.getBoundingClientRect(); const ar = inter(r, b); if (ar > 4) o.over['btn:' + (c.getAttribute('aria-label') || c.textContent).trim().slice(0, 14)] = Math.round(ar); }
      }
      f.toasts.push(o);
    }
    if (status) { f.status = rr(status.getBoundingClientRect()); f.readout = rr(parts.readout.getBoundingClientRect()); }
    R.frames.push(f);
    requestAnimationFrame(loop);
  };
  R.start = () => { R.frames = []; R.t0 = performance.now(); R.on = true; requestAnimationFrame(loop); };
  R.stop = () => { R.on = false; return R.frames; };
})()`;
export const trecInstall = (page) => page.evaluate(TREC_SRC);
export const trecStart = (page) => page.evaluate(() => window.__trec.start());
export const trecStop = (page) => page.evaluate(() => window.__trec.stop());

export const WARN = 'toast-kettle:save-failed';
export const waitWarning = (page, ms = 10000) => page.waitForSelector(`[id="${WARN}"]`, { timeout: ms }).then(() => true).catch(() => false);
/** Real brew start + real End within the first minute -> Today (with "Kettle's off" and, when storage is full, the warning). */
export async function todayAfterEnd(page, full = true) {
  await startBtn(page).click();
  await page.waitForFunction(() => location.hash === '#/focus'); await sleep(2200);
  await page.getByRole('button', { name: 'End session' }).click();
  const dlg = page.getByRole('dialog', { name: 'Leave the kettle early?' });
  await dlg.waitFor(); await sleep(400);
  await dlg.getByRole('button', { name: 'End session' }).click();
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 8000 });
  if (full) await waitWarning(page, 10000);
}
/** From a recorder's frames: visibility blinks (warning visible, then below `thr`, then visible again). */
export function blinks(frames, thr = 0.5) {
  const out = []; let lastVis = null; let gapStart = null;
  for (const f of frames) {
    const vis = f[1] != null && f[1] >= thr;
    if (vis) {
      if (gapStart != null && lastVis != null) out.push({ from: gapStart, to: f[0], ms: f[0] - gapStart, goneMs: f[0] - gapStart });
      gapStart = null; lastVis = f[0];
    } else if (lastVis != null && gapStart == null) gapStart = lastVis;
  }
  return out;
}

// ---- recorder v2: rAF samples + a sample on every DOM change in/around the toast region (reliable when frames stall under load) ----
export const REC2_SRC = `(() => {
  if (window.__rec) return;
  const sel = 'button, a[href], [role="button"], input, textarea, select';
  const R = (window.__rec = { on: false, frames: [], t0: 0, last: -1 });
  const eff = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const nm = (el) => (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\\s+/g, ' ').slice(0, 22);
  const sample = (now, src) => {
    if (!R.on) return;
    const t = Math.round(now - R.t0);
    const w = document.getElementById('toast-kettle:save-failed');
    if (w) {
      const r = w.getBoundingClientRect(); const op = eff(w);
      const hits = [];
      if (op > 0.05 && r.width > 0 && r.height > 0) {
        const route = location.hash;
        const session = route === '#/focus' || route === '#/done';
        const cands = [...(session ? document.querySelectorAll('main ' + sel.split(', ').join(', main ')) : []), ...document.querySelectorAll('[data-toast-above] :is(' + sel + ')')];
        if (session) for (const tm of document.querySelectorAll('main [role="timer"]')) if (tm.parentElement) cands.push(tm.parentElement);
        for (const el of new Set(cands)) {
          if (w.contains(el)) continue;
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) continue;
          if (inter(r, b) > 4) { const o = eff(el); if (o > 0.3) hits.push(nm(el) + '@' + o.toFixed(2)); }
        }
      }
      R.frames.push([t, +op.toFixed(2), Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right), hits.join(';'), src]);
    } else R.frames.push([t, null, 0, 0, 0, 0, '', src]);
  };
  const loop = (now) => { if (!R.on) return; sample(now, 'r'); requestAnimationFrame(loop); };
  const inRegion = (n) => { const e = n.nodeType === 1 ? n : n.parentElement; return !!(e && (e.closest('[aria-label="Notifications"]') || (e.firstElementChild && e.firstElementChild.getAttribute && e.firstElementChild.getAttribute('aria-label') === 'Notifications'))); };
  new MutationObserver((ms) => {
    if (!R.on) return;
    let go = false;
    for (const m of ms) { if (m.type === 'childList' || inRegion(m.target)) { go = true; break; } }
    if (go) sample(performance.now(), 'm');
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class', 'inert', 'aria-hidden'] });
  R.start = () => { R.frames = []; R.t0 = performance.now(); R.on = true; requestAnimationFrame(loop); };
  R.stop = () => { R.on = false; return R.frames; };
})()`;
export const recInstall2 = (page) => page.evaluate(REC2_SRC);
