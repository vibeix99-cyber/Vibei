// Pause check under the capped loop: canvas changes per second, running vs tab hidden vs visible again.
import { chromium, OUT, boot } from './common.mjs';
import fs from 'node:fs';
const base = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await boot(page, base);
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(3000);
const changes = () => page.evaluate(() => new Promise((res) => { const c = document.querySelector('[data-stage-figure=chai] canvas'); let last = c.toDataURL(), n = 0; const t0 = performance.now(); const iv = setInterval(() => { const d = c.toDataURL(); if (d !== last) n++; last = d; if (performance.now() - t0 > 2000) { clearInterval(iv); res(n); } }, 20); }));
const r = { running: await changes() };
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForTimeout(300); r.hidden = await changes();
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForTimeout(300); r.visibleAgain = await changes();
console.log(JSON.stringify(r)); fs.writeFileSync(`${OUT}/p14-pause.json`, JSON.stringify(r));
await b.close();
