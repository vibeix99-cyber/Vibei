// Lead checker W2R3 / T2 (notices without overlays). Independent probe: real taps / wheel; the debug API only seeds,
// fast-forwards and (flow "queue"/"ambience") raises notices the app has no button for.
//   node t2-lead.mjs --base http://127.0.0.1:5476 --cfg 390x844:light:100 --flow end|breakover|ambience|history|queue --out f.json
// Per animation frame, while a notice (strip item or inline Undo row) is drawn and no sheet is open:
//  * HIT-TEST both ways: 7x3 points on each notice (what is on top there?) and 9 points on every control / text / row in
//    view (is any of them a notice?); plus box intersection with the same set (a second, geometric measure).
//  * SHIFTS: every change in a strip's or Undo row's height, with MY OWN record of input (pointer down count, ms since
//    any input, ms since the last tap/key) — independent of moment.ts — and the app's stated reason (`why`).
import { chromium } from 'playwright';
import fs from 'node:fs';

const A = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, l) => (x.startsWith('--') ? [...a, [x.slice(2), l[i + 1]]] : a), []));
const [vw, theme, pct] = (A.cfg ?? '390x844:light:100').split(':');
const [W, H] = vw.split('x').map(Number);
const PHONE = W < 900;
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const out = { base: A.base, cfg: A.cfg, flow: A.flow, kind: A.kind ?? null, scene: A.scene ?? 'off', steps: [] };
const step = (k, v) => { out.steps.push({ t: Date.now() - T0, k, ...(v ?? {}) }); };
let T0 = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function recorder() {
  const PROT = 'button, a[href], input, select, textarea, summary, [role=button], [role=link], [role=radio], [role=checkbox], [role=switch], [role=tab], [role=slider], [role=option], [tabindex]:not([tabindex="-1"]), li, [role=row], [role=listitem]';
  const R = (window.__L = { frames: 0, noticeFrames: 0, modalFrames: 0, covered: 0, coveredEx: [], geo: 0, geoEx: [], noticeHidden: 0, noticeHiddenEx: [], chromeOver: 0, shifts: [], seen: {}, stop: false, input: { down: 0, last: -1e9, tap: -1e9 } });
  const I = R.input;
  const o = { capture: true, passive: true };
  addEventListener('pointerdown', () => { I.down++; I.last = performance.now(); }, o);
  addEventListener('pointerup', () => { I.down = Math.max(0, I.down - 1); I.last = I.tap = performance.now(); }, o);
  addEventListener('pointercancel', () => { I.down = Math.max(0, I.down - 1); I.last = performance.now(); }, o);
  for (const ev of ['wheel', 'touchstart', 'touchmove', 'touchend']) addEventListener(ev, () => (I.last = performance.now()), o);
  addEventListener('pointermove', (e) => e.pointerType === 'mouse' && (I.last = performance.now()), o);
  addEventListener('keydown', () => (I.last = I.tap = performance.now()), o);
  const fixedOf = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') return a; } return null; };
  const lab = (e) => `${e.tagName.toLowerCase()} "${((e.innerText || e.getAttribute('aria-label') || '') + '').replace(/\s+/g, ' ').trim().slice(0, 36)}"`;
  const clip = (e) => {
    const q = e.getBoundingClientRect();
    let t = Math.max(0, q.top), b = Math.min(innerHeight, q.bottom), l = Math.max(0, q.left), r = Math.min(innerWidth, q.right);
    for (let a = e.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const c = a.getBoundingClientRect();
      t = Math.max(t, c.top); b = Math.min(b, c.bottom); l = Math.max(l, c.left); r = Math.min(r, c.right);
    }
    return { t, b, l, r };
  };
  const sizes = new Map();
  let lastHash = location.hash, hashAt = performance.now();
  const tick = () => {
    if (R.stop) return;
    R.frames++;
    const now = performance.now();
    if (location.hash !== lastHash) { lastHash = location.hash; hashAt = now; }
    // shifts
    const parts = [...document.querySelectorAll('[data-notice-strip], [data-inline-undo]')].filter((n) => !n.closest('[data-route-leaving]'));
    const live = new Set();
    for (const n of parts) {
      live.add(n);
      const h = Math.round(n.getBoundingClientRect().height);
      const prev = sizes.get(n);
      if (prev !== undefined && prev !== h) {
        const k = window.__kettle;
        const st = k?.notices?.();
        const r = n.getBoundingClientRect();
        R.shifts.push({ at: Math.round(now), hash: location.hash, sinceRoute: Math.round(now - hashAt), kind: n.matches('[data-inline-undo]') ? 'undo' : 'strip', from: prev, to: h, top: Math.round(r.top), down: I.down, sinceInput: Math.round(now - I.last), sinceTap: Math.round(now - I.tap), why: st?.why ?? null, app: k?.moment?.() ?? null });
      }
      sizes.set(n, h);
    }
    for (const n of [...sizes.keys()]) if (!live.has(n)) {
      // removed from the DOM (an Undo row going): record as a shift to 0
      R.shifts.push({ at: Math.round(now), hash: location.hash, sinceRoute: Math.round(now - hashAt), kind: 'removed', from: sizes.get(n), to: 0, down: I.down, sinceInput: Math.round(now - I.last), sinceTap: Math.round(now - I.tap), why: window.__kettle?.notices?.().why ?? null });
      sizes.delete(n);
    }
    const notices = [...document.querySelectorAll('[data-notice-strip] li, [data-inline-undo]')].filter((n) => {
      if (n.closest('[data-route-leaving], [inert]')) return false;
      const r = n.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    });
    if (notices.length) {
      if (document.querySelector('[role=dialog]') || document.getElementById('root')?.hasAttribute('inert')) R.modalFrames++;
      else {
        R.noticeFrames++;
        const boxes = notices.map((n) => ({ n, c: clip(n) })).filter(({ c }) => c.b - c.t > 1 && c.r - c.l > 1);
        for (const { n, c } of boxes) {
          const key = (n.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50);
          R.seen[key] = (R.seen[key] || 0) + 1;
          // what is on top at 7x3 points of the notice?
          for (const fx of [0.04, 0.2, 0.35, 0.5, 0.65, 0.8, 0.96]) for (const fy of [0.15, 0.5, 0.85]) {
            const x = c.l + (c.r - c.l) * fx, y = c.t + (c.b - c.t) * fy;
            const hit = document.elementFromPoint(x, y);
            if (!hit || n.contains(hit)) continue;
            if (fixedOf(hit) && !fixedOf(n)) { R.chromeOver++; continue; } // page chrome over scrolled content (by design)
            R.noticeHidden++;
            if (R.noticeHiddenEx.length < 20) R.noticeHiddenEx.push({ at: Math.round(now), hash: location.hash, notice: key, by: lab(hit), x: Math.round(x), y: Math.round(y) });
          }
        }
        // every control / text / row in view: 9 points, is a notice on top there? and box intersection
        const all = document.body.getElementsByTagName('*');
        for (let i = 0; i < all.length; i++) {
          const e = all[i];
          let own = false;
          for (const t of e.childNodes) if (t.nodeType === 3 && t.textContent.trim()) { own = true; break; }
          if (!own && !e.matches(PROT)) continue;
          if (boxes.some(({ n }) => n.contains(e) || e.contains(n))) continue;
          if (e.closest('[data-route-leaving], [inert], [data-notices-said]')) continue;
          const q = e.getBoundingClientRect();
          if (q.width <= 1 || q.height <= 1 || q.bottom <= 0 || q.top >= innerHeight) continue;
          const c = clip(e);
          if (c.b - c.t <= 1 || c.r - c.l <= 1) continue;
          for (const { n, c: nb } of boxes) {
            if (c.r > nb.l + 0.5 && c.l < nb.r - 0.5 && c.b > nb.t + 0.5 && c.t < nb.b - 0.5) {
              if (fixedOf(e) && !fixedOf(n)) continue; // chrome over the scrolling notice: counted above
              R.geo++;
              if (R.geoEx.length < 20) R.geoEx.push({ at: Math.round(now), hash: location.hash, notice: (n.innerText || '').slice(0, 30), what: lab(e), box: [c.l, c.t, c.r - c.l, c.b - c.t].map(Math.round) });
            }
          }
          for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) {
            const x = c.l + (c.r - c.l) * fx, y = c.t + (c.b - c.t) * fy;
            const hit = document.elementFromPoint(x, y);
            if (hit && boxes.some(({ n }) => n.contains(hit))) {
              R.covered++;
              if (R.coveredEx.length < 20) R.coveredEx.push({ at: Math.round(now), hash: location.hash, what: lab(e), x: Math.round(x), y: Math.round(y) });
            }
          }
        }
      }
    }
    requestAnimationFrame(tick);
  };
  addEventListener('DOMContentLoaded', () => requestAnimationFrame(tick));
}

