// Lane R (W2R2) smoke: REAL input (Playwright mouse/touch pipeline) on the production preview, one continuous flow.
// Home -> "Put the kettle on" (click) -> few real seconds -> End session (click) -> confirm End session (click) -> Today
// -> Put the kettle on again (click) -> __kettle.finish() -> summary -> Skip break (click) -> Today -> Nook (tab click).
// usage: node smoke.mjs --base http://127.0.0.1:5455 --out DIR [--w 390 --h 844 --dpr 2 --theme light]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const A = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => { if (x.startsWith('--')) a.push([x.slice(2), all[i + 1]]); return a; }, []));
const base = A.base, out = A.out, W = +(A.w ?? 390), H = +(A.h ?? 844), DPR = +(A.dpr ?? 2), theme = A.theme ?? 'light';
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const log = []; const t0 = Date.now();
const note = (s) => { const l = `[+${((Date.now() - t0) / 1000).toFixed(1)}s] ${s}`; console.log(l); log.push(l); };
const errors = [];
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true, colorScheme: theme });
const p = await ctx.newPage();
p.on('pageerror', (e) => { errors.push({ kind: 'pageerror', text: e.message }); note(`PAGEERROR ${e.message}`); });
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) { errors.push({ kind: 'console.' + m.type(), text: m.text(), loc: m.location()?.url }); note(`CONSOLE.${m.type()} ${m.text()}`); } });
p.on('requestfailed', (r) => { errors.push({ kind: 'requestfailed', text: r.url() + ' ' + (r.failure()?.errorText ?? '') }); note(`REQFAILED ${r.url()} ${r.failure()?.errorText}`); });
p.on('response', (r) => { if (r.status() >= 400) { errors.push({ kind: 'http' + r.status(), text: r.url() }); note(`HTTP ${r.status()} ${r.url()}`); } });
let n = 0;
const shot = async (name) => { await p.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${name}.png`, timeout: 120000 }); };
const hash = () => p.evaluate(() => location.hash);
const start = () => p.getByRole('button', { name: /^Put the kettle on · / });
const steps = [];
const step = async (label, fn) => { try { await fn(); steps.push({ label, ok: true }); note(`OK   ${label}`); } catch (e) { steps.push({ label, ok: false, err: String(e.message).split('\n')[0] }); errors.push({ kind: 'script', text: `${label}: ${String(e.stack ?? e)}` }); note(`FAIL ${label}: ${String(e.message).split('\n')[0]}`); try { await shot('FAIL-' + label.replace(/\W+/g, '-')); } catch {} throw e; } };
try {
  await step('load home', async () => { await p.goto(`${base}/?debug&onboarded=1#/`, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false })); note('hash ' + await hash()); await shot('home'); });
  await step('click Put the kettle on', async () => { await start().click(); await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 30000 }); await p.waitForTimeout(4000); await shot('focus-running'); });
  await step('click End session', async () => { await p.getByRole('button', { name: 'End session' }).click(); const dlg = p.getByRole('dialog', { name: 'Leave the kettle early?' }); await dlg.waitFor({ timeout: 15000 }); await shot('end-sheet'); note('end sheet text: ' + (await dlg.innerText()).replace(/\s+/g, ' ').slice(0, 200)); });
  await step('confirm End session', async () => { const dlg = p.getByRole('dialog', { name: 'Leave the kettle early?' }); await dlg.getByRole('button', { name: 'End session' }).click(); await p.waitForFunction(() => location.hash === '#/', null, { timeout: 30000 }); await p.waitForTimeout(1500); await shot('today-after-end'); note('back at ' + await hash()); });
  await step('start again (click)', async () => { await start().click(); await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 30000 }); await p.waitForTimeout(3000); await shot('focus-running-2'); });
  await step('__kettle.finish()', async () => { await p.evaluate(() => window.__kettle.finish()); await p.waitForFunction(() => location.hash === '#/done', null, { timeout: 60000 }); note('at #/done'); await p.getByRole('heading', { level: 1, name: /minutes? brewed/ }).waitFor({ timeout: 30000 }); await p.waitForTimeout(2500); await shot('summary'); note('summary text: ' + (await p.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 400)); });
  await step('click Skip break', async () => { await p.getByRole('button', { name: 'Skip break' }).click(); await p.waitForFunction(() => location.hash === '#/', null, { timeout: 30000 }); await p.waitForTimeout(1500); await shot('today-after-skip'); note('back at ' + await hash()); });
  await step('click Nook tab', async () => { await p.getByRole('link', { name: 'Nook' }).click(); await p.waitForFunction(() => location.hash === '#/nook', null, { timeout: 30000 }); await p.waitForTimeout(6000); await shot('nook'); note('at ' + await hash()); note('nook hint count: ' + (await p.locator('p[class*=hint]').count())); });
} catch {}
const info = await p.evaluate(() => ({ tier: (() => { try { return JSON.stringify(window.__kettle.settings.getState().scene); } catch { return null; } })(), hash: location.hash })).catch(() => ({}));
writeFileSync(`${out}/smoke-log.json`, JSON.stringify({ base, viewport: { W, H, DPR, theme }, startedAt: new Date(t0).toISOString(), steps, info, errors, log }, null, 1));
console.log('STEPS:', JSON.stringify(steps));
console.log('ERRORS:', JSON.stringify(errors, null, 1));
await ctx.close(); await b.close();
