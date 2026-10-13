// Lane P (W2R2 review): real-input checks on the summary (big day = celebrate seed).
//   node lp-input.mjs --out <dir> --base http://127.0.0.1:5452 --tag P --cfgs 375x667@2:light:200,390x844@2:dark:100 [--sessions A,B1,B2,C]
// Sessions (each a fresh context, frozen clock + resume, r2before start path; __kettle.finish() for setup only):
//   A  real wheel + CDP touch-scroll gestures, details toggle open/close (tap or click), Tea time by tap
//   B1 Skip break by click          B2 Tea time by click          B3 Skip break by tap
//   C  Tab through the summary: each stop, focus ring evidence (computed-style delta vs the unfocused baseline,
//      :focus-visible, clipped screenshot)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const OUT = args.out, BASE = args.base, TAG = args.tag ?? 'P';
const SESSIONS = (args.sessions ?? 'A,B1,B2,B3,C').split(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const log = (s) => { const l = `${new Date().toISOString().slice(11, 19)} ${s}`; console.log(l); appendFileSync(`${OUT}/input.log`, l + '\n'); };
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

const STATE = () => {
  const R = (r) => ({ t: +r.top.toFixed(1), b: +r.bottom.toFixed(1), l: +r.left.toFixed(1), r: +r.right.toFixed(1), h: +r.height.toFixed(1) });
  const h1 = document.querySelector('h1[tabindex="-1"]');
  const region = h1?.closest('[role=region]');
  if (!region) return { hash: location.hash, noSummary: true, timer: window.__kettle?.timer?.getState?.() && { status: window.__kettle.timer.getState().status, phase: window.__kettle.timer.getState().phase } };
  const scroll = region.firstElementChild, sheet = scroll.firstElementChild, footer = region.querySelector('footer');
  const sr = scroll.getBoundingClientRect(), sh = sheet.getBoundingClientRect(), fr = footer.getBoundingClientRect();
  const chai = [...document.querySelectorAll('[data-pose] img')].find((i) => !region.contains(i));
  const kettle = [...document.querySelectorAll('svg[role=img][data-state]')].find((s) => !region.contains(s));
  const tog = [...region.querySelectorAll('button[aria-expanded]')][0];
  const tt = region.querySelector('[data-done-cta]');
  const lastEl = [...sheet.querySelectorAll('p,li,h2,span,button')].filter((e) => !e.closest('.sr-only,[hidden]') && e.getClientRects().length && e.textContent.trim() && getComputedStyle(e).visibility !== 'hidden').reduce((m, e) => { const q = e.getBoundingClientRect(); return !m || q.bottom > m.b ? { b: q.bottom, text: e.textContent.trim().slice(0, 30) } : m; }, null);
  return {
    hash: location.hash, scrollTop: +scroll.scrollTop.toFixed(1), scrollMax: scroll.scrollHeight - scroll.clientHeight,
    sheetTop: +sh.top.toFixed(1), foldTop: +(sr.bottom - 14).toFixed(1), footerTop: +fr.top.toFixed(1),
    chaiBottom: chai ? +chai.getBoundingClientRect().bottom.toFixed(1) : null, kettleBottom: kettle ? +kettle.getBoundingClientRect().bottom.toFixed(1) : null,
    chaiClear: chai ? +(sh.top - 2 - chai.getBoundingClientRect().bottom).toFixed(1) : null, kettleClear: kettle ? +(sh.top - 2 - kettle.getBoundingClientRect().bottom).toFixed(1) : null,
    heading: R(h1.getBoundingClientRect()),
    toggle: tog ? { expanded: tog.getAttribute('aria-expanded'), box: R(tog.getBoundingClientRect()), text: tog.textContent.trim().slice(0, 40) } : null,
    panel: tog && tog.getAttribute('aria-controls') ? (() => { const p = document.getElementById(tog.getAttribute('aria-controls')); return p ? { box: R(p.getBoundingClientRect()), text: p.textContent.replace(/\s+/g, ' ').trim().slice(0, 400), visible: p.getClientRects().length > 0 && getComputedStyle(p).visibility !== 'hidden' } : null; })() : null,
    teaTime: tt ? { box: R(tt.getBoundingClientRect()), text: tt.textContent.trim() } : null,
    lastLine: lastEl ? { text: lastEl.text, b: +lastEl.b.toFixed(1), toFooter: +(fr.top - lastEl.b).toFixed(1) } : null,
    timer: (() => { const t = window.__kettle?.timer?.getState?.(); return t ? { status: t.status, phase: t.phase } : null; })(),
  };
};

async function toDone(cfg) {
  const m = cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
  const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
  const mobile = W < 900;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  await p.goto(`${BASE}/?debug&seed=celebrate&theme=${theme}#/`);
  await p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await sleep(1200);
  const start = p.getByRole('button', { name: /^Put the kettle on/i }).first(); await start.scrollIntoViewIfNeeded(); await start.click();
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(2500);
  await p.evaluate(() => window.__kettle.finish());
  await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
  await sleep(4600);
  return { ctx, p, errors, W, H, mobile };
}

const centre = (b2) => ({ x: b2.x + b2.width / 2, y: b2.y + b2.height / 2 });
async function point(p, sel) { const bb = await p.locator(sel).first().boundingBox(); return bb ? centre(bb) : null; }
async function scrollArea(p) { return p.evaluate(() => { const r = document.querySelector('h1[tabindex="-1"]').closest('[role=region]').firstElementChild.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.45 }; }); }

