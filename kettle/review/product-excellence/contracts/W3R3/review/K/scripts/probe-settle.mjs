import fs from 'node:fs';
import { launch, newCtx, CONFIGS } from './lib.mjs';
const [base, tag] = process.argv.slice(2);
const b = await launch(); const ctx = await newCtx(b, { vw: 1440, vh: 900 }); const page = await ctx.newPage();
const SC = '/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3/probe'; fs.mkdirSync(SC, { recursive: true });
await page.goto(`${base}/?debug&theme=dark&motion=full&seed=veteran#/`); await page.waitForFunction(() => window.__kettle); await page.waitForTimeout(1500);
await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true }));
await page.getByRole('button', { name: /put the kettle on/i }).first().click(); await page.waitForFunction(() => location.hash === '#/focus');
let t = 0;
for (const w of [1, 3, 6, 10, 15]) {
  await page.waitForTimeout((w - t) * 1000); t = w;
  await page.screenshot({ path: `${SC}/${tag}-${w}s.png`, animations: 'disabled' });
  const info = await page.evaluate(() => { const win = document.querySelector('[class*="window"]'); return { filter: win && getComputedStyle(win).filter, imgs: [...document.querySelectorAll('[class*="window"] img, [class*="back"] img')].map(i => [i.currentSrc.split('/').pop().slice(0, 40), i.naturalWidth, i.complete]) }; });
  await page.screenshot({ path: `${SC}/${tag}-${w}s-full.png`, animations: 'disabled', fullPage: true });
  console.log(tag, w, 'scrollH', await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight]), JSON.stringify(info));
}
await b.close();
