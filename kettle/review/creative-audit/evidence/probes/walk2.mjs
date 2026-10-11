// Creative audit phase 2: live walkthrough capture (investigation only; no app changes).
// One browser per invocation (run it under the slot gate). Fixed date/clock: page.clock.install({time}) + resume, so
// every run starts at the same instant; screenshots use animations:'disabled' (idle animation paused).
//
// node walk2.mjs --base http://127.0.0.1:5323 --rev <label> --out <dir> --cfg 390x844@3:light[:rm][:static][:land]
//   rm     = reduced motion (context reducedMotion + ?motion=reduce)
//   static = static room fallback (settings.scene = 'off')
//   land   = landscape Home / Brew-length check only
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED_ISO = '2026-10-11T07:40:00.000Z';
const FIXED = Date.parse(FIXED_ISO);
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark)((?::\w+)*)$/);
const [W, H, DPR, theme] = [+m[1], +m[2], +m[3], m[4]];
const flags = new Set(m[5].split(':').filter(Boolean));
const RM = flags.has('rm'), STATIC = flags.has('static'), LAND = flags.has('land'), VIDEO = flags.has('video');
const tag = `${W}x${H}-${theme}${RM ? '-rm' : ''}${STATIC ? '-static' : ''}${flags.has('celebrate') ? '-celebrate' : ''}${LAND ? '-land' : ''}`;
const dir = `${args.out}/${tag}`;
mkdirSync(dir, { recursive: true });
const mobile = W < 900;
const meta = { rev: args.rev, base: args.base, viewport: { w: W, h: H }, dpr: DPR, theme, reducedMotion: RM, staticRoom: STATIC, fixedTime: FIXED_ISO, isMobile: mobile && W < H, hasTouch: mobile, startedAt: new Date().toISOString(), states: {}, errors: [], console: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function context() {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, reducedMotion: RM ? 'reduce' : 'no-preference', timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block', ...(VIDEO ? { recordVideo: { dir: `${dir}/video`, size: { width: Math.min(W, 1280), height: Math.round(Math.min(W, 1280) * H / W) } } } : {}) });
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  p.on('pageerror', (e) => meta.errors.push(e.message));
  p.on('console', (c) => c.type() === 'error' && meta.console.push(c.text().slice(0, 200)));
  return { ctx, p };
}
const q = (seed, extra = '') => `${args.base}/?debug&seed=${seed}&theme=${theme}${RM ? '&motion=reduce' : ''}${extra}`;

// Measurements: every visible raster image's delivered vs. needed pixels; canvases' backing-store density; headings.
const measure = (p) => p.evaluate((dpr) => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const imgs = [...document.querySelectorAll('img')].filter(vis).map((i) => {
    const r = i.getBoundingClientRect();
    const src = (i.currentSrc || i.src).replace(location.origin, '');
    const need = r.width * dpr;
    // object-fit cover/contain: the drawn image scale is the max/min of the two axis ratios
    const fit = getComputedStyle(i).objectFit;
    const sx = (r.width * dpr) / (i.naturalWidth || 1), sy = (r.height * dpr) / (i.naturalHeight || 1);
    const scale = fit === 'cover' ? Math.max(sx, sy) : fit === 'contain' || fit === 'scale-down' ? Math.min(sx, sy) : Math.max(sx, sy);
    // clipping: how much of the box is cut by an ancestor with overflow hidden/clip
    let clip = null;
    for (let a = i.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (/(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
        const ar = a.getBoundingClientRect();
        const ix = Math.max(0, Math.min(r.right, ar.right) - Math.max(r.left, ar.left)), iy = Math.max(0, Math.min(r.bottom, ar.bottom) - Math.max(r.top, ar.top));
        const frac = (ix * iy) / (r.width * r.height);
        if (frac < 0.985) { clip = { visibleFraction: +frac.toFixed(3), by: a.className?.toString().slice(0, 60) }; break; }
      }
    }
    return { src, alt: i.alt, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], natural: [i.naturalWidth, i.naturalHeight], fit, upscale: +scale.toFixed(2), clip, needPx: Math.round(need) };
  });
  const canvases = [...document.querySelectorAll('canvas')].filter(vis).map((c) => { const r = c.getBoundingClientRect(); return { box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], backing: [c.width, c.height], pixelRatio: +(c.width / r.width).toFixed(2) }; });
  const heads = [...document.querySelectorAll('h1,h2,h3')].filter(vis).map((e) => e.innerText.replace(/\s+/g, ' ').slice(0, 80));
  const buttons = [...document.querySelectorAll('button,[role=button],a[href]')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return { name: (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50), box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }; });
  const se = document.scrollingElement;
  return { hash: location.hash, now: new Date().toISOString(), scroll: { y: Math.round(se.scrollTop), max: se.scrollHeight - innerHeight }, heads, imgs, canvases, buttons };
}, DPR);

