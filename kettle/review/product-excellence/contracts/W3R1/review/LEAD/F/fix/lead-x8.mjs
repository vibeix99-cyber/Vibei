// LEAD-5 · W3R1 X-8: the session's "Paused" pill at 375×667@2 light, base vs fix, the same steps as Lane R's capture
// state 04 (capture.mjs: seed veteran, startFocus "Chapter 3 notes", 3.5 s, ff 12.5 min, 1.2 s, pause, 0.9 s).
// Reads the pill's box and the controls' tops at +0.9 s, +2 s and +4 s after pause (a transition caught mid-way shows
// as a change between reads). Frozen clock 2026-10-12T07:40Z then resume.
//   node lead-x8.mjs <url> <label> <out> <runs>
import { chromium } from '/home/user/wt/w5tr-f2/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const [url, label, out, runs = '3'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const res = [];
for (let i = 0; i < +runs; i++) {
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light', reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  await p.clock.install({ time: Date.parse('2026-10-12T07:40:00Z') });
  await p.clock.resume();
  await p.goto(`${url}/?debug&seed=veteran&theme=light&nooktime=day#/`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, muted: true }));
  await sleep(1200);
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await sleep(3500);
  await p.evaluate(() => window.__kettle.ff(12.5 * 60_000));
  await sleep(1200);
  await p.evaluate(() => window.__kettle.timer.getState().pause());
  const reads = [];
  for (const at of [900, 2000, 4000]) {
    await sleep(at - (reads.at(-1)?.at ?? 0));
    const r = await p.evaluate(() => {
      const leaf = [...document.querySelectorAll('body *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Paused' && e.getBoundingClientRect().height > 0);
      const box = (e) => (e ? (({ top, bottom, left, right }) => ({ top: +top.toFixed(1), bottom: +bottom.toFixed(1), left: Math.round(left), right: Math.round(right) }))(e.getBoundingClientRect()) : null);
      const btn = (n) => box([...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || x.textContent || '').trim().startsWith(n)));
      return { paused: box(leaf), pill: box(leaf?.parentElement), resume: btn('Resume'), add5: btn('Add 5'), end: btn('End'), scrollY };
    });
    reads.push({ at, ...r });
  }
  await p.screenshot({ path: `${out}/${label}-375x667-light-paused-r${i + 1}.png` });
  res.push({ run: i + 1, reads });
  console.log(label, 'run', i + 1, JSON.stringify(reads.map((r) => ({ at: r.at, paused: r.paused && `${r.paused.top}-${r.paused.bottom}`, resume: r.resume?.top, add5: r.add5?.top, end: r.end?.top }))));
  await ctx.close();
}
await b.close();
writeFileSync(`${out}/x8-${label}.json`, JSON.stringify(res, null, 1));
