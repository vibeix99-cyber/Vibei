// Lane D (round-7 review) deterministic captures: R7 and INT back to back in one browser, same fixed date/clock.
// Clock: page.clock.install({ time: FIXED }) then resume (same start instant on both sides); screenshots use
// animations:'disabled'. Each profile is a fresh browser context (disposable). Setup uses the debug API
// (seed, quota fill, startFocus, ff to an end) and the app's own toast() for the three Close-state toasts; scrolling
// of the break / Break's over panel is real mouse wheel; the summary's details are expanded and scrolled the way
// capture.mjs state 08 does (setup).
//
// node cap-d.mjs --cfgs "390x844@2:light:100,..." --root <captures root> --sides R7,INT
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED_ISO = '2026-10-10T16:40:00.000Z';
const FIXED = Date.parse(FIXED_ISO);
const SIDES = {
  R7: { base: 'http://127.0.0.1:5301', port: 5301, revision: 'b39202f (trial merge; kettle/src tree 6db18ad)' },
  INT: { base: 'http://127.0.0.1:5303', port: 5303, revision: '0d58c5e (integration app code; kettle/src tree 1fc4a1b)' },
};
const sides = (args.sides ?? 'R7,INT').split(',');
const root = args.root;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

for (const c of args.cfgs.split(',')) {
  const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
  const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
  const vp = `${W}x${H}@${DPR}`;
  const dirName = `${W}x${H}-${theme}-t${text}`;
  for (const side of sides) {
    const S = SIDES[side];
    const dir = `${root}/${side}/${dirName}`;
    mkdirSync(dir, { recursive: true });
    const meta = { side, url: `${S.base}/?debug&theme=${theme}#/`, port: S.port, revision: S.revision, viewport: { w: W, h: H }, dpr: DPR, theme, text: `${text}%`, textCss: text === 100 ? null : `html{font-size:${text}%!important} (init script at DOMContentLoaded)`, fixedTime: FIXED_ISO, clock: 'page.clock.install({time}) + resume', screenshot: "animations:'disabled', viewport-sized", isMobile: W < H && W < 900, hasTouch: W < 900, scene: 'off', startedAt: new Date().toISOString(), states: {}, errors: [] };

    async function profile(fill) {
      const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: W < H && W < 900, hasTouch: W < 900, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', acceptDownloads: true });
      if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
      await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
      const p = await ctx.newPage();
      await p.clock.install({ time: FIXED });
      await p.clock.resume();
      p.on('pageerror', (e) => meta.errors.push(e.message));
      const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 });
      await p.goto(meta.url); await ready();
      await p.evaluate(() => window.__kettle.seed('newbie'));
      await p.reload(); await ready();
      await p.evaluate(() => document.fonts.ready);
      await p.evaluate(() => window.__kettle.timer.setState({}));
      if (fill) await p.evaluate(() => { let c = 'x'.repeat(1 << 20), k = 0; while (c.length >= 8) { try { localStorage.setItem(`filler${k++}`, c); } catch { c = c.slice(0, c.length / 2); } } });
      return { ctx, p };
    }
    const info = (p) => p.evaluate(() => {
      const sec = document.querySelector('section[data-save-warning]');
      const r = sec?.getBoundingClientRect();
      const close = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Close');
      let closeHit = null;
      if (close) { const cr = close.getBoundingClientRect(); const hit = document.elementFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2); closeHit = { rect: [Math.round(cr.left), Math.round(cr.top), Math.round(cr.width), Math.round(cr.height)], hitTestable: !!hit && close.contains(hit) }; }
      const main = document.querySelector('[data-focus-view] main');
      return {
        hash: location.hash,
        clockNow: new Date(Date.now()).toISOString(),
        banner: sec ? { top: Math.round(r.top), bottom: Math.round(r.bottom), inView: r.top >= 0 && r.bottom <= innerHeight, partlyInView: r.bottom > 0 && r.top < innerHeight } : null,
        summaryNote: !!document.querySelector('p[data-save-warning]'),
        warningToast: !!document.getElementById('toast-kettle:save-failed'),
        toasts: [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => li.textContent.slice(0, 60)),
        close: closeHit,
        scroll: { doc: Math.round(document.scrollingElement.scrollTop), docMax: document.scrollingElement.scrollHeight - innerHeight, main: main ? Math.round(main.scrollTop) : null, mainMax: main ? main.scrollHeight - main.clientHeight : null },
      };
    });
    const shot = async (p, state, desc) => {
      const file = `${state}.png`;
      await p.screenshot({ path: `${dir}/${file}`, animations: 'disabled', timeout: 120_000 });
      meta.states[state] = { file, desc, url: p.url(), at: new Date().toISOString(), ...(await info(p)) };
    };
    // Real wheel over the panel (or the page) until nothing scrolls any further.
    const wheelToEnd = async (p) => {
      let still = 0, last = '';
      for (let i = 0; i < 60 && still < 3; i++) {
        const pt = await p.evaluate(() => {
          const m = document.querySelector('[data-focus-view] main') ?? document.body; const r = m.getBoundingClientRect();
          return { x: Math.round((r.left + r.right) / 2), y: Math.round((Math.max(0, r.top) + Math.min(innerHeight, r.bottom)) / 2), s: `${document.scrollingElement.scrollTop}|${[...document.querySelectorAll('main, [data-focus-view] *')].map((e) => e.scrollTop).join(',')}` };
        });
        if (pt.s === last) still++; else still = 0;
        last = pt.s;
        await p.mouse.move(pt.x, pt.y); await p.mouse.wheel(0, 160); await sleep(180);
      }
      await p.mouse.move(1, 1); await sleep(300);
    };
    const toasts3 = (p) => p.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); toast('Recipe done: Take 2 full tea breaks · +15 leaves', { tone: 'success' }); toast('Saved 12 minutes of focus', { tone: 'info' }); toast('Cozy level 5!', { tone: 'success' }); });
    const toEnd = (p) => p.evaluate(() => { const k = window.__kettle; const s = k.timer.getState(); k.ff(s.endsAt - k.clock.now() - 50); });
    const tap = async (p, loc) => (W < 900 ? loc.tap() : loc.click());

    // ---- Profile W: storage really full (quota filled), a brew completes: summary note, Today, Settings › Your data
    try {
      const { ctx, p } = await profile(true);
      await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
      await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1800);
      await shot(p, 'f2-focus-running-storage-full', 'focus running, storage full (warning raised by the brew start save)');
      await toEnd(p);
      await p.waitForFunction(() => location.hash === '#/done', null, { timeout: 20_000 }); await sleep(2600);
      await shot(p, 'c1-summary-note', 'summary after a brew completed with storage full (R7: one-line note)');
      await p.evaluate(() => document.querySelector('[data-focus-view] [aria-expanded]')?.click()); await sleep(400);
      await p.evaluate(() => { const s = document.querySelector('[data-focus-view] [class*=scroll]'); if (s) s.scrollTop = 99999; }); await sleep(600);
      await shot(p, 'c2-summary-end', 'summary, details expanded and scrolled to its end (setup scroll, as capture.mjs 08)');
      meta.states['c2-summary-end'].lastLine = await p.evaluate(() => {
        const sc = document.querySelector('[data-focus-view] [class*=scroll]'); const foot = document.querySelector('[data-focus-view] footer');
        if (!sc || !foot) return null;
        const items = [...sc.querySelectorAll('li, p, dd, dt')].filter((e) => e.getBoundingClientRect().height > 0);
        const last = items.length ? Math.max(...items.map((e) => e.getBoundingClientRect().bottom)) : null;
        return { lastLineBottom: last && Math.round(last), footerTop: Math.round(foot.getBoundingClientRect().top), clears: last != null && last <= foot.getBoundingClientRect().top + 0.5 };
      });
      await p.evaluate(() => { const s = document.querySelector('[data-focus-view] [class*=scroll]'); if (s) s.scrollTop = 0; }); await sleep(300);
      await tap(p, p.getByRole('button', { name: 'Skip break' }));
      await p.waitForFunction(() => location.hash === '#/', null, { timeout: 15_000 }); await sleep(1400);
      await p.evaluate(() => scrollTo(0, 0)); await sleep(300);
      await shot(p, 'a1-today-warning', 'Today after Skip break, storage still full (R7: banner; INT: warning toast if shown)');
      await p.evaluate(() => window.__kettle.navigate('/settings')); await sleep(1600);
      await p.evaluate(() => { const h = [...document.querySelectorAll('h2, h3')].find((e) => e.textContent?.trim() === 'Your data'); h?.scrollIntoView({ block: 'start' }); scrollBy(0, -12); });
      await sleep(500);
      await shot(p, 'b1-settings-your-data', 'Settings › Your data, storage still full (setup scroll to the heading)');
      await ctx.close();
    } catch (e) { meta.errors.push(`W: ${String(e.message).split('\n')[0]}`); }

    // ---- Profile N: storage normal: focus running, break, Break's over (200 %: top and bottom), Close + 3 toasts
    try {
      const { ctx, p } = await profile(false);
      await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
      await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1800);
      await shot(p, 'f1-focus-running', 'focus running (normal storage)');
      await toEnd(p);
      await p.waitForFunction(() => location.hash === '#/done', null, { timeout: 20_000 }); await sleep(2600);
      await tap(p, p.getByRole('button', { name: /^Tea time|^Long tea break/ }));
      await p.waitForFunction(() => location.hash === '#/focus' && window.__kettle.timer.getState().phase !== 'focus'); await sleep(1800);
      if (text === 200) {
        await shot(p, 'd1-break-top', 'tea break running, top');
        await wheelToEnd(p);
        await shot(p, 'd2-break-bottom', 'tea break running, scrolled to the bottom (real wheel)');
      }
      await toEnd(p);
      await p.waitForFunction(() => window.__kettle.timer.getState().status === 'idle', null, { timeout: 20_000 }); await sleep(1800);
      if (text === 200) {
        await shot(p, 'd3-breakover-top', 'Break’s over, top');
        await wheelToEnd(p);
        await shot(p, 'd4-breakover-bottom', 'Break’s over, scrolled to the bottom (real wheel)');
      } else await wheelToEnd(p);
      await toasts3(p); await sleep(1000);
      await shot(p, 'e1-breakover-end-3toasts', 'Break’s over scrolled to its end (real wheel), three toasts raised via the app toast() (setup): the Close state');
      await ctx.close();
    } catch (e) { meta.errors.push(`N: ${String(e.message).split('\n')[0]}`); }

    meta.endedAt = new Date().toISOString();
    writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({ side, dirName, shots: Object.keys(meta.states).length, errors: meta.errors }));
  }
}
await b.close();
