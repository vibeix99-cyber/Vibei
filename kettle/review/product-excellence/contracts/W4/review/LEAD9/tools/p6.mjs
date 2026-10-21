// Failure paths: wasm abort / wasm corrupt (compile error) / wasm 404 / riv corrupt. Any non-local request is aborted and logged.
import { chromium, OUT, boot, state } from './common.mjs';
import fs from 'node:fs';
const base = process.argv[2];
const b = await chromium.launch();
const results = {};
for (const mode of ['ok', 'wasm-abort', 'wasm-garbage', 'wasm-404', 'wasm-truncated', 'riv-garbage']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const ext = []; const all = [];
  ctx.on('request', (r) => all.push(r.url()));
  await ctx.route('**/*', async (route) => {
    const u = route.request().url();
    if (!u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:')) { ext.push(u); return route.abort(); }
    if (/\/rive-[^/]*\.wasm/.test(u)) {
      if (mode === 'wasm-abort') return route.abort();
      if (mode === 'wasm-garbage') return route.fulfill({ status: 200, contentType: 'application/wasm', body: Buffer.from('this is not wasm at all'.repeat(100)) });
      if (mode === 'wasm-404') return route.fulfill({ status: 404, body: 'nope' });
      if (mode === 'wasm-truncated') { const r = await route.fetch(); const buf = await r.body(); return route.fulfill({ status: 200, contentType: 'application/wasm', body: buf.subarray(0, 4096) }); }
    }
    if (/\/chai-[^/]*\.riv/.test(u) && mode === 'riv-garbage') return route.fulfill({ status: 200, body: Buffer.from('RIVE garbage '.repeat(50)) });
    return route.continue();
  });
  const page = await ctx.newPage();
  const cons = []; page.on('console', (m) => { if (/wasm|rive|fallback/i.test(m.text())) cons.push(m.type() + ': ' + m.text().slice(0, 160)); });
  await boot(page, base);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(5000);
  const s = await state(page);
  const vis = await page.evaluate(() => { const i = document.querySelector('[data-stage-figure=chai] img'); return i && i.complete && i.naturalWidth > 0 && getComputedStyle(i).visibility; });
  results[mode] = { stage: s, imgVisibleLoaded: vis, externalRequests: ext, wasmRequests: all.filter((u) => /wasm/.test(u)), console: cons.slice(0, 6) };
  console.log(mode, JSON.stringify(results[mode]));
  await ctx.close();
}
fs.writeFileSync(`${OUT}/p6-failure-cdn.json`, JSON.stringify(results, null, 1));
await b.close();
