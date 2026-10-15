// BD-hq.mjs: the state-13 flow with the engine tier forced by ?nookq= (high|low), shot only once the live scene is ready and settled
// (not a race): which tier's live frame looks like the pre-rendered still (stills are rendered by the high tier, scripts/stills/window.html:15)?
// usage: LANE_D_FIXED_ISO=... node --import BD-freeze.mjs BD-hq.mjs --base URL --out DIR --q high
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => { if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]); return acc; }, []));
const { base, out, q } = args; mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark', reducedMotion: 'no-preference' });
const p = await ctx.newPage();
await p.goto(`${base}/?debug&seed=fresh&theme=dark&nookq=${q}#/welcome`, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, muted: true }));
await p.waitForTimeout(1200);
await p.getByRole('button', { name: /Start a 15-min brew/ }).click();
const t0 = Date.now();
await p.waitForFunction(() => document.querySelector('[data-scene-ready="true"]'), null, { timeout: 120000 });
console.log('ready after (real) ms', Date.now() - t0);
await p.waitForTimeout(4000);
const tier = await p.evaluate(() => window.__nook?.quality ?? null);
console.log('engine quality', tier);
await p.screenshot({ path: `${out}/13-ready-${q}.png`, timeout: 240000 });
await b.close();