async function sessionA(cfg) {
  const { ctx, p, errors, mobile } = await toDone(cfg);
  const rec = { session: 'A', cfg, tag: TAG, steps: [], errors };
  const cdp = await ctx.newCDPSession(p);
  const pick = (s) => s.noSummary ? { hash: s.hash, noSummary: true, timer: s.timer } : ({ hash: s.hash, scrollTop: s.scrollTop, scrollMax: s.scrollMax, sheetTop: s.sheetTop, chaiClear: s.chaiClear, kettleClear: s.kettleClear, headingTop: s.heading?.t, headingBottom: s.heading?.b, foldTop: s.foldTop, footerTop: s.footerTop, toggle: s.toggle && { expanded: s.toggle.expanded, t: s.toggle.box.t, b: s.toggle.box.b }, panel: s.panel && { visible: s.panel.visible, h: s.panel.box.h }, lastLine: s.lastLine, timer: s.timer, teaTime: s.teaTime && { t: s.teaTime.box.t, b: s.teaTime.box.b } });
  const step = async (what, fn) => { const before = await p.evaluate(STATE); let note = null; try { note = (await fn()) ?? null; } catch (e) { note = 'ERR ' + e.message.slice(0, 120); } await sleep(700); const after = await p.evaluate(STATE); rec.steps.push({ what, note, before: pick(before), after: pick(after) }); };
  rec.arrival = pick(await p.evaluate(STATE));
  const sa = await scrollArea(p);
  const wheel = async (dy, n) => { await p.mouse.move(sa.x, sa.y); for (let i = 0; i < n; i++) { await p.mouse.wheel(0, dy); await sleep(70); } };
  // touch-action / overscroll evidence along the ancestor chain of the scroll area
  rec.touchAction = await p.evaluate(() => { const out = []; for (let e = document.querySelector('h1[tabindex="-1"]'); e; e = e.parentElement) { const c = getComputedStyle(e); if (c.touchAction !== 'auto' || c.overflowY !== 'visible' || c.overscrollBehaviorY !== 'auto') out.push({ el: e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 30), touchAction: c.touchAction, overflowY: c.overflowY, overscrollY: c.overscrollBehaviorY }); } return out; });
  // a finger drag: touchStart, many touchMove, touchEnd through the browser's input pipeline (CDP Input.dispatchTouchEvent)
  const drag = async (x, y0, y1, steps = 14) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0, id: 1 }] });
    for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / steps, id: 1 }] }); await sleep(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const gesture = (dy, speed) => cdp.send('Input.synthesizeScrollGesture', { x: Math.round(sa.x), y: Math.round(sa.y), yDistance: dy, gestureSourceType: 'touch', speed });
  await step('wheel down 1x240', () => wheel(240, 1));
  await step('wheel down 3x240', () => wheel(240, 3));
  await step('wheel down to the end (14x300)', () => wheel(300, 14));
  await step('wheel up to the top (14x-300)', () => wheel(-300, 14));
  await step('touch drag finger up 200px (CDP touchStart/Move/End)', () => drag(Math.round(sa.x), Math.round(sa.y + 100), Math.round(sa.y - 100)));
  await step('touch drag finger up 3x (CDP) to go deeper', async () => { for (let i = 0; i < 3; i++) { await drag(Math.round(sa.x), Math.round(sa.y + 150), Math.round(sa.y - 150)); await sleep(150); } });
  await step('touch drag finger down 3x (CDP) back up', async () => { for (let i = 0; i < 3; i++) { await drag(Math.round(sa.x), Math.round(sa.y - 150), Math.round(sa.y + 150)); await sleep(150); } });
  await step('synthesizeScrollGesture touch yDistance -220 (scrolls down)', () => gesture(-220, 700));
  await step('synthesizeScrollGesture touch yDistance +400 (scrolls up)', () => gesture(400, 900));
  await step('wheel up to the top (14x-300)', () => wheel(-300, 14));
  // details toggle: bring it into the visible area with the wheel, then a real tap (touch) / click, open then close
  const where = () => p.evaluate(() => { const t = document.querySelector('h1[tabindex="-1"]').closest('[role=region]').querySelector('button[aria-expanded]'); const r = t.getBoundingClientRect(); const sc = t.closest('[role=region]').firstElementChild.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, fold: sc.bottom - 14, top: sc.top }; });
  const bring = async () => { for (let i = 0; i < 30; i++) { const w = await where(); if (w.cy > w.top + 20 && w.cy < w.fold - 30) return w; await p.mouse.move(sa.x, sa.y); await p.mouse.wheel(0, w.cy >= w.fold - 30 ? 160 : -160); await sleep(70); } return where(); };
  let w1 = await bring();
  await step(`${mobile ? 'tap (touchscreen)' : 'click'} details toggle (open)`, async () => { w1 = await bring(); if (mobile) await p.touchscreen.tap(w1.cx, w1.cy); else await p.mouse.click(w1.cx, w1.cy); });
  await step('wheel down to the end after opening (14x300)', () => wheel(300, 14));
  await p.screenshot({ path: `${OUT}/${TAG}-${slug(cfg)}-A-open-end.png`, animations: 'disabled' }).catch(() => {});
  await step('wheel up until the toggle shows, then click it (close)', async () => { const w = await bring(); await p.mouse.click(w.cx, w.cy); });
  await step('wheel up to the top (14x-300)', () => wheel(-300, 14));
  // Tea time by a real tap
  const tt = await p.getByRole('button', { name: /Tea time|Long tea break/ }).first().boundingBox();
  const ttp = centre(tt);
  await step(`${mobile ? 'TAP (touchscreen)' : 'click'} Tea time`, async () => { if (mobile) await p.touchscreen.tap(ttp.x, ttp.y); else await p.mouse.click(ttp.x, ttp.y); await p.waitForFunction(() => { const t = window.__kettle.timer.getState(); return t.status === 'running' && t.phase !== 'focus'; }, null, { timeout: 8000 }).catch(() => {}); });
  rec.final = await p.evaluate(() => ({ hash: location.hash, timer: (({ status, phase }) => ({ status, phase }))(window.__kettle.timer.getState()), h1: document.querySelector('h1')?.textContent, btns: [...document.querySelectorAll('button')].map((x) => x.textContent.trim()).filter(Boolean).slice(0, 8) }));
  await ctx.close();
  return rec;
}

