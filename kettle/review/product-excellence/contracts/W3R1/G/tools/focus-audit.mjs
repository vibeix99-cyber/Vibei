// Focus-ring audit: Tab through a screen with real key presses, and for every stop record where the ring is drawn,
// its colour/width/offset, its contrast against what is behind it, and whether an overflow ancestor clips it.
//   node focus-audit.mjs <baseUrl> <outDir> <hash-route> [w] [h] [theme] [pct] [setup-json]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, route = '/settings', W = '1440', H = '900', theme = 'light', pct = '100', setup = '{}'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const w = +W, h = +H;
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
if (pct !== '100') await ctx.addInitScript((p) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); }), pct);
const page = await ctx.newPage();
await page.clock.install({ time: FIXED });
await page.clock.resume();
await page.goto(`${url}/?debug&seed=veteran&theme=${theme}#${route === '/focus' ? '/' : route}`);
await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
await page.evaluate((s) => window.__kettle.settings.getState().set({ muted: true, ...JSON.parse(s) }), setup);
if (route === '/focus') {
  // The session controls: start a brew with a real click.
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash.startsWith('#/focus'), null, { timeout: 15000 });
}
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
await page.mouse.click(2, 2);
const rows = [];
const seen = new Set();
for (let i = 0; i < 90; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(60);
  const r = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return { L: 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b), a }; };
    const cr = (a, b) => { const x = lum(a).L, y = lum(b).L; return +(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2)); };
    let ring = [el, ...el.querySelectorAll('*'), el.parentElement, el.parentElement?.parentElement].filter(Boolean).find((e) => { const cs = getComputedStyle(e); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0; });
    const name = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
    const id = `${el.tagName.toLowerCase()}[${el.getAttribute('role') || ''}] ${name}`;
    if (!ring) {
      const cs = getComputedStyle(el);
      return { id, ring: 'NONE', boxShadow: cs.boxShadow.slice(0, 80) };
    }
    const cs = getComputedStyle(ring);
    const ow = parseFloat(cs.outlineWidth), oo = parseFloat(cs.outlineOffset);
    const rr = ring.getBoundingClientRect();
    const grow = oo + ow;
    const box = { l: rr.left - grow, t: rr.top - grow, r: rr.right + grow, b: rr.bottom + grow };
    // what's behind the outline: walk up from the ring's parent (outline drawn outside the box when offset >= 0)
    let bgEl = oo >= 0 ? ring.parentElement : ring, bg = 'rgb(255,255,255)';
    while (bgEl) { const b = getComputedStyle(bgEl).backgroundColor; if (lum(b) && lum(b).a > 0.5) { bg = b; break; } bgEl = bgEl.parentElement; }
    if (!bgEl) bg = getComputedStyle(document.body).backgroundColor;
    let clipped = 0, clipBy = '';
    for (let a = ring.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const acs = getComputedStyle(a);
      if (/(hidden|auto|scroll|clip)/.test(acs.overflowX + acs.overflowY)) {
        const ar = a.getBoundingClientRect();
        const c = Math.max(ar.left + a.clientLeft - box.l, ar.top + a.clientTop - box.t, box.r - (ar.left + a.clientLeft + a.clientWidth), box.b - (ar.top + a.clientTop + a.clientHeight), 0);
        if (c > clipped) { clipped = +c.toFixed(1); clipBy = (a.className || a.tagName).toString().slice(0, 40); }
      }
    }
    el.scrollIntoView({ block: 'center' });
    const r2 = ring.getBoundingClientRect();
    return { id, ringOn: ring === el ? 'self' : (ring.className || ring.tagName).toString().slice(0, 30), color: cs.outlineColor, width: ow, offset: oo, bg, contrast: cr(cs.outlineColor, bg), clipped, clipBy, rect: { x: r2.left - grow - 8, y: r2.top - grow - 8, w: r2.width + 2 * grow + 16, h: r2.height + 2 * grow + 16 } };
  });
  if (!r) continue;
  const key = r.id;
  if (seen.has(key) && i > 5) { if ([...seen].indexOf(key) === 0) break; }
  seen.add(key);
  if (r.rect) {
    await page.waitForTimeout(80);
    const c = r.rect; const clip = { x: Math.max(0, c.x), y: Math.max(0, c.y), width: Math.min(c.w, w - Math.max(0, c.x)), height: Math.min(c.h, h - Math.max(0, c.y)) };
    if (clip.width > 2 && clip.height > 2) await page.screenshot({ path: `${out}/stop-${String(rows.length).padStart(2, '0')}.png`, clip });
  }
  rows.push(r);
}
fs.writeFileSync(`${out}/focus-audit.json`, JSON.stringify(rows, null, 1));
for (const [i, r] of rows.entries()) console.log(String(i).padStart(2), r.ring === 'NONE' ? 'NO RING' : `${r.ringOn.padEnd(14)} w${r.width} o${r.offset} cr${r.contrast} ${r.clipped ? 'CLIPPED ' + r.clipped + 'px by ' + r.clipBy : ''}`, '|', r.id);
await browser.close();
