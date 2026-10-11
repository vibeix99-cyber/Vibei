// Lane N review · shared helpers. Real input (tap/click/mouse) for user actions; debug API for setup only.
import { chromium } from 'playwright';
export const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const parseArgs = () => Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
export const LAUNCH = { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] };
export function parseCfg(cfg) {
  const m = cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
  const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
  return { W, H, DPR, theme, text, mobile: W < 900 && W < H, touch: W < 900, tag: `${W}x${H}-${theme}-t${text}` };
}
export async function newCtx(b, c, meta) {
  const ctx = await b.newContext({ viewport: { width: c.W, height: c.H }, deviceScaleFactor: c.DPR, isMobile: c.mobile, hasTouch: c.touch, colorScheme: c.theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (c.text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), c.text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  p.on('pageerror', (e) => meta?.errors?.push(e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') meta?.console?.push(m.text().slice(0, 200)); });
  return { ctx, p };
}
export const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
export const settings = (p, s) => p.evaluate((x) => window.__kettle.settings.getState().set(x), s);
export async function tapOrClick(p, c, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  if (c.touch) await locator.tap({ timeout: 30_000 }); else await locator.click({ timeout: 30_000 });
}
export const brewBtn = (p) => p.getByRole('button', { name: /put the kettle on/i }).first();
export const installCls = (p) => p.evaluate(() => {
  window.__cls = 0; window.__clsSrc = [];
  const name = (n) => { if (!n || !n.tagName) return String(n && n.nodeName); const c = typeof n.className === 'string' ? n.className.split(' ')[0] : ''; return `${n.tagName.toLowerCase()}${c ? '.' + c : ''}${n.closest?.('[data-scene-mode]') ? ' (in scene host)' : ''}`; };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__clsSrc.push({ v: +e.value.toFixed(5), t: Math.round(e.startTime), src: (e.sources || []).map((x) => name(x.node)) }); } }).observe({ type: 'layout-shift', buffered: false });
});
export const measure = (p) => p.evaluate(() => {
  const host = document.querySelector('[data-scene-mode="window"]');
  const layers = host ? [...host.querySelectorAll('image[data-item]')].map((i) => i.getAttribute('data-item')) : [];
  const stillImg = host?.querySelector('img');
  const r = host?.getBoundingClientRect();
  const hintEl = [...document.querySelectorAll('p')].find((e) => /look around|drawing of your room/i.test(e.textContent || ''));
  return {
    hash: location.hash,
    backdrop: host ? { static: host.getAttribute('data-scene-static'), ready: host.getAttribute('data-scene-ready'), still: stillImg ? (stillImg.currentSrc || stillImg.src).split('/').pop() : null, stillComplete: stillImg ? stillImg.complete : null, layers, rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], hasCanvas: !!host.querySelector('canvas') } : null,
    canvases: [...document.querySelectorAll('canvas')].map((c) => { const q = c.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; }),
    hint: hintEl ? hintEl.textContent.trim() : null,
    items: performance.getEntriesByType('resource').filter((e) => /(pothos|books|fairyLights|shelf|recordPlayer|monstera|telescope|kotatsu)-(morning|day|dusk|night)-(clear|rain|snow)[-.][^/]*\.webp/.test(e.name)).map((e) => ({ f: e.name.split('/').pop().replace(/\?.*/, ''), end: Math.round(e.responseEnd), b: e.encodedBodySize })),
    cls: window.__cls ?? null, clsSources: window.__clsSrc ?? null,
  };
});
/** Screenshot the stage backdrop alone: everything else hidden (restored after). `raw` also drops blur/saturation and the quiet overlay. */
export async function backShots(p, path, { raw = true } = {}) {
  const ok = await p.evaluate(() => {
    const host = document.querySelector('[data-scene-mode="window"]');
    if (!host) return false;
    const back = host.parentElement;
    const saved = [];
    let node = back;
    while (node && node !== document.documentElement) {
      const par = node.parentElement; if (!par) break;
      for (const sib of par.children) if (sib !== node) { saved.push([sib, sib.style.visibility]); sib.style.visibility = 'hidden'; }
      node = par;
    }
    window.__restore = () => saved.forEach(([e, v]) => { e.style.visibility = v; });
    window.__back = back;
    return true;
  });
  if (!ok) return false;
  const h = await p.evaluateHandle(() => window.__back);
  await h.asElement().screenshot({ path: `${path}-back.png`, animations: 'disabled', timeout: 120_000 });
  if (raw) {
    await p.evaluate(() => { const host = document.querySelector('[data-scene-mode="window"]'); window.__hf = host.style.filter; host.style.filter = 'none'; [...host.parentElement.children].forEach((c) => { if (c !== host) { c.dataset.pv = c.style.visibility; c.style.visibility = 'hidden'; } }); });
    await h.asElement().screenshot({ path: `${path}-raw.png`, animations: 'disabled', timeout: 120_000 });
    await p.evaluate(() => { const host = document.querySelector('[data-scene-mode="window"]'); host.style.filter = window.__hf; [...host.parentElement.children].forEach((c) => { if (c !== host) c.style.visibility = c.dataset.pv ?? ''; }); });
  }
  await p.evaluate(() => window.__restore());
  return true;
}
export async function shot(p, path, opts = {}) {
  await p.screenshot({ path: `${path}.png`, animations: 'disabled', timeout: 180_000 });
  return opts.back === false ? false : backShots(p, path, opts);
}
export const launch = () => chromium.launch(LAUNCH);