async function sessionTap(cfg, which, how) {
  const { ctx, p, errors } = await toDone(cfg);
  const rec = { session: `${which}-${how}`, cfg, tag: TAG, errors };
  rec.before = await p.evaluate(STATE);
  const name = which === 'tea' ? /Tea time|Long tea break/ : /^Skip break/;
  const bb = await p.getByRole('button', { name }).first().boundingBox();
  const c = centre(bb);
  rec.target = { name: String(name), box: bb };
  rec.hitOk = await p.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e ? { tag: e.tagName.toLowerCase(), text: e.closest('button')?.textContent.trim().slice(0, 30) ?? null } : null; }, c);
  if (how === 'tap') await p.touchscreen.tap(c.x, c.y); else await p.mouse.click(c.x, c.y);
  const t0 = Date.now();
  if (which === 'tea') await p.waitForFunction(() => { const t = window.__kettle.timer.getState(); return t.status === 'running' && t.phase !== 'focus'; }, null, { timeout: 8000 }).then(() => (rec.job = 'break running')).catch(() => (rec.job = 'NO break running within 8 s'));
  else await p.waitForFunction(() => location.hash === '#/' || !document.querySelector('h1[tabindex="-1"]'), null, { timeout: 8000 }).then(() => (rec.job = 'summary closed')).catch(() => (rec.job = 'summary still open after 8 s'));
  rec.ms = Date.now() - t0;
  await sleep(900);
  rec.after = await p.evaluate(() => ({ hash: location.hash, timer: (({ status, phase }) => ({ status, phase }))(window.__kettle.timer.getState()), h1: [...document.querySelectorAll('h1,h2')].map((e) => e.textContent.trim()).slice(0, 3), summaryOpen: !!document.querySelector('h1[tabindex="-1"]') }));
  await p.screenshot({ path: `${OUT}/${TAG}-${slug(cfg)}-${which}-${how}-after.png`, animations: 'disabled' }).catch(() => {});
  await ctx.close();
  return rec;
}

