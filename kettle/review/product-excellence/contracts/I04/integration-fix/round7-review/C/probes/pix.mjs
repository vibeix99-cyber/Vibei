// Lane C (round-7 review): INT and R7 captured BACK TO BACK, per state, in ONE browser, with a frozen date
// (page.clock.install at a fixed time, timezone UTC) and screenshots with animations disabled.
//
// Modes per job:
//   step: after the page settles, the page clock is PAUSED and every wait is page.clock.runFor(ms): the app sees the
//         same fake elapsed time on both revisions whatever the machine load (deterministic timers, rAF, toasts, zen).
//   real: the clock runs (fixed start, real speed) and waits are real (as the repo's capture.mjs); the real elapsed
//         time from the action to the shot is recorded, to show what load does.
// Input: real clicks (page.mouse) on "Start a 15-min brew" and "Tea time"; the debug API only for setup
// (seed, startFocus, ff, pause, nearEnd, finish), as capture.mjs does. No scrolling calls.
//
//   node pix.mjs <outdir> <jobId,...|all>
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';

const [out, which = 'all'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const REVS = [
  ['INT', 'http://127.0.0.1:5303'],
  ['R7', 'http://127.0.0.1:5301'],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FIX = {
  r6day: '2026-10-10T18:30:00Z', // the day/time of round 6's phase-1 R6 captures (recipes as R6 saw them)
  beforeday: '2026-10-08T09:10:00Z', // the day/time of the BEFORE set
};
const HIDE_TOASTS = '[aria-label="Notifications"]{visibility:hidden!important}';

// jobs
const J = [];
for (const [w, h] of [[375, 667], [390, 844], [1440, 900]])
  for (const theme of ['light', 'dark']) J.push({ id: `flow-${w}x${h}-${theme}`, kind: 'flow', w, h, theme, text: 100, mode: 'step', fix: 'r6day' });
J.push({ id: 'flow-390x844-dark-rm', kind: 'flow', w: 390, h: 844, theme: 'dark', text: 100, rm: true, mode: 'step', fix: 'r6day' });
J.push({ id: 'flowreal-390x844-light', kind: 'flow', w: 390, h: 844, theme: 'light', text: 100, mode: 'real', fix: 'r6day' });
J.push({ id: 'flowreal-390x844-dark-rm', kind: 'flow', w: 390, h: 844, theme: 'dark', text: 100, rm: true, mode: 'real', fix: 'r6day' });
J.push({ id: 'flow-390x844-light-beforeday', kind: 'flow', w: 390, h: 844, theme: 'light', text: 100, mode: 'step', fix: 'beforeday' });
for (const [w, h, theme] of [[375, 667, 'light'], [375, 667, 'dark'], [390, 844, 'light']])
  for (const fix of ['r6day', 'beforeday']) J.push({ id: `home-${w}x${h}-${theme}-${fix}`, kind: 'home', w, h, theme, text: 100, mode: 'step', fix });
for (const [w, h, theme] of [[390, 844, 'light'], [390, 844, 'dark'], [375, 667, 'dark']]) J.push({ id: `first-${w}x${h}-${theme}`, kind: 'first', w, h, theme, text: 100, mode: 'step', fix: 'r6day' });
J.push({ id: 'firstreal-390x844-dark', kind: 'first', w: 390, h: 844, theme: 'dark', text: 100, mode: 'real', fix: 'r6day' });
J.push({ id: 'zen04-390x844-dark-rm', kind: 'zen04', w: 390, h: 844, theme: 'dark', text: 100, rm: true, mode: 'step', fix: 'r6day' });
for (const theme of ['light', 'dark']) J.push({ id: `shade-844x390-${theme}`, kind: 'shade', w: 844, h: 390, theme, text: 200, mode: 'step', fix: 'r6day' });
// (the queued run's list predates 'zen04': it runs right after the reduced-motion flow)
const jobs = which === 'all' ? J : [...new Set(which.split(',').flatMap((x) => [...J.filter((j) => j.id.startsWith(x)), ...(x === 'flow-390x844-dark-rm' ? J.filter((j) => j.id.startsWith('zen04')) : [])]))];

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const log = (o) => { appendFileSync(`${out}/pix.jsonl`, JSON.stringify(o) + '\n'); console.log(JSON.stringify(o).slice(0, 400)); };

const INFO = () => {
  const r = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)]; };
  const scr = document.querySelector('[data-focus-view]');
  const chrome = scr ? [...scr.querySelectorAll('[class*=chrome]')] : [];
  const nav = document.querySelector('nav[aria-label="Your progress"]');
  const panel = document.querySelector('[data-focus-view] main');
  return {
    hash: location.hash,
    fakeNow: new Date().toISOString(),
    zen: !!document.querySelector('[data-zen]'),
    chromeOpacity: chrome.map((c) => getComputedStyle(c).opacity),
    toasts: [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => ({ id: li.id, text: li.textContent.replace(/\s+/g, ' ').slice(0, 70), box: r(li), op: getComputedStyle(li).opacity })),
    status: nav ? { tight: nav.dataset.tight !== undefined, wrap: nav.dataset.wrap !== undefined, box: r(nav), kids: [...nav.children].map((c) => ({ t: c.textContent.replace(/\s+/g, ' ').trim().slice(0, 30), box: r(c) })) } : null,
    panel: panel ? { box: r(panel), scroll: [Math.round(panel.scrollTop), panel.scrollHeight - panel.clientHeight], overflowY: getComputedStyle(panel).overflowY, bg: getComputedStyle(panel).backgroundImage.slice(0, 160) } : null,
    recipes: [...document.querySelectorAll('[class*=recipe] li, [data-recipe]')].map((x) => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 50)).slice(0, 6),
  };
};

