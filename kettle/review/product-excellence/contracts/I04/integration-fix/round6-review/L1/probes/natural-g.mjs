// L1 EXTRA-GESTURE probe (natural-g): natural-x's flow (End -> go to the oldest toast -> wait -> come back and a few notches more; real toast
// timers; NO synthetic events, nothing held) with the input primitive replaced by a gesture type M2 did not use. GESTURE env:
//   fling : CDP Input.dispatchTouchEvent fast swipe (7 moves x 22 px, 8 ms apart, touchEnd -> fling), then wait until the scroll settles
//   fine  : trackpad-like wheel, 24 events of 2-5 px (seeded) ~8 ms apart per stroke (page.mouse.wheel)
//   kbd   : keyboard only: Shift+Tab to the last tabbable (Save backup), then 3 x ArrowDown/ArrowUp per stroke
// Direction-aware (list column-reverse on R5, top-down on R6); the pointer/finger goes onto the toast with the most visible area in the list.
// node natural-g.mjs <base> <label> <outdir> <WxH> <theme> <text> <waits=...> [reps=1]
// Checker r5: fully natural real-input sequence, NO synthetic events at all. After End (storage full, level-up: three
// toasts), the person puts the pointer on the stack, wheels up to the oldest toast, waits WAIT ms, then wheels back
// down in 20 px notches (150 ms apart) and a few more. Toast timers run as in real use (paused only under the real
// pointer). Every frame recorded. node natural.mjs <base> <label> <outdir> <WxH> <theme> <text> <waits=0,300,...> [reps=1]
import { mkdirSync, appendFileSync } from 'node:fs';
import { launch, context, sleep } from './lib.mjs';
const [base, label, out, cfg, theme, textArg, waitArg, repArg] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const [W, H] = cfg.split('x').map(Number);
const GESTURE = process.env.GESTURE ?? 'fling';
const text = +textArg;
const WARN = 'toast-kettle:save-failed';
const browser = await launch();
let fails = 0, runs = 0;
for (const wait of waitArg.split(',').map(Number))
  for (let rep = 0; rep < +(repArg ?? 1); rep++) {
    const tag = `${label} ${W}x${H} ${theme} t${text} wait=${wait} #${rep}`;
    const ctx = await context(browser, { w: W, h: H, theme, text });
    await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
    const page = await ctx.newPage();
    const ready = () => page.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60_000 });
    await page.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
    await ready();
    await page.evaluate(() => window.__kettle.seed('newbie'));
    await page.reload();
    await ready();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      const { leavesForLevel, levelFromLeaves } = await import('/src/progress/levels.ts');
      const L = levelFromLeaves(window.__kettle.progress.getState().leaves).level;
      window.__kettle.progress.setState({ leaves: leavesForLevel(L + 1) - 1 });
    });
    await page.evaluate(() => { let c = 'x'.repeat(1 << 20), i = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${i++}`, c); } catch { c = c.slice(0, c.length / 2); } } });
    await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await page.waitForFunction(() => location.hash === '#/focus');
    await sleep(2500);
    await page.evaluate(() => window.__kettle.ff(12 * 60_000 + 5_000));
    await sleep(500);
    if (GESTURE === 'fine') await page.mouse.move(W / 2, Math.round(H * 0.25));
    if (process.env.CSS) await page.addStyleTag({ content: process.env.CSS });
    await page.evaluate((WARN) => {
      const R = (window.__rec = { frames: [], ev: [], t0: performance.now(), stop: false });
      const t = () => Math.round(performance.now() - R.t0);
      new MutationObserver((ms) => { for (const m of ms) { for (const n of m.addedNodes) if (n.tagName === 'LI') R.ev.push([t(), '+', n.id]); for (const n of m.removedNodes) if (n.tagName === 'LI') R.ev.push([t(), '-', n.id]); } }).observe(document.body, { childList: true, subtree: true });
      const f = () => {
        if (R.stop) return;
        const list = document.querySelector('[aria-label="Notifications"] ol');
        const w = document.getElementById(WARN);
        const d = document.querySelector('[data-toast-above]')?.getBoundingClientRect();
        const lr = list?.getBoundingClientRect();
        let op = 0;
        for (let e = w, o = 1; e && e !== document.documentElement; e = e.parentElement) op = o *= +getComputedStyle(e).opacity;
        const r = w?.getBoundingClientRect();
        R.frames.push([t(), list ? list.children.length : 0, w ? +op.toFixed(2) : 0, r ? Math.round(r.top) : null, r ? Math.round(r.bottom) : null, d ? Math.round(d.top) : null, lr ? Math.round(lr.bottom) : null, list ? +list.scrollTop.toFixed(1) : null]);
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }, WARN);
    await page.evaluate(() => window.__kettle.timer.getState().end('user'));
    await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
    await page.waitForSelector(`[id="${WARN}"]`, { timeout: 8000 });
    await sleep(500);
    const st = () => page.evaluate((WARN) => { const l = document.querySelector('[aria-label="Notifications"] ol'); const w = document.getElementById(WARN); const r = w?.getBoundingClientRect(); return { x: r ? (r.left + r.right) / 2 : 180, y: r ? Math.max(r.top, 0) + 40 : 60, lst: l.scrollTop, lmin: -(l.scrollHeight - l.clientHeight), lmax: l.scrollHeight - l.clientHeight, rev: getComputedStyle(l).flexDirection === 'column-reverse', wst: w?.scrollTop ?? 0, wmax: w ? w.scrollHeight - w.clientHeight : 0, tx: r ? (r.left + r.right) / 2 : 180, ty: (() => { const lr = l.getBoundingClientRect(); let best = null; for (const li of l.children) { const q = li.getBoundingClientRect(); const t = Math.max(q.top, lr.top, 0), bt = Math.min(q.bottom, lr.bottom, innerHeight); if (bt - t > 8 && (!best || bt - t > best.h)) best = { h: bt - t, y: (t + bt) / 2 }; } return best ? best.y : 60; })() }; }, WARN);
    const cdp = GESTURE === 'fling' ? await ctx.newCDPSession(page) : null;
    let seed = 4242 + rep * 7919 + wait; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    let kbdReady = false;
    // one stroke; dir +1 = scroll down (content moves up), -1 = scroll up
    const stroke = async (dir) => {
      const q = await st();
      const x = Math.round(q.tx), y = Math.round(Math.min(Math.max(q.ty, 4), H - 4));
      if (GESTURE === 'fine') {
        await page.mouse.move(x, y);
        for (let k = 0; k < 24; k++) { await page.mouse.wheel(0, dir * (2 + Math.round(rnd() * 3))); await sleep(8); }
        await sleep(60);
      } else if (GESTURE === 'fling') {
        const fd = dir > 0 ? -1 : 1; // finger up = scroll down
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let k = 1; k <= 7; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.min(Math.max(y + fd * k * 22, 2), H - 2) }] }); await sleep(8); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        let prev = null;
        for (let k = 0; k < 10; k++) { await sleep(100); const cur = await page.evaluate((WARN) => { const l = document.querySelector('[aria-label="Notifications"] ol'); const w = document.getElementById(WARN); return `${l.scrollTop.toFixed(1)}/${w ? w.scrollTop.toFixed(1) : 0}`; }, WARN); if (cur === prev) break; prev = cur; }
      } else {
        for (let k = 0; k < 8 && !kbdReady; k++) { await page.keyboard.press('Shift+Tab'); await sleep(60); kbdReady = await page.evaluate(() => !!document.activeElement?.closest?.('[aria-label="Notifications"]')); }
        if (!kbdReady) throw new Error('keyboard focus never reached the toast list');
        for (let k = 0; k < 3; k++) { await page.keyboard.press(dir > 0 ? 'ArrowDown' : 'ArrowUp'); await sleep(40); }
        await sleep(150);
      }
    };
    let s = await st();
    const toOlder = s.rev ? -1 : 1;
    for (let i = 0; i < 14; i++) { s = await st(); if (s.rev ? (s.wst <= 0 && s.lst <= s.lmin + 1) : (s.lst >= s.lmax - 1)) break; await stroke(toOlder); }
    const tTop = await page.evaluate(() => Math.round(performance.now() - window.__rec.t0));
    await sleep(wait);
    const tDown = await page.evaluate(() => Math.round(performance.now() - window.__rec.t0));
    let extra = 0;
    // (guard: on R5 a further 'down' stroke once the warning's own message is at its end would chain to the PAGE behind and lift the dock - a different mechanism)
    for (let i = 0; i < 20 && extra < 4; i++) { s = await st(); const atRest = s.rev ? s.lst >= -1 : s.lst <= 1; if (atRest && s.rev && s.wst >= s.wmax - 1) break; if (atRest) extra++; await stroke(-toOlder); }
    await sleep(2500);
    const R = await page.evaluate(() => { window.__rec.stop = true; return { frames: window.__rec.frames, ev: window.__rec.ev }; });
    const warnIn = R.ev.find((e) => e[2] === WARN && e[1] === '+')?.[0] ?? 0;
    const after = R.frames.filter((f) => f[0] >= warnIn + 1200);
    const gone = after.filter((f) => f[2] < 0.98);
    const below = after.filter((f) => f[4] != null && f[4] > Math.min(f[5], f[6]) + 0.5);
    const bad = [];
    if (gone.length) bad.push(`warning taken away / faded in ${gone.length} frames`);
    if (below.length) bad.push(`drawn below its room in ${below.length} frames (max +${Math.max(...below.map((f) => f[4] - f[6]))} px; over the docked start by up to ${Math.max(0, ...below.map((f) => f[4] - f[5]))} px)`);
    runs++;
    if (bad.length) fails++;
    console.log(`${tag}: ${bad.length ? 'FAIL ' + bad.join('; ') : 'OK'} | top at ${tTop} ms, down from ${tDown} | toasts ${JSON.stringify(R.ev)}`);
    appendFileSync(`${out}/natural-g-${label}.jsonl`, JSON.stringify({ tag, bad, ev: R.ev, frames: R.frames, tTop, tDown }) + '\n');
    if (bad.length) await page.screenshot({ path: `${out}/natural-g-${label}-${W}x${H}-${theme}-w${wait}-${rep}.png` });
    await ctx.close();
  }
await browser.close();
console.log(`${label}: ${fails} failures in ${runs} runs`);
