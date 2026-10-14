// sumperf.mjs <perf-baseFirst.json> <perf-trialFirst.json>: LRC-style tables
import { readFileSync, existsSync } from 'node:fs';
const med = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const all = [];
for (const f of process.argv.slice(2)) {
  if (!existsSync(f)) { console.log(`(missing ${f})\n`); continue; }
  const j = JSON.parse(readFileSync(f, 'utf8'));
  console.log(`#### ${f.split('/').pop()}: vp ${j.vp}, hour ${j.time}, rounds ${j.rounds}, frames/round ${j.frames}, warm-up ${j.warm}, ${j.at}\n`);
  console.log('| round | variant (order in round) | tier / chai | fur fill read | frame median ms | mean | p90 | min | max | draw calls | triangles | geometries | textures | programs | JS heap MB | canvas | ready ms | long tasks (n / max ms) | load 1m/5m/15m | errors |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  const seen = {};
  for (const r of j.results) {
    seen[r.round] = (seen[r.round] ?? 0) + 1;
    const lt = r.longTasks ? `${r.longTasks.count} / ${r.longTasks.maxMs}` : '–';
    console.log(`| ${r.round} | ${r.variant === 'base' ? 'BASE `4d36939`' : 'TRIAL `46f33e2`'} (${seen[r.round] === 1 ? '1st' : '2nd'}) | ${r.quality} / ${r.chaiKind}${r.rootUserDataModel ? ' (model)' : ''} | ${r.furFill} | ${r.frame?.median} | ${r.frame?.mean} | ${r.frame?.p90} | ${r.frame?.min} | ${r.frame?.max} | ${r.render?.calls} | ${r.render?.triangles} | ${r.memory?.geometries} | ${r.memory?.textures} | ${r.memory?.programs} | ${r.heapMB} | ${r.canvas?.join('×')} | ${r.readyMs} | ${lt} | ${r.load1m} | ${JSON.stringify(r.errors)} |`);
    all.push({ order: j.results[0].variant + '-first', ...r });
  }
  const per = (v) => j.results.filter((r) => r.variant === v);
  console.log('\n| variant | runs | per-run medians (ms) | median of medians | median of means | median p90 | calls | triangles | geometries | textures | programs | heap MB per run |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const v of ['base', 'after']) {
    const rs = per(v); if (!rs.length) continue;
    const u = (k) => [...new Set(rs.map(k))].join(',');
    console.log(`| ${v === 'base' ? 'BASE' : 'TRIAL'} | ${rs.length} | ${rs.map((r) => r.frame.median).join(', ')} | ${med(rs.map((r) => r.frame.median))} | ${med(rs.map((r) => r.frame.mean))} | ${med(rs.map((r) => r.frame.p90))} | ${u((r) => r.render.calls)} | ${u((r) => r.render.triangles)} | ${u((r) => r.memory.geometries)} | ${u((r) => r.memory.textures)} | ${u((r) => r.memory.programs)} | ${rs.map((r) => r.heapMB).join(', ')} |`);
  }
  console.log('');
}
// pooled, by position in the round
console.log('#### Pooled over both orders (all rounds)\n');
console.log('| variant | position | n | per-run medians (ms) | median of medians |');
console.log('|---|---|---|---|---|');
for (const v of ['base', 'after']) for (const pos of [1, 2]) {
  const rs = []; const seen = {};
  for (const f of process.argv.slice(2)) { if (!existsSync(f)) continue; const j = JSON.parse(readFileSync(f, 'utf8')); const cnt = {}; for (const r of j.results) { cnt[r.round] = (cnt[r.round] ?? 0) + 1; if (r.variant === v && cnt[r.round] === pos && r.frame) rs.push(r.frame.median); } }
  console.log(`| ${v === 'base' ? 'BASE' : 'TRIAL'} | ${pos === 1 ? 'first in round' : 'second in round'} | ${rs.length} | ${rs.join(', ')} | ${med(rs)} |`);
}
