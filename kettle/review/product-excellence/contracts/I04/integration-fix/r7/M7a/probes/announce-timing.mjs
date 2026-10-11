import { chromium } from 'playwright';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
for (let rep = 0; rep < 3; rep++) {
const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
await ctx.addInitScript(() => {
  window.__log = [];
  const t0 = performance.now();
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver((ms) => { for (const m of ms) { for (const n of m.addedNodes) { const el = n.nodeType === 1 ? n : n.parentElement; if (el?.id === 'kettle-save-warning-said') window.__log.push([Math.round(performance.now() - t0), 'said', location.hash, (n.textContent || '').slice(0, 30)]); if (n.nodeType === 1 && (n.matches?.('[data-save-warning]') || n.querySelector?.('[data-save-warning]'))) window.__log.push([Math.round(performance.now() - t0), '+banner', location.hash]); } for (const n of m.removedNodes) if (n.nodeType === 1 && (n.matches?.('[data-save-warning]') || n.querySelector?.('[data-save-warning]'))) window.__log.push([Math.round(performance.now() - t0), '-banner', location.hash]); } }).observe(document.documentElement, { childList: true, subtree: true });
  });
});
const p = await ctx.newPage();
const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
await p.goto('http://127.0.0.1:5206/?debug#/'); await ready();
await p.evaluate(() => window.__kettle.seed('newbie')); await p.reload(); await ready();
await p.evaluate(() => { let c = 'x'.repeat(1 << 20), i = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${i++}`, c); } catch { c = c.slice(0, c.length / 2); } } });
await p.evaluate(() => window.__log.push([0, 'filled']));
await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
await sleep(2500);
await p.evaluate(() => window.__kettle.ff(12 * 60_000 + 5_000));
await sleep(500);
await p.evaluate(() => window.__log.push([0, 'end']));
await p.evaluate(() => window.__kettle.timer.getState().end('user'));
await sleep(2000);
console.log(JSON.stringify(await p.evaluate(() => window.__log)));
await ctx.close();
}
await b.close();
