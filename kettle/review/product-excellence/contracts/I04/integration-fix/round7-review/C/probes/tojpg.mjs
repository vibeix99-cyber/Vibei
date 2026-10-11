// Lane C: full-size PNG -> JPEG (quality 88) for the receipt folder (size budget), with the PNG codec and jpeg-js bundled
// in playwright-core. Pixel diffs are always computed on the original PNGs (kept in the scratch directory).
//   node tojpg.mjs <outdir> <png> [...]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
const require = createRequire(import.meta.url);
const { PNG, jpegjs } = require('/home/user/Vibei/kettle/node_modules/playwright-core/lib/utilsBundle.js');
const [out, ...files] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
for (const f of files) {
  const im = PNG.sync.read(readFileSync(f));
  const jpg = jpegjs.encode({ data: im.data, width: im.width, height: im.height }, 88);
  writeFileSync(`${out}/${basename(f).replace(/\.png$/, '.jpg')}`, jpg.data);
}
console.log(`converted ${files.length}`);
