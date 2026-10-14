// Lane I: which element widens the page during load (390×844 @200, isMobile), CPU throttled ×4 so the load is slow.
// Every 50 ms for 5 s: scrollWidth, and the elements that end past the edge while their parent does not.
//   node LI-overflow2.mjs <url> <label> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, label, outRoot] = process.argv.slice(2);
fs.mkdirSync(outRoot, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const res = [];
for (const run of [1, 2]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  await ctx.addInitScript(() => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.clock.install({ time: Date.parse('2026-10-12T07:40:00Z') });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=veteran#/stats`, { waitUntil: 'commit' });
  const seen = new Map();
  const t0 = Date.now();
  while (Date.now() - t0 < 6000) {
    const s = await page.evaluate(() => {
      const iw = document.documentElement.clientWidth;
      const sw = document.documentElement.scrollWidth;
      if (sw <= iw) return { sw, iw, src: [] };
      const src = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); const p = e.parentElement?.getBoundingClientRect(); return r.width > 0 && r.right > iw + 0.5 && (!p || p.right <= iw + 0.5); }).slice(0, 6).map((e) => `${e.tagName}.${String(e.className).replace(/_[a-z0-9]{5}_\d+/g, '').slice(0, 30)} "${(e.innerText || '').replace(/\s+/g, ' ').slice(0, 24)}" r=${Math.round(e.getBoundingClientRect().right)} pos=${getComputedStyle(e).position}`);
      return { sw, iw, src };
    }).catch(() => null);
    if (s && s.sw > s.iw) { const k = `${s.sw}/${s.iw} ${s.src.join(' | ')}`; seen.set(k, (seen.get(k) ?? 0) + 1); }
    await page.waitForTimeout(50);
  }
  res.push({ run, seen: [...seen.entries()] });
  console.log(JSON.stringify({ label, run, seen: [...seen.entries()] }));
  await ctx.close();
}
fs.writeFileSync(`${outRoot}/${label}-overflow2.json`, JSON.stringify(res, null, 1));
await browser.close();
