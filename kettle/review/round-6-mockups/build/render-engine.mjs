// node render-engine.mjs <out.png> <w> <h> '<query>'   (dev server on 5191)
import { chromium } from 'playwright';
const [out, w, h, q] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (x) => errs.push(x.message));
await p.goto(`http://localhost:5191/review/round-6-mockups/build/engine.html?w=${w}&h=${h}&${q}`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__ready, null, { timeout: 60000 }); await p.waitForTimeout(7000);
await p.screenshot({ path: out, timeout: 180000, omitBackground: true });
if (errs.length) console.log(errs.slice(0, 3).join('\n')); await b.close(); console.log('wrote', out);
