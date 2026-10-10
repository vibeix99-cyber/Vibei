// D4 retest: break-over (carried task) with 1 and 2 toasts. node .tmp/w1fix/breakover.mjs <base> <tag> <outDir> [filter]
// For each config: brew "Chapter 3 notes" → summary → Tea time → break ends → "Break's over" with the carried task.
// Natural toasts are put away, then 1 and then 2 toasts are raised (long duration) and every break-over control is
// checked: hit-test at its centre is the control itself, and no toast's box overlaps the control's box.
import { chromium } from '/home/user/Vibei/kettle/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
const [,, base, tag, out, filter = ''] = process.argv; mkdirSync(out, { recursive: true });
const MSGS = [['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['New badge: Tea Time', 'success']];
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
let fails = 0, cases = 0;
for (const theme of ['light', 'dark']) for (const [w, h, mobile] of [[375, 667, true], [390, 844, true], [1440, 900, false]]) for (const pct of [100, 200]) {
  if (filter && !`${theme} ${w}x${h}@${pct}`.match(new RegExp(filter))) continue;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, colorScheme: theme });
  if (pct !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), pct);
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${base}/?debug&seed=newbie&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`, { waitUntil: 'load' });
  await p.waitForFunction(() => !!window.__kettle); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1000);
  await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, autoStartFocus: false, muted: true }));
  await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await p.waitForTimeout(2500);
  await p.evaluate(() => window.__kettle.nearEnd()); await p.waitForTimeout(400);
  await p.evaluate(() => window.__kettle.finish());
  await p.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ state: 'visible', timeout: 60_000 });
  await p.waitForTimeout(1500);
  await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Tea time|Long tea break/.test(x.textContent)).click());
  await p.waitForTimeout(2000);
  await p.evaluate(() => window.__kettle.finish());
  await p.getByRole('button', { name: /Mark it done, start fresh/ }).waitFor({ state: 'visible', timeout: 30_000 });
  await p.waitForTimeout(1500);
  const natural = await p.evaluate(() => [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.textContent.trim()));
  for (const n of [1, 2]) {
    await p.evaluate(async () => (await import('/src/ui/Toast.tsx')).toast.dismiss());
    await p.waitForTimeout(700);
    await p.evaluate(async (items) => { const { toast } = await import('/src/ui/Toast.tsx'); for (const [m, tone] of items) toast(m, { tone, duration: 60_000 }); }, MSGS.slice(0, n));
    await p.waitForTimeout(1500);
    await p.waitForFunction(() => [...document.querySelectorAll('[aria-label="Notifications"] li')].every((li) => getComputedStyle(li).transform === 'none'), null, { timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(400);
    // Each control scrolled to the middle of the screen (as a person would to reach it; at 200 % text the panel is
    // taller than a phone), then measured once the lift has re-measured (it polls every 250 ms).
    const names = ['Mark it done, start fresh', 'Put the kettle on', 'That’s all for now'];
    const ctrls = {};
    for (const nm of names) {
      const found = await p.evaluate((nm) => { const el = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().replace(/\s+/g, ' ').includes(nm)); if (!el) return false; el.scrollIntoView({ block: 'center' }); return true; }, nm);
      if (!found) { ctrls[nm] = 'missing'; continue; }
      await p.waitForTimeout(700);
      ctrls[nm] = await p.evaluate((nm) => {
        const el = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().replace(/\s+/g, ' ').includes(nm));
        const tr = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => li.getBoundingClientRect());
        const q = el.getBoundingClientRect(); const x = q.left + q.width / 2, y = q.top + q.height / 2;
        const hit = y >= 0 && y < innerHeight ? document.elementFromPoint(x, y) : null;
        const overlap = tr.some((t) => t.bottom > q.top && t.top < q.bottom && t.right > q.left && t.left < q.right);
        return { rect: [Math.round(q.top), Math.round(q.bottom)], scrollY: Math.round(scrollY), toasts: tr.map((t) => [Math.round(t.top), Math.round(t.bottom)]), hit: !!hit && (hit === el || el.contains(hit)), overlap, by: hit && !(hit === el || el.contains(hit)) ? `${hit.tagName.toLowerCase()}.${String(hit.className).split(' ')[0]}` : '' };
      }, nm);
    }
    await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find((x) => /Mark it done|Put the kettle on/.test(x.textContent)); el?.scrollIntoView({ block: 'center' }); });
    await p.waitForTimeout(700);
    const r = { n: await p.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').length), ctrls };
    cases++;
    const ok = r.n === n && Object.values(r.ctrls).every((c) => c !== 'missing' && c.hit && !c.overlap);
    if (!ok) fails++;
    console.log(`${tag} ${theme} ${w}x${h} ${pct}% ${n} toast${n > 1 ? 's' : ''}: ${ok ? 'OK' : 'FAIL'} ${JSON.stringify(r)}${n === 1 && natural.length ? ` natural=${JSON.stringify(natural)}` : ''}`);
    await p.screenshot({ path: `${out}/breakover-${n}toast-${w}x${h}-t${pct}-${theme}-${tag}.png` });
  }
  if (errors.length) console.log(`  page errors: ${errors.join(' | ')}`);
  await ctx.close();
}
console.log(`failures: ${fails} of ${cases}`);
await b.close();
