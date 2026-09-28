import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:5186/?debug&seed=veteran&theme=light#/stats', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
console.log(await page.evaluate(() => {
  const W = document.documentElement.clientWidth; const out = [];
  document.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (r.right > W + 1 && r.width > 0) out.push(el.tagName + '.' + (el.className?.baseVal ?? el.className) + ' ' + Math.round(r.right)); });
  return out.slice(0, 15).join('\n');
}));
await browser.close();
