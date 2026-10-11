// Lane R smoke: REAL input (mouse/touch-emulated clicks via Playwright's input pipeline) on the production preview.
// usage: node smoke.mjs --base http://127.0.0.1:5355 --out DIR [--w 390 --h 844 --dpr 2 --theme light]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const A = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => { if (x.startsWith('--')) a.push([x.slice(2), all[i + 1]]); return a; }, []));
const base = A.base, out = A.out, W = +(A.w ?? 390), H = +(A.h ?? 844), DPR = +(A.dpr ?? 2), theme = A.theme ?? 'light';
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const log = []; const t0 = Date.now();
const note = (s) => { const l = `[+${((Date.now() - t0) / 1000).toFixed(1)}s] ${s}`; console.log(l); log.push(l); };
const errors = [];
async function run(label, steps) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true, colorScheme: theme });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { errors.push({ run: label, kind: 'pageerror', text: e.message }); note(`PAGEERROR ${e.message}`); });
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) { errors.push({ run: label, kind: 'console.' + m.type(), text: m.text(), loc: m.location()?.url }); note(`CONSOLE.${m.type()} ${m.text()}`); } });
  p.on('requestfailed', (r) => { errors.push({ run: label, kind: 'requestfailed', text: r.url() + ' ' + (r.failure()?.errorText ?? '') }); note(`REQFAILED ${r.url()} ${r.failure()?.errorText}`); });
  p.on('response', (r) => { if (r.status() >= 400) { errors.push({ run: label, kind: 'http' + r.status(), text: r.url() }); note(`HTTP ${r.status()} ${r.url()}`); } });
  let n = 0;
  const shot = async (name) => { await p.screenshot({ path: `${out}/${label}-${String(++n).padStart(2, '0')}-${name}.png`, timeout: 120000 }); };
  const hash = () => p.evaluate(() => location.hash);
  try { await steps(p, shot, hash); } catch (e) { errors.push({ run: label, kind: 'script', text: String(e.stack ?? e) }); note(`SCRIPT FAIL ${e.message}`); try { await shot('FAIL'); } catch {} }
  await ctx.close();
}
const start = (p) => p.getByRole('button', { name: /^Put the kettle on · / });

// A: Home -> Put the kettle on (click) -> few seconds -> End session (click, confirm) [under a minute: nothing to save] -> Home
await run('A-early-end', async (p, shot, hash) => {
  await p.goto(`${base}/?debug&onboarded=1#/`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  note('A home loaded, hash ' + await hash()); await shot('home');
  await start(p).click(); note('A clicked Put the kettle on');
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 30000 }); note('A at #/focus');
  await p.waitForTimeout(4000); await shot('focus-running');
  await p.getByRole('button', { name: 'End session' }).click(); note('A clicked End session');
  const dlg = p.getByRole('dialog', { name: 'Leave the kettle early?' }); await dlg.waitFor({ timeout: 15000 }); await shot('end-sheet');
  note('A end sheet text: ' + (await dlg.innerText()).replace(/\s+/g, ' ').slice(0, 200));
  await dlg.getByRole('button', { name: 'End session' }).click(); note('A confirmed End session');
  await p.waitForFunction(() => location.hash === '#/', null, { timeout: 30000 }); await p.waitForTimeout(1500); await shot('after-end'); note('A back at ' + await hash());
});

// B: Home -> Put the kettle on (click) -> few real seconds -> brew reaches its end (debug clock jump to 600 ms before the end, then real wait) -> summary
//    -> Skip break (click) -> Home -> Nook (tab click)
await run('B-full', async (p, shot, hash) => {
  await p.goto(`${base}/?debug&onboarded=1#/`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false }));
  await start(p).click(); note('B clicked Put the kettle on');
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 30000 });
  await p.waitForTimeout(4000); await shot('focus-running');
  await p.evaluate(() => { const k = window.__kettle; const s = k.timer.getState(); k.ff(s.endsAt - k.clock.now() - 600); }); note('B jumped clock to 600 ms before the end (debug)');
  await p.waitForFunction(() => location.hash === '#/done', null, { timeout: 60000 }); note('B at #/done');
  await p.getByRole('heading', { level: 1, name: /minutes? brewed/ }).waitFor({ timeout: 30000 });
  await p.waitForTimeout(2500); await shot('summary');
  note('B summary text: ' + (await p.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 400));
  await p.getByRole('button', { name: 'Skip break' }).click(); note('B clicked Skip break');
  await p.waitForFunction(() => location.hash === '#/', null, { timeout: 30000 }); await p.waitForTimeout(1500); await shot('after-skip'); note('B back at ' + await hash());
  await p.getByRole('link', { name: 'Nook' }).click(); note('B clicked Nook tab');
  await p.waitForFunction(() => location.hash === '#/nook', null, { timeout: 30000 });
  await p.waitForTimeout(6000); await shot('nook'); note('B at ' + await hash());
  note('B nook hint present: ' + (await p.locator('p[class*=hint]').count()));
});

// C: same as B but 3D OFF (static drawing: the Nook hint text and the backdrop layers are the changed code), ends with the Nook.
await run('C-3d-off', async (p, shot, hash) => {
  await p.goto(`${base}/?debug&onboarded=1#/`, { waitUntil: 'networkidle' });
  await p.evaluate(() => { window.__kettle.settings.getState().set({ autoStartBreaks: false, scene: 'off' }); });
  await p.waitForTimeout(500);
  await start(p).click(); note('C clicked Put the kettle on (3D off)');
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 30000 });
  await p.waitForTimeout(3000); await shot('focus-running');
  await p.evaluate(() => { const k = window.__kettle; const s = k.timer.getState(); k.ff(s.endsAt - k.clock.now() - 600); });
  await p.waitForFunction(() => location.hash === '#/done', null, { timeout: 60000 });
  await p.getByRole('heading', { level: 1, name: /minutes? brewed/ }).waitFor({ timeout: 30000 });
  await p.waitForTimeout(2500); await shot('summary');
  await p.getByRole('button', { name: 'Skip break' }).click(); note('C clicked Skip break');
  await p.waitForFunction(() => location.hash === '#/', null, { timeout: 30000 }); await p.waitForTimeout(1000);
  await p.getByRole('link', { name: 'Nook' }).click(); note('C clicked Nook tab');
  await p.waitForFunction(() => location.hash === '#/nook', null, { timeout: 30000 });
  await p.waitForTimeout(2500); await shot('nook');
  note('C nook hint text: ' + JSON.stringify(await p.locator('p[class*=hint]').allInnerTexts()));
});

writeFileSync(`${out}/smoke-log.json`, JSON.stringify({ base, viewport: { W, H, DPR, theme }, startedAt: new Date(t0).toISOString(), errors, log }, null, 1));
console.log('ERRORS:', JSON.stringify(errors, null, 1));
await b.close();
