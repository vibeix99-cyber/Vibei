// Probe: open a URL at a size, list visible buttons/links/inputs (accessible names). usage: node probe.mjs "<query>#<route>" [w h]
import { chromium } from 'playwright';
const [q, w = 390, h = 844] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, serviceWorkers: 'block' });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto(`http://localhost:4173/?debug&${q}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const items = await p.evaluate(() => [...document.querySelectorAll('button,a,[role=button],[role=radio],[role=tab],input,textarea,select,[role=switch],[role=slider]')]
  .filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
  .map((e) => `${e.tagName.toLowerCase()}${e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : ''} "${(e.getAttribute('aria-label') || e.innerText || e.getAttribute('placeholder') || e.value || '').replace(/\s+/g, ' ').trim().slice(0, 60)}"`));
console.log(items.join('\n'));
console.log('H1/H2:', await p.evaluate(() => [...document.querySelectorAll('h1,h2')].map((e) => e.innerText.replace(/\s+/g, ' ')).join(' | ')));
await b.close();
