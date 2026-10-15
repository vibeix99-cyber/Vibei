// Frame-by-frame trace of tapping a History row. node trace.mjs <baseURL> <w> <h> <pct> <reduced0|1> <touch0|1> <out.json> [theme]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [base, W, H, PCT, RED, TOUCH, OUT, THEME = 'light'] = process.argv.slice(2);
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const w = +W, h = +H, touch = TOUCH === '1';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch, colorScheme: THEME, reducedMotion: RED === '1' ? 'reduce' : 'no-preference' });
await ctx.addInitScript((pct) => {
  try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
  if (+pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  // --- instrumentation
  const T = (window.__tr = { ev: [], frames: [], row: null, on: false });
  const now = () => Math.round(performance.now() * 10) / 10;
  const stack = () => new Error().stack.split('\n').slice(2, 7).map((l) => l.trim().replace(/http:\/\/[^/]+/, '').slice(0, 130));
  const desc = (e) => e ? `${e.tagName?.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''}` : String(e);
  const log = (k, extra = {}) => T.on && T.ev.push({ t: now(), k, sy: Math.round(scrollY * 10) / 10, ...extra });
  for (const n of ['scrollTo', 'scroll', 'scrollBy']) { const o = window[n]; window[n] = function (...a) { log('window.' + n, { a: JSON.stringify(a), stack: stack() }); return o.apply(this, a); }; }
  for (const n of ['scrollIntoView', 'scrollIntoViewIfNeeded', 'focus', 'scrollTo', 'scroll', 'scrollBy', 'blur', 'click']) {
    const o = Element.prototype[n] ?? HTMLElement.prototype[n]; if (!o) continue;
    const owner = Element.prototype[n] ? Element.prototype : HTMLElement.prototype;
    owner[n] = function (...a) { log('el.' + n, { el: desc(this), a: JSON.stringify(a), stack: stack() }); return o.apply(this, a); };
  }
  const st = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
  Object.defineProperty(Element.prototype, 'scrollTop', { ...st, set(v) { log('el.scrollTop=', { el: desc(this), v, stack: stack() }); return st.set.call(this, v); } });
  addEventListener('scroll', () => log('scroll'), { capture: true, passive: true });
  addEventListener('wheel', (e) => log('wheel', { dy: e.deltaY }), { capture: true, passive: true });
  for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'touchstart', 'touchend']) addEventListener(t, (e) => log(t, { target: desc(e.target) }), true);
  document.addEventListener('focusin', (e) => log('focusin', { target: desc(e.target), fv: e.target.matches?.(':focus-visible') }), true);
  document.addEventListener('focusout', (e) => log('focusout', { target: desc(e.target) }), true);
  new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'attributes' && m.target === document.documentElement) log('html.attr:' + m.attributeName, { v: String(m.target.getAttribute(m.attributeName)).slice(0, 80), overflow: getComputedStyle(document.documentElement).overflow }); if (m.type === 'attributes' && m.target.id === 'root') log('root.attr:' + m.attributeName, { v: m.target.getAttribute(m.attributeName) }); if (m.type === 'childList' && m.target === document.body) log('body.children', { added: [...m.addedNodes].map(desc), removed: [...m.removedNodes].map(desc) }); } })
    .observe(document, { subtree: true, attributes: true, attributeFilter: ['class', 'style', 'inert'], childList: true });
  const loop = () => { if (T.on && T.row) { const li = T.row.closest('li'); const r = li && li.isConnected ? li.getBoundingClientRect() : null; T.frames.push({ t: now(), sy: Math.round(scrollY * 100) / 100, top: r ? Math.round(r.top * 100) / 100 : null, ae: desc(document.activeElement), vw: document.documentElement.clientWidth }); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}, +PCT);
