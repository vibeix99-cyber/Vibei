import { chromium } from 'playwright';
const [,, base, w, h, dpr] = process.argv;
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr, isMobile: +w < 900 && +w < +h, hasTouch: +w < 900, colorScheme: 'light' });
await ctx.addInitScript(() => { try { localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
const p = await ctx.newPage();
await p.goto(`${base}/?debug&theme=light&nooktime=day#/`);
await p.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60000 });
await p.evaluate(() => window.__kettle.seed('newbie')); await p.reload();
await p.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
const times = [];
for (let i = 0; i < 5; i++) { const t = Date.now(); await p.screenshot({ path: `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L4/shot-test.png` }); times.push(Date.now() - t); }
console.log(w, h, 'shot ms (cold then warm):', times.join(' '));
await b.close();
