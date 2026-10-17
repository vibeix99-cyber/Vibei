// node recap-analyze.cjs : for each D pair, 4 BASE captures (before, before2, before3, before4) and 3 AFTER captures
// (after, after2, after3) of the same state; counts pixels differing by more than 2 levels inside the D region (bbox + 10 px)
// for base-vs-base, after-vs-after and after-vs-base pairs. If after-vs-base is no larger than base-vs-base, the D is noise.
const fs = require('fs'), path = require('path');
const { PNG } = require('/home/user/Vibei/kettle/node_modules/playwright-core/lib/utilsBundle.js');
const rows = JSON.parse(fs.readFileSync('logs/diff3.json', 'utf8')).filter((r) => r.cls === 'difference');
const get = (label, r) => {
  const dirs = { before: 'shots3/before', before2: 'shots3/before2', after: 'shots3/after', before3: 'shots3-recap/before3', before4: 'shots3-recap/before4', after2: 'shots3-recap/after2', after3: 'shots3-recap/after3' };
  const p = path.join(dirs[label], r.cfg, r.state + '.png');
  return fs.existsSync(p) ? PNG.sync.read(fs.readFileSync(p)) : null;
};
const mean = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
const out = [];
for (const r of rows) {
  const [bx, by, bw, bh] = r.bbox, pad = 10;
  const imgs = {};
  for (const l of ['before', 'before2', 'before3', 'before4', 'after', 'after2', 'after3']) imgs[l] = get(l, r);
  const W = imgs.before.width, H = imgs.before.height;
  const x0 = Math.max(0, bx - pad), y0 = Math.max(0, by - pad), x1 = Math.min(W, bx + bw + pad), y1 = Math.min(H, by + bh + pad);
  const cnt = (a, b) => { let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4; if (Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])) > 2) n++; } return n; };
  const B = ['before', 'before2', 'before3', 'before4'].filter((l) => imgs[l]), A = ['after', 'after2', 'after3'].filter((l) => imgs[l]);
  const bb = [], aa = [], ab = [];
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) bb.push(cnt(imgs[B[i]], imgs[B[j]]));
  for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) aa.push(cnt(imgs[A[i]], imgs[A[j]]));
  for (const a of A) for (const b of B) ab.push(cnt(imgs[a], imgs[b]));
  out.push({ pair: `${r.cfg}/${r.state}`, captures: { base: B.length, after: A.length }, baseVsBase: { mean: mean(bb), max: Math.max(0, ...bb) }, afterVsAfter: { mean: mean(aa), max: Math.max(0, ...aa) }, afterVsBase: { mean: mean(ab), max: Math.max(0, ...ab) } });
}
fs.writeFileSync('logs/recap-analysis.json', JSON.stringify(out, null, 1));
console.log('| D pair | captures (base/after) | differing px in the D region: base vs base mean (max) | after vs after | after vs base |\n|---|:-:|---|---|---|');
for (const o of out) console.log(`| \`${o.pair}\` | ${o.captures.base}/${o.captures.after} | ${o.baseVsBase.mean} (${o.baseVsBase.max}) | ${o.afterVsAfter.mean} (${o.afterVsAfter.max}) | ${o.afterVsBase.mean} (${o.afterVsBase.max}) |`);
