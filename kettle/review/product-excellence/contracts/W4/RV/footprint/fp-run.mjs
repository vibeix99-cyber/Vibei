import { chromium } from '/home/user/wt/w11/kettle/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import { measure, summarize } from './fp-lib.mjs';
const [base, outJson, which = 'all'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const rows = []; const raw = [];
const take = async (tag, sel = "[data-pose][data-chai-render]") => {
  await page.waitForFunction((s) => [...document.querySelectorAll(s)].some((e) => e.dataset.chaiRender === 'rive'), sel, { timeout: 20000 }).catch(() => {});
  const ms = await measure(page, sel);
  for (const m of ms) { raw.push({ tag, ...m }); const s = summarize(tag, m); rows.push(s); console.log(JSON.stringify(s)); }
};
if (which === 'all' || which === 'stage') {
  await page.clock.install({ time: Date.parse('2026-10-11T07:40:00Z') }); await page.clock.resume();
  await page.goto(`${base}/?debug&seed=veteran&theme=light#/`);
  await page.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60000 });
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(2500);
  await take('stage focus (reading)', '[data-stage-figure] [data-pose]');
  await page.evaluate(() => window.__kettle.finish());
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }); await page.waitForTimeout(3500);
  await take('stage summary (cheering)', '[data-stage-figure] [data-pose]');
  await page.getByRole('button', { name: /Tea time|Long tea break/ }).first().click(); await page.waitForTimeout(3500);
  await take('stage break (sipping)', '[data-stage-figure] [data-pose]');
}
if (which === 'all' || which === 'kit') {
  for (const pose of ['focus', 'sip', 'cheer']) for (const size of [72, 76, 84, 88, 108, 112, 120, 148, 152, 168, 200]) {
    await page.goto(`${base}/?debug&onboarded=1&k=${pose}${size}#/kit?part=art&view=pose&pose=${pose}&size=${size}`); await page.waitForTimeout(600);
    await take(`kit ${pose}@${size}`);
  }
}
if (which === 'other') {
  await page.goto(`${base}/?debug&seed=veteran&theme=light#/`);
  await page.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  await take('home hero (no brew; evening)');
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(1500);
  await page.evaluate(() => (location.hash = '#/')); await page.waitForTimeout(2500);
  await take('home hero (brew live)');
  await page.evaluate(() => (location.hash = '#/settings')); await page.waitForTimeout(1000);
  await page.locator('[data-pose="sip"]').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(3000);
  await take('settings about');
}
fs.writeFileSync(outJson, JSON.stringify({ rows, raw }, null, 1));
await b.close();
