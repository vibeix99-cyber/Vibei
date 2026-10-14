// node LI-zoom.mjs <in.png> <out.png> <x> <y> <w> <h> <scale>  (nearest-neighbour)
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PNG } = require('playwright-core/lib/utilsBundle');
const [i, o, x, y, w, h, k] = process.argv.slice(2).map((v, n) => (n < 2 ? v : +v));
const s = PNG.sync.read(fs.readFileSync(i));
const d = new PNG({ width: w * k, height: h * k });
for (let yy = 0; yy < h * k; yy++) for (let xx = 0; xx < w * k; xx++) {
  const sx = x + Math.floor(xx / k), sy = y + Math.floor(yy / k);
  const si = (sy * s.width + sx) * 4, di = (yy * w * k + xx) * 4;
  for (let c = 0; c < 4; c++) d.data[di + c] = sx < s.width && sy < s.height ? s.data[si + c] : 0;
}
fs.writeFileSync(o, PNG.sync.write(d));
