// L3 3b (v2): the warning's take-away / re-show while Tabbing on Today at 200% text, measured from DOM events (not frame sampling).
// node blink2.mjs --rev=R6|INT --runs=6 --text=200 [--video]
import { REV, launch, newCtx, openNewbie, fillStorage, sleep, args, logger, OUT, stamp, todayAfterEnd, WARN } from './lib.mjs';
import { mkdirSync, writeFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const runs = +(a.runs ?? 6), text = +(a.text ?? 200), w = +(a.w ?? 375), h = +(a.h ?? 667), key = a.key ?? 'Tab';
const dir = `${OUT}/3b`; mkdirSync(dir, { recursive: true });
const tag = `${rev.name}-${w}x${h}-t${text}-${key.replace('+', '')}`;
const log = logger(`${dir}/blink2-${tag}.log`);
log(`RUN 3b-v2 ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} viewport=${w}x${h} text=${text}% key=${key} runs=${runs} start=${stamp()}`);
const b = await launch();
const all = [];
const SRC = (W) => `(() => {
  const R = (window.__bl = { ev: [], t0: performance.now(), lastOp: null });
  const T = () => Math.round((performance.now() - R.t0) * 10) / 10;
  new MutationObserver((ms) => { for (const m of ms) {
    if (m.type === 'childList') { for (const x of m.addedNodes) if (x.nodeType === 1 && x.tagName === 'LI') R.ev.push([T(), '+', x.id === '${W}' ? 'WARN' : x.textContent.slice(0, 20)]); for (const x of m.removedNodes) if (x.nodeType === 1 && x.tagName === 'LI') R.ev.push([T(), '-', x.id === '${W}' ? 'WARN' : x.textContent.slice(0, 20)]); }
    else if (m.type === 'attributes' && m.target.id === '${W}') { const o = m.target.style.opacity; if (o !== R.lastOp) { R.lastOp = o; R.ev.push([T(), 'op', o === '' ? '' : (+o).toFixed(2)]); } }
  } }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
})()`;
for (let run = 1; run <= runs; run++) {
  const video = a.video && run === 1 ? `${dir}/vtmp2-${tag}` : undefined;
  const ctx = await newCtx(b, { w, h, text, video });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await openNewbie(p, rev.dev, {});
  await fillStorage(p);
  await todayAfterEnd(p, true);
  await sleep(500);
  await p.evaluate(SRC(WARN));
  const presses = []; let reached = null;
  for (let i = 1; i <= 30; i++) {
    const t = await p.evaluate(() => Math.round((performance.now() - window.__bl.t0) * 10) / 10);
    await p.keyboard.press(key);
    presses.push([i, t]);
    await sleep(500);
    const f = await p.evaluate(() => { const a = document.activeElement; return a ? (a.textContent || '').trim().slice(0, 20) : ''; });
    if (/Save backup/.test(f)) { reached = i; break; }
  }
  await sleep(1500);
  const ev = await p.evaluate(() => window.__bl.ev);
  const wev = ev.filter((e) => e[2] === 'WARN' || e[1] === 'op');
  // pair removal -> next addition of the warning li
  const gaps = [];
  for (let i = 0; i < wev.length; i++) if (wev[i][1] === '-' && wev[i][2] === 'WARN') {
    const nxt = wev.slice(i + 1).find((e) => e[1] === '+' && e[2] === 'WARN');
    // exit start: the last opacity record >= 0.99 before the first record < 0.99 preceding the removal
    let j = i - 1; let exitStart = null; while (j >= 0 && wev[j][1] === 'op') { if (+wev[j][2] < 0.99) exitStart = wev[j][0]; else break; j--; }
    let fadeIn = null; if (nxt) { const k = wev.indexOf(nxt); for (let q = k + 1; q < wev.length; q++) if (wev[q][1] === 'op' && +wev[q][2] >= 0.99) { fadeIn = wev[q][0]; break; } }
    gaps.push({ removedAt: wev[i][0], exitStartAt: exitStart, reAddedAt: nxt ? nxt[0] : null, domAbsentMs: nxt ? Math.round((nxt[0] - wev[i][0]) * 10) / 10 : null, visibleDipMs: nxt && exitStart != null && fadeIn != null ? Math.round((fadeIn - exitStart)) : null, afterPress: presses.filter((q) => q[1] <= wev[i][0] + 5).at(-1)?.[0] ?? null });
  }
  const r = { run, reached, takeAways: gaps, warnLiEvents: wev.filter((e) => e[1] !== 'op'), errs };
  all.push(r);
  log(`run ${run}: reached Save backup after ${reached} presses; warning take-aways ${JSON.stringify(gaps)}`);
  if (run === 1) await p.screenshot({ path: `${dir}/blink2-${tag}-run1-end.png` });
  await ctx.close();
}
const absent = all.flatMap((r) => r.takeAways.map((x) => x.domAbsentMs));
log(`SUMMARY ${tag}: runs with a take-away ${all.filter((r) => r.takeAways.length).length}/${runs}; DOM-absent ms (removal -> re-add) ${JSON.stringify(absent)}; runs reaching Save backup ${all.filter((r) => r.reached).length}/${runs}`);
writeFileSync(`${dir}/blink2-${tag}.json`, JSON.stringify({ tag, url: rev.dev, rev: rev.name, commit: rev.commit, all }, null, 1));
await b.close();
if (a.video) { const d = `${dir}/vtmp2-${tag}`; const f = readdirSync(d).find((x) => x.endsWith('.webm')); if (f) renameSync(`${d}/${f}`, `${dir}/video-3b2-${tag}.webm`); rmSync(d, { recursive: true, force: true }); }
log(`END ${stamp()}`);
