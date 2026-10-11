// Lane C (round-7 review): re-classify round 6's follow-ups / unknowns on R7 against INT, in ONE browser, INT and R7
// back to back per scenario, a fresh context (disposable in-memory profile) per run.
// The "presenter" of the storage-full warning is whichever element shows it: INT's toast li#toast-kettle:save-failed or
// R7's in-page banner section[data-save-warning]. Per-frame (rAF) recorder: presence, effective opacity, box, whether it
// is over the session readout/controls (box intersect + elementFromPoint), toasts over its first line, live-region
// additions of its text, adds/removals (MutationObserver).
// Input: real only (page.mouse.wheel, CDP touch drags, page.keyboard, page.mouse clicks). Debug API for setup only
// (seed, startFocus, end, ff); toasts for item 8/10 raised with the app's own toast() (setup, real timers).
// No scrollIntoView / scrollTo / scrollBy / scrollTop writes.
//   node resid.mjs <outdir> <scenario,...|all>
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, appendFileSync } from 'node:fs';

const [out, which = 'all'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const REVS = [['INT', 'http://127.0.0.1:5303'], ['R7', 'http://127.0.0.1:5301']];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const log = (o) => { appendFileSync(`${out}/resid.jsonl`, JSON.stringify(o) + '\n'); console.log(JSON.stringify(o).slice(0, 600)); };

async function fresh({ w, h, text = 100, theme = 'light' }) {
  const phone = w < 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme, acceptDownloads: true });
  if (text !== 100) await ctx.addInitScript((pct) => { const add = () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }; if (document.head) add(); else addEventListener('DOMContentLoaded', add); }, text);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const page = await ctx.newPage();
  page.__errors = []; page.on('pageerror', (e) => page.__errors.push(e.message));
  return { ctx, page };
}
const ready = (p) => p.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60000 });
async function openNewbie(p, base, theme) {
  await p.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`, { waitUntil: 'load' });
  await ready(p);
  await p.evaluate(() => window.__kettle.seed('newbie'));
  await p.reload(); await ready(p);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
}
const fill = (p) => p.evaluate(() => { let c = 'x'.repeat(1 << 20), i = 0; while (c.length >= 8) { try { localStorage.setItem(`filler${i++}`, c); } catch { c = c.slice(0, c.length / 2); } } try { localStorage.setItem('filler-probe', 'x'.repeat(4096)); return 'no error'; } catch (e) { return e.name; } });
const unfill = (p) => p.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('filler')) localStorage.removeItem(k); });
const PRES = `document.getElementById('toast-kettle:save-failed') ?? document.querySelector('section[data-save-warning]')`;
const waitPres = (p, ms = 12000) => p.waitForFunction(`!!(${PRES})`, null, { timeout: ms }).then(() => true).catch(() => false);
const presInfo = (p) => p.evaluate(`(() => { const w = ${PRES}; if (!w) return null; const r = w.getBoundingClientRect(); return { kind: w.tagName === 'SECTION' ? 'banner' : 'toast', top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), scrollY: Math.round(scrollY), docH: document.scrollingElement.scrollHeight }; })()`);
const active = (p) => p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return 'BODY'; return (a.getAttribute('aria-label') || a.textContent || a.tagName).replace(/\s+/g, ' ').trim().slice(0, 40); });

// rAF recorder
const REC = `(() => {
  const R = (window.__R = { f: [], ev: [], said: [], t0: performance.now(), on: true });
  const T = () => Math.round(performance.now() - R.t0);
  const P = () => ${PRES};
  const isW = (x) => x.nodeType === 1 && (x.id === 'toast-kettle:save-failed' || x.matches?.('section[data-save-warning]') || !!x.querySelector?.('#toast-kettle\\\\:save-failed, section[data-save-warning]'));
  new MutationObserver((ms) => { for (const m of ms) { for (const x of m.addedNodes) { if (isW(x)) R.ev.push([T(), '+']); const el = x.nodeType === 1 ? x : x.parentElement; const live = el?.closest?.('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"]'); if (live && /storage is full|couldn.t save|Not saved/i.test(x.textContent ?? '')) R.said.push([T(), live.id || live.getAttribute('aria-label') || '']); } for (const x of m.removedNodes) if (isW(x)) R.ev.push([T(), '-']); } }).observe(document.body, { childList: true, subtree: true, characterData: true });
  const inter = (a, c) => a.right > c.left + 0.5 && a.left < c.right - 0.5 && a.bottom > c.top + 0.5 && a.top < c.bottom - 0.5;
  const f = () => {
    if (!R.on) return;
    const w = P();
    let op = 0; for (let e = w, o = 1; e && e !== document.documentElement; e = e.parentElement) op = o *= +getComputedStyle(e).opacity;
    const wr = w?.getBoundingClientRect();
    // session readout + controls (only those of the current, not aria-hidden, focus view)
    const fv = [...document.querySelectorAll('[data-focus-view]')].find((x) => !x.closest('[aria-hidden="true"],[inert]'));
    const targets = fv ? [...fv.querySelectorAll('[class*=_clock_], [role=timer], [data-toast-above] button')].filter((x) => { const q = x.getBoundingClientRect(); return q.width > 0 && q.bottom > 0 && q.top < innerHeight; }) : [];
    let boxOver = 0, hitOver = 0;
    if (w && op > 0.05) for (const t of targets) { const q = t.getBoundingClientRect(); if (inter(wr, q)) { boxOver++; const x = (Math.max(q.left, wr.left) + Math.min(q.right, wr.right)) / 2, y = (Math.max(q.top, wr.top) + Math.min(q.bottom, wr.bottom)) / 2; const hit = document.elementFromPoint(x, y); if (hit && w.contains(hit)) hitOver++; } }
    // toasts (other than the warning) over the presenter's first text line
    let firstOver = 0;
    if (w) { const tn = document.createTreeWalker(w, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? 1 : 3) }).nextNode(); if (tn) { const rg = document.createRange(); rg.selectNodeContents(tn); const lr = rg.getClientRects()[0]; if (lr) for (const li of document.querySelectorAll('[aria-label="Notifications"] li')) { if (li === w || li.contains(w)) continue; const lo = +getComputedStyle(li).opacity; if (lo > 0.05 && inter(li.getBoundingClientRect(), lr)) firstOver++; } } }
    R.f.push([T(), w ? (w.tagName === 'SECTION' ? 'B' : 'T') : '-', +op.toFixed(2), wr ? Math.round(wr.top) : null, wr ? Math.round(wr.bottom) : null, boxOver, hitOver, firstOver, Math.round(scrollY), location.hash]);
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
})()`;
const recStart = (p) => p.evaluate(REC);
const recStop = (p) => p.evaluate(() => { window.__R.on = false; return { f: window.__R.f, ev: window.__R.ev, said: window.__R.said }; });
function summ(r, from = 0) {
  const f = r.f.filter((x) => x[0] >= from);
  const firstP = f.findIndex((x) => x[1] !== '-');
  const after = firstP >= 0 ? f.slice(firstP) : [];
  return {
    frames: f.length,
    presentFrames: f.filter((x) => x[1] !== '-').length,
    kind: [...new Set(f.map((x) => x[1]))].join(''),
    goneOrFadedAfterFirst: after.filter((x) => x[1] === '-' || x[2] < 0.5).length,
    overSessionBoxFrames: f.filter((x) => x[5] > 0).length,
    overSessionHitFrames: f.filter((x) => x[6] > 0).length,
    toastOverFirstLineFrames: f.filter((x) => x[7] > 0).length,
    adds: r.ev.filter((e) => e[1] === '+').length,
    removals: r.ev.filter((e) => e[1] === '-').length,
    liveAdds: r.said.length,
    maxGap: f.reduce((m, x, i) => (i ? Math.max(m, x[0] - f[i - 1][0]) : m), 0),
  };
}
// Today with the warning: storage full, then a brew started and ended through the debug API (setup) -> Today
async function warnToday(p, base, theme) {
  await openNewbie(p, base, theme);
  const q = await fill(p);
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await p.waitForFunction(() => location.hash === '#/focus'); await sleep(2500);
  await p.evaluate(() => window.__kettle.timer.getState().end('user'));
  await p.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 10000 });
  const shown = await waitPres(p, 12000);
  return { quota: q, shown };
}
async function touchDrag(p, x, y0, dy) {
  const s = await p.context().newCDPSession(p);
  const steps = Math.max(2, Math.round(Math.abs(dy) / 8));
  await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= steps; i++) { await s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (dy * i) / steps }] }); await sleep(16); }
  await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await s.detach();
}
const clickName = async (p, re) => {
  const box = await p.evaluate((src) => { const rx = new RegExp(src); const b = [...document.querySelectorAll('button')].find((x) => rx.test((x.getAttribute('aria-label') || x.textContent || '').replace(/\s+/g, ' ').trim()) && x.getBoundingClientRect().width > 0 && !x.closest('[aria-hidden="true"],[inert]')); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, inView: q.top >= 0 && q.bottom <= innerHeight }; }, re.source);
  if (!box) throw new Error(`no button ${re}`);
  await p.mouse.click(box.x, box.y);
  return box;
};

const S = {};
// item 1 (+2 at 200 %, +14): Tab / Shift+Tab on Today with the warning
for (const [text, key] of [[100, 'Tab'], [100, 'Shift+Tab'], [200, 'Tab']]) S[`tab-t${text}-${key}`] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w: 375, h: 667, text });
  const setup = await warnToday(p, base, 'light'); await sleep(800);
  const pres0 = await presInfo(p);
  await recStart(p);
  let reached = null; const seq = [];
  for (let i = 1; i <= 45; i++) { await p.keyboard.press(key); await sleep(350); const a = await active(p); seq.push(a); if (/^Save backup/.test(a)) { reached = i; break; } }
  await sleep(300);
  const r = await recStop(p);
  await p.screenshot({ path: `${out}/${rev}-tab-t${text}-${key.replace('+', '')}-end.png` });
  log({ s: `tab-t${text}-${key}`, rev, base, setup, pres0, reachedSaveBackupAtPress: reached, presses: seq.length, seq: seq.slice(0, 45), presAtEnd: await presInfo(p), ...summ(r), errors: p.__errors.slice(-3) });
  await ctx.close();
};
// item 2: page scroll (wheel, touch fling, arrow keys) with the warning up, 375x667 @200
S['scroll-t200'] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w: 375, h: 667, text: 200 });
  const setup = await warnToday(p, base, 'light'); await sleep(800);
  await recStart(p);
  await p.mouse.move(187, 330);
  const ys = [];
  for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 100); await sleep(60); } await sleep(500); ys.push(await p.evaluate(() => scrollY));
  for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, -100); await sleep(60); } await sleep(500); ys.push(await p.evaluate(() => scrollY));
  await touchDrag(p, 187, 520, -300); await sleep(700); ys.push(await p.evaluate(() => scrollY));
  await touchDrag(p, 187, 200, 300); await sleep(700); ys.push(await p.evaluate(() => scrollY));
  await p.evaluate(() => document.activeElement?.blur?.());
  for (let i = 0; i < 8; i++) { await p.keyboard.press('ArrowDown'); await sleep(80); } await sleep(400); ys.push(await p.evaluate(() => scrollY));
  for (let i = 0; i < 8; i++) { await p.keyboard.press('ArrowUp'); await sleep(80); } await sleep(400); ys.push(await p.evaluate(() => scrollY));
  const r = await recStop(p);
  log({ s: 'scroll-t200', rev, base, setup, scrollYs: ys, ...summ(r), events: r.ev, errors: p.__errors.slice(-3) });
  await ctx.close();
};
// item 16: focus inside the warning while the page is wheeled; then (any rev) storage freed + saves
S['c6'] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w: 375, h: 667, text: 100 });
  const setup = await warnToday(p, base, 'light'); await sleep(600);
  let reached = null;
  for (let i = 1; i <= 25; i++) { await p.keyboard.press('Shift+Tab'); await sleep(400); if (/^Save backup/.test(await active(p))) { reached = i; break; } }
  if (!reached) for (let i = 1; i <= 45; i++) { await p.keyboard.press('Tab'); await sleep(350); if (/^Save backup/.test(await active(p))) { reached = -i; break; } }
  await recStart(p);
  const rows = [];
  await p.mouse.move(187, 200);
  for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 100); await sleep(400); rows.push({ y: await p.evaluate(() => Math.round(scrollY)), pres: !!(await presInfo(p)), focus: await active(p) }); }
  for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, -100); await sleep(400); rows.push({ y: await p.evaluate(() => Math.round(scrollY)), pres: !!(await presInfo(p)), focus: await active(p) }); }
  // recovery: room made, then the app saves again (setup: a settings write and a seed-free timer write through the debug API)
  await unfill(p);
  await p.evaluate(() => { const s = window.__kettle.settings.getState(); s.set({ muted: !s.muted }); s.set({ muted: !window.__kettle.settings.getState().muted }); window.__kettle.timer.setState({}); });
  let goneAt = null; const t0 = Date.now();
  while (Date.now() - t0 < 7000) { if (!(await presInfo(p))) { goneAt = Date.now() - t0; break; } await sleep(200); }
  const focusAfterRecovery = await active(p);
  const r = await recStop(p);
  log({ s: 'c6', rev, base, setup, reachedSaveBackup: reached, rows, presGoneAfterRecoveryMs: goneAt, focusAfterRecovery, ...summ(r), errors: p.__errors.slice(-3) });
  await ctx.close();
};
// items 3, 13, 14, 24: 667x375 @200: read every line of the warning with coarse wheel notches (100 / 53 px)
for (const notch of [100, 53]) S[`read-${notch}`] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w: 667, h: 375, text: 200, theme: 'dark' });
  await openNewbie(p, base, 'dark');
  const q = await fill(p);
  await recStart(p);
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await p.waitForFunction(() => location.hash === '#/focus'); await sleep(2500);
  await p.evaluate(() => window.__kettle.timer.getState().end('user'));
  await p.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 10000 });
  const shown = await waitPres(p, 12000);
  const tShown = await p.evaluate(() => performance.now() - window.__R.t0);
  // raster check (item 24): 4 screenshots 0.6 s apart while the presenter is in the DOM; boxes logged for the crop
  const ras = [];
  for (let i = 0; i < 4; i++) { const pi = await presInfo(p); const f = `${out}/${rev}-read-${notch}-raster-${i}.png`; await p.screenshot({ path: f }); ras.push({ f, pi }); await sleep(600); }
  await sleep(2500);
  const LINES = `(() => { const w = ${PRES}; if (!w) return null; const lines = []; const tw = document.createTreeWalker(w, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { if (!n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) lines.push(q); }
    let vis = { t: 0, b: innerHeight }; for (let e = w.parentElement; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowY !== 'visible') { const q = e.getBoundingClientRect(); vis = { t: Math.max(vis.t, q.top + e.clientTop), b: Math.min(vis.b, q.top + e.clientTop + e.clientHeight) }; } }
    const ok = lines.map((q) => { const whole = q.top >= vis.t - 0.5 && q.bottom <= vis.b + 0.5; const hit = whole ? document.elementFromPoint(q.left + Math.min(8, q.width / 2), q.top + q.height / 2) : null; return whole && !!hit && w.contains(hit); });
    const b = w.querySelector('button'); let sb = false; if (b) { const q = b.getBoundingClientRect(); const whole = q.top >= vis.t - 0.5 && q.bottom <= vis.b + 0.5; const hit = whole ? document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2) : null; sb = whole && !!hit && b.contains(hit); }
    return { n: lines.length, ok, sb, vis: [Math.round(vis.t), Math.round(vis.b)] }; })()`;
  const pi = await presInfo(p);
  const aimY = pi && pi.kind === 'toast' ? Math.max(5, Math.min(370, (pi.top + pi.bottom) / 2)) : 200;
  await p.mouse.move(pi && pi.kind === 'toast' ? (pi.left + pi.right) / 2 : 333, aimY);
  const seen = new Set(); let sbSeen = false; const steps = [];
  const look = async () => { const L = await p.evaluate(LINES); if (!L) return null; L.ok.forEach((o, i) => o && seen.add(i)); if (L.sb) sbSeen = true; return L; };
  let L0 = await look(); let total = L0?.n ?? 0;
  for (const dir of [1, -1]) {
    let still = 0;
    for (let i = 0; i < 40 && still < 3; i++) {
      const before = await p.evaluate(() => [scrollY, ...[...document.querySelectorAll('[aria-label="Notifications"] ol')].map((x) => x.scrollTop)].join(','));
      await p.mouse.wheel(0, dir * notch); await sleep(250);
      const L = await look(); if (L) total = Math.max(total, L.n);
      const after = await p.evaluate(() => [scrollY, ...[...document.querySelectorAll('[aria-label="Notifications"] ol')].map((x) => x.scrollTop)].join(','));
      steps.push([dir, after, L ? L.ok.map((o) => (o ? 1 : 0)).join('') : '-', L?.sb ? 1 : 0]);
      still = before === after ? still + 1 : 0;
    }
  }
  const r = await recStop(p);
  log({ s: `read-${notch}`, rev, base, quota: q, shown, tShownMs: Math.round(tShown), pres: pi, linesTotal: total, linesSeenWhole: seen.size, saveBackupHitSeen: sbSeen, steps, raster: ras, ...summ(r, tShown - 50), errors: p.__errors.slice(-3) });
  await ctx.close();
};
// item 18: warning over the leaving Today / countdown at brew start (real click on the docked start)
for (const [w, h, text] of [[375, 667, 200], [1440, 900, 100]]) S[`start-${w}-t${text}`] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w, h, text });
  const setup = await warnToday(p, base, 'light');
  await p.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li:not([id="toast-kettle:save-failed"])').length === 0, null, { timeout: 15000 }).catch(() => {});
  await sleep(600);
  await recStart(p);
  const tc = await p.evaluate(() => performance.now() - window.__R.t0);
  const box = await clickName(p, /^Put the kettle on/);
  await sleep(2500);
  const r = await recStop(p);
  await p.screenshot({ path: `${out}/${rev}-start-${w}-t${text}-end.png` });
  log({ s: `start-${w}-t${text}`, rev, base, setup, startBtn: box, ...summ(r, tc), errors: p.__errors.slice(-3) });
  await ctx.close();
};
// item 19: "Back to your brew" (real browser Back from the brew, then a real click)
for (const text of [100, 200]) S[`back-t${text}`] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w: 375, h: 667, text });
  await openNewbie(p, base, 'light');
  const q = await fill(p);
  await clickName(p, /^Put the kettle on/);
  await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
  await p.goBack();
  await p.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 8000 });
  const shown = await waitPres(p, 8000); await sleep(1000);
  const pres = await presInfo(p);
  await recStart(p);
  const tc = await p.evaluate(() => performance.now() - window.__R.t0);
  let clicked = null; try { clicked = await clickName(p, /^Back to your brew/); } catch (e) { clicked = String(e).slice(0, 80); }
  await sleep(2200);
  const r = await recStop(p);
  log({ s: `back-t${text}`, rev, base, quota: q, shownOnToday: shown, presOnToday: pres, clicked, hash: await p.evaluate(() => location.hash), ...summ(r, tc), errors: p.__errors.slice(-3) });
  await ctx.close();
};
// item 8: ordinary toasts over the countdown digits / status line (brew and break), 3 toasts via the app's toast()
for (const [w, h, text] of [[375, 667, 100], [390, 844, 100], [844, 390, 200]]) for (const st of ['brew', 'break']) S[`t8-${w}x${h}-t${text}-${st}`] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w, h, text });
  await openNewbie(p, base, 'light');
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await p.waitForFunction(() => location.hash === '#/focus'); await sleep(2000);
  if (st === 'break') { await p.evaluate(() => window.__kettle.nearEnd()); await sleep(400); await p.evaluate(() => window.__kettle.finish()); await sleep(5500); await clickName(p, /^(Tea time|Long tea break)/); await sleep(3500); }
  await p.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); toast.dismiss?.(); });
  await sleep(600);
  await p.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); for (const m of ['Next brew: 25 min', 'Recipe done · Take a full tea break', 'Cozy level 5! A new rug for the nook']) toast(m, { duration: 8000 }); });
  await sleep(1500);
  const m = await p.evaluate(() => {
    const inter = (a, c) => a.right > c.left + 0.5 && a.left < c.right - 0.5 && a.bottom > c.top + 0.5 && a.top < c.bottom - 0.5;
    const fv = [...document.querySelectorAll('[data-focus-view]')].find((x) => !x.closest('[aria-hidden="true"],[inert]'));
    const tg = { clock: fv?.querySelector('[class*=_clock_]'), status: fv?.querySelector('[role=timer]') };
    const lis = [...document.querySelectorAll('[aria-label="Notifications"] li')].filter((l) => +getComputedStyle(l).opacity > 0.05);
    const list = document.querySelector('[aria-label="Notifications"] ol'); const lr = list?.getBoundingClientRect();
    const res = {};
    for (const [k, e] of Object.entries(tg)) { if (!e) { res[k] = null; continue; } const q = e.getBoundingClientRect(); const by = lis.filter((l) => { const b = l.getBoundingClientRect(); const c = lr ? { left: b.left, right: b.right, top: Math.max(b.top, lr.top), bottom: Math.min(b.bottom, lr.bottom) } : b; return c.bottom > c.top && inter(c, q); }).length; const hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); res[k] = { box: [Math.round(q.top), Math.round(q.bottom)], toastsOver: by, centreHitsToast: !!hit?.closest('[aria-label="Notifications"]') }; }
    res.toasts = lis.map((l) => { const b = l.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; });
    res.room = lr ? [Math.round(lr.top), Math.round(lr.bottom)] : null; res.hash = location.hash;
    return res;
  });
  await p.screenshot({ path: `${out}/${rev}-t8-${w}x${h}-t${text}-${st}.png` });
  log({ s: `t8-${w}x${h}-t${text}-${st}`, rev, base, ...m, errors: p.__errors.slice(-3) });
  await ctx.close();
};
// item 10: 1440 lift lag after End (a toast up during the brew; real End -> Today): toast over the docked start
S['lift10'] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w: 1440, h: 900 });
  await openNewbie(p, base, 'light');
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await p.waitForFunction(() => location.hash === '#/focus'); await sleep(2000);
  await p.evaluate(() => window.__kettle.ff(3 * 60_000)); await sleep(300);
  await p.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); toast('Cozy level 5! A new rug for the nook', { duration: 8000 }); });
  await sleep(800);
  await clickName(p, /^End session$/);
  await p.waitForSelector('[role=dialog]'); await sleep(400);
  await p.evaluate(() => {
    const R = (window.__L = { f: [], t0: performance.now(), on: true });
    const inter = (a, c) => a.right > c.left + 0.5 && a.left < c.right - 0.5 && a.bottom > c.top + 0.5 && a.top < c.bottom - 0.5;
    const f = () => { if (!R.on) return; const lis = [...document.querySelectorAll('[aria-label="Notifications"] li')].filter((l) => +getComputedStyle(l).opacity > 0.05).map((l) => l.getBoundingClientRect()); const ctr = [...document.querySelectorAll('[data-toast-above] :is(button,a[href],input,textarea)')].filter((c) => !c.closest('[aria-hidden="true"],[inert]')).map((c) => c.getBoundingClientRect()).filter((q) => q.width > 0); R.f.push([Math.round(performance.now() - R.t0), location.hash, lis.length, ctr.length, lis.some((a) => ctr.some((c) => inter(a, c))) ? 1 : 0]); requestAnimationFrame(f); }; requestAnimationFrame(f);
  });
  const dlgBtn = await p.evaluate(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find((x) => /^End session$/.test(x.textContent.trim()) || x.getAttribute('aria-label') === 'End session'); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
  const tc = await p.evaluate(() => performance.now() - window.__L.t0);
  await p.mouse.click(dlgBtn.x, dlgBtn.y);
  await sleep(2500);
  const f = await p.evaluate(() => { window.__L.on = false; return window.__L.f; });
  const onToday = f.filter((x) => x[0] >= tc && (x[1] === '#/' || x[1] === ''));
  const over = onToday.filter((x) => x[4]);
  log({ s: 'lift10', rev, base, todayFrames: onToday.length, overFrames: over.length, overMs: over.length ? over[over.length - 1][0] - over[0][0] : 0, firstTodayT: onToday[0]?.[0] - tc, sample: over.slice(0, 5), errors: p.__errors.slice(-3) });
  await ctx.close();
};
// item 11: Today load at 150 % (transient over-width) and 200 % (CLS), 375x667
for (const text of [150, 200]) S[`load-t${text}`] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w: 375, h: 667, text });
  await p.addInitScript(() => {
    window.__ls = []; window.__ow = 0;
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ls.push([Math.round(e.startTime), +e.value.toFixed(4), e.hadRecentInput]); }).observe({ type: 'layout-shift', buffered: true }); } catch {}
    const f = () => { const d = document.scrollingElement; if (d) window.__ow = Math.max(window.__ow, d.scrollWidth - d.clientWidth); if (performance.now() < 6000) requestAnimationFrame(f); }; requestAnimationFrame(f);
  });
  await p.goto(`${base}/?debug&seed=newbie&theme=light&nooktime=day#/`, { waitUntil: 'load' });
  await sleep(4500);
  const m = await p.evaluate(() => ({ ls: window.__ls, cls: +window.__ls.reduce((a, x) => a + x[1], 0).toFixed(4), clsNoInput: +window.__ls.filter((x) => !x[2]).reduce((a, x) => a + x[1], 0).toFixed(4), maxOverWidth: window.__ow, overWidthNow: document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth }));
  log({ s: `load-t${text}`, rev, base, ...m, errors: p.__errors.slice(-3) });
  await ctx.close();
};

