// LR-summarize.mjs <manual dir>: counts per cell from the per-cell JSON files; writes summary.txt next to them
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const dir = process.argv[2];
const files = readdirSync(dir).filter((f) => /^int-5560-.*\.json$/.test(f)).sort();
const out = [];
const order = ['LEN', 'S1', 'S2', 'S0'];
files.sort((a, b) => (a.split('-')[3] === b.split('-')[3] ? order.indexOf(a.split('-')[2]) - order.indexOf(b.split('-')[2]) : a.split('-')[3] < b.split('-')[3] ? 1 : -1));
for (const f of files) {
  const rs = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const n = rs.length; const cnt = (fn) => rs.filter(fn).length;
  const sc = rs[0].scenario, ph = rs[0].phase;
  out.push(`## ${sc} ${ph}: ${n} iterations (${f})`);
  const keys = Object.keys(rs[0].check);
  for (const k of keys) out.push(`  ${k}: ${cnt((r) => r.check[k])} of ${n}`);
  out.push(`  both tabs reached #/done after the end: ${cnt((r) => r.bothOnDone)} of ${n}`);
  out.push(`  exactly one record (storage, A memory, B memory): ${cnt((r) => r.exactlyOneRecord)} of ${n}`);
  out.push(`  page errors: ${rs.reduce((a, r) => a + r.pageErrors.length, 0)}`);
  out.push(`  load average (1 min) at iteration starts: min ${Math.min(...rs.map((r) => +r.loadAtStart.split(' ')[0]))} max ${Math.max(...rs.map((r) => +r.loadAtStart.split(' ')[0]))}`);
  if (sc === 'LEN') {
    out.push(`  wanted lengths: ${rs.map((r) => r.wantMin + (r.iteration <= 3 ? 'q' : 's')).join(' ')}`);
    out.push(`  settled iterations: A's Start button read B's length after (ms): ${rs.filter((r) => r.iteration > 3).map((r) => r.aShowedLengthAfterMs).join(', ')}`);
    out.push(`  A's Start button text before B started (settled): ${rs.filter((r) => r.iteration > 3).map((r) => r.aIdleWhenShowing?.startButton).join(' | ')}`);
    out.push(`  at 3.7 s after the start: A hash ${[...new Set(rs.map((r) => r.steps['03-settled-3.7s-later'].A.hash))]}, B hash ${[...new Set(rs.map((r) => r.steps['03-settled-3.7s-later'].B.hash))]}`);
  } else {
    const lab = rs.map((r) => r.steps['03-after-back-and-forth'].A.memory.intention);
    out.push(`  running brew's task label in A at the end of the back and forth: ${lab.map((l) => JSON.stringify(l)).join(', ')}`);
    out.push(`  typing in B: ${rs.map((r) => (r.t2Typing.error ? 'error' : 'ok') + (r.t2Typing.composerPresent === false ? '(no composer)' : '')).join(', ')}`);
    if (sc === 'S0') out.push(`  B opened Today after the brew started: hash ${[...new Set(rs.map((r) => r.t2Typing.hashAfterOpeningToday))]}, composer present ${rs.map((r) => r.t2Typing.composerPresent).join(',')}`);
  }
  out.push('');
}
writeFileSync(`${dir}/summary.txt`, out.join('\n'));
console.log(out.join('\n'));
