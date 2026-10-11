// Summarize reach.mjs JSONL into a markdown table: per configuration (size × theme × state), runs and failing runs, and
// the failing control × method pairs.   node summarize.mjs <file.jsonl> [more.jsonl ...]
import { readFileSync } from 'node:fs';
const rows = process.argv.slice(2).flatMap((f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const by = new Map();
for (const r of rows) {
  const k = `${r.rev}|${r.size}|${r.theme}|${r.state}`;
  const e = by.get(k) ?? { rev: r.rev, size: r.size, theme: r.theme, state: r.state, runs: 0, failed: 0, fails: new Map(), start: '', tap: '' };
  e.runs++;
  if (!r.pass) e.failed++;
  for (const f of r.fails ?? []) e.fails.set(f, (e.fails.get(f) ?? 0) + 1);
  for (const x of r.errors ?? []) if (x.startsWith('PROBE')) e.fails.set(x, (e.fails.get(x) ?? 0) + 1);
  e.start = Object.entries(r.initial ?? {}).filter(([, v]) => v && !v.ok).map(([k, v]) => `${k} ${v.cy}`).join(', ') || 'all in view';
  if (r.tapPause) e.tap = r.tapPause.skipped ? 'skipped' : `Pause ${r.tapPause.pauseCy} → Resume ${r.tapPause.resumeCy ?? '–'}${r.tapPause.resumeInView ? '' : ' (off)'}`;
  by.set(k, e);
}
const order = { '375x667': 0, '390x844': 1, '844x390': 2 }, so = { break: 0, paused: 1, 'over-carried': 2, 'over-plain': 3, tap: 4 };
const list = [...by.values()].sort((a, b) => a.rev.localeCompare(b.rev) || order[a.size] - order[b.size] || a.theme.localeCompare(b.theme) || so[a.state] - so[b.state]);
console.log('| Rev | Size | Theme | State | Runs | Failing runs | Not in view at start (centre y) | Failing control/method (count) |');
console.log('|---|---|---|---|---|---|---|---|');
for (const e of list) {
  const f = [...e.fails.entries()].map(([k, n]) => `${k}${n > 1 ? ` ×${n}` : ''}`).join('; ') || '—';
  console.log(`| ${e.rev} | ${e.size} | ${e.theme} | ${e.state} | ${e.runs} | ${e.failed} | ${e.state === 'tap' ? e.tap : e.start} | ${f} |`);
}
const tot = (rev) => { const l = list.filter((e) => e.rev === rev); return `${rev}: ${l.reduce((a, e) => a + e.runs, 0)} runs in ${l.length} configurations, ${l.reduce((a, e) => a + e.failed, 0)} failing runs, ${l.filter((e) => e.failed).length} failing configurations`; };
console.log('');
for (const rev of [...new Set(list.map((e) => e.rev))]) console.log(`- ${tot(rev)}`);
