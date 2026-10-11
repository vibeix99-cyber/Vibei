// Lane 2 supplement (node only): R8 (this session) against Lane D's round-7 R7 b39202f captures (cap-d, same script,
// same fixed instant, different session) and INT(this session) against Lane D's INT. Prints one table row per config/state.
//   node r7cross.cjs <my capd root> <Lane D captures root> <out.jsonl>
const fs = require('node:fs'); const cp = require('node:child_process');
const [mine, laneD, outJ] = process.argv.slice(2);
const rows = [];
for (const c of fs.readdirSync(`${mine}/R8`).sort()) {
  for (const [a, b, tag] of [[`${mine}/R8/${c}`, `${laneD}/R7/${c}`, 'R8vsR7'], [`${mine}/INT/${c}`, `${laneD}/INT/${c}`, 'INTvsINT']]) {
    if (!fs.existsSync(b) || !fs.existsSync(a)) { rows.push({ cfg: c, tag, missing: 'dir' }); continue; }
    const out = cp.execFileSync('node', [`${__dirname}/pixdiff-node.cjs`, a, b], { encoding: 'utf8', maxBuffer: 1 << 26 });
    for (const l of out.trim().split('\n').filter(Boolean)) rows.push({ cfg: c, tag, ...JSON.parse(l) });
  }
}
fs.writeFileSync(outJ, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
const cfgs = [...new Set(rows.map((r) => r.cfg))];
const states = [...new Set(rows.filter((r) => r.file).map((r) => r.file.replace('.png', '')))].sort();
for (const tag of ['R8vsR7', 'INTvsINT']) {
  console.log(`\n${tag}\n| State | ${cfgs.join(' | ')} |\n|---|${cfgs.map(() => '---').join('|')}|`);
  for (const s of states) console.log(`| ${s} | ${cfgs.map((c) => { const r = rows.find((x) => x.tag === tag && x.cfg === c && x.file === s + '.png'); const d = rows.find((x) => x.tag === tag && x.cfg === c && x.missing === 'dir'); return d ? 'no Lane D dir' : !r ? '-' : r.missing ? 'only ' + (r.missing === 'B' ? 'mine' : 'Lane D') : r.pct === undefined ? 'SIZE' : r.pct; }).join(' | ')} |`);
}
