// Lane C: stack the bottom N device px of several PNGs (same width) into one PNG.  node crop.mjs <out.png> <N> <png> [...]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { PNG } = require('/home/user/Vibei/kettle/node_modules/playwright-core/lib/utilsBundle.js');
const [out, N, ...files] = process.argv.slice(2);
const ims = files.map((f) => PNG.sync.read(readFileSync(f)));
const w = ims[0].width, n = +N;
const o = new PNG({ width: w, height: (n + 6) * ims.length });
o.data.fill(255);
ims.forEach((im, k) => { for (let y = 0; y < n; y++) for (let x = 0; x < w; x++) { const si = ((im.height - n + y) * im.width + x) * 4, di = ((k * (n + 6) + y) * w + x) * 4; for (let c = 0; c < 4; c++) o.data[di + c] = im.data[si + c]; } });
writeFileSync(out, PNG.sync.write(o));
