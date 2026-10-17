// node diff3.cjs <shotsRoot> <outJson> <cropDir> : <shotsRoot>/{before,after,before2}/<cfg>/<state>.png
// Per pair: AFTER vs BEFORE (exact), and the noise floor BEFORE vs BEFORE2 (the same base recaptured). A pixel counts as a
// real difference only if AFTER differs from both base captures and lies outside the noise region (pixels where the two
// base captures differ, grown by RADIUS px). identical = 0 differing px; within noise = differing px, none real;
// difference = real px (crop written: BEFORE | AFTER | mask, real red, noise grey).
const fs = require('fs');
const path = require('path');
const { PNG } = require('/home/user/Vibei/kettle/node_modules/playwright-core/lib/utilsBundle.js');
const [root, outJson, cropDir] = process.argv.slice(2);
const RADIUS = 6;
const TOL = 2; // levels of 255: below this a pixel is not called a difference (the base shows up to this against itself: shadow dithering)
// The session timer's readout counts down in real time (a second boundary falls differently in each capture): its rectangle,
// as recorded at capture time, is left out of the comparison and counted apart (maskedPx).
const maskRects = {};
for (const f of fs.readdirSync(root).filter((x) => x.startsWith('facts-'))) for (const e of JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'))) if (e.readout && e.readout.length) (maskRects[e.cfg + '/' + e.state] = maskRects[e.cfg + '/' + e.state] || []).push(...e.readout);
const read = (p) => PNG.sync.read(fs.readFileSync(p));
const rows = [];
const cfgs = fs.readdirSync(path.join(root, 'before')).filter((d) => fs.statSync(path.join(root, 'before', d)).isDirectory()).sort();
const dl = (da, db, i) => Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]), Math.abs(da[i + 3] - db[i + 3]));
for (const cfg of cfgs) for (const f of fs.readdirSync(path.join(root, 'before', cfg)).filter((x) => x.endsWith('.png')).sort()) {
  const pa = path.join(root, 'after', cfg, f), p2 = path.join(root, 'before2', cfg, f), p1 = path.join(root, 'before', cfg, f);
  const state = f.slice(0, -4);
  if (!fs.existsSync(pa)) { rows.push({ cfg, state, missing: 'after' }); continue; }
  const b1 = read(p1), a = read(pa), b2 = fs.existsSync(p2) ? read(p2) : null;
  const W = b1.width, H = b1.height;
  const row = { cfg, state, size: [W, H] };
  if (a.width !== W || a.height !== H) { row.sizeDiff = [a.width, a.height]; rows.push(row); continue; }
  const d1 = b1.data, da = a.data, d2 = b2 && b2.width === W && b2.height === H ? b2.data : null;
  let n = 0, nn = 0, masked = 0, nmax = 0, nbig = 0;
  const mk = new Uint8Array(W * H);
  for (const [rx, ry, rw, rh] of maskRects[cfg + '/' + state] || []) for (let y = Math.max(0, ry - 4); y < Math.min(H, ry + rh + 4); y++) for (let x = Math.max(0, rx - 4); x < Math.min(W, rx + rw + 4); x++) mk[y * W + x] = 1;
  const noise = new Uint8Array(W * H), diffA = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) {
    const i = k * 4;
    if (mk[k]) { if (dl(d1, da, i)) masked++; continue; }
    if (dl(d1, da, i)) { diffA[k] = 1; n++; }
    if (d2) { const q = dl(d1, d2, i); if (q) { noise[k] = 1; nn++; if (q > nmax) nmax = q; if (q > TOL) nbig++; } }
  }
  row.px = n; row.noisePx = d2 ? nn : null; row.maskedPx = masked; row.noiseMax = nmax; row.noiseBig = nbig;
  // grow the noise mask by RADIUS (separable box)
  let grown = noise;
  if (d2 && nn) {
    const tmp = new Uint8Array(W * H), g = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) { let last = -1e9; for (let x = 0; x < W; x++) { if (noise[y * W + x]) last = x; if (x - last <= RADIUS) tmp[y * W + x] = 1; } last = 1e9; for (let x = W - 1; x >= 0; x--) { if (noise[y * W + x]) last = x; if (last - x <= RADIUS) tmp[y * W + x] = 1; } }
    for (let x = 0; x < W; x++) { let last = -1e9; for (let y = 0; y < H; y++) { if (tmp[y * W + x]) last = y; if (y - last <= RADIUS) g[y * W + x] = 1; } last = 1e9; for (let y = H - 1; y >= 0; y--) { if (tmp[y * W + x]) last = y; if (last - y <= RADIUS) g[y * W + x] = 1; } }
    grown = g;
  }
  let real = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  const realMask = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) {
    if (!diffA[k] || grown[k]) continue;
    const i = k * 4;
    const d = dl(d1, da, i);
    if (d <= TOL) continue;
    if (d2 && dl(da, d2, i) <= TOL) continue; // AFTER equals the second base capture here: not a difference
    real++; realMask[k] = 1;
    if (d > max) max = d;
    const x = k % W, y = (k / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  row.real = real; row.maxDelta = max;
  row.cls = n === 0 ? 'identical' : real === 0 ? 'within-noise' : 'difference';
  row.noiseClass = !d2 ? 'n/a' : nn === 0 ? 'base identical to base' : 'base differs from base';
  if (real) {
    row.bbox = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
    const pad = 30, cx = Math.max(0, x0 - pad), cy = Math.max(0, y0 - pad);
    const cw = Math.min(W - cx, x1 - x0 + 1 + 2 * pad, 900), ch = Math.min(H - cy, y1 - y0 + 1 + 2 * pad, 700), gap = 8;
    const out = new PNG({ width: cw * 3 + gap * 2, height: ch }); out.data.fill(255);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const k = (cy + y) * W + (cx + x), s = k * 4;
      for (const [j, src] of [[0, d1], [1, da]]) { const o = (y * out.width + j * (cw + gap) + x) * 4; for (let c = 0; c < 4; c++) out.data[o + c] = src[s + c]; }
      const o = (y * out.width + 2 * (cw + gap) + x) * 4;
      let rgb = [255 - Math.round((255 - d1[s]) * 0.3), 255 - Math.round((255 - d1[s + 1]) * 0.3), 255 - Math.round((255 - d1[s + 2]) * 0.3)];
      if (grown[k] && diffA[k]) rgb = [170, 170, 170];
      if (realMask[k]) rgb = [230, 20, 20];
      out.data[o] = rgb[0]; out.data[o + 1] = rgb[1]; out.data[o + 2] = rgb[2]; out.data[o + 3] = 255;
    }
    const dir = path.join(cropDir, cfg); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, f), PNG.sync.write(out)); row.crop = `${cfg}/${f}`;
  }
  rows.push(row);
}
fs.writeFileSync(outJson, JSON.stringify(rows, null, 1));
const by = (c) => rows.filter((r) => r.cls === c).length;
const withNoise = rows.filter((r) => r.noisePx != null);
console.log(`${rows.length} pairs: identical ${by('identical')}, within noise ${by('within-noise')}, difference ${by('difference')}, missing/size ${rows.filter((r) => r.missing || r.sizeDiff).length}`);
console.log(`noise floor (BEFORE vs BEFORE2): ${withNoise.filter((r) => r.noisePx === 0).length}/${withNoise.length} states pixel-identical; max differing px ${Math.max(0, ...withNoise.map((r) => r.noisePx))}; median ${withNoise.map((r) => r.noisePx).sort((x, y) => x - y)[withNoise.length >> 1]}`);
for (const r of rows.filter((r) => r.cls === 'difference' || r.missing || r.sizeDiff)) console.log(`  ${r.cfg}/${r.state} ${r.cls || (r.missing ? 'missing ' + r.missing : 'size ' + r.sizeDiff)} px=${r.px} noisePx=${r.noisePx} real=${r.real} max=${r.maxDelta} bbox=${JSON.stringify(r.bbox)}`);