const AXE = flags.has('axe');
const shot = async (p, name, desc, { full = false } = {}) => {
  await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', fullPage: full, timeout: 120_000 });
  meta.states[name] = { desc, ...(await measure(p)) };
  if (AXE && !full) {
    try {
      const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      meta.states[name].axe = r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(' ').slice(0, 80) }));
    } catch (e) { meta.states[name].axe = 'error ' + e.message.slice(0, 80); }
  }
};
const click = async (p, role, name, opts = {}) => { const l = p.getByRole(role, { name, ...opts }).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.click({ timeout: 30_000 }); };
const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});

try {
  if (LAND) {
    // Landscape: Home / Brew-length discovery only (phase-1 finding).
    const { ctx, p } = await context();
    await p.goto(q('veteran') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1500);
    await shot(p, '01-home', 'Home, landscape, first viewport');
    await shot(p, '01-home-full', 'Home, landscape, full page', { full: true });
    meta.states['01-home'].brewLength = await p.evaluate(() => {
      const els = [...document.querySelectorAll('*')].filter((e) => /brew length|minutes?\b/i.test(e.getAttribute('aria-label') || '') || /^Brew length/i.test(e.textContent?.trim() || ''));
      const e = els.find((x) => x.getBoundingClientRect().height > 0);
      if (!e) return null; const r = e.getBoundingClientRect();
      return { text: (e.getAttribute('aria-label') || e.textContent).slice(0, 60), top: Math.round(r.top), bottom: Math.round(r.bottom), inFirstViewport: r.bottom <= innerHeight };
    });
    await click(p, 'button', /put the kettle on/i); await sleep(4000);
    await p.evaluate(() => window.__kettle.ff(12 * 60_000)); await sleep(1500);
    await shot(p, '02b-focus-mid', 'Focus, landscape, about halfway');
    meta.states['02b-focus-mid'].statusLine = await p.evaluate(() => [...document.querySelectorAll('[role=timer], p, span')].map((e) => e.innerText?.trim()).filter((t) => t && /brewed|whistles/i.test(t)).slice(0, 3));
    await ctx.close();
  } else if (flags.has('celebrate')) {
    // Unlock path: celebrate seed, finish a brew, summary with the level-up / unlock close-up.
    const { ctx, p } = await context();
    await p.goto(q('celebrate') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false })); await sleep(1500);
    await click(p, 'button', /put the kettle on/i); await sleep(2500);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => meta.errors.push('no /done'));
    for (const [n, ms] of [['07c-unlock-1s', 1000], ['07d-unlock-4s', 3000], ['07e-unlock-10s', 6000]]) { await sleep(ms); await shot(p, n, `Summary with unlock, ${n.split('-').pop()} after arrival`); }
    await shot(p, '07f-unlock-full', 'Summary with unlock, full page', { full: true });
    await ctx.close();
  } else {
    // 1. First visit (fresh profile, not onboarded).
    {
      const { ctx, p } = await context();
      await p.goto(q('fresh', '&onboarded=0') + '#/welcome'); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1800);
      await shot(p, '00-first-visit', 'First visit (fresh profile)');
      await click(p, 'button', /set things up first/i).catch((e) => meta.errors.push('setup: ' + e.message));
      await sleep(1200);
      await shot(p, '00b-first-visit-setup', 'First visit, setup step 1');
      await ctx.close();
    }
    // 2. Returning user: Home → focus → pause → resume → end sheet → whistle → summary → Tea Time → Stats → Nook → Settings.
    const { ctx, p } = await context();
    await p.goto(q('veteran') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    if (STATIC) { await p.evaluate(() => window.__kettle.settings.getState().set({ scene: 'off' })); await p.reload(); await ready(p); }
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
    await sleep(1800);
    await shot(p, '01-home', 'Home (veteran profile)');
    await shot(p, '01-home-full', 'Home, full page', { full: true });
    meta.states['01-home'].type = await p.evaluate(() => [...document.querySelectorAll('h1, h2, header *, [class*=status] *')].filter((e) => e.childElementCount === 0 && e.innerText?.trim() && e.getBoundingClientRect().height > 0).slice(0, 24).map((e) => ({ t: e.innerText.trim().slice(0, 30), px: parseFloat(getComputedStyle(e).fontSize), w: getComputedStyle(e).fontWeight })));
    await click(p, 'button', /put the kettle on/i);
    await sleep(6000);
    await shot(p, '02-focus', 'Focus, 6 s in');
    await p.evaluate(() => window.__kettle.ff(12 * 60_000)); await sleep(1500);
    await shot(p, '02b-focus-mid', 'Focus, about halfway (clock fast-forwarded 12 min)');
    await click(p, 'button', /^pause$/i); await sleep(1200);
    await shot(p, '03-paused', 'Paused');
    await click(p, 'button', /^resume$/i); await sleep(1500);
    await shot(p, '04-resumed', 'Resumed');
    await click(p, 'button', /^end session$/i); await sleep(1200);
    await shot(p, '05-end-sheet', 'End sheet');
    await click(p, 'button', /keep brewing/i); await sleep(800);
    await p.evaluate(() => window.__kettle.nearEnd()); await sleep(1300);
    await shot(p, '06-whistle', 'Whistle (phase just ended)');
    await sleep(1500);
    await shot(p, '06b-whistle-late', 'Whistle, 1.5 s later');
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => meta.errors.push('no /done'));
    await sleep(1500);
    await shot(p, '07-summary', 'Summary, first viewport (1.5 s after arrival)');
    await sleep(3000);
    await shot(p, '07a-summary-settled', 'Summary, settled (4.5 s after arrival)');
    const det = p.locator('button[aria-expanded]').filter({ hasText: /./ }).first();
    if (await det.count()) { await det.click().catch(() => {}); await sleep(900); }
    await shot(p, '07b-summary-full', 'Summary, details expanded, full page', { full: true });
    meta.states['07-summary'].chips = await p.evaluate(() => [...document.querySelectorAll('[aria-label="Rewards"] li')].map((li) => { const r = li.getBoundingClientRect(); const cs = getComputedStyle(li); return { text: li.innerText.replace(/\s+/g, ' ').slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, weight: getComputedStyle(li.querySelector('*') || li).fontWeight }; }));
    await p.evaluate(() => scrollTo(0, 0)); await sleep(300);
    await click(p, 'button', /tea time|long tea break/i); await sleep(4000);
    await shot(p, '08-tea-time', 'Tea Time (break running)');
    await click(p, 'button', /^skip break$/i).catch((e) => meta.errors.push('skip: ' + e.message)); await sleep(2000);
    for (const [n, route, d, wait] of [['09-stats', '/stats', 'Stats', 2000], ['10-nook', '/nook', 'Nook', 9000], ['11-settings', '/settings', 'Settings', 1500]]) {
      await p.evaluate((r) => window.__kettle.navigate(r), route); await sleep(wait);
      await shot(p, n, d);
      if (route === '/nook') {
        // Nook interaction: real drag across the room canvas, then a tap on its centre (item highlight / close-up).
        const c = await p.evaluate(() => { const el = document.querySelector('canvas'); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; });
        meta.states[n].hasCanvas = !!c;
        if (c) try {
          await p.mouse.move(c.x, c.y); await p.mouse.down();
          for (let i = 1; i <= 12; i++) { await p.mouse.move(c.x - (c.w * 0.25 * i) / 12, c.y); await sleep(30); }
          await p.mouse.up(); await sleep(1200);
          await shot(p, '10b-nook-dragged', 'Nook after a real drag (orbit)');
          await p.mouse.click(c.x, c.y); await sleep(2500);
          await shot(p, '10c-nook-tapped', 'Nook after a tap at the canvas centre');
          await p.keyboard.press('Escape'); await sleep(800);
        } catch (e) { meta.errors.push('nook interaction: ' + e.message.slice(0, 120)); }
      }
      await shot(p, `${n}-full`, `${d}, full page`, { full: true });
    }
    await ctx.close();
  }
} catch (e) {
  meta.errors.push('FATAL ' + e.message);
} finally {
  meta.endedAt = new Date().toISOString();
  writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(tag, 'states', Object.keys(meta.states).length, 'errors', meta.errors.length);
}
