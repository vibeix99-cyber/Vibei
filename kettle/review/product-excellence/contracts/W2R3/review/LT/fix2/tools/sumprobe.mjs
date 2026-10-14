// Lane T (W2R3 T2 fix re-review): the summary sheet with a queued notice, and where the notice goes next.
// node sumprobe.mjs --base URL --out DIR --cfgs 375x667:light:200,... --days task,big --cases none,adebug,b,c,areal [--next break|today] [--par 3] [--shots 1]
// Setup by debug API (seed, startFocus, finish, raising a notice); actions under test by real tap.
// areal = the REAL update-prompt path: the dev server's /src/pwa/register.ts is served with one extra line that exposes
//         its module-internal patch() as window.__ltPwa, then needRefresh is set true during the brew; ShellOverlays'
//         PwaUpdatePrompt decides by itself whether to raise or dismiss the prompt.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const A = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const BASE = A.base.replace(/\/$/, '');
const OUT = A.out; mkdirSync(OUT, { recursive: true });
const DAYS = (A.days ?? 'task,big').split(',');
const CASES = (A.cases ?? 'none,adebug,b,c').split(',');
const NEXT = A.next ?? 'break';
const PAR = +(A.par ?? 3);
const SHOTS = A.shots === '1';
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

function recorder() {
  const R = (window.__sum = { frames: [], live: [], t0: null, said: [] });
  const NSEL = '[data-notice-strip] li, [data-inline-undo], [aria-label="Notifications"] li';
  const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.right * 10) / 10, Math.round(r.bottom * 10) / 10]; };
  const inter = (a, b) => a && b && a[2] > b[0] + 0.5 && a[0] < b[2] - 0.5 && a[3] > b[1] + 0.5 && a[1] < b[3] - 0.5;
  const tick = () => {
    const onDone = location.hash.includes('done');
    const region = document.querySelector('[data-focus-view] [role="region"]') || document.querySelector('[role="region"][aria-labelledby]');
    const sheet = region && region.querySelector('[class*="_sheet_"]');
    if (onDone && sheet) {
      const now = performance.now();
      if (R.t0 == null) R.t0 = now;
      const footer = region.querySelector('footer');
      const fb = box(footer);
      const rows = [...sheet.querySelectorAll('[data-fold]')].map((e) => ({ e, b: box(e) })).filter((x) => x.b[3] - x.b[1] > 1);
      const cut = rows.filter((x) => fb && x.b[3] > fb[1] + 0.5 && x.b[1] < fb[1] - 0.5).length;
      const under = rows.filter((x) => fb && x.b[1] >= fb[1] - 0.5).length;
      const notices = [...document.querySelectorAll(NSEL)].filter((n) => { const r = n.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight && +getComputedStyle(n).opacity > 0; });
      const kettle = document.querySelector('[data-stage-figure="kettle"]');
      const gauge = kettle && kettle.querySelector('[class*="_track_"]');
      const chai = document.querySelector('[data-stage-figure="chai"]');
      const cb = box(chai); const face = cb && [cb[0], cb[1], cb[2], cb[1] + (cb[3] - cb[1]) * 0.45];
      const gb = box(gauge);
      const topAt = (b, owner) => { if (!b) return null; const x = (b[0] + b[2]) / 2, y = (b[1] + b[3]) / 2; if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return 'offscreen'; const h = document.elementFromPoint(x, y); return !h ? 'none' : owner.contains(h) ? 'figure' : h.closest(NSEL) ? 'NOTICE' : sheet.contains(h) || region.contains(h) ? 'summary' : h.tagName.toLowerCase(); };
      R.frames.push({ t: Math.round(now - R.t0), hasKettle: !!kettle, hasGauge: !!gauge, hasChai: !!chai, sheet: box(sheet), footer: fb, scroll: Math.round(sheet.closest('[class*="_scroll_"]')?.scrollTop ?? -1), cut, under,
        notices: notices.map((n) => (n.innerText || '').replace(/\s+/g, ' ').slice(0, 40)),
        noticeOverSheet: notices.some((n) => inter(box(n), box(sheet))), noticeOverFooter: notices.some((n) => inter(box(n), fb)),
        noticeOverFigures: notices.some((n) => inter(box(n), face) || inter(box(n), gb)),
        face: face && face.map(Math.round), gauge: gb && gb.map(Math.round), faceTop: chai && topAt(face, chai), gaugeTop: kettle && topAt(gb, kettle),
        sheetOverFace: inter(box(sheet), face), sheetOverGauge: inter(box(sheet), gb) });
      if (R.frames.length > 4000) R.frames.shift();
    }
    requestAnimationFrame(tick);
  };
  const mo = new MutationObserver((ms) => {
    for (const m of ms) {
      const host = (m.target.nodeType === 1 ? m.target : m.target.parentElement)?.closest?.('[aria-live], [role=status], [role=alert], [role=log]');
      if (!host || host.getAttribute('aria-live') === 'off') continue;
      const txt = m.type === 'characterData' ? m.target.textContent : [...m.addedNodes].map((x) => x.textContent).join(' ');
      if (txt && txt.trim()) R.live.push({ t: Math.round(performance.now()), hash: location.hash, text: txt.replace(/\s+/g, ' ').trim().slice(0, 80), said: host.hasAttribute('data-notices-said') });
    }
  });
  addEventListener('DOMContentLoaded', () => { mo.observe(document.body, { subtree: true, childList: true, characterData: true }); requestAnimationFrame(tick); });
}