const browser = await chromium.launch(A.headed ? { headless: false } : {});
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: PHONE ? 2 : 1, isMobile: PHONE, hasTouch: PHONE, colorScheme: theme, reducedMotion: A.reduced ? 'reduce' : 'no-preference' });
await ctx.addInitScript(([p, scene]) => {
  try {
    if (!localStorage.getItem('kettle:settings'))
      localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, ...(scene === 'off' ? { scene: 'off' } : {}), autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
  } catch {}
  if (p !== '100') addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); });
}, [pct, out.scene]);
await ctx.addInitScript(recorder);
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.clock.install({ time: MONDAY });
await p.clock.resume();

const tapXY = (x, y) => (PHONE ? p.touchscreen.tap(x, y) : p.mouse.click(x, y));
/** 9-point on-top check of a locator; returns its centre or null. */
async function onTop(loc) {
  return loc.evaluate((e) => {
    const r = e.getBoundingClientRect();
    if (r.width <= 0 || r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) return null;
    let ok = 0;
    for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) { const h = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if (h && e.contains(h)) ok++; }
    return ok === 9 ? { x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top, w: r.width, h: r.height } : null;
  }).catch(() => null);
}
/** Wheel (or swipe) until on top, then tap for real. */
async function press(loc, label, { wheelAt, dir = 1 } = {}) {
  await loc.first().waitFor({ state: 'attached', timeout: 20000 });
  const el = loc.first();
  let at = await onTop(el);
  for (let i = 0; !at && i < 14; i++) {
    const pos = await el.evaluate((e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2 > innerHeight / 2 ? 1 : -1; }).catch(() => dir);
    const wx = wheelAt?.x ?? W / 2, wy = wheelAt?.y ?? H / 2;
    await p.mouse.move(wx, wy);
    await p.mouse.wheel(0, 110 * pos);
    await sleep(350);
    at = await onTop(el);
  }
  if (!at) {
    // setup fallback (recorded): a programmatic scroll into view, then the same real tap
    await el.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {});
    await sleep(500);
    at = await onTop(el);
    step('fallback-scroll', { label, onTop: !!at });
    if (!at) { step('not-on-top', { label }); return null; }
  }
  await tapXY(at.x, at.y);
  step('tap', { label, at: [Math.round(at.x), Math.round(at.y)], size: [Math.round(at.w), Math.round(at.h)] });
  return at;
}
const k = (fn, ...args) => p.evaluate(([f, a]) => window.__kettle[f](...a), [fn, args]);
const ready = () => p.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60000 });

