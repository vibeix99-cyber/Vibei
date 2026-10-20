// RF-console.mjs <label> <baseURL> <outdir> [viewport=desktop|phone]
// Console check: load Today, start a brew (real clicks), move the clock 90 s, end it (real clicks, the sheet), see the toast,
// start a second brew and let it finish (debug finish) to reach the summary, take Tea time, return to Today (debug navigate), open Stats (real click on the nav), scroll it,
// open Settings and go back to Today. Records EVERY console message (all types), pageerror, failed request and HTTP >= 400.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const [label, base, out, vp = 'desktop'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString().slice(11, 19);
const phone = vp === 'phone';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone, colorScheme: 'light' });
const p = await ctx.newPage();
const log = { label, base, viewport: vp, started: now(), steps: [], console: [], pageerrors: [], requestfailed: [], http4xx: [] };
let stepName = 'load';
p.on('console', (m) => log.console.push({ step: stepName, type: m.type(), text: m.text().slice(0, 600), loc: (m.location()?.url ?? '').replace(base, '') + ':' + (m.location()?.lineNumber ?? '') }));
p.on('pageerror', (e) => log.pageerrors.push({ step: stepName, message: String(e.message).slice(0, 600), stack: String(e.stack ?? '').split('\n').slice(0, 4).join(' / ') }));
p.on('requestfailed', (r) => log.requestfailed.push({ step: stepName, url: r.url().replace(base, ''), err: r.failure()?.errorText }));
p.on('response', (r) => { if (r.status() >= 400) log.http4xx.push({ step: stepName, url: r.url().replace(base, ''), status: r.status() }); });
const step = async (name, fn) => { stepName = name; const t = now(); let err = null; try { await fn(); } catch (e) { err = String(e.message).split('\n')[0]; } log.steps.push({ name, at: t, error: err }); console.log(`[${now()}] ${name}${err ? ' ERROR ' + err : ' ok'}`); };
const st = () => p.evaluate(() => window.__kettle.timer.getState().status);
const COMPOSER = { name: /What are you brewing/ };
log.chaiResponses = []; log.chaiProbes = [];
p.on('response', (r) => { if (/chai-[a-z-]+(-[\w-]{8})?\.webp/.test(r.url())) log.chaiResponses.push({ step: stepName, url: r.url().replace(base, ''), status: r.status(), fromSW: r.fromServiceWorker() }); });
const probe = async (tag) => {
  const v = await p.evaluate(() => ({
    hash: location.hash,
    poses: [...document.querySelectorAll('[data-pose]')].map((e) => { const i = e.querySelector('img'); return { pose: e.getAttribute('data-pose'), src: i ? i.currentSrc.split('/').pop() : null, ok: i ? i.complete && i.naturalWidth > 0 : null, nat: i ? i.naturalWidth + 'x' + i.naturalHeight : null }; }),
    chaiImgs: [...document.querySelectorAll('img')].filter((i) => /chai-/.test(i.currentSrc)).map((i) => ({ src: i.currentSrc.split('/').pop(), ok: i.complete && i.naturalWidth > 0, nat: i.naturalWidth + 'x' + i.naturalHeight })),
  }));
  log.chaiProbes.push({ tag, ...v });
};
await step('1 load Today', async () => {
  await p.goto(`${base}/?debug&onboarded=1#/`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => !!window.__kettle?.timerInfo);
  await p.getByRole('textbox', COMPOSER).waitFor({ state: 'visible' });
  await sleep(1500);
});
await step('2 start a brew (type, click Put the kettle on)', async () => {
  const box = p.getByRole('textbox', COMPOSER); await box.click(); await box.pressSequentially('Console check', { delay: 15 }); await sleep(400);
  await p.getByRole('button', { name: /put the kettle on/i }).click();
  await p.waitForFunction(() => window.__kettle.timer.getState().status === 'running', null, { timeout: 8000 });
  await sleep(2500); await probe('2 brew running (focus)');
});
await step('3 pause and resume (real clicks), Add 5 minutes', async () => {
  await p.getByRole('button', { name: 'Pause', exact: true }).click(); await sleep(800);
  await p.getByRole('button', { name: /^(Resume|Keep going|Continue)/ }).first().click().catch(async () => { await p.keyboard.press('Space'); });
  await sleep(800);
  await p.getByRole('button', { name: 'Add 5 minutes', exact: true }).click(); await sleep(1200);
});
await step('4 move the clock 90 s, end the brew (End session, sheet)', async () => {
  await p.evaluate(() => window.__kettle.ff(90_000)); await sleep(600);
  await p.getByRole('button', { name: 'End session', exact: true }).click();
  const dlg = p.getByRole('dialog'); await dlg.waitFor({ state: 'visible', timeout: 5000 });
  await dlg.getByRole('button', { name: 'End session', exact: true }).click();
  await p.waitForFunction(() => window.__kettle.timer.getState().status === 'idle', null, { timeout: 8000 });
  await sleep(2500); await probe('4 after End session (toast)'); // the "Saved ... of focus" toast
  log.toastText = await p.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert],[aria-live]')].map((e) => e.textContent?.trim()).filter(Boolean).slice(0, 6));
});
await step('5 Today again, start a second brew, let it finish (summary)', async () => {
  await p.getByRole('textbox', COMPOSER).waitFor({ state: 'visible', timeout: 8000 });
  await p.getByRole('button', { name: /put the kettle on/i }).click();
  await p.waitForFunction(() => window.__kettle.timer.getState().status === 'running', null, { timeout: 8000 });
  await sleep(1500);
  await p.evaluate(() => window.__kettle.nearEnd()); await sleep(400);
  await p.evaluate(() => window.__kettle.finish()); await sleep(6000);
  log.afterFinishHash = await p.evaluate(() => location.hash); await probe('5 summary after finish');
});
await step('6 summary: Tea time, back to Today, open Stats (real click), scroll', async () => {
  // the summary is a full screen without the nav: take its Tea time button (real click, best effort), then go to Today (debug navigate) for the nav
  await p.getByRole('button', { name: /Tea time|Long tea break/ }).click({ timeout: 5000 }).then(() => { log.teaTimeClicked = true; }, () => { log.teaTimeClicked = false; });
  await sleep(2500); await probe('6 after Tea time click');
  await p.evaluate(() => window.__kettle.navigate('/')); await sleep(1500); await probe('6 Today');
  const nav = p.getByRole('link', { name: /stats/i }).or(p.getByRole('button', { name: /stats/i })).first();
  await nav.click({ timeout: 8000 });
  await p.waitForFunction(() => location.hash.startsWith('#/stats'), null, { timeout: 8000 });
  await sleep(2500);
  for (const y of [400, 1200, 2400, 0]) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await sleep(400); }
  await probe('6 Stats'); log.statsHash = await p.evaluate(() => location.hash);
  log.statsHasHistory = await p.evaluate(() => /History/.test(document.body.innerText));
});
await step('7 open Settings (route), back to Today', async () => {
  await p.evaluate(() => window.__kettle.navigate('/settings')); await sleep(2000); await probe('7 Settings');
  await p.evaluate(() => window.__kettle.navigate('/')); await sleep(2000);
});
log.resources = await p.evaluate(() => performance.getEntriesByType('resource').filter((e) => /chai-/.test(e.name)).map((e) => ({ n: e.name.split('/').pop(), t: e.transferSize, d: e.decodedBodySize })));
log.ended = now();
const by = (t) => log.console.filter((c) => c.type === t).length;
log.counts = { console_total: log.console.length, error: by('error'), warning: by('warning'), warn: by('warn'), log: by('log'), info: by('info'), debug: by('debug'), pageerror: log.pageerrors.length, requestfailed: log.requestfailed.length, http4xx: log.http4xx.length };
log.hookOrder = log.console.concat(log.pageerrors.map((e) => ({ text: e.message }))).filter((c) => /hook|#310|#300|#311|Rendered (more|fewer)|Invalid hook/i.test(c.text)).map((c) => c.text);
writeFileSync(`${out}/console-${label}.json`, JSON.stringify(log, null, 1));
console.log('COUNTS', JSON.stringify(log.counts), 'hookOrder', JSON.stringify(log.hookOrder));
await b.close();