// check 1 (footer): the summary's Tea time / Skip footer at 100 / 200 %: footer whole + hit-testable; details expanded by
// a real click, the sheet wheeled (real wheel) to its end: the last line clears the footer
for (const [w, h] of [[375, 667], [390, 844], [844, 390], [1440, 900]]) for (const text of [100, 200]) S[`footer-${w}x${h}-t${text}`] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w, h, text });
  await openNewbie(p, base, 'light');
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await p.waitForFunction(() => location.hash === '#/focus'); await sleep(2000);
  await p.evaluate(() => window.__kettle.nearEnd()); await sleep(400);
  await p.evaluate(() => window.__kettle.finish()); await sleep(5500);
  const FT = () => {
    const vis = (b) => { if (!b) return null; const q = b.getBoundingClientRect(); const whole = q.top >= -0.5 && q.bottom <= innerHeight + 0.5 && q.left >= -0.5 && q.right <= innerWidth + 0.5; const hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { top: Math.round(q.top), bottom: Math.round(q.bottom), whole, hit: !!hit && b.contains(hit) }; };
    const btn = (re) => [...document.querySelectorAll('button')].find((x) => re.test((x.getAttribute('aria-label') || x.textContent || '').replace(/\s+/g, ' ').trim()) && x.getBoundingClientRect().width > 0 && !x.closest('[aria-hidden="true"],[inert]'));
    const tea = btn(/^(Tea time|Long tea break)/), skip = btn(/^Skip/);
    const dock = tea?.closest('[data-toast-above]') ?? tea?.parentElement;
    return { hash: location.hash, tea: vis(tea), skip: vis(skip), footerTop: dock ? Math.round(dock.getBoundingClientRect().top) : null };
  };
  const before = await p.evaluate(FT);
  const exp = await p.evaluate(() => { const b = [...document.querySelectorAll('[aria-expanded]')].find((x) => x.getBoundingClientRect().width > 0 && !x.closest('[aria-hidden="true"],[inert]')); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, inView: q.top >= 0 && q.bottom <= innerHeight, label: (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 30) }; });
  let expanded = null;
  if (exp && exp.inView) { await p.mouse.click(exp.x, exp.y); await sleep(700); expanded = await p.evaluate(() => [...document.querySelectorAll('[aria-expanded]')].some((x) => x.getAttribute('aria-expanded') === 'true')); }
  // real wheel over the sheet's centre until nothing moves
  const sc = await p.evaluate(() => { const s = [...document.querySelectorAll('[class*=scroll]')].find((x) => x.scrollHeight > x.clientHeight + 1 && !x.closest('[aria-hidden="true"],[inert]')); if (!s) return null; const q = s.getBoundingClientRect(); return { x: q.left + q.width / 2, y: Math.max(q.top + 10, Math.min(q.bottom - 10, (q.top + q.bottom) / 2)) }; });
  let wheels = 0;
  if (sc) { await p.mouse.move(sc.x, sc.y); let still = 0; for (let i = 0; i < 30 && still < 3; i++) { const b4 = await p.evaluate(() => [...document.querySelectorAll('[class*=scroll]')].map((x) => x.scrollTop).join() + '|' + scrollY); await p.mouse.wheel(0, 100); wheels++; await sleep(200); const af = await p.evaluate(() => [...document.querySelectorAll('[class*=scroll]')].map((x) => x.scrollTop).join() + '|' + scrollY); still = b4 === af ? still + 1 : 0; } }
  const after = await p.evaluate(() => {
    const s = [...document.querySelectorAll('[class*=scroll]')].find((x) => x.scrollHeight > x.clientHeight + 1 && !x.closest('[aria-hidden="true"],[inert]')) ?? [...document.querySelectorAll('[class*=scroll]')].find((x) => !x.closest('[aria-hidden="true"],[inert]'));
    if (!s) return null;
    const tw = document.createTreeWalker(s, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = tw.nextNode())) if (n.textContent.trim() && n.parentElement.getBoundingClientRect().height > 0) last = n;
    const rg = document.createRange(); rg.selectNodeContents(last); const rs = [...rg.getClientRects()]; const lr = rs[rs.length - 1];
    const hit = document.elementFromPoint(lr.left + Math.min(8, lr.width / 2), lr.top + lr.height / 2);
    return { scroll: [Math.round(s.scrollTop), s.scrollHeight - s.clientHeight], lastLine: last.textContent.trim().slice(0, 50), lastBottom: Math.round(lr.bottom), lastTop: Math.round(lr.top), lastHit: !!hit && last.parentElement.contains(hit) };
  });
  const end = await p.evaluate(FT);
  await p.screenshot({ path: `${out}/${rev}-footer-${w}x${h}-t${text}-end.png` });
  log({ s: `footer-${w}x${h}-t${text}`, rev, base, before, expander: exp, expanded, wheels, after, end, clears: after && end.footerTop != null ? after.lastBottom <= end.footerTop + 0.5 : null, errors: p.__errors.slice(-3) });
  await ctx.close();
};

