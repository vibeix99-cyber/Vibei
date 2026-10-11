/**
 * Today's status bar (I04 F6 + integration fix r2): the three stats (warm days · leaves · level) stay on one row on
 * phones at normal text size, tighten before they wrap, wrap only when they genuinely can't fit, and never make Today
 * scroll sideways — including after a resize/rotation and at 200 % text with large leaf totals — nor leave a phone page
 * zoomed in after rapid live resizes at large text.
 *
 *   KETTLE_PORT=5222 npx playwright test tests/statusbar.spec.ts --project=chromium
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { open } from './a11y-probes.mjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => u ?? 'http://127.0.0.1:5183';
const phone = { deviceScaleFactor: 2, isMobile: true, hasTouch: true };
// Resizes here must follow each other as fast as a real window drag; tracing (a snapshot per action) spaces them out
// and hides the race the "rapid live resizes" test is for.
test.use({ trace: 'off' });

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
      // A fixed leaf total: the seed's own follows the date, and with some totals 375 fits the designed padding.
      await page.evaluate(() => (window as any).__kettle.progress.setState({ leaves: 2296 }));
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
    await page.evaluate(() => (window as any).__kettle.progress.setState({ leaves: 2296 }));
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

for (const theme of ['light', 'dark'] as const) {
  test(`narrowing that leaves the bar's own box unchanged still re-fits: from 384 px, and 1 px at a time (${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    // One step from just above the overflow point (the bar is already at its min-content width there).
    for (const [fromW, fromH, toW, toH] of [
      [384, 854, 375, 667],
      [380, 800, 375, 667],
      [384, 854, 360, 740],
    ] as const) {
      const ctx = await browser.newContext({ ...phone, viewport: { width: fromW, height: fromH }, colorScheme: theme });
      const page = await ctx.newPage();
      await open(page, base(baseURL), { theme });
      await page.evaluate(() => (window as any).__kettle.progress.setState({ leaves: 2296 }));
      await settle(page);
      await page.setViewportSize({ width: toW, height: toH });
      await settle(page);
      const r = await row(page);
      expect(r.mode, `${fromW}×${fromH} → ${toW}×${toH}`).toBe('tight');
      expect(r.rows).toBe(1);
      noSidewaysScroll(r, toW);
      expect(r.tabBottom, 'tab bar ends below the screen').toBeLessThanOrEqual(toH);
      await ctx.close();
    }
    // A phone-width window narrowed 1 px at a time, like a dragged divider.
    const ctx = await browser.newContext({ ...phone, viewport: { width: 414, height: 896 }, colorScheme: theme });
    const page = await ctx.newPage();
    await open(page, base(baseURL), { theme });
    await page.evaluate(() => (window as any).__kettle.progress.setState({ leaves: 2296 }));
    await settle(page);
    for (let w = 413; w >= 375; w--) {
      await page.setViewportSize({ width: w, height: 667 });
      await page.waitForTimeout(20);
    }
    await settle(page);
    const r = await row(page);
    expect(r.mode, '414 → 375 one px at a time').toBe('tight');
    noSidewaysScroll(r, 375);
    expect(r.tabBottom).toBeLessThanOrEqual(667);
    await ctx.close();
    // A desktop window narrowed 1 px at a time: no horizontal scrollbar.
    const dctx = await browser.newContext({ viewport: { width: 420, height: 800 }, colorScheme: theme });
    const dpage = await dctx.newPage();
    await open(dpage, base(baseURL), { theme });
    await dpage.evaluate(() => (window as any).__kettle.progress.setState({ leaves: 2296 }));
    await settle(dpage);
    for (let w = 419; w >= 375; w--) {
      await dpage.setViewportSize({ width: w, height: 800 });
      await dpage.waitForTimeout(16);
    }
    await settle(dpage);
    const d = await row(dpage);
    expect(d.scrollWidth, 'desktop window: horizontal scrollbar').toBeLessThanOrEqual(d.clientWidth);
    expect(d.barRight).toBeLessThanOrEqual(d.clientWidth);
    await dctx.close();
  });
}

for (const theme of ['light', 'dark'] as const) {
  // I04 R4-D2: the bar's measurement must never make the page wider than the screen, even for a moment. At large text the
  // unwrapped row is far wider than a phone; laid out during a live resize it widened the mobile layout viewport, and
  // Chromium's page scale settled on that width and left Today zoomed in until a pinch.
  test(`rapid live resizes at large text leave the page unzoomed (${theme})`, async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    const runs: Record<string, (page: Page) => Promise<void>> = {
      'zero-wait bounce': async (page) => {
        for (const w of [414, 375, 390, 375, 400, 375, 384, 375, 414, 375]) await page.setViewportSize({ width: w, height: 667 });
      },
      '414↔376 drag, 2 px / 16 ms': async (page) => {
        for (let w = 412; w >= 376; w -= 2) await page.setViewportSize({ width: w, height: 667 }).then(() => page.waitForTimeout(16));
        for (let w = 376; w <= 412; w += 2) await page.setViewportSize({ width: w, height: 667 }).then(() => page.waitForTimeout(16));
        await page.setViewportSize({ width: 375, height: 667 });
      },
      '414 → 375, 1 px, no wait': async (page) => {
        for (let w = 413; w >= 375; w--) await page.setViewportSize({ width: w, height: 667 });
      },
    };
    for (const pct of [200, 150]) {
      const ctx = await browser.newContext({ ...phone, viewport: { width: 414, height: 667 }, colorScheme: theme });
      await bigText(ctx, pct);
      const page = await ctx.newPage();
      await open(page, base(baseURL), { theme });
      await page.evaluate(() => (window as any).__kettle.progress.setState({ leaves: 2296 }));
      for (const [name, run] of Object.entries(runs)) {
        await page.setViewportSize({ width: 414, height: 667 });
        await settle(page);
        await run(page);
        await settle(page);
        const vv = await page.evaluate(() => ({ scale: visualViewport!.scale, width: Math.round(visualViewport!.width), innerWidth }));
        const where = `${pct} % text, ${name}`;
        expect(vv.scale, `${where}: page left zoomed in`).toBe(1);
        expect(vv.width, where).toBe(vv.innerWidth);
        noSidewaysScroll(await row(page), 375);
      }
      await ctx.close();
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
    // A fixed leaf total (the seed's own depends on the date; 9,999 legitimately fits `normal` at 375).
    await page.evaluate(() => (window as any).__kettle.progress.setState({ leaves: 2296 }));
    await settle(page);
    const r = await row(page);
    expect(r.mode).toBe(mode);
    expect(r.rows).toBe(1);
    noSidewaysScroll(r, w);
    await ctx.close();
  }
});
