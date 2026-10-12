/**
 * The one summary, ranked (Wave 2 · I07 + Wave-1 follow-up #1). Real app, debug seeds, real input.
 *
 *   KETTLE_PORT=5211 npx playwright test tests/w2-summary.spec.ts --project=chromium
 *
 * - Wave-1 #1: on arrival at 375×667 no reward row starts half under the Tea time / Skip footer (each line is either
 *   wholly clear of the scroll area's bottom fade or wholly below the fold), and the final expanded line clears the
 *   footer, at 100 % and 200 % text.
 * - Ranking: minutes and Tea time stay primary; at most one milestone is highlighted (a room unlock is shown by its
 *   close-up card, otherwise the biggest milestone leads the rewards list), seen whole on arrival; every other reward
 *   stays on the summary, compact.
 * - W2R2 polish: on arrival Chai's and the kettle's boxes are wholly above the sheet's top edge (375×667, 390×844;
 *   routine, big and task day; 100 % and 200 %); the highlight is quieter than the minutes and Tea time; the summary
 *   speaks of warm days, never of a "streak" (only a badge's catalogue name, "Warm Streak", is data).
 * The debug API is used for setup only (seed, settings, finishing the brew); scrolling is the wheel, opening the
 * arithmetic is a click.
 */
import { test, expect, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => u ?? 'http://127.0.0.1:5183';
const FIXED = Date.parse('2026-10-11T07:40:00Z');
/** A box may show at most this much of its top edge in the fade before the fold (no text sits that high); text lines
 *  count by their ink, which may not show at all. */
const PEEK = 6;

async function toSummary(page: Page, baseURL: string | undefined, seed: string, { text = 100, theme = 'light', task = '', motion = '' } = {}) {
  if (text !== 100)
    await page.addInitScript((pct) => {
      addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = `html{font-size:${pct}%!important}`;
        document.head.appendChild(s);
      });
    }, text);
  await page.clock.install({ time: FIXED });
  await page.clock.resume();
  await page.goto(`${base(baseURL)}/?debug&seed=${seed}&theme=${theme}${motion ? `&motion=${motion}` : ''}#/`);
  await page.waitForFunction(() => {
    const t = (window as any).__kettle?.timerInfo?.();
    return !!(t && t.leader && t.leaderForMs > 400 && !t.settling);
  }, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => (window as any).__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(900);
  if (task) {
    await page.getByPlaceholder(/Chapter 3 notes/).click();
    await page.keyboard.type(task, { delay: 15 });
  }
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(1200);
  await page.evaluate(() => (window as any).__kettle.finish());
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1, name: /minutes? brewed/ })).toBeVisible();
  await page.waitForTimeout(2500); // the entrance has settled
}

type Line = { kind: string; text: string; top: number; bottom: number; status: 'clear' | 'below' | 'above' | 'cut-top' | 'cut' };
type Fold = {
  F: number;
  fade: number;
  lines: Line[];
  cut: Line[];
  occluded: string[];
  footerHit: boolean[];
  chaiShown: number | null;
  /** Stacked: the sheet's top minus the bottom of Chai's / the kettle's box (≥ 0: wholly above the sheet). */
  clear: { chai: number; kettle: number } | null;
  highlights: number;
  facts: string[];
};

