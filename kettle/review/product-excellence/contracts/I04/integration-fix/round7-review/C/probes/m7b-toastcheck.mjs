// M7b toast check at 200 % text: with the session panel at its top and scrolled (real wheel) to the bottom controls,
// raise 1 and 3 toasts (the app's own toast(), real timers) and check every control that is on screen stays clear
// (hit-tested at its centre; its box against every toast box clipped by the list's scrollport). Round 6's D4: toasts
// float above the break controls and the whole break-over action group. The top bar's controls (Ambience, Mute, Close)
// are checked too: round 6's room runs from the top safe edge down to the lift, so a stack may reach them.
//   node toastcheck.mjs <base> <rev> <outdir> <WxH> <theme>
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, appendFileSync } from 'node:fs';

const [base, rev, out, cfg, theme] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const [W, H] = cfg.split('x').map(Number);
const phone = W < 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

const CHECK = (names) => {
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const ol = document.querySelector('[aria-label="Notifications"] ol');
  let clip = null;
  if (ol && getComputedStyle(ol).overflowY !== 'visible') { const q = ol.getBoundingClientRect(); clip = { l: q.left, t: q.top, r: q.right, b: q.bottom }; }
  const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
    let r = li.getBoundingClientRect();
    r = { l: r.left, t: r.top, r: r.right, b: r.bottom };
    if (clip) r = { l: Math.max(r.l, clip.l), t: Math.max(r.t, clip.t), r: Math.min(r.r, clip.r), b: Math.min(r.b, clip.b) };
    return r.r > r.l && r.b > r.t ? r : null;
  }).filter(Boolean);
  const panel = document.querySelector('[data-focus-view] main').getBoundingClientRect();
  return {
    toasts: toasts.length,
    rows: names.map((n) => {
      const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => new RegExp(n).test(norm(b.getAttribute('aria-label') || b.textContent || '')));
      if (!el) return `${n}: missing`;
      const q = el.getBoundingClientRect();
      const inPanel = !!el.closest('[data-focus-view] main');
      const top = inPanel ? Math.max(q.top, panel.top) : Math.max(q.top, 0), bottom = inPanel ? Math.min(q.bottom, panel.bottom, innerHeight) : Math.min(q.bottom, innerHeight);
      if (bottom - top < 8) return `${n}: off screen`;
      const cy = (top + bottom) / 2, cx = q.left + q.width / 2;
      const hit = document.elementFromPoint(cx, cy);
      const under = toasts.some((t) => t.b > top + 1 && t.t < bottom - 1 && t.r > q.left + 1 && t.l < q.right - 1);
      return hit && el.contains(hit) && !under ? `${n}: clear` : `${n}: COVERED`;
    }),
  };
};
const RAISE = async (n) => {
  const { toast } = await import('/src/ui/Toast.tsx');
  const items = [['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['Saved 12 minutes of focus', 'info'], ['Cozy level 5!', 'success']].slice(-n);
  for (const [m, tone] of items) toast(m, { tone, duration: 8000 });
};
const DISMISS = async () => (await import('/src/ui/Toast.tsx')).toast.dismiss();

const rows = [];
for (const state of ['paused', 'over-carried']) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme });
  await ctx.addInitScript(() => {
    try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); });
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`${base}/?debug&seed=newbie&theme=${theme}#/`);
    await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
    await sleep(1200);
    await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await sleep(2000);
    await page.evaluate(() => window.__kettle.nearEnd()); await sleep(400); await page.evaluate(() => window.__kettle.finish());
    const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
    await tea.waitFor({ state: 'visible', timeout: 60_000 });
    await sleep(2400);
    const b = await tea.boundingBox();
    if (phone) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
    await sleep(1500);
    if (state === 'paused') await page.evaluate(() => window.__kettle.timer.getState().pause());
    else { await page.evaluate(() => window.__kettle.finish()); await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached' }); }
    await sleep(4000);
    await page.evaluate(DISMISS); await sleep(600);
    const names = state === 'paused' ? ['^Skip break$', '^Resume break$', '^Start next brew$', '^Ambience:', '^(Mute sounds|Turn sound on)$'] : ['^Mark it done', '^Put the kettle on', "^That's all for now$", '^Close$'];
    for (const where of ['top', 'bottom']) {
      if (where === 'bottom') {
        const aim = await page.evaluate(() => { const r = document.querySelector('[data-focus-view] main').getBoundingClientRect(); return { x: Math.round((r.left + r.right) / 2), y: Math.round((Math.max(0, r.top) + Math.min(innerHeight, r.bottom)) / 2) }; });
        for (let i = 0; i < 8; i++) { await page.mouse.move(aim.x, aim.y); await page.mouse.wheel(0, 120); await sleep(220); }
      }
      for (const n of [1, 3]) {
        await page.evaluate(RAISE, n);
        await sleep(1500); // past the 600 ms the lift may take to re-measure
        const r = await page.evaluate(CHECK, names);
        const scroll = await page.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); return `${Math.round(m.scrollTop)}/${m.scrollHeight - m.clientHeight}`; });
        await page.screenshot({ path: `${out}/${rev}-${cfg}-${theme}-${state}-${where}-n${n}.png` });
        const row = { rev, cfg, theme, state, where, n, scroll, ...r };
        rows.push(row);
        console.log(`${rev} ${cfg} ${theme} ${state} ${where} (panel ${scroll}) toasts ${r.toasts}/${n}: ${r.rows.join(' | ')}`);
        await page.evaluate(DISMISS); await sleep(700);
      }
    }
  } catch (e) { console.log(`${rev} ${cfg} ${theme} ${state} ERROR ${String(e.message).split('\n')[0]}`); }
  await ctx.close();
}
appendFileSync(`${out}/${rev}-toastcheck.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
await browser.close();
