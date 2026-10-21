// Welcome walk: pose + render per step (sound step sipping; notify granted + ready cheering)
import { chromium, OUT } from './common.mjs';
import fs from 'node:fs';
const base = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.grantPermissions(['notifications'], { origin: base });
const page = await ctx.newPage();
const all = () => page.evaluate(() => [...document.querySelectorAll('[data-chai-render]')].map((e) => { const r = e.getBoundingClientRect(); return `${e.dataset.pose}/${e.dataset.chaiRender}@${Math.round(r.width)}x${Math.round(r.height)}`; }));
await page.goto(`${base}/?debug#/welcome`); await page.waitForTimeout(2000);
await page.getByRole('button', { name: /set things up first/i }).click();
const out = [];
for (let i = 0; i < 9; i++) {
  await page.waitForTimeout(3400);
  const step = await page.evaluate(() => document.querySelector('[data-step]')?.dataset.step);
  out.push({ step, chai: await all() }); await page.screenshot({ path: `${OUT}/map-welcome-${i}-${step}.png` });
  if (step === 'ready') break;
  if (step === 'name') await page.getByRole('textbox').first().fill('Sam');
  const r = page.locator('input[type=radio]'); if (await r.count()) await r.first().check({ force: true }).catch((e) => console.log('radio', e.message.slice(0, 80)));
  const btn = page.getByRole('button', { name: /^continue$/i }).last();
  if (await btn.count() && await btn.isEnabled()) await btn.click(); else { console.log('stuck', step); break; }
}
console.log(JSON.stringify(out));
fs.writeFileSync(`${OUT}/p12-welcome.json`, JSON.stringify(out, null, 1));
await b.close();
