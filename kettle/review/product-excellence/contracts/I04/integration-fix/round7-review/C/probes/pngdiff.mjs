// Lane C: INT vs R7 pixel diff of pix.mjs pairs (<job>-INT-<name>.png vs <job>-R7-<name>.png), decoded in node with the
// PNG codec bundled in playwright-core (no browser). Counts pixels with any channel differing by > 2 and by > 24, the
// bounding box (device px), and writes <diffdir>/<job>-<name>.png: the R7 image dimmed, differing (> 2) pixels magenta.
//   node pngdiff.mjs <dir> <diffdir> [substring ...]
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { PNG } = require('/home/user/Vibei/kettle/node_modules/playwright-core/lib/utilsBundle.js');
const [dir, diffdir, ...subs] = process.argv.slice(2);
mkdirSync(diffdir, { recursive: true });
const files = readdirSync(dir).filter((f) => f.includes('-INT-') && f.endsWith('.png') && (!subs.length || subs.some((s) => f.includes(s)))).sort();
const rows = [];
for (const fa of files) {
  const fb = fa.replace('-INT-', '-R7-');
  let a, b;
  try { a = PNG.sync.read(readFileSync(`${dir}/${fa}`)); b = PNG.sync.read(readFileSync(`${dir}/${fb}`)); } catch (e) { rows.push({ pair: fa.replace('-INT-', '-*-'), error: String(e).slice(0, 80) }); continue; }
  if (a.width !== b.width || a.height !== b.height) { rows.push({ pair: fa.replace('-INT-', '-*-'), size: `${a.width}x${a.height} vs ${b.width}x${b.height}` }); continue; }
  const out = new PNG({ width: b.width, height: b.height });
  let n2 = 0, n24 = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
    const i = (y * a.width + x) * 4;
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d > 2) { n2++; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 255; out.data[i + 3] = 255; }
    else { out.data[i] = b.data[i] * 0.35 + 160; out.data[i + 1] = b.data[i + 1] * 0.35 + 160; out.data[i + 2] = b.data[i + 2] * 0.35 + 160; out.data[i + 3] = 255; }
    if (d > 24) n24++;
  }
  const name = fa.replace('-INT-', '-');
  if (n2) writeFileSync(`${diffdir}/${name}`, PNG.sync.write(out));
  rows.push({ pair: name, px: a.width * a.height, diffGt2: n2, diffGt24: n24, pctGt24: +((100 * n24) / (a.width * a.height)).toFixed(3), bbox: n2 ? [x0, y0, x1, y1] : null });
}
for (const r of rows) console.log(JSON.stringify(r));
