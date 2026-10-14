// Lane I (W3R1, maker G): one browser per build for every check.
//   node LI-audit.mjs <url> <label> <outDir> <parts: focus,fc,states,settings,persist> [filter]
// Frozen clock 2026-10-12T07:40Z then resume(). Real Tab / mouse / clicks. Pixels measured from screenshots (DPR 1).
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PNG } = require('playwright-core/lib/utilsBundle');

const [url, label, outRoot, partsArg = 'focus,fc,states,settings,persist', filter = ''] = process.argv.slice(2);
const parts = new Set(partsArg.split(','));
const out = `${outRoot}/${label}`;
fs.mkdirSync(out, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const log = (...a) => { const s = a.join(' '); console.log(s); fs.appendFileSync(`${out}/log.txt`, s + '\n'); };

async function open({ w, h, theme, pct = 100, forced = false, seed = 'veteran', route = '/', extra = '', touch = false }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce', forcedColors: forced ? 'active' : 'none', hasTouch: touch, isMobile: touch });
  if (pct !== 100) await ctx.addInitScript((p) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); }), pct);
  const page = await ctx.newPage();
  await page.clock.install({ time: FIXED });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=${seed}&theme=${theme}${extra}#${route}`);
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  return { ctx, page };
}

// ---------- pixel helpers ----------
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const CR = (a, b) => { const x = L(a), y = L(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const median = (arr) => { if (!arr.length) return null; const m = [0, 1, 2].map((i) => arr.map((p) => p[i]).sort((x, y) => x - y)[arr.length >> 1]); return m; };
const parseRgb = (c) => { const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };

// Measure the ring of the focused control from a screenshot: per edge (central 40 %), the ring band, 2 px outside it,
// and 1.5 px inside the offset edge (the gap, or the control when the ring is inset).
async function measureRing(page, info, W, H) {
  const { rect: r, ow, oo, color } = info;
  const pad = Math.ceil(Math.abs(oo) + ow + 6);
  const clip = { x: Math.max(0, Math.floor(r.left - pad)), y: Math.max(0, Math.floor(r.top - pad)) };
  clip.width = Math.min(W, Math.ceil(r.right + pad)) - clip.x;
  clip.height = Math.min(H, Math.ceil(r.bottom + pad)) - clip.y;
  if (clip.width < 4 || clip.height < 4) return { offscreen: true };
  const buf = await page.screenshot({ clip });
  const png = PNG.sync.read(buf);
  const px = (x, y) => { x = Math.round(x - clip.x); y = Math.round(y - clip.y); if (x < 0 || y < 0 || x >= png.width || y >= png.height) return null; const i = (y * png.width + x) * 4; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
  const exp = parseRgb(color);
  const edges = {};
  const mid = oo + ow / 2, outD = oo + ow + 2, inD = oo - 1.5;
  const defs = {
    top: (t, d) => [r.left + r.width * t, r.top - d],
    bottom: (t, d) => [r.left + r.width * t, r.bottom - 1 + d],
    left: (t, d) => [r.left - d, r.top + r.height * t],
    right: (t, d) => [r.right - 1 + d, r.top + r.height * t],
  };
  for (const [e, f] of Object.entries(defs)) {
    const band = [], outer = [], inner = [];
    for (let t = 0.3; t <= 0.7001; t += 0.02) {
      const [bx, by] = f(t, mid), [ox, oy] = f(t, outD), [ix, iy] = f(t, inD);
      if (bx < 0 || by < 0 || bx >= W || by >= H) continue;
      const b = px(bx, by), o = px(ox, oy), i = px(ix, iy);
      if (b) band.push(b);
      if (o) outer.push(o);
      if (i) inner.push(i);
    }
    if (!band.length) { edges[e] = null; continue; }
    const bm = median(band), om = median(outer), im = median(inner);
    const match = exp ? band.filter((p) => dist(p, exp) < 60).length / band.length : null;
    edges[e] = { match: +match?.toFixed(2), ring: bm, outer: om, inner: im, crOut: om ? CR(bm, om) : null, crIn: im ? CR(bm, im) : null };
  }
  const vals = Object.values(edges).filter(Boolean);
  const minMatch = vals.length ? Math.min(...vals.map((v) => v.match ?? 0)) : null;
  const minCrOut = vals.length ? Math.min(...vals.map((v) => v.crOut ?? 99)) : null;
  const minCrIn = vals.length ? Math.min(...vals.map((v) => v.crIn ?? 99)) : null;
  return { clip, png, edges, minMatch, minCrOut, minCrIn };
}

// Shelf-pack small clips into one sheet (for looking).
function sheet(clips, path, maxW = 1400) {
  if (!clips.length) return;
  const items = clips.map((c) => ({ png: c.png, w: Math.min(c.png.width, maxW), h: Math.min(c.png.height, 220) }));
  let x = 0, y = 0, rowH = 0; const pos = [];
  for (const it of items) { if (x + it.w + 6 > maxW) { x = 0; y += rowH + 6; rowH = 0; } pos.push([x, y]); x += it.w + 6; rowH = Math.max(rowH, it.h); }
  const H = y + rowH;
  const dst = new PNG({ width: maxW, height: Math.max(1, H) });
  dst.data.fill(128);
  items.forEach((it, i) => PNG.bitblt(it.png, dst, 0, 0, it.w, it.h, pos[i][0], pos[i][1]));
  fs.writeFileSync(path, PNG.sync.write(dst));
}

const ACTIVE = 'button, [role=radio], [role=switch], [role=spinbutton], [role=slider], input, textarea, select, a[href], [tabindex="0"]';
async function controlRects(page) {
  return page.evaluate((sel) => {
    const seen = {};
    return [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length).map((e) => {
      const n = (e.getAttribute('aria-label') || e.textContent || e.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      const key = `${e.tagName.toLowerCase()}[${e.getAttribute('role') || ''}] ${n}`;
      seen[key] = (seen[key] || 0) + 1;
      const r = e.getBoundingClientRect();
      return { key: `${key} #${seen[key]}`, w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
    });
  }, ACTIVE);
}

// ---------- screens ----------
const SCREENS = {
  today: { seed: 'veteran', route: '/' },
  composerTyped: { seed: 'veteran', route: '/' },
  session: { seed: 'veteran', route: '/', after: async (page) => {
    await page.getByRole('button', { name: /^Put the kettle on/ }).first().click();
    await page.waitForFunction(() => location.hash.startsWith('#/focus'), null, { timeout: 15000 });
    await page.waitForTimeout(1500);
  } },
  endSheet: { seed: 'veteran', route: '/', dialog: 'Leave the kettle early?', after: async (page) => {
    await page.getByRole('button', { name: /^Put the kettle on/ }).first().click();
    await page.waitForFunction(() => location.hash.startsWith('#/focus'), null, { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__kettle.ff(3 * 60_000));
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'End session' }).first().click();
    await page.getByRole('dialog', { name: 'Leave the kettle early?' }).waitFor({ timeout: 10000 });
    await page.waitForTimeout(800);
  } },
  stats: { seed: 'veteran', route: '/stats' },
  historyEdit: { seed: 'veteran', route: '/stats', dialog: 'Edit brew', after: async (page) => {
    const item = page.getByRole('button', { name: /\. Edit$/ }).first();
    await item.scrollIntoViewIfNeeded();
    await item.click();
    await page.getByRole('dialog', { name: 'Edit brew' }).waitFor({ timeout: 10000 });
    await page.waitForTimeout(800);
  } },
  welcome: { seed: 'fresh', route: '/welcome', extra: '&onboarded=0' },
  settings: { seed: 'veteran', route: '/settings' },
};

async function focusAudit(cfg, screenName) {
  const sc = SCREENS[screenName];
  const tag = `${screenName}-${cfg.w}x${cfg.h}-${cfg.theme}${cfg.forced ? '-forced' : ''}`;
  if (filter && !tag.includes(filter)) return null;
  const { ctx, page } = await open({ ...cfg, seed: sc.seed, route: sc.route, extra: sc.extra || '' });
  const rows = [];
  try {
    await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true }));
    if (sc.after) await sc.after(page);
    const rects = await controlRects(page);
    if (!sc.dialog) { await page.mouse.click(cfg.w - 2, cfg.h - 2).catch(() => {}); await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); }); }
    const clips = [];
    const seenOrder = [];
    for (let i = 0; i < 110; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(70);
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        const n = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 44);
        const id = `${el.tagName.toLowerCase()}[${el.getAttribute('role') || ''}] ${n}`;
        const cands = [el, ...el.querySelectorAll('*'), el.parentElement, el.parentElement?.parentElement].filter(Boolean);
        const ring = cands.find((e) => { const cs = getComputedStyle(e); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0; });
        const dis = el.disabled === true || el.getAttribute('aria-disabled') === 'true';
        const inDialog = !!el.closest('[role=dialog]');
        if (!ring) return { id, ring: null, dis, inDialog, bs: getComputedStyle(el).boxShadow.slice(0, 60) };
        const cs = getComputedStyle(ring);
        const r = ring.getBoundingClientRect();
        // overflow ancestor that would clip the outline
        let clipBy = '';
        const grow = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth);
        for (let a = ring.parentElement; a && a !== document.documentElement; a = a.parentElement) {
          const acs = getComputedStyle(a);
          if (/(hidden|auto|scroll|clip)/.test(acs.overflowX + acs.overflowY)) {
            const ar = a.getBoundingClientRect();
            const c = Math.max(ar.left + a.clientLeft - (r.left - grow), ar.top + a.clientTop - (r.top - grow), r.right + grow - (ar.left + a.clientLeft + a.clientWidth), r.bottom + grow - (ar.top + a.clientTop + a.clientHeight), 0);
            if (c > 0.5) { clipBy = `${String(a.className || a.tagName).slice(0, 30)} ${c.toFixed(1)}px`; break; }
          }
        }
        return { id, dis, inDialog, ringOn: ring === el ? 'self' : String(ring.className || ring.tagName).slice(0, 28), ow: parseFloat(cs.outlineWidth), oo: parseFloat(cs.outlineOffset), color: cs.outlineColor, style: cs.outlineStyle, rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }, clipBy };
      });
      if (!info) continue;
      if (seenOrder.length > 3 && info.id === seenOrder[0]) break;
      seenOrder.push(info.id);
      await page.waitForTimeout(60);
      let m = {};
      if (info.rect) {
        // re-read the rect after the scroll settled
        m = await measureRing(page, info, cfg.w, cfg.h);
        if (m.png) clips.push({ png: m.png });
      }
      const row = { i: rows.length, id: info.id, dis: info.dis, ringOn: info.ringOn || 'NONE', ow: info.ow, oo: info.oo, color: info.color, clipBy: info.clipBy, minMatch: m.minMatch, minCrOut: m.minCrOut, minCrIn: m.minCrIn, offscreen: m.offscreen, edges: m.edges, bs: info.bs };
      rows.push(row);
    }
    sheet(clips, `${out}/focus-${tag}.png`);
    fs.writeFileSync(`${out}/focus-${tag}.json`, JSON.stringify({ rows, rects }, null, 1));
    const bad = rows.filter((r) => r.ringOn === 'NONE' || r.dis || (r.minMatch != null && r.minMatch < 0.5) || (r.minCrOut != null && r.minCrOut < 3) || r.clipBy);
    log(`[focus] ${tag}: ${rows.length} stops; flagged ${bad.length}; minCrOut ${Math.min(...rows.map((r) => r.minCrOut ?? 99))}`);
    for (const b of bad) log(`   ! ${String(b.i).padStart(2)} ${b.id} | ring ${b.ringOn} w${b.ow} o${b.oo} match ${b.minMatch} crOut ${b.minCrOut} crIn ${b.minCrIn}${b.clipBy ? ' clip ' + b.clipBy : ''}${b.dis ? ' DISABLED-STOP' : ''}`);
  } catch (e) {
    log(`[focus] ${tag}: ERROR ${String(e.message).slice(0, 300)}`);
  } finally {
    await ctx.close();
  }
  return rows;
}

