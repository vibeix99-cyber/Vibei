// Pre-render the Focus backdrop stills (engine `window` mode) for every time of day × weather.
// usage (from kettle/, dev server on 5191): node scripts/stills/render-window-stills.mjs
// Writes PNGs to .tmp/stills/; encode to src/scene/stills/*.webp with scripts/stills/encode.py.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const W = 1250, H = 1000; // WINDOW_CAM.aspect = 1.25
const OUT = '.tmp/stills';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const time of ['morning', 'day', 'dusk', 'night']) {
  for (const weather of ['rain', 'snow', 'clear']) {
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await p.goto(`http://localhost:5191/scripts/stills/window.html?w=${W}&h=${H}&time=${time}&weather=${weather}`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
    await p.waitForTimeout(6000);
    await p.screenshot({ path: `${OUT}/window-${time}-${weather}.png`, timeout: 180000, omitBackground: true });
    await p.close();
    console.log('rendered', time, weather);
  }
}
await b.close();