/** Every line of the summary against the fold: the scroll area's bottom (= the footer's top) and its bottom fade. */
function fold(page: Page): Promise<Fold> {
  return page.evaluate((PEEK) => {
    const region = document.querySelector('[data-focus-view] [role=region]')!;
    const sc = region.firstElementChild as HTMLElement;
    const sheet = sc.firstElementChild as HTMLElement;
    const footer = region.querySelector('footer')!;
    const cs = getComputedStyle(sc);
    const mask = cs.maskImage || (cs as any).webkitMaskImage || '';
    const fade = +((/100% - (\d+(?:\.\d+)?)px/.exec(mask) || [])[1] ?? 0);
    const scR = sc.getBoundingClientRect();
    const F = Math.min(footer.getBoundingClientRect().top, scR.bottom);
    const norm = (t: string | null) => (t || '').replace(/\s+/g, ' ').trim();
    const said = (el: Element) => {
      const c = el.cloneNode(true) as Element;
      c.querySelectorAll('.sr-only, svg').forEach((n) => n.remove());
      return norm(c.textContent);
    };
    // A text line counts by its ink: the line box is the font's ascent + descent, the glyphs sit inside it.
    const cv = document.createElement('canvas').getContext('2d')!;
    const ink = (el: Element) => {
      const t = (el.textContent || '').trim();
      const c = getComputedStyle(el);
      cv.font = `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
      const m = cv.measureText(t);
      return t ? { top: Math.max(0, m.fontBoundingBoxAscent - m.actualBoundingBoxAscent), bottom: Math.max(0, m.fontBoundingBoxDescent - m.actualBoundingBoxDescent) } : { top: 0, bottom: 0 };
    };
    const linesOf = (el: Element) => {
      const k = ink(el);
      const r = document.createRange();
      r.selectNodeContents(el);
      const out: { top: number; bottom: number; left: number; right: number }[] = [];
      for (const x of [...r.getClientRects()].filter((q) => q.width > 0.5 && q.height > 0.5).sort((a, b) => a.top - b.top)) {
        const last = out.at(-1);
        if (last && x.top < last.bottom - Math.min(x.height, last.bottom - last.top) / 2) {
          last.top = Math.min(last.top, x.top);
          last.bottom = Math.max(last.bottom, x.bottom);
        } else out.push({ top: x.top, bottom: x.bottom, left: x.left, right: x.right });
      }
      return out.map((L) => ({ ...L, top: L.top + k.top, bottom: L.bottom - k.bottom, ink: true }));
    };
    const units: (Line & { el: Element; left: number; right: number })[] = [];
    const add = (kind: string, el: Element | null | undefined, R?: { top: number; bottom: number; left: number; right: number; ink?: boolean }) => {
      if (!el) return;
      const r = R ?? el.getBoundingClientRect();
      if (r.bottom - r.top < 1) return;
      const peek = R?.ink ? 0 : PEEK;
      // Scrolled partly above the top edge ('cut-top') is ordinary scrolling, not the fold.
      const status = r.bottom <= scR.top + 0.5 ? 'above' : r.top < scR.top - 0.5 ? 'cut-top' : r.top >= F - peek - 0.5 ? 'below' : r.bottom <= F - fade + 0.5 ? 'clear' : 'cut';
      units.push({ kind, el, text: said(el).slice(0, 60), top: r.top, bottom: r.bottom, left: r.left, right: r.right, status });
    };
    const h1 = region.querySelector('h1');
    const sub = h1?.parentElement?.querySelector('p');
    if (h1) linesOf(h1).forEach((L, i) => add(`title${i}`, h1, L));
    if (sub) linesOf(sub).forEach((L, i) => add(`sub${i}`, sub, L));
    const task = region.querySelector('section[aria-label="Your task"]');
    add('task', task?.querySelector('p'));
    add('task-choices', task?.querySelector('[role=group]'));
    const unlock = [...region.querySelectorAll('section')].find((x) => /in your nook/.test(x.getAttribute('aria-label') || ''));
    if (unlock) {
      add('unlock-media', unlock.firstElementChild);
      const h2 = unlock.querySelector('h2');
      if (h2) linesOf(h2).forEach((L, i) => add(`unlock-title${i}`, h2, L));
      const up = unlock.querySelector('h2 + p');
      if (up) linesOf(up).forEach((L, i) => add(`unlock-sub${i}`, up, L));
    }
    const lis = [...region.querySelectorAll('[aria-label="Rewards"] > li')];
    lis.forEach((li, i) => add(`reward${i}`, li));
    const toggle = [...region.querySelectorAll('button')].find((x) => /How your leaves added up/.test(x.textContent || ''));
    add('details', toggle);
    const body = toggle && document.getElementById(toggle.getAttribute('aria-controls') || '');
    if (body && !body.hidden) [...body.querySelectorAll('li'), ...[...body.children].filter((x) => x.tagName !== 'UL')].forEach((x, i) => add(`details${i}`, x));
    const occluded: string[] = [];
    for (const u of units) {
      if (u.status !== 'clear') continue;
      const hit = document.elementFromPoint((u.left + u.right) / 2, (u.top + u.bottom) / 2);
      if (!hit || !(u.el === hit || u.el.contains(hit) || hit.contains(u.el))) occluded.push(`${u.kind} ← ${hit?.tagName ?? 'nothing'}`);
    }
    const footerHit = [...footer.querySelectorAll('button')].map((x) => {
      const r = x.getBoundingClientRect();
      const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
      return !!hit && x.contains(hit) && r.bottom <= innerHeight + 0.5;
    });
    const chai = document.querySelector('[data-focus-view] [data-pose]');
    const cR = chai?.getBoundingClientRect();
    const sR = sheet.getBoundingClientRect();
    const beside = cR ? sR.left >= cR.right || sR.right <= cR.left : false;
    const chaiShown = cR ? Math.max(0, (beside ? cR.bottom : Math.min(cR.bottom, sR.top)) - Math.max(0, cR.top)) / cR.height : null;
    const kettle = document.querySelector('[data-focus-view] svg[role=img][data-state]');
    const kR = kettle?.getBoundingClientRect();
    const clear = cR && kR && !beside ? { chai: sR.top - cR.bottom, kettle: sR.top - kR.bottom } : null;
    const facts = lis.map(said);
    const highlights = (unlock ? 1 : 0) + region.querySelectorAll('[aria-label="Rewards"] > li[data-highlight]').length;
    const lines = units.map(({ el, left, right, ...u }) => u);
    return { F, fade, lines, cut: lines.filter((u) => u.status === 'cut'), occluded, footerHit, chaiShown, clear, highlights, facts };
  }, PEEK);
}

/** The wheel over the summary until it stops moving. */
async function wheelToEnd(page: Page) {
  const box = await page.locator('[data-focus-view] [role=region] > div').first().boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + Math.max(30, box!.height * 0.7));
  let last = -1;
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(80);
    const now = await page.locator('[data-focus-view] [role=region] > div').first().evaluate((el) => el.scrollTop);
    if (now === last) break;
    last = now;
  }
  await page.waitForTimeout(300);
}

for (const text of [100, 200]) {
  for (const [day, seed] of [
    ['routine day', 'veteran'],
    ['big day', 'celebrate'],
  ] as const) {
    test(`375×667 @${text} %, ${day}: no line starts under the footer on arrival; the final line clears it; nothing covers anything`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
      const page = await ctx.newPage();
      await toSummary(page, baseURL, seed, { text });
      const at = await fold(page);
      expect(at.cut, `lines cut by the fold on arrival: ${JSON.stringify(at.cut)}`).toEqual([]);
      expect(at.occluded).toEqual([]);
      expect(at.footerHit).toEqual([true, true]);
      expect(at.clear, 'stacked: Chai and the kettle measured').not.toBeNull();
      expect(at.clear!.chai, 'Chai wholly above the sheet').toBeGreaterThanOrEqual(0);
      expect(at.clear!.kettle, 'the kettle wholly above the sheet').toBeGreaterThanOrEqual(0);
      expect(at.highlights).toBeLessThanOrEqual(1);
      // The arithmetic, opened by a click; then the wheel to the very end.
      await wheelToEnd(page);
      await page.getByRole('button', { name: /How your leaves added up/ }).click();
      await wheelToEnd(page);
      const end = await fold(page);
      const last = end.lines.filter((l) => l.status !== 'above').at(-1)!;
      expect(last.kind).toMatch(/^details/);
      expect(last.bottom, `final line ${JSON.stringify(last)} against the footer at ${end.F} (fade ${end.fade})`).toBeLessThanOrEqual(end.F - end.fade + 0.5);
      expect(['clear', 'cut-top']).toContain(last.status);
      expect(end.cut.filter((l) => l.top >= end.F - 60)).toEqual([]);
      expect(end.occluded).toEqual([]);
      expect(end.footerHit).toEqual([true, true]);
      await ctx.close();
    });
  }
}

for (const motion of ['', 'reduce']) {
  test(`375×667 @100 %, a brew with a task (the K02 layout, Wave-1 #1 exactly)${motion ? ', reduced motion' : ''}: the third pill row does not start under the footer`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
    const page = await ctx.newPage();
    await toSummary(page, baseURL, 'veteran', { task: 'Chapter 3 notes', motion });
    const at = await fold(page);
    expect(at.facts).toEqual(['+40 leaves', 'Goal met · 75/60 min', '23 days warm', 'Recipes 1/3', '144 leaves to level 13']);
    expect(at.cut, `lines cut by the fold on arrival: ${JSON.stringify(at.cut)}`).toEqual([]);
    expect(at.occluded).toEqual([]);
    expect(at.footerHit).toEqual([true, true]);
    expect(at.clear!.chai).toBeGreaterThanOrEqual(0);
    expect(at.clear!.kettle).toBeGreaterThanOrEqual(0);
    await ctx.close();
  });
}

test('big day: the unlock is the one highlight, whole on arrival; all seven rewards stay on the summary', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await toSummary(page, baseURL, 'celebrate');
  const at = await fold(page);
  expect(at.highlights).toBe(1);
  for (const l of at.lines.filter((x) => x.kind.startsWith('unlock'))) expect(l.status, l.kind).toBe('clear');
  expect(at.cut).toEqual([]);
  const facts = at.facts.join(' | ');
  for (const f of ['+68 leaves', 'Goal met · 37/30 min', '7 days warm, your best yet', 'Tea Cozy earned', '2 recipes done', 'Badge: Warm Streak II', 'Badge: Weekend Warmth'])
    expect(facts).toContain(f);
  await ctx.close();
});

test('a milestone day without an unlock: the biggest milestone leads, highlighted and whole on arrival; the rest stay compact', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await toSummary(page, baseURL, 'atRisk');
  const hl = page.locator('[aria-label="Rewards"] > li[data-highlight]');
  await expect(hl).toHaveCount(1);
  const at = await fold(page);
  expect(at.highlights).toBe(1);
  const first = at.lines.find((l) => l.kind === 'reward0')!;
  expect(first.status).toBe('clear');
  expect(at.cut).toEqual([]);
  // Everything the summary said before is still there: leaves and the goal lead the compact group.
  expect(at.facts.slice(1).join(' | ')).toMatch(/leaves/);
  await ctx.close();
});

