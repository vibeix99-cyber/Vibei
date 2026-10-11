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

async function toSummary(page: Page, baseURL: string | undefined, seed: string, { text = 100, theme = 'light' } = {}) {
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
  await page.goto(`${base(baseURL)}/?debug&seed=${seed}&theme=${theme}#/`);
  await page.waitForFunction(() => {
    const t = (window as any).__kettle?.timerInfo?.();
    return !!(t && t.leader && t.leaderForMs > 400 && !t.settling);
  }, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => (window as any).__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(1200);
  await page.evaluate(() => (window as any).__kettle.finish());
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1, name: /minutes? brewed/ })).toBeVisible();
  await page.waitForTimeout(2500); // the entrance has settled
}

type Line = { kind: string; text: string; top: number; bottom: number; status: 'clear' | 'below' | 'above' | 'cut' };
type Fold = { F: number; fade: number; lines: Line[]; cut: Line[]; occluded: string[]; footerHit: boolean[]; chaiShown: number | null; highlights: number; facts: string[] };

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
      const status = r.bottom <= scR.top + 0.5 ? 'above' : r.top >= F - peek - 0.5 ? 'below' : r.bottom <= F - fade + 0.5 ? 'clear' : 'cut';
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
    const facts = lis.map(said);
    const highlights = (unlock ? 1 : 0) + region.querySelectorAll('[aria-label="Rewards"] > li[data-highlight]').length;
    const lines = units.map(({ el, left, right, ...u }) => u);
    return { F, fade, lines, cut: lines.filter((u) => u.status === 'cut'), occluded, footerHit, chaiShown, highlights, facts };
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
      expect(at.chaiShown ?? 0, 'Chai stays visible above the sheet').toBeGreaterThanOrEqual(0.5);
      expect(at.highlights).toBeLessThanOrEqual(1);
      // The arithmetic, opened by a click; then the wheel to the very end.
      await wheelToEnd(page);
      await page.getByRole('button', { name: /How your leaves added up/ }).click();
      await wheelToEnd(page);
      const end = await fold(page);
      const last = end.lines.filter((l) => l.status !== 'above').at(-1)!;
      expect(last.kind).toMatch(/^details/);
      expect(last.status, `final line ${JSON.stringify(last)} against the footer at ${end.F} (fade ${end.fade})`).toBe('clear');
      expect(end.cut.filter((l) => l.top >= end.F - 60)).toEqual([]);
      expect(end.occluded).toEqual([]);
      expect(end.footerHit).toEqual([true, true]);
      await ctx.close();
    });
  }
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