const ready = (p) => p.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60_000 });
const drawn = (p) => p.evaluate(() => [...document.querySelectorAll('[data-notice-strip] li, [data-inline-undo], [aria-label="Notifications"] li')].filter((n) => { const r = n.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight && !n.closest('[data-route-leaving]'); }).map((n) => { const r = n.getBoundingClientRect(); return { text: (n.innerText || '').replace(/\s+/g, ' ').slice(0, 60), box: [r.left, r.top, r.width, r.height].map(Math.round), whole: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, cut: n.scrollHeight > n.clientHeight + 1 || [...n.querySelectorAll('*')].some((x) => { const cs = getComputedStyle(x); return (cs.overflow !== 'visible' || cs.webkitLineClamp !== 'none') && (x.scrollHeight > x.clientHeight + 1 || x.scrollWidth > x.clientWidth + 1); }) }; }));
const nine = (loc) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); let n = 0; for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) { const h = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if (h && e.contains(h)) n++; } return { n, box: [r.left, r.top, r.width, r.height].map(Math.round) }; });
const tap = async (p, touch, loc) => { const b = await nine(loc); const [x, y, w, h] = b.box; if (touch) await p.touchscreen.tap(x + w / 2, y + h / 2); else await p.mouse.click(x + w / 2, y + h / 2); return b; };

