// LEAD-5 · W3R1 S: which element is past 390 / 375 px on Stats @200 with the fallback font (web fonts blocked), isMobile.
import { chromium } from '/home/user/wt/w5tr-s/kettle/node_modules/playwright/index.mjs';
const [base, label, wh] = process.argv.slice(2);
const [w, h] = wh.split('x').map(Number);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
await ctx.route(/\.(woff2?|ttf|otf)(\?.*)?$/, (r) => r.abort());
await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
const page = await ctx.newPage();
await page.clock.install({ time: Date.parse('2026-10-12T07:40:00Z') });
await page.clock.resume();
await page.goto(`${base}/?debug&seed=veteran&theme=light#/stats`);
await page.waitForFunction(() => !!window.__kettle);
await page.waitForTimeout(2500);
const r = await page.evaluate((W) => {
  const hits = [];
  for (const e of document.querySelectorAll('main *')) {
    const q = e.getBoundingClientRect();
    if (!q.width || !q.height || q.right <= W + 0.5 || e.closest('.sr-only')) continue;
    hits.push({ tag: e.tagName, cls: String(e.className?.baseVal ?? e.className).split(' ')[0], right: Math.round(q.right), w: Math.round(q.width), text: (e.textContent || '').trim().slice(0, 30), kids: e.children.length });
  }
  return { iw: innerWidth, sw: document.documentElement.scrollWidth, hits: hits.filter((x) => x.kids === 0 || x.w < 260).slice(0, 12) };
}, w);
console.log(label, wh, JSON.stringify(r));
await page.screenshot({ path: `width/${label}-${wh}-200-mobile-nofonts-viewport.png` });
await b.close();