// ---------- states: rest / hover / pressed / selected / focus, crops + computed fills ----------
async function states(cfg) {
  const tag = `${cfg.w}x${cfg.h}-${cfg.theme}${cfg.forced ? '-forced' : ''}`;
  if (filter && !tag.includes(filter)) return;
  const res = [];
  const clips = [];
  const grab = async (page, loc, what, state) => {
    const b = await loc.boundingBox();
    if (!b) return;
    const clip = { x: Math.max(0, b.x - 10), y: Math.max(0, b.y - 10), width: Math.min(cfg.w, b.width + 20), height: Math.min(cfg.h, b.height + 20) };
    const buf = await page.screenshot({ clip });
    fs.mkdirSync(`${out}/states-${tag}`, { recursive: true });
    const fn = `${what}-${state}.png`.replace(/[^\w.-]+/g, '_');
    fs.writeFileSync(`${out}/states-${tag}/${fn}`, buf);
    clips.push({ png: PNG.sync.read(buf) });
    const comp = await loc.evaluate((el) => {
      const inner = el.querySelector('[class*="inner"]') || el.querySelector('[class*="face"]') || el.querySelector('[class*="track"]') || el;
      const cs = getComputedStyle(inner); const ecs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: ecs.color, shadow: cs.boxShadow.slice(0, 70), transform: cs.transform, opacity: ecs.opacity, cursor: ecs.cursor, outline: `${ecs.outlineStyle} ${ecs.outlineWidth} ${ecs.outlineColor}`, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height };
    });
    res.push({ what, state, ...comp });
  };
  const cycle = async (page, loc, what) => {
    await loc.scrollIntoViewIfNeeded();
    await page.mouse.move(1, cfg.h - 1);
    await page.waitForTimeout(150);
    await grab(page, loc, what, '1rest');
    const b = await loc.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(250);
    await grab(page, loc, what, '2hover');
    await page.mouse.down();
    await page.waitForTimeout(200);
    await grab(page, loc, what, '3pressed');
    await page.mouse.move(1, cfg.h - 1);
    await page.mouse.up();
    await page.waitForTimeout(200);
  };
  // Today composer
  {
    const { ctx, page } = await open({ ...cfg, seed: 'veteran', route: '/' });
    try {
      await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true }));
      const seg = page.getByRole('radiogroup').filter({ has: page.getByRole('radio') }).first();
      const radios = seg.getByRole('radio');
      const n = await radios.count();
      let unsel = null, sel = null;
      for (let i = 0; i < n; i++) { const c = await radios.nth(i).getAttribute('aria-checked'); if (c === 'true') sel ??= radios.nth(i); else unsel ??= radios.nth(i); }
      if (unsel) await cycle(page, unsel, 'today-seg-unselected');
      if (sel) { await grab(page, sel, 'today-seg-selected', '4selected'); }
      // tag chips (buttons with aria-pressed or radios in a chip group)
      const chip = page.locator('[aria-pressed="false"]').first();
      if (await chip.count()) await cycle(page, chip, 'today-chip-unselected');
      const chipOn = page.locator('[aria-pressed="true"]').first();
      if (await chipOn.count()) await grab(page, chipOn, 'today-chip-selected', '4selected');
      // keyboard focus on the field
      const field = page.getByRole('textbox').first();
      await field.scrollIntoViewIfNeeded();
      await page.mouse.click(cfg.w - 2, cfg.h - 2);
      await field.focus();
      await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      await grab(page, field.locator('xpath=..'), 'today-field', '5focus');
    } catch (e) { log(`[states] today ${tag} ERROR ${String(e.message).slice(0, 200)}`); }
    await ctx.close();
  }
  // Settings
  {
    const { ctx, page } = await open({ ...cfg, seed: 'veteran', route: '/settings' });
    try {
      await page.evaluate(() => window.__kettle.settings.getState().set({ muted: false }));
      const theme = page.getByRole('radiogroup', { name: 'Theme' });
      await cycle(page, theme.getByRole('radio', { name: 'Light' }).first(), 'settings-theme-unselected');
      await grab(page, theme.getByRole('radio', { checked: true }).first(), 'settings-theme-selected', '4selected');
      const goal = page.getByRole('radiogroup', { name: 'Daily goal' });
      const goalOff = goal.getByRole('radio', { checked: false }).first();
      await cycle(page, goalOff, 'settings-goal-unselected');
      await grab(page, goal.getByRole('radio', { checked: true }).first(), 'settings-goal-selected', '4selected');
      const nudge = page.locator('div', { has: page.getByRole('switch', { name: /Nudges/ }) }).last();
      if (await nudge.count()) await cycle(page, nudge, 'settings-nudges-row');
      const sw = page.getByRole('switch', { name: /Tea breaks/ }).first();
      await cycle(page, sw, 'settings-switch');
      // muted: the volume sliders go inert
      await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true }));
      await page.waitForTimeout(300);
      const sl = page.getByRole('slider').first();
      await sl.scrollIntoViewIfNeeded();
      await grab(page, sl.locator('xpath=ancestor::*[3]'), 'settings-slider-muted', '6disabled');
      // keyboard focus on the name field
      const field = page.getByRole('textbox', { name: 'Your name' });
      await field.scrollIntoViewIfNeeded();
      await page.mouse.click(cfg.w - 2, 2);
      await field.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      await grab(page, field.locator('xpath=..'), 'settings-field', '5focus');
      // keyboard focus on a segment
      await theme.getByRole('radio', { checked: true }).first().focus();
      await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      await grab(page, theme, 'settings-theme-group', '5focus');
    } catch (e) { log(`[states] settings ${tag} ERROR ${String(e.message).slice(0, 200)}`); }
    await ctx.close();
  }
  // Session controls
  {
    const { ctx, page } = await open({ ...cfg, seed: 'veteran', route: '/' });
    try {
      await page.getByRole('button', { name: /^Put the kettle on/ }).first().click();
      await page.waitForFunction(() => location.hash.startsWith('#/focus'), null, { timeout: 15000 });
      await page.waitForTimeout(1500);
      const pause = page.getByRole('button', { name: /^Pause/ }).first();
      await page.mouse.move(1, cfg.h - 1);
      await grab(page, pause, 'session-pause', '1rest');
      const b = await pause.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(250);
      await grab(page, pause, 'session-pause', '2hover');
    } catch (e) { log(`[states] session ${tag} ERROR ${String(e.message).slice(0, 200)}`); }
    await ctx.close();
  }
  sheet(clips, `${out}/states-${tag}.png`, 1000);
  fs.writeFileSync(`${out}/states-${tag}.json`, JSON.stringify(res, null, 1));
  log(`[states] ${tag}: ${res.length} grabs`);
}

