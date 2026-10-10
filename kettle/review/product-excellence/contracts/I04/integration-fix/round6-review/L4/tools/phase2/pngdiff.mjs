// pngdiff.mjs <dirA> <dirB> <outJson> <outDiffDir> : per-state pixel difference between two capture dirs (same file names).
// A pixel differs when any channel differs by more than TH (24/255). Reports dims, differing-pixel share, bbox, 40-px tile count.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/user/wt/rv6-r6/kettle/package.json');
const { PNG } = require('playwright-core/lib/utilsBundle');
const [,, A, B, outJson, diffDir] = process.argv;
const TH = 24;
mkdirSync(diffDir, { recursive: true });
const files = readdirSync(A).filter((f) => f.endsWith('.png')).sort();
const rows = [];
for (const f of files) {
  if (!existsSync(`${B}/${f}`)) { rows.push({ file: f, missing: true }); continue; }
  const a = PNG.sync.read(readFileSync(`${A}/${f}`));
  const b = PNG.sync.read(readFileSync(`${B}/${f}`));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  let n = 0, minx = 1e9, miny = 1e9, maxx = -1, maxy = -1;
  const tiles = new Set();
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ia = (y * a.width + x) * 4, ib = (y * b.width + x) * 4, io = (y * w + x) * 4;
    const d = Math.max(Math.abs(a.data[ia] - b.data[ib]), Math.abs(a.data[ia + 1] - b.data[ib + 1]), Math.abs(a.data[ia + 2] - b.data[ib + 2]));
    if (d > TH) {
      n++; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      tiles.add(`${Math.floor(x / 40)},${Math.floor(y / 40)}`);
      out.data[io] = 255; out.data[io + 1] = 0; out.data[io + 2] = 60; out.data[io + 3] = 255;
    } else {
      const g = Math.round((a.data[ia] + a.data[ia + 1] + a.data[ia + 2]) / 3 * 0.35 + 165);
      out.data[io] = out.data[io + 1] = out.data[io + 2] = g; out.data[io + 3] = 255;
    }
  }
  const total = Math.max(a.width * a.height, b.width * b.height);
  const row = { file: f, dimsA: [a.width, a.height], dimsB: [b.width, b.height], sameDims: a.width === b.width && a.height === b.height, diffPx: n, pct: +(100 * n / total).toFixed(3), bbox: n ? [minx, miny, maxx, maxy] : null, tiles: tiles.size };
  rows.push(row);
  if (n) writeFileSync(`${diffDir}/${f}`, PNG.sync.write(out));
}
writeFileSync(outJson, JSON.stringify(rows, null, 1));
console.log(rows.map((r) => `${r.file} ${r.missing ? 'MISSING' : (r.sameDims ? '' : 'DIMS ' + r.dimsA + ' vs ' + r.dimsB + ' ') + r.pct + '% tiles ' + r.tiles}`).join('\n'));
