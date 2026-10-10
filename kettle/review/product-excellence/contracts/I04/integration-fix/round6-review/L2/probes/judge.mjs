// Offline re-judge of read.mjs runs from the saved per-frame recordings (consistent criteria for every run).
//   node judge.mjs <out-prefix> <dir> [<dir>...]     (each dir holds <rev>.jsonl and <tag>.frames.json)
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { F } from './lib.mjs';
const WARN = 'toast-kettle:save-failed';
const [prefix, ...dirs] = process.argv.slice(2);
const runs = [];
for (const dir of dirs) for (const f of readdirSync(dir).filter((x) => x.endsWith('.jsonl') && !x.includes('desk') && !x.includes('ctl') && !x.includes('zoom') && !x.includes('d1') && !x.includes('d2'))) {
  for (const line of readFileSync(`${dir}/${f}`, 'utf8').trim().split('\n').filter(Boolean)) {
    const info = JSON.parse(line);
    const fp = `${dir}/${info.tag}.frames.json`;
    if (!existsSync(fp)) continue;
    runs.push({ info, dir, rec: JSON.parse(readFileSync(fp, 'utf8')) });
  }
}
const out = [];
for (const { info, dir, rec } of runs) {
  const fr = rec.frames, ev = rec.ev;
  const tFrom = info.tEnd ?? (info.tRaise ?? 0) - 100;
  const inst = [];
  for (const e of ev) {
    if (e[2] !== WARN) continue;
    if (e[1] === '+' && e[0] >= tFrom - 1) inst.push({ s: e[3], add: e[0], rem: null });
    if (e[1] === '-') { const i = inst.find((x) => x.s === e[3] && x.rem == null) ?? inst.find((x) => x.rem == null); if (i) i.rem = e[0]; }
  }
  const tIn0 = info.tIn0, tClick = info.tClick;
  const R = { tag: info.tag, rev: info.rev, W: info.W, H: info.H, theme: info.theme, text: info.text, flow: info.flow, how: info.how, instances: inst.map((i) => [Math.round(i.add), i.rem == null ? null : Math.round(i.rem)]), flags: [] };
  const first = inst[0], last = inst[inst.length - 1];
  // B entry flicker
  if (first && first.rem != null && first.rem < tIn0 && inst.length > 1) {
    const peak = Math.max(0, ...fr.filter((f) => f[0] >= first.add && f[0] <= first.rem + 50 && f[F.top] != null).map((f) => f[F.op]));
    R.entry = { lifeMs: Math.round(first.rem - first.add), peakOpacity: +peak.toFixed(2), reshownAfterMs: Math.round(inst[1].add - first.rem), stableAtMs: Math.round(inst[1].add - first.add) };
    R.flags.push('B');
  }
  // A first line at full opacity / covered
  if (last) {
    const inS = fr.filter((f) => f[0] >= last.add && f[F.top] != null && (last.rem == null || f[0] <= last.rem));
    const fullIdx = inS.findIndex((f) => f[F.op] >= 0.98);
    if (fullIdx >= 0) {
      const f0 = inS[fullIdx];
      R.firstAtFull = f0[F.first];
      if (f0[F.first] === 0) {
        const tIn = tIn0 ?? Infinity;
        const vis = inS.slice(fullIdx).find((f) => f[F.first] === 1);
        R.firstCoveredMs = vis ? Math.round(vis[0] - f0[0]) : null;
        R.firstCoveredUntil = vis ? Math.round(vis[0]) : null;
        R.firstCoveredFromAppearMs = vis ? Math.round(vis[0] - last.add) : null;
        R.flags.push('A');
      }
      // opacity >= 0.5 (frames recorded with the 0.5 threshold only)
      const mid = inS.find((f) => f[F.op] >= 0.5 && f[F.op] < 0.98);
      if (mid && mid[F.lines] > 0) R.firstAtHalf = mid[F.first];
    }
  }
  // C hides while reading
  const readHides = ev.filter((e) => e[2] === WARN && e[1] === '-' && e[0] >= tIn0 && e[0] <= tClick - 200 && (() => { const i = inst.find((x) => x.s === e[3]); return !i || (e[0] - i.add) < 11_500; })());
  if (readHides.length) { R.readHides = readHides.map((e) => Math.round(e[0])); R.flags.push('C'); }
  // gone/faded frames while reading (last instance)
  if (last) {
    const readFr = fr.filter((f) => f[0] >= Math.max(tIn0, last.add + 600) && f[0] <= tClick - 100 && !(last.rem != null && f[0] >= last.rem - 400));
    const faded = readFr.filter((f) => f[F.top] != null && f[F.op] < 0.98);
    const absent = readFr.filter((f) => f[F.top] == null);
    if (faded.length || absent.length) { R.fadedFrames = faded.length; R.absentFrames = absent.length; if (!R.flags.includes('C')) R.flags.push('C'); }
  }
  // D jump back (own-scroll resets, list resets without a toast leaving)
  if (info.jumps?.length) { R.jumps = info.jumps.slice(0, 3); R.flags.push('D'); }
  if (info.clamps?.length) R.clamps = info.clamps.length;
  // E lines read: wholly visible; and text coverage by the visited scroll offsets
  R.lines = info.linesRead;
  const w = (info.before?.all ?? []).find((t) => t.id === `toast-kettle:save-failed`);
  if (w && info.readTrace) {
    const ch = w.ch, sh = w.sh;
    const offs = [0, ...info.readTrace.map((t) => t[1])];
    const iv = offs.map((o) => [o, o + ch]).sort((a, b) => a[0] - b[0]);
    let cov = 0, end = -1;
    for (const [a, b] of iv) { const a2 = Math.max(a, end); if (b > a2) cov += b - a2; end = Math.max(end, b); }
    R.coverage = sh > ch ? +Math.min(1, cov / sh).toFixed(2) : 1;
    R.box = { clientH: ch, contentH: sh };
  }
  if (R.lines && R.lines.seen < R.lines.total) R.flags.push('E');
  // F Save backup reachable
  if (info.saveBackupHitFrames === 0 || !info.download || info.download === 'n/a (warning gone)' || (info.rest && !info.rest.gone && (!info.rest.inView || !info.rest.hit))) R.flags.push('F');
  // G geometry
  if (info.overDockFrames) { R.overDock = info.overDockFrames; R.flags.push('G'); }
  if (info.belowRoomFrames) { R.belowRoom = info.belowRoomFrames; R.flags.push('G'); }
  if (info.squeezed?.length) R.flags.push('H');
  R.steps = info.readSteps; R.errors = info.errors?.length ?? 0;
  out.push(R);
}
writeFileSync(`${prefix}.json`, JSON.stringify(out, null, 1));
const key = (r) => `${r.rev} ${r.W}x${r.H} ${r.theme} t${r.text} ${r.flow} ${r.how}`;
const lines = ['| run | flags | entry flicker | first line covered at full opacity (ms) | lines read | text coverage | steps | notes |', '|---|---|---|---|---|---|---|---|'];
for (const r of out) lines.push(`| ${key(r)} | ${r.flags.join('') || '-'} | ${r.entry ? `life ${r.entry.lifeMs} ms, peak op ${r.entry.peakOpacity}, back after ${r.entry.reshownAfterMs} ms` : '-'} | ${r.firstAtFull === 0 ? `${r.firstCoveredMs ?? 'never'} (visible ${r.firstCoveredFromAppearMs ?? '-'} ms after it appeared)` : '-'} | ${r.lines ? `${r.lines.seen}/${r.lines.total}` : '?'} | ${r.coverage ?? '-'} | ${r.steps ?? '-'} | ${[r.readHides ? `read-hide ${r.readHides}` : '', r.fadedFrames || r.absentFrames ? `faded ${r.fadedFrames}/absent ${r.absentFrames}` : '', r.jumps ? `jump ${JSON.stringify(r.jumps)}` : '', r.overDock ? `overDock ${r.overDock}` : '', r.belowRoom ? `belowRoom ${r.belowRoom}` : '', r.errors ? `errors ${r.errors}` : ''].filter(Boolean).join('; ')} |`);
writeFileSync(`${prefix}.md`, lines.join('\n') + '\n');
console.log(lines.join('\n'));
// per-flag counts
const flagCount = {};
for (const r of out) for (const f of r.flags) flagCount[f] = (flagCount[f] ?? 0) + 1;
console.log(`runs ${out.length}; flag counts ${JSON.stringify(flagCount)}`);
