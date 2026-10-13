// Quick look: Nook (3D) on a server, with a query, save a screenshot + engine/chai facts.
// node look.mjs --base http://127.0.0.1:5423 --q "&chai3d=model&nookq=high" --out file.png [--vp 390x844@3] [--theme light] [--at ISO]
import { chromium } from 'playwright';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const [W, H, DPR] = (args.vp ?? '390x844@3').match(/(\d+)x(\d+)@(\d+)/).slice(1).map(Number);
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, colorScheme: args.theme ?? 'light', timezoneId: 'UTC', serviceWorkers: 'block' });
const p = await ctx.newPage();
const logs = []; p.on('console', (m) => logs.push(m.text().slice(0, 300))); p.on('pageerror', (e) => logs.push('ERR ' + e.message));
await p.clock.install({ time: Date.parse(args.at ?? '2026-10-11T07:40:00Z') }); await p.clock.resume();
await p.goto(`${args.base}/?debug&seed=${args.seed ?? 'veteran'}&theme=${args.theme ?? 'light'}${args.q ?? ''}#/nook`);
await p.waitForSelector('[data-scene-ready="true"]', { timeout: 90000 });
await p.waitForFunction(() => window.__nook?.chaiKind === 'model' || window.__chai3d?.status().state === 'failed', null, { timeout: +(args.wait ?? 20000) }).catch(() => {});
await p.waitForTimeout(1500);
const facts = await p.evaluate(() => ({ kind: window.__nook?.chaiKind, status: window.__chai3d?.status(), quality: window.__nook?.quality, stats: window.__nook?.stats }));
console.log(JSON.stringify(facts));
await p.screenshot({ path: args.out, animations: 'disabled', timeout: 180000 }); console.log(logs.filter((l) => /chai|ERR|error/i.test(l)).join('\n'));
await b.close();
