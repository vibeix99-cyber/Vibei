// Lane T (W2R3 round 3) independent notice probe. Not the maker's logic: a 100 ms setInterval sampler that measures
//  (a) geometric intersection of every notice box (strip item, inline Undo row, base toast li) with every control box,
//      every TEXT-NODE client rect (Range.getClientRects) and every list row box, and for each intersection the element
//      on top at the intersection centre (elementFromPoint);
//  (b) elementFromPoint at 9 points (0.15/0.5/0.85) of every visible control: a point whose top element is inside a notice
//      while the control is not = a covered point.
// Usage: node ltprobe.mjs --base http://127.0.0.1:5476 --out DIR --cfgs 390x844:light:100,375x667:dark:200:reduced [--groups end,break,nextbrew,stats,import,update,queue,home,tap]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const A = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const BASE = A.base.replace(/\/$/, '');
const OUT = A.out;
mkdirSync(OUT, { recursive: true });
const GROUPS = (A.groups ?? 'home,end,break,nextbrew,stats,import,update,queue').split(',');
const MONDAY = Date.parse(A.at ?? '2026-10-12T07:40:00.000Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sampler() {
  const NSEL = '[data-notice-strip] li, [data-inline-undo], [aria-label="Notifications"] li';
  const CSEL = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=radio], [role=checkbox], [role=switch], [role=tab], [role=slider], [role=option], [role=menuitem], [tabindex]:not([tabindex="-1"])';
  const RSEL = 'li, [role=row], [role=listitem], tr';
  const S = (window.__lt = { samples: 0, nSamples: 0, modalSamples: 0, state: '', geo: { ctl: 0, text: 0, row: 0 }, geoTop: {}, efp: 0, efpCtl: 0, hits: [], seen: {}, floatPos: [], live: [], ms: 0 });
  const vis = (r) => r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const inter = (a, b) => a.right > b.left + 0.5 && a.left < b.right - 0.5 && a.bottom > b.top + 0.5 && a.top < b.bottom - 0.5;
  const lab = (e) => `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)}"`;
  const fixedOf = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') return a; } return null; };
  const topAt = (x, y, n, e) => {
    const h = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, x)), Math.min(innerHeight - 1, Math.max(0, y)));
    if (!h) return 'none';
    if (n.contains(h)) return 'notice';
    if (e && (e.contains(h) || h.contains(e))) return 'other';
    if (e && e.nodeType === 3 && e.parentElement && (e.parentElement.contains(h))) return 'other';
    return 'third:' + h.tagName.toLowerCase() + '.' + String(h.className?.baseVal ?? h.className ?? '').split(' ')[0].slice(0, 24);
  };
  const clipOf = (el) => { // the part of el's ancestors' clip boxes and the viewport where el can be drawn
    let top = 0, bottom = innerHeight, left = 0, right = innerWidth;
    for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible' && cs.clipPath === 'none' && cs.contain.indexOf('paint') < 0) continue;
      const c = e.getBoundingClientRect();
      top = Math.max(top, c.top); bottom = Math.min(bottom, c.bottom); left = Math.max(left, c.left); right = Math.min(right, c.right);
    }
    return { top, bottom, left, right };
  };
  const and = (a, b) => ({ top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom), left: Math.max(a.left, b.left), right: Math.min(a.right, b.right) });
  const empty = (a) => a.bottom - a.top <= 0.5 || a.right - a.left <= 0.5;
  const dlgState = () => { const d = document.querySelector('[role=dialog]'); if (!d) return null; let o = 1, pe = 'auto'; for (let a = d; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); o *= +cs.opacity; if (cs.pointerEvents === 'none') pe = 'none'; } return { o: Math.round(o * 100) / 100, pe }; };
  // classify one geometric intersection: off-viewport / clipped away (notice or other) / drawn, then who is on top there
  const klass = (n, r, e, q, clipEl) => {
    const vp = { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
    let x = and(and(r, q), vp);
    if (empty(x)) return 'offViewport';
    const xn = and(x, clipOf(n));
    if (empty(xn)) return 'noticeClippedAway';
    const xo = and(xn, clipOf(clipEl));
    if (empty(xo)) return 'otherClippedAway';
    const cx = (xo.left + xo.right) / 2, cy = (xo.top + xo.bottom) / 2;
    const t = topAt(cx, cy, n, e);
    // a sheet (role=dialog) whose box contains the point and which the notice is not inside: the sheet is drawn above the page there
    const under = [...document.querySelectorAll('[role=dialog]')].some((d) => { if (d.contains(n)) return false; const b = d.getBoundingClientRect(); return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom; });
    return under ? 'underSheet:' + t : t;
  };
  const push = (kind, n, r, what, q, top) => {
    const k = kind + '|' + top;
    S.geoTop[k] = (S.geoTop[k] || 0) + 1;
    const drawnHit = !kind.includes('modal') && (top === 'notice' || top === 'other' || top.startsWith('third'));
    if (drawnHit && !S.shotReq && (S.shots || 0) < 3) { S.shotReq = { kind, top, what, state: S.state }; }
    if (S.hits.length < 60 || (drawnHit && S.hits.filter((h) => h.top === top && h.kind === kind).length < 6)) S.hits.push({ dlg: dlgState(), t: Math.round(performance.now()), state: S.state, hash: location.hash, kind, top, notice: lab(n), nbox: [r.left, r.top, r.width, r.height].map(Math.round), what, box: [q.left, q.top, q.width, q.height].map(Math.round), modal: !!(document.querySelector('[role=dialog]') || document.getElementById('root')?.hasAttribute('inert')), sy: Math.round(scrollY) });
  };
  // live regions: every addition / text change inside an aria-live / role=status|alert|log region
  const mo = new MutationObserver((ms) => {
    for (const m of ms) {
      const host = (m.target.nodeType === 1 ? m.target : m.target.parentElement)?.closest?.('[aria-live], [role=status], [role=alert], [role=log]');
      if (!host || host.getAttribute('aria-live') === 'off') continue;
      const txt = m.type === 'characterData' ? m.target.textContent : [...m.addedNodes].map((x) => x.textContent).join(' ');
      if (txt && txt.trim()) S.live.push({ t: Math.round(performance.now()), state: S.state, text: txt.replace(/\s+/g, ' ').trim().slice(0, 90), region: host.hasAttribute('data-notices-said') ? 'said' : (host.getAttribute('aria-label') || host.getAttribute('role') || 'live') });
    }
  });
  const tick = () => {
    const t0 = performance.now();
    S.samples++;
    const notices = [...document.querySelectorAll(NSEL)].filter((n) => !n.closest('[data-route-leaving]') && vis(n.getBoundingClientRect()));
    if (!notices.length) return;
    S.nSamples++;
    const modal = !!(document.querySelector('[role=dialog]') || document.getElementById('root')?.hasAttribute('inert'));
    if (modal) S.modalSamples++;
    const st = modal ? S.state + '+modal' : S.state;
    for (const n of notices) {
      const key = (n.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 44);
      S.seen[key] = (S.seen[key] || 0) + 1;
      const cut = n.scrollHeight > n.clientHeight + 1 || [...n.querySelectorAll('*')].some((x) => { const cs = getComputedStyle(x); return (cs.overflow !== 'visible' || cs.webkitLineClamp !== 'none') && (x.scrollHeight > x.clientHeight + 1 || x.scrollWidth > x.clientWidth + 1); });
      if (cut) { S.cut = (S.cut || 0) + 1; S.cutSeen = S.cutSeen || {}; S.cutSeen[key] = (S.cutSeen[key] || 0) + 1; }
      for (let a = n; a && a !== document.body; a = a.parentElement) {
        if (a.hasAttribute('data-notice-strip') || a === n) { const p = getComputedStyle(a).position; if ((p === 'fixed' || p === 'absolute' || p === 'sticky') && S.floatPos.length < 20) S.floatPos.push({ state: st, el: lab(a).slice(0, 30), p }); }
        if (a.hasAttribute('data-notice-strip')) break;
      }
    }
    const nr = notices.map((n) => ({ n, r: n.getBoundingClientRect() }));
    // (a1) controls and rows, by box
    const ctls = [...document.querySelectorAll(CSEL)];
    const rows = [...document.querySelectorAll(RSEL)];
    for (const [kind, list] of [['ctl', ctls], ['row', rows]]) {
      for (const e of list) {
        if (e.closest('[data-route-leaving]')) continue;
        const q = e.getBoundingClientRect();
        if (q.width <= 1 || q.height <= 1) continue;
        for (const { n, r } of nr) {
          if (n.contains(e) || e.contains(n)) continue;
          if (!inter(q, r)) continue;
          const top = klass(n, r, e, q, e);
          S.geo[kind]++;
          push(kind + (fixedOf(e) && !fixedOf(n) ? '@fixed' : '') + (modal ? '+modal' : ''), n, r, lab(e), q, top);
        }
      }
    }
    // (a2) text nodes, by Range.getClientRects
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const rg = document.createRange();
    for (let tn = w.nextNode(); tn; tn = w.nextNode()) {
      if (!tn.textContent.trim()) continue;
      const pe = tn.parentElement;
      if (!pe || pe.closest('[data-route-leaving], script, style, noscript')) continue;
      if (nr.some(({ n }) => n.contains(tn))) continue;
      rg.selectNodeContents(tn);
      for (const q of rg.getClientRects()) {
        if (q.width <= 1 || q.height <= 1) continue;
        for (const { n, r } of nr) {
          if (!inter(q, r)) continue;
          const top = klass(n, r, pe, q, tn.parentElement && { parentElement: tn.parentElement });
          S.geo.text++;
          push('text' + (fixedOf(pe) && !fixedOf(n) ? '@fixed' : '') + (modal ? '+modal' : ''), n, r, `text "${tn.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)}" in ${pe.tagName.toLowerCase()}`, q, top);
        }
      }
    }
    // (b) 9 points on every visible control
    for (const e of ctls) {
      if (e.closest('[data-route-leaving]') || notices.some((n) => n.contains(e) || e.contains(n))) continue;
      const q = e.getBoundingClientRect();
      if (!vis(q)) continue;
      let cov = 0, by = null;
      for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) {
        const x = q.left + q.width * fx, y = q.top + q.height * fy;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
        const h = document.elementFromPoint(x, y);
        const hn = h && notices.find((n) => n.contains(h));
        if (hn && !e.contains(h)) { cov++; by = hn; if ([...document.querySelectorAll('[role=dialog]')].some((d) => !d.contains(hn) && (() => { const b = d.getBoundingClientRect(); return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; })())) S.efpUnderSheet = (S.efpUnderSheet || 0) + 1; }
      }
      if (cov) {
        S.efp += cov; S.efpCtl++;
        const k = 'efp9' + (modal ? '+modal' : '');
        S.geoTop[k] = (S.geoTop[k] || 0) + 1;
        if (!modal && !S.shotReq && (S.shots || 0) < 3) S.shotReq = { kind: k, what: lab(e), state: S.state };
        if (S.hits.filter((h) => h.kind === 'efp9').length < 15) S.hits.push({ dlg: dlgState(), t: Math.round(performance.now()), state: st, hash: location.hash, kind: 'efp9', points: cov, what: lab(e), box: [q.left, q.top, q.width, q.height].map(Math.round), notice: lab(by) });
      }
    }
    S.ms += performance.now() - t0;
  };
  addEventListener('DOMContentLoaded', () => {
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    setInterval(tick, 100);
  });
}