async function startBrewWithTask(seed = 'newbie') {
  await p.goto(`${A.base}/?debug&seed=${seed}&theme=${theme}#/`);
  await ready();
  await p.evaluate(() => document.fonts.ready);
  await sleep(700);
  const field = p.getByRole('textbox', { name: /What are you brewing/ });
  await press(field, 'field');
  await p.keyboard.type('Chapter 3 notes', { delay: 10 });
  await p.keyboard.press('Escape').catch(() => {});
  await sleep(300);
  await press(p.getByRole('button', { name: /^Put the kettle on · / }), 'start');
  await p.waitForFunction(() => location.hash === '#/focus');
  await sleep(1200);
}

try {
  T0 = Date.now();
  if (A.flow === 'end') {
    await startBrewWithTask();
    await k('ff', 3 * 60_000);
    await sleep(500);
    await press(p.getByRole('button', { name: 'End session' }), 'End');
    const sheet = p.getByRole('dialog', { name: 'Leave the kettle early?' });
    await sheet.waitFor({ timeout: 10000 });
    await sleep(400);
    const t0 = Date.now();
    await press(sheet.getByRole('button', { name: 'End session' }), 'End session (sheet)');
    await sleep(Math.max(0, 600 - (Date.now() - t0)));
    // Mark done at +0.6 s (wheel first where it is not on top)
    const mark = p.getByRole('button', { name: /^Mark “.*” done/ });
    await p.evaluate(() => addEventListener('pointerdown', (e) => { const r = e.target?.closest?.('p'); if (r && !window.__rowAtDown) window.__rowAtDown = { top: r.getBoundingClientRect().top, text: r.innerText.slice(0, 60) }; }, { capture: true }));
    const m = await press(mark, 'Mark done');
    out.markDoneTapMs = Date.now() - t0;
    await sleep(120);
    const undo = p.locator('[data-undo-for="mark-done"]');
    out.undoRow = await undo.evaluate((e) => { const r = e.getBoundingClientRect(); return { top: r.top, h: r.height, text: e.innerText }; }).catch(() => null);
    if (m && out.undoRow) out.undoRowVsMarkRow = Math.round((out.undoRow.top - (await p.evaluate(() => 0))) * 10) / 10;
    out.markRowTopAtTap = m ? m.top : null;
    out.rowAtDown = await p.evaluate(() => window.__rowAtDown ?? null);
    const ub = undo.getByRole('button');
    out.undoOnTop = await onTop(ub);
    await sleep(900);
    await press(ub, 'Undo');
    await sleep(400);
    out.fieldAfterUndo = await p.getByRole('textbox', { name: /What are you brewing/ }).inputValue().catch(() => null);
    // then hands off for 10 s: End's notice leaves at rest (the in-flow shift we audit)
    await sleep(10000);
    out.noticesEnd = await k('notices');
  } else if (A.flow === 'breakover') {
    await startBrewWithTask();
    await k('finish');
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 });
    await sleep(2500);
    await press(p.getByRole('button', { name: /^Tea time/ }), 'Tea time');
    await sleep(1500);
    await k('finish');
    await p.getByRole('heading', { name: /Break.s over/ }).waitFor({ timeout: 30000 });
    step('break-over');
    await sleep(700);
    // wheel the panel to its end, then press Put the kettle on (break-reach shape)
    const panelPt = await p.evaluate(() => { const h = [...document.querySelectorAll('h1,h2')].find((e) => /Break.s over/.test(e.textContent)); const r = h.getBoundingClientRect(); return { x: r.left + r.width / 2, y: Math.min(innerHeight - 20, r.bottom + 20) }; });
    for (let i = 0; i < 6; i++) { await p.mouse.move(panelPt.x, panelPt.y); await p.mouse.wheel(0, 120); await sleep(200); }
    await sleep(600);
    for (let i = 0; i < 6; i++) { await p.mouse.move(panelPt.x, panelPt.y); await p.mouse.wheel(0, -120); await sleep(200); }
    await sleep(600);
    out.putOnTop = await onTop(p.getByRole('button', { name: /^Put the kettle on/ }).first());
    await press(p.getByRole('button', { name: /^Put the kettle on/ }), 'Put the kettle on', { wheelAt: panelPt });
    await sleep(1500);
    out.hashAfter = await p.evaluate(() => location.hash);
    out.noticesEnd = await k('notices');
  } else if (A.flow === 'ambience') {
    await startBrewWithTask();
    for (const m of ['Recipe done: Name what you’re brewing · +10 leaves', 'New badge: Tea Time', 'Cozy level 5!']) await k('toast', m, { tone: 'success' });
    await sleep(800);
    const amb = p.getByRole('button', { name: /^Ambience/ });
    await press(amb, 'Ambience');
    const dlg = p.getByRole('dialog').last();
    await dlg.waitFor({ timeout: 10000 });
    await sleep(1500);
    out.sheetControls = await dlg.evaluate((d) => [...d.querySelectorAll('button, [role=radio], [role=switch], [role=slider]')].map((e) => {
      const r = e.getBoundingClientRect();
      if (r.width <= 0 || r.bottom <= 0 || r.top >= innerHeight) return { name: (e.getAttribute('aria-label') || e.innerText).slice(0, 24), inView: false };
      let ok = 0;
      for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) { const h = document.elementFromPoint(r.left + r.width * fx, Math.min(innerHeight - 1, r.top + r.height * fy)); if (h && e.contains(h)) ok++; }
      return { name: (e.getAttribute('aria-label') || e.innerText).replace(/\s+/g, ' ').slice(0, 24), ok };
    }));
    out.noticeOverSheet = await p.evaluate(() => [...document.querySelectorAll('[data-notice-strip] li')].map((n) => { const r = n.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { top: Math.round(r.top), onTopAtMiddle: !!h && n.contains(h) }; }));
    await press(dlg.getByRole('button', { name: /Close|Done/ }).first(), 'Close sheet');
    await sleep(6000);
    out.noticesEnd = await k('notices');
  } else if (A.flow === 'history') {
    await p.goto(`${A.base}/?debug&seed=veteran&theme=${theme}#/`);
    await ready();
    await sleep(800);
    await press(p.getByRole('link', { name: /^Stats$/ }).or(p.getByRole('button', { name: /^Stats$/ })), 'Stats tab');
    await sleep(1500);
    // the 3rd day group's first row, scrolled into the middle by wheel
    const row = p.locator('[aria-label$=". Edit"]').nth(3);
    await row.waitFor({ timeout: 10000 });
    const name = await row.getAttribute('aria-label');
    for (let i = 0; i < 25; i++) {
      const y = await row.evaluate((e) => e.getBoundingClientRect().top);
      if (y > H * 0.3 && y < H * 0.6) break;
      await p.mouse.move(W / 2, H / 2); await p.mouse.wheel(0, y > H * 0.45 ? 100 : -100); await sleep(220);
    }
    await sleep(500);
    const before = await row.evaluate((e) => e.getBoundingClientRect().top);
    step('row', { name, top: Math.round(before) });
    await press(row, 'history row');
    const edit = p.getByRole('dialog', { name: 'Edit brew' });
    await edit.waitFor({ timeout: 10000 });
    await sleep(600);
    await press(edit.getByRole('button', { name: 'Delete this brew' }), 'Delete this brew');
    const conf = p.getByRole('dialog', { name: 'Delete this brew?' });
    await conf.waitFor({ timeout: 10000 });
    await sleep(500);
    const del = await press(conf.getByRole('button', { name: /^Delete$/ }), 'Delete (confirm)');
    if (!del) { await conf.getByRole('button', { name: /^Delete$/ }).click({ force: true }); step('synthetic-delete'); }
    await p.waitForFunction(() => !document.querySelector('[role=dialog]'), null, { timeout: 10000 });
    await sleep(300);
    const undo = p.locator('[data-inline-undo]').first();
    out.undoRow = await undo.evaluate((e) => ({ top: e.getBoundingClientRect().top, text: e.innerText })).catch(() => null);
    out.rowTopBefore = before;
    out.undoOnTop = await onTop(undo.getByRole('button'));
    await sleep(800);
    await press(undo.getByRole('button'), 'Undo');
    await sleep(700);
    out.rowBack = await p.locator(`[aria-label="${name}"]`).count();
    await sleep(4000);
  } else if (A.flow === 'historytrace') {
    await p.goto(`${A.base}/?debug&seed=veteran&theme=${theme}#/`);
    await ready();
    await sleep(800);
    await press(p.getByRole('link', { name: /^Stats$/ }).or(p.getByRole('button', { name: /^Stats$/ })), 'Stats tab');
    await sleep(1500);
    const nth = +(A.nth ?? 3);
    const row = p.locator('[aria-label$=". Edit"]').nth(nth);
    await row.waitFor({ timeout: 10000 });
    const name = await row.getAttribute('aria-label');
    for (let i = 0; i < 25; i++) {
      const y = await row.evaluate((e) => e.getBoundingClientRect().top);
      if (y > H * 0.3 && y < H * 0.6) break;
      await p.mouse.move(W / 2, H / 2); await p.mouse.wheel(0, y > H * 0.45 ? 100 : -100); await sleep(220);
    }
    await sleep(600);
    await row.evaluate((e) => e.setAttribute('data-lead-row', ''));
    const where = (lab) => p.evaluate((lab) => { const r = document.querySelector('[data-lead-row]'); const u = document.querySelector('[data-inline-undo]'); return { lab, scrollY: Math.round(scrollY), row: r ? Math.round(r.getBoundingClientRect().top) : null, undo: u ? Math.round(u.getBoundingClientRect().top) : null, active: document.activeElement?.tagName + ' ' + (document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '').slice(0, 30) }; }, lab);
    out.trace = [await where('before tap')];
    await press(row, 'history row');
    const edit = p.getByRole('dialog', { name: 'Edit brew' });
    await edit.waitFor({ timeout: 10000 });
    await sleep(700);
    out.trace.push(await where('edit open'));
    await press(edit.getByRole('button', { name: 'Delete this brew' }), 'Delete this brew');
    const conf = p.getByRole('dialog', { name: 'Delete this brew?' });
    await conf.waitFor({ timeout: 10000 });
    await sleep(600);
    out.trace.push(await where('confirm open'));
    await p.evaluate(() => { const T = (window.__T = []); const t0 = performance.now(); const f = () => { const r = document.querySelector('[data-lead-row]'); const u = document.querySelector('[data-inline-undo]'); T.push({ t: Math.round(performance.now() - t0), y: Math.round(scrollY), row: r ? Math.round(r.getBoundingClientRect().top) : null, undo: u ? Math.round(u.getBoundingClientRect().top) : null, dlg: !!document.querySelector('[role=dialog]') }); if (T.length < 200) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    const del = await press(conf.getByRole('button', { name: /^Delete$/ }), 'Delete (confirm)');
    if (!del) { await conf.getByRole('button', { name: /^Delete$/ }).click({ force: true }); step('synthetic-delete'); }
    await sleep(2500);
    out.frames = await p.evaluate(() => { const T = window.__T; return T.filter((x, i) => i === 0 || JSON.stringify({ ...x, t: 0 }) !== JSON.stringify({ ...T[i - 1], t: 0 })); });
    out.trace.push(await where('after delete +2.5s'));
  } else if (A.flow === 'summarynotice') {
    // A notice while the summary is up (the app raises "Couldn't save just now…" or a cross-tab notice there).
    await startBrewWithTask(A.seed ?? 'newbie');
    await k('finish');
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 });
    await sleep(2600);
    await p.screenshot({ path: A.out.replace('.json', '-0-arrival.png') });
    if (A.kind === 'update') await p.evaluate(() => window.__kettle.toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => {} } }));
    else await p.evaluate(() => window.__kettle.toast('Couldn’t save just now. Your summary is still here.', { tone: 'warning' }));
    await sleep(1600);
    await p.screenshot({ path: A.out.replace('.json', '-1-notice.png') });
    out.geom = await p.evaluate(() => {
      const box = (e) => (e ? (({ top, bottom, left, right }) => ({ top: Math.round(top), bottom: Math.round(bottom), left: Math.round(left), right: Math.round(right) }))(e.getBoundingClientRect()) : null);
      const li = document.querySelector('[data-notice-strip] li');
      const imgs = [...document.querySelectorAll('[data-focus-view] img, [data-focus-view] canvas')].map((e) => ({ src: (e.getAttribute('src') || e.tagName).split('/').pop(), ...box(e) }));
      const foot = document.querySelector('[data-focus-view] footer');
      const tea = [...document.querySelectorAll('button')].find((b) => /^Tea time/.test(b.textContent || ''));
      const h1 = document.querySelector('[data-focus-view] h1, [data-focus-view] [role=region] h2');
      return { notice: box(li), imgs, footer: box(foot), tea: box(tea), heading: box(h1), vh: innerHeight };
    });
    out.teaOnTop = await onTop(p.getByRole('button', { name: /^Tea time/ }));
    await sleep(4500);
    await p.screenshot({ path: A.out.replace('.json', '-2-after.png') });
  } else if (A.flow === 'summaryarrive') {
    // An update pending as the brew ends: the app raises its prompt the moment the timer is idle (ShellOverlays.tsx),
    // i.e. with the summary's first frame. Raised here in the same task as the finish.
    await startBrewWithTask(A.seed ?? 'newbie');
    if (A.kind !== 'none') await p.evaluate(async () => { const t = window.__kettle.toast ?? (await import('/src/ui/Toast.tsx')).toast; t('A fresh brew of Kettle is ready.', { id: 'lead-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => {} } }); window.__kettle.finish(); });
    else await k('finish');
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 });
    await sleep(2800);
    await p.screenshot({ path: A.out.replace('.json', '-arrival.png') });
    out.fold = await p.evaluate(() => {
      const region = document.querySelector('[data-focus-view] [role=region]');
      const footer = region?.querySelector('footer');
      const F = footer ? footer.getBoundingClientRect().top : innerHeight;
      const rows = [...(region?.querySelectorAll('h1, h2, p, li, button, [role=button]') ?? [])].filter((e) => !e.closest('footer') && e.getBoundingClientRect().height > 0).map((e) => { const r = e.getBoundingClientRect(); return { t: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 30), top: Math.round(r.top), bottom: Math.round(r.bottom), cut: r.top < F - 2 && r.bottom > F + 2 }; });
      const sheet = region?.firstElementChild?.firstElementChild?.getBoundingClientRect();
      const li = document.querySelector('[data-notice-strip] li')?.getBoundingClientRect();
      const imgs = [...document.querySelectorAll('[data-focus-view] img')].map((e) => { const r = e.getBoundingClientRect(); return { src: (e.getAttribute('src') || '').split('/').pop(), top: Math.round(r.top), bottom: Math.round(r.bottom) }; });
      return { F: Math.round(F), sheetTop: sheet ? Math.round(sheet.top) : null, notice: li ? [Math.round(li.top), Math.round(li.bottom)] : null, cutRows: rows.filter((r) => r.cut), imgs };
    });
  } else if (A.flow === 'running') {
    // A notice on a running brew (as (e) Next brew raises one with the new brew's first frame), raised here at rest.
    await startBrewWithTask();
    await sleep(1500);
    await p.screenshot({ path: A.out.replace('.json', '-0-before.png') });
    await p.evaluate(() => window.__kettle.toast('Recipe done: Take a full tea break · +10 leaves', { tone: 'success' }));
    await sleep(900);
    await p.screenshot({ path: A.out.replace('.json', '-1-notice.png') });
    out.controls = await p.evaluate(() => ['Pause', 'End session', 'Add 5 minutes'].map((n) => { const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || x.textContent || '').trim().startsWith(n)); if (!b) return { n, found: false }; const r = b.getBoundingClientRect(); const inView = r.top >= 0 && r.bottom <= innerHeight; const h = inView && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { n, top: Math.round(r.top), bottom: Math.round(r.bottom), inView, onTop: !!h && b.contains(h) }; }));
    out.readout = await p.evaluate(() => { const d = document.querySelector('[data-focus-view] [aria-live], [data-focus-view] time'); return d ? Math.round(d.getBoundingClientRect().top) : null; });
  } else if (A.flow === 'queue') {
    await p.goto(`${A.base}/?debug&seed=veteran&theme=${theme}#/`);
    await ready();
    await sleep(1000);
    // the app's own update prompt shape (ShellOverlays.tsx), raised in the page
    await p.evaluate(() => window.__kettle.toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => (window.__upd = (window.__upd || 0) + 1) } }));
    await sleep(1500);
    out.s1 = await k('notices');
    await p.evaluate(() => { window.__kettle.toast('Saved 3 minutes of focus', { tone: 'success' }); window.__kettle.toast('Recipe done: Take a full tea break · +10 leaves', { tone: 'success' }); });
    const seq = [];
    for (let i = 0; i < 140; i++) { const st = await k('notices'); const shown = st.shown ? (st.queue.find((q) => q.id === st.shown)?.message ?? st.shown) : null; if (seq.at(-1) !== shown) seq.push(shown); await sleep(100); }
    out.sequence = seq;
    out.liCount = await p.evaluate(() => document.querySelectorAll('[data-notice-strip] li').length);
    out.updateBtnOnTop = await onTop(p.getByRole('button', { name: 'Update' }));
    if (out.updateBtnOnTop) { await tapXY(out.updateBtnOnTop.x, out.updateBtnOnTop.y); await sleep(300); out.updClicks = await p.evaluate(() => window.__upd || 0); }
  } else if (A.flow === 'breakaway') {
    // A break ends while the person is on Stats, scrolling: "Break's over — ready when you are." arrives (flow.ts:228).
    await startBrewWithTask();
    await k('finish');
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 });
    await sleep(2500);
    await press(p.getByRole('button', { name: /^Tea time/ }), 'Tea time');
    await sleep(1500);
    await p.evaluate(() => window.__kettle.navigate('/stats'));
    await sleep(1800);
    // keep wheeling (down then up) through the break's end; the notice must not change the strip while we do
    await k('nearEnd');
    const t0 = Date.now();
    for (let i = 0; i < 10; i++) { await p.mouse.move(W / 2, H / 2); await p.mouse.wheel(0, i < 5 ? 80 : -80); await sleep(400); }
    step('stopped-wheeling', { after: Date.now() - t0 });
    await sleep(4000);
    out.noticesMid = await k('notices');
    // then scroll back to the top (by wheel) so a waiting notice can be seen
    for (let i = 0; i < 10; i++) { await p.mouse.move(W / 2, H / 2); await p.mouse.wheel(0, -200); await sleep(150); }
    await sleep(5000);
    out.noticesEnd = await k('notices');
  }
} catch (e) {
  out.error = String(e).slice(0, 400);
}
out.rec = await p.evaluate(() => { window.__L.stop = true; const R = window.__L; return { frames: R.frames, noticeFrames: R.noticeFrames, modalFrames: R.modalFrames, covered: R.covered, coveredEx: R.coveredEx, geo: R.geo, geoEx: R.geoEx, noticeHidden: R.noticeHidden, noticeHiddenEx: R.noticeHiddenEx, chromeOver: R.chromeOver, shifts: R.shifts, seen: R.seen }; }).catch((e) => ({ err: String(e) }));
out.errors = errors;
// shift audit against MY input record: a change while a pointer is down, or within 1.2 s of input that is neither the
// answer to a tap (< 600 ms) nor a new screen (< 350 ms after the route changed) nor out of view (why 'above').
out.shiftAudit = (out.rec.shifts ?? []).map((s) => ({ ...s, ok: s.down === 0 && (s.sinceInput >= 1150 || s.sinceTap < 650 || s.sinceRoute < 400 || s.why === 'above' || s.why === 'screen' || s.why === 'entry') }));
out.shiftViolations = out.shiftAudit.filter((s) => !s.ok);
fs.writeFileSync(A.out, JSON.stringify(out, null, 1));
await browser.close();
const r = out.rec;
console.log(`${A.cfg} ${A.flow}: frames ${r.frames} noticeFrames ${r.noticeFrames} modal ${r.modalFrames} | covered ${r.covered} geo ${r.geo} noticeHidden ${r.noticeHidden} chromeOver ${r.chromeOver} | shifts ${r.shifts?.length} violations ${out.shiftViolations.length} | err ${out.error ?? '-'} pageErrors ${errors.length}`);
