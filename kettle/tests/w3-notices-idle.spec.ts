/**
 * W3R1 F fix round, F-D1 (Vibei §3): the band a gone notice leaves goes on the same screen once touch and scroll are
 * idle — no pointer down, no input of any kind (scroll events included) for 1.2 s, at least 1.2 s after the leave — and
 * by 4 s; never while a pointer is down or a scroll is running. Four configurations × three cases:
 *  (a) no input after the leave; (b) the page scrolled down and back right after the leave (finger drag on phones,
 *  wheel at 1440), then idle; (c) a pointer held 3 s right after the leave, then released.
 * Every strip commit is recorded in the page with: time, why, room, pointer state, ms since the last input of any kind
 * (pointer, touch, wheel, key, scroll), and the target's (the greeting's) visible top before and after.
 *
 *   KETTLE_PORT=5501 npx playwright test tests/w3-notices-idle.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
test.use({ trace: 'off' });
test.describe.configure({ mode: 'parallel' });

const CFGS = [
  { w: 390, h: 844, pct: 100, theme: 'light', reduced: false },
  { w: 390, h: 844, pct: 200, theme: 'dark', reduced: true },
  { w: 1440, h: 900, pct: 100, theme: 'light', reduced: false },
  { w: 1440, h: 900, pct: 200, theme: 'dark', reduced: true },
] as const;

function tracker() {
  const W = window as any;
  const T: any = (W.__band = { inputs: [] as number[], commits: [] as any[], frames: 0, last: -1, down: 0 });
  const stamp = () => T.inputs.push(performance.now());
  for (const t of ['pointerdown', 'pointerup', 'pointercancel', 'click', 'wheel', 'touchstart', 'touchmove', 'touchend', 'keydown', 'scroll'])
    addEventListener(t, (e) => {
      if (t === 'pointerdown') T.down++;
      if (t === 'pointerup' || t === 'pointercancel') T.down = Math.max(0, T.down - 1);
      stamp();
      void e;
    }, { capture: true, passive: true });
  addEventListener('pointermove', (e) => (e as PointerEvent).pointerType === 'mouse' && stamp(), { capture: true, passive: true });
  let prevTop: number | null = null;
  const f = () => {
    const k = W.__kettle;
    const st = k?.notices?.();
    const tg = document.querySelector('main h1');
    const top = tg ? tg.getBoundingClientRect().top : null;
    if (st && st.version !== T.last) {
      const now = performance.now();
      const lastIn = T.inputs.length ? T.inputs[T.inputs.length - 1] : -Infinity;
      T.commits.push({ t: Math.round(now), why: st.why, room: st.room, shown: st.shown, down: T.down, sinceInput: Math.round(now - lastIn), topBefore: prevTop, topAfter: top, sy: Math.round(scrollY) });
      T.last = st.version;
    }
    prevTop = top;
    T.frames++;
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

async function setup(page: Page, url: string, theme: string) {
  await page.goto(`${url}/?debug&seed=newbie&theme=${theme}#/`);
  await page.waitForFunction(() => { const i = (window as any).__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1, 1).catch(() => {});
  await page.waitForTimeout(1500);
  await page.evaluate(() => (window as any).__kettle.toast('Saved 3 minutes of focus · band probe', { tone: 'success', duration: 3000 }));
  // The notice is drawn, then goes at rest: the band is kept.
  await page.waitForFunction(() => document.querySelectorAll('[data-notice-strip] li').length === 1, null, { timeout: 15_000 });
  await page.waitForFunction(() => { const s = (window as any).__kettle.notices(); return s.shown === null && s.room > 0; }, null, { timeout: 20_000, polling: 'raf' });
  return page.evaluate(() => ({ leftAt: performance.now(), room: (window as any).__kettle.notices().room }));
}

const commitsAfter = (page: Page, t: number) => page.evaluate((t) => (window as any).__band.commits.filter((c: any) => c.t > t), t);
const lastInput = (page: Page) => page.evaluate(() => { const i = (window as any).__band.inputs; return i.length ? i[i.length - 1] : -Infinity; });

for (const c of CFGS) {
  const name = `${c.w}x${c.h}-${c.theme}-t${c.pct}${c.reduced ? '-rm' : ''}`;
  for (const kase of ['a-no-input', 'b-scroll-then-idle', 'c-pointer-held'] as const) {
    test(`band lifetime ${kase} (${name})`, async ({ browser, baseURL }) => {
      test.setTimeout(90_000);
      const phone = c.w < 900;
      const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone, colorScheme: c.theme, reducedMotion: c.reduced ? 'reduce' : 'no-preference' });
      await ctx.addInitScript((pct) => {
        try {
          localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
        } catch {
          /* ignore */
        }
        if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
      }, c.pct);
      await ctx.addInitScript(tracker);
      const page = await ctx.newPage();
      await page.clock.install({ time: MONDAY });
      await page.clock.resume();
      const shots = test.info().outputPath();
      await page.goto('about:blank');
      const { leftAt, room } = await setup(page, base(baseURL), c.theme);
      await page.screenshot({ path: `${shots}/${name}-${kase}-1-band.png` });
      let busyUntil = leftAt;
      const fact: any = { leftAt: Math.round(leftAt), room };
      if (kase === 'b-scroll-then-idle') {
        if (phone) {
          const cdp = await ctx.newCDPSession(page);
          const drag = async (dy: number) => {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(c.w / 2), y: Math.round(c.h * 0.6) }] });
            for (let k = 1; k <= 12; k++) {
              await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(c.w / 2), y: Math.round(c.h * 0.6 - (k * dy) / 12) }] });
              await page.waitForTimeout(16);
            }
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await page.waitForTimeout(150);
          };
          for (let i = 0; i < 3; i++) await drag(150);
          fact.maxSy = await page.evaluate(() => scrollY);
          for (let i = 0; i < 6 && (await page.evaluate(() => scrollY)) > 0; i++) await drag(-200);
        } else {
          await page.mouse.move(Math.round(c.w / 2), Math.round(c.h / 2));
          for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 60); await page.waitForTimeout(150); }
          fact.maxSy = await page.evaluate(() => scrollY);
          for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -60); await page.waitForTimeout(150); }
          await page.mouse.move(1, 1);
        }
        await page.waitForTimeout(100);
        busyUntil = await lastInput(page);
        fact.scrollMs = Math.round(busyUntil - leftAt);
        fact.roomAfterScroll = await page.evaluate(() => (window as any).__kettle.notices().room);
      } else if (kase === 'c-pointer-held') {
        const h1 = (await page.locator('main h1').first().boundingBox())!;
        await page.mouse.move(h1.x + 10, h1.y + h1.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(3000);
        fact.roomWhileDown = await page.evaluate(() => (window as any).__kettle.notices().room);
        fact.downWhileHeld = await page.evaluate(() => (window as any).__kettle.moment().down);
        await page.mouse.up();
        busyUntil = await lastInput(page);
      }
      await page.waitForFunction(() => (window as any).__kettle.notices().room === 0, null, { timeout: 8_000, polling: 'raf' });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${shots}/${name}-${kase}-2-after-collapse.png` });
      const commits = await commitsAfter(page, leftAt + 5);
      const collapse = commits.find((x: any) => x.room === 0);
      fact.commits = commits;
      fact.collapseAfterLeaveMs = Math.round(collapse.t - leftAt);
      fact.collapseAfterLastBusyMs = Math.round(collapse.t - busyUntil);
      fact.visibleMove = collapse.topBefore != null && collapse.topAfter != null ? Math.round((collapse.topBefore - collapse.topAfter) * 10) / 10 : null;
      test.info().annotations.push({ type: 'facts', description: JSON.stringify(fact) });
      console.log(`FACT ${name} ${kase} ${JSON.stringify(fact)}`);
      // One band commit only (the collapse), at rest: no pointer down, ≥ 1.2 s since any input, ≥ 1.2 s after the leave.
      expect(commits.filter((x: any) => x.room === 0).length, 'one collapse').toBe(1);
      // (The leave's own commit can be recorded a frame late, after `leftAt`: it keeps the same room and shows nothing.)
      expect(commits.filter((x: any) => x.room !== 0 && !(x.room === room && x.shown === null)), 'no other strip commit between the leave and the collapse').toEqual([]);
      expect(collapse.down, 'pointer up at the collapse').toBe(0);
      expect(collapse.sinceInput, 'ms since the last input of any kind').toBeGreaterThanOrEqual(1200);
      expect(fact.collapseAfterLeaveMs).toBeGreaterThanOrEqual(1200);
      expect(fact.collapseAfterLastBusyMs, 'no later than 4 s after the later of the leave and the last input').toBeLessThanOrEqual(4000);
      if (kase === 'b-scroll-then-idle') expect(fact.roomAfterScroll, 'kept during the scroll').toBeGreaterThan(0);
      if (kase === 'c-pointer-held') {
        expect(fact.downWhileHeld).toBeGreaterThan(0);
        expect(fact.roomWhileDown, 'kept while the pointer is down').toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => location.hash), 'same screen').toBe('#/');
      await ctx.close();
    });
  }
}
