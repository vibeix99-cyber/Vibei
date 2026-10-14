// Maker S (W3R1): the numbers Stats shows vs the numbers recomputed here from the seeded records.
// Recomputation is independent of the app's code: local day of each brew's END (Kettle's documented policy,
// SessionRecord.day), whole minutes rounded down (the engine's count for leaves and the goal).
//   node totals.mjs --base http://127.0.0.1:5502 --out <file.json>
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const b = await chromium.launch();
const out = {};
for (const seed of ['veteran', 'celebrate', 'newbie']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  await p.goto(`${args.base}/?debug&seed=${seed}#/stats`);
  await p.getByRole('heading', { name: 'Stats', level: 1 }).waitFor({ timeout: 30_000 });
  await p.waitForFunction(() => !document.querySelector('[data-route-leaving]') && document.querySelectorAll('main section').length > 3);
  await p.waitForTimeout(1200);
  out[seed] = await p.evaluate(() => {
    const k = window.__kettle;
    const st = k.progress.getState();
    const pad = (n) => String(n).padStart(2, '0');
    const localDay = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
    const back = (n) => { const d = new Date(k.clock.now()); d.setDate(d.getDate() - n); return localDay(d.getTime()); };
    const today = localDay(k.clock.now());
    const lbl = (min) => (min < 60 ? `${min} min` : min % 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${Math.floor(min / 60)}h`);
    const focus = st.sessions.filter((s) => s.phase === 'focus');
    const dayMs = new Map();
    for (const s of focus) dayMs.set(localDay(s.endedAt), (dayMs.get(localDay(s.endedAt)) ?? 0) + s.focusedMs);
    const last7 = Array.from({ length: 7 }, (_, i) => back(6 - i));
    const goals = new Set(st.ledger.filter((e) => e.kind === 'goal').map((e) => e.day));
    const weekMin = last7.reduce((a, d) => a + Math.floor((dayMs.get(d) ?? 0) / 60000), 0);
    const elapsed = 7;
    const recomputed = {
      'Brews whose day ≠ local day of their end': String(focus.filter((s) => s.day !== localDay(s.endedAt)).length),
      'Total focus (tile)': lbl(Math.floor(focus.reduce((a, s) => a + s.focusedMs, 0) / 60000)),
      'Full brews (tile)': String(focus.filter((s) => s.completed).length),
      'Today: focused': lbl(Math.floor((dayMs.get(today) ?? 0) / 60000)),
      'Today: full brews': String(focus.filter((s) => s.completed && localDay(s.endedAt) === today).length),
      'Today: goal met (ledger)': goals.has(today) ? 'yes' : 'no',
      'Last 7 days: focused': lbl(weekMin),
      'Last 7 days: days brewed': String(last7.filter((d) => dayMs.has(d)).length),
      'Last 7 days: days at goal': String(last7.filter((d) => goals.has(d)).length),
      'Last 7 days: a day on average': lbl(Math.round(weekMin / elapsed)),
    };
    // History: the first 7 day groups' totals.
    const hist = [...dayMs.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 7);
    for (const [d, ms] of hist) recomputed[`History ${d}`] = lbl(Math.floor(ms / 60000));
    // What the screen shows.
    const main = document.querySelector('main');
    const txt = (el) => (el?.innerText ?? '').replace(/\s+/g, ' ').trim();
    const tiles = [...main.querySelectorAll('section[aria-label="Overview"] > div > *')].map(txt);
    const glance = txt(main.querySelector('[data-area="summary"]'));
    const weekCard = [...main.querySelectorAll('section')].find((s) => s.querySelector('h2')?.textContent === 'Last 7 days');
    const historyRegions = [...main.querySelectorAll('section[aria-label]')].filter((s) => / focused$/.test(s.getAttribute('aria-label')));
    const shown = {
      'Total focus (tile)': (tiles.find((t) => /Total focus/.test(t)) ?? '').replace(' Total focus', ''),
      'Full brews (tile)': (tiles.find((t) => /Full brews/.test(t)) ?? '').replace(' Full brews', ''),
      'Today: focused': glance.match(/Today .*? (\d+h(?: \d+m)?|\d+ min) focused/)?.[1] ?? '(no summary)',
      'Today: full brews': glance.match(/(\d+) full brews?/)?.[1] ?? (glance ? '0' : '(no summary)'),
      'Today: goal met (ledger)': glance ? (/Daily goal met/.test(glance) ? 'yes' : 'no') : '(no summary)',
      'Last 7 days: focused': txt(weekCard).match(/(\d+h(?: \d+m)?|\d+ min) focused/)?.[1],
      'Last 7 days: days brewed': glance.match(/Brewed on (\d+) of 7/)?.[1] ?? '(no summary)',
      'Last 7 days: days at goal': txt(weekCard).match(/(\d+) of \d+ days at goal/)?.[1],
      'Last 7 days: a day on average': txt(weekCard).match(/(\d+h(?: \d+m)?|\d+ min) a day on average/)?.[1],
      'Summary: last 7 days focused': glance.match(/Last 7 days .*? (\d+h(?: \d+m)?|\d+ min) focused/)?.[1] ?? '(no summary)',
    };
    for (const r of historyRegions.slice(0, 7)) {
      const headTotal = txt(r.querySelector('header span'));
      shown[`History ${r.getAttribute('aria-label').split(',').slice(0, -1).join(',')}`] = headTotal;
    }
    return { today, recomputed, shown, history: historyRegions.slice(0, 7).map((r) => ({ label: r.getAttribute('aria-label'), total: txt(r.querySelector('header span')) })) };
  });
  await ctx.close();
}
writeFileSync(args.out, JSON.stringify(out, null, 1));
await b.close();
console.log('totals written', args.out);
