import { chromium, boot } from './common.mjs';
const b = await chromium.launch();
for (const q of ['', '&rive=0']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const page = await ctx.newPage();
  await boot(page, process.argv[2], q);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(4000);
  const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable');
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const a = await m(); await page.waitForTimeout(6000); const z = await m(); const dt = z.Timestamp - a.Timestamp;
  const out = {}; for (const k of Object.keys(z)) if (/Duration|Count$/.test(k)) out[k] = +(((z[k] - a[k]) / dt) * (/Duration/.test(k) ? 1000 : 1)).toFixed(1);
  console.log(q || 'rive', JSON.stringify(out)); await ctx.close();
}
await b.close();
