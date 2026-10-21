// Stage focus: main-thread TaskDuration and page fps, Rive vs ?rive=0, CPU x1 and x4; hidden-tab pause check.
import { chromium, OUT, boot } from './common.mjs';
import fs from 'node:fs';
const base = process.argv[2];
const b = await chromium.launch();
const res = {};
for (const q of [''])  for (const rate of [1, 4]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await boot(page, base, q);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(4000);
  const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable'); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await page.waitForTimeout(1000);
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const a = await m();
  const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else r(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
  const z = await m(); const dt = z.Timestamp - a.Timestamp;
  const k = `${q ? 'image' : 'rive'}-x${rate}`;
  res[k] = { pageFps: +fps.toFixed(1), taskMsPerS: +((z.TaskDuration - a.TaskDuration) / dt * 1000).toFixed(0), scriptMsPerS: +((z.ScriptDuration - a.ScriptDuration) / dt * 1000).toFixed(0), render: await page.evaluate(() => document.querySelector('[data-stage-figure=chai] [data-pose]')?.dataset.chaiRender) };
  console.log(k, JSON.stringify(res[k]));
  await ctx.close();
}
fs.writeFileSync(`${OUT}/p13-variant.json`, JSON.stringify(res, null, 1));
await b.close();
