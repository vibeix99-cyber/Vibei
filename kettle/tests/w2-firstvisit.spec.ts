/**
 * Wave 2 · first visit only (I08, first-visit part). Split out of Maker H's tests/w2-home.spec.ts (pe/w2-home@7a961b7)
 * by Vibei's ruling: the first-visit purpose line ships alone; the Brew length change is withdrawn. The test body is
 * H's, unchanged. Real taps only; the debug API only sets up state.
 *
 *   KETTLE_PORT=<port> npx playwright test tests/w2-firstvisit.spec.ts --project=chromium
 *
 * First visit: one plain line says Kettle is focus time followed by an optional tea break; one primary action (the
 * 15-minute brew); the task stays optional. At 375×667 and 100 % it fits without scrolling; at 200 % the primary action
 * is reachable.
 */
import { test, expect, type Browser } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const SIZES = [
  [390, 844],
  [375, 667],
  [844, 390],
] as const;

async function device(browser: Browser, w: number, h: number, pct: number, theme: 'light' | 'dark') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < h, hasTouch: true, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB' });
  if (pct !== 100)
    await ctx.addInitScript((p) => {
      addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = `html{font-size:${p}%!important}`;
        document.head.appendChild(s);
      });
    }, pct);
  const page = await ctx.newPage();
  await page.clock.install({ time: FIXED });
  await page.clock.resume();
  return { ctx, page };
}


for (const [w, h] of SIZES)
  for (const pct of [100, 200]) {
    test(`first visit: one plain line, one primary action, the 15-minute brew (${w}×${h}, ${pct} % text)`, async ({ browser, baseURL }) => {
      const { ctx, page } = await device(browser, w, h, pct, 'light');
      await page.goto(`${base(baseURL)}/?debug&seed=fresh&theme=light&onboarded=0#/welcome`);
      await page.waitForFunction(() => !!(window as any).__kettle, null, { timeout: 60_000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);
      // One plain line: Kettle is focus time, then a tea break you can take or skip.
      const line = (await page.locator('h1 + p').first().textContent())!.trim();
      expect(line).toMatch(/^Kettle is focus time, then a tea break if you want one\.$/);
      // One primary action, the 15-minute brew; the task field is optional; setup and restore are quiet links.
      const start = page.getByRole('button', { name: 'Start a 15-min brew' });
      await expect(start).toHaveCount(1);
      await expect(page.getByRole('textbox', { name: /optional/ })).toHaveCount(1);
      const sizes = await page.evaluate(() =>
        [...document.querySelectorAll('button')]
          .filter((b) => b.getBoundingClientRect().height > 0)
          .map((b) => {
            const cs = getComputedStyle(b);
            return {
              name: (b.textContent || '').trim(),
              w: b.getBoundingClientRect().width,
              h: b.getBoundingClientRect().height,
              // A quiet link: no fill, underlined text (not a second button).
              link: cs.backgroundImage === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) && cs.textDecorationLine.includes('underline'),
            };
          }),
      );
      const primary = sizes.find((b) => b.name.startsWith('Start a 15-min brew'))!;
      const others = sizes.filter((b) => b !== primary);
      expect(others.map((b) => b.name).sort()).toEqual(['I have a backup', 'Set things up first']);
      for (const b of others) {
        expect.soft(b.link, `${b.name} is a quiet link, not a second button`).toBe(true);
        expect.soft(b.h >= 24 && b.w >= 24, `${b.name} ≥ 24×24 (${Math.round(b.w)}×${Math.round(b.h)})`).toBe(true);
      }
      if (w === 375 && h === 667 && pct === 100) {
        expect(await page.evaluate(() => document.scrollingElement!.scrollHeight - innerHeight), 'fits without scrolling').toBeLessThanOrEqual(0);
        await expect(start).toBeInViewport({ ratio: 1 });
      }
      // The primary action is reachable (scrolled to when needed) and on top where it is.
      await start.evaluate((el) => el.scrollIntoView({ block: 'nearest' }));
      const onTop = await start.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!e && (e === el || el.contains(e)) && r.top >= 0 && r.bottom <= innerHeight;
      });
      expect(onTop).toBe(true);
      // …and it starts a 15-minute brew with no task, by a real tap.
      await start.tap();
      await page.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 });
      const t = await page.evaluate(() => (window as any).__kettle.timer.getState());
      expect(t.status).toBe('running');
      expect(t.plannedMs).toBe(15 * 60_000);
      expect(t.intention).toBe('');
      await ctx.close();
    });
  }
