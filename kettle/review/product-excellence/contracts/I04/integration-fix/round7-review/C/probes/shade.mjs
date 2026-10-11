// Lane C: bottom-edge shade check on 844x390 screenshots (DPR 2). For each PNG, the mean luminance of each 4-device-px
// row band from y0 to the bottom, over columns x0..x1 restricted to pixels that look like the panel background (within
// 12 of the modal colour of the band 60-40 px above the bottom), so text glyphs do not count.
//   node shade.mjs <x0> <x1> <file> [...]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { PNG } = require('/home/user/Vibei/kettle/node_modules/playwright-core/lib/utilsBundle.js');
const [x0, x1, ...files] = process.argv.slice(2);
for (const f of files) {
  const im = PNG.sync.read(readFileSync(f));
  const L = (i) => 0.2126 * im.data[i] + 0.7152 * im.data[i + 1] + 0.0722 * im.data[i + 2];
  // reference background: the most common luminance (rounded) in rows H-120..H-90
  const hist = new Map();
  for (let y = im.height - 120; y < im.height - 90; y++) for (let x = +x0; x < +x1; x++) { const l = Math.round(L((y * im.width + x) * 4)); hist.set(l, (hist.get(l) ?? 0) + 1); }
  const bg = [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const bands = [];
  for (let y = im.height - 60; y < im.height; y += 4) {
    let s = 0, n = 0;
    for (let yy = y; yy < y + 4; yy++) for (let x = +x0; x < +x1; x++) { const l = L((yy * im.width + x) * 4); if (Math.abs(l - bg) < 40) { s += l; n++; } }
    bands.push(n ? +(s / n).toFixed(1) : null);
  }
  const minBand = Math.min(...bands.filter((x) => x != null));
  console.log(JSON.stringify({ file: f.split('/').pop(), bgLum: bg, bottom60pxBands: bands, darkestBandDelta: +(minBand - bg).toFixed(1) }));
}