// ---------- W2R2: Chai and the kettle stay whole above the sheet; the fold still falls between lines ----------
for (const [w, h] of [
  [390, 844],
  [375, 667],
] as const)
  for (const text of [100, 200])
    for (const [day, seed, task] of [
      ['routine day', 'veteran', ''],
      ['big day', 'celebrate', ''],
      ['task day', 'newbie', 'Chapter 3 notes'],
    ] as const) {
      if (w === 375 && !task) continue; // 375 × routine / big day: the fold tests above check the same
      test(`${w}×${h} @${text} %, ${day}: Chai and the kettle are wholly above the sheet on arrival; the minutes are whole; no line is cut`, async ({ browser, baseURL }) => {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, colorScheme: text === 200 ? 'dark' : 'light' });
        const page = await ctx.newPage();
        await toSummary(page, baseURL, seed, { text, task, theme: text === 200 ? 'dark' : 'light' });
        const at = await fold(page);
        expect(at.clear, 'stacked: Chai and the kettle measured').not.toBeNull();
        expect(at.clear!.chai, 'Chai wholly above the sheet').toBeGreaterThanOrEqual(0);
        expect(at.clear!.kettle, 'the kettle wholly above the sheet').toBeGreaterThanOrEqual(0);
        expect(at.cut, `lines cut by the fold on arrival: ${JSON.stringify(at.cut)}`).toEqual([]);
        for (const l of at.lines.filter((x) => x.kind.startsWith('title'))) expect(l.status, `the minutes heading (${l.kind})`).toBe('clear');
        expect(at.footerHit).toEqual([true, true]);
        expect(at.highlights).toBeLessThanOrEqual(1);
        await ctx.close();
      });
    }