function parseCfg(s0) {
  let s = s0, groups = null, base = BASE, tag = '';
  if (s.includes('/')) { groups = s.split('/')[1].split('+'); s = s.split('/')[0]; }
  if (s.endsWith('@B')) { base = A.base2.replace(/\/$/, ''); tag = '-BASE'; s = s.slice(0, -2); }
  const [wh, theme, pct, red] = s.split(':');
  const [w, h] = wh.split('x').map(Number);
  return { w, h, theme, pct: +pct, reduced: red === 'reduced', groups, base, fix: tag === '', name: `${w}x${h}-${theme}-t${pct}${red === 'reduced' ? '-reduced' : ''}${tag}${groups ? '-' + groups.join('+') : ''}` };
}

process.on('unhandledRejection', (e) => console.log('unhandledRejection (ignored):', String(e).slice(0, 160)));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });

async function ctxFor(c, seed = true) {
  const phone = c.w < 900;
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: c.theme, reducedMotion: c.reduced ? 'reduce' : 'no-preference', timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  await ctx.addInitScript((pct) => {
    try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, c.pct);
  await ctx.addInitScript(sampler);
  await ctx.addInitScript(() => { window.__ltToast = async (m, o) => (window.__kettle && window.__kettle.toast ? window.__kettle.toast(m, o) : (await import('/src/ui/Toast.tsx')).toast(m, o)); });
  const page = await ctx.newPage();
  await page.clock.install({ time: MONDAY });
  await page.clock.resume();
  const pe = [];
  page.on('pageerror', (e) => pe.push(`pageerror: ${e.message.slice(0, 160)}`));
  return { ctx, page, touch: phone, pe };
}
let errs = [];
const ready = (p) => p.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60_000 });
const K = (p, fn, ...a) => p.evaluate(([f, x]) => window.__kettle[f](...x), [fn, a]);
const park = (p) => p.mouse.move(1, p.viewportSize().height - 1);
const state = (p, s) => p.evaluate((s) => { if (window.__lt) window.__lt.state = s; }, s).catch(() => {});
const usel = (k) => 'SEL:' + k;
const nine = (loc) => loc.evaluate((e) => {
  const r = e.getBoundingClientRect(); let n = 0; const hits = [];
  for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) { const h = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if (h && e.contains(h)) n++; else hits.push(h ? h.tagName + '.' + String(h.className?.baseVal ?? h.className).slice(0, 20) : 'none'); }
  return { n, box: [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10), inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, not: hits.slice(0, 3) };
});
/** Bring on top (9/9 if strict) by real wheel over the element's scroller / the page middle; then a real tap/click. */
async function press(p, touch, loc, { strict = true, tap = true, maxWheel = 50 } = {}) {
  await loc.waitFor({ state: 'attached', timeout: 20_000 });
  let wheels = 0;
  const vp = p.viewportSize();
  for (;;) {
    const nn = await nine(loc).catch(() => ({ n: 0 }));
    if (nn.inView && nn.n >= (strict ? 9 : 5)) break;
    if (wheels >= maxWheel) return { ok: false, wheels, nine: nn };
    const aim = await loc.evaluate((e) => {
      const d = e.closest('[role=dialog]');
      let a = d;
      if (!a) for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { const oy = getComputedStyle(x).overflowY; if ((oy === 'auto' || oy === 'scroll') && x.scrollHeight > x.clientHeight) { a = x; break; } }
      const r = e.getBoundingClientRect();
      const ar = a ? a.getBoundingClientRect() : null;
      return { y: r.top, h: r.height, ax: ar ? ar.left + ar.width / 2 : null, ay: ar ? Math.max(0, ar.top) + (Math.min(innerHeight, ar.bottom) - Math.max(0, ar.top)) / 2 : null };
    });
    await p.mouse.move(Math.round(aim.ax ?? vp.width / 2), Math.round(aim.ay ?? vp.height / 2));
    const vh = p.viewportSize().height;
    const dist = aim.y < 4 ? aim.y - 40 : aim.y + aim.h - vh * 0.6;
    await p.mouse.wheel(0, aim.y < 4 ? Math.max(-400, Math.min(-60, dist)) : Math.min(400, Math.max(70, dist)));
    wheels++;
    await sleep(110);
  }
  if (wheels) await park(p);
  const nn = await nine(loc);
  const [x, y, w, h] = nn.box;
  if (tap) { if (touch) await p.touchscreen.tap(x + w / 2, y + h / 2); else await p.mouse.click(x + w / 2, y + h / 2); }
  return { ok: true, wheels, nine: nn, at: Date.now() };
}
async function collect(p) {
  return p.evaluate(() => { const S = window.__lt; return S ? { samples: S.samples, nSamples: S.nSamples, modalSamples: S.modalSamples, geo: S.geo, geoTop: S.geoTop, efp: S.efp, efpCtl: S.efpCtl, efpUnderSheet: S.efpUnderSheet || 0, cut: S.cut || 0, cutSeen: S.cutSeen || {}, hits: S.hits, seen: S.seen, floatPos: S.floatPos, live: S.live, sampleMsAvg: S.samples ? Math.round((S.ms / S.samples) * 10) / 10 : 0 } : null; }).catch((e) => ({ err: e.message.slice(0, 100) }));
}
async function typeTask(p, touch) {
  const field = p.getByRole('textbox', { name: /What are you brewing/ });
  const r = await press(p, touch, field, { strict: false });
  if (!r.ok) throw new Error('field not reachable ' + JSON.stringify(r));
  await p.keyboard.type('Chapter 3 notes');
  await p.keyboard.press('Escape').catch(() => {});
}
/** Watch an inline Undo (or the base's Undo toast): appearance / disappearance times relative to the last activating click. */
const watchUndo = (p, sel) => p.evaluate((sel) => {
  const W = (window.__undo = { clickAt: null, downAt: null, appearAt: null, goneAt: null, sel, sy0: Math.round(scrollY) });
  addEventListener('click', () => { if (W.clickAt == null) W.clickAt = performance.now(); }, { capture: true });
  addEventListener('pointerdown', () => { if (W.downAt == null) W.downAt = performance.now(); }, { capture: true });
  const find = () => document.querySelector(`[data-undo-for="${sel.slice(4)}"]`) || [...document.querySelectorAll('[aria-label="Notifications"] li')].find((li) => !li.closest('[data-notice-strip]') && /Undo/.test(li.innerText));
  const chk = () => {
    const e = find();
    const on = !!(e && e.getBoundingClientRect().height > 0);
    if (on && W.appearAt == null) { W.appearAt = performance.now(); W.box = e.getBoundingClientRect().toJSON(); W.syAppear = Math.round(scrollY); }
    if (!on && W.appearAt != null && W.goneAt == null) W.goneAt = performance.now();
    if (W.goneAt == null) requestAnimationFrame(chk);
  };
  requestAnimationFrame(chk);
}, sel);
const undoFacts = (p) => p.evaluate(() => { const W = window.__undo; return W && { appearMs: W.appearAt != null && W.clickAt != null ? Math.round(W.appearAt - W.clickAt) : null, appearFromDownMs: W.appearAt != null && W.downAt != null ? Math.round(W.appearAt - W.downAt) : null, shownMs: W.goneAt != null ? Math.round(W.goneAt - W.appearAt) : null, box: W.box && [W.box.left, W.box.top, W.box.width, W.box.height].map(Math.round), sy0: W.sy0, syAppear: W.syAppear, syNow: Math.round(scrollY) }; });

