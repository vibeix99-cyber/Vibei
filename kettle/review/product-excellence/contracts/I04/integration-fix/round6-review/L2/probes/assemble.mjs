import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const R = '/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L2';
const vars = JSON.parse(readFileSync('vars.json', 'utf8'));
const sums = Object.fromEntries(readFileSync(`${R}/probes/SHA256SUMS.txt`, 'utf8').trim().split('\n').map((l) => { const [h, n] = l.split(/\s+/); return [n, h.slice(0, 16)]; }));
const fill = (s) => s.replace(/\{sha:([^}]+)\}/g, (_, n) => sums[n] ?? `?${n}`).replace(/\{\{([A-Z0-9]+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
const inc = (s) => s.replace(/\{\{include:([^}]+)\}\}/g, (_, f) => {
  if (f === 'runs-table.md') return fill(readFileSync('runs-table.tmpl.md', 'utf8'));
  return readFileSync(`${R}/analysis/${f}`, 'utf8');
});
let t = readFileSync('RECEIPT.template.md', 'utf8');
t = t.replace('{{ISSUES}}', fill(readFileSync('issues.tmpl.md', 'utf8')));
t = inc(t);
t = fill(t);
writeFileSync(`${R}/RECEIPT.md`, t);
const left = [...t.matchAll(/\{\{[A-Z0-9]+\}\}|\?[a-z0-9.\-]+\.(mjs|sh)/g)].map((m) => m[0]);
console.log('unfilled:', [...new Set(left)].join(', ') || 'none');
