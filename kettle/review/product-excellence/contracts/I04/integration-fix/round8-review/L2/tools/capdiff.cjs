// Lane 2: pixel-diff every R8/INT pair under a captures root (node only, no browser). Writes <out>.jsonl (every pair)
// and diff images (pairs over 0 %) into <diffdir>/<cfg>/; prints a per-pair markdown table and a per-state summary.
//   node capdiff.cjs <root with R8/ and INT/> <out.jsonl> <diffdir>
const fs = require('node:fs'); const cp = require('node:child_process');
const [root, outJ, dd] = process.argv.slice(2);
const cfgs = fs.readdirSync(`${root}/R8`).sort();
const rows = [];
for (const c of cfgs) {
  if (!fs.existsSync(`${root}/INT/${c}`)) { rows.push({ cfg: c, missing: 'INT dir' }); continue; }
  const out = cp.execFileSync('node', [`${__dirname}/pixdiff-node.cjs`, `${root}/R8/${c}`, `${root}/INT/${c}`, '--diffdir', `${dd}/${c}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  for (const l of out.trim().split('\n').filter(Boolean)) rows.push({ cfg: c, ...JSON.parse(l) });
  // files only on INT
  for (const f of fs.readdirSync(`${root}/INT/${c}`).filter((f) => f.endsWith('.png'))) if (!fs.existsSync(`${root}/R8/${c}/${f}`)) rows.push({ cfg: c, file: f, missing: 'R8' });
}
fs.writeFileSync(outJ, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
const st = {};
for (const r of rows) { const s = (r.file ?? '').replace('.png', ''); (st[s] ??= []).push(r); }
let md = '| State | Pairs | Identical | Under 0.5 % | Over 0.5 % | Other | Range over 0 % |\n|---|---|---|---|---|---|---|\n';
for (const [s, rs] of Object.entries(st).sort()) {
  const num = rs.filter((r) => r.pct !== undefined);
  const nz = num.filter((r) => r.pct > 0).map((r) => r.pct);
  md += `| ${s} | ${rs.length} | ${num.filter((r) => r.pct === 0).length} | ${num.filter((r) => r.pct > 0 && r.pct <= 0.5).length} | ${num.filter((r) => r.pct > 0.5).length} | ${rs.length - num.length} | ${nz.length ? Math.min(...nz) + ' to ' + Math.max(...nz) + ' %' : '-'} |\n`;
}
console.log(md);
console.log('\n| Config | State | % | bbox (device px) |\n|---|---|---|---|');
for (const r of rows) console.log(`| ${r.cfg} | ${(r.file ?? '').replace('.png', '')} | ${r.pct ?? (r.missing ? 'missing ' + r.missing : 'SIZE ' + r.size)} | ${r.bbox ? r.bbox.join(',') : ''} |`);
