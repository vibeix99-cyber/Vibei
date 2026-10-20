// RF3-offline.mjs <label> <baseURL> <outdir>
// Offline check on the preview: wait for the service worker to activate and control the page, list the Chai webp in the SW caches, go offline (context.setOffline),
// fetch + decode the three shipped Chai images (reading, sipping, cheering), reload offline, and drive the app offline to the states that show them
// (a brew running, the summary, Tea time) reading each [data-pose] image (complete, naturalWidth). Records console, pageerror, failed requests, HTTP >= 400.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const [label, base, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString().slice(11, 19);
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: 'light', serviceWorkers: 'allow' });
const p = await ctx.newPage();
const log = { label, base, started: now(), steps: [], console: [], pageerrors: [], requestfailed: [], http4xx: [], chaiResponses: [], chaiProbes: [] };
let phase = 'online';
p.on('console', (m) => log.console.push({ phase, type: m.type(), text: m.text().slice(0, 500) }));
p.on('pageerror', (e) => log.pageerrors.push({ phase, message: String(e.message).slice(0, 500) }));
p.on('requestfailed', (r) => log.requestfailed.push({ phase, url: r.url().replace(base, ''), err: r.failure()?.errorText }));
p.on('response', (r) => { const u = r.url(); if (r.status() >= 400) log.http4xx.push({ phase, url: u.replace(base, ''), status: r.status() }); if (/chai-[a-z-]+.*\.webp/.test(u)) log.chaiResponses.push({ phase, url: u.replace(base, ''), status: r.status(), fromSW: r.fromServiceWorker() }); });
const step = async (name, fn) => { const t = now(); let err = null; try { await fn(); } catch (e) { err = String(e.message).split('\n')[0]; } log.steps.push({ name, at: t, error: err }); console.log(`[${now()}] ${name}${err ? ' ERROR ' + err : ' ok'}`); };
const COMPOSER = { name: /What are you brewing/ };
const probe = async (tag) => {
  const v = await p.evaluate(() => ({
    hash: location.hash, online: navigator.onLine,
    poses: [...document.querySelectorAll('[data-pose]')].map((e) => { const i = e.querySelector('img'); return { pose: e.getAttribute('data-pose'), src: i ? i.currentSrc.split('/').pop() : null, ok: i ? i.complete && i.naturalWidth > 0 : null, nat: i ? i.naturalWidth + 'x' + i.naturalHeight : null }; }),
  }));
  log.chaiProbes.push({ tag, phase, ...v });
};
await step('1 load, wait for the service worker to activate and control the page', async () => {
  await p.goto(`${base}/?debug&onboarded=1#/`, { waitUntil: 'networkidle' });
  log.sw1 = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { state: r.active?.state, scope: r.scope, controller: !!navigator.serviceWorker.controller }; });
  if (!log.sw1.controller) { await p.reload({ waitUntil: 'networkidle' }); }
  await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  log.sw2 = await p.evaluate(() => ({ state: navigator.serviceWorker.controller.state, url: navigator.serviceWorker.controller.scriptURL }));
  await p.getByRole('textbox', COMPOSER).waitFor({ state: 'visible' });
});
await step('2 list the Chai images in the service-worker caches', async () => {
  log.cached = await p.evaluate(async () => { const out = {}; for (const k of await caches.keys()) { const c = await caches.open(k); out[k] = (await c.keys()).map((r) => r.url).filter((u) => /chai-/.test(u)).map((u) => u.split('/').pop().split('?')[0]); } return out; });
  const names = Object.values(log.cached).flat();
  log.want = ['chai-reading', 'chai-sipping', 'chai-cheering'].map((n) => ({ n, cached: names.filter((x) => x.startsWith(n + '-')) }));
});
const urls = await p.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name));
// the URL of each shipped image as the page builds it: take it from the cache listing
const chaiUrls = await p.evaluate(async () => { const o = []; for (const k of await caches.keys()) { const c = await caches.open(k); for (const r of await c.keys()) if (/chai-(reading|sipping|cheering)-/.test(r.url)) o.push(r.url); } return o; });
log.chaiUrls = chaiUrls.map((u) => u.replace(base, ''));
phase = 'offline';
await ctx.setOffline(true);
await step('3 offline: fetch and decode the three Chai images', async () => {
  log.offlineFetch = await p.evaluate(async (us) => {
    const res = [];
    for (const u of us) {
      const r = { url: u.split('/').pop() };
      try { const f = await fetch(u); r.status = f.status; r.type = f.headers.get('content-type'); r.bytes = (await f.arrayBuffer()).byteLength; } catch (e) { r.fetchError = String(e); }
      try { const im = new Image(); im.src = u; await im.decode(); r.imgOk = im.naturalWidth > 0; } catch (e) { r.imgError = String(e).slice(0, 100); }
      res.push(r);
    }
    return res;
  }, chaiUrls);
});
await step('4 offline: reload, the app boots', async () => {
  await p.reload({ waitUntil: 'load' });
  await p.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 15000 });
  await p.getByRole('textbox', COMPOSER).waitFor({ state: 'visible', timeout: 15000 });
  log.offlineReloadOnline = await p.evaluate(() => navigator.onLine);
  await probe('4 Today (offline reload)');
});
await step('5 offline: start a brew (real clicks), Chai during focus', async () => {
  const box = p.getByRole('textbox', COMPOSER); await box.click(); await box.pressSequentially('Offline check', { delay: 15 }); await sleep(400);
  await p.getByRole('button', { name: /put the kettle on/i }).click();
  await p.waitForFunction(() => window.__kettle.timer.getState().status === 'running', null, { timeout: 8000 });
  await sleep(2500); await probe('5 brew running (offline)');
});
await step('6 offline: end it (summary, cheering)', async () => {
  await p.evaluate(() => window.__kettle.ff(90_000)); await sleep(500);
  await p.evaluate(() => window.__kettle.nearEnd()); await sleep(400);
  await p.evaluate(() => window.__kettle.finish()); await sleep(6000);
  await probe('6 summary (offline)');
});
await step('7 offline: Tea time (sipping)', async () => {
  await p.getByRole('button', { name: /Tea time|Long tea break/ }).click({ timeout: 5000 }); await sleep(2500);
  await probe('7 tea break (offline)');
  await p.evaluate(() => window.__kettle.navigate('/settings')); await sleep(2000); await probe('7 Settings (offline)');
});
log.resources = await p.evaluate(() => performance.getEntriesByType('resource').filter((e) => /chai-/.test(e.name)).map((e) => ({ n: e.name.split('/').pop(), t: e.transferSize, d: e.decodedBodySize })));
await ctx.setOffline(false);
log.ended = now();
const by = (t) => log.console.filter((c) => c.type === t).length;
log.counts = { console_total: log.console.length, error: by('error'), warning: by('warning'), pageerror: log.pageerrors.length, requestfailed: log.requestfailed.length, http4xx: log.http4xx.length };
writeFileSync(`${out}/offline-${label}.json`, JSON.stringify(log, null, 1));
console.log('COUNTS', JSON.stringify(log.counts));
await b.close();