// check 1 (visual): the panel wheeled (real wheel) until nothing moves: paused break 375x667 dark, Break's over (task)
// 844x390 light, 200 % text; screenshot + the panel's scroll offset / range + last control and caption boxes
for (const [w, h, theme, st] of [[375, 667, 'dark', 'paused'], [844, 390, 'light', 'over'], [390, 844, 'light', 'paused']]) S[`pend-${w}x${h}-${theme}-${st}`] = async (rev, base) => {
  const { ctx, page: p } = await fresh({ w, h, text: 200, theme });
  await openNewbie(p, base, theme);
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await p.waitForFunction(() => location.hash === '#/focus'); await sleep(2000);
  await p.evaluate(() => window.__kettle.nearEnd()); await sleep(400);
  await p.evaluate(() => window.__kettle.finish()); await sleep(5500);
  await clickName(p, /^(Tea time|Long tea break)/); await sleep(3000);
  if (st === 'paused') await p.evaluate(() => window.__kettle.timer.getState().pause());
  else { await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartFocus: false })); await p.evaluate(() => window.__kettle.finish()); }
  await sleep(3000);
  const aim = await p.evaluate(() => { const m = [...document.querySelectorAll('[data-focus-view] main')].find((x) => !x.closest('[aria-hidden="true"],[inert]')); const q = m.getBoundingClientRect(); return { x: (Math.max(0, q.left) + Math.min(innerWidth, q.right)) / 2, y: (Math.max(0, q.top) + Math.min(innerHeight, q.bottom)) / 2 }; });
  await p.mouse.move(aim.x, aim.y);
  let still = 0, n = 0;
  for (let i = 0; i < 30 && still < 3; i++) { const b4 = await p.evaluate(() => [...document.querySelectorAll('[data-focus-view] main')].map((x) => x.scrollTop).join()); await p.mouse.wheel(0, 100); n++; await sleep(300); const af = await p.evaluate(() => [...document.querySelectorAll('[data-focus-view] main')].map((x) => x.scrollTop).join()); still = b4 === af ? still + 1 : 0; }
  const m = await p.evaluate(() => { const fv = [...document.querySelectorAll('[data-focus-view]')].find((x) => !x.closest('[aria-hidden="true"],[inert]')); const pm = fv.querySelector('main'); const caps = [...fv.querySelectorAll('[data-caption]')].map((c) => { const q = c.getBoundingClientRect(); return [c.textContent.trim(), Math.round(q.top), Math.round(q.bottom)]; }); const btns = [...fv.querySelectorAll('main button')].map((b) => { const q = b.getBoundingClientRect(); return [(b.getAttribute('aria-label') || b.textContent).trim().slice(0, 24), Math.round(q.top), Math.round(q.bottom)]; }); return { panel: [Math.round(pm.scrollTop), pm.scrollHeight - pm.clientHeight, Math.round(pm.getBoundingClientRect().bottom)], innerHeight, caps, btns }; });
  await p.screenshot({ path: `${out}/${rev}-pend-${w}x${h}-${theme}-${st}.png` });
  log({ s: `pend-${w}x${h}-${theme}-${st}`, rev, base, wheels: n, ...m, errors: p.__errors.slice(-3) });
  await ctx.close();
};

// Order (set while the run was still queued, to put round 6's items first): the groups below, those named in the
// argument list plus 'pend' (which the queued list predates).
const ORDER = ['tab', 'scroll', 'start', 'back', 'c6', 'read', 'footer', 'pend', 't8', 'lift10', 'load'];
const asked = which === 'all' ? ORDER : [...which.split(','), 'pend'];
const names = ORDER.filter((g) => asked.includes(g)).flatMap((g) => Object.keys(S).filter((k) => k.startsWith(g)));
for (const n of names) for (const [rev, base] of REVS) {
  const t0 = Date.now();
  try { await S[n](rev, base); } catch (e) { log({ s: n, rev, error: String(e).slice(0, 400) }); }
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${n} ${rev} ${Date.now() - t0} ms`);
}
await browser.close();