// ---------------------------------------------------------------- groups
const G = {};
// Today at rest (veteran): Brew length options wholly visible, >= 24x24, 9/9 on top, no scrolling.
G.home = async (p, touch, c, f) => {
  await p.goto(`${c.base}/?debug&seed=veteran&theme=${c.theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1500);
  f.brewLength = await p.evaluate(() => {
    const g = [...document.querySelectorAll('[role=radiogroup]')].find((x) => /brew length|length/i.test(x.getAttribute('aria-label') || x.textContent || ''));
    const opts = g ? [...g.querySelectorAll('[role=radio], input[type=radio], button')] : [];
    return { group: g ? (g.getAttribute('aria-label') || '').slice(0, 40) : null, scrollY: Math.round(scrollY), opts: opts.map((e) => {
      const t = e.matches('input') ? e.closest('label') || e : e;
      const r = t.getBoundingClientRect(); let n = 0;
      for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) { const h = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if (h && (t.contains(h) || h === t)) n++; }
      return { name: (t.getAttribute('aria-label') || t.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20), box: [r.left, r.top, r.width, r.height].map(Math.round), inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, ge24: r.width >= 24 && r.height >= 24, nine: n };
    }) };
  });
};
// End -> Today with End's notices; Mark done at +0.6 s (where on top at rest) -> inline Undo; Undo restores; then Mark done again and let the Undo run out (duration).
G.end = async (p, touch, c, f) => {
  await p.goto(`${c.base}/?debug&seed=newbie&theme=${c.theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready);
  await typeTask(p, touch);
  const s1 = await press(p, touch, p.getByRole('button', { name: /^Put the kettle on · / }), { strict: false });
  if (!s1.ok) throw new Error('start not reachable');
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(1500);
  await K(p, 'ff', 3 * 60_000); await sleep(500);
  await press(p, touch, p.getByRole('button', { name: 'End session' }).first(), { strict: false });
  const sheet = p.getByRole('dialog', { name: 'Leave the kettle early?' }); await sheet.waitFor({ timeout: 10_000 }); await sleep(500);
  await state(p, 'end-today');
  const e2 = await press(p, touch, sheet.getByRole('button', { name: 'End session' }), { strict: false });
  const t0 = e2.at ?? Date.now();
  await p.waitForFunction(() => location.hash === '#/', null, { timeout: 15_000 });
  await watchUndo(p, usel('mark-done'));
  const mark = p.getByRole('button', { name: /^Mark “Chapter 3 notes” done/ });
  await mark.waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {});
  await sleep(Math.max(0, 600 - (Date.now() - t0)));
  const atRest = await nine(mark).catch((e) => ({ err: e.message.slice(0, 80) }));
  f.markDoneAt06 = { msSinceEnd: Date.now() - t0, ...atRest };
  await state(p, 'markdone');
  if (atRest.n === 9 && atRest.inView) {
    const [x, y, w, h] = atRest.box;
    if (touch) await p.touchscreen.tap(x + w / 2, y + h / 2); else await p.mouse.click(x + w / 2, y + h / 2);
    f.markDoneTap = { tapMs: Date.now() - t0, scrolled: false };
  } else {
    const r = await press(p, touch, mark, { strict: true });
    f.markDoneTap = { tapMs: Date.now() - t0, scrolled: true, wheels: r.wheels, ok: r.ok };
  }
  await sleep(250);
  f.markDoneCrossed = await p.evaluate(() => ({ undoRow: !!document.querySelector('[data-undo-for="mark-done"]'), markStill: !!document.querySelector('button[aria-label^="Mark “Chapter 3 notes”"]'), progressTaskDone: null }));
  const undoSel = p.locator('[data-undo-for="mark-done"] button, [aria-label="Notifications"] li button').filter({ hasText: /Undo/ }).first();
  await sleep(150);
  f.markUndo = { nine: await nine(undoSel).catch((e) => ({ err: e.message.slice(0, 80) })), ...(await undoFacts(p)) };
  const liveBefore = (await collect(p)).live.length;
  // tap Undo within its duration
  const u = await press(p, touch, undoSel, { strict: true });
  await sleep(500);
  f.markUndo.tapped = u.ok; f.markUndo.tapMsAfterAppear = null;
  f.markUndo.restored = await p.evaluate(() => ({ field: [...document.querySelectorAll('input, textarea')].find((e) => /What are you brewing/.test(e.getAttribute('aria-label') || e.labels?.[0]?.textContent || e.placeholder || ''))?.value ?? null, markBack: !!document.querySelector('button[aria-label^="Mark “Chapter 3 notes”"]') }));
  // second Mark done: let it run out (pointer parked, no input)
  await state(p, 'markdone-expire');
  const mark2 = p.getByRole('button', { name: /^Mark “Chapter 3 notes” done/ });
  if (await mark2.count()) {
    await watchUndo(p, usel('mark-done'));
    await press(p, touch, mark2, { strict: true }); await park(p);
    await p.waitForFunction(() => window.__undo.goneAt != null, null, { timeout: 25_000 }).catch(() => {});
    f.markUndoExpire = await undoFacts(p);
  } else f.markUndoExpire = 'Mark done not back after Undo';
  const col = await collect(p);
  f.markUndoLive = col.live.filter((x) => /Crossed off|Undo|done/i.test(x.text));
};
// Summary -> tea break -> Break's over on Monday (recipe notice), panel wheeled; Ambience sheet with notices queued.
G.break = async (p, touch, c, f) => {
  await p.goto(`${c.base}/?debug&seed=newbie&theme=${c.theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready);
  await typeTask(p, touch);
  await press(p, touch, p.getByRole('button', { name: /^Put the kettle on · / }), { strict: false });
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(1500);
  await state(p, 'summary');
  await K(p, 'finish');
  const tea = p.getByRole('button', { name: /Tea time|Long tea break/ }); await tea.waitFor({ state: 'visible', timeout: 60_000 }); await sleep(1500);
  await press(p, touch, tea, { strict: false });
  await state(p, 'break');
  await p.getByRole('button', { name: /Pause break/ }).waitFor({ state: 'attached', timeout: 20_000 }); await sleep(1200);
  await state(p, 'breakover');
  await K(p, 'finish');
  await p.getByRole('button', { name: /^Put the kettle on/ }).first().waitFor({ state: 'attached', timeout: 20_000 });
  await sleep(3000);
  f.breakoverNotices = await p.evaluate(() => [...document.querySelectorAll('[data-notice-strip] li, [aria-label="Notifications"] li')].map((n) => n.innerText.replace(/\s+/g, ' ').slice(0, 60)));
  // wheel the panel down to the end and back
  const vp = p.viewportSize();
  const panel = await p.locator('[data-focus-view] main, main').first().boundingBox().catch(() => null);
  await p.mouse.move(Math.round(panel ? panel.x + panel.width / 2 : vp.width / 2), Math.round(panel ? Math.min(vp.height - 20, panel.y + panel.height / 2) : vp.height / 2));
  for (const d of [1, -1]) for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, d * 90); await sleep(110); }
  await park(p); await sleep(500);
  // Put the kettle on (real tap) -> running brew; Ambience sheet with notices queued
  await state(p, 'breakover-put');
  const put = await press(p, touch, p.getByRole('button', { name: /^Put the kettle on/ }).first(), { strict: true });
  f.breakoverPut = { ok: put.ok, wheels: put.wheels, nine: put.nine && put.nine.n };
  await p.waitForFunction(() => window.__kettle.timer.getState().status === 'running', null, { timeout: 15_000 }).catch(() => {});
  await sleep(1500);
  await state(p, 'ambience');
  for (const m of ['Notice one, waiting its turn.', 'Notice two, waiting its turn.', 'Notice three, waiting its turn.']) await p.evaluate((m) => window.__ltToast(m, { tone: 'info', duration: 4000 }), m);
  await sleep(400);
  const amb = p.getByRole('button', { name: /Ambience/ }).first();
  if (await amb.count()) {
    const r = await press(p, touch, amb, { strict: false });
    await sleep(2000);
    f.ambience = { opened: r.ok, dialog: await p.evaluate(() => document.querySelector('[role=dialog]')?.getAttribute('aria-label') || !!document.querySelector('[role=dialog]')),
      sheetCtlsCovered: await p.evaluate(() => { const d = document.querySelector('[role=dialog]'); if (!d) return null; let cov = 0, tot = 0; for (const e of d.querySelectorAll('button,[role=radio],[role=switch],input,[role=slider]')) { const r = e.getBoundingClientRect(); if (r.width < 2 || r.bottom < 0 || r.top > innerHeight) continue; tot++; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!h || !d.contains(h)) cov++; } return { tot, cov }; }) };
    await p.keyboard.press('Escape').catch(() => {}); await sleep(600);
  } else f.ambience = 'no Ambience button';
  await sleep(1500);
};
// Settings > Next brew on (autoStartBreaks + autoStartFocus); the next brew starts by itself on a recipe day.
G.nextbrew = async (p, touch, c, f) => {
  await p.goto(`${c.base}/?debug&seed=newbie&theme=${c.theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: true, autoStartFocus: true }));
  await press(p, touch, p.getByRole('button', { name: /^Put the kettle on · / }), { strict: false });
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(2000);
  await state(p, 'nextbrew-break');
  await K(p, 'finish');
  await p.waitForFunction(() => { const t = window.__kettle.timer.getState(); return t.phase !== 'focus' && t.status === 'running'; }, null, { timeout: 30_000 }).catch(() => {});
  f.breakState = await p.evaluate(() => { const t = window.__kettle.timer.getState(); return t.phase + '/' + t.status + ' ' + location.hash; });
  await sleep(1500);
  await state(p, 'nextbrew');
  await K(p, 'finish');
  await p.waitForFunction(() => { const t = window.__kettle.timer.getState(); return t.phase === 'focus' && t.status === 'running'; }, null, { timeout: 20_000 }).catch(() => {});
  await sleep(4500);
  f.nextbrewSeen = (await collect(p)).seen;
};
// Stats: History delete on a mid-list row and on the last row -> inline Undo; tap Undo (mid), let it run out (end).
G.stats = async (p, touch, c, f) => {
  await p.goto(`${c.base}/?debug&seed=veteran&theme=${c.theme}#/stats`); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1500);
  const rows = p.locator('[data-session-row] button, main button[aria-label$="Edit"]');
  await rows.first().waitFor({ timeout: 15_000 });
  const n = await rows.count();
  f.historyRows = n;
  for (const [which, idx, doUndo] of [['mid', Math.floor(n / 2), true], ['end', n - 1, false]]) {
    await state(p, `history-${which}`);
    const row = rows.nth(idx);
    const label = await row.getAttribute('aria-label');
    const r1 = await press(p, touch, row, { strict: true });
    if (!r1.ok) { f[`history_${which}`] = { err: 'row not reachable', r1 }; continue; }
    const rowTop = await row.evaluate((b) => (b.closest('li') || b).getBoundingClientRect().top);
    const sy = await p.evaluate(() => Math.round(scrollY));
    const edit = p.getByRole('dialog', { name: 'Edit brew' }); await edit.waitFor({ timeout: 10_000 }); await sleep(400);
    await press(p, touch, edit.getByRole('button', { name: 'Delete this brew' }), { strict: false });
    const conf = p.getByRole('dialog', { name: 'Delete this brew?' }); await conf.waitFor({ timeout: 10_000 }); await sleep(400);
    await watchUndo(p, usel('history-delete'));
    const del = conf.getByRole('button', { name: 'Delete', exact: true });
    const r2 = await press(p, touch, del, { strict: false, maxWheel: 15 });
    let how = 'tap';
    if (!r2.ok) { // pre-existing at 375x667 @200: footer unreachable. Try keyboard, then synthetic (recorded).
      how = 'synthetic';
      for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); if (await del.evaluate((e) => document.activeElement === e)) { await p.keyboard.press('Enter'); how = 'Tab+Enter'; break; } }
      if (how === 'synthetic') await p.evaluate(() => window.__undo && (window.__undo.clickAt = performance.now())).then(() => del.evaluate((e) => e.click()));
    }
    await p.waitForFunction(() => window.__undo.appearAt != null, null, { timeout: 10_000 }).catch(() => {});
    await p.waitForFunction(() => !document.querySelector('[role=dialog]'), null, { timeout: 10_000 }).catch(() => {});
    await sleep(200);
    const ub = p.locator('[data-undo-for="history-delete"] button, [aria-label="Notifications"] li button').filter({ hasText: /Undo/ }).first();
    const uf = await undoFacts(p);
    const rowNowTop = await p.locator('[data-undo-for="history-delete"]').first().evaluate((e) => e.getBoundingClientRect().top).catch(() => null);
    f[`history_${which}`] = { idx, label: label?.slice(0, 60), rowTop: Math.round(rowTop), undoRowTop: rowNowTop == null ? null : Math.round(rowNowTop), syBefore: sy, how, ...uf, nine: await nine(ub).catch((e) => ({ err: e.message.slice(0, 60) })) };
    if (doUndo) {
      const t = await press(p, touch, ub, { strict: true });
      await sleep(500);
      f[`history_${which}`].undoTapped = t.ok;
      f[`history_${which}`].restored = (await rows.count()) === n && (await rows.nth(idx).getAttribute('aria-label')) === label;
    } else {
      await park(p);
      await p.waitForFunction(() => window.__undo.goneAt != null, null, { timeout: 25_000 }).catch(() => {});
      f[`history_${which}`].expire = await undoFacts(p);
    }
    await sleep(800);
  }
  f.historyLive = (await collect(p)).live.filter((x) => /deleted|Undo/i.test(x.text));
};
// Settings > Your data > Import a backup (real tap opens the file chooser) -> Add -> inline Undo; tap Undo; second import runs out.
G.import = async (p, touch, c, f) => {
  const file = `${OUT}/../backup-veteran.json`;
  if (!existsSync(file)) {
    await p.goto(`${c.base}/?debug&seed=veteran&theme=${c.theme}#/`); await ready(p);
    const txt = await p.evaluate(async () => (await import('/src/progress/portability.ts')).exportData());
    writeFileSync(file, txt);
  }
  await p.goto(`${c.base}/?debug&seed=newbie&theme=${c.theme}#/settings`); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1200);
  for (const [which, doUndo] of [['undo', true], ['expire', false]]) {
    await state(p, `import-${which}`);
    const row = p.getByRole('button', { name: /Import a backup/ }).first();
    const sy0 = await p.evaluate(() => Math.round(scrollY));
    const fcP = p.waitForEvent('filechooser', { timeout: 10_000 }).catch((e) => null);
    const r = await press(p, touch, row, { strict: true, maxWheel: 60 });
    if (!r.ok) { f[`import_${which}`] = { err: 'Import row not reachable', r }; break; }
    const rowTop = await row.evaluate((e) => e.getBoundingClientRect().top).catch(() => null);
    const fc = await fcP; if (!fc) { f[`import_${which}`] = { err: 'no file chooser after the tap on Import a backup', r }; break; } await fc.setFiles(file);
    const sheet = p.getByRole('dialog').first(); await sheet.waitFor({ timeout: 10_000 }); await sleep(500);
    await watchUndo(p, usel('import'));
    const add = sheet.getByRole('button', { name: /^(Add|Restore)$/ });
    const ra = await press(p, touch, add, { strict: false, maxWheel: 15 });
    if (!ra.ok) await add.evaluate((e) => e.click());
    await p.waitForFunction(() => window.__undo.appearAt != null, null, { timeout: 10_000 }).catch(() => {});
    await p.waitForFunction(() => !document.querySelector('[role=dialog]'), null, { timeout: 10_000 }).catch(() => {});
    await sleep(200);
    const n1 = await p.evaluate(() => window.__kettle.progress.getState().sessions.length);
    const ub = p.locator('[data-undo-for="import"] button, [aria-label="Notifications"] li button').filter({ hasText: /Undo/ }).first();
    const undoTop = await p.locator('[data-undo-for="import"]').first().evaluate((e) => e.getBoundingClientRect().top).catch(() => null);
    f[`import_${which}`] = { rowReach: r.wheels, rowTop: rowTop == null ? null : Math.round(rowTop), undoRowTop: undoTop == null ? null : Math.round(undoTop), sy0, addReached: ra.ok, sessionsAfterImport: n1, ...(await undoFacts(p)), nine: await nine(ub).catch((e) => ({ err: e.message.slice(0, 60) })) };
    if (doUndo) {
      const t = await press(p, touch, ub, { strict: true });
      await sleep(600);
      f[`import_${which}`].undoTapped = t.ok;
      f[`import_${which}`].sessionsAfterUndo = await p.evaluate(() => window.__kettle.progress.getState().sessions.length);
      await sleep(4000); // "Import undone" result row 3.2 s
    } else {
      await park(p);
      await p.waitForFunction(() => window.__undo.goneAt != null, null, { timeout: 30_000 }).catch(() => {});
      f[`import_${which}`].expire = await undoFacts(p);
    }
  }
  f.importLive = (await collect(p)).live.filter((x) => /Added|Backup|Import|Undo/i.test(x.text));
};
// The update prompt (persistent, Update action) on Today, then a timed notice arrives: does the timed one show?
G.update = async (p, touch, c, f) => {
  await p.goto(`${c.base}/?debug&seed=veteran&theme=${c.theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1500);
  await state(p, 'update');
  const raiseUpd = () => p.evaluate(() => window.__ltToast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => { window.__updTapped = (window.__updTapped || 0) + 1; } } }));
  await raiseUpd(); await sleep(1500);
  const shownUpd = () => p.evaluate(() => [...document.querySelectorAll('[data-notice-strip] li, [aria-label="Notifications"] li')].filter((n) => n.getBoundingClientRect().height > 0).map((n) => n.innerText.replace(/\s+/g, ' ').slice(0, 50)));
  f.update = { t1500: await shownUpd() };
  await p.evaluate(() => window.__ltToast('Brew updated', { tone: 'info', duration: 3200 }));
  const tl = [];
  for (let i = 0; i < 14; i++) { await sleep(500); tl.push(`${(i + 1) * 500}: ${(await shownUpd()).join(' | ')}`); }
  f.update.timeline = tl;
  const upd = p.locator('[data-notice-strip] li button, [aria-label="Notifications"] li button').filter({ hasText: /^Update$/ }).first();
  f.update.updateNine = await nine(upd).catch((e) => ({ err: e.message.slice(0, 60) }));
  const t = await press(p, touch, upd, { strict: true }).catch((e) => ({ ok: false, err: e.message.slice(0, 60) }));
  await sleep(300);
  f.update.tapped = t.ok; f.update.onClickCount = await p.evaluate(() => window.__updTapped || 0);
};
// A four-notice queue on Today; a route change (Stats tab, real tap) while three wait: nothing dropped.
G.queue = async (p, touch, c, f) => {
  await p.goto(`${c.base}/?debug&seed=veteran&theme=${c.theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1500);
  await state(p, 'queue4');
  const msgs = ['Queue one: Saved 3 minutes of focus.', 'Queue two: Recipe done: Take a full brew · +10 leaves', 'Queue three: Recipe done: Take 2 full tea breaks · +15 leaves', 'Queue four: Badge earned: Steady Hand'];
  for (const m of msgs) await p.evaluate((m) => window.__ltToast(m, { tone: 'success', duration: 3200 }), m);
  await sleep(1000);
  f.queueBefore = await p.evaluate(() => (window.__kettle.notices ? window.__kettle.notices() : null));
  const r = await press(p, touch, p.getByRole('link', { name: 'Stats' }).first(), { strict: false });
  await p.waitForFunction(() => location.hash === '#/stats', null, { timeout: 10_000 }).catch(() => {});
  await state(p, 'queue4-stats');
  f.queueAfterRoute = await p.evaluate(() => (window.__kettle.notices ? window.__kettle.notices() : null));
  await park(p);
  const order = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 26_000) {
    const s = await p.evaluate(() => [...document.querySelectorAll('[data-notice-strip] li, [aria-label="Notifications"] li')].filter((n) => n.getBoundingClientRect().height > 0).map((n) => n.innerText.replace(/\s+/g, ' ').slice(0, 30)).join(' | '));
    if (s && order[order.length - 1]?.s !== s) order.push({ ms: Date.now() - t0, s });
    const q = await p.evaluate(() => (window.__kettle.notices ? window.__kettle.notices() : null));
    if (!s && (!q || !q.queue || q.queue.length === 0)) break;
    await sleep(150);
  }
  f.queueOrder = order;
  f.queueSeen = Object.keys((await collect(p)).seen).filter((k) => /^Queue|Queue/.test(k));
};