// ---------- Settings top to bottom ----------
async function settingsCaptures() {
  for (const [w, h] of [[390, 844], [375, 667], [844, 390], [1440, 900]]) for (const theme of ['light', 'dark']) for (const pct of [100, 200]) {
    const name = `settings-${w}x${h}-${theme}-${pct}`;
    if (filter && !name.includes(filter)) continue;
    const { ctx, page } = await open({ w, h, theme, pct, seed: 'veteran', route: '/settings' });
    try {
      await page.evaluate(() => window.__kettle.settings.getState().set({ muted: false, name: 'Robin' }));
      await page.waitForTimeout(800);
      fs.mkdirSync(`${out}/settings`, { recursive: true });
      await page.screenshot({ path: `${out}/settings/${name}.png`, fullPage: true });
      const m = await page.evaluate(() => {
        const txt = document.body.innerText;
        const hits = (txt.match(/[^\n.]*streak[^\n.]*/gi) || []).slice(0, 6);
        const attr = [...document.querySelectorAll('[aria-label],[title],[alt],[aria-description]')].flatMap((e) => ['aria-label', 'title', 'alt', 'aria-description'].map((a) => e.getAttribute(a) || '')).filter((v) => /streak/i.test(v)).slice(0, 6);
        const main = document.querySelector('main') || document.body;
        const mainHits = (main.innerText.match(/[^\n.]*streak[^\n.]*/gi) || []).slice(0, 6);
        return { sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, hits, attr, mainHits };
      });
      log(`[settings] ${name} scrollH ${m.sh} scrollW ${m.sw} clientW ${m.cw} | streak text ${JSON.stringify(m.hits)} | in <main> ${JSON.stringify(m.mainHits)} | attrs ${JSON.stringify(m.attr)}`);
    } catch (e) { log(`[settings] ${name} ERROR ${String(e.message).slice(0, 200)}`); }
    await ctx.close();
  }
}