test('the highlight is quieter than the minutes and Tea time (milestone day, 375×667)', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await toSummary(page, baseURL, 'atRisk');
  const m = await page.evaluate(() => {
    const region = document.querySelector('[data-focus-view] [role=region]')!;
    const h1 = region.querySelector('h1')!;
    const cta = region.querySelector('[data-done-cta]')!;
    const hl = region.querySelector('[aria-label="Rewards"] > li[data-highlight]')!;
    const title = hl.querySelector('[class*="highlightTitle"]')!;
    const area = (e: Element) => e.getBoundingClientRect().width * e.getBoundingClientRect().height;
    const f = (e: Element) => getComputedStyle(e);
    return {
      heading: { px: parseFloat(f(h1).fontSize), weight: +f(h1).fontWeight },
      title: { px: parseFloat(f(title).fontSize), weight: +f(title).fontWeight },
      ctaArea: area(cta),
      // the Button paints its fill on its face (its first child), not on the <button>
      ctaFilled: f(cta.firstElementChild ?? cta).backgroundColor !== 'rgba(0, 0, 0, 0)' && f(cta.firstElementChild ?? cta).backgroundColor !== f(region.querySelector('footer')!).backgroundColor,
      hlArea: area(hl),
    };
  });
  expect(m.title.px).toBeLessThan(m.heading.px);
  expect(m.title.weight).toBeLessThanOrEqual(m.heading.weight);
  expect(m.ctaFilled).toBe(true);
  expect(m.hlArea, 'the highlight card is smaller than Tea time').toBeLessThan(m.ctaArea);
  await ctx.close();
});

test('warm days, never "streak": what the big day summary shows and what a screen reader hears', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await toSummary(page, baseURL, 'celebrate');
  await page.getByRole('button', { name: /How your leaves added up/ }).click();
  await page.waitForTimeout(800); // the announcement is set 600 ms after arrival
  const words = await page.evaluate(() => {
    const region = document.querySelector('[data-focus-view] [role=region]')!;
    const reachable = [...region.querySelectorAll('[aria-label]')].filter((e) => !e.closest('[aria-hidden="true"]')).map((e) => e.getAttribute('aria-label'));
    return [region.textContent ?? '', ...reachable].join(' | ');
  });
  // A badge's catalogue name is data (Stats › Badges uses the same name): everything else is the summary's own words.
  const own = words.replace(/Warm Streak/g, '');
  expect(own, own).not.toMatch(/streak/i);
  expect(words).toContain('7 days warm, your best yet');
  expect(words).toContain('7 days warm. One full brew a day keeps the kettle warm.');
  expect(words).toContain('7 days warm.');
  await ctx.close();
});
