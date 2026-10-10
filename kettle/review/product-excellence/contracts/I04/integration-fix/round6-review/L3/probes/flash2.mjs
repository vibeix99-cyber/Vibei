// L3 3d: flash of the 200%-text warning over the countdown at brew start (375x667) or Resume (1440x900).
// node flash.mjs --rev=R6|INT --scenario=start|resume --runs=5 [--video] [--text=200]
import { REV, launch, newCtx, openNewbie, fillStorage, sleep, args, logger, OUT, recInstall2 as recInstall, recStart, recStop, recSummary, stamp, todayAfterEnd, startBtn, waitWarning, WARN } from './lib.mjs';
import { mkdirSync, writeFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const scen = a.scenario ?? 'start';
const runs = +(a.runs ?? 5), text = +(a.text ?? 200);
const [w, h] = a.w && a.h ? [+a.w, +a.h] : scen === 'start' ? [375, 667] : [1440, 900];
const dir = `${OUT}/3d`; mkdirSync(dir, { recursive: true });
const tag = `${rev.name}-${scen}-${w}x${h}-t${text}`;
const log = logger(`${dir}/flash2-${tag}.log`);
log(`RUN 3d ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} viewport=${w}x${h} text=${text}% scenario=${scen} runs=${runs} start=${stamp()}`);
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
  const marks = {};
  let seenOnToday = null;
  if (scen === 'start') {
    await todayAfterEnd(p, true);
    seenOnToday = await p.evaluate((W) => !!document.getElementById(W), WARN);
    await sleep(900);
    await recStart(p);
    marks.click = await p.evaluate(() => performance.now() - window.__rec.t0);
    await startBtn(p).click();
    await sleep(3500);
  } else if (scen === 'resume2') {
    await todayAfterEnd(p, true);
    seenOnToday = await p.evaluate((W) => !!document.getElementById(W), WARN);
    await sleep(900);
    await recStart(p);
    marks.start = await p.evaluate(() => performance.now() - window.__rec.t0);
    await startBtn(p).click();
    await sleep(2500);
    marks.pause = await p.evaluate(() => performance.now() - window.__rec.t0);
    await p.getByRole('button', { name: 'Pause' }).click();
    await sleep(1800);
    marks.resume = await p.evaluate(() => performance.now() - window.__rec.t0);
    await p.getByRole('button', { name: 'Resume' }).click();
    await sleep(3000);
  } else {
    await recStart(p);
    await startBtn(p).click();
    seenOnToday = await waitWarning(p, 6000); // "shown during the brew" on desktop
    await sleep(2000);
    marks.pause = await p.evaluate(() => performance.now() - window.__rec.t0);
    await p.getByRole('button', { name: 'Pause' }).click();
    await sleep(1800);
    marks.resume = await p.evaluate(() => performance.now() - window.__rec.t0);
    await p.getByRole('button', { name: 'Resume' }).click();
    await sleep(3000);
  }
  const frames = await recStop(p);
  const sum = recSummary(frames);
  if (run === 1) await p.screenshot({ path: `${dir}/flash2-${tag}-run1-end.png` });
  const r = { run, warningSeenBeforeAction: seenOnToday, marks: Object.fromEntries(Object.entries(marks).map(([k, v]) => [k, Math.round(v)])), frames: frames.length, maxFrameGapMs: sum.maxFrameGap, hitMs: sum.hitMs, segments: sum.segments.map((s) => ({ t0: s.t0, ms: s.ms, maxOp: s.maxOp, hits: s.hits, warnRectTB: s.rect })), warningVisibleMs: sum.visibleMs, errs };
  all.push(r);
  log(`run ${run}: ${JSON.stringify(r)}`);
  await ctx.close();
}
const hitRuns = all.filter((r) => r.hitMs > 0);
log(`SUMMARY ${tag}: runs with the warning over a protected element ${hitRuns.length}/${runs}; hit ms per run ${JSON.stringify(all.map((r) => r.hitMs))}; names ${JSON.stringify([...new Set(all.flatMap((r) => r.segments.flatMap((s) => s.hits)))])}`);
writeFileSync(`${dir}/flash2-${tag}.json`, JSON.stringify({ tag, url: rev.dev, rev: rev.name, commit: rev.commit, all }, null, 1));
await b.close();
if (a.video) { const d = `${dir}/vtmp-${tag}`; const f = readdirSync(d).find((x) => x.endsWith('.webm')); if (f) renameSync(`${d}/${f}`, `${dir}/video-3d2-${tag}.webm`); rmSync(d, { recursive: true, force: true }); }
log(`END ${stamp()}`);
