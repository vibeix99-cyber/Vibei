// CLS on Today (100 % text): (a) a plain load; (b) storage full: Today mounted after the failure (tab switch);
// (c) storage full: a reload (does a failed write at boot bring the banner in after the first frame?).
// node cls.mjs <base> <label> <out.jsonl> <configs "390x844:light,...">
import { chromium } from 'playwright';
import { appendFileSync } from 'node:fs';
const [,, base, label, out, cfgArg] = process.argv;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const OBS = () => {
  window.__ls = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ls.push({ t: Math.round(e.startTime), v: e.value, r: e.hadRecentInput, src: (e.sources || []).map((s) => (s.node?.className?.baseVal ?? s.node?.className ?? s.node?.nodeName ?? '?').toString().slice(0, 40)) }); }).observe({ type: 'layout-shift', buffered: true });
  window.__bannerAt = null;
  new MutationObserver(() => { if (window.__bannerAt == null && document.querySelector('section[data-save-warning]')) window.__bannerAt = Math.round(performance.now()); }).observe(document, { childList: true, subtree: true });
};
for (const c of cfgArg.split(',')) {
  const [dim, theme] = c.split(':'); const [W, H] = dim.split('x').map(Number);
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: W >= 900 ? 1 : 2, isMobile: W < 900, hasTouch: W < 900, colorScheme: theme });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  await ctx.addInitScript(OBS);
  const p = await ctx.newPage();
  const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
  const sum = (a) => +a.reduce((s, e) => s + e.v, 0).toFixed(4);
  const res = { label, base, W, H, theme };
  await p.goto(`${base}/?debug&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`); await ready();
  await p.evaluate(() => window.__kettle.seed('newbie')); await p.reload(); await ready();
  await sleep(4000);
  let ls = await p.evaluate(() => window.__ls);
  res.a_plainLoad = { cls: sum(ls), clsNoInput: sum(ls.filter((e) => !e.r)), entries: ls };
  // (b) fill storage, a failed save (setup), Stats → Today by a real tap on the tab
  await p.evaluate(() => { let c = 'x'.repeat(1 << 20), k = 0; while (c.length >= 1) { try { localStorage.setItem(`filler${k++}`, c); } catch { c = c.slice(0, c.length / 2); } } });
  await p.evaluate(() => window.__kettle.navigate('/stats')); await sleep(1500);
  await p.evaluate(() => window.__kettle.settings.getState().set({ name: 'Sam, brewing through a full browser' })); await sleep(500);
  await p.evaluate(() => { window.__ls = []; window.__bannerAt = null; });
  const tab = p.getByRole('link', { name: 'Today' }).first();
  const t0 = await p.evaluate(() => Math.round(performance.now()));
  if (W < 900) await tab.tap(); else await tab.click();
  await sleep(3000);
  ls = await p.evaluate(() => window.__ls);
  res.b_todayAfterFailure = { cls: sum(ls), clsNoInput: sum(ls.filter((e) => !e.r)), bannerMsAfterTap: (await p.evaluate(() => window.__bannerAt)) - t0, entries: ls };
  // (c) reload with storage still full
  await p.reload(); await ready(); await sleep(4000);
  ls = await p.evaluate(() => window.__ls);
  res.c_reloadFull = { cls: sum(ls), clsNoInput: sum(ls.filter((e) => !e.r)), bannerAt: await p.evaluate(() => window.__bannerAt), toastWarning: await p.evaluate(() => !!document.getElementById('toast-kettle:save-failed')), entries: ls };
  appendFileSync(out, JSON.stringify(res) + '\n');
  console.log(JSON.stringify({ label, W, H, theme, a: res.a_plainLoad.cls, b: res.b_todayAfterFailure.cls, bBanner: res.b_todayAfterFailure.bannerMsAfterTap, c: res.c_reloadFull.cls, cBanner: res.c_reloadFull.bannerAt, cToast: res.c_reloadFull.toastWarning }));
  await ctx.close();
}
await b.close();
