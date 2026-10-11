// mean luminance of the top-bar band (device px y 40-200, x 48-1510) and of the controls row, to tell zen (chrome hidden) from awake
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire('/home/user/wt/rv7-r7/kettle/.tmp/C/x.mjs');
const { PNG } = require('/home/user/Vibei/kettle/node_modules/playwright-core/lib/utilsBundle.js');
for (const f of process.argv.slice(2)) { const im = PNG.sync.read(readFileSync(f)); let s = 0, n = 0, s2 = 0; for (let y = 40; y < 200; y++) for (let x = 48; x < im.width - 48; x++) { const i = (y * im.width + x) * 4; const l = 0.2126 * im.data[i] + 0.7152 * im.data[i + 1] + 0.0722 * im.data[i + 2]; s += l; s2 += l * l; n++; } const m = s / n; console.log(f.split('/').pop(), 'topband mean', m.toFixed(1), 'sd', Math.sqrt(s2 / n - m * m).toFixed(1)); }
