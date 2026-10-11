// Side-by-side per-configuration table for the packet: this revision vs INT, runs and failing runs per configuration,
// with INT's failing control/method pairs (union over runs).   node table.mjs <revJsonl,...> <intJsonl,...>
import { readFileSync } from 'node:fs';
const read = (list) => list.split(',').filter(Boolean).flatMap((f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const [revFiles, intFiles] = process.argv.slice(2);
const agg = (rows) => {
  const m = new Map();
  for (const r of rows) {
    const k = `${r.size}|${r.theme}|${r.state}`;
    const e = m.get(k) ?? { runs: 0, failed: 0, fails: new Set(), start: '' };
    e.runs++;
    if (!r.pass) e.failed++;
    for (const f of r.fails ?? []) e.fails.add(f.replace(/ in view after tapping (Pause|Resume) break/, ' in view after the tap'));
    for (const x of r.errors ?? []) if (x.startsWith('PROBE')) e.fails.add(x);
    if (r.state === 'tap') e.start = r.tapPause?.skipped ? 'skipped' : `Pause ${r.tapPause?.pauseCy} → Resume ${r.tapPause?.resumeCy}`;
    else e.start = Object.entries(r.initial ?? {}).filter(([, v]) => v && !v.ok).map(([k, v]) => `${k} ${v.cy}`).join(', ') || 'all in view';
    m.set(k, e);
  }
  return m;
};
const R = agg(read(revFiles)), I = agg(read(intFiles));
const so = { break: 0, paused: 1, 'over-carried': 2, 'over-plain': 3, tap: 4 }, zo = { '375x667': 0, '390x844': 1, '844x390': 2 };
const keys = [...new Set([...R.keys(), ...I.keys()])].sort((a, b) => {
  const [za, ta, sa] = a.split('|'), [zb, tb, sb] = b.split('|');
  return zo[za] - zo[zb] || ta.localeCompare(tb) || so[sa] - so[sb];
});
const short = (f) => f.replace("That's all for now", 'All for now').replace('Put the kettle on', 'Put').replace('Start next brew', 'Next').replace('Mark it done', 'Mark').replace('Skip break', 'Skip').replace(/(Pause|Resume) break/, '$1');
console.log('| Size | Theme | State | Not wholly in view as the state opens (centre y; INT) | M7b runs / failing | INT runs / failing | INT failing control/method |');
console.log('|---|---|---|---|---|---|---|');
for (const k of keys) {
  const [z, t, s] = k.split('|');
  const r = R.get(k), i = I.get(k);
  console.log(`| ${z} | ${t} | ${s} | ${i?.start ?? '–'} | ${r ? `${r.runs} / ${r.failed}` : '–'} | ${i ? `${i.runs} / ${i.failed}` : '–'} | ${i && i.fails.size ? [...i.fails].map(short).join(', ') : '—'} |`);
}
const tot = (m) => { const v = [...m.values()]; return `${v.reduce((a, e) => a + e.runs, 0)} runs, ${v.reduce((a, e) => a + e.failed, 0)} failing runs, ${v.filter((e) => e.failed).length}/${v.length} configurations failing`; };
console.log(`\n- **M7b:** ${tot(R)}.\n- **INT:** ${tot(I)}.`);
