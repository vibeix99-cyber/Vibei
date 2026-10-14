// Lane I: BEFORE | AFTER side by side, full size, sliced into parts of <slice> px (no browser).
//   node LI-pair.mjs <before.png> <after.png> <outPrefix> [slice=2400]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PNG } = require('playwright-core/lib/utilsBundle');
const [b, a, prefix, sliceArg = '2400'] = process.argv.slice(2);
const B = PNG.sync.read(fs.readFileSync(b)), A = PNG.sync.read(fs.readFileSync(a));
const GAP = 12, slice = +sliceArg, H = Math.max(B.height, A.height), W = B.width + GAP + A.width;
const parts = Math.ceil(H / slice);
for (let p = 0; p < parts; p++) {
  const y0 = p * slice, h = Math.min(slice, H - y0);
  const d = new PNG({ width: W, height: h });
  for (let i = 0; i < d.data.length; i += 4) { d.data[i] = 255; d.data[i + 1] = 0; d.data[i + 2] = 255; d.data[i + 3] = 255; } // magenta = no content
  if (y0 < B.height) PNG.bitblt(B, d, 0, y0, B.width, Math.min(h, B.height - y0), 0, 0);
  if (y0 < A.height) PNG.bitblt(A, d, 0, y0, A.width, Math.min(h, A.height - y0), B.width + GAP, 0);
  fs.writeFileSync(`${prefix}-part${String(p + 1).padStart(2, '0')}.png`, PNG.sync.write(d));
}
console.log(prefix, parts, 'parts', B.width, B.height, A.width, A.height);
