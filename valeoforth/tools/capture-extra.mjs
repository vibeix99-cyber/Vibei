/** Second capture pass (see capture-kettle.mjs): tea-break screen, nook scene matrix, Chai SVGs, fallback nook, kit. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL0 = process.env.KETTLE_URL ?? 'http://localhost:5051/index.html';
const OUT = path.resolve(process.env.OUT ?? './raw');
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({
  executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const STEPS = new Set((process.env.STEPS ?? 'break,nook,chai').split(','));
const mk = (viewport, dpr = 2, colorScheme = 'light') => browser.newContext({ viewport, deviceScaleFactor: dpr, serviceWorkers: 'block', colorScheme, storageState: path.join(OUT, 'history.json') });
const save = (name) => path.join(OUT, name + '.png');
const setTimer = (p, patch) => p.evaluate((patch) => {
  const s = JSON.parse(localStorage.getItem('kettle:timer')); const now = Date.now(); const el = patch.elapsed; delete patch.elapsed;
  Object.assign(s.state, { status: 'running', pausedAt: null, pausedTotalMs: 0, startedAt: now - el, endsAt: now - el + patch.plannedMs, intention: 'Chapter 3 notes', tag: 'study', sessionId: 's_live' + Math.random() }, patch);
  localStorage.setItem('kettle:timer', JSON.stringify(s));
}, patch);

/* 1. a genuine tea-break screen: finish a brew, then let the app start the break */
for (const theme of STEPS.has('break') ? [null, 'dark'] : []) {
  const ctx = await mk({ width: 390, height: 844 }, 2, theme ?? 'light'); ctx.setDefaultTimeout(5000);
  const p = await ctx.newPage();
  const base = URL0;
  await p.goto(`${base}#/`); await p.waitForTimeout(700);
  await setTimer(p, { phase: 'focus', plannedMs: 1500000, elapsed: 1503000 });
  await p.goto(`${base}#/focus`); await p.reload(); await p.waitForTimeout(3500);
  for (let i = 0; i < 8 && p.url().includes('/done'); i++) {
    const brk = p.getByRole('button', { name: /start .*tea break/i });
    if (await brk.count()) { await brk.first().click(); break; }
    await p.getByRole('button', { name: /continue/i }).first().click().catch(() => {}); await p.waitForTimeout(700);
  }
  await p.waitForTimeout(4000);
  console.log('break url', p.url().split('#')[1]);
  await p.screenshot({ path: save(theme ? 'd-tea-break' : 'm-tea-break') });
  await ctx.close();
}

/* 2. the nook scene, every time-of-day x window combination, scene only */
if (STEPS.has('nook')) {
  const ctx = await mk({ width: 1000, height: 900 }, 1.5); ctx.setDefaultTimeout(60000);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date('2026-09-30T15:20:00'));
  await p.goto(`${URL0}#/nook`); await p.waitForTimeout(5000);
  const canvas = p.locator('canvas').first();
  const hideOverlays = () => p.evaluate(() => { const c = document.querySelector('canvas'); [...c.parentElement.children].forEach((el) => { if (el !== c && !el.contains(c)) el.style.visibility = 'hidden'; }); });
  const label = async (re) => (await p.getByRole('button', { name: re }).first().getAttribute('aria-label')) ?? '';
  const times = [], wins = [];
  for (let i = 0; i < 8; i++) { const l = await label(/Time of day/); if (times.includes(l)) break; times.push(l); await p.getByRole('button', { name: /Time of day/ }).first().click(); await p.waitForTimeout(400); }
  for (let i = 0; i < 8; i++) { const l = await label(/Window:/); if (wins.includes(l)) break; wins.push(l); await p.getByRole('button', { name: /Window:/ }).first().click(); await p.waitForTimeout(400); }
  console.log('times', times, 'wins', wins);
  fs.writeFileSync(path.join(OUT, 'nook-labels.json'), JSON.stringify({ times, wins }));
  for (let ti = 0; ti < times.length; ti++) {
    for (let wi = 0; wi < wins.length; wi++) {
      await p.waitForTimeout(1600);
      await hideOverlays();
      await canvas.screenshot({ path: save(`nook-t${ti}-w${wi}`) });
      await p.evaluate(() => { const c = document.querySelector('canvas'); [...c.parentElement.children].forEach((el) => { el.style.visibility = ''; }); });
      console.log('nook', ti, wi, await label(/Time of day/), '|', await label(/Window:/));
      await p.getByRole('button', { name: /Window:/ }).first().click();
    }
    await p.getByRole('button', { name: /Time of day/ }).first().click();
  }
  await ctx.close();
}

/* 3. Chai SVGs, the static nook fallback, and the design-system kit */
if (STEPS.has('chai')) {
  const ctx = await mk({ width: 1280, height: 900 }, 2); ctx.setDefaultTimeout(30000);
  const p = await ctx.newPage();
  await p.goto(`${URL0}#/kit?part=art&view=chai`); await p.waitForTimeout(3000);
  const svgs = await p.evaluate(() => [...document.querySelectorAll('[data-shot="chai"] svg')].map((s) => ({
    label: (s.parentElement?.innerText || '').trim(), svg: s.outerHTML })));
  fs.writeFileSync(path.join(OUT, 'chai-svgs.json'), JSON.stringify(svgs));
  console.log('chai svgs', svgs.length, svgs.map((s) => s.label).join(','));
  await p.locator('[data-shot="chai"]').screenshot({ path: save('x-chai-sheet') });
  await p.goto(`${URL0}#/kit?part=art&view=nook`); await p.reload(); await p.waitForTimeout(3500);
  const fb = p.locator('[data-shot="nook"] > div > div');
  await fb.first().waitFor({ timeout: 30000 }); await p.waitForTimeout(2500);
  console.log('fallback nooks', await fb.count());
  await fb.nth(1).screenshot({ path: save('x-nook-fallback-rain'), timeout: 60000 }).catch((e) => console.log('fb1', e.message.slice(0, 80)));
  await fb.nth(2).screenshot({ path: save('x-nook-fallback-snow'), timeout: 60000 }).catch((e) => console.log('fb2', e.message.slice(0, 80)));
  await p.goto(`${URL0}#/kit?part=ui`); await p.reload(); await p.waitForTimeout(2500);
  await p.screenshot({ path: save('x-kit') });
  await ctx.close();
}
await browser.close(); console.log('done');
