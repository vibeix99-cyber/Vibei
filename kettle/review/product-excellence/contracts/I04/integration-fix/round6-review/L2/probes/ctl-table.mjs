// compact per-configuration table from ctl.mjs jsonl: node ctl-table.mjs <out.md> <jsonl...>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const [out, ...files] = process.argv.slice(2);
const recs = files.filter(existsSync).flatMap((f) => readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const L = ['| configuration | windows (toasts up) | real taps that worked | protected controls covered after settling (hit-test or box) | countdown digits covered after settling (windows by toasts raised) | controls off-screen and not reachable by real scroll (state: control, centre y) | transient frames (first 600 ms) | journey errors |', '|---|---|---|---|---|---|---|---|'];
for (const r of recs) {
  let wins = 0, taps = 0, ok = 0, trans = 0; const cov = [], cd = { 1: 0, 2: 0, 3: 0 }, cdw = { 1: 0, 2: 0, 3: 0 }, off = [], errs = [];
  for (const row of r.rows) {
    if (row.label === 'journey') { errs.push(row.error); continue; }
    if (!row.label || row.label === 'end-sheet') continue;
    wins++; trans += row.transientCount ?? 0;
    if (row.tap) { taps++; if (row.tap === 'worked') ok++; else if (row.tap === 'not on screen' || row.tap === 'control not on screen') off.push(`${row.label}: ${row.tapPre ? Math.round(row.tapPre.y) : '?'}`); else cov.push(`${row.label} tap ${row.tap}`); }
    if (row.error) errs.push(`${row.label}: ${row.error}`);
    const has = row.per && row.per.countdown;
    if (has) cdw[row.n] = (cdw[row.n] ?? 0) + 1;
    let cdHit = false;
    for (const k of Object.keys(row.settled ?? {})) { const [name] = k.split('|'); if (name === 'countdown') cdHit = true; else cov.push(`${row.label} n${row.n}: ${k}`); }
    if (cdHit) cd[row.n] = (cd[row.n] ?? 0) + 1;
    if (row.label === 'today+warning' && row.settledCount) cov.push(`today+warning ${row.settledCount}`);
  }
  const uniq = (a) => [...new Set(a)];
  L.push(`| ${r.tag} | ${wins} | ${ok}/${taps} | ${cov.length ? uniq(cov).join('; ') : 'none'} | 1 toast: ${cd[1] ?? 0}/${cdw[1] ?? 0}, 2: ${cd[2] ?? 0}/${cdw[2] ?? 0}, 3: ${cd[3] ?? 0}/${cdw[3] ?? 0} | ${off.length ? off.join('; ') : 'none'} | ${trans} | ${errs.length ? errs.join('; ') : '-'} |`);
}
writeFileSync(out, L.join('\n') + '\n'); console.log(L.join('\n'));
