// Stage: watermark captures, DOM check, mapping, whistle strip, over->focus swap, CDN log. args: base theme
import { chromium, OUT, CDN, boot, state } from './common.mjs';
import fs from 'node:fs';
const [base, theme] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const reqs = []; page.on('request', (r) => reqs.push(r.url()));
const log = { theme, base, steps: [] };
const L = (k, v) => { log.steps.push({ k, t: Date.now(), v }); console.log(k, JSON.stringify(v)); };
await boot(page, base, `&theme=${theme}`);
const clipShot = async (name) => {
  const r = await page.evaluate(() => { const f = document.querySelector('[data-stage-figure=chai]').getBoundingClientRect(); return { x: f.x - 50, y: f.y - 40, width: f.width + 100, height: f.height + 70 }; });
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: r });
  const durl = await page.evaluate(() => document.querySelector('[data-stage-figure=chai] canvas')?.toDataURL());
  if (durl) fs.writeFileSync(`${OUT}/${name}-canvas.png`, Buffer.from(durl.split(',')[1], 'base64'));
};
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
await page.waitForFunction(() => location.hash === '#/focus');
const t0 = Date.now();
// sample until reveal
let first = null;
for (let i = 0; i < 100; i++) { const s = await state(page); if (s?.render === 'rive' && !first) { first = Date.now() - t0; L('focus-reveal-ms', { first, s }); await clipShot(`wm-${theme}-t0-first`); break; } await page.waitForTimeout(50); }
await page.waitForTimeout(1000); L('focus-1s', await state(page)); await clipShot(`wm-${theme}-t1s`);
await page.waitForTimeout(4000); L('focus-5s', await state(page)); await clipShot(`wm-${theme}-t5s`);
// DOM: anything not ours?
L('dom', await page.evaluate(() => ({ canvases: [...document.querySelectorAll('canvas')].map((c) => c.className + '|' + (c.dataset.riveChai ?? '')), riveText: [...document.querySelectorAll('body *')].filter((e) => /rive/i.test(e.textContent ?? '') && e.children.length === 0).map((e) => e.tagName + ':' + e.textContent.slice(0, 40)), iframes: document.querySelectorAll('iframe').length, bodyKids: [...document.body.children].map((e) => e.tagName + '#' + e.id + '.' + e.className) })));
// whistle strip
await page.evaluate(() => window.__kettle.finish());
const strip = [];
for (let i = 0; i < 24; i++) { const s = await state(page); strip.push({ ms: i * 150, ...s, cssW: await page.evaluate(() => document.querySelector('[data-stage-figure=chai] canvas')?.style.width) }); await clipShot(`whistle-${theme}-${String(i).padStart(2, '0')}`); await page.waitForTimeout(100); }
L('whistle-strip', strip);
await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 });
await page.waitForTimeout(3000); L('summary', await state(page)); await clipShot(`wm-${theme}-summary`);
await page.getByRole('button', { name: /Tea time|Long tea break/ }).first().click();
await page.waitForTimeout(500); L('break-0.5s', await state(page));
await page.waitForTimeout(4500); L('break-5s', await state(page)); await clipShot(`wm-${theme}-break`);
// end the break -> over (stretch) -> next focus: watch for a blank Chai
await page.evaluate(() => window.__kettle.finish());
await page.waitForTimeout(3000);
L('after-break', { hash: await page.evaluate(() => location.hash), s: await state(page), buttons: await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 12)) });
await clipShot(`over-${theme}`);
const startBtn = page.getByRole('button', { name: /put the kettle on|start|next|brew|focus/i }).first();
if (await startBtn.count()) {
  await startBtn.click();
  const sw = [];
  for (let i = 0; i < 40; i++) { const s = await state(page); sw.push({ i, ...s }); if (i < 8) await clipShot(`over2focus-${theme}-${i}`); await page.waitForTimeout(40); }
  L('over->focus', sw.map((s) => `${s.i}:${s?.pose}/${s?.render}/img=${s?.imgVis}/ink=${s?.ink}`));
}
L('cdn', reqs.filter((u) => CDN.test(u)));
L('rive-reqs', reqs.filter((u) => /rive|\.riv|wasm/.test(u)));
fs.writeFileSync(`${OUT}/p1-${theme}.json`, JSON.stringify(log, null, 1));
await b.close();
