// RF-jsum.mjs <playwright json> [--tests]: per spec file passed / failed / skipped / flaky, totals, and every failed or flaky test with its first error lines
import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const per = {}; const fails = []; const rows = [];
const strip = (s) => String(s ?? '').replace(/\u001b\[[0-9;]*m/g, '');
const walk = (s) => {
  for (const sp of s.specs ?? []) for (const t of sp.tests) {
    const f = sp.file.split('/').pop(); const k = `${f}`;
    per[k] ??= { passed: 0, failed: 0, skipped: 0, flaky: 0, total: 0 };
    const st = t.status; per[k].total++;
    per[k][st === 'expected' ? 'passed' : st === 'unexpected' ? 'failed' : st === 'skipped' ? 'skipped' : 'flaky']++;
    const last = t.results.at(-1);
    rows.push({ file: f, line: sp.line, project: t.projectName, title: sp.title, status: st, ms: last?.duration, retries: t.results.length - 1 });
    if (st === 'unexpected' || st === 'flaky') {
      const errs = t.results.map((r) => strip(r.error?.message ?? r.errors?.[0]?.message ?? '')).filter(Boolean);
      fails.push({ file: f, line: sp.line, project: t.projectName, title: sp.title, status: st, ms: last?.duration, firstError: (errs[0] ?? '').split('\n').slice(0, 6).join(' // ').slice(0, 700), at: strip(last?.error?.location ? `${last.error.location.file.split('/').pop()}:${last.error.location.line}` : '') });
    }
  }
  for (const s2 of s.suites ?? []) walk(s2);
};
for (const s of j.suites) walk(s);
const tot = Object.values(per).reduce((a, p) => ({ passed: a.passed + p.passed, failed: a.failed + p.failed, skipped: a.skipped + p.skipped, flaky: a.flaky + p.flaky, total: a.total + p.total }), { passed: 0, failed: 0, skipped: 0, flaky: 0, total: 0 });
console.log('| Spec file | Passed | Failed | Skipped | Flaky |\n|---|---|---|---|---|');
for (const [k, p] of Object.entries(per).sort()) console.log(`| \`${k}\` | ${p.passed} | ${p.failed ? '**' + p.failed + '**' : 0} | ${p.skipped} | ${p.flaky} |`);
console.log(`| **total (${tot.total})** | **${tot.passed}** | **${tot.failed}** | **${tot.skipped}** | **${tot.flaky}** |`);
console.log('stats', JSON.stringify(j.stats));
for (const f of fails) console.log(`FAIL ${f.status} [${f.project}] ${f.file}:${f.line} (${f.ms} ms) ${f.title}\n     ${f.firstError}  @ ${f.at}`);
if (process.argv.includes('--tests')) for (const r of rows) console.log(`${r.status}\t${r.project}\t${r.file}:${r.line}\t${r.ms}\t${r.title}`);