// ---------- persistence + reset (disposable context) ----------
async function persist() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: 'UTC', locale: 'en-GB', colorScheme: 'light' });
  const page = await ctx.newPage();
  const R = {};
  try {
    await page.clock.install({ time: FIXED });
    await page.clock.resume();
    await page.goto(`${url}/?debug&seed=veteran#/settings`);
    await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
    await page.waitForTimeout(1200);
    const read = () => page.evaluate(() => {
      const s = window.__kettle.settings.getState();
      const pick = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v !== 'function'));
      const radios = Object.fromEntries([...document.querySelectorAll('[role=radiogroup]')].map((g) => [g.getAttribute('aria-label') || g.getAttribute('aria-labelledby'), [...g.querySelectorAll('[role=radio]')].find((r) => r.getAttribute('aria-checked') === 'true')?.textContent?.trim()]));
      const switches = Object.fromEntries([...document.querySelectorAll('[role=switch]')].map((sw) => [sw.getAttribute('aria-label') || sw.id, sw.getAttribute('aria-checked')]));
      const spins = Object.fromEntries([...document.querySelectorAll('[role=spinbutton]')].map((sp) => [sp.getAttribute('aria-valuetext'), sp.getAttribute('aria-valuenow')]));
      return { stored: localStorage.getItem('kettle:settings'), state: pick(s), html: { theme: document.documentElement.dataset.theme, motion: document.documentElement.dataset.motion }, radios, switches, spins };
    });
    R.before = await read();
    const radio = async (group, name) => { const r = page.getByRole('radiogroup', { name: group }).getByRole('radio', { name, exact: true }); await r.scrollIntoViewIfNeeded(); await r.click(); await page.waitForTimeout(250); };
    await radio('Theme', 'Night');
    await radio('Rhythm preset', 'Deep');
    await radio('Motion', 'Reduced');
    await radio('3D nook quality', 'Low');
    await radio('Daily goal', /pot/i);
    const sounds = page.getByRole('switch', { name: /Sounds/ }).first();
    await sounds.scrollIntoViewIfNeeded(); await sounds.click(); await page.waitForTimeout(250);
    const amb = page.getByRole('radiogroup', { name: 'Brewing ambience' }).getByRole('radio').nth(2);
    await amb.scrollIntoViewIfNeeded(); await amb.click(); await page.waitForTimeout(250);
    const brew = page.getByRole('spinbutton', { name: /Brew length/ });
    await brew.scrollIntoViewIfNeeded(); await brew.focus(); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(250);
    const field = page.getByRole('textbox', { name: 'Your name' });
    await field.scrollIntoViewIfNeeded(); await field.click(); await field.fill(''); await page.keyboard.type('Robin'); await page.keyboard.press('Tab');
    R.changed = await read();
    await page.reload();
    await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    R.reloaded = await read();
    // Reset everything (real clicks)
    const row = page.getByRole('button', { name: /Reset everything/ }).first();
    await row.scrollIntoViewIfNeeded(); await row.click();
    const dlg = page.getByRole('dialog');
    await dlg.waitFor({ timeout: 10000 });
    R.resetDialogText = (await dlg.innerText()).replace(/\s+/g, ' ').slice(0, 400);
    await page.waitForTimeout(500);
    await dlg.getByRole('button', { name: /^Reset everything/ }).click();
    await page.waitForTimeout(2500);
    R.afterResetHash = await page.evaluate(() => location.hash);
    R.afterResetStore = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, (localStorage.getItem(k) || '').slice(0, 300)])));
    await page.goto(`${url}/?debug#/settings`);
    await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    R.afterResetReload = await read();
    R.afterResetHash2 = await page.evaluate(() => location.hash);
  } catch (e) { R.error = String(e.message).slice(0, 400); }
  fs.writeFileSync(`${out}/persist.json`, JSON.stringify(R, null, 1));
  log(`[persist] done ${R.error ? 'ERROR ' + R.error : ''}`);
  await ctx.close();
}

const t0 = Date.now();
if (parts.has('persist')) await persist();
if (parts.has('focus')) {
  for (const theme of ['light', 'dark']) for (const [w, h] of [[390, 844], [1440, 900]])
    for (const s of ['today', 'composerTyped', 'session', 'endSheet', 'stats', 'historyEdit', 'welcome', 'settings']) {
      if (s === 'composerTyped') continue;
      await focusAudit({ w, h, theme }, s);
    }
}
if (parts.has('fc')) {
  for (const s of ['today', 'session', 'endSheet', 'stats', 'historyEdit', 'welcome', 'settings']) await focusAudit({ w: 390, h: 844, theme: 'light', forced: true }, s);
  await states({ w: 390, h: 844, theme: 'light', forced: true });
}
if (parts.has('states')) for (const theme of ['light', 'dark']) for (const [w, h] of [[390, 844], [1440, 900]]) await states({ w, h, theme });
if (parts.has('settings')) await settingsCaptures();
log(`[done] ${label} ${((Date.now() - t0) / 1000).toFixed(0)} s`);
await browser.close();