async function run(c, day, kase) {
  const phone = c.w < 900;
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: c.theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  await ctx.addInitScript((pct) => {
    try { localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
    window.__ltToast = async (m, o) => (window.__kettle && window.__kettle.toast ? window.__kettle.toast(m, o) : (await import('/src/ui/Toast.tsx')).toast(m, o));
  }, c.pct);
  await ctx.addInitScript(recorder);
  if (kase === 'areal') await ctx.route('**/src/pwa/register.ts*', async (route) => { const r = await route.fetch(); const body = (await r.text()) + '\n;window.__ltPwa = (v) => patch({ needRefresh: v });\n'; await route.fulfill({ response: r, body }); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  await p.clock.install({ time: MONDAY }); await p.clock.resume();
  const f = { cfg: c.name, day, kase, base: BASE };
  try {
    await p.goto(`${BASE}/?debug&seed=${day === 'big' ? 'celebrate' : 'newbie'}&theme=${c.theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(600);
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(1500);
    if (kase === 'areal') {
      f.pwaHook = await p.evaluate(() => typeof window.__ltPwa);
      await p.evaluate(() => window.__ltPwa(true));
      await sleep(1200);
      f.duringBrew = { drawn: await drawn(p), queue: await p.evaluate(() => window.__kettle.notices ? window.__kettle.notices() : null), needRefresh: await p.evaluate(() => window.__kettle.pwa.state().needRefresh) };
    }
    if (kase === 'adebug') await p.evaluate(async () => { await window.__ltToast('A persistent notice, pending as the summary arrives.', { id: 'lt-persist', icon: 'sparkle', duration: Infinity, action: { label: 'Open', onClick: () => { window.__ltAct = (window.__ltAct || 0) + 1; } } }); window.__kettle.finish(); });
    else await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => window.__sum && window.__sum.t0 != null, null, { timeout: 30_000 });
    await sleep(1500);
    if (kase === 'b') await p.evaluate(async () => { await window.__ltToast('A persistent notice raised after the summary arrived.', { id: 'lt-after', icon: 'sparkle', duration: Infinity, action: { label: 'Open', onClick: () => { window.__ltAct = (window.__ltAct || 0) + 1; } } }); });
    if (kase === 'c') await p.evaluate(async () => { await window.__ltToast('Couldn’t save just now. Your summary is still here.', { tone: 'warning', duration: 4000 }); });
    await sleep(2000);
    if (SHOTS) await p.screenshot({ path: `${OUT}/${c.name}-${day}-${kase}-summary.png`, fullPage: false });
    await sleep(1000);
    f.summary = await p.evaluate(() => { const S = window.__sum; return { frames: S.frames.length, series: S.frames.filter((x, i) => i % 6 === 0 || i === S.frames.length - 1) }; });
    f.queueOnSummary = await p.evaluate(() => (window.__kettle.notices ? window.__kettle.notices() : null));
    // next screen
    const touch = phone;
    const next = kase === 'areal' || kase === 'b' ? 'today' : NEXT;
    f.nextScreen = next;
    if (next === 'break' || next === 'today') {
      const btn = next === 'break' ? p.getByRole('button', { name: /^(Tea time|Long tea break)/ }).first() : p.getByRole('button', { name: 'Skip break' }).first();
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      const t = await tap(p, touch, btn);
      f.nextTap = t;
      const t1 = Date.now(); const seq = [];
      while (Date.now() - t1 < 16_000) {
        const d = await drawn(p);
        const s = d.map((x) => x.text.slice(0, 30)).join(' | ');
        if (!seq.length || seq[seq.length - 1].s !== s) seq.push({ ms: Date.now() - t1, hash: await p.evaluate(() => location.hash), s, n: d.length, whole: d.every((x) => x.whole), cut: d.some((x) => x.cut), box: d[0]?.box, act: d.some((x) => /(Open|Update)$/.test(x.text)) });
        const act = p.locator('[data-notice-strip] li button, [aria-label="Notifications"] li button').filter({ hasText: /^(Open|Update)$/ }).first();
        const seenTimes = seq.filter((x) => x.act).length;
        if (A.wheel === '1' && seenTimes && !f.action && !f.wheeled && Date.now() - t1 > 3000) {
          const nb = (await drawn(p))[0];
          if (nb) { await p.mouse.move(nb.box[0] + nb.box[2] / 2, Math.min(p.viewportSize().height - 10, nb.box[1] + 20)); for (let i = 0; i < +(A.wsteps ?? 4); i++) { await p.mouse.wheel(0, +(A.wpx ?? 60)); await sleep(120); } await p.mouse.move(1, p.viewportSize().height - 1); f.wheeled = { at: Date.now() - t1, after: await drawn(p) }; }
        }
        if (SHOTS && s && !f.nextShot && Date.now() - t1 > 300) { await sleep(450); await p.screenshot({ path: `${OUT}/${c.name}-${day}-${kase}-next-drawn.png` }).catch(() => {}); f.nextShot = { ms: Date.now() - t1, drawn: await drawn(p) }; }
        if (kase !== 'none' && kase !== 'c' && !f.action && seenTimes && Date.now() - t1 > 1500 && (await act.count())) {
          await sleep(300);
          const nn = await nine(act).catch(() => null);
          if (nn && nn.n === 9) {
            const label = await act.innerText();
            f.liveBeforeAction = await p.evaluate(() => window.__sum.live);
            const nav = p.waitForEvent('framenavigated', { timeout: 5000 }).then(() => true).catch(() => false);
            await tap(p, touch, act);
            f.action = { label, nine: nn, ms: Date.now() - t1, hash: await p.evaluate(() => location.hash).catch(() => '?') };
            if (label === 'Update') { f.action.reloaded = await nav; await sleep(1500); break; }
            f.action.onClick = await p.evaluate(() => window.__ltAct || 0);
          }
        }
        const q = await p.evaluate(() => (window.__kettle.notices ? window.__kettle.notices() : null));
        if (!s && q && (!q.queue || q.queue.length === 0) && Date.now() - t1 > 4000) break;
        await sleep(120);
      }
      f.next = seq;
      if (SHOTS) await p.screenshot({ path: `${OUT}/${c.name}-${day}-${kase}-next.png` }).catch(() => {});
    }
    f.live = await p.evaluate(() => window.__sum.live).catch(() => null);
  } catch (e) { f.error = e.message.split('\n')[0].slice(0, 200); }
  f.pageErrors = errs.slice(0, 3);
  await ctx.close();
  return f;
}

const cfgs = A.cfgs.split(',').map((s) => { const [wh, theme, pct] = s.split(':'); const [w, h] = wh.split('x').map(Number); return { w, h, theme, pct: +pct, name: `${w}x${h}-${theme}-t${pct}` }; });
const jobs = [];
for (const c of cfgs) for (const d of DAYS) for (const k of CASES) jobs.push([c, d, k]);
const results = [];
await Promise.all(Array.from({ length: PAR }, async () => { while (jobs.length) { const [c, d, k] = jobs.shift(); const r = await run(c, d, k); results.push(r); writeFileSync(`${OUT}/${c.name}-${d}-${k}.json`, JSON.stringify(r, null, 1)); console.log(`${c.name} ${d} ${k}: ${r.error ? 'ERROR ' + r.error : 'ok'} frames=${r.summary?.frames}`); } }));
await browser.close();
