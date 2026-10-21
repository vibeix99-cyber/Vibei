import { chromium, OUT } from './common.mjs';
const base = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
for (const u of ['#/kit?view=pose&pose=cheer&size=168', '?view=pose&pose=cheer&size=168#/kit']) {
  await page.goto(`${base}/${u.startsWith('?') ? '' : '?debug'}${u}`); await page.waitForTimeout(5000);
  console.log(u, page.url(), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('[data-chai-render]')].slice(0, 5).map((e) => e.dataset.pose + '/' + e.dataset.chaiRender + '/' + !!e.querySelector('canvas')))));
}
await b.close();
