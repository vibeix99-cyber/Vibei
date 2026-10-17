// RF-table.mjs (from RR-table.mjs) <manual dir> <label>... : markdown tables from the 2-tab JSON files (per case: counts; per iteration: A, B, storage after each iteration)
import { readFileSync, readdirSync } from 'node:fs';
const dir = process.argv[2];
const labels = process.argv.slice(3);
const MIN = 60_000;
const cell = (x, r) => (x ? `${x.status} ${x.sessionId ? x.sessionId.slice(-4) + (r?.secondSessionId ? (x.sessionId === r.firstSessionId ? ' [brew 1]' : x.sessionId === r.secondSessionId ? ' [brew 2]' : '') : '') : '-'} ${x.plannedMs / MIN}m ${x.endsAt ?? 'null'}` : 'null');
const out = [];
const names = { g: '(g) Next brew', a: '(a) pause', b: '(b) add 5', c: '(c) end', d: '(d) no hold', e: '(e) add 5 on a replaced brew', f: '(f) pause on a replaced brew' };
for (const label of labels) {
  const files = readdirSync(dir).filter((f) => f.startsWith(label + '-') && /-[a-g]-\d\d\.json$/.test(f)).sort();
  const byCase = {};
  for (const f of files) { const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); (byCase[j.case] ??= []).push(j); }
  out.push(`#### ${label}`, '', '| case | iterations | pass | fail | exceptions | page errors |', '|---|---|---|---|---|---|');
  for (const [c, rows] of Object.entries(byCase)) out.push(`| ${names[c] ?? c} | ${rows.length} | ${rows.filter((r) => r.pass).length} | ${rows.filter((r) => !r.pass).length} | ${rows.filter((r) => r.exception).length} | ${rows.reduce((n, r) => n + r.pageErrors, 0)} |`);
  out.push('');
  for (const [c, rows] of Object.entries(byCase)) {
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r.checks)))];
    out.push(`**${names[c] ?? c}**, criteria met (of ${rows.length}): ` + keys.map((k) => `${k} ${rows.filter((r) => r.checks[k]).length}`).join('; '), '');
    out.push('| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |', '|---|---|---|---|---|---|---|---|');
    for (const r of rows) {
      const fin = Object.values(r.steps).at(-1);
      const id1 = r.firstSessionId, id2 = r.secondSessionId;
      const n = (arr, id) => (id ? arr.filter((x) => x === id).length : '-');
      const rec = fin ? `${n(fin.A.recordsStored, id1)}/${n(fin.A.recordsStored, id2)}; ${n(fin.A.recordsMemory, id1)}/${n(fin.A.recordsMemory, id2)}; ${n(fin.B.recordsMemory, id1)}/${n(fin.B.recordsMemory, id2)}` : '-';
      const fails = Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k).join(', ') + (r.exception ? ' EXC ' + r.exception.slice(0, 120) : '');
      out.push(`| ${r.iteration} | ${r.pass ? 'pass' : 'FAIL'} | ${cell(fin?.A.memory, r)} | ${cell(fin?.B.memory, r)} | ${cell(fin?.A.stored, r)} | ${cell(fin?.B.stored, r)} | ${rec} | ${fails || '-'} |`);
    }
    out.push('');
  }
}
console.log(out.join('\n'));
