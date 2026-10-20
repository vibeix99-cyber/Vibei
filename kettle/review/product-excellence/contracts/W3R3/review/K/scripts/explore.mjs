import { launch, newCtx, shot, facts } from './lib.mjs';
const base = process.argv[2];
const b = await launch();
const ctx = await newCtx(b, { vw: 390, vh: 844 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
const go = async (url) => { await page.goto(url); await page.waitForFunction(() => window.__kettle, null, { timeout: 60000 }); await page.waitForTimeout(800); };
await go(`${base}/?debug&seed=celebrate&theme=light#/`);
console.log('celebrate 15:30', JSON.stringify(await facts(page)));
await page.evaluate(() => window.__kettle.ff(3.5 * 3600e3)); await page.waitForTimeout(1200);
console.log('celebrate 19:00', JSON.stringify(await facts(page)), await page.evaluate(() => new Date(window.__kettle.clock.now()).toISOString()));
for (const s of ['veteran', 'newbie', 'blank', 'atRisk']) {
  await go(`${base}/?debug&seed=${s}&theme=light#/`);
  await page.evaluate(() => window.__kettle.ff(3.5 * 3600e3)); await page.waitForTimeout(1200);
  console.log(s, '19:00', JSON.stringify(await facts(page)));
}
await go(`${base}/?debug&seed=veteran&theme=light#/kit?part=art&view=chai`);
console.log('kit', JSON.stringify(await facts(page)));
await go(`${base}/?debug&seed=veteran&theme=light#/settings`);
console.log('settings', JSON.stringify(await facts(page)));
await go(`${base}/?debug&seed=fresh&theme=light#/`);
console.log('fresh', JSON.stringify(await facts(page)), (await page.locator('button').allInnerTexts()).join('|'));
await b.close();
