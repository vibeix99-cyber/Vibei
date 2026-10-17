// R2-failed.mjs <playwright json> : prints "<file>\t<project>\t<regex of the failed/flaky titles>" lines (empty output when nothing failed)
import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const titles = new Set(); const projects = new Set();
const walk = (s) => { for (const sp of s.specs ?? []) for (const t of sp.tests) if (t.status === 'unexpected' || t.status === 'flaky') { titles.add(sp.title); projects.add(t.projectName); } for (const s2 of s.suites ?? []) walk(s2); };
for (const s of j.suites) walk(s);
if (titles.size) console.log([...projects].join(','), '\t', [...titles].map(esc).join('|'));
