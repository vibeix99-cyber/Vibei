import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [w,h,pct] of [[390,844,100],[844,390,200]]) {
const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
await ctx.addInitScript((pct) => { try { localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', muted: true }, version: 1 })); } catch {} if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }); }, pct);
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:5476/?debug&seed=veteran#/stats'); await p.waitForTimeout(2500);
console.log(w,h,pct, await p.evaluate(() => {
  const strip = document.querySelector('[data-notice-strip]');
  const out = { strips: [...document.querySelectorAll('[data-notice-strip]')].map((s) => s.getBoundingClientRect().toJSON()), main: !!document.querySelector('main') };
  out.c = [...document.querySelectorAll('main button, main [role=radio], main [role=tab], main a[href], main summary')].slice(0, 8).map((e) => { const r = e.getBoundingClientRect(); let fx = null; for (let a = e; a && a !== document.body; a = a.parentElement) { const ps = getComputedStyle(a).position; if (ps === 'fixed' || ps === 'sticky') { fx = a.tagName + '.' + a.className.slice(0, 20) + ':' + ps; break; } } return [(e.getAttribute('aria-label') || e.textContent).slice(0, 20), Math.round(r.top), Math.round(r.bottom), fx]; });
  return JSON.stringify(out);
}));
await ctx.close(); }
await b.close();
