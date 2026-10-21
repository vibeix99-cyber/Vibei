import { chromium, boot } from '/home/user/Vibei/kettle/review/product-excellence/contracts/W4/RV/fix/tools/common.mjs';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const page = await ctx.newPage();
await boot(page, process.argv[2]);
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(4000);
const r = await page.evaluate(async () => { const l = window.__riveChai; const f0 = l.map((x) => x.frameCount); const t0 = performance.now(); await new Promise((r) => setTimeout(r, 3000)); return { n: l.length, fps: l.map((x, i) => ((x.frameCount - f0[i]) / ((performance.now() - t0) / 1000)).toFixed(1)), avgDur: l.map((x) => (x.durations.reduce((a, b) => a + b, 0) / x.durations.length).toFixed(2)) }; });
console.log(JSON.stringify(r)); await b.close();
