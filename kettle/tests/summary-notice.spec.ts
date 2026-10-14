/**
 * I10 fix round (W2R3 T2-D1; Vibei's direction): the summary has no notice strip, so a notice never moves P's summary
 * sheet; the update prompt is not raised anywhere on the session screen; notices queued meanwhile are never dropped —
 * they appear, one at a time and in order, on the screen the person goes to next (here Today, by a real tap on "Skip
 * break"), and each is announced exactly once (when it is raised, never again when it is shown).
 *
 * Per configuration: a no-notice run and a run with three notices queued on the summary (the update prompt raised with
 * the summary's first frame, a recipe notice and "Saved …" after arrival), each from a fresh profile, so P's content
 * and fold are the same. The sheet's top and bottom and the footer's top must match within 1 px, nothing may be drawn
 * on the summary, the rows cut by the footer must be the same as with no notice, and the stage art must be untouched.
 *
 *   KETTLE_PORT=5471 npx playwright test tests/summary-notice.spec.ts --project=chromium --workers=2
 */
import { test, expect, type Browser, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const base = (u: string | undefined) => (u ?? 'http://127.0.0.1:5183').replace(/\/$/, '');
test.use({ trace: 'off' });
test.describe.configure({ mode: 'parallel' });

const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const UPDATE = 'A fresh brew of Kettle is ready.';
const RECIPE = 'Recipe done: Take 2 full tea breaks · +15 leaves';
const SAVED = 'Saved kettle-backup-2026-10-12.json. Keep it somewhere safe.';

async function summary(browser: Browser, url: string, c: { w: number; h: number; theme: string; pct: number }, seed: string, notices: boolean) {
  const phone = c.w < 900;
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone && c.w < c.h, hasTouch: phone, colorScheme: c.theme as 'light' | 'dark' });
  await ctx.addInitScript((pct) => {
    try {
      localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
    } catch {
      /* ignore */
    }
    if (pct !== 100)
      addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = `html{font-size:${pct}%!important}`;
        document.head.appendChild(s);
      });
  }, c.pct);
  const page = await ctx.newPage();
  await page.clock.install({ time: MONDAY });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=${seed}&theme=${c.theme}#/`);
  await page.waitForFunction(() => {
    const i = (window as any).__kettle?.timerInfo?.();
    return !!(i && i.leader && i.leaderForMs > 400 && !i.settling);
  }, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(1500);
  // Every frame from here: was any notice drawn while the summary is up?
  await page.evaluate(() => {
    const w = window as any;
    w.__drawnOnSummary = 0;
    const f = () => {
      if (location.hash.includes('done') && document.querySelector('[data-notice-strip] li')) w.__drawnOnSummary++;
      if (!w.__stopSummaryWatch) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  if (notices)
    // The update prompt as an update pending at the brew's end would raise it (same task as the finish).
    await page.evaluate((m) => {
      const k = (window as any).__kettle;
      // (Its own id: the app's PwaUpdatePrompt withdraws 'pwa-update' whenever it has no update of its own, as in dev.)
      k.toast(m, { id: 'queued-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => ((window as any).__upd = 1) } });
      k.finish();
    }, UPDATE);
  else await page.evaluate(() => (window as any).__kettle.finish());
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
  await page.waitForTimeout(2600);
  if (notices) {
    await page.evaluate(([r, s]) => {
      const k = (window as any).__kettle;
      k.toast(r, { tone: 'success' });
      k.toast(s, { tone: 'success' });
    }, [RECIPE, SAVED]);
  }
  await page.waitForTimeout(1600);
  const geom = await page.evaluate(() => {
    const region = document.querySelector('[data-focus-view] [role=region]')!;
    const footer = region.querySelector('footer')!.getBoundingClientRect();
    const sheet = region.firstElementChild!.firstElementChild!.getBoundingClientRect();
    const cut = [...region.querySelectorAll('h1, h2, p, li, button, [role=button]')]
      .filter((e) => !e.closest('footer') && e.getBoundingClientRect().height > 0)
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.top < footer.top - 2 && r.bottom > footer.top + 2;
      })
      .map((e) => `${e.tagName.toLowerCase()}@${Math.round(e.getBoundingClientRect().top)}`);
    const art = [...document.querySelectorAll('[data-focus-view] img, [data-focus-view] canvas')].map((e) => {
      const r = e.getBoundingClientRect();
      return [r.left, r.top, r.width, r.height].map(Math.round).join(',');
    });
    return { sheetTop: sheet.top, sheetBottom: sheet.bottom, footerTop: footer.top, cut, art, drawn: (window as any).__drawnOnSummary };
  });
  return { ctx, page, geom };
}

const CFGS = [
  { w: 375, h: 667, theme: 'light', pct: 100 },
  { w: 375, h: 667, theme: 'dark', pct: 200 },
  { w: 390, h: 844, theme: 'dark', pct: 100 },
  { w: 390, h: 844, theme: 'light', pct: 200 },
  { w: 844, h: 390, theme: 'light', pct: 100 },
  { w: 667, h: 375, theme: 'dark', pct: 100 },
  { w: 1440, h: 900, theme: 'light', pct: 100 },
];

for (const c of CFGS)
  for (const seed of ['newbie', 'celebrate'])
    test(`queued notices never move the summary, then appear on Today in order, each said once (${c.w}×${c.h} ${c.theme} ${c.pct} %, ${seed === 'celebrate' ? 'big day' : 'task day'})`, async ({ browser, baseURL }) => {
      test.setTimeout(150_000);
      const url = base(baseURL);
      const plain = await summary(browser, url, c, seed, false);
      await plain.ctx.close();
      const { ctx, page, geom } = await summary(browser, url, c, seed, true);
      // The summary: exactly as without a notice.
      expect(geom.drawn, 'frames with a notice drawn on the summary').toBe(0);
      expect(Math.abs(geom.sheetTop - plain.geom.sheetTop), `sheet top ${geom.sheetTop} vs ${plain.geom.sheetTop}`).toBeLessThanOrEqual(1);
      expect(Math.abs(geom.sheetBottom - plain.geom.sheetBottom), `sheet bottom ${geom.sheetBottom} vs ${plain.geom.sheetBottom}`).toBeLessThanOrEqual(1);
      expect(Math.abs(geom.footerTop - plain.geom.footerTop), 'footer top').toBeLessThanOrEqual(1);
      expect(geom.cut, 'rows cut by the footer: as with no notice').toEqual(plain.geom.cut);
      expect(geom.art, 'the stage art (Chai, the kettle) where it is with no notice').toEqual(plain.geom.art);
      // All three queued, none spent, none dropped.
      const st = await page.evaluate(() => (window as any).__kettle.notices());
      expect(st.queue.map((q: any) => q.message), 'queued, none dropped').toEqual([UPDATE, RECIPE, SAVED]);
      // The person goes to Today by a real tap: the notices come one at a time, in order (timed ones in arrival order,
      // then the update prompt, which never blocks the others), each whole, the prompt's Update on top.
      const skip = page.getByRole('button', { name: 'Skip break' });
      const b = (await skip.boundingBox())!;
      if (c.w < 900) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
      await page.mouse.move(1, c.h - 1);
      const seen: string[] = [];
      for (let i = 0; i < 120 && seen.length < 3; i++) {
        const now = await page.evaluate(() => {
          const li = document.querySelector('[data-notice-strip] li') as HTMLElement | null;
          if (!li) return null;
          const r = li.getBoundingClientRect();
          return { text: li.querySelector('[class*="message"]')?.textContent ?? '', whole: li.scrollHeight <= li.clientHeight + 1 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5 };
        });
        if (now && seen[seen.length - 1] !== now.text) {
          expect(now.whole, `${now.text} whole and in view`).toBe(true);
          seen.push(now.text);
        }
        await page.waitForTimeout(250);
      }
      expect(seen, 'shown on Today, in order').toEqual([RECIPE, SAVED, UPDATE]);
      const upd = page.locator('[data-notice-strip] li button', { hasText: 'Update' });
      const ub = (await upd.boundingBox())!;
      const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-notice-strip] li button'), [ub.x + ub.width / 2, ub.y + ub.height / 2]);
      expect(hit, 'Update on top').toBe(true);
      if (c.w < 900) await page.touchscreen.tap(ub.x + ub.width / 2, ub.y + ub.height / 2);
      else await page.mouse.click(ub.x + ub.width / 2, ub.y + ub.height / 2);
      expect(await page.evaluate(() => (window as any).__upd), 'Update reached').toBe(1);
      // Each said exactly once (on arrival; showing it later said nothing more).
      const said = await page.evaluate(() => [...(window as any).__kettle.noticesSaid().children].map((p: Element) => p.textContent));
      for (const m of [`${UPDATE} Update`, RECIPE, SAVED]) expect(said.filter((s: string) => s === m), `"${m}" said once`).toHaveLength(1);
      await ctx.close();
    });
