// Lane B: the badge-earned TOAST path (store.ts announce(): non-completed-focus records show "New badge: <title>").
// Setup via the debug API only: celebrate seed, drop the warm-streak entry from badge state (streak is 6 days, tier I needs 3),
// then through the UI: start a brew, fast-forward 3 min, End session -> the early-ended record is evaluated -> toast.
import { writeFileSync } from 'node:fs';
import { FIXED, sleep, parseArgs, launch, newCtx } from './common.mjs';
const a = parseArgs();
const W = +a.w, H = +a.h;
const facts = { startedAt: new Date().toISOString(), viewport: { W, H }, errors: [], runs: {} };
const b = await launch();
for (const [label, base] of [['base', 'http://127.0.0.1:5480'], ['trial', 'http://127.0.0.1:5485']]) {
  const { ctx, p } = await newCtx(b, W, H, FIXED, facts.errors);
  const r = { toasts: [], liveRegions: [] };
  try {
    await p.goto(`${base}/?debug&seed=celebrate&theme=light#/`, { waitUntil: 'load', timeout: 90_000 });
    await p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 90_000 }).catch(() => facts.errors.push(label + ' ready timeout'));
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
    r.badgesBefore = await p.evaluate(() => { const P = window.__kettle.progress; const s = P.getState(); P.setState({ badges: Object.fromEntries(Object.entries(s.badges).filter(([k]) => k !== 'warm-streak')) }); return Object.keys(P.getState().badges); });
    await sleep(1000);
    const start = p.getByRole('button', { name: /put the kettle on/i }).first();
    await start.scrollIntoViewIfNeeded(); await start.click({ timeout: 30_000 });
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 30_000 });
    await sleep(2500);
    await p.evaluate(() => window.__kettle.ff(3 * 60_000)); await sleep(500);
    await p.getByRole('button', { name: 'End session' }).first().click();
    await p.getByRole('dialog', { name: 'Leave the kettle early?' }).getByRole('button', { name: 'End session' }).click();
    const t0 = Date.now();
    await p.waitForFunction(() => location.hash === '#/', null, { timeout: 30_000 });
    for (const ms of [300, 900, 1800, 3200]) {
      await sleep(Math.max(0, ms - (Date.now() - t0)));
      const snap = await p.evaluate(() => ({ toasts: [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()), live: [...document.querySelectorAll('[role=status],[aria-live],[role=alert]')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean) }));
      r.toasts.push({ atMs: ms, ...snap });
    }
    r.badgesAfter = await p.evaluate(() => Object.fromEntries(Object.entries(window.__kettle.progress.getState().badges).filter(([k]) => k === 'warm-streak')));
    await p.screenshot({ path: `${a.out}/toast-${label}-${W}x${H}.png`, animations: 'disabled', timeout: 60_000 }).catch(() => {});
  } catch (e) { facts.errors.push(label + ' ' + e.message.slice(0, 300)); }
  facts.runs[label] = r;
  await ctx.close();
}
facts.finishedAt = new Date().toISOString();
writeFileSync(`${a.out}/toast-path-${W}x${H}.json`, JSON.stringify(facts, null, 1));
await b.close();
console.log('toast', JSON.stringify(facts.runs).slice(0, 900), facts.errors);
