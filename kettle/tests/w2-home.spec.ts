/**
 * Wave 2 · Home and first visit (I08 + Wave-1 follow-up #2). Real taps and keys only; the debug API only sets up state.
 *
 *   KETTLE_PORT=5212 npx playwright test tests/w2-home.spec.ts --project=chromium
 *
 * Today, at 390×844, 375×667 and 844×390, at 100 % and 200 % text, light and dark, AT REST (nothing scrolled, nothing
 * touched):
 * - every Brew length option (15, 25, 50, Custom) is wholly on screen, on top at nine points, and not under the docked
 *   start; each is at least 24×24 CSS px
 * - axe at rest: no `target-size` violation and no serious/critical violation (no scrolled-clear exception)
 * - a real tap on each length sets the length the start button names, without scrolling or starting a brew; Custom opens
 *   its sheet and "Use" sets it
 * - Tab reaches the Brew length group (one tab stop, a radio group) with a visible focus ring; the arrow keys reach every
 *   option, each with a ring, and the start button follows
 * First visit: one plain line says Kettle is focus time followed by an optional tea break; one primary action (the
 * 15-minute brew); the task stays optional. At 375×667 and 100 % it fits without scrolling; at 200 % the primary action
 * is reachable.
 */
import { test, expect, type Browser, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
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

async function today(page: Page, url: string, theme: string) {
  await page.goto(`${url}/?debug&seed=veteran&theme=${theme}#/`);
  await page.waitForFunction(() => !!(window as any).__kettle, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => (window as any).__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.getByRole('radiogroup', { name: 'Brew length' }).waitFor({ state: 'attached' });
  await page.waitForTimeout(1500);
}

/** The Brew length options and the docked start (the sticky box that holds "Put the kettle on"), as they are now. */
const geometry = (page: Page) =>
  page.evaluate(() => {
    const start = [...document.querySelectorAll('button')].find((e) => /put the kettle on/i.test(e.textContent || ''))!;
    let dock: HTMLElement | null = start;
    while (dock && getComputedStyle(dock).position !== 'sticky') dock = dock.parentElement;
    const d = dock!.getBoundingClientRect();
    const opts = [...document.querySelectorAll('[role=radiogroup][aria-label="Brew length"] [role=radio]')] as HTMLElement[];
    return {
      scrollY: scrollY,
      start: start.textContent!.replace(/\s+/g, ' ').trim(),
      dock: { top: d.top, bottom: d.bottom },
      options: opts.map((o) => {
        const r = o.getBoundingClientRect();
        const inDock = dock!.contains(o);
        let hits = 0;
        // Nine points inside the rounded box (20 % in from each edge: a corner's curve is not a cover).
        for (const fx of [0.2, 0.5, 0.8])
          for (const fy of [0.2, 0.5, 0.8]) {
            const x = r.left + r.width * fx;
            const y = r.top + r.height * fy;
            const e = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight ? document.elementFromPoint(x, y) : null;
            if (e && (e === o || o.contains(e))) hits++;
          }
        return {
          name: (o.textContent || '').replace(/\s+/g, ' ').trim(),
          checked: o.getAttribute('aria-checked') === 'true',
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          w: r.width,
          h: r.height,
          inView: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth,
          underDock: !inDock && r.bottom > d.top + 0.5 && r.top < d.bottom,
          hits,
        };
      }),
    };
  });

const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      name: (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
      inLength: !!el.closest('[role=radiogroup][aria-label="Brew length"]'),
      ring: el.matches(':focus-visible') && ((cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== 'none'),
      seen: !!e && (e === el || el.contains(e)),
      inView: r.top >= 0 && r.bottom <= innerHeight,
    };
  });

for (const [w, h] of SIZES)
  for (const pct of [100, 200])
    for (const theme of ['light', 'dark'] as const) {
      test(`Brew length: every option on screen at rest, clear of the docked start, tapped and keyed (${w}×${h}, ${pct} % text, ${theme})`, async ({ browser, baseURL }) => {
        test.setTimeout(120_000);
        const url = base(baseURL);
        // ---- at rest
        const { ctx, page } = await device(browser, w, h, pct, theme);
        await today(page, url, theme);
        const g = await geometry(page);
        expect(g.scrollY).toBe(0);
        expect(g.options.map((o) => o.name.replace(/[^0-9a-z ]/gi, ''))).toHaveLength(4);
        for (const o of g.options) {
          expect.soft(o.inView, `${o.name} wholly on screen at rest`).toBe(true);
          expect.soft(o.underDock, `${o.name} under the docked start (dock ${Math.round(g.dock.top)}–${Math.round(g.dock.bottom)})`).toBe(false);
          expect.soft(o.hits, `${o.name}: points on top (of 9)`).toBe(9);
          expect.soft(o.w >= 24 && o.h >= 24, `${o.name} ${o.w.toFixed(1)}×${o.h.toFixed(1)} ≥ 24×24`).toBe(true);
        }
        const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const bad = axe.violations.filter((v) => v.id === 'target-size' || v.impact === 'serious' || v.impact === 'critical');
        expect.soft(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
        expect(await page.evaluate(() => scrollY)).toBe(0);

        // ---- real taps at the at-rest centres
        for (const [want, label] of [
          ['15 min', '· 15 min'],
          ['50 min', '· 50 min'],
          ['25 min', '· 25 min'],
        ] as const) {
          const o = (await geometry(page)).options.find((x) => x.name.startsWith(want))!;
          expect(o.hits, `${want} is on top where it is tapped`).toBe(9);
          await page.touchscreen.tap(o.x, o.y);
          await expect.poll(async () => (await geometry(page)).start).toContain(label);
          const after = await geometry(page);
          expect(after.options.find((x) => x.checked)?.name).toContain(want);
          expect(after.scrollY).toBe(0);
          expect(await page.evaluate(() => location.hash)).toBe('#/');
        }
        const c = (await geometry(page)).options.find((x) => /Custom/.test(x.name))!;
        await page.touchscreen.tap(c.x, c.y);
        const sheet = page.getByRole('dialog');
        await expect(sheet).toBeVisible();
        await sheet.getByRole('button', { name: 'Increase brew length' }).tap();
        await sheet.getByRole('button', { name: /^Use 30\/5 min$/ }).tap();
        await expect(sheet).toBeHidden();
        await expect.poll(async () => (await geometry(page)).start).toContain('· 30 min');
        // Back to 25 by tapping it where it is now (the custom length can add a line to the dock).
        const o25 = (await geometry(page)).options.find((x) => x.name.startsWith('25 min'))!;
        expect(o25.hits).toBe(9);
        await page.touchscreen.tap(o25.x, o25.y);
        await expect.poll(async () => (await geometry(page)).start).toContain('· 25 min');
        await ctx.close();

        // ---- keyboard, fresh profile
        const k = await device(browser, w, h, pct, theme);
        await today(k.page, url, theme);
        let at = null as Awaited<ReturnType<typeof focused>>;
        for (let i = 0; i < 60 && !at?.inLength; i++) {
          await k.page.keyboard.press('Tab');
          at = await focused(k.page);
        }
        expect(at?.inLength, 'Tab reaches the Brew length group').toBe(true);
        expect(at?.name).toContain('25 min');
        expect(at?.ring, 'visible focus ring').toBe(true);
        expect(at?.seen && at?.inView, 'focused option on screen and on top').toBe(true);
        for (const [key, want, label] of [
          ['ArrowLeft', '15 min', '· 15 min'],
          ['ArrowRight', '25 min', '· 25 min'],
          ['ArrowRight', '50 min', '· 50 min'],
        ] as const) {
          await k.page.keyboard.press(key);
          await expect.poll(async () => (await focused(k.page))?.name).toContain(want);
          const f = (await focused(k.page))!;
          expect(f.ring && f.seen && f.inView, `${want}: ring, on screen, on top`).toBe(true);
          await expect.poll(async () => (await geometry(k.page)).start).toContain(label);
        }
        // The fourth option, Custom, opens its sheet (selection follows focus); Esc returns focus to it, ring and all.
        await k.page.keyboard.press('ArrowRight');
        await expect(k.page.getByRole('dialog')).toBeVisible();
        await k.page.keyboard.press('Escape');
        await expect(k.page.getByRole('dialog')).toBeHidden();
        await expect.poll(async () => (await focused(k.page))?.name).toContain('Custom');
        const f = (await focused(k.page))!;
        expect(f.ring && f.seen && f.inView, 'Custom: ring, on screen, on top').toBe(true);
        expect((await geometry(k.page)).start).toContain('· 50 min');
        await k.ctx.close();
      });
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
