// L3 3b: blink of the warning while Tabbing on Today at 200% text (375x667). rAF per-frame visibility, N runs.
// node blink.mjs --rev=R6|INT --runs=5 --text=200 [--video]
import { REV, launch, newCtx, openNewbie, fillStorage, sleep, args, logger, OUT, recInstall, recStart, recStop, recSummary, stamp, todayAfterEnd, blinks, WARN } from './lib.mjs';
import { mkdirSync, writeFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const runs = +(a.runs ?? 5), text = +(a.text ?? 200), w = +(a.w ?? 375), h = +(a.h ?? 667), key = a.key ?? 'Tab';
const dir = `${OUT}/3b`; mkdirSync(dir, { recursive: true });
const tag = `${rev.name}-${w}x${h}-t${text}-${key.replace('+', '')}`;
const log = logger(`${dir}/blink-${tag}.log`);
log(`RUN 3b ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} viewport=${w}x${h} text=${text}% key=${key} runs=${runs} start=${stamp()}`);
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
  await todayAfterEnd(p, true);
  await sleep(500);
  await recStart(p);
  const presses = []; let reached = null;
  for (let i = 1; i <= 30; i++) {
    const t = await p.evaluate(() => performance.now() - window.__rec.t0);
    await p.keyboard.press(key);
    presses.push([i, Math.round(t)]);
    await sleep(500);
    const f = await p.evaluate(() => { const a = document.activeElement; return a ? (a.textContent || '').trim().slice(0, 20) : ''; });
    if (/Save backup/.test(f)) { reached = i; break; }
  }
  await sleep(1200);
  const frames = await recStop(p);
  const sum = recSummary(frames);
  const bl = blinks(frames, 0.5); const bl2 = blinks(frames, 0.05);
  // which Tab press does each blink follow?
  const ann = bl.map((x) => ({ ...x, afterPress: presses.filter((q) => q[1] <= x.from + 5).at(-1)?.[0] ?? null }));
  const idx = frames.map((f, i) => (f[1] != null && f[1] >= 0.9 ? i : -1)).filter((i) => i >= 0);
  const dips = []; let cur = null;
  if (idx.length) for (let i = idx[0]; i <= idx.at(-1); i++) { const f = frames[i]; const low = f[1] == null || f[1] < 0.9; if (low) { if (!cur) cur = { t0: frames[i - 1][0], minOp: 1 }; cur.minOp = Math.min(cur.minOp, f[1] ?? 0); } else if (cur) { cur.t1 = f[0]; cur.ms = cur.t1 - cur.t0; dips.push(cur); cur = null; } }
  const r = { run, reached, dips, frames: frames.length, maxFrameGapMs: sum.maxFrameGap, blinks_ge_0_5: ann, blinks_ge_0_05: bl2.map((x) => ({ from: x.from, ms: x.ms })), visibleMs: sum.visibleMs, errs };
  all.push(r);
  log(`run ${run}: reached Save backup after ${reached} presses; frames ${frames.length} (max gap ${sum.maxFrameGap} ms); blinks(op>=0.5): ${JSON.stringify(ann)}; blinks(op>=0.05): ${JSON.stringify(r.blinks_ge_0_05)}; interior opacity dips (<0.9): ${JSON.stringify(dips)}`);
  if (run === 1) await p.screenshot({ path: `${dir}/blink-${tag}-run1-end.png` });
  await ctx.close();
}
const ms = all.flatMap((r) => r.blinks_ge_0_5.map((x) => x.ms));
log(`SUMMARY ${tag}: runs with a blink ${all.filter((r) => r.blinks_ge_0_5.length).length}/${runs}; blink durations (ms, op<0.5 gap between visible frames) ${JSON.stringify(ms)}; runs reaching Save backup ${all.filter((r) => r.reached).length}/${runs}`);
writeFileSync(`${dir}/blink-${tag}.json`, JSON.stringify({ tag, url: rev.dev, rev: rev.name, commit: rev.commit, all }, null, 1));
await b.close();
if (a.video) { const d = `${dir}/vtmp-${tag}`; const f = readdirSync(d).find((x) => x.endsWith('.webm')); if (f) renameSync(`${d}/${f}`, `${dir}/video-3b-${tag}.webm`); rmSync(d, { recursive: true, force: true }); }
log(`END ${stamp()}`);