// Check 4: does a strip change move a control from under a pointer during a tap? (a) pointer held down while a notice
// arrives; (b) "finger in the air": page at rest, a notice arrives, a click lands delta ms later where the control was.
G.tap = async (p, touch, c, f) => {
  await p.goto(`${c.base}/?debug&seed=veteran&theme=${c.theme}#/settings`); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(2000);
  const target = () => p.evaluate(() => {
    const strip = document.querySelector('[data-notice-strip]');
    const sb = strip ? strip.getBoundingClientRect().bottom : 0;
    const fixed = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) { const ps = getComputedStyle(a).position; if (ps === 'fixed' || ps === 'sticky') return true; } return false; };
    const b = [...document.querySelectorAll('main button, main [role=radio], main [role=tab], main a[href], main summary, main [role=switch]')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 10 && r.height > 10 && r.top > sb + 2 && r.top + r.height / 2 < innerHeight - 30 && !fixed(e) && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) && e.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)); });
    if (!b) return null;
    b.setAttribute('data-lt-target', '');
    const r = b.getBoundingClientRect();
    return { name: (b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top };
  });
  const clicks = () => p.evaluate(() => { window.__clk = []; addEventListener('click', (e) => window.__clk.push((e.target.closest('[data-lt-target]') ? 'TARGET ' : 'other ') + e.target.tagName + ' ' + (e.target.getAttribute('aria-label') || e.target.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)), { capture: true, once: false }); });
  const topNow = () => p.evaluate(() => document.querySelector('[data-lt-target]')?.getBoundingClientRect().top ?? null);
  const raise = (m) => p.evaluate((m) => window.__ltToast(m, { tone: 'info', duration: 3200 }), m);
  const runs = [];
  // (a) held pointer
  {
    const t = await target(); await clicks();
    await p.mouse.move(t.x, t.y); await p.mouse.down();
    await raise('Held-pointer notice, arriving while the pointer is down.');
    await sleep(500); const during = await topNow();
    await p.mouse.up(); const at = Date.now(); await sleep(100); const afterUp = await topNow();
    const clk = await p.evaluate(() => window.__clk);
    await sleep(2500); const later = await topNow();
    runs.push({ kind: 'held 500 ms', target: t.name, top0: Math.round(t.top), topDuringHold: during && Math.round(during), topAtUp: afterUp && Math.round(afterUp), topLater: later && Math.round(later), clicked: clk });
    // close the notice: wait for queue empty
    await p.waitForFunction(() => { const n = window.__kettle.notices(); return !document.querySelector('[data-notice-strip] li') && (!n.queue || !n.queue.length); }, null, { timeout: 20_000 }).catch(() => {});
    await p.goto(`${c.base}/?debug&theme=${c.theme}#/settings`); await ready(p); await sleep(1800);
  }
  // (b) finger in the air: notice raised at rest, click delta ms later at the control's old centre
  for (const delta of [0, 60, 150, 400]) {
    await park(p); await sleep(1600);
    const t = await target(); if (!t) { runs.push({ kind: `air ${delta}`, err: 'no target' }); continue; }
    await clicks();
    await raise(`Air notice ${delta}`);
    if (delta) await sleep(delta);
    const before = await topNow();
    if (touch) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await sleep(150);
    const clk = await p.evaluate(() => window.__clk);
    runs.push({ kind: `air +${delta} ms`, target: t.name, top0: Math.round(t.top), topAtTap: before && Math.round(before), clicked: clk });
    await p.keyboard.press('Escape').catch(() => {}); await sleep(300);
    await p.goto(`${c.base}/?debug&theme=${c.theme}#/settings`); await ready(p); await sleep(1500);
  }
  f.tapRuns = runs;
};
// Storage banner: storage full -> the banner on Today; its DOM and position (base vs fix).
G.storage = async (p, touch, c, f) => {
  await p.goto(`${c.base}/?debug&seed=newbie&theme=${c.theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(800);
  await p.evaluate(() => window.__kettle.timer.setState({}));
  f.fill = await p.evaluate(() => { let chunk = 'x'.repeat(1024 * 1024); let i = 0; while (chunk.length >= 8) { try { localStorage.setItem(`filler${i++}`, chunk); } catch { chunk = chunk.slice(0, chunk.length / 2); } } try { localStorage.setItem('filler-probe', 'x'.repeat(4096)); return 'no error'; } catch (e) { return e.name; } });
  await state(p, 'storage');
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await sleep(1500);
  await p.evaluate(() => window.__kettle.timer.getState().end('user'));
  await p.waitForFunction(() => location.hash === '#/', null, { timeout: 15_000 }).catch(() => {});
  await sleep(3000);
  f.banner = await p.evaluate(() => {
    const b = document.querySelector('[data-save-warning]') || [...document.querySelectorAll('section, div[role=alert], div[role=status]')].find((e) => /Save backup/i.test(e.textContent || '') && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 300);
    if (!b) return null;
    const r = b.getBoundingClientRect(); const cs = getComputedStyle(b);
    const shape = (e, d = 0) => d > 3 ? '' : `<${e.tagName.toLowerCase()}${[...e.attributes].filter((a) => !/^(class|id|aria-labelledby)$/.test(a.name)).map((a) => ` ${a.name}="${a.value.slice(0, 20)}"`).join('')}>${[...e.children].map((x) => shape(x, d + 1)).join('')}`;
    const prev = b.previousElementSibling, next = b.nextElementSibling;
    return { tag: b.tagName, attrs: [...b.attributes].map((a) => a.name).filter((a) => a !== 'class').join(','), text: b.innerText.replace(/\s+/g, ' ').slice(0, 120), box: [r.left, r.top, r.width, r.height].map(Math.round), position: cs.position, zIndex: cs.zIndex, shape: shape(b), prev: prev && (prev.innerText || prev.tagName).replace(/\s+/g, ' ').slice(0, 40), next: next && (next.innerText || next.tagName).replace(/\s+/g, ' ').slice(0, 40), inMain: !!b.closest('main'), notices: [...document.querySelectorAll('[data-notice-strip] li, [aria-label="Notifications"] li')].map((n) => n.innerText.replace(/\s+/g, ' ').slice(0, 50)) };
  });
  await sleep(4000);
  f.bannerLater = await p.evaluate(() => { const b = document.querySelector('[data-save-warning]'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); });
};

// Sheet exit: what is drawn and hit-tested where a leaving sheet's controls were, while a notice / inline Undo is in the page under it.
G.sheetexit = async (p, touch, c, f) => {
  const OUTD = OUT;
  const probeSheet = () => p.evaluate(() => {
    const d = document.querySelector('[role=dialog]');
    if (!d) return { dialog: false };
    const chain = []; for (let a = d; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.opacity !== '1' || cs.pointerEvents === 'none' || cs.transform !== 'none') chain.push(`${a.tagName.toLowerCase()} o=${cs.opacity} pe=${cs.pointerEvents} tf=${cs.transform.slice(0, 40)}`); }
    const pts = [...d.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height > 2).slice(0, 6).map((b) => { const r = b.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return `${(b.getAttribute('aria-label') || b.textContent).trim().slice(0, 14)}@${Math.round(r.top)}->${h ? (d.contains(h) ? 'sheet' : h.closest('[data-notice-strip] li, [data-inline-undo]') ? 'NOTICE' : h.tagName.toLowerCase()) : 'none'}`; });
    return { dialog: true, chain: chain.slice(0, 4), pts, notices: [...document.querySelectorAll('[data-notice-strip] li, [data-inline-undo], [aria-label="Notifications"] li')].filter((n) => n.getBoundingClientRect().height > 0).map((n) => { const r = n.getBoundingClientRect(); return `${n.innerText.replace(/\s+/g, ' ').slice(0, 24)}@${Math.round(r.top)}-${Math.round(r.bottom)}`; }) };
  });
  // (1) Ambience on a running brew with 3 notices
  await p.goto(`${c.base}/?debug&seed=newbie&theme=${c.theme}#/`); await ready(p);
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(1500);
  for (const m of ['Notice one, waiting its turn.', 'Notice two, waiting its turn.', 'Notice three, waiting its turn.']) await p.evaluate((m) => window.__ltToast(m, { tone: 'info', duration: 4000 }), m);
  await sleep(1500);
  await press(p, touch, p.getByRole('button', { name: /Ambience/ }).first(), { strict: false });
  const seq = [];
  for (const ms of [300, 1000]) { await sleep(ms === 300 ? 300 : 700); seq.push({ ms: `open+${ms}`, ...(await probeSheet()) }); }
  await p.screenshot({ path: `${OUTD}/sheetexit-${c.name}-amb-open.png` });
  await p.keyboard.press('Escape');
  const t0 = Date.now();
  for (let i = 0; i < 8; i++) { seq.push({ ms: `esc+${Date.now() - t0}`, ...(await probeSheet()) }); if (i < 3) await p.screenshot({ path: `${OUTD}/sheetexit-${c.name}-amb-esc${i}.png` }); await sleep(40); }
  f.ambienceSeq = seq;
  // (2) History delete: confirm sheet leaving while the Undo row is drawn
  await p.goto(`${c.base}/?debug&seed=veteran&theme=${c.theme}#/stats`); await ready(p); await sleep(1500);
  const row = p.locator('[data-session-row] button, main button[aria-label$="Edit"]').nth(3);
  await press(p, touch, row, { strict: true });
  const edit = p.getByRole('dialog', { name: 'Edit brew' }); await edit.waitFor({ timeout: 10_000 }); await sleep(400);
  await press(p, touch, edit.getByRole('button', { name: 'Delete this brew' }), { strict: false });
  const conf = p.getByRole('dialog', { name: 'Delete this brew?' }); await conf.waitFor({ timeout: 10_000 }); await sleep(500);
  const r2 = await press(p, touch, conf.getByRole('button', { name: 'Delete', exact: true }), { strict: false, maxWheel: 10 });
  if (!r2.ok) await conf.getByRole('button', { name: 'Delete', exact: true }).evaluate((e) => e.click());
  const t1 = Date.now(); const seq2 = [];
  for (let i = 0; i < 8; i++) { seq2.push({ ms: `delete+${Date.now() - t1}`, ...(await probeSheet()) }); if (i < 3) await p.screenshot({ path: `${OUTD}/sheetexit-${c.name}-del${i}.png` }); await sleep(40); }
  f.deleteSeq = seq2;
};

// ----------------------------------------------------------------
const cfgs = A.cfgs.split(',').map(parseCfg);
const PAR = +(A.par ?? 1);
async function runCfg(c) {
  const res = { cfg: c, base: c.base, startedAt: new Date().toISOString(), groups: {} };
  for (const g of c.groups ?? GROUPS) {
    if (!G[g]) continue;
    const { ctx, page, touch, pe } = await ctxFor(c);
    const f = {};
    const t = Date.now();
    let stop = false; const shots = [];
    const shooter = (async () => { while (!stop) { await sleep(120); try { const q = await page.evaluate(() => { const S = window.__lt; const r = S && S.shotReq; if (r) { S.shotReq = null; S.shots = (S.shots || 0) + 1; } return r; }); if (q) { const fn = `${OUT}/shot-${c.name}-${g}-${shots.length}.png`; await page.screenshot({ path: fn, animations: 'allow', timeout: 5000 }); shots.push({ file: fn.split('/').pop(), ...q }); } } catch {} } })();
    try { await G[g](page, touch, c, f); } catch (e) { f.error = e.message.split('\n')[0].slice(0, 300); }
    stop = true; await shooter; f.shots = shots;
    f.sampler = await collect(page);
    f.ms = Date.now() - t;
    f.pageErrors = pe.slice(0, 5);
    res.groups[g] = f;
    await ctx.close();
    console.log(`${c.name} ${g}: ${f.error ? 'ERROR ' + f.error.slice(0, 120) : 'ok'} samples=${f.sampler?.nSamples} geo=${JSON.stringify(f.sampler?.geo)} efp=${f.sampler?.efp} (${f.ms} ms)`);
  }
  res.endedAt = new Date().toISOString();
  writeFileSync(`${OUT}/${c.name}.json`, JSON.stringify(res, null, 1));
}
const queue = [...cfgs];
await Promise.all(Array.from({ length: PAR }, async () => { while (queue.length) await runCfg(queue.shift()); }));
await browser.close();
