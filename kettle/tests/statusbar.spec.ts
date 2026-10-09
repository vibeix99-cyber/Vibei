/**
 * Today's status bar (I04 F6 + integration fix r2): the three stats (warm days · leaves · level) stay on one row on
 * phones at normal text size, tighten before they wrap, wrap only when they genuinely can't fit, and never make Today
 * scroll sideways — including after a resize/rotation and at 200 % text with large leaf totals.
 *
 *   KETTLE_PORT=5222 npx playwright test tests/statusbar.spec.ts --project=chromium
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { open } from './a11y-probes.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => u ?? 'http://127.0.0.1:5183';
const phone = { deviceScaleFactor: 2, isMobile: true, hasTouch: true };

type Row = { mode: string; rows: number; barRight: number; scrollWidth: number; clientWidth: number; innerWidth: number; tabBottom: number; screenH: number };

async function row(page: Page): Promise<Row> {
  return page.evaluate(() => {
    const el = document.querySelector('nav[aria-label="Your progress"]') as HTMLElement;
    const kids = [...el.children] as HTMLElement[];
    // The stats' own boxes and every piece of visible text inside them (a label wider than its column spills past its
    // pill). Not decorations clipped inside a box (the level bar's moving sheen), not 1×1 px `.sr-only` text.
    const texts = [...el.querySelectorAll<HTMLElement>('*')].filter(
      (n) => n.offsetWidth > 1 && [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent!.trim()),
    );
    const right = Math.max(...[el, ...kids, ...texts].map((n) => n.getBoundingClientRect().right));
    const tabs = document.querySelector('nav[aria-label="Main"]') as HTMLElement | null;
    return {
      mode: el.hasAttribute('data-wrap') ? 'wrap' : el.hasAttribute('data-tight') ? 'tight' : 'normal',
      rows: new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top))).size,
      barRight: Math.round(right),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      tabBottom: tabs ? Math.round(tabs.getBoundingClientRect().bottom) : -1,
      screenH: window.screen.height,
    };
  });
}

/** Let resize/font/ResizeObserver work settle (CPU renderer: generous). */
const settle = (page: Page) => page.waitForTimeout(1500);

function noSidewaysScroll(r: Row, w: number) {
  expect(r.scrollWidth, 'page wider than the screen').toBeLessThanOrEqual(r.clientWidth);
  expect(r.innerWidth, 'layout viewport widened to fit an overflow').toBe(w);
  expect(r.barRight, 'a stat reaches past the screen edge').toBeLessThanOrEqual(w);
}

async function bigText(ctx: BrowserContext, pct: number) {
  await ctx.addInitScript((pct) => {
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = `html{font-size:${pct}%!important}`;
      document.head.appendChild(s);
    });
  }, pct);
}

for (const theme of ['light', 'dark'] as const) {
  test(`resize or rotation to 375×667 re-fits the row: one tight row, no sideways scroll (${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    for (const [fromW, fromH] of [
      [414, 896],
      [667, 375],
      [844, 390],
    ] as const) {
      const ctx = await browser.newContext({ ...phone, viewport: { width: fromW, height: fromH }, colorScheme: theme });
      const page = await ctx.newPage();
      await open(page, base(baseURL), { theme });
      await settle(page);
      await page.setViewportSize({ width: 375, height: 667 });
      await settle(page);
      const r = await row(page);
      expect(r.mode, `${fromW}×${fromH} → 375×667`).toBe('tight');
      expect(r.rows).toBe(1);
      noSidewaysScroll(r, 375);
      if (r.tabBottom >= 0) expect(r.tabBottom, 'tab bar ends below the screen').toBeLessThanOrEqual(667);
      // …and back to a wider phone: the designed padding returns.
      await page.setViewportSize({ width: 414, height: 896 });
      await settle(page);
      expect((await row(page)).mode).toBe('normal');
      await ctx.close();
    }
    // A desktop window narrowed to phone width.
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
    const page = await ctx.newPage();
    await open(page, base(baseURL), { theme });
    await settle(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await settle(page);
    const r = await row(page);
    expect(r.rows).toBe(1);
    expect(r.scrollWidth, 'page wider than the window').toBeLessThanOrEqual(r.clientWidth);
    expect(r.barRight).toBeLessThanOrEqual(r.clientWidth);
    await ctx.close();
  });

  test(`large text with large leaf totals never pushes "Level NN" past the screen (${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(300_000);
    for (const [w, h] of [
      [375, 667],
      [390, 844],
      [360, 740],
    ] as const) {
      for (const pct of [150, 200]) {
        const ctx = await browser.newContext({ ...phone, viewport: { width: w, height: h }, colorScheme: theme });
        await bigText(ctx, pct);
        const page = await ctx.newPage();
        await open(page, base(baseURL), { theme });
        for (const leaves of [2296, 10_000, 123_456, 470_000]) {
          await page.evaluate((n) => (window as any).__kettle.progress.setState({ leaves: n }), leaves);
          await settle(page);
          const r = await row(page);
          const where = `${w}×${h} ${pct}% text, ${leaves} leaves → ${r.mode}`;
          expect(r.scrollWidth, where).toBeLessThanOrEqual(r.clientWidth);
          expect(r.innerWidth, where).toBe(w);
          expect(r.barRight, where).toBeLessThanOrEqual(w);
          if (r.tabBottom >= 0) expect(r.tabBottom, where).toBeLessThanOrEqual(h);
        }
        await ctx.close();
      }
    }
  });
}

test('normal text: one row at 390 (designed padding) and at 375 (tight) on a fresh load', async ({ browser, baseURL }) => {
  for (const [w, h, mode] of [
    [390, 844, 'normal'],
    [375, 667, 'tight'],
  ] as const) {
    const ctx = await browser.newContext({ ...phone, viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await open(page, base(baseURL));
    await settle(page);
    const r = await row(page);
    expect(r.mode).toBe(mode);
    expect(r.rows).toBe(1);
    noSidewaysScroll(r, w);
    await ctx.close();
  }
});
