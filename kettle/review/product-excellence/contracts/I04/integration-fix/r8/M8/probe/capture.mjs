// M8 captures for R7-D1: BEFORE (b39202f) and AFTER (the round-8 revision), same session, full size.
// Frozen date and clock: page.clock.install({ time: 2026-10-11T09:00:00Z }) before the app loads, then clock.resume()
// so the app's own timers run; screenshots with animations: 'disabled' (idle animation paused).
// Setup as accept.mjs (debug API; Tea time by a REAL tap). The panel is scrolled with the REAL mouse wheel.
// Per configuration: top-n1 (update prompt), top-n3 (+ "Cozy level 5!" and an Undo toast, on their real timers),
// the extra toasts expire on their own, then wheel to the end: end-n1, end-n3.
//   node capture.mjs <base> <label> <out> "667x375@200:light,..."
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [,, base, label, out, cfgArg] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const { W, H, text, theme } of cfgs) {
  const tag = `${label}-${W}x${H}-t${text}-${theme}`;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  await ctx.addInitScript((pct) => {
    try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, text);
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date('2026-10-11T09:00:00Z') });
  await page.clock.resume();
  const shot = async (name) => { await sleep(900); await page.screenshot({ path: `${out}/${tag}-${name}.png`, animations: 'disabled' }); console.log(`${tag}-${name}.png`); };
  const raise = (which) => page.evaluate(async (which) => {
    const { toast } = await import('/src/ui/Toast.tsx');
    if (which === 'update') toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => {} } });
    else { toast('Cozy level 5!', { tone: 'success' }); toast('Marked “Chapter 3 notes” done', { tone: 'success', action: { label: 'Undo', onClick: () => {} } }); }
  }, which);
  const count = () => page.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').length);
  const waitCount = async (n, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await count()) === n) return true; await sleep(100); } return false; };
  try {
    await page.goto(`${base}/?debug&seed=newbie&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
    await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready); await sleep(800);
    await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await sleep(1500);
    await page.evaluate(() => window.__kettle.nearEnd()); await sleep(400); await page.evaluate(() => window.__kettle.finish());
    const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
    await tea.waitFor({ state: 'visible', timeout: 60_000 }); await sleep(2000);
    await tea.tap();
    await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
    await sleep(1200);
    await page.evaluate(() => window.__kettle.finish());
    await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached' });
    await waitCount(0, 15_000); await sleep(500);
    await raise('update'); await shot('top-n1');
    await raise('more'); await shot('top-n3');
    await waitCount(1, 8000);
    for (let i = 0; i < 30; i++) { const p = await page.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); const r = m.getBoundingClientRect(); return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round(r.right - 24), y: Math.round(Math.min(innerHeight, r.bottom) - 16) }; }); if (p.st >= p.max - 0.5) break; await page.mouse.move(p.x, p.y); await page.mouse.wheel(0, 100); await sleep(220); }
    await shot('end-n1');
    await raise('more'); await shot('end-n3');
  } catch (e) { console.log(`${tag} ERROR ${String(e.message).split('\n')[0]}`); }
  await ctx.close();
}
await browser.close();
