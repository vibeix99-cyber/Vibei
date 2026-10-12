// LEAD-2: milestone-day (seed atRisk) summary, BEFORE (:5330) vs AFTER (:5351), same session.
import { chromium } from '/home/user/wt/w2fv/kettle/node_modules/playwright/index.mjs';
const OUT = '/home/user/wt/w2t-n2/kettle/.tmp/LEAD2/ms';
const FIXED = new Date('2026-10-11T07:40:00Z');
const CFGS = [[375, 667, 2, 'light', 100], [390, 844, 2, 'dark', 200], [844, 390, 2, 'light', 100], [1440, 900, 1, 'dark', 100]];
const SIDES = [['BEFORE', 'http://127.0.0.1:5330'], ['AFTER', 'http://127.0.0.1:5351']];
const seed = process.argv[2] || 'atRisk';
const b = await chromium.launch();
const res = [];
for (const [w, h, dpr, theme, text] of CFGS) for (const [side, base] of SIDES) {
  const phone = w < 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: phone, hasTouch: phone });
  const page = await ctx.newPage();
  if (text !== 100) await page.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  await page.clock.install({ time: FIXED }); await page.clock.resume();
  await page.goto(`${base}/?debug&seed=${seed}&theme=${theme}#/`);
  await page.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__kettle.finish());
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 });
  await page.waitForTimeout(4000);
  const tag = `${w}x${h}-${theme}-t${text}-${seed}-${side}`;
  await page.screenshot({ path: `${OUT}/${tag}.png` });
  const info = await page.evaluate(() => {
    const ul = document.querySelector('[aria-label="Rewards"]');
    const li = ul ? [...ul.children].map((e) => ({ t: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 80), hl: e.hasAttribute('data-highlight') })) : [];
    const sc = ul?.closest('[class*="scroll"]');
    const foot = document.querySelector('footer, [class*="footer"]');
    return { li, scrollTop: sc?.scrollTop, footerTop: foot?.getBoundingClientRect().top, h1: document.querySelector('h1')?.textContent };
  });
  res.push({ tag, ...info });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(res, null, 1));
