// Does a scroll already in flight (smooth scroll, a wheel's animation, a fling) keep going after the Edit sheet opens?
// node inflight.mjs <base> <out.json>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [base, OUT] = process.argv.slice(2);
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const out = [];
for (const c of [{ id: '1440-200r', w: 1440, h: 900, pct: 200, reduced: true, touch: false }, { id: '1440-100', w: 1440, h: 900, pct: 100, reduced: false, touch: false }]) {
  for (const dist of [60, 300]) {
    const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, reducedMotion: c.reduced ? 'reduce' : 'no-preference' });
    await ctx.addInitScript((pct) => {
      try { localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
      if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
    }, c.pct);
    const page = await ctx.newPage();
    await page.clock.install({ time: MONDAY }); await page.clock.resume();
    await page.goto(`${base}/?debug&seed=veteran#/stats`);
    await page.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    const row = page.locator('main button[aria-label*="Edit"]').nth(2);
    await row.evaluate((b) => { const r = b.closest('li').getBoundingClientRect(); scrollTo({ top: scrollY + r.top - (innerHeight / 2 - r.height / 2), behavior: 'instant' }); });
    await page.waitForTimeout(600);
    const bb = await row.boundingBox();
    await page.mouse.move(Math.round(bb.x + bb.width / 2), Math.round(bb.y + bb.height / 2));
    await page.evaluate(() => { const T = (window.__T = []); const t0 = performance.now(); window.__t0 = t0; const f = () => { T.push([Math.round(performance.now() - t0), Math.round(scrollY * 10) / 10, !!document.querySelector('[role=dialog]')]); if (T.length < 400) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    const sy0 = await page.evaluate(() => scrollY);
    await page.evaluate((d) => scrollTo({ top: scrollY + d, behavior: 'smooth' }), dist);
    await page.mouse.click(Math.round(bb.x + bb.width / 2), Math.round(bb.y + 20));
    await page.getByRole('dialog', { name: 'Edit brew' }).waitFor({ timeout: 10000 });
    await page.waitForTimeout(1500);
    const T = await page.evaluate(() => window.__T);
    const open = T.find((f) => f[2]);
    const last = T[T.length - 1];
    // scrollY at the first frame with the dialog, and after it
    const after = T.filter((f) => f[2]);
    const r = { cfg: c.id, dist, sy0, sy_at_dialog: open?.[1], t_dialog: open?.[0], sy_final: last[1], moved_after_dialog: Math.round((after[after.length - 1][1] - open[1]) * 10) / 10, moved_total: Math.round((last[1] - sy0) * 10) / 10 };
    console.log(JSON.stringify(r)); out.push({ ...r, frames: T.filter((f, i) => i === 0 || f[1] !== T[i - 1][1] || f[2] !== T[i - 1][2]) });
    await ctx.close();
  }
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
await browser.close();
