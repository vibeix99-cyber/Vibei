// L3 3e: delayed re-check after "Back to your brew" (375x667): warning over readout/controls until the next 250 ms tick.
// node back.mjs --rev=R6|INT --runs=8 --text=100 [--video]
import { REV, launch, newCtx, openNewbie, fillStorage, sleep, args, logger, OUT, recInstall, recStart, recStop, recSummary, stamp, startBtn, waitWarning, WARN } from './lib.mjs';
import { mkdirSync, writeFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const runs = +(a.runs ?? 8), text = +(a.text ?? 100), w = +(a.w ?? 375), h = +(a.h ?? 667);
const dir = `${OUT}/3e`; mkdirSync(dir, { recursive: true });
const tag = `${rev.name}-${w}x${h}-t${text}`;
const log = logger(`${dir}/back-${tag}.log`);
log(`RUN 3e ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} viewport=${w}x${h} text=${text}% runs=${runs} start=${stamp()}`);
const b = await launch();
const all = [];
for (let run = 1; run <= runs; run++) {
  const video = a.video && run === 1 ? `${dir}/vtmp-${tag}` : undefined;
  const ctx = await newCtx(b, { w, h, text, video });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await openNewbie(p, rev.dev, {});
  await fillStorage(p);
  await recInstall(p);
  await startBtn(p).click();
  await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
  const onBrewWarning = await p.evaluate((W) => !!document.getElementById(W), WARN);
  await p.goBack(); // a real browser Back from the running brew -> Today
  await p.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 8000 });
  const shown = await waitWarning(p, 8000);
  await sleep(1000);
  const warnOnToday = await p.evaluate((W) => { const e = document.getElementById(W); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }, WARN);
  await recStart(p);
  const tc = await p.evaluate(() => performance.now() - window.__rec.t0);
  await p.getByRole('button', { name: 'Back to your brew' }).click();
  await sleep(2200);
  const frames = await recStop(p);
  const sum = recSummary(frames);
  const post = frames.filter((f) => f[0] >= tc);
  const firstGone = post.find((f, i) => i > 0 && f[1] == null)?.[0] ?? null;
  const warnAfter = await p.evaluate((W) => !!document.getElementById(W), WARN);
  const r = { run, warningHeldOnBrewBeforeBack: onBrewWarning, warningShownOnToday: shown, warnOnTodayTopBottom: warnOnToday, clickAtMs: Math.round(tc), hitMs: sum.hitMs, segments: sum.segments.map((s) => ({ t0: s.t0, rel: s.t0 - Math.round(tc), ms: s.ms, maxOp: s.maxOp, hits: s.hits })), warningGoneAtMsAfterClick: firstGone != null ? firstGone - Math.round(tc) : null, warningUpAfter2s: warnAfter, maxFrameGapMs: sum.maxFrameGap, errs };
  all.push(r);
  log(`run ${run}: ${JSON.stringify(r)}`);
  if (run === 1) await p.screenshot({ path: `${dir}/back-${tag}-run1-end.png` });
  await ctx.close();
}
log(`SUMMARY ${tag}: runs with overlap ${all.filter((r) => r.hitMs > 0).length}/${runs}; hit ms per run ${JSON.stringify(all.map((r) => r.hitMs))}; warning-gone (ms after click) ${JSON.stringify(all.map((r) => r.warningGoneAtMsAfterClick))}`);
writeFileSync(`${dir}/back-${tag}.json`, JSON.stringify({ tag, url: rev.dev, rev: rev.name, commit: rev.commit, all }, null, 1));
await b.close();
if (a.video) { const d = `${dir}/vtmp-${tag}`; const f = readdirSync(d).find((x) => x.endsWith('.webm')); if (f) renameSync(`${d}/${f}`, `${dir}/video-3e-${tag}.webm`); rmSync(d, { recursive: true, force: true }); }
log(`END ${stamp()}`);
