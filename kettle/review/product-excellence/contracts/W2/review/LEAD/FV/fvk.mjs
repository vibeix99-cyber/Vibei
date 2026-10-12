import { chromium } from '/home/user/wt/w2fv/kettle/node_modules/playwright/index.mjs';
const base = process.argv[2];
const b = await chromium.launch();
const out = [];
for (const [w, h, scale] of [[375, 667, 1], [390, 844, 2]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${base}/?debug&seed=fresh&theme=light&onboarded=0#/welcome`);
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
  if (scale === 2) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.waitForTimeout(1500);
  const seq = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const a = await page.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { t: (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), outline: cs.outlineStyle + ' ' + cs.outlineWidth, shadow: cs.boxShadow !== 'none' }; });
    seq.push(a);
    if (a.t === 'Set things up first') break;
  }
  await page.screenshot({ path: `/home/user/wt/w2t-n2/kettle/.tmp/LEAD2/fvk/focus-${w}x${h}-${scale}.png` });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => ({ hash: location.hash, h1: [...document.querySelectorAll('h1,h2')].map((e) => e.textContent.trim()).slice(0, 3) }));
  out.push({ cfg: `${w}x${h}@${scale * 100}`, seq, after });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(out, null, 1));
