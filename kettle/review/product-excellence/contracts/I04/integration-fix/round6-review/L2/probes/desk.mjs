// L2 check 3: 1440x900 (desktop) toast behaviour, per frame, real timers, no input after the setup:
// position of the warning / the toasts over time, overlap with the docked start, how long the lift takes.
//   node desk.mjs <base> <rev> <outdir> <themes> <texts> <flows alone,stack,plain3> [video=1] [reps=1] [WxH=1440x900]
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { launch, newCtx, openNewbie, fillQuota, levelUpSetup, RECORDER, F, sleep, WARN } from './lib.mjs';

const [base, rev, out, themeArg, textArg, flowArg, videoArg = '1', repsArg = '1', cfg = '1440x900'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const [W, H] = cfg.split('x').map(Number);
const browser = await launch();
let runs = 0, fails = 0;
const hov = (a, b) => a.right > b[0] + 0.5 && a.left < b[1] - 0.5; // helper unused

for (const theme of themeArg.split(','))
  for (const text of textArg.split(',').map(Number))
    for (const flow of flowArg.split(','))
      for (let rep = 1; rep <= +repsArg; rep++) {
        const tag = `${rev}-${W}x${H}-${theme}-t${text}-${flow}${+repsArg > 1 ? `-r${rep}` : ''}`;
        const vdir = `${out}/.vid-${tag}`;
        const ctx = await newCtx(browser, { w: W, h: H, theme, text, video: videoArg === '1' ? vdir : undefined });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        const info = { tag, base, rev, W, H, theme, text, flow };
        const notes = [];
        try {
          await openNewbie(page, base, theme);
          if (flow === 'stack') await levelUpSetup(page);
          if (flow === 'alone') info.quota = await fillQuota(page);
          await page.evaluate(RECORDER, WARN);
          await sleep(400);
          const tTrigger = await page.evaluate(() => performance.now() - window.__rec.t0);
          if (flow === 'alone') {
            await page.evaluate(() => {
              const k = window.__kettle, led = k.progress.getState().ledger;
              k.progress.setState({ ledger: [...led, { ...led[led.length - 1], id: 'probe-'.padEnd(400, 'x'), amount: 0 }] });
              k.progress.setState({ ledger: led });
            });
          } else if (flow === 'stack') {
            await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
            await page.waitForFunction(() => location.hash === '#/focus');
            await sleep(2500);
            info.quota = await fillQuota(page); // storage fills once the brew runs: the warning belongs to the End
            await page.evaluate(() => window.__kettle.ff(12 * 60_000 + 5_000));
            await sleep(500);
            info.tEnd = await page.evaluate(() => performance.now() - window.__rec.t0);
            await page.evaluate(() => window.__kettle.timer.getState().end('user'));
            await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
          } else {
            // three ordinary toasts on Today (the app's own toast(), default 3.2 s timers)
            await page.evaluate(async () => {
              const { toast } = await import('/src/ui/Toast.tsx');
              toast('Recipe done: Take 2 full tea breaks · +15 leaves', { tone: 'success' });
              toast('Saved 12 minutes of focus', { tone: 'info' });
              toast('Cozy level 5!', { tone: 'success' });
            });
          }
          const tRaised = await page.evaluate(() => performance.now() - window.__rec.t0);
          if (flow === 'plain3') await sleep(4500);
          else {
            await page.waitForSelector(`[id="${WARN}"]`, { timeout: 12_000 });
            await sleep(500);
            await page.screenshot({ path: `${out}/${tag}-t500.png`, scale: 'css' });
            await sleep(1500);
            await page.screenshot({ path: `${out}/${tag}-t2000.png`, scale: 'css' });
            await sleep(11_500); // until its own 12 s timer ends (pointer not on it)
          }
          const rec = await page.evaluate(() => { window.__rec.stop = true; const R = window.__rec; return { frames: R.frames, ev: R.ev, total: R.total }; });
          writeFileSync(`${out}/${tag}.frames.json`, JSON.stringify({ ev: rec.ev, tRaised, frames: rec.frames }));
          const fr = rec.frames;
          const t0trig = info.tEnd ?? tTrigger;
          const adds = rec.ev.filter((e) => e[1] === '+' && e[0] >= t0trig - 1);
          const tAdd = adds.length ? adds[0][0] : null;
          const sty = rec.ev.filter((e) => e[1] === 's' && tAdd != null && e[0] >= tAdd - 1);
          info.tAdd = tAdd;
          info.liftStyleEvents = sty.slice(0, 6).map((e) => [Math.round(e[0] - tAdd), e[2]]);
          info.liftLatencyMs = sty.length ? Math.round(sty[0][0] - tAdd) : null;
          const gaps = []; for (let i = 1; i < fr.length; i++) if (tAdd != null && fr[i][0] >= tAdd && fr[i][0] <= tAdd + 2500) gaps.push(fr[i][0] - fr[i - 1][0]);
          info.maxFrameGapMs = gaps.length ? Math.round(Math.max(...gaps)) : null;
          info.framesIn2500ms = gaps.length + 1;
          // --- the toast stack (any toast), the warning, the docked start --------------------------------------
          const withToasts = fr.filter((f) => f[F.n] > 0);
          info.frames = fr.length;
          info.firstToastT = withToasts.length ? withToasts[0][0] : null;
          const t1 = info.firstToastT;
          const bottomOf = (f) => (f[F.toasts].length ? Math.max(...f[F.toasts].map((x) => x[2])) : null);
          const topOf = (f) => (f[F.toasts].length ? Math.min(...f[F.toasts].map((x) => x[1])) : null);
          // sample the stack's bottom edge and the dock's top at fixed delays after the first toast frame
          const at = (dt) => { const f = withToasts.find((x) => x[0] >= t1 + dt); return f ? { t: Math.round(f[0] - t1), n: f[F.n], stackTop: topOf(f), stackBottom: bottomOf(f), dockTop: f[F.dTop], dockBottom: f[F.dBot], warnTop: f[F.top], warnBottom: f[F.bot], op: f[F.toasts].map((x) => x[3]), regionBottom: f[F.rBot] } : null; };
          info.timeline = Object.fromEntries([0, 100, 250, 500, 1000, 2000, 4000].map((dt) => [dt, at(dt)]));
          // settle time of the stack's lowest edge: first time after which it stays within 0.5 px of its final value for >= 500 ms
          const series = withToasts.filter((f) => f[F.toasts].some((x) => x[3] >= 0.5)).map((f) => [f[0], bottomOf(f)]);
          const lateT = (series.at(-1)?.[0] ?? 0) - 700; // use the plateau before the last 700 ms (leave animation)
          const plateau = series.filter((s2) => s2[0] <= lateT);
          const rest = plateau.length ? plateau.at(-1)[1] : null;
          info.restBottom = rest;
          let settleT = null;
          for (let i = 0; i < plateau.length && settleT == null; i++) {
            const stay = plateau.slice(i).every((s2) => Math.abs(s2[1] - rest) <= 0.5);
            if (stay) settleT = plateau[i][0] - t1;
          }
          info.stackSettleMs = settleT;
          info.stackTravelPx = plateau.length ? Math.max(...plateau.map((s2) => Math.abs(s2[1] - rest))) : null;
          // warning
          const wf = fr.filter((f) => f[F.top] != null);
          if (wf.length) {
            const tW = wf[0][0];
            info.warnFirstT = tW; info.warnFirstFromRaise = Math.round(tW - tRaised);
            const wrest = wf.filter((f) => f[F.op] >= 0.98).slice(-1)[0]?.[F.bot];
            const wp = wf.filter((f) => f[F.op] >= 0.05);
            let wset = null;
            const plateauW = wf.filter((f) => f[0] <= wf.at(-1)[0] - 400);
            for (let i = 0; i < plateauW.length && wset == null; i++) if (plateauW.slice(i).every((f) => Math.abs(f[F.bot] - plateauW.at(-1)[F.bot]) <= 0.5)) wset = plateauW[i][0] - tW;
            info.warnSettleMs = wset;
            info.warnTravelPx = plateauW.length ? Math.max(...plateauW.map((f) => Math.abs(f[F.bot] - plateauW.at(-1)[F.bot]))) : null;
            info.warnRestBox = [plateauW.at(-1)?.[F.top], plateauW.at(-1)?.[F.bot]];
            info.warnFirstFrame = { top: wf[0][F.top], bottom: wf[0][F.bot], op: wf[0][F.op], dockTop: wf[0][F.dTop] };
            const adds = rec.ev.filter((e) => e[2] === WARN && e[1] === '+'), rems = rec.ev.filter((e) => e[2] === WARN && e[1] === '-');
            info.warnAdds = adds.map((e) => e[0]); info.warnRemoves = rems.map((e) => e[0]);
            info.warnLifetimes = adds.map((a, i) => (rems[i] ? Math.round(rems[i][0] - a[0]) : null));
            if (adds.length > 1) notes.push(`warning taken away and re-shown ${adds.length - 1}x (adds ${JSON.stringify(adds.map((e) => e[0]))}, removes ${JSON.stringify(rems.map((e) => e[0]))})`);
            if (rems.length && rems[0][0] - adds[0][0] < 11_500) notes.push(`first warning left after ${Math.round(rems[0][0] - adds[0][0])} ms (< 12 s own timer)`);
          }
          // overlap of ANY toast with the docked start (vertical overlap with horizontal overlap), per frame
          const dockOverlap = [];
          for (const f of fr) {
            if (f[F.dTop] == null) continue;
            for (const x of f[F.toasts]) {
              const [id, top, bot, op, left, right] = x;
              if (!(right > f[F.dL] + 0.5 && left < f[F.dR] - 0.5)) continue;
              const ov = Math.min(bot, f[F.dBot]) - Math.max(top, f[F.dTop]);
              if (ov > 0.5) dockOverlap.push([f[0], id, +ov.toFixed(1), op]);
            }
          }
          info.dockOverlapFrames = dockOverlap.length;
          info.dockOverlapMaxPx = dockOverlap.length ? Math.max(...dockOverlap.map((d) => d[2])) : 0;
          info.dockOverlapSpanMs = dockOverlap.length ? Math.round(dockOverlap.at(-1)[0] - dockOverlap[0][0]) : 0;
          info.dockOverlapFirstT = dockOverlap.length ? Math.round(dockOverlap[0][0] - (t1 ?? 0)) : null;
          info.dockOverlapSample = dockOverlap.slice(0, 6);
          info.dockOverlapMaxOpacity = dockOverlap.length ? Math.max(...dockOverlap.map((d) => d[3])) : 0;
          // overlap that persists after the stack has settled
          if (settleT != null) {
            const after = dockOverlap.filter((d) => d[0] >= t1 + settleT && d[3] >= 0.5);
            info.dockOverlapAfterSettleFrames = after.length;
            if (after.length) notes.push(`toast over the docked start AFTER settling in ${after.length} frames (max ${Math.max(...after.map((d) => d[2]))} px)`);
          }
          info.dockTopRange = [Math.min(...fr.filter((f) => f[F.dTop] != null).map((f) => f[F.dTop])), Math.max(...fr.filter((f) => f[F.dTop] != null).map((f) => f[F.dTop]))];
          info.toastTopMin = withToasts.length ? Math.min(...withToasts.map(topOf)) : null;
          info.offscreenFrames = withToasts.filter((f) => topOf(f) < -0.5 || bottomOf(f) > H + 0.5).length;
        } catch (e) {
          notes.push('ERROR ' + String(e.message).split('\n')[0]);
        }
        info.notes = notes; info.errors = errors;
        runs++; if (notes.length) fails++;
        appendFileSync(`${out}/${rev}-desk.jsonl`, JSON.stringify(info) + '\n');
        console.log(`${tag}: lift style applied +${info.liftLatencyMs} ms after the toast was added (${JSON.stringify(info.liftStyleEvents)}), frames in first 2.5 s ${info.framesIn2500ms}, max frame gap ${info.maxFrameGapMs} ms | first toast→settle ${info.stackSettleMs} ms (travel ${info.stackTravelPx}px, rest bottom ${info.restBottom}) | warn: raised+${info.warnFirstFromRaise}ms first box ${JSON.stringify(info.warnFirstFrame)} rest ${JSON.stringify(info.warnRestBox)} settle ${info.warnSettleMs} lifetimes ${JSON.stringify(info.warnLifetimes)} | dock ${JSON.stringify(info.dockTopRange)} overlap frames ${info.dockOverlapFrames} max ${info.dockOverlapMaxPx}px span ${info.dockOverlapSpanMs}ms first@+${info.dockOverlapFirstT} maxOp ${info.dockOverlapMaxOpacity} afterSettle ${info.dockOverlapAfterSettleFrames} | ${notes.join(' ; ')}`);
        const v = page.video();
        await ctx.close();
        if (v) { try { await v.saveAs(`${out}/${tag}.webm`); } catch (e) { console.log('video save failed', e.message); } try { const { rmSync } = await import('node:fs'); rmSync(vdir, { recursive: true, force: true }); } catch {} }
      }
await browser.close();
console.log(`${rev} desk ${themeArg} t${textArg} ${flowArg}: ${fails} runs with notes in ${runs}`);
