import { createRequire } from 'node:module';
const require = createRequire('/home/user/wt/w9tr/kettle/package.json');
const { chromium } = require('@playwright/test');
const [base, tag, outdir] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', deviceScaleFactor: 3 });
const page = await ctx.newPage();
for (const size of [72, 112]) {
  await page.goto(`${base}/?debug&theme=dark&motion=reduce#/kit?part=art&view=chai&size=${size}`);
  await page.waitForSelector('span[data-pose="focus"] img'); await page.waitForTimeout(500);
  const boxes = [];
  for (const p of ['focus', 'cheer', 'sip']) { const el = page.locator(`span[data-pose="${p}"]`).first(); await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: `${outdir}/${tag}-kit-${p}-${size}.png` }); }
  console.log('bg', await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
}
await browser.close();
