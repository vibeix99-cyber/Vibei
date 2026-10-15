import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const c = {};
const walk = (s) => { for (const sp of s.specs ?? []) for (const t of sp.tests) { const k = t.projectName; c[k] ??= { passed: 0, failed: 0, skipped: 0, flaky: 0 }; const st = t.status; c[k][st === 'expected' ? 'passed' : st === 'unexpected' ? 'failed' : st === 'skipped' ? 'skipped' : 'flaky']++; } for (const s2 of s.suites ?? []) walk(s2); };
for (const s of j.suites) walk(s);
console.log(process.argv[2].split('/').pop(), JSON.stringify(c), 'stats', JSON.stringify(j.stats));
