#!/usr/bin/env node
/**
 * Summarise review/test-results/results.json (functional suite) for a round report.
 *   node review/summarize.mjs [results.json] [--all]
 * Prints pass/fail per test with the first error line and notable annotations
 * (hmr-during-test → likely infra, axe-minor, tap-targets<44).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? join(here, 'test-results', 'results.json');
const showAll = process.argv.includes('--all');
const data = JSON.parse(readFileSync(file, 'utf8'));
const strip = (s) => String(s ?? '').replace(/\x1b\[[0-9;]*m/g, '');
const rows = [];
const walk = (suite, trail) => {
  for (const s of suite.suites ?? []) walk(s, [...trail, s.title]);
  for (const spec of suite.specs ?? [])
    for (const t of spec.tests ?? []) {
      const r = t.results?.[t.results.length - 1] ?? {};
      const err = strip(r.error?.message ?? r.errors?.[0]?.message ?? '').split('\n').filter(Boolean).slice(0, 2).join(' / ');
      rows.push({ title: [...trail.filter(Boolean).slice(1), spec.title].join(' › '), status: r.status ?? t.status, ms: r.duration ?? 0, err, ann: t.annotations ?? [] });
    }
};
walk(data, []);
const counts = rows.reduce((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {});
console.log(`Functional: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')} (${rows.length} tests)\n`);
for (const r of rows) {
  if (r.status === 'passed' && !showAll && !r.ann.length) continue;
  const mark = r.status === 'passed' ? 'PASS' : r.status === 'skipped' ? 'SKIP' : 'FAIL';
  console.log(`${mark}  ${r.title}${r.err ? `\n      ${r.err.slice(0, 260)}` : ''}`);
  for (const a of r.ann) console.log(`      [${a.type}] ${String(a.description ?? '').split('\n').slice(0, 4).join(' | ').slice(0, 260)}`);
}
