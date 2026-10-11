import { chromium } from 'playwright';
const base = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 667, height: 375 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' });
await ctx.addInitScript(() => {
  try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
  addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:200%!important}`; document.head.appendChild(s); });
});
const page = await ctx.newPage();
await page.goto(`${base}/?debug&seed=newbie&theme=light#/`);
await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
await sleep(1200);
await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
await sleep(1500);
await page.evaluate(() => window.__kettle.finish());
const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
await tea.waitFor({ state: 'visible', timeout: 60000 }); await sleep(2000);
await tea.tap();
await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached' }); await sleep(1000);
await page.evaluate(() => window.__kettle.finish());
await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached' });
await page.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 0, null, { timeout: 15000 });
await page.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => {} } }); });
await sleep(800);
await page.evaluate(() => {
  const R = (window.__d = []);
  const f = () => {
    const main = document.querySelector('[data-focus-view] main'); const mr = main.getBoundingClientRect();
    const li = document.querySelector('[aria-label="Notifications"] li'); const q = li?.getBoundingClientRect();
    const reg = li?.closest('[aria-label="Notifications"]')?.parentElement;
    const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => /^Mark it done/.test(b.textContent.trim()));
    const c = el.getBoundingClientRect();
    const t = Math.max(c.top, mr.top), b = Math.min(c.bottom, mr.bottom);
    let hit = null;
    if (b - t >= 8) { const h = document.elementFromPoint(c.left + c.width / 2, (t + b) / 2); hit = h && el.contains(h) ? 'self' : (h?.closest('li') ? 'TOAST' : h?.tagName); }
    R.push([Math.round(performance.now()), Math.round(main.scrollTop), reg?.hasAttribute('data-docked') ? 'D' : '-', q ? [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)] : null, [Math.round(c.left), Math.round(t), Math.round(c.right), Math.round(b)], hit]);
    if (R.length < 400) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
});
for (let i = 0; i < 10; i++) {
  const p = await page.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); const r = m.getBoundingClientRect(); return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round(r.right - 24), y: Math.round(Math.min(innerHeight, r.bottom) - 40) }; });
  if (p.st >= p.max - 1) break;
  await page.mouse.move(p.x, p.y); await page.mouse.wheel(0, 80); await sleep(140);
}
await sleep(500);
const d = await page.evaluate(() => window.__d);
let prev = null;
for (const r of d) { const k = JSON.stringify(r.slice(1)); if (k !== prev) console.log(JSON.stringify(r)); prev = k; }
await browser.close();
