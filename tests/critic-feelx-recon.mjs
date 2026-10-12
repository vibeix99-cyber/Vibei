// FEEL critic — recon: what's actually on window.__ARENA in the running build.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 8872);
const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1000, height: 640 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto(`http://127.0.0.1:${PORT}/?quality=${process.env.Q || 'low'}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);

const surface = await page.evaluate(() => {
  const A = window.__ARENA;
  const walk = (o, d = 0, path = '') => {
    if (d > 2 || o == null) return typeof o;
    const out = {};
    for (const k of Object.keys(o)) {
      let v;
      try { v = o[k]; } catch { v = '<throw>'; }
      const t = typeof v;
      if (t === 'function') out[k] = 'fn';
      else if (v && t === 'object' && d < 2) out[k] = Array.isArray(v) ? `array[${v.length}]` : walk(v, d + 1, path + '.' + k);
      else out[k] = t === 'object' ? 'obj' : `${t}:${String(v).slice(0, 40)}`;
    }
    return out;
  };
  return { version: A.version, keys: Object.keys(A), tree: walk(A, 0) };
});
console.log(JSON.stringify(surface, null, 1).slice(0, 12000));
console.log('ERRORS', errors);
await browser.close();
