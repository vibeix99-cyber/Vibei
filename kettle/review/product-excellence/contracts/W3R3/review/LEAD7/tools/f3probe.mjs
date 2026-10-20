// LEAD-7 F3 probe: the w3-notices-load 844x390 dark 200 % setup (same context options, init script, clock) on a server;
// records every image request and the Today Chai pose, and samples the intention textbox (rect, on top at its centre) for 4 s after ready.
import { createRequire } from 'node:module';
const require = createRequire('/home/user/wt/w6-int/kettle/package.json');
const { chromium } = require('@playwright/test');
const [base, label] = process.argv.slice(2);
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch();
for (let rep = 0; rep < 2; rep++) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark', reducedMotion: 'no-preference' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }); });
  const page = await ctx.newPage();
  const imgs = []; const t0 = Date.now();
  page.on('request', (r) => { if (r.resourceType() === 'image' || /\.(webp|png|svg)(\?|$)/.test(r.url())) imgs.push(`${Date.now() - t0}ms ${r.url().split('/').pop().split('?')[0]}`); });
  await page.clock.install({ time: MONDAY }); await page.clock.resume();
  await page.goto(`${base}/?debug&seed=newbie&theme=dark#/`);
  await page.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60000 });
  const tReady = Date.now() - t0;
  const samples = [];
  for (let i = 0; i < 40; i++) {
    samples.push(await page.evaluate(() => {
      const f = [...document.querySelectorAll('input,textarea')].find((e) => /What are you brewing/i.test(e.getAttribute('aria-label') || e.placeholder || (e.labels?.[0]?.textContent ?? '')));
      if (!f) return 'nofield';
      const r = f.getBoundingClientRect(); const h = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
      return `${Math.round(r.top)},${Math.round(r.left)},${Math.round(r.width)}x${Math.round(r.height)} top=${h === f || f.contains(h) ? 'Y' : 'N:' + (h?.className || h?.tagName)}`;
    }));
    await page.waitForTimeout(100);
  }
  const poses = await page.evaluate(() => [...document.querySelectorAll('[data-pose]')].map((e) => `${e.dataset.pose}:${e.querySelector('img')?.currentSrc.split('/').pop() ?? '(vector)'}`));
  // compress samples
  const seq = []; for (const s of samples) { if (!seq.length || seq[seq.length - 1].s !== s) seq.push({ s, n: 1 }); else seq[seq.length - 1].n++; }
  console.log(`== ${label} rep${rep} ready@${tReady}ms poses=${JSON.stringify(poses)}`);
  console.log('   images:', imgs.join(' | '));
  console.log('   field (100 ms samples after ready):', seq.map((x) => `${x.s} x${x.n}`).join(' -> '));
  await ctx.close();
}
await browser.close();
