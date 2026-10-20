// Lane K task 3: edge close-up inputs. For each pose: a DPR 2 clip around Chai's <img> with the image shown (A) and hidden (B).
//   node edges.mjs <baseURL> <side> <mode: stage|kit> <cfg> <theme>
// stage = the real Focus stage (reading: running; cheering: summary; sipping: tea break). kit = the Kit gallery on its flat page background (size 240).
import fs from 'node:fs';
import { launch, newCtx, CONFIGS } from './lib.mjs';
const [base, side, mode, cfg, theme] = process.argv.slice(2);
const [vw, vh] = CONFIGS[cfg];
const AB = process.env.K_AB_DIR; fs.mkdirSync(AB, { recursive: true });
const b = await launch();
const ctx = await newCtx(b, { vw, vh, dpr: 2, reduced: true });
const page = await ctx.newPage();
const out = [];
async function grab(pose, sel) {
  await page.waitForFunction((s) => { const i = document.querySelector(s); return i && i.complete && i.naturalWidth > 0; }, sel);
  await page.evaluate(() => document.fonts.ready);
  const box = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }, sel);
  const pad = 12;
  const clip = { x: Math.max(0, Math.floor(box[0]) - pad), y: Math.max(0, Math.floor(box[1]) - pad), width: Math.ceil(box[2]) + 2 * pad, height: Math.ceil(box[3]) + 2 * pad };
  await page.screenshot({ clip, animations: 'disabled' }); await page.waitForTimeout(250); // throw-away shot first: the first shot of a state can carry the scene's settling
  const A = await page.screenshot({ clip, animations: 'disabled' });
  await page.evaluate((s) => { document.querySelector(s).style.visibility = 'hidden'; }, sel);
  const B = await page.screenshot({ clip, animations: 'disabled' });
  await page.waitForTimeout(250);
  const B2 = await page.screenshot({ clip, animations: 'disabled' }); // a second hidden shot: B vs B2 marks the pixels the scene animates by itself
  await page.evaluate((s) => { document.querySelector(s).style.visibility = ''; }, sel);
  await page.waitForTimeout(250);
  const A2 = await page.screenshot({ clip, animations: 'disabled' });
  const tag = `edge-${side}-${mode}-${cfg}-${theme}-${pose}`;
  fs.writeFileSync(`${AB}/${tag}.A.png`, A); fs.writeFileSync(`${AB}/${tag}.B.png`, B); fs.writeFileSync(`${AB}/${tag}.B2.png`, B2); fs.writeFileSync(`${AB}/${tag}.A2.png`, A2);
  out.push({ tag, pose, box, clip, dpr: 2 });
}
const boot = async (hash) => { await page.goto(`${base}/?debug&theme=${theme}&motion=reduce&seed=veteran#${hash}`); await page.waitForFunction(() => window.__kettle, null, { timeout: 60000 }); await page.waitForTimeout(1500); };
if (mode === 'kit') {
  await boot('/kit?part=art&view=chai&size=240'); await page.waitForTimeout(800);
  for (const [pose, p] of [['reading', 'focus'], ['sipping', 'sip'], ['cheering', 'cheer']]) await grab(pose, `span[data-pose="${p}"] img`);
} else {
  const sel = '[data-stage-figure="chai"] img';
  await boot('/');
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(5000);
  await grab('reading', sel);
  await page.evaluate(() => window.__kettle.finish());
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4500); await grab('cheering', sel);
  await page.getByRole('button', { name: /tea time/i }).first().click(); await page.waitForTimeout(4500);
  await grab('sipping', sel);
}
fs.writeFileSync(`${AB}/edge-${side}-${mode}-${cfg}-${theme}.json`, JSON.stringify(out));
await b.close(); console.log('ok edges', side, mode, cfg, theme);
