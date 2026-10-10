// Summarise ctl.mjs jsonl (one or more files): per configuration and per control.   node summ-ctl.mjs <file...>
import { readFileSync, existsSync } from 'node:fs';
const recs = process.argv.slice(2).filter(existsSync).flatMap((f) => readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const ctrl = {}; // name -> {windows, bad, taps, tapOk}
const cfgRows = [];
for (const r of recs) {
  const bad = [];
  let wins = 0, taps = 0, tapOk = 0, transient = 0;
  for (const row of r.rows) {
    if (!row.label || row.label === 'end-sheet' || row.label === 'journey') { if (row.label === 'journey') bad.push(`JOURNEY ERROR ${row.error}`); continue; }
    wins++;
    transient += row.transientCount ?? 0;
    if (row.tap) { taps++; if (row.tap === 'worked') tapOk++; else bad.push(`${row.label} n${row.n}: tap ${row.tap}`); }
    if (row.error) bad.push(`${row.label} n${row.n}: ERROR ${row.error}`);
    const settled = row.settled ?? {};
    for (const [k, v] of Object.entries(settled)) { const [name, kind] = k.split('|'); bad.push(`${row.label} n${row.n}: ${name} ${kind} x${v.n}${v.ex ? ' (' + String(v.ex).slice(0, 60) + ')' : ''}`); }
    if (row.label === 'today+warning' && row.settledCount) bad.push(`today+warning: ${row.settledCount} settled`);
    // per-control tally: controls seen in this window
    for (const name of Object.keys(row.per ?? {})) {
      if (name === 'readout') continue;
      const c = (ctrl[name] ??= { windows: 0, covered: 0 });
      c.windows++;
      if (Object.keys(settled).some((k) => k.startsWith(name + '|'))) c.covered++;
    }
    if (row.label === 'today+warning') { const c = (ctrl['Put the kettle on (with real warning)'] ??= { windows: 0, covered: 0 }); c.windows++; if (row.settledCount) c.covered++; }
  }
  cfgRows.push({ tag: r.tag, wins, taps, tapOk, transient, bad });
}
for (const c of cfgRows) console.log(`${c.tag}: windows ${c.wins}, taps ${c.tapOk}/${c.taps}, transient frames ${c.transient}, settled issues ${c.bad.length}${c.bad.length ? '\n    ' + c.bad.join('\n    ') : ''}`);
console.log('\nper control (windows with toasts up; windows with a settled hit/overlap):');
for (const [k, v] of Object.entries(ctrl)) console.log(`  ${k}: ${v.windows} windows, ${v.covered} covered`);
