// node LI-crop.mjs <in.png> <out.png> <x> <y> <w> <h>
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PNG } = require('playwright-core/lib/utilsBundle');
const [i, o, x, y, w, h] = process.argv.slice(2);
const s = PNG.sync.read(fs.readFileSync(i));
const W = Math.min(+w, s.width - +x), H = Math.min(+h, s.height - +y);
const d = new PNG({ width: W, height: H });
PNG.bitblt(s, d, +x, +y, W, H, 0, 0);
fs.writeFileSync(o, PNG.sync.write(d));
console.log(o, W, H, 'of', s.width, s.height);
