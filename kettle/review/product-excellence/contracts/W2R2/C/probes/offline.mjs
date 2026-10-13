// I06 offline: is the model precached, does the offline Nook show it, and what happens offline without it?
// Production preview with the service worker (not blocked). High tier forced (nookq=high).
//   node offline.mjs --base http://127.0.0.1:5433 --out offline.json --shots <dir>
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
mkdirSync(args.shots, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const out = { base: args.base, runs: [] };
// Variants: as shipped (precached); the precache entry removed (the HTTP cache may still hold it); the precache entry
// removed AND the HTTP cache disabled (the true offline-without-precache case).
const variants = (args.variants ?? 'precached,glb-evicted-from-cache,glb-evicted-no-http-cache').split(',');
for (const variant of variants) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, colorScheme: 'light', timezoneId: 'UTC' });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  const glbReqs = []; ctx.on('request', (r) => /\.glb$/.test(r.url()) && glbReqs.push({ url: r.url().replace(args.base, ''), fromSWContext: !!r.serviceWorker() }));
  ctx.on('response', (res) => /\.glb$/.test(res.url()) && glbReqs.push({ response: res.status(), fromServiceWorker: res.fromServiceWorker() }));
  const r = { variant };
  await p.goto(`${args.base}/?debug&seed=veteran&nookq=high#/`);
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload();
  await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
  r.precache = await p.evaluate(async () => {
    const urls = [];
    for (const k of await caches.keys()) for (const q of await (await caches.open(k)).keys()) urls.push(new URL(q.url).pathname);
    const glb = urls.filter((u) => u.endsWith('.glb'));
    return { entries: urls.length, glb };
  });
  if (variant.startsWith('glb-evicted')) {
    r.evicted = await p.evaluate(async () => {
      let n = 0;
      for (const k of await caches.keys()) { const c = await caches.open(k); for (const q of await c.keys()) if (q.url.endsWith('.glb')) n += (await c.delete(q)) ? 1 : 0; }
      return n;
    });
  }
  if (variant === 'glb-evicted-no-http-cache') { const cdp = await ctx.newCDPSession(p); await cdp.send('Network.clearBrowserCache'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }); r.httpCache = 'cleared + disabled'; }
  await ctx.setOffline(true);
  await p.reload();
  await p.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 30000 });
  await p.evaluate(() => window.__kettle.navigate('/nook'));
  await p.waitForSelector('section[aria-label="The room"] [data-scene-ready="true"]', { timeout: 120000 });
  await p.waitForFunction(() => window.__nook?.chaiKind === 'model' || window.__chai3d?.status?.().state === 'failed', null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(1500);
  r.offlineNook = await p.evaluate(() => ({ chaiKind: window.__nook.chaiKind, status: window.__chai3d.status(), online: navigator.onLine }));
  await p.evaluate(() => window.__nook.setRunning(false));
  await p.screenshot({ path: `${args.shots}/offline-nook-${variant}.png`, timeout: 180000 });
  r.glbRequests = glbReqs; r.errors = errors;
  await ctx.setOffline(false);
  out.runs.push(r);
  console.log(JSON.stringify(r));
  await ctx.close();
}
writeFileSync(args.out, JSON.stringify(out, null, 1));
await b.close();
