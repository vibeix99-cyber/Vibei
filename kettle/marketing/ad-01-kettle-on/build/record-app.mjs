#!/usr/bin/env node
/**
 * Real Kettle footage, frame by frame (deterministic 30 fps even on a software renderer).
 *
 * - Playwright's fake clock drives Date, timers, requestAnimationFrame and performance.now
 *   (so the 3D nook, springs and the timer advance exactly 1/30 s per frame).
 * - CSS animations/transitions and WAAPI animations (which run on the compositor's real clock)
 *   are paused and stepped to the same virtual time every frame.
 * - Nothing in the app is changed: this drives the real dev build like a user would
 *   (typing, taps) plus the debug API for the time jump (finish) and the break.
 *
 * usage: node record-app.mjs <base-url> <out-dir>
 * writes <out-dir>/<segment>/f0000.jpg … and <out-dir>/events.json (taps, cuts)
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const [base = 'http://localhost:5191', out = 'rec'] = process.argv.slice(2);
const FPS = 30;
const DT = 1000 / FPS;
const VW = 600, VH = 1000, DPR = 2.5; // single-column phone layout, larger so the 3D nook renders more pixels
const events = { fps: FPS, viewport: { width: VW, height: VH, dpr: DPR }, segments: {} };

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
// Non-touch context: the engine renders at up to 2× (phones cap it at 1.5×).
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR, serviceWorkers: 'block' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.clock.install({ time: new Date('2026-10-12T21:00:00') });
await page.goto(`${base}/?debug&seed=blank&theme=dark#/`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => '__kettle' in window);
// Evening, with rain: pin the app's own clock to 21:15 today (the seed pins 15:30 for screenshots).
await page.evaluate(() => {
  const k = window.__kettle;
  const now = k.clock.now();
  const d = new Date(now);
  d.setHours(21, 15, 0, 0);
  k.clock.advance(d.getTime() - now);
  k.settings.getState().set({ ambient: 'rain' });
});
await page.waitForTimeout(2500); // real time: fonts, lazy chunks, first 3D frames
await page.clock.pauseAt(new Date('2026-10-12T21:00:10'));

// Step every compositor animation to the page's virtual time.
await page.evaluate(() => {
  window.__syncAnims = () => {
    const vt = performance.now();
    for (const a of document.getAnimations()) {
      if (a.__v === undefined) {
        a.__v = vt - Math.max(0, a.currentTime ?? 0);
        a.pause();
      }
      const t = vt - a.__v;
      const end = a.effect?.getComputedTiming().endTime;
      if (typeof end === 'number' && Number.isFinite(end) && t >= end) {
        a.finish();
      } else a.currentTime = Math.max(0, t);
    }
  };
});

let seg = null;
let frame = 0;
async function segment(name) {
  seg = name;
  frame = 0;
  mkdirSync(`${out}/${name}`, { recursive: true });
  events.segments[name] = { taps: [], marks: {} };
}
async function step(n = 1) {
  for (let i = 0; i < n; i++) {
    await page.clock.runFor(DT);
    await page.evaluate(() => window.__syncAnims());
    await page.screenshot({ path: `${out}/${seg}/f${String(frame).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92, timeout: 180_000 });
    frame++;
  }
}
const mark = (k) => (events.segments[seg].marks[k] = frame);
async function tap(locator, label) {
  const box = await locator.boundingBox();
  events.segments[seg].taps.push({ frame, label, x: box.x + box.width / 2, y: box.y + box.height / 2 });
  await locator.click({ timeout: 10_000 });
}

// ---- A: Home (intention + Study set before frame 0) → one tap on Put the kettle on → Focus
const input = page.getByRole('textbox', { name: /what are you brewing/i });
await page.clock.runFor(200);
await input.fill('Chapter 3 notes');
const study = page.getByRole('radio', { name: /study/i }).or(page.getByRole('button', { name: /^study/i })).or(page.getByRole('checkbox', { name: /study/i })).first();
await study.click();
await page.clock.runFor(600);
await segment('a-home-focus');
await step(Number(process.env.HOME_FRAMES ?? 30));
await tap(page.getByRole('button', { name: /put the kettle on/i }), 'start');
mark('startTap');
await step(Number(process.env.FOCUS_FRAMES ?? Math.round(5 * FPS)));
events.segments[seg].frames = frame;

// ---- B: the end of the focus. The app clock jumps to 3 s before the end (the edit says "25 minutes later…");
// from there it is the natural completion path: 00:03 → 00:00, the whistle in the room, the card.
await segment('b-whistle');
await page.evaluate(() => {
  const k = window.__kettle;
  const v = k.timer.getState();
  k.ff(v.endsAt - k.clock.now() - 3000);
});
mark('jump');
await step(Number(process.env.WHISTLE_FRAMES ?? Math.round(7 * FPS)));
events.segments[seg].frames = frame;

// ---- C: the tea break (the real break screen)
await segment('c-break');
await page.evaluate(() => {
  window.__kettle.timer.getState().startBreak('shortBreak');
  window.__kettle.navigate('/focus');
});
mark('break');
await step(Number(process.env.BREAK_FRAMES ?? Math.round(4.5 * FPS)));
events.segments[seg].frames = frame;

writeFileSync(`${out}/events.json`, JSON.stringify(events, null, 1));
await browser.close();
console.log('done', JSON.stringify(Object.fromEntries(Object.entries(events.segments).map(([k, v]) => [k, v.frames]))));
