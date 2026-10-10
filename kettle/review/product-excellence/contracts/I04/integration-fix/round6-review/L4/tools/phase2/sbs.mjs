// sbs.mjs <R6.png> <BEFORE.png> <diff.png> <out.png> [x0 y0 x1 y1]   three panels (R6 | BEFORE | diff), cropped to the diff box
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/user/wt/rv6-r6/kettle/package.json');
const { PNG } = require('playwright-core/lib/utilsBundle');
const [,, fa, fb, fd, out, ...box] = process.argv;
const A = PNG.sync.read(readFileSync(fa)), B = PNG.sync.read(readFileSync(fb)), D = PNG.sync.read(readFileSync(fd));
let [x0, y0, x1, y1] = box.length === 4 ? box.map(Number) : [0, 0, Math.min(A.width, B.width) - 1, Math.min(A.height, B.height) - 1];
const M = 30;
x0 = Math.max(0, x0 - M); y0 = Math.max(0, y0 - M); x1 = Math.min(Math.min(A.width, B.width) - 1, x1 + M); y1 = Math.min(Math.min(A.height, B.height) - 1, y1 + M);
const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
const scale = Math.min(1, 1900 / (3 * cw + 20), 1500 / ch);
const pw = Math.max(1, Math.floor(cw * scale)), ph = Math.max(1, Math.floor(ch * scale));
const W = pw * 3 + 20, H = ph;
const o = new PNG({ width: W, height: H });
for (let i = 0; i < o.data.length; i += 4) { o.data[i] = o.data[i + 1] = o.data[i + 2] = 90; o.data[i + 3] = 255; }
const put = (img, ox) => {
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    // box average over the source cell
    const sx0 = x0 + Math.floor(x / scale), sy0 = y0 + Math.floor(y / scale), sx1 = Math.max(sx0 + 1, x0 + Math.floor((x + 1) / scale)), sy1 = Math.max(sy0 + 1, y0 + Math.floor((y + 1) / scale));
    let r = 0, g = 0, b = 0, n = 0;
    for (let sy = sy0; sy < sy1 && sy < img.height; sy++) for (let sx = sx0; sx < sx1 && sx < img.width; sx++) { const i = (sy * img.width + sx) * 4; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++; }
    if (!n) continue;
    const io = (y * W + ox + x) * 4; o.data[io] = r / n; o.data[io + 1] = g / n; o.data[io + 2] = b / n; o.data[io + 3] = 255;
  }
};
put(A, 0); put(B, pw + 10); put(D, 2 * pw + 20);
writeFileSync(out, PNG.sync.write(o));
console.log(`${out} ${W}x${H} crop ${x0},${y0}-${x1},${y1} scale ${scale.toFixed(2)}`);