const slug = (c) => c.replace(/[@:]/g, '_');

async function sessionTab(cfg) {
  const { ctx, p, errors } = await toDone(cfg);
  const rec = { session: 'C', cfg, tag: TAG, stops: [], errors };
  // baseline: tag every focusable element in the document and snapshot its look unfocused
  await p.evaluate(() => {
    const sel = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"]),summary';
    window.__lpProps = ['outlineStyle', 'outlineWidth', 'outlineColor', 'outlineOffset', 'boxShadow', 'borderTopColor', 'borderTopWidth', 'backgroundColor', 'transform', 'filter'];
    window.__lpLook = (e) => { const c = getComputedStyle(e); const o = {}; for (const k of window.__lpProps) o[k] = c[k]; return o; };
    window.__lpBase = new Map();
    [...document.querySelectorAll(sel)].forEach((e, i) => { e.setAttribute('data-lp-i', i); window.__lpBase.set(i, { self: window.__lpLook(e), kid: e.firstElementChild ? window.__lpLook(e.firstElementChild) : null }); });
  });
  const describe = () => p.evaluate(() => {
    const e = document.activeElement;
    const R = (r) => ({ t: +r.top.toFixed(1), b: +r.bottom.toFixed(1), l: +r.left.toFixed(1), r: +r.right.toFixed(1) });
    if (!e || e === document.body) return { body: true, hash: location.hash };
    const i = e.getAttribute('data-lp-i');
    const base = i != null ? window.__lpBase.get(+i) : null;
    const now = window.__lpLook(e), kidNow = e.firstElementChild ? window.__lpLook(e.firstElementChild) : null;
    const diff = (a, b2) => (a && b2 ? Object.keys(a).filter((k) => a[k] !== b2[k]).map((k) => `${k}: ${a[k]} -> ${b2[k]}`) : null);
    const q = e.getBoundingClientRect();
    const region = document.querySelector('h1[tabindex="-1"]')?.closest('[role=region]');
    const sc = region?.firstElementChild?.getBoundingClientRect();
    const footer = region?.querySelector('footer')?.getBoundingClientRect();
    const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    return {
      tag: e.tagName.toLowerCase(), name: (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50), inSummary: !!region?.contains(e), inFooter: !!(region && region.querySelector('footer')?.contains(e)),
      focusVisible: e.matches(':focus-visible'), box: R(q), scrollTop: region ? region.firstElementChild.scrollTop : null,
      inVisibleArea: sc ? q.top >= 0 && q.bottom <= (footer && region.querySelector('footer').contains(e) ? innerHeight : sc.bottom - 14) + 0.5 : null,
      hitIsSelf: !!hit && (hit === e || e.contains(hit)), hash: location.hash,
      outline: { style: now.outlineStyle, width: now.outlineWidth, color: now.outlineColor, offset: now.outlineOffset }, boxShadow: now.boxShadow.slice(0, 120),
      selfDelta: diff(base?.self, now), kidDelta: diff(base?.kid, kidNow),
    };
  });
  const first = await describe();
  rec.stops.push({ n: 0, key: '(arrival: focus)', ...first });
  for (let n = 1; n <= 14; n++) {
    await p.keyboard.press('Tab');
    await sleep(450);
    const d = await describe();
    rec.stops.push({ n, key: 'Tab', ...d });
    if (d.box && d.name != null && !d.body) {
      const pad = 14;
      const clip = { x: Math.max(0, d.box.l - pad), y: Math.max(0, d.box.t - pad), width: Math.min(rec_w(p), d.box.r - d.box.l + 2 * pad), height: d.box.b - d.box.t + 2 * pad };
      if (clip.y + clip.height <= p.viewportSize().height && clip.x + clip.width <= p.viewportSize().width && clip.height > 0) await p.screenshot({ path: `${OUT}/${TAG}-${slug(cfg)}-C-tab${String(n).padStart(2, '0')}.png`, clip, animations: 'disabled' }).catch(() => {});
    }
    if (d.body || (!d.inSummary && n > 6)) break;
  }
  await p.screenshot({ path: `${OUT}/${TAG}-${slug(cfg)}-C-final.png`, animations: 'disabled' }).catch(() => {});
  await ctx.close();
  return rec;
}
const rec_w = (p) => p.viewportSize().width;

const results = [];
try {
  for (const cfg of args.cfgs.split(',')) {
    for (const sname of SESSIONS) {
      let r;
      try {
        if (sname === 'A') r = await sessionA(cfg);
        else if (sname === 'B1') r = await sessionTap(cfg, 'skip', 'click');
        else if (sname === 'B2') r = await sessionTap(cfg, 'tea', 'click');
        else if (sname === 'B3') r = await sessionTap(cfg, 'skip', 'tap');
        else if (sname === 'B4') r = await sessionTap(cfg, 'tea', 'tap');
        else if (sname === 'C') r = await sessionTab(cfg);
      } catch (e) { r = { session: sname, cfg, tag: TAG, error: e.message.slice(0, 200) }; }
      results.push(r);
      writeFileSync(`${OUT}/${TAG}-${slug(cfg)}-${sname}.json`, JSON.stringify(r, null, 1));
      log(`${TAG} ${cfg} ${sname}: ${r.error ?? r.job ?? (r.steps ? `${r.steps.length} steps, final ${JSON.stringify(r.final)}` : r.stops ? `${r.stops.length} stops` : '')}`);
    }
  }
} finally { await b.close(); }
