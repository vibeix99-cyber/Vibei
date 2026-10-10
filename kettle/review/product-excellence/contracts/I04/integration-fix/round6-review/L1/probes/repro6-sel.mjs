// L1 ADAPTATION of repro6.mjs: env IDX=6,8,10,... runs exactly those run indices (index i -> input wheel/touch = i%2, timing class = floor(i/2)%10); nothing else changed.
// r6 packet item (c): the round-5 (R5-D1) reproduction on a disposable profile, REAL timers throughout.
//   node .tmp/w1fix/repro6.mjs <base> <tag> <outDir> [configFilter] [runsPerConfig=20] [clip=1]
// Setup (a fresh browser context = a disposable profile per run): 200 % text; the newbie seed one leaf below its next
// level; localStorage really full (QuotaExceededError); a brew started, fast-forwarded 12 min with the debug build's
// brew clock (`__kettle.ff`, setup only) and ended → Today with three toasts ("Cozy level N!", "Saved 12 minutes of
// focus", the storage-full warning). Toast timers are never touched: no synthetic pointerenter/leave, no held toasts, no
// timer changes; a toast pauses only under the real pointer (wheel runs) or a real touch, as in use. Scrolling is only
// real input: `page.mouse.wheel` (20 px notches) or CDP `Input.dispatchTouchEvent` finger drags (24 px).
// Timing is varied so the older toasts' natural 3.2 s expiry lands before, during or after the gesture:
//   before: first input 3.6 / 4.2 / 4.8 s after the warning appears (full gesture)
//   during: first input 1.0 / 1.6 / 2.2 / 2.8 s after (full gesture: down as far as the stack goes, back up)
//   after:  first input 0.3 / 0.6 / 0.9 s after, a short gesture (4 notches down, 4 up), then the pointer leaves
// × wheel and touch = 20 runs per configuration. Every animation frame is recorded from before End to 2.2 s after the
// last input. Judged from the first frame the warning is at full opacity:
//   hide/reset: the warning's element removed (and re-added: M1's re-show resets it) or below 0.98 opacity, except its
//               own 12 s timed end (a removal not followed by a re-add within 1 s, from its first fading frame);
//   overlap:    (1) the warning's layout box (what M1's hold rule measures, unclipped) over a protected control; (2) the
//               drawn part of any toast (its box clipped to the list's scroll box) over a protected control; (3) a
//               protected control's centre hit-testing as a toast. Protected = M1's set on Today:
//               `[data-toast-above] :is(button, a[href], [role="button"], input, textarea, select)`.
// One run per configuration (the first "during" wheel run) is recorded as a video (Playwright recordVideo, webm).
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync, renameSync, rmSync } from 'node:fs';
const [,, base, tag, out, filter = '', runsArg = '20', clipArg = '1'] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WARN = 'toast-kettle:save-failed';
const CONFIGS = [[375, 667, 'light'], [375, 667, 'dark'], [844, 390, 'light']];
const TIMINGS = [
  ...[3600, 4200, 4800].map((d) => ({ cls: 'before', d, full: true })),
  ...[1000, 1600, 2200, 2800].map((d) => ({ cls: 'during', d, full: true })),
  ...[300, 600, 900].map((d) => ({ cls: 'after', d, full: false })),
];
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const summary = {};
for (const [W, H, theme] of CONFIGS) {
  const cfg = `${W}x${H}@200 ${theme}`;
  if (filter && !cfg.match(new RegExp(filter))) continue;
  summary[cfg] = { runs: 0, fails: 0, hide: 0, reset: 0, overlapBox: 0, overlapDrawn: 0, hitFail: 0, classes: {} };
  let clipped = clipArg !== '1';
  for (let ii = 0; ii < +runsArg; ii++) {
    const i = process.env.IDX ? +process.env.IDX.split(',')[ii] : ii; // L1 ADAPTATION: IDX selects which of repro6's run indices (timing x input) to run
    const how = i % 2 ? 'touch' : 'wheel';
    const T = TIMINGS[Math.floor(i / 2) % TIMINGS.length];
    const video = !clipped && how === 'wheel' && T.cls === 'during';
    if (video) clipped = true;
    const label = `${tag} ${cfg} ${how} ${T.cls} d=${T.d} #${i}`;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme, acceptDownloads: true, ...(video ? { recordVideo: { dir: `${out}/video-tmp`, size: { width: W, height: H } } } : {}) });
    await ctx.addInitScript(() => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
    await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
    const p = await ctx.newPage();
    const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    let line;
    try {
      const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
      await p.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`); await ready();
      await p.evaluate(() => window.__kettle.seed('newbie')); await p.reload(); await ready();
      await p.evaluate(() => document.fonts.ready);
      await p.evaluate(async () => { const { leavesForLevel, levelFromLeaves } = await import('/src/progress/levels.ts'); const L = levelFromLeaves(window.__kettle.progress.getState().leaves).level; window.__kettle.progress.setState({ leaves: leavesForLevel(L + 1) - 1 }); });
      const quota = await p.evaluate(() => { let c = 'x'.repeat(1 << 20), k = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${k++}`, c); } catch { c = c.slice(0, c.length / 2); } } try { localStorage.setItem('probe', 'x'.repeat(64)); return 'no error'; } catch (e) { return e.name; } });
      await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
      await p.waitForFunction(() => location.hash === '#/focus'); await sleep(2500);
      await p.evaluate(() => window.__kettle.ff(12 * 60_000 + 5_000)); await sleep(500);
      // Recorder: every frame, from before End.
      await p.evaluate((WARN) => {
        const R = (window.__rec = { frames: [], ev: [], t0: performance.now(), stop: false });
        const t = () => Math.round(performance.now() - R.t0);
        new MutationObserver((ms) => { for (const m of ms) { for (const x of m.addedNodes) if (x.tagName === 'LI') R.ev.push([t(), '+', x.id]); for (const x of m.removedNodes) if (x.tagName === 'LI') R.ev.push([t(), '-', x.id]); } }).observe(document.body, { childList: true, subtree: true });
        const inter = (a, c) => a.right > c.left + 0.5 && a.left < c.right - 0.5 && a.bottom > c.top + 0.5 && a.top < c.bottom - 0.5;
        const f = () => {
          if (R.stop) return;
          const list = document.querySelector('[aria-label="Notifications"] ol');
          const region = list?.parentElement?.parentElement?.getBoundingClientRect();
          const lis = list ? [...list.querySelectorAll(':scope > li')] : [];
          const w = document.getElementById(WARN);
          let op = 0; for (let e = w, o = 1; e && e !== document.documentElement; e = e.parentElement) op = o *= +getComputedStyle(e).opacity;
          const wr = w?.getBoundingClientRect();
          const ctrls = [...document.querySelectorAll('[data-toast-above] :is(button, a[href], [role="button"], input, textarea, select)')].filter((c) => !list?.contains(c)).map((c) => [c, c.getBoundingClientRect()]).filter(([, r]) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight);
          // the list's scroll box (padding box) on screen: what a toast inside it can be drawn in
          const sp = list ? (() => { const r = list.getBoundingClientRect(); return { left: r.left + list.clientLeft, top: r.top + list.clientTop, right: r.left + list.clientLeft + list.clientWidth, bottom: r.top + list.clientTop + list.clientHeight }; })() : null;
          let boxOver = 0, drawnOver = 0, hitFail = 0;
          if (wr && ctrls.some(([, r]) => inter(wr, r))) boxOver = 1;
          for (const li of lis) {
            const r = li.getBoundingClientRect();
            const d = sp ? { left: Math.max(r.left, sp.left), top: Math.max(r.top, sp.top), right: Math.min(r.right, sp.right), bottom: Math.min(r.bottom, sp.bottom) } : r;
            if (d.right > d.left && d.bottom > d.top && ctrls.some(([, c]) => inter(d, c))) drawnOver = 1;
          }
          for (const [c, r] of ctrls) { const x = (r.left + r.right) / 2, y = (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2; const hit = document.elementFromPoint(x, y); if (hit && hit.closest('[aria-label="Notifications"]')) hitFail = 1; }
          R.frames.push([t(), lis.length, w ? +op.toFixed(3) : 0, wr ? Math.round(wr.top) : null, wr ? Math.round(wr.bottom) : null, region ? Math.round(region.bottom) : null, list ? Math.round(list.scrollTop) : null, w ? Math.round(w.scrollTop) : null, boxOver, drawnOver, hitFail, ctrls.length ? Math.round(Math.min(...ctrls.map(([, r]) => r.top))) : null]);
          requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }, WARN);
      await p.evaluate(() => window.__kettle.timer.getState().end('user'));
      await p.waitForFunction(() => location.hash === '#/' || location.hash === '');
      await p.waitForSelector(`[id="${WARN}"]`, { timeout: 8000 });
      const tWarn = await p.evaluate(() => Math.round(performance.now() - window.__rec.t0));
      const startN = await p.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').length);
      const st = () => p.evaluate((WARN) => {
        const w = document.getElementById(WARN); const list = document.querySelector('[aria-label="Notifications"] ol');
        const r = w?.getBoundingClientRect(); const lr = list.getBoundingClientRect();
        const x = r ? (r.left + r.right) / 2 : (lr.left + lr.right) / 2;
        const on = (y) => !!document.elementFromPoint(x, y)?.closest('[aria-label="Notifications"] li');
        const vb = Math.min(lr.bottom, innerHeight), vt = Math.max(0, lr.top);
        let low = vb - Math.min(20, (vb - vt) / 3); while (low > vt && !on(low)) low -= 3;
        let high = vt + Math.min(20, (vb - vt) / 3); while (high < vb && !on(high)) high += 3;
        return { x, wtop: r ? Math.max(0, r.top) : 0, wbottom: r ? r.bottom : 0, wst: w ? w.scrollTop : 0, wmax: w ? w.scrollHeight - w.clientHeight : 0, lst: list.scrollTop, low, high, n: list.children.length };
      }, WARN);
      const cdp = how === 'touch' ? await ctx.newCDPSession(p) : null;
      const inputs = [];
      const step = async (x, y, dy) => {
        x = Math.round(x); y = Math.round(Math.min(Math.max(y, 4), H - 4));
        inputs.push(await p.evaluate(() => Math.round(performance.now() - window.__rec.t0)));
        if (!cdp) { await p.mouse.move(x, y); await p.mouse.wheel(0, dy); }
        else { const dir = dy > 0 ? -1 : 1; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); for (let k = 1; k <= 3; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + dir * k * 8 }] }); await sleep(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
        await sleep(how === 'wheel' ? 150 : 120);
      };
      const same = (a, c) => Math.abs(a.wst - c.wst) < 0.5 && Math.abs(a.lst - c.lst) < 0.5;
      // wait until d ms after the warning appeared
      const now0 = await p.evaluate(() => Math.round(performance.now() - window.__rec.t0));
      await sleep(Math.max(0, T.d - (now0 - tWarn)));
      const dy = how === 'wheel' ? 20 : 24;
      // down: the warning's own message first (where it scrolls), then on through the stack
      for (let k = 0, still = 0; k < (T.full ? 30 : 4) && still < 2; k++) {
        const a = await st();
        const onWarn = a.wst < a.wmax - 1 && a.wbottom - a.wtop >= 24;
        await step(a.x, onWarn ? a.wtop + Math.max(14, 0.4 * (a.wbottom - a.wtop)) : a.low, dy);
        const c = await st(); still = same(a, c) ? still + 1 : 0;
      }
      await sleep(300);
      for (let k = 0, still = 0; k < (T.full ? 30 : 4) && still < 2; k++) {
        const a = await st();
        await step(a.x, a.high, -dy);
        const c = await st(); still = same(a, c) ? still + 1 : 0;
      }
      const tLast = await p.evaluate(() => Math.round(performance.now() - window.__rec.t0));
      if (!cdp && T.cls === 'after' && T.d !== 600) await p.mouse.move(W - 4, 4); // the pointer leaves the stack
      await sleep(2200);
      const R = await p.evaluate(() => { window.__rec.stop = true; return { frames: window.__rec.frames, ev: window.__rec.ev }; });
      // judged window: from the first frame the warning is at full opacity to the end, or to its own timed end
      const tFull = R.frames.find((f) => f[0] >= tWarn && f[2] >= 0.98)?.[0] ?? tWarn;
      let tEnd = Infinity;
      const warnEv = R.ev.filter((e) => e[2] === WARN);
      let resets = 0, removals = 0;
      for (const e of warnEv) if (e[1] === '-' && e[0] > tWarn) {
        removals++;
        const back = warnEv.some((x) => x[1] === '+' && x[0] > e[0] && x[0] - e[0] < 1000);
        if (back) resets++;
        else { const win = R.frames.filter((f) => f[0] >= e[0] - 700 && f[0] < e[0]); const first = win.find((f) => f[2] < 0.98); tEnd = Math.min(tEnd, first ? first[0] - 1 : e[0]); }
      }
      const judged = R.frames.filter((f) => f[0] >= tFull && f[0] <= tEnd);
      const faded = judged.filter((f) => f[2] < 0.98).length;
      const hides = resets + (faded ? 1 : 0);
      const boxOver = judged.filter((f) => f[8]).length;
      const drawnOver = R.frames.filter((f) => f[0] >= tFull && f[9]).length;
      const hitFail = R.frames.filter((f) => f[0] >= tFull && f[10]).length;
      const below = judged.filter((f) => f[4] != null && f[5] != null && f[4] > f[5] + 0.5).length;
      const olderGone = R.ev.filter((e) => e[1] === '-' && e[2] !== WARN && e[0] > tWarn).map((e) => e[0]);
      const g0 = inputs[0], g1 = tLast;
      const where = olderGone.map((t) => (t < g0 ? 'before' : t <= g1 ? 'during' : 'after'));
      const bad = [];
      if (quota !== 'QuotaExceededError') bad.push(`quota ${quota}`);
      if (startN !== 3) bad.push(`expected 3 toasts, got ${startN}`);
      if (hides) bad.push(`hide/reset: ${resets} re-shown, ${faded} faded frames`);
      if (below) bad.push(`warning box below its room in ${below} frames`);
      if (boxOver) bad.push(`warning box over a protected control in ${boxOver} frames`);
      if (drawnOver) bad.push(`a toast drawn over a protected control in ${drawnOver} frames`);
      if (hitFail) bad.push(`a protected control's centre hit-testing as a toast in ${hitFail} frames`);
      if (R.frames[R.frames.length - 1][0] - tLast < 2000) bad.push('recorded < 2 s after the last input');
      if (errors.length) bad.push(`page errors ${errors.length}`);
      const s = summary[cfg];
      s.runs++; if (bad.length) s.fails++; s.hide += resets + (faded ? 1 : 0); s.reset += resets; s.overlapBox += boxOver ? 1 : 0; s.overlapDrawn += drawnOver ? 1 : 0; s.hitFail += hitFail ? 1 : 0;
      for (const x of where) s.classes[x] = (s.classes[x] ?? 0) + 1;
      line = `${label}: ${bad.length ? 'FAIL ' + bad.join('; ') : 'OK'} | ${judged.length} judged frames${tEnd < Infinity ? ` (to the warning's own timed end at ${tEnd})` : ''}; gesture ${g0}–${g1} ms (${inputs.length} inputs), warning at ${tWarn}; older toasts expired at ${JSON.stringify(olderGone)} = ${JSON.stringify(where)} the gesture; list offsets ${Math.min(...judged.map((f) => f[6] ?? 0))}..${Math.max(...judged.map((f) => f[6] ?? 0))}; max (warning bottom − room bottom) ${Math.max(...judged.map((f) => (f[4] ?? -1e9) - (f[5] ?? 0)))} px; removals ${removals}${video ? ' | VIDEO' : ''}`;
      appendFileSync(`${out}/repro6-${tag}.jsonl`, JSON.stringify({ label, cfg, how, timing: T, bad, ev: R.ev, inputs, tWarn, tLast, frames: R.frames }) + '\n');
    } catch (e) { summary[cfg].runs++; summary[cfg].fails++; line = `${label}: ERROR ${String(e.message).split('\n')[0]}`; }
    console.log(line);
    const vid = video ? p.video() : null;
    await ctx.close();
    if (vid) { const src = await vid.path(); renameSync(src, `${out}/clip-${tag}-${W}x${H}-${theme}-${how}-${T.cls}-d${T.d}.webm`); rmSync(`${out}/video-tmp`, { recursive: true, force: true }); }
  }
}
for (const [k, s] of Object.entries(summary)) console.log(`SUMMARY ${tag} ${k}: runs ${s.runs}, failures ${s.fails}; hide/reset events ${s.hide} (re-shows ${s.reset}); runs with the warning box over a protected control ${s.overlapBox}, with a drawn toast over one ${s.overlapDrawn}, with a control's centre hit-testing as a toast ${s.hitFail}; older-toast expiries relative to the gesture ${JSON.stringify(s.classes)}`);
await b.close();
