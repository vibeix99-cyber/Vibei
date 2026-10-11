// M7b BEFORE / AFTER captures in one browser session: INT (BEFORE) and this revision (AFTER), interleaved per state.
// Clock: page.clock.install at one fixed time for every context; the tea break's countdown is frozen at 4:55 with
// page.clock.pauseAt (5 s into the break), so the running and paused break read the same on both revisions.
// Screenshots use animations: 'disabled'. Scrolling to the bottom controls is done by a REAL wheel over the panel.
//   node capture.mjs <outdir> <beforeBase> <afterBase> [only=<substring>]
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, appendFileSync } from 'node:fs';

const [out, beforeBase, afterBase, only] = process.argv.slice(2);
const REVS = [
  ['BEFORE-INT', beforeBase],
  ['AFTER-M7b', afterBase],
];
const T0 = new Date('2026-10-12T10:30:00Z'); // a fixed morning for every context
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const log = (s) => { console.log(s); appendFileSync(`${out}/captures.log`, s + '\n'); };

const JOBS = [];
for (const [w, h] of [[375, 667], [390, 844], [844, 390]]) for (const theme of ['light', 'dark']) JOBS.push({ w, h, theme, text: 200 });
for (const [w, h] of [[375, 667], [390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) JOBS.push({ w, h, theme, text: 100 });

async function ctxFor(job) {
  const phone = job.w < 900;
  const ctx = await browser.newContext({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: job.theme, reducedMotion: 'no-preference' });
  await ctx.addInitScript((pct) => {
    try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, job.text);
  const page = await ctx.newPage();
  await page.clock.install({ time: T0 });
  return { ctx, page, phone };
}
async function toBreak(page, phone, base, theme) {
  await page.goto(`${base}/?debug&seed=newbie&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(1200);
  await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await sleep(2000);
  await page.evaluate(() => window.__kettle.nearEnd());
  await sleep(400);
  await page.evaluate(() => window.__kettle.finish());
  const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
  await tea.waitFor({ state: 'visible', timeout: 60_000 });
  await sleep(2400);
  const b = await tea.boundingBox();
  if (phone) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
}
/** Real wheel over the session panel until nothing moves any more. Returns the panel's scroll offset / range. */
async function wheelToBottom(page) {
  const aim = await page.evaluate(() => { const r = document.querySelector('[data-focus-view] main').getBoundingClientRect(); return { x: Math.round((Math.max(0, r.left) + Math.min(innerWidth, r.right)) / 2), y: Math.round((Math.max(0, r.top) + Math.min(innerHeight, r.bottom)) / 2) }; });
  const pos = () => page.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); return `${Math.round(m.scrollTop)}/${m.scrollHeight - m.clientHeight}`; });
  let prev = null;
  for (let i = 0; i < 20; i++) {
    await page.mouse.move(aim.x, aim.y);
    await page.mouse.wheel(0, 120);
    await sleep(250);
    const p = await pos();
    if (p === prev) break;
    prev = p;
  }
  return pos();
}
const shot = async (page, path) => page.screenshot({ path, animations: 'disabled' });

for (const job of JOBS) {
  const id = `${job.w}x${job.h}-${job.theme}-t${job.text}`;
  if (only && !id.includes(only)) continue;
  for (const [rev, base] of REVS) {
    const dir = `${out}/${rev}`;
    mkdirSync(dir, { recursive: true });
    // ---- the tea break: running (top), then paused (top and, at 200 %, scrolled to the bottom controls) ----
    {
      const { ctx, page, phone } = await ctxFor(job);
      try {
        await toBreak(page, phone, base, job.theme);
        // endsAt is on the app's clock (Date.now() plus the debug fast-forward): convert to the page's Date.now().
        const t = await page.evaluate(() => ({ left: window.__kettle.timer.getState().endsAt - window.__kettle.clock.now(), now: Date.now() }));
        await page.clock.pauseAt(new Date(t.now + t.left - 295_000)); // 4:55 left
        await sleep(1500);
        await shot(page, `${dir}/${id}-break-running.png`);
        await page.evaluate(() => window.__kettle.timer.getState().pause());
        await page.clock.resume();
        await sleep(1800);
        await shot(page, `${dir}/${id}-break-paused-top.png`);
        if (job.text !== 100) {
          const p = await wheelToBottom(page);
          await sleep(500);
          await shot(page, `${dir}/${id}-break-paused-bottom.png`);
          log(`${rev} ${id} break-paused wheel → panel ${p}`);
        }
      } catch (e) { log(`${rev} ${id} break ERROR ${String(e.message).split('\n')[0]}`); }
      await ctx.close();
    }
    // ---- Break's over with the carried task: top and, at 200 %, scrolled to the bottom controls ----
    {
      const { ctx, page, phone } = await ctxFor(job);
      try {
        await toBreak(page, phone, base, job.theme);
        await sleep(1000);
        await page.evaluate(() => window.__kettle.finish());
        await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached', timeout: 20_000 });
        await sleep(4200); // any toast raised as the break ends has left (3.2 s)
        await shot(page, `${dir}/${id}-over-carried-top.png`);
        if (job.text !== 100) {
          const p = await wheelToBottom(page);
          await sleep(500);
          await shot(page, `${dir}/${id}-over-carried-bottom.png`);
          log(`${rev} ${id} over-carried wheel → panel ${p}`);
        }
      } catch (e) { log(`${rev} ${id} over ERROR ${String(e.message).split('\n')[0]}`); }
      await ctx.close();
    }
    log(`${rev} ${id} done`);
  }
}
await browser.close();
