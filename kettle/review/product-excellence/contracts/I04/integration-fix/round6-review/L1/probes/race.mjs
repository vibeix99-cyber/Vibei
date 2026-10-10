// Checker r5: isolate the "older toast leaves after the list was scrolled back down" path seen in readscroll.mjs.
// Real wheel/touch: read the warning down, scroll up to the oldest toast, rest 2 s, scroll back down to rest (20 px
// steps over the warning's lower part); then the middle older toast's timer runs out (its pointerleave, as when the
// pointer moved off it). Every frame recorded with the warning's transform.
// node race.mjs <base> <label> <outdir> <WxH> <themes> <text> <how=wheel|touch> [reps=3] [release=t2|t1|both]
import { mkdirSync, appendFileSync } from 'node:fs';
import { launch, context, sleep } from './lib.mjs';
const [base, label, out, cfg, themeArg, textArg, how, repArg, relArg] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const [W, H] = cfg.split('x').map(Number);
const text = +textArg;
const WARN = 'toast-kettle:save-failed';
const release = relArg ?? 't2';
const browser = await launch();
let fails = 0, runs = 0;
for (const theme of themeArg.split(','))
  for (let rep = 0; rep < +(repArg ?? 3); rep++) {
    const tag = `${label} ${W}x${H} ${theme} t${text} ${how} release=${release} #${rep}`;
    const ctx = await context(browser, { w: W, h: H, theme, text });
    await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
    const page = await ctx.newPage();
    let line;
    try {
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
      await page.evaluate(() => window.__kettle.timer.getState().end('user'));
      await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
      await page.waitForSelector(`[id="${WARN}"]`, { timeout: 8000 });
      await sleep(1600);
      if (process.env.CSS) await page.addStyleTag({ content: process.env.CSS });
      await page.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').forEach((li) => li.dispatchEvent(new PointerEvent('pointerenter'))));
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
          R.frames.push([t(), list ? list.children.length : 0, w ? +op.toFixed(2) : 0, r ? Math.round(r.top) : null, r ? Math.round(r.bottom) : null, d ? Math.round(d.top) : null, lr ? Math.round(lr.bottom) : null, list ? +list.scrollTop.toFixed(1) : null, w ? Math.round(w.scrollTop) : null, w ? getComputedStyle(w).transform : null]);
          requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }, WARN);
      const st = () => page.evaluate((WARN) => { const l = document.querySelector('[aria-label="Notifications"] ol'); const w = document.getElementById(WARN); const r = w?.getBoundingClientRect(); const lr = l.getBoundingClientRect(); return { x: r ? (r.left + r.right) / 2 : 180, top: r ? Math.max(0, r.top) : 0, bottom: r ? r.bottom : 300, wst: w?.scrollTop ?? 0, wmax: w ? w.scrollHeight - w.clientHeight : 0, lst: l.scrollTop, lmin: -(l.scrollHeight - l.clientHeight), lbottom: lr.bottom }; }, WARN);
      const cdp = how === 'touch' ? await ctx.newCDPSession(page) : null;
      const input = async (x, y, dy) => {
        x = Math.round(x); y = Math.round(y);
        if (!cdp) { await page.mouse.move(x, y); await page.mouse.wheel(0, dy); }
        else {
          const dir = dy > 0 ? -1 : 1;
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
          for (let i = 1; i <= 3; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + dir * i * 8 }] }); await sleep(16); }
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await page.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').forEach((li) => li.dispatchEvent(new PointerEvent('pointerenter'))));
        }
        await sleep(120);
      };
      let s = await st();
      for (let i = 0; i < 40 && s.wst < s.wmax - 1; i++) { await input(s.x, s.top + Math.max(14, 0.4 * (s.bottom - s.top)), 20); s = await st(); }
      for (let i = 0; i < 80; i++) { s = await st(); if (s.wst <= 0 && s.lst <= s.lmin + 1) break; await input(s.x, s.top + Math.max(14, 0.4 * (s.bottom - s.top)), -20); }
      await sleep(2300);
      const tE = await page.evaluate(() => Math.round(performance.now() - window.__rec.t0));
      if (process.env.EARLY) await page.evaluate((ids) => ids.forEach((id) => document.getElementById(id)?.dispatchEvent(new PointerEvent('pointerleave'))), release === 'both' ? ['toast-t1', 'toast-t2'] : [`toast-${release}`]);
      for (let i = 0; i < 80; i++) { s = await st(); if (s.lst >= -1) break; await input(s.x, s.lbottom - 30, 20); }
      const atRest = (await st()).lst;
      const tRel = process.env.EARLY ? tE : await page.evaluate(() => Math.round(performance.now() - window.__rec.t0));
      // the pointer moves off the older toast(s): their timers resume
      if (!process.env.EARLY) await page.evaluate((ids) => ids.forEach((id) => document.getElementById(id)?.dispatchEvent(new PointerEvent('pointerleave'))), release === 'both' ? ['toast-t1', 'toast-t2'] : [`toast-${release}`]);
      if (process.env.POST) {
        // once the older toast is gone, the person goes on scrolling down (one more step)
        await page.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 2, null, { timeout: 8000 });
        await sleep(+(process.env.POST));
        const s2 = await st();
        await input(s2.x, s2.lbottom - 30, 20);
        if (process.env.SHOT) for (let k = 0; k < 4; k++) { const tt = await page.evaluate(() => Math.round(performance.now() - window.__rec.t0)); await page.screenshot({ path: `${out}/race-${label}-${W}x${H}-${theme}-${how}-${rep}-afterstep-${k}-t${tt}.png` }); }
      }
      await sleep(4500);
      const R = await page.evaluate(() => { window.__rec.stop = true; return { frames: window.__rec.frames, ev: window.__rec.ev }; });
      const after = R.frames.filter((f) => f[0] >= tRel);
      const gone = after.filter((f) => f[2] < 0.98);
      const below = after.filter((f) => f[4] != null && f[4] > Math.min(f[5], f[6]) + 0.5);
      const bad = [];
      if (gone.length) bad.push(`warning gone/faded in ${gone.length} frames`);
      if (below.length) bad.push(`box below the room/over the dock in ${below.length} frames (max +${Math.max(...below.map((f) => f[4] - Math.min(f[5], f[6])))} px)`);
      runs++;
      if (bad.length) fails++;
      line = `${tag}: ${bad.length ? 'FAIL ' + bad.join('; ') : 'OK'} | rest scrollTop ${atRest} | events after release ${JSON.stringify(R.ev.filter((e) => e[0] >= tRel))}`;
      if (bad.length) {
        const t0 = (below[0] ?? gone[0])[0];
        line += '\n  frames [t,n,op,top,bottom,dockTop,roomBottom,listST,warnST,transform]: ' + JSON.stringify(R.frames.filter((f) => f[0] >= t0 - 200 && f[0] <= t0 + 400));
      }
      appendFileSync(`${out}/race-${label}.jsonl`, JSON.stringify({ tag, bad, ev: R.ev, frames: R.frames, tRel, atRest }) + '\n');
    } catch (e) {
      line = `${tag}: ERROR ${String(e.message).split('\n')[0]}`;
    }
    console.log(line);
    await ctx.close();
  }
await browser.close();
console.log(`${label}: ${fails} failures in ${runs} runs`);
