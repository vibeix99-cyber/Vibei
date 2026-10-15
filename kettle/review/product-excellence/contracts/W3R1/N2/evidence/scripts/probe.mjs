// Matrix probe: tap a History row (mouse / touch) at several places on screen; record row top + scrollY across open / close.
// node probe.mjs <baseURL> <out.json> [cfgFilter]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [base, OUT, FILTER = ''] = process.argv.slice(2);
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const CFGS = [
  { id: '1440-200r-light', w: 1440, h: 900, pct: 200, reduced: true, theme: 'light', touch: false },
  { id: '1440-100-light', w: 1440, h: 900, pct: 100, reduced: false, theme: 'light', touch: false },
  { id: '1440-200-dark', w: 1440, h: 900, pct: 200, reduced: false, theme: 'dark', touch: false },
  { id: '390-100-light', w: 390, h: 844, pct: 100, reduced: false, theme: 'light', touch: true },
  { id: '390-200-light', w: 390, h: 844, pct: 200, reduced: false, theme: 'light', touch: true },
  { id: '375-200r-light', w: 375, h: 667, pct: 200, reduced: true, theme: 'light', touch: true },
].filter((c) => !FILTER || FILTER.split(',').includes(c.id));
const PLACES = ['mid', 'nearBottom', 'nearTop'];
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
for (const c of CFGS) {
  for (const place of PLACES) {
    const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.touch ? 2 : 1, isMobile: c.touch, hasTouch: c.touch, colorScheme: c.theme, reducedMotion: c.reduced ? 'reduce' : 'no-preference' });
    await ctx.addInitScript((pct) => {
      try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
      if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
      const L = (window.__log = []);
      const stack = () => new Error().stack.split('\n').slice(2, 6).map((l) => l.trim().replace(/http:\/\/[^/]+/, '').slice(0, 110));
      for (const n of ['scrollTo', 'scroll', 'scrollBy']) { const o = window[n]; window[n] = function (...a) { L.push({ k: 'window.' + n, a: JSON.stringify(a), sy: scrollY, stack: stack() }); return o.apply(this, a); }; }
      for (const n of ['scrollIntoView', 'scrollIntoViewIfNeeded']) { const o = Element.prototype[n]; if (o) Element.prototype[n] = function (...a) { L.push({ k: 'el.' + n, a: JSON.stringify(a), sy: scrollY, stack: stack() }); return o.apply(this, a); }; }
      addEventListener('scroll', () => L.push({ k: 'scroll', sy: scrollY, t: Math.round(performance.now()) }), { capture: true, passive: true });
    }, c.pct);
    const page = await ctx.newPage();
    await page.clock.install({ time: MONDAY });
    await page.clock.resume();
    await page.goto(`${base}/?debug&seed=veteran&theme=${c.theme}#/stats`);
    await page.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const rows = page.locator('main button[aria-label*="Edit"]');
    await rows.first().waitFor({ timeout: 15000 });
    const target = rows.nth(2);
    const barTop = await page.evaluate(() => { const b = document.querySelector('[class*="compactBar"]'); return b ? b.getBoundingClientRect().bottom : 0; });
    const tabTop = await page.evaluate(() => { const t = [...document.querySelectorAll('nav')].map((n) => n.getBoundingClientRect()).filter((r) => r.width > 0 && r.top > innerHeight / 2 && r.height < 140).map((r) => r.top)[0]; return t ?? innerHeight; });
    const desired = place === 'mid' ? c.h / 2 - 50 : place === 'nearBottom' ? tabTop - 30 : Math.max(barTop, 0) - 25;
    await target.evaluate((b, d) => { const li = b.closest('li'); const r = li.getBoundingClientRect(); window.scrollTo(0, scrollY + r.top - d); }, desired);
    await page.waitForTimeout(900);
    const rec = await target.evaluate((b) => {
      const li = b.closest('li'); const r = li.getBoundingClientRect(); const br = b.getBoundingClientRect();
      // a point of the button that is really hit
      let pt = null;
      for (let f = 0.5; f <= 1.0 && !pt; f += 0.05) { const x = br.left + br.width / 2, y = br.top + br.height * f; if (y > 0 && y < innerHeight) { const e = document.elementFromPoint(x, y); if (e && b.contains(e)) pt = { x, y }; } }
      if (!pt) for (let f = 0.5; f >= 0 && !pt; f -= 0.05) { const x = br.left + br.width / 2, y = br.top + br.height * f; if (y > 0 && y < innerHeight) { const e = document.elementFromPoint(x, y); if (e && b.contains(e)) pt = { x, y }; } }
      return { top: r.top, h: r.height, sy: scrollY, pt };
    });
    const out = { cfg: c.id, place, pre: rec };
    if (!rec.pt) { out.skip = 'no hit-testable point'; results.push(out); await ctx.close(); continue; }
    await page.evaluate(() => { window.__log.length = 0; window.__frames = []; const li = [...document.querySelectorAll('main button[aria-label*="Edit"]')][2].closest('li'); const f = () => { window.__frames.push([Math.round(performance.now()), scrollY, li.isConnected ? li.getBoundingClientRect().top : null]); requestAnimationFrame(f); }; requestAnimationFrame(f); });
    if (c.touch) await page.touchscreen.tap(rec.pt.x, rec.pt.y);
    else { await page.mouse.move(rec.pt.x, rec.pt.y); await page.waitForTimeout(80); await page.mouse.click(rec.pt.x, rec.pt.y); }
    const dlg = page.getByRole('dialog', { name: 'Edit brew' });
    await dlg.waitFor({ timeout: 10000 });
    await page.waitForTimeout(1500);
    out.open = await target.evaluate((b) => ({ top: b.closest('li').getBoundingClientRect().top, sy: scrollY }));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[role=dialog]'), null, { timeout: 10000 });
    await page.waitForTimeout(1200);
    out.closed = await target.evaluate((b) => ({ top: b.closest('li').getBoundingClientRect().top, sy: scrollY, ae: document.activeElement === b }));
    out.log = await page.evaluate(() => window.__log.filter((e) => e.k !== 'scroll' || true).slice(0, 20));
    const fr = await page.evaluate(() => window.__frames);
    out.maxDy = Math.max(...fr.map((f) => Math.abs(f[1] - rec.sy)));
    out.maxDtop = Math.max(...fr.filter((f) => f[2] != null).map((f) => Math.abs(f[2] - rec.top)));
    results.push(out);
    console.log(JSON.stringify({ cfg: c.id, place, pre: [Math.round(rec.top), rec.sy], open: [Math.round(out.open.top), out.open.sy], closed: [Math.round(out.closed.top), out.closed.sy, out.closed.ae], maxDy: out.maxDy, maxDtop: Math.round(out.maxDtop * 10) / 10, api: out.log.filter((e) => e.k !== 'scroll').length, scrollEv: out.log.filter((e) => e.k === 'scroll').length }));
    await ctx.close();
  }
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
await browser.close();
