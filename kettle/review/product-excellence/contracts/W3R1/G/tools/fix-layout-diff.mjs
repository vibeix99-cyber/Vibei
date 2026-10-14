// Check 9: Settings at 375×667 light @200 (same setup as capture-settings.mjs), BEFORE vs AFTER: every row description
// and group heading with its text, top and height; prints only what differs.   node fix-layout-diff.mjs <before> <after> <out.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [A, B, out] = process.argv.slice(2);
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
async function grab(url) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
  const page = await ctx.newPage();
  await page.clock.install({ time: FIXED });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=veteran&theme=light#/settings`);
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: false, name: 'Robin' }));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => [...document.querySelectorAll('h1, h2, h3, [class*="_label_"], [class*="_desc_"], [class*="_footer_"], [class*="stackDesc"], p')].map((e) => { const b = e.getBoundingClientRect(); return { k: e.tagName + '.' + (e.className.toString().match(/_(\w+?)_/)?.[1] ?? ''), t: e.textContent.trim().slice(0, 200), top: Math.round(b.top + scrollY), h: Math.round(b.height) }; }));
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await ctx.close();
  return { r, height };
}
const a = await grab(A), b = await grab(B);
const diffs = [];
let shift = 0;
for (let i = 0; i < Math.max(a.r.length, b.r.length); i++) {
  const x = a.r[i], y = b.r[i];
  if (!x || !y || x.t !== y.t || x.h !== y.h) diffs.push({ i, before: x, after: y });
  else if (y.top - x.top !== shift) { diffs.push({ i, shiftFrom: shift, shiftTo: y.top - x.top, at: y.t.slice(0, 60) }); shift = y.top - x.top; }
}
fs.writeFileSync(out, JSON.stringify({ before: A, after: B, heightBefore: a.height, heightAfter: b.height, elements: a.r.length + '/' + b.r.length, diffs }, null, 1));
console.log(JSON.stringify({ heightBefore: a.height, heightAfter: b.height, diffs }, null, 1));
await browser.close();
