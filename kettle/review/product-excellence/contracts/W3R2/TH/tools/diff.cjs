// node diff.cjs <dirA> <dirB> <outJson> [cropDir]
// Pixel-diffs every <cfg>/<state>.png present in both trees (exact: any channel differs). For a differing pair writes a
// crop of the differing region: A | B | mask (differing pixels red over a faded A) to cropDir/<cfg>/<state>.png.
const fs = require('fs');
const path = require('path');
const { PNG } = require('/home/user/Vibei/kettle/node_modules/playwright-core/lib/utilsBundle.js');
const [A, B, outJson, cropDir] = process.argv.slice(2);
const read = (p) => PNG.sync.read(fs.readFileSync(p));
const rows = [];
const cfgs = fs.readdirSync(A).filter((d) => fs.statSync(path.join(A, d)).isDirectory()).sort();
for (const cfg of cfgs) {
  if (!fs.existsSync(path.join(B, cfg))) continue;
  for (const f of fs.readdirSync(path.join(A, cfg)).filter((x) => x.endsWith('.png')).sort()) {
    const pb = path.join(B, cfg, f);
    if (!fs.existsSync(pb)) { rows.push({ cfg, state: f.slice(0, -4), missingB: true }); continue; }
    const a = read(path.join(A, cfg, f)), b = read(pb);
    const row = { cfg, state: f.slice(0, -4), a: [a.width, a.height], b: [b.width, b.height] };
    if (a.width !== b.width || a.height !== b.height) { row.sizeDiff = true; row.px = -1; rows.push(row); continue; }
    let n = 0, big = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    const W = a.width, H = a.height, da = a.data, db = b.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]), Math.abs(da[i + 3] - db[i + 3]));
      if (d) { n++; if (d > 16) big++; if (d > max) max = d; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    row.px = n; row.big = big; row.maxDelta = max;
    if (n) {
      row.bbox = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
      if (cropDir) {
        const pad = 24;
        const cx = Math.max(0, x0 - pad), cy = Math.max(0, y0 - pad);
        const cw = Math.min(W - cx, x1 - x0 + 1 + 2 * pad, 900), ch = Math.min(H - cy, y1 - y0 + 1 + 2 * pad, 700);
        const gap = 8, out = new PNG({ width: cw * 3 + gap * 2, height: ch });
        out.data.fill(255);
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
          const s = ((cy + y) * W + (cx + x)) * 4;
          for (const [k, src] of [[0, da], [1, db]]) {
            const o = (y * out.width + k * (cw + gap) + x) * 4;
            for (let c = 0; c < 4; c++) out.data[o + c] = src[s + c];
          }
          const o = (y * out.width + 2 * (cw + gap) + x) * 4;
          const diffPx = Math.max(Math.abs(da[s] - db[s]), Math.abs(da[s + 1] - db[s + 1]), Math.abs(da[s + 2] - db[s + 2]), Math.abs(da[s + 3] - db[s + 3]));
          if (diffPx) { out.data[o] = 230; out.data[o + 1] = 20; out.data[o + 2] = 20; out.data[o + 3] = 255; }
          else { for (let c = 0; c < 3; c++) out.data[o + c] = 255 - Math.round((255 - da[s + c]) * 0.35); out.data[o + 3] = 255; }
        }
        const dir = path.join(cropDir, cfg); fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, f), PNG.sync.write(out));
        row.crop = path.join(cfg, f);
      }
    }
    rows.push(row);
  }
}
fs.writeFileSync(outJson, JSON.stringify(rows, null, 1));
const diff = rows.filter((r) => r.px !== 0);
console.log(`${rows.length} pairs; identical ${rows.length - diff.length}; differing ${diff.length}`);
for (const r of diff.slice(0, 60)) console.log(`  ${r.cfg}/${r.state} px=${r.px} big=${r.big} max=${r.maxDelta} bbox=${JSON.stringify(r.bbox)}${r.sizeDiff ? ' SIZE ' + r.a + ' vs ' + r.b : ''}`);
