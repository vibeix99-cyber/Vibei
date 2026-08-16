// FEEL critic (w) — recon: what is on __ARENA, and what does one turn emit.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 8921);
const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

console.log(await page.evaluate(() => {
  const A = window.__ARENA;
  const keys = (o) => { try { return Object.keys(o).join(','); } catch { return '?'; } };
  return {
    version: A.version,
    top: keys(A),
    battle: keys(A.battle),
    stage: keys(A.stage || {}),
    app: keys(A.app || {}),
    textbox: keys(A.textbox || {}),
    audioK: keys(A.audio || {}),
    perf: A.perf,
  };
}));
console.log('ERR', errors.slice(0, 5));
await browser.close();
