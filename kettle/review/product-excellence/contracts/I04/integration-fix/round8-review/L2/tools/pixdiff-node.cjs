// Pixel diff of same-named PNGs in two directories, decoded in Node (playwright-core's bundled pngjs; no browser).
// A pixel differs when any RGB channel differs by more than 2. Prints JSON lines: file, size, differing pixels, %,
// bounding box (device px). With DIFFDIR, writes a diff image: B dimmed, differing pixels magenta.
//   node pixdiff-node.cjs <dirA> <dirB> [--diffdir <dir>]
const { PNG } = require('playwright-core/lib/utilsBundle');
const fs = require('node:fs');
const [a, b, ...rest] = process.argv.slice(2);
const di = rest.indexOf('--diffdir');
const DIFFDIR = di >= 0 ? rest[di + 1] : null;
if (DIFFDIR) fs.mkdirSync(DIFFDIR, { recursive: true });
const files = fs.readdirSync(a).filter((f) => f.endsWith('.png')).sort();
for (const f of files) {
  if (!fs.existsSync(`${b}/${f}`)) { console.log(JSON.stringify({ file: f, missing: 'B' })); continue; }
  const A = PNG.sync.read(fs.readFileSync(`${a}/${f}`));
  const B = PNG.sync.read(fs.readFileSync(`${b}/${f}`));
  if (A.width !== B.width || A.height !== B.height) { console.log(JSON.stringify({ file: f, size: `${A.width}x${A.height} vs ${B.width}x${B.height}` })); continue; }
  let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  const out = DIFFDIR ? new PNG({ width: A.width, height: A.height }) : null;
  for (let i = 0; i < A.data.length; i += 4) {
    const d = Math.abs(A.data[i] - B.data[i]) > 2 || Math.abs(A.data[i + 1] - B.data[i + 1]) > 2 || Math.abs(A.data[i + 2] - B.data[i + 2]) > 2;
    if (d) { n++; const p = i / 4, x = p % A.width, y = (p / A.width) | 0; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    if (out) { out.data[i] = d ? 255 : B.data[i] * 0.35 + 160; out.data[i + 1] = d ? 0 : B.data[i + 1] * 0.35 + 160; out.data[i + 2] = d ? 255 : B.data[i + 2] * 0.35 + 160; out.data[i + 3] = 255; }
  }
  const total = A.width * A.height;
  if (out && n) fs.writeFileSync(`${DIFFDIR}/${f}`, PNG.sync.write(out));
  console.log(JSON.stringify({ file: f, size: `${A.width}x${A.height}`, diffPx: n, pct: +(100 * n / total).toFixed(3), bbox: n ? [x0, y0, x1, y1] : null }));
}
