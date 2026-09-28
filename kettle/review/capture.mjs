#!/usr/bin/env node
/**
 * Visual-critique capture matrix: every screen × state × seed × theme × viewport the
 * critic reviews, plus frame sequences for key transitions.
 *
 *   node review/capture.mjs --round 1 [--base http://127.0.0.1:5190] [--only focus,done] [--jobs 3]
 *
 * → review/out/round-<n>/shots/<id>.png, review/out/round-<n>/frames/<id>/NN-<ms>.png,
 *   review/out/round-<n>/capture-matrix.json (warnings, console errors, timings).
 * Use a snapshot server (vite build + preview) so nobody's HMR reloads the pages.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
const round = opt.round ?? 'adhoc';
const base = opt.base ?? 'http://127.0.0.1:5190';
const only = opt.only ? opt.only.split(',') : null;
const jobs = Number(opt.jobs ?? 3);
const OUT = join(here, 'out', `round-${round}`);
mkdirSync(join(OUT, 'shots'), { recursive: true });
mkdirSync(join(OUT, 'frames'), { recursive: true });

const VP = {
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  small: { width: 320, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  land: { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  desk: { width: 1440, height: 900, deviceScaleFactor: 1 },
  wide: { width: 1920, height: 1080, deviceScaleFactor: 1 },
};

// ------------------------------------------------------------------ step helpers
const B = (re, o = {}) => ({ button: re, ...o });
const W = (ms) => ({ wait: ms });
const E = (js) => ({ eval: js });
const START = (intent = 'Thesis chapter 3', tag = 'study') => [E(`__kettle.timer.getState().startFocus({ intention: '${intent}', tag: '${tag}' })`), W(900)];
const FINISH = [E('__kettle.finish()')];
const CONT = [B('^continue\\b'), W(3200)];
const ONB = {
  hello: [],
  name: [B('^get started'), W(900)],
  goal: [B('^get started'), W(700), { fill: 'input', text: 'Robin' }, B('^continue\\b'), W(900)],
};
ONB.rhythm = [...ONB.goal, { choose: 'a cup' }, W(300), B('^continue\\b'), W(900)];
ONB.ambience = [...ONB.rhythm, { choose: '^classic' }, W(300), B('^continue\\b'), W(900)];
ONB.notify = [...ONB.ambience, { choose: '^rain' }, W(300), B('^continue\\b'), W(1100)];
ONB.ready = [...ONB.notify, B('^(not now|maybe later|skip|no thanks|later)'), W(1300)];
const TOD = (h, m) => E(`(() => { const d = new Date(__kettle.clock.now()); d.setHours(${h}, ${m}, 0, 0); __kettle.ff(d.getTime() - __kettle.clock.now()); __kettle.navigate('/stats'); setTimeout(() => __kettle.navigate('/'), 150); })()`);

// ------------------------------------------------------------------ the matrix
const S = [];
const add = (id, o) => S.push({ id, vp: 'phone', theme: 'light', route: '/', params: {}, steps: [], ...o });
const both = (id, o) => {
  add(`${id}.light`, { ...o, theme: 'light' });
  add(`${id}.dark`, { ...o, theme: 'dark' });
};

// Onboarding: every step, light + dark; a few at other sizes
for (const [k, steps] of Object.entries(ONB)) both(`onb-${k}`, { route: '/welcome', params: { seed: 'fresh', onboarded: '0' }, steps });
add('onb-goal.small', { vp: 'small', route: '/welcome', params: { seed: 'fresh', onboarded: '0' }, steps: ONB.goal });
add('onb-goal.desk', { vp: 'desk', route: '/welcome', params: { seed: 'fresh', onboarded: '0' }, steps: ONB.goal });
add('onb-hello.desk', { vp: 'desk', route: '/welcome', params: { seed: 'fresh', onboarded: '0' } });
add('onb-hello.land', { vp: 'land', route: '/welcome', params: { seed: 'fresh', onboarded: '0' } });

// Home: seeds × time of day × sizes
for (const seed of ['blank', 'newbie', 'veteran', 'atRisk']) both(`home-${seed}`, { params: { seed }, steps: [W(1500)], full: true });
add('home-veteran-morning', { params: { seed: 'veteran' }, steps: [TOD(8, 20), W(1500)], full: true });
add('home-veteran-evening', { params: { seed: 'veteran' }, steps: [TOD(21, 40), W(1500)], full: true });
add('home-newbie-night', { params: { seed: 'newbie' }, steps: [TOD(23, 50), W(1500)] });
add('home-celebrate', { params: { seed: 'celebrate' }, steps: [W(1500)] });
for (const vp of ['small', 'land', 'tablet', 'desk', 'wide']) add(`home-veteran.${vp}`, { vp, params: { seed: 'veteran' }, steps: [W(1500)] });
add('home-veteran.desk.dark', { vp: 'desk', theme: 'dark', params: { seed: 'veteran' }, steps: [W(1500)] });
add('home-blank.desk', { vp: 'desk', params: { seed: 'blank' }, steps: [W(1500)] });

// Focus: states × sizes
const FOCUS = [...START(), E(`__kettle.ff(${9 * 60000})`), W(2200)];
both('focus-running', { params: { seed: 'newbie' }, steps: FOCUS });
for (const vp of ['small', 'land', 'tablet', 'desk', 'wide']) add(`focus-running.${vp}`, { vp, params: { seed: 'newbie' }, steps: FOCUS });
add('focus-running.desk.dark', { vp: 'desk', theme: 'dark', params: { seed: 'newbie' }, steps: FOCUS });
add('focus-running.land.dark', { vp: 'land', theme: 'dark', params: { seed: 'newbie' }, steps: FOCUS });
both('focus-paused', { params: { seed: 'newbie' }, steps: [...FOCUS, B('^pause$'), W(1200)] });
add('focus-paused.desk', { vp: 'desk', params: { seed: 'newbie' }, steps: [...FOCUS, B('^pause$'), W(1200)] });
both('focus-zen', { params: { seed: 'newbie' }, steps: [...FOCUS, W(8500)] });
both('focus-endsheet', { params: { seed: 'newbie' }, steps: [...FOCUS, B('^end session$'), W(1200)] });
add('focus-endsheet.desk', { vp: 'desk', params: { seed: 'newbie' }, steps: [...FOCUS, B('^end session$'), W(1200)] });
add('focus-endsheet.small', { vp: 'small', params: { seed: 'newbie' }, steps: [...FOCUS, B('^end session$'), W(1200)] });
both('focus-ambsheet', { params: { seed: 'newbie' }, steps: [...FOCUS, B('^ambience'), W(1200)] });
add('focus-ambsheet.desk', { vp: 'desk', params: { seed: 'newbie' }, steps: [...FOCUS, B('^ambience'), W(1200)] });
both('focus-whistle', { params: { seed: 'newbie' }, steps: [...START(), E('__kettle.nearEnd()'), W(1900)] });
add('focus-shortcuts.desk', { vp: 'desk', params: { seed: 'newbie' }, steps: [...FOCUS, { press: '?' }, W(1000)] });
add('home-shortcuts.desk', { vp: 'desk', params: { seed: 'veteran' }, steps: [W(1200), { press: '?' }, W(1000)] });
add('focus-after-end-toast', { params: { seed: 'newbie' }, steps: [...FOCUS, B('^end session$'), W(900), B('^end session$', { within: '[role=dialog]' }), W(700)] });

// Break: short / long / over
const BREAK = (k) => [E(`__kettle.timer.getState().startBreak('${k}')`), W(900), E(`__kettle.ff(60000)`), W(2200)];
both('break-short', { params: { seed: 'newbie' }, steps: BREAK('shortBreak') });
both('break-long', { params: { seed: 'veteran' }, steps: BREAK('longBreak') });
for (const vp of ['land', 'desk', 'small']) add(`break-short.${vp}`, { vp, params: { seed: 'newbie' }, steps: BREAK('shortBreak') });
both('break-over', { params: { seed: 'newbie' }, steps: [...BREAK('shortBreak'), ...FINISH, W(2000)] });
add('break-paused', { params: { seed: 'newbie' }, steps: [...BREAK('shortBreak'), B('^pause break$'), W(1000)] });

// Done: all cards (celebrate seed), light + dark; desk + small for key cards
const DONE = [...START('Inbox zero', 'work'), ...FINISH, W(4200)];
let steps = [...DONE];
for (let c = 1; c <= 6; c++) {
  both(`done-card${c}`, { params: { seed: 'celebrate' }, steps: [...steps] });
  steps = [...steps, ...CONT];
}
add('done-card1.desk', { vp: 'desk', params: { seed: 'celebrate' }, steps: DONE });
add('done-card2.desk', { vp: 'desk', params: { seed: 'celebrate' }, steps: [...DONE, ...CONT] });
add('done-card1.small', { vp: 'small', params: { seed: 'celebrate' }, steps: DONE });
add('done-card1.land', { vp: 'land', params: { seed: 'celebrate' }, steps: DONE });
add('done-plain', { params: { seed: 'veteran' }, steps: [...START('Inbox zero', 'work'), ...FINISH, W(4200)] });
add('done-plain-last', { params: { seed: 'veteran' }, steps: [...START('Inbox zero', 'work'), ...FINISH, W(4200), ...CONT, ...CONT, ...CONT] });

// Stats, nook, settings
both('stats-veteran', { route: '/stats', params: { seed: 'veteran' }, steps: [W(1800)], full: true });
both('stats-blank', { route: '/stats', params: { seed: 'blank' }, steps: [W(1500)], full: true });
add('stats-newbie', { route: '/stats', params: { seed: 'newbie' }, steps: [W(1500)], full: true });
for (const vp of ['small', 'desk', 'wide', 'tablet']) add(`stats-veteran.${vp}`, { vp, route: '/stats', params: { seed: 'veteran' }, steps: [W(1800)], full: true });
add('stats-veteran.desk.dark', { vp: 'desk', theme: 'dark', route: '/stats', params: { seed: 'veteran' }, steps: [W(1800)], full: true });
add('stats-badge-tap', { route: '/stats', params: { seed: 'veteran' }, steps: [W(1500), { click: '[aria-label*="tier" i], [aria-label*="badge" i]' }, W(1000)] });
both('nook-veteran', { route: '/nook', params: { seed: 'veteran' }, steps: [W(5000)], full: true });
add('nook-blank', { route: '/nook', params: { seed: 'blank' }, steps: [W(5000)], full: true });
for (const vp of ['desk', 'land', 'small']) add(`nook-veteran.${vp}`, { vp, route: '/nook', params: { seed: 'veteran' }, steps: [W(5000)] });
add('nook-item-tap', { route: '/nook', params: { seed: 'veteran' }, steps: [W(4000), { click: 'text=Trailing pothos' }, W(1200)] });
both('settings', { route: '/settings', params: { seed: 'veteran' }, steps: [W(1500)], full: true });
add('settings.desk', { vp: 'desk', route: '/settings', params: { seed: 'veteran' }, steps: [W(1500)], full: true });
add('settings-reset-confirm', { route: '/settings', params: { seed: 'veteran' }, steps: [W(1200), B('^reset everything'), W(1000)] });
add('settings.small', { vp: 'small', route: '/settings', params: { seed: 'veteran' }, steps: [W(1500)] });

// Reduced motion spot checks
add('rm-done-card1', { params: { seed: 'celebrate', motion: 'reduce' }, reduced: true, steps: DONE });
add('rm-focus', { params: { seed: 'newbie', motion: 'reduce' }, reduced: true, steps: FOCUS });

// ------------------------------------------------------------------ frame sequences (motion)
const F = [];
const seq = (id, o) => F.push({ id, vp: 'phone', theme: 'light', route: '/', params: {}, ...o });
seq('start-brew', { params: { seed: 'newbie' }, pre: [W(1500)], trigger: B('^put the kettle on'), n: 14, every: 90 });
seq('pause', { params: { seed: 'newbie' }, pre: [...FOCUS], trigger: B('^pause$'), n: 10, every: 80 });
seq('whistle-to-done', { params: { seed: 'celebrate' }, pre: [...START('Inbox zero', 'work'), E('__kettle.nearEnd()')], trigger: W(600), n: 22, every: 220 });
seq('card1-entrance', { params: { seed: 'celebrate' }, pre: [...START('Inbox zero', 'work')], trigger: E('__kettle.finish()'), n: 22, every: 200 });
seq('card2-streak', { params: { seed: 'celebrate' }, pre: [...DONE], trigger: B('^continue\\b'), n: 20, every: 180 });
seq('card3-recipes', { params: { seed: 'celebrate' }, pre: [...DONE, ...CONT], trigger: B('^continue\\b'), n: 20, every: 180 });
seq('card4-level', { params: { seed: 'celebrate' }, pre: [...DONE, ...CONT, ...CONT], trigger: B('^continue\\b'), n: 20, every: 180 });
seq('card5-badges', { params: { seed: 'celebrate' }, pre: [...DONE, ...CONT, ...CONT, ...CONT], trigger: B('^continue\\b'), n: 18, every: 180 });
seq('break-start', { params: { seed: 'celebrate' }, pre: [...DONE, ...CONT, ...CONT, ...CONT, ...CONT, W(500)], trigger: B('tea break|^start'), n: 12, every: 120 });
seq('onb-next', { route: '/welcome', params: { seed: 'fresh', onboarded: '0' }, pre: [...ONB.goal, { choose: 'a cup' }], trigger: B('^continue\\b'), n: 10, every: 80 });

// ------------------------------------------------------------------ runner
async function runStep(page, s) {
  const timeout = s.timeout ?? 4000;
  if (s.eval) return page.evaluate(s.eval);
  if (s.wait) return page.waitForTimeout(s.wait);
  if (s.press) return page.keyboard.press(s.press);
  if (s.fill) return page.locator(s.fill).first().fill(s.text, { timeout });
  if (s.click) return page.locator(s.click).first().click({ timeout });
  const scope = s.within ? page.locator(s.within).first() : page;
  const pick = async (roles, re) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      for (const role of roles) {
        const loc = scope.getByRole(role, { name: re });
        const n = await loc.count();
        for (let i = 0; i < n; i++) {
          const b = loc.nth(i);
          if ((await b.isVisible()) && (await b.isEnabled())) return b.click({ timeout });
        }
      }
      await page.waitForTimeout(150);
    }
    throw new Error(`no visible control matching ${re}`);
  };
  if (s.button) return pick(['button', 'link'], new RegExp(s.button, 'i'));
  if (s.choose) return pick(['radio', 'option', 'button', 'checkbox', 'tab'], new RegExp(s.choose, 'i'));
  throw new Error(`unknown step ${JSON.stringify(s)}`);
}

async function open(browser, spec) {
  const v = VP[spec.vp];
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: v.deviceScaleFactor,
    isMobile: v.isMobile ?? false,
    hasTouch: v.hasTouch ?? false,
    colorScheme: spec.theme === 'dark' ? 'dark' : 'light',
    reducedMotion: spec.reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const log = { id: spec.id, warnings: [], errors: [], loads: 0 };
  page.on('load', () => log.loads++);
  page.on('console', (m) => m.type() === 'error' && log.errors.push(m.text().slice(0, 300)));
  page.on('pageerror', (e) => log.errors.push(`pageerror: ${e.message.slice(0, 300)}`));
  const qs = Object.entries({ theme: spec.theme, ...spec.params })
    .map(([k, val]) => `${k}=${encodeURIComponent(val)}`)
    .join('&');
  await page.goto(`${base}/?debug&${qs}#${spec.route}`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => '__kettle' in window, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  return { ctx, page, log };
}

async function runSteps(page, steps, log) {
  for (const st of steps) {
    try {
      await runStep(page, st);
    } catch (e) {
      log.warnings.push(`${JSON.stringify(st)} → ${String(e.message).split('\n')[0]}`);
    }
  }
}

async function doShot(browser, spec) {
  const t0 = Date.now();
  let o;
  try {
    o = await open(browser, spec);
    await runSteps(o.page, spec.steps, o.log);
    await o.page.screenshot({ path: join(OUT, 'shots', `${spec.id}.png`), fullPage: !!spec.full });
    o.log.route = await o.page.evaluate(() => location.hash);
    o.log.title = await o.page.title();
  } catch (e) {
    (o?.log ?? (o = { log: { id: spec.id, warnings: [], errors: [] } }).log).warnings.push(`FAILED: ${String(e.message).split('\n')[0]}`);
  }
  o.log.ms = Date.now() - t0;
  await o.ctx?.close();
  return o.log;
}

async function doFrames(browser, spec) {
  const dir = join(OUT, 'frames', spec.id);
  mkdirSync(dir, { recursive: true });
  let o;
  try {
    o = await open(browser, spec);
    await runSteps(o.page, spec.pre ?? [], o.log);
    const t0 = Date.now();
    const trig = runStep(o.page, spec.trigger).catch((e) => o.log.warnings.push(`trigger → ${String(e.message).split('\n')[0]}`));
    for (let k = 0; k < spec.n; k++) {
      const at = Date.now() - t0;
      await o.page.screenshot({ path: join(dir, `${String(k).padStart(2, '0')}-${String(at).padStart(5, '0')}ms.png`) });
      const next = t0 + (k + 1) * spec.every;
      if (next > Date.now()) await o.page.waitForTimeout(next - Date.now());
    }
    await trig;
  } catch (e) {
    (o?.log ?? (o = { log: { id: spec.id, warnings: [], errors: [] } }).log).warnings.push(`FAILED: ${String(e.message).split('\n')[0]}`);
  }
  await o.ctx?.close();
  return o.log;
}

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const queue = [
  ...S.filter((s) => !only || only.some((p) => s.id.startsWith(p))).map((s) => () => doShot(browser, s)),
  ...F.filter((s) => !only || only.some((p) => `frames:${s.id}`.startsWith(p) || p === 'frames')).map((s) => () => doFrames(browser, s)),
];
const logs = [];
let next = 0;
await Promise.all(
  Array.from({ length: jobs }, async () => {
    while (next < queue.length) {
      const job = queue[next++];
      const log = await job();
      logs.push(log);
      const flag = log.warnings.length || log.errors.length || log.loads > 1 ? `  ⚠ ${log.warnings.length}w ${log.errors.length}e${log.loads > 1 ? ' RELOADED' : ''}` : '';
      console.log(`${String(logs.length).padStart(3)}/${queue.length} ${log.id}${flag}`);
    }
  }),
);
await browser.close();
writeFileSync(join(OUT, 'capture-matrix.json'), JSON.stringify(logs.sort((a, b) => a.id.localeCompare(b.id)), null, 2));
console.log(`\n${logs.length} captures → ${OUT}`);
