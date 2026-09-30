#!/usr/bin/env node
/**
 * UGC pack: a real recording of Kettle's core loop on the unchanged production build (vite preview on 4173),
 * frame by frame at 30 fps (adapted from marketing/ad-01-kettle-on/build/record-app.mjs).
 *
 * Playwright's fake clock drives Date, timers, rAF and performance.now, and compositor animations are stepped to
 * the same virtual time, so playback speed is real time. The ONE manipulation is a time jump: the app's own debug
 * clock skips from about 24:56 to 3 s before the whistle. The encoder inserts a card that says so.
 * Demo profile "celebrate" (Mika), light theme, phone layout 390 × 844 at 2×. No audio is captured.
 *
 * usage (from kettle/): node marketing/ugc-pack/build/record-core-loop.mjs <out-dir>
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const [out = '.tmp/ugc-rec'] = process.argv.slice(2);
const FPS = 30;
const DT = 1000 / FPS;
const events = { fps: FPS, segments: {} };

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', colorScheme: 'light' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.clock.install({ time: new Date('2026-10-12T15:30:00') });
await page.goto('http://localhost:4173/?debug&seed=celebrate&theme=light#/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => '__kettle' in window);
await page.waitForTimeout(2500); // real time: fonts, lazy chunks, first 3D frames
await page.clock.pauseAt(new Date('2026-10-12T15:30:10'));
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
      if (typeof end === 'number' && Number.isFinite(end) && t >= end) a.finish();
      else a.currentTime = Math.max(0, t);
    }
  };
});

let seg = null;
let frame = 0;
function segment(name) {
  seg = name;
  frame = 0;
  mkdirSync(`${out}/${name}`, { recursive: true });
  events.segments[name] = { marks: {} };
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

// ---- A: Home (intention typed, Study chosen) → tap Put the kettle on → Focus
await page.clock.runFor(200);
await page.getByRole('textbox').first().fill('Chapter 3 notes');
await page.getByRole('button', { name: 'Study', exact: true }).click();
await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
await page.clock.runFor(600);
segment('a-home-focus');
await step(40);
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
mark('startTap');
await step(4 * FPS);
events.segments[seg].frames = frame;

// ---- B: TIME JUMP (labelled in the video) to 3 s before the end, then the natural whistle and completion card
segment('b-whistle');
await page.evaluate(() => {
  const k = window.__kettle;
  const v = k.timer.getState();
  k.ff(v.endsAt - k.clock.now() - 3000);
});
mark('jump');
await step(8 * FPS);
events.segments[seg].frames = frame;

// ---- C: the completion cards as a user taps through them (real time), then the tea break
segment('c-cards-break');
for (let i = 0; i < 8; i++) {
  const start = page.getByRole('button', { name: /start tea break/i });
  if (await start.count()) {
    await start.first().click();
    mark('breakTap');
    break;
  }
  const next = page.getByRole('button', { name: /^continue$/i });
  if (!(await next.count())) break;
  await next.first().click();
  await step(Math.round(1.4 * FPS));
}
await step(5 * FPS);
events.segments[seg].frames = frame;

writeFileSync(`${out}/events.json`, JSON.stringify(events, null, 1));
await browser.close();
console.log('done', JSON.stringify(Object.fromEntries(Object.entries(events.segments).map(([k, v]) => [k, v.frames]))));
