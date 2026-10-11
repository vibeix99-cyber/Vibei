// side-by-side: R7 | INT | diff, scaled to height 700. node sbs.cjs <R7.png> <INT.png> <diff.png|-> <out.png>
const { PNG } = require('playwright-core/lib/utilsBundle');
const fs = require('node:fs');
const [a, b, c, out] = process.argv.slice(2);
const ims = [a, b, c].filter((x) => x !== '-' && fs.existsSync(x)).map((f) => PNG.sync.read(fs.readFileSync(f)));
const H = 700;
const sc = ims.map((im) => { const h = H, w = Math.round(im.width * H / im.height); const o = new PNG({ width: w, height: h }); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = Math.min(im.width - 1, Math.floor(x * im.width / w)), sy = Math.min(im.height - 1, Math.floor(y * im.height / h)); const si = (sy * im.width + sx) * 4, di = (y * w + x) * 4; for (let k = 0; k < 4; k++) o.data[di + k] = im.data[si + k]; } return o; });
const gap = 8, W = sc.reduce((s, o) => s + o.width, 0) + gap * (sc.length - 1);
const o = new PNG({ width: W, height: H }); o.data.fill(128);
let ox = 0; for (const s of sc) { for (let y = 0; y < H; y++) for (let x = 0; x < s.width; x++) { const si = (y * s.width + x) * 4, di = (y * W + ox + x) * 4; for (let k = 0; k < 4; k++) o.data[di + k] = s.data[si + k]; } ox += s.width + gap; }
fs.writeFileSync(out, PNG.sync.write(o));
