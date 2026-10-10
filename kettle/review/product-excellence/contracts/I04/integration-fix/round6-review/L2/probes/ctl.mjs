// L2 check 4: protected controls under toasts. A real journey (real taps / clicks; the debug API only fast-forwards the brew
// clock and finishes timers), and in each state toasts are raised (the app's own toast(), default real timers: they
// expire after 3.2 s) while a per-frame recorder hit-tests every protected control at its centre (elementFromPoint) and
// compares its box with every toast's box. Windows: 1 toast, then 3 toasts; the real tap on the control happens WHILE
// the toasts are up. Violations in the first 600 ms after the first toast frame are "transient" (the lift measures every
// 250 ms); later ones are "settled" (the rule: none).
//   node ctl.mjs <base> <rev> <outdir> <WxH> <themes> <texts>
import { mkdirSync, appendFileSync } from 'node:fs';
import { launch, newCtx, openNewbie, fillQuota, sleep, WARN } from './lib.mjs';

const [base, rev, out, cfg, themeArg, textArg] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const [W, H] = cfg.split('x').map(Number);
const phone = W < 900;
const browser = await launch();

const SPEC = {
  put: { n: 'Put the kettle on', re: '^Put the kettle on' },
  add5: { n: 'Add 5', re: '^Add 5 minutes' },
  pr: { n: 'Pause/Resume', re: '^(Pause|Resume)$' },
  end: { n: 'End', re: '^End session$' },
  tea: { n: 'Tea time', re: 'Tea time|Long tea break' },
  skipS: { n: 'Skip (summary)', re: '^Skip break$' },
  skipR: { n: 'Skip (break)', re: '^Skip break$' },
  prB: { n: 'Pause/Resume break', re: '^(Pause|Resume) break$' },
  next: { n: 'Next brew', re: '^Start next brew' },
  mark: { n: 'Mark it done, start fresh', re: 'Mark it done' },
  leave: { n: "That's all for now", re: 'all for now' },
};
const COUNTDOWN = { n: 'countdown', sel: '[class*="readout"] [class*="clock"]', kind: 'text' };
const READOUT = { n: 'readout', sel: '[class*="readout"]', kind: 'text' };

