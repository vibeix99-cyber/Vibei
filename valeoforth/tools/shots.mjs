// Rendered-page screenshots for review: node tools/shots.mjs [outdir] [baseUrl]
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path';
const out = path.resolve(process.argv[2] ?? 'shots'); const base = process.argv[3] ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.mkdirSync(out, { recursive: true });
const vps = { '320': [320, 640, 2], '390': [390, 844, 2], 'tablet': [820, 1180, 1.5], '1024': [1024, 768, 1], 'desktop': [1440, 900, 1], 'landscape': [844, 390, 2] };
const pages = { hall: '', kettle: 'kettle/' };
const b = await chromium.launch({ executablePath: CHROME });
for (const [vn, [w, h, dpr]] of Object.entries(vps)) {
  for (const [pn, url] of Object.entries(pages)) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); await p.goto(base + url, { waitUntil: 'load' }); await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(out, `${pn}-${vn}-fold.png`) });
    if (pn === 'hall' && vn === 'desktop') { await p.getByRole('link', { name: /Come in/ }).hover(); await p.waitForTimeout(1200); await p.screenshot({ path: path.join(out, 'hall-desktop-hover.png') }); }
    if (pn === 'kettle' || vn !== 'landscape') {
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
      await p.waitForTimeout(600);
      await p.screenshot({ path: path.join(out, `${pn}-${vn}-full.png`), fullPage: true });
    }
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(pn, vn, 'horizontal overflow px:', overflow);
    await ctx.close();
  }
}
await b.close();
