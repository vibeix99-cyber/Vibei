// Lane K task 4: the real pose-switch flow on the Stage. Focus running (reading) -> whistle + summary (cheering) -> tea break (sipping) -> next brew (reading).
//   node poseswitch.mjs <baseURL> <side> <cfg> <theme> <dpr> <motion: full|reduce> <jsonOut> [frameDir]
// Per step: Chai's <img> box (CSS px), the ink box from the decoded alpha mapped through the box, and the ink box measured from a screenshot diff
// (the same clip with the <img> hidden: the pixels that change are Chai's ink). Baseline y = ink bottom. Plus a per-frame (rAF) trace of the whole flow.
import fs from 'node:fs';
import { launch, newCtx, shot, CONFIGS } from './lib.mjs';
import { createRequire } from 'node:module';
const [base, side, cfg, theme, dprArg, motion, jsonOut, frameDir] = process.argv.slice(2);
const dpr = +dprArg, [vw, vh] = CONFIGS[cfg];
const b = await launch();
const ctx = await newCtx(b, { vw, vh, dpr, reduced: motion === 'reduce' });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`${base}/?debug&theme=${theme}&motion=${motion}&seed=veteran#/`);
await page.waitForFunction(() => window.__kettle, null, { timeout: 60000 }); await page.waitForTimeout(1500);
await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
// per-frame trace
await page.evaluate(() => {
  window.__trace = []; const t0 = performance.now();
  const tick = () => {
    const imgs = [...document.querySelectorAll('[data-stage-figure="chai"] img')];
    const row = { t: +(performance.now() - t0).toFixed(1), hash: location.hash, figs: imgs.map((i) => { const r = i.getBoundingClientRect(); const f = i.closest('[data-stage-figure]').getBoundingClientRect(); return { pose: i.closest('[data-pose]')?.dataset.pose, x: r.left, y: r.top, w: r.width, h: r.height, fx: f.left, fy: f.top, fw: f.width, fh: f.height }; }) };
    window.__trace.push(row); requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const sel = '[data-stage-figure="chai"] img';
async function measure(name, frameNo) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction((s) => { const i = document.querySelector(s); return i && i.complete && i.naturalWidth > 0; }, sel);
  // 1. decoded alpha mapped through the box
  const dec = await page.evaluate(async (sel) => {
    const img = document.querySelector(sel); await img.decode().catch(() => {});
    const r = img.getBoundingClientRect(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const sx = r.width / c.width, sy = r.height / c.height;
    return { pose: img.closest('[data-pose]')?.dataset.pose, src: img.currentSrc.split('/').pop().split('?')[0], natural: [c.width, c.height], box: [r.left, r.top, r.width, r.height], ink: [r.left + x0 * sx, r.top + y0 * sy, r.left + (x1 + 1) * sx, r.top + (y1 + 1) * sy] };
  }, sel);
  // 2. screenshot diff with the <img> hidden
  const pad = 8;
  const clip = { x: Math.max(0, Math.floor(dec.box[0]) - pad), y: Math.max(0, Math.floor(dec.box[1]) - pad), width: Math.ceil(dec.box[2]) + 2 * pad, height: Math.ceil(dec.box[3]) + 2 * pad };
  await page.screenshot({ clip, animations: 'disabled' }); await page.waitForTimeout(250); // throw-away shot first
  const A = await page.screenshot({ clip, animations: 'disabled' });
  await page.evaluate((s) => { document.querySelector(s).style.visibility = 'hidden'; }, sel);
  const B = await page.screenshot({ clip, animations: 'disabled' });
  await page.waitForTimeout(250);
  const B2 = await page.screenshot({ clip, animations: 'disabled' }); // B vs B2 = what the scene animates by itself (excluded from the ink mask)
  await page.evaluate((s) => { document.querySelector(s).style.visibility = ''; }, sel);
  await page.waitForTimeout(250);
  const A2 = await page.screenshot({ clip, animations: 'disabled' });
  const raw = frameDir ? await page.screenshot({ animations: 'disabled' }) : null;
  if (raw) fs.writeFileSync(`${frameDir}/${frameNo}-${name}.png`, raw);
  const AB = process.env.K_AB_DIR; fs.mkdirSync(AB, { recursive: true });
  const tag = `${side}-${cfg}-${theme}-d${dpr}-${motion}-${frameNo}`;
  fs.writeFileSync(`${AB}/${tag}.A.png`, A); fs.writeFileSync(`${AB}/${tag}.B.png`, B); fs.writeFileSync(`${AB}/${tag}.B2.png`, B2); fs.writeFileSync(`${AB}/${tag}.A2.png`, A2);
  return { name, ...dec, clip, abTag: tag };
}
const steps = [];
const go = async (label, fn, wait) => { await fn(); await page.waitForTimeout(wait); steps.push(await measure(label, steps.length)); };
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
await page.waitForFunction(() => location.hash === '#/focus');
await page.waitForTimeout(1500); steps.push(await measure('1-focus-running-reading', 0));
await go('2-whistle-cheering', () => page.evaluate(() => window.__kettle.finish()), 900);
await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3000); steps.push(await measure('3-summary-cheering', steps.length));
await go('4-tea-break-sipping', () => page.getByRole('button', { name: /tea time/i }).first().click(), 2500);
await go('5-next-brew-reading', () => page.getByRole('button', { name: /next brew/i }).first().click(), 2500);
const trace = await page.evaluate(() => window.__trace);
fs.writeFileSync(jsonOut, JSON.stringify({ side, cfg, theme, dpr, motion, base, errs, steps, trace }));
await b.close();
console.log('ok', side, cfg, theme, dpr, motion, steps.map((s) => s.pose).join('>'), 'frames', trace.length);