// ---- in-page: the recorder ------------------------------------------------------------------------------------------
const DEFINE_FIND = () => {
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const ok = (el) => !el.closest('[aria-label="Notifications"]') && !el.closest('[aria-hidden="true"], [inert]');
  window.__ctlFind = (sp) => {
    if (sp.sel) { const e = [...document.querySelectorAll(sp.sel)].filter((x) => ok(x) && x.getBoundingClientRect().width > 0); return e[0] ?? null; }
    const rx = new RegExp(sp.re, 'i');
    const c = [...document.querySelectorAll('button, [role="button"], a[href]')].filter((b) => {
      if (!ok(b)) return false;
      const r = b.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const lab = norm(b.getAttribute('aria-label') || b.textContent || '');
      return rx.test(lab);
    });
    return c[0] ?? null;
  };
};
const CTL_START = (specs) => {
  const C = (window.__ctl = { specs, frames: 0, framesToasts: 0, tFirst: null, viol: [], per: {}, stop: false, t0: performance.now() });
  const tick = () => {
    if (C.stop) return;
    const t = performance.now() - C.t0;
    // a toast's drawn box = its layout box clipped by the list's scrollport (when the list scrolls): a toast scrolled out of
    // the room is not drawn and not hit-testable, so it covers nothing
    const ol = document.querySelector('[aria-label="Notifications"] ol');
    let clip = null;
    if (ol && getComputedStyle(ol).overflowY !== 'visible') { const q = ol.getBoundingClientRect(); clip = { left: q.left + ol.clientLeft, top: q.top + ol.clientTop, right: q.left + ol.clientLeft + ol.clientWidth, bottom: q.top + ol.clientTop + ol.clientHeight }; }
    const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
      let o = 1; for (let e = li; e && e !== document.documentElement; e = e.parentElement) o *= +getComputedStyle(e).opacity;
      let r = li.getBoundingClientRect();
      if (clip) { r = { left: Math.max(r.left, clip.left), right: Math.min(r.right, clip.right), top: Math.max(r.top, clip.top), bottom: Math.min(r.bottom, clip.bottom) }; if (r.right <= r.left || r.bottom <= r.top) r = null; }
      return { r, o, id: li.id, li };
    }).filter((x) => x.o > 0.05 && x.r);
    C.frames++;
    if (toasts.length) { C.framesToasts++; if (C.tFirst == null) C.tFirst = t; }
    for (const sp of C.specs) {
      const el = window.__ctlFind(sp);
      const P = (C.per[sp.n] ??= { found: 0, frames: 0, inView: 0, hitOk: 0 });
      P.frames++;
      if (!el) { if (toasts.length) C.viol.push([t, sp.n, 'missing', '']); continue; }
      P.found++;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const inView = cx >= 0 && cx < innerWidth && cy >= 0 && cy < innerHeight;
      if (inView) P.inView++;
      if (!toasts.length) continue;
      let hit = null;
      if (inView) hit = document.elementFromPoint(cx, cy);
      const hitOk = inView && !!hit && (sp.kind === 'text' ? !hit.closest('[aria-label="Notifications"]') : el.contains(hit));
      if (hitOk) P.hitOk++;
      if (inView && !hitOk) C.viol.push([t, sp.n, 'hit', hit ? `${hit.tagName.toLowerCase()}.${String(hit.className).slice(0, 30)}${hit.closest('[aria-label="Notifications"]') ? ' [TOAST]' : ''}` : 'null']);
      if (!inView) { P.off = (P.off ?? 0) + 1; }
      for (const x of toasts) {
        const ix = Math.min(r.right, x.r.right) - Math.max(r.left, x.r.left);
        const iy = Math.min(r.bottom, x.r.bottom) - Math.max(r.top, x.r.top);
        if (ix > 1 && iy > 1) C.viol.push([t, sp.n, 'overlap', `${x.id.replace(/^toast-/, '').slice(0, 14)} ${ix.toFixed(0)}x${iy.toFixed(0)} ctl[${r.top.toFixed(0)}-${r.bottom.toFixed(0)}] toast[${x.r.top.toFixed(0)}-${x.r.bottom.toFixed(0)}]`]);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const CTL_STOP = () => { window.__ctl.stop = true; const C = window.__ctl; return { frames: C.frames, framesToasts: C.framesToasts, tFirst: C.tFirst, viol: C.viol, per: C.per }; };
const RAISE = async (n) => {
  const { toast } = await import('/src/ui/Toast.tsx');
  const items = [['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['Saved 12 minutes of focus', 'info'], ['Cozy level 5!', 'success']].slice(-n);
  for (const [m, tone] of items) toast(m, { tone });
};
const DISMISS = async () => (await import('/src/ui/Toast.tsx')).toast.dismiss();
const FIND = (sp) => {
  const el = window.__ctlFind?.(sp);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hit = cx >= 0 && cx < innerWidth && cy >= 0 && cy < innerHeight ? document.elementFromPoint(cx, cy) : null;
  return { x: cx, y: cy, rect: [r.top, r.bottom], inView: !!hit || (cx >= 0 && cx < innerWidth && cy >= 0 && cy < innerHeight), hit: hit ? (el.contains(hit) ? 'self' : `${hit.tagName.toLowerCase()}${hit.closest('[aria-label="Notifications"]') ? ' [TOAST]' : ''}`) : null };
};

const results = [];
for (const theme of themeArg.split(','))
  for (const text of textArg.split(',').map(Number)) {
    const tag = `${rev}-${W}x${H}-${theme}-t${text}`;
    const rows = []; // per window result
    const ctx = await newCtx(browser, { w: W, h: H, theme, text });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    let cdp = null;
    const tapAt = async (x, y) => { if (phone) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
    // real scroll of the page (not the toast list) to bring a control to view; toasts are put away before this runs.
    // strategies in turn when nothing moves: touch drag at x=5, touch drag mid-screen, wheel mid-screen
    let strat = 0;
    // x positions in turn: the left gutter, mid-screen, and the right-hand panel (landscape / desktop keep the controls there)
    const XS = [5, Math.round(W / 2), Math.round(W * 0.78), Math.round(W * 0.9)];
    const scrollPage = async (dy) => {
      const k = strat % 8, x = XS[k % 4], y = Math.round(H * 0.6), useWheel = !phone || k >= 4;
      if (useWheel) { await page.mouse.move(x, y); await page.mouse.wheel(0, dy); await sleep(250); return; }
      cdp ??= await ctx.newCDPSession(page);
      const n = Math.max(1, Math.round(Math.abs(dy) / 10)), dir = dy > 0 ? -1 : 1, px = Math.abs(dy) / n;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y + dir * i * px) }] }); await sleep(12); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await sleep(300);
    };
    const scrollers = (sp) => page.evaluate((sp) => {
      const el = window.__ctlFind(sp); const out = [];
      for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1) out.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0].slice(0, 24)} top ${Math.round(e.scrollTop)}/${e.scrollHeight - e.clientHeight}`); }
      const d = document.scrollingElement; out.push(`doc top ${Math.round(d.scrollTop)}/${d.scrollHeight - d.clientHeight}`);
      return out;
    }, sp);
    const wake = async () => { await page.mouse.move(W / 2 + 3, H / 2 + 3); await page.mouse.move(W / 2 - 5, H / 2 + 9); await sleep(900); };
    /** One window: toasts n, per-frame recording, shot, optional real tap while the toasts are up. */
    const win = async (label, specs, n, { tap, expect, extra } = {}) => {
      const row = { label, n, tag };
      const specList = [...specs, ...(label.startsWith('running') || label.startsWith('paused') || label.startsWith('break') ? [COUNTDOWN, READOUT] : [])];
      try {
        await wake();
        // bring every protected control into view first by REAL scrolling (a person scrolls to reach it)
        row.scrolled = {};
        for (const sp of specs) {
          let prevY = null;
          for (let i = 0; i < 14; i++) {
            const f = await page.evaluate(FIND, sp);
            if (!f) { row.scrolled[sp.n] = 'missing'; break; }
            if (f.y > 24 && f.y < H - 24) { row.scrolled[sp.n] = i; break; }
            if (prevY != null && Math.abs(f.y - prevY) < 1) strat++;
            prevY = f.y;
            await scrollPage(Math.max(-260, Math.min(260, f.y - H / 2)));
            row.scrolled[sp.n] = 'unreached';
          }
          if (row.scrolled[sp.n] === 'unreached') {
            row.unreached = row.unreached ?? {};
            row.unreached[sp.n] = await scrollers(sp);
            await page.screenshot({ path: `${out}/${tag}-${label}-unreached-${sp.n.replace(/\W+/g, '_')}.png`, scale: 'css' });
          }
        }
        await page.evaluate(DISMISS); await sleep(400);
        await page.evaluate(CTL_START, specList);
        await sleep(100);
        await page.evaluate(RAISE, n);
        await sleep(1300);
        if (n === 3 || extra) await page.screenshot({ path: `${out}/${tag}-${label}-n${n}.png`, scale: 'css' });
        await sleep(700);
        const res = await page.evaluate(CTL_STOP);
        row.frames = res.frames; row.framesToasts = res.framesToasts;
        const settleAt = (res.tFirst ?? 0) + 600;
        const soft = (v) => v[1] === 'readout';
        const sv = res.viol.filter((v) => v[0] >= settleAt && !soft(v)), tv = res.viol.filter((v) => v[0] < settleAt && !soft(v));
        row.settledSoft = res.viol.filter((v) => v[0] >= settleAt && soft(v)).length;
        row.settledSoftEx = res.viol.find((v) => v[0] >= settleAt && soft(v))?.[3] ?? '';
        const summ = (vs) => { const m = {}; for (const v of vs) { const k = `${v[1]}|${v[2]}`; (m[k] ??= { n: 0, ex: v[3] }).n++; } return m; };
        row.settled = summ(sv); row.transient = summ(tv);
        row.settledCount = sv.length; row.transientCount = tv.length;
        row.per = res.per;
        row.settledFramesChecked = res.framesToasts;
        // tap while toasts are still up
        if (tap) {
          const f0 = await page.evaluate(FIND, tap);
          row.tapPre = f0;
          row.toastsAtTap = await page.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').length);
          if (!f0) row.tap = 'control missing';
          else {
            if (!(f0.y >= 0 && f0.y < H && f0.x >= 0 && f0.x < W)) { row.tap = 'not on screen'; }
            else {
              await tapAt(f0.x, f0.y);
              const okx = await page.waitForFunction(expect, null, { timeout: 4500 }).then(() => true).catch(() => false);
              row.tap = okx ? 'worked' : 'DID NOT TAKE EFFECT';
              if (!okx) await page.screenshot({ path: `${out}/${tag}-${label}-n${n}-tapfail.png`, scale: 'css' });
            }
          }
        }
      } catch (e) { row.error = String(e.message).split('\n')[0]; }
      rows.push(row);
      const sv = Object.entries(row.settled ?? {}).map(([k, v]) => `${k}×${v.n}(${v.ex})`).join('; ');
      const tvv = Object.entries(row.transient ?? {}).map(([k, v]) => `${k}×${v.n}`).join('; ');
      console.log(`${tag} ${label} n=${n}: toastFrames ${row.framesToasts}/${row.frames} SETTLED[${row.settledCount ?? '?'}] ${sv}${row.settledSoft ? ` (+readout-box overlap ${row.settledSoft} frames: ${row.settledSoftEx})` : ''} scrolled ${JSON.stringify(row.scrolled)}${row.unreached ? ' UNREACHED ' + JSON.stringify(row.unreached) : ''}${tvv ? ` | transient[${row.transientCount}] ${tvv}` : ''}${row.tap ? ` | tap ${row.tap}${row.tapPre ? ` (hit ${row.tapPre.hit}, toasts ${row.toastsAtTap})` : ''}` : ''}${row.error ? ' ERROR ' + row.error : ''}`);
      return row;
    };
    const ex = {
      focus: () => location.hash === '#/focus',
    };
    const has = (re) => `() => [...document.querySelectorAll('button')].some((b) => new RegExp(${JSON.stringify(re)}).test((b.getAttribute('aria-label') || b.textContent || '').replace(/[’‘]/g, "'").trim()))`;
    const hasNot = (re) => `() => ![...document.querySelectorAll('button')].some((b) => new RegExp(${JSON.stringify(re)}).test((b.getAttribute('aria-label') || b.textContent || '').replace(/[’‘]/g, "'").trim()))`;
    const fn = (s) => new Function(`return (${s})()`);
    try {
      await openNewbie(page, base, theme);
      if (!globalThis.__uaLogged) { globalThis.__uaLogged = true; console.log(`UA ${await page.evaluate(() => navigator.userAgent)} | browser ${browser.version()}`); }
      await page.evaluate(DEFINE_FIND);
      // 1 Today
      await win('today', [SPEC.put], 1);
      // a real intention typed with the keyboard, so the brew can be carried to "Break's over" (Mark it done, start fresh)
      try { await page.getByPlaceholder(/Chapter 3 notes/).click(); await page.keyboard.type('Chapter 3 notes', { delay: 25 }); await sleep(300); } catch (e) { console.log(`${tag} NOTE could not type an intention: ${String(e.message).split('\n')[0]}`); }
      await win('today', [SPEC.put], 3, { tap: SPEC.put, expect: fn(`() => location.hash === '#/focus'`) });
      await sleep(3500); await wake();
      // 2 running: Pause, Resume, Add 5, End (sheet) — each tapped with toasts up
      await win('running', [SPEC.add5, SPEC.pr, SPEC.end], 1);
      await win('running', [SPEC.add5, SPEC.pr, SPEC.end], 2);
      await win('running', [SPEC.add5, SPEC.pr, SPEC.end], 3, { tap: SPEC.pr, expect: fn(has('^Resume$')) });
      await sleep(1500);
      await win('paused', [SPEC.add5, SPEC.pr, SPEC.end], 1);
      await win('paused', [SPEC.add5, SPEC.pr, SPEC.end], 3, { tap: SPEC.pr, expect: fn(has('^Pause$')) });
      await sleep(1500);
      await win('running-b', [SPEC.add5, SPEC.pr, SPEC.end], 3, { tap: SPEC.add5, expect: fn(`() => /Add 5 more/.test(document.body.textContent)`) });
      await sleep(1500);
      await win('running-c', [SPEC.add5, SPEC.pr, SPEC.end], 3, { tap: SPEC.end, expect: fn(`() => !!document.querySelector('[role="dialog"]')`) });
      // the End sheet: its buttons, hit-tested under any toast that is still up, then Keep brewing by a real tap
      {
        await sleep(900);
        const f = await page.evaluate(FIND, { n: 'Keep brewing', re: '^Keep brewing$' });
        const f2 = await page.evaluate(FIND, { n: 'End session (sheet)', re: '^End session$' });
        console.log(`${tag} end-sheet: Keep brewing ${JSON.stringify(f)} | End session ${JSON.stringify(f2)}`);
        rows.push({ label: 'end-sheet', tag, keep: f, endBtn: f2 });
        if (f) { await tapAt(f.x, f.y); await sleep(900); }
      }
      // 3 summary
      await page.evaluate(() => { window.__kettle.nearEnd(); });
      await sleep(400);
      await page.evaluate(() => { window.__kettle.finish(); });
      await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ state: 'visible', timeout: 60_000 });
      await sleep(2800);
      await win('summary', [SPEC.tea, SPEC.skipS], 1);
      await win('summary', [SPEC.tea, SPEC.skipS], 3, { tap: SPEC.tea, expect: fn(has('^Pause break$')) });
      await sleep(2500);
      // 4 break
      await win('break', [SPEC.skipR, SPEC.prB, SPEC.next], 1);
      await win('break', [SPEC.skipR, SPEC.prB, SPEC.next], 2);
      await win('break', [SPEC.skipR, SPEC.prB, SPEC.next], 3, { tap: SPEC.prB, expect: fn(has('^Resume break$')) });
      await sleep(1200);
      await win('break-paused', [SPEC.skipR, SPEC.prB, SPEC.next], 3, { tap: SPEC.prB, expect: fn(has('^Pause break$')) });
      await sleep(1000);
      await page.evaluate(() => { window.__kettle.finish(); });
      await page.getByRole('button', { name: /Mark it done|That’s all for now/ }).first().waitFor({ state: 'visible', timeout: 30_000 });
      await sleep(2800);
      // 5 break's over
      await win('over', [SPEC.mark, SPEC.put, SPEC.leave], 1);
      await win('over', [SPEC.mark, SPEC.put, SPEC.leave], 3, { tap: SPEC.mark, expect: fn(hasNot('Mark it done')) });
      await sleep(1500);
      await win('over-b', [SPEC.put, SPEC.leave], 3, { tap: SPEC.put, expect: fn(has('^Pause$')) });
      // 6 summary again → Skip
      await sleep(2500);
      await page.evaluate(() => { window.__kettle.nearEnd(); }); await sleep(400); await page.evaluate(() => { window.__kettle.finish(); });
      await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ state: 'visible', timeout: 60_000 });
      await sleep(2800);
      await win('summary-b', [SPEC.tea, SPEC.skipS], 3, { tap: SPEC.skipS, expect: fn(`() => location.hash === '#/' || location.hash === ''`) });
      // 7 Today → brew → summary → Tea time → break → Next brew
      await sleep(2500);
      await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
      await sleep(3000);
      await page.evaluate(() => { window.__kettle.nearEnd(); }); await sleep(400); await page.evaluate(() => { window.__kettle.finish(); });
      await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ state: 'visible', timeout: 60_000 });
      await sleep(2600);
      await page.getByRole('button', { name: /Tea time|Long tea break/ }).click();
      await sleep(2800);
      await win('break-b', [SPEC.skipR, SPEC.prB, SPEC.next], 3, { tap: SPEC.next, expect: fn(has('^Pause$')) });
      // 8 finish for now
      await sleep(2500);
      await page.evaluate(() => { window.__kettle.nearEnd(); }); await sleep(400); await page.evaluate(() => { window.__kettle.finish(); });
      await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ state: 'visible', timeout: 60_000 });
      await sleep(2600);
      await page.getByRole('button', { name: /Tea time|Long tea break/ }).click();
      await sleep(2800);
      await page.evaluate(() => { window.__kettle.finish(); });
      await page.getByRole('button', { name: /That’s all for now/ }).waitFor({ state: 'visible', timeout: 30_000 });
      await sleep(2800);
      await win('over-c', [SPEC.mark, SPEC.put, SPEC.leave], 3, { tap: SPEC.leave, expect: fn(`() => location.hash === '#/' || location.hash === ''`) });
    } catch (e) {
      console.log(`${tag} JOURNEY ERROR ${String(e.message).split('\n')[0]}`);
      rows.push({ label: 'journey', tag, error: String(e.message).split('\n')[0] });
    }
    await ctx.close();
    // 9 Today with the REAL storage-full warning and two more toasts: the docked start must stay uncovered and tappable
    {
      const ctx2 = await newCtx(browser, { w: W, h: H, theme, text });
      const page2 = await ctx2.newPage();
      const row = { label: 'today+warning', n: 3, tag };
      try {
        await openNewbie(page2, base, theme);
        await page2.evaluate(DEFINE_FIND);
        const q = await fillQuota(page2); row.quota = q;
        await page2.evaluate(() => {
          const k = window.__kettle, led = k.progress.getState().ledger;
          k.progress.setState({ ledger: [...led, { ...led[led.length - 1], id: 'probe-'.padEnd(400, 'x'), amount: 0 }] });
          k.progress.setState({ ledger: led });
        });
        await page2.waitForSelector(`[id="${WARN}"]`, { timeout: 8000 });
        await sleep(1200);
        await page2.evaluate(CTL_START, [SPEC.put]);
        await page2.evaluate(RAISE, 2);
        await sleep(1300);
        await page2.screenshot({ path: `${out}/${tag}-today+warning-n3.png`, scale: 'css' });
        await sleep(700);
        const res = await page2.evaluate(CTL_STOP);
        const settleAt = (res.tFirst ?? 0) + 600;
        const sv = res.viol.filter((v) => v[0] >= settleAt), tv = res.viol.filter((v) => v[0] < settleAt);
        row.settledCount = sv.length; row.transientCount = tv.length; row.viol = res.viol.slice(0, 6); row.framesToasts = res.framesToasts;
        const f0 = await page2.evaluate(FIND, SPEC.put);
        row.tapPre = f0;
        row.toastsAtTap = await page2.evaluate(() => [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.id.replace(/^toast-/, '')));
        if (f0 && f0.y >= 0 && f0.y < H) {
          if (phone) await page2.touchscreen.tap(f0.x, f0.y); else await page2.mouse.click(f0.x, f0.y);
          const okx = await page2.waitForFunction(() => location.hash === '#/focus', null, { timeout: 4500 }).then(() => true).catch(() => false);
          row.tap = okx ? 'worked' : 'DID NOT TAKE EFFECT';
          if (!okx) await page2.screenshot({ path: `${out}/${tag}-today+warning-tapfail.png`, scale: 'css' });
        } else row.tap = 'control not on screen';
      } catch (e) { row.error = String(e.message).split('\n')[0]; }
      rows.push(row);
      console.log(`${tag} today+warning n=3: toastFrames ${row.framesToasts} SETTLED[${row.settledCount}] transient[${row.transientCount}] ${JSON.stringify(row.viol ?? [])} | tap ${row.tap} (hit ${row.tapPre?.hit}, toasts ${JSON.stringify(row.toastsAtTap)}) ${row.error ?? ''}`);
      await ctx2.close();
    }
    appendFileSync(`${out}/${rev}-ctl.jsonl`, JSON.stringify({ tag, rows, errors }) + '\n');
    results.push({ tag, rows });
  }
await browser.close();
let viol = 0, taps = 0, tapFail = 0, wins = 0;
for (const r of results) for (const row of r.rows) { if (row.label === 'end-sheet' || row.label === 'journey') continue; wins++; viol += row.settledCount ?? 0; if (row.tap) { taps++; if (row.tap !== 'worked') tapFail++; } }
console.log(`${rev} ${cfg} ${themeArg} t${textArg}: windows ${wins}, settled violations ${viol}, taps ${taps}, tap failures ${tapFail}`);