async function run(job, rev, base) {
  const phone = job.w < 900;
  const ctx = await browser.newContext({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone && job.w < job.h ? true : phone, hasTouch: phone, colorScheme: job.theme, reducedMotion: job.rm ? 'reduce' : 'no-preference', timezoneId: 'UTC' });
  if (job.text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), job.text);
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.clock.install({ time: new Date(FIX[job.fix]) });
  const tag = `${job.id}-${rev}`;
  const t0 = Date.now();
  const step = job.mode === 'step';
  const wait = async (ms) => (step ? p.clock.runFor(ms) : p.waitForTimeout(ms));
  let tAct = Date.now();
  const shot = async (name, extra = {}) => {
    const info = await p.evaluate(INFO);
    const file = `${tag}-${name}.png`;
    await p.screenshot({ path: `${out}/${file}`, ...(extra.live ? {} : { animations: 'disabled' }), timeout: 240000, ...(extra.hideToasts ? { style: HIDE_TOASTS } : {}) });
    log({ job: job.id, rev, base, name, file, mode: job.mode, fix: FIX[job.fix], realMsSinceAction: Date.now() - tAct, ...info, errors: errors.slice(-3) });
  };
  const seed = job.kind === 'first' ? 'fresh' : 'veteran';
  const route = job.kind === 'first' ? '/welcome' : '/';
  const nt = job.theme === 'light' ? '&nooktime=day' : '';
  await p.goto(`${base}/?debug&seed=${seed}&theme=${job.theme}${nt}${job.rm ? '&motion=reduce' : ''}#${route}`, { waitUntil: 'load' });
  await p.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, muted: true, scene: 'off' }));
  await p.waitForTimeout(1500);
  if (step) { const now = await p.evaluate(() => Date.now()); await p.clock.pauseAt(new Date(now + 200)); }
  const clickByName = async (re) => {
    const box = await p.evaluate((src) => { const rx = new RegExp(src); const b = [...document.querySelectorAll('button')].find((x) => rx.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getBoundingClientRect().width > 0 && !x.closest('[aria-hidden="true"],[inert]')); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }, re.source);
    if (!box) throw new Error(`no button ${re}`);
    await p.mouse.click(box.x, box.y);
    tAct = Date.now();
  };
  const ev = (fn, a) => p.evaluate(fn, a);
  if (job.kind === 'home') {
    await wait(1200);
    await shot('01-home');
  } else if (job.kind === 'first') {
    await shot('12-welcome');
    await clickByName(/Start a 15-min brew/);
    await wait(3000);
    await shot('13-first-brew-3s');
    if (step) { await wait(5000); tAct = Date.now(); await shot('13-first-brew-8s'); }
  } else if (job.kind === 'flow') {
    await ev(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' })); tAct = Date.now();
    await wait(3500);
    await shot('02-focus-start');
    await ev(() => window.__kettle.ff(12.5 * 60_000)); tAct = Date.now();
    await wait(1200);
    await shot('03-focus-mid');
    await ev(() => window.__kettle.timer.getState().pause()); tAct = Date.now();
    await wait(900);
    await shot('04-focus-paused');
    await ev(() => window.__kettle.timer.getState().resume());
    await ev(() => window.__kettle.nearEnd());
    await wait(400);
    await ev(() => window.__kettle.finish()); tAct = Date.now();
    await wait(job.rm ? 500 + 2600 : 900 + 4600);
    await shot('07-summary');
    await clickByName(/^(Tea time|Long tea break)/);
    await wait(2600);
    await shot('09-break');
    await shot('09-break-notoasts', { hideToasts: true });
    await ev(() => window.__kettle.timer.getState().pause()); tAct = Date.now();
    await wait(900);
    await shot('09p-break-paused', { hideToasts: true });
    await ev(() => window.__kettle.timer.getState().resume());
    await ev(() => window.__kettle.settings.getState().set({ autoStartFocus: false }));
    await ev(() => window.__kettle.finish()); tAct = Date.now();
    await wait(2600);
    await shot('10-break-over');
    await shot('10-break-over-notoasts', { hideToasts: true });
    if (step) { await wait(800); await shot('10-break-over-3.4s'); }
  } else if (job.kind === 'zen04') {
    // as 02-04, but 8.1 s (page clock) pass before Pause, so the 7 s zen fade is already on when Pause is pressed;
    // shots 0.1 s (page clock) after Pause with CSS transitions LIVE (they run on real time), then 2 s later disabled
    await ev(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' })); tAct = Date.now();
    await wait(3500);
    await ev(() => window.__kettle.ff(12.5 * 60_000));
    await wait(4600);
    await shot('04z-before-pause-zen');
    await ev(() => window.__kettle.timer.getState().pause()); tAct = Date.now();
    await wait(100);
    await shot('04z-paused-0.1s-live', { live: true });
    await wait(2000); tAct = Date.now();
    await shot('04z-paused-2.1s');
  } else if (job.kind === 'shade') {
    // 200 % text, 844x390: the break running, paused, and Break's over (task) as they open (panel at its top)
    await ev(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await wait(2000);
    await ev(() => window.__kettle.nearEnd()); await wait(400);
    await ev(() => window.__kettle.finish()); await wait(5500);
    await clickByName(/^(Tea time|Long tea break)/);
    await wait(2600);
    await shot('t200-break-running', { hideToasts: true });
    await ev(() => window.__kettle.timer.getState().pause()); await wait(900);
    await shot('t200-break-paused', { hideToasts: true });
    await ev(() => window.__kettle.timer.getState().resume());
    await ev(() => window.__kettle.settings.getState().set({ autoStartFocus: false }));
    await ev(() => window.__kettle.finish()); await wait(2600);
    await shot('t200-over-carried', { hideToasts: true });
  }
  log({ job: job.id, rev, done: true, ms: Date.now() - t0, errors });
  await ctx.close();
}

for (const job of jobs) {
  for (const [rev, base] of REVS) {
    try { await run(job, rev, base); } catch (e) { log({ job: job.id, rev, error: String(e).slice(0, 300) }); }
  }
}
await browser.close();
