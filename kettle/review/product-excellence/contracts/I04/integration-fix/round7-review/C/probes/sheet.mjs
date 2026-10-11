// Lane C: contact sheet of clip frames (every Nth PNG frame, downscaled by an integer factor, tiled C per row), with
// the frame index burned in as a small bar code-free label strip (index printed to stdout instead).
//   node sheet.mjs <out.png> <every> <scale> <cols> <frame.png> [...]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { PNG } = require('/home/user/Vibei/kettle/node_modules/playwright-core/lib/utilsBundle.js');
const [out, every, scale, cols, ...all] = process.argv.slice(2);
const files = all.filter((_, i) => i % +every === 0);
const first = PNG.sync.read(readFileSync(files[0]));
const w = Math.floor(first.width / +scale), h = Math.floor(first.height / +scale);
const C = +cols, R = Math.ceil(files.length / C);
const sheet = new PNG({ width: C * (w + 4), height: R * (h + 4) });
sheet.data.fill(255);
files.forEach((f, k) => {
  const im = PNG.sync.read(readFileSync(f));
  const ox = (k % C) * (w + 4), oy = Math.floor(k / C) * (h + 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = ((y * +scale) * im.width + x * +scale) * 4, di = ((oy + y) * sheet.width + ox + x) * 4;
    sheet.data[di] = im.data[si]; sheet.data[di + 1] = im.data[si + 1]; sheet.data[di + 2] = im.data[si + 2]; sheet.data[di + 3] = 255;
  }
});
writeFileSync(out, PNG.sync.write(sheet));
console.log(`${files.length} frames: ${files.map((f) => f.split('/').pop()).join(' ')}`);