const page = await ctx.newPage();
await page.clock.install({ time: MONDAY });
await page.clock.resume();
await page.goto(`${base}/?debug&seed=veteran&theme=${THEME}#/stats`);
await page.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
const rows = page.locator('main button[aria-label*="Edit"]');
await rows.first().waitFor({ timeout: 15000 });
const MODE = process.env.MODE || 'mid';
const IDX = +(process.env.IDX ?? 2);
const info = await page.evaluate(() => { const b = [...document.querySelectorAll('main button[aria-label*="Edit"]')]; return { n: b.length, sh: document.documentElement.scrollHeight, ih: innerHeight }; });
const target = rows.nth(IDX);
if (MODE === 'mid') {
  await target.evaluate((b) => { const li = b.closest('li'); const r = li.getBoundingClientRect(); window.scrollTo(0, scrollY + r.top - innerHeight / 2); });
  await page.waitForTimeout(800);
} else {
  // the notice-strip flow: a notice, real wheel around, then wheel the row on top, as the spec's press() does
  if (MODE === 'notice') await page.evaluate(() => window.__kettle.toast('Brew updated', { tone: 'info', duration: 4000 }));
  await page.waitForTimeout(600);
  await page.mouse.move(Math.round(w / 2), Math.round(h / 2));
  for (const dir of [1, -1]) for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, dir * 90); await page.waitForTimeout(120); }
  await page.waitForTimeout(400);
  for (let i = 0; i < 60; i++) {
    const r = await target.evaluate((e) => { const q = e.getBoundingClientRect(); const hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { top: q.top, bottom: q.bottom, ok: q.top >= 0 && q.bottom <= innerHeight && hit && e.contains(hit) }; });
    if (r.ok) break;
    await page.mouse.wheel(0, r.top < 4 ? -60 : r.top > h ? 120 : 60);
    await page.waitForTimeout(250);
  }
  await page.mouse.move(1, h - 1);
  await page.waitForTimeout(300);
}
await page.evaluate((i) => { window.__target = [...document.querySelectorAll('main button[aria-label*="Edit"]')][i]; window.__tr.row = window.__target; window.__tr.on = true; }, IDX);
const pre = await target.evaluate((b) => ({ top: b.closest('li').getBoundingClientRect().top, sy: scrollY, bt: b.getBoundingClientRect().top, bh: b.getBoundingClientRect().height }));
const bb = await target.boundingBox();
const cx = Math.round(bb.x + bb.width / 2), cy = Math.round(bb.y + bb.height / 2);
if (process.env.RACE) {
  await page.mouse.move(cx, cy); await page.waitForTimeout(100);
  await page.evaluate(() => { window.__tr.ev.push({ t: Math.round(performance.now()), k: '--- harness: wheel(0,40) then click, no wait' }); });
  await page.mouse.wheel(0, +process.env.RACE); await page.mouse.down(); await page.mouse.up();
} else if (touch) await page.touchscreen.tap(cx, cy);
else { await page.mouse.move(cx, cy); await page.waitForTimeout(100); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up(); }
await page.getByRole('dialog', { name: 'Edit brew' }).waitFor({ timeout: 10000 });
await page.waitForTimeout(1200);
await page.evaluate(() => { window.__tr.ev.push({ t: Math.round(performance.now()), k: '--- CLOSE via Escape' }); });
await page.keyboard.press('Escape');
await page.waitForFunction(() => !document.querySelector('[role=dialog]'), null, { timeout: 10000 });
await page.waitForTimeout(1200);
const tr = await page.evaluate(() => window.__tr);
const post = await target.evaluate((b) => ({ top: b.closest('li').getBoundingClientRect().top, sy: scrollY }));
fs.writeFileSync(OUT, JSON.stringify({ cfg: { base, w, h, PCT, RED, TOUCH, THEME }, info, pre, post, ev: tr.ev, frames: tr.frames }, null, 1));
console.log(JSON.stringify({ cfg: [base, w, h, PCT, RED, TOUCH, THEME].join(' '), info, pre, post, dTop: Math.round((post.top - pre.top) * 10) / 10, dSy: Math.round((post.sy - pre.sy) * 10) / 10, nEv: tr.ev.length }));
await browser.close();
