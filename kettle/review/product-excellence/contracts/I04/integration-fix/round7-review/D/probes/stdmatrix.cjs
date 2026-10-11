// node stdmatrix.cjs <std root> <diff jsonl dir out>  : runs pixdiff per complete pair, prints a state x config matrix (markdown)
const fs = require('node:fs'); const cp = require('node:child_process');
const [root] = process.argv.slice(2);
const cfgs = fs.readdirSync(`${root}/INT`).filter((c) => fs.existsSync(`${root}/INT/${c}/freeze.json`) && fs.existsSync(`${root}/R7/${c}/freeze.json`)).sort();
const res = {};
for (const c of cfgs) {
  const out = cp.execFileSync('node', [`${__dirname}/pixdiff-node.cjs`, `${root}/R7/${c}`, `${root}/INT/${c}`, '--diffdir', `${root}/../diff-std/${c}`], { encoding: 'utf8' });
  res[c] = Object.fromEntries(out.trim().split('\n').map((l) => JSON.parse(l)).map((x) => [x.file.replace('.png', ''), x]));
}
const states = [...new Set(Object.values(res).flatMap((r) => Object.keys(r)))].sort();
let md = `| State | ${cfgs.join(' | ')} |\n|---|${cfgs.map(() => '---').join('|')}|\n`;
for (const s of states) md += `| ${s} | ${cfgs.map((c) => { const x = res[c][s]; return !x ? 'n/a' : x.missing ? 'missing ' + x.missing : x.pct === undefined ? 'SIZE ' + x.size : x.pct; }).join(' | ')} |\n`;
console.log(md);
fs.writeFileSync(`${root}/../std-diff.json`, JSON.stringify(res, null, 1));
