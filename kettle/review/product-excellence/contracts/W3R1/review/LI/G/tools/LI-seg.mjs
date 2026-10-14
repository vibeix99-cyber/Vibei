// Lane I: Today's brew-length segment under keyboard focus, frames over time, base vs trial (one browser).
//   node LI-seg.mjs <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const res = [];
for (const [label, url] of [['base', 'http://127.0.0.1:5488'], ['trial', 'http://127.0.0.1:5533']])
  for (const [w, h, theme, rm] of [[1440, 900, 'light', 'reduce'], [1440, 900, 'light', 'no-preference'], [1440, 900, 'dark', 'reduce'], [390, 844, 'light', 'reduce']]) {
    const tag = `${label}-${w}x${h}-${theme}-${rm}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: rm });
    const page = await ctx.newPage();
    await page.clock.install({ time: FIXED });
    await page.clock.resume();
    await page.goto(`${url}/?debug&seed=veteran&theme=${theme}#/`);
    await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    await page.mouse.click(w - 2, h - 2);
    await page.evaluate(() => { document.activeElement?.blur?.(); scrollTo(0, 0); });
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      await page.keyboard.press('Tab');
      found = await page.evaluate(() => document.activeElement?.getAttribute('role') === 'radio' && /min/.test(document.activeElement.textContent));
    }
    const seg = page.locator(':focus').locator('xpath=ancestor::*[@role="radiogroup"][1]');
    const frames = [];
    for (const t of [0, 150, 400, 1000, 2500]) {
      if (t) await page.waitForTimeout(t - (frames.at(-1)?.t ?? 0));
      const b = await seg.boundingBox();
      const info = await page.evaluate(() => {
        const el = document.activeElement; const th = el?.querySelector('[class*="thumb"]');
        const r = el?.getBoundingClientRect(), tr = th?.getBoundingClientRect();
        return { opt: r && [r.x, r.y, r.width, r.height].map((v) => +v.toFixed(1)), thumb: tr && [tr.x, tr.y, tr.width, tr.height].map((v) => +v.toFixed(1)), thumbTransform: th && getComputedStyle(th).transform, sy: scrollY };
      });
      const clip = { x: Math.max(0, b.x - 12), y: Math.max(0, b.y - 12), width: b.width + 24, height: b.height + 24 };
      await page.screenshot({ path: `${out}/${tag}-t${t}.png`, clip });
      frames.push({ t, ...info });
    }
    // after a small real wheel scroll and back
    await page.mouse.move(w / 2, h / 2);
    await page.mouse.wheel(0, 120); await page.waitForTimeout(400); await page.mouse.wheel(0, -120); await page.waitForTimeout(800);
    const b2 = await seg.boundingBox();
    await page.screenshot({ path: `${out}/${tag}-afterwheel.png`, clip: { x: Math.max(0, b2.x - 12), y: Math.max(0, b2.y - 12), width: b2.width + 24, height: b2.height + 24 } });
    const after = await page.evaluate(() => { const el = document.activeElement; const th = el?.querySelector('[class*="thumb"]'); const r = el?.getBoundingClientRect(), tr = th?.getBoundingClientRect(); return { opt: r && [r.x, r.y, r.width, r.height].map((v) => +v.toFixed(1)), thumb: tr && [tr.x, tr.y, tr.width, tr.height].map((v) => +v.toFixed(1)), thumbTransform: th && getComputedStyle(th).transform }; });
    res.push({ tag, found, frames, after });
    console.log(tag, found, JSON.stringify(frames.map((f) => [f.t, f.opt, f.thumb, f.thumbTransform, f.sy])), 'after', JSON.stringify(after));
    await ctx.close();
  }
fs.writeFileSync(`${out}/seg.json`, JSON.stringify(res, null, 1));
await browser.close();
