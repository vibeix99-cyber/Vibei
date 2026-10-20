// LEAD-7 F3 probe 2: same context as w3-notices-load 844x390 dark 200 %; layout-shift entries (with sources), Chai image
// load/decode timing and box, and the intention field's box + on-top state sampled every 50 ms from navigation to 3 s after ready.
import { createRequire } from 'node:module';
const require = createRequire('/home/user/wt/w6-int/kettle/package.json');
const { chromium } = require('@playwright/test');
const [base, label, reps] = process.argv.slice(2);
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch();
for (let rep = 0; rep < Number(reps || 3); rep++) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  await ctx.addInitScript(() => {
    try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); });
    const P = (window.__probe = { shifts: [], field: [], chai: [] });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) P.shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), src: (e.sources || []).map((s) => { const n = s.node; return n ? `${n.nodeName}.${(n.className && n.className.baseVal === undefined ? n.className : '').toString().slice(0, 30)} ${Math.round(s.previousRect.y)}->${Math.round(s.currentRect.y)} h${Math.round(s.previousRect.height)}->${Math.round(s.currentRect.height)}` : '?'; }) }); }).observe({ type: 'layout-shift', buffered: true });
    let last = '';
    const tick = () => {
      const f = document.querySelector('input[aria-label*="brewing" i], textarea[aria-label*="brewing" i]') || [...document.querySelectorAll('input,textarea')].find((e) => /brewing/i.test(e.labels?.[0]?.textContent || e.placeholder || ''));
      let k = 'nofield';
      if (f) { const r = f.getBoundingClientRect(); const h = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2); k = `${Math.round(r.top)},${Math.round(r.left)},${Math.round(r.width)}x${Math.round(r.height)} ${h === f || f.contains(h) ? 'ON-TOP' : 'covered-by:' + (h?.tagName + '.' + String(h?.className).slice(0, 24))}`; }
      const img = document.querySelector('[data-pose] img');
      const ck = img ? `${img.currentSrc.split('/').pop()} complete=${img.complete} box=${Math.round(img.getBoundingClientRect().width)}x${Math.round(img.getBoundingClientRect().height)}` : 'noimg';
      if (k !== last) { P.field.push(`${Math.round(performance.now())}ms ${k}`); last = k; }
      if (!P.chai.length || P.chai[P.chai.length - 1].k !== ck) P.chai.push({ t: Math.round(performance.now()), k: ck });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const page = await ctx.newPage();
  await page.clock.install({ time: MONDAY }); await page.clock.resume();
  await page.goto(`${base}/?debug&seed=newbie&theme=dark#/`);
  await page.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60000 });
  const tReady = await page.evaluate(() => Math.round(performance.now()));
  await page.waitForTimeout(3000);
  const P = await page.evaluate(() => window.__probe);
  const ent = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /chai-(reading|sipping|cheering)/.test(e.name)).map((e) => `${e.name.split('/').pop()} start ${Math.round(e.startTime)} end ${Math.round(e.responseEnd)} ${e.encodedBodySize || e.transferSize}B`));
  console.log(`== ${label} rep${rep} ready@${tReady}ms`);
  console.log('   chai res :', ent.join(' | '));
  console.log('   chai img :', P.chai.map((c) => `${c.t}ms ${c.k}`).join(' -> '));
  console.log('   field    :', P.field.join(' -> '));
  console.log('   shifts   :', P.shifts.length ? P.shifts.map((s) => `${s.t}ms ${s.v} [${s.src.join('; ')}]`).join(' | ') : 'none');
  await ctx.close();
}
await browser.close();
