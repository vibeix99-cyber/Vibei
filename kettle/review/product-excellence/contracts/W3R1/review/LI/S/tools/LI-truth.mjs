// Lane I (W3R1, maker S): Stats numbers shown vs recomputed (by this script, not by the app's functions) from
// window.__kettle.progress.getState().sessions (+ the ledger for "goal met", the engine's record of it).
//   node LI-truth.mjs <url> <label> <outDir> <seeds: veteran,celebrate,newbie>
// Frozen 2026-10-12T07:40Z (Monday) then resume(); en-GB (weeks start Monday), UTC, 1440×900.
import { chromium } from 'playwright';
import fs from 'node:fs';

const [url, label, outRoot, seedsArg = 'veteran,celebrate,newbie'] = process.argv.slice(2);
fs.mkdirSync(outRoot, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const MIN = 60_000;
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const dow = (d) => new Date(`${d}T00:00:00Z`).getUTCDay();
const minLabel = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${Math.floor(m / 60)}h`);
const hm = (ms) => minLabel(Math.floor(ms / MIN));
const longDay = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const relDay = (d, today) => (d === today ? 'Today' : d === addDays(today, -1) ? 'Yesterday' : new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }));
const norm = (x) => (x ?? '').replace(/[,\s]+/g, ' ').trim(); // run 1 compared 'Sat 10 Oct' with the header 'Sat, 10 Oct' (punctuation only)
const localDayOf = (ts) => new Date(ts).toISOString().slice(0, 10); // tz UTC

const all = {};
for (const seed of seedsArg.split(',')) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const page = await ctx.newPage();
  await page.clock.install({ time: FIXED });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=${seed}#/stats`);
  await page.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 60000 });
  await page.getByRole('heading', { name: 'Stats', level: 1 }).waitFor();
  await page.waitForTimeout(1500);
  const d = await page.evaluate(() => {
    const st = window.__kettle.progress.getState();
    const main = document.querySelector('main');
    const secs = [...main.querySelectorAll('section')].map((s) => ({ label: (s.getAttribute('aria-label') || document.getElementById(s.getAttribute('aria-labelledby') || '')?.textContent || '').trim(), el: s }));
    const text = (re) => { const x = secs.find((s) => re.test(s.label)); return x ? x.el.innerText.replace(/\s+/g, ' ').trim() : null; };
    const week = secs.find((s) => /^Last 7 days$/.test(s.label));
    const hist = secs.find((s) => s.label === 'History');
    const histDays = hist ? [...hist.el.querySelectorAll('section[aria-label]')].map((g) => ({ label: g.getAttribute('aria-label'), head: g.querySelector('h3')?.textContent, total: g.innerText.split('\n')[1]?.trim(), rows: [...g.querySelectorAll('[data-session-row]')].map((li) => ({ id: li.getAttribute('data-session-row'), aria: li.querySelector('button')?.getAttribute('aria-label') })) })) : [];
    return {
      sessions: st.sessions, ledger: st.ledger, goalMin: window.__kettle.settings.getState().dailyGoalMin, today: null,
      glance: text(/^Today and the last 7 days$/), overview: text(/^Overview$/), weekText: week ? week.el.innerText.replace(/\s+/g, ' ').trim() : null,
      bars: week ? [...week.el.querySelectorAll('g[role=img]')].map((g) => g.getAttribute('aria-label')) : [],
      pb: text(/^Personal bests$/), histDays,
    };
  });
  await page.screenshot({ path: `${outRoot}/${label}-${seed}-1440.png`, fullPage: true });
  await ctx.close();

  // ---- recompute (independent) ----
  const today = '2026-10-12';
  const focus = d.sessions.filter((s) => s.phase === 'focus');
  const byDay = new Map();
  for (const s of focus) { const t = byDay.get(s.day) ?? { ms: 0, brews: 0, partial: 0 }; t.ms += s.focusedMs; s.completed ? t.brews++ : t.partial++; byDay.set(s.day, t); }
  const goals = new Set(d.ledger.filter((e) => e.kind === 'goal').map((e) => e.day));
  const misattributed = d.sessions.filter((s) => s.day !== localDayOf(s.endedAt)).map((s) => s.id);
  const win = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const t0 = byDay.get(today);
  const todayMin = t0 ? Math.floor(t0.ms / MIN) : 0;
  const weekMinFloorPerDay = win.reduce((a, x) => a + (byDay.has(x) ? Math.floor(byDay.get(x).ms / MIN) : 0), 0);
  const weekMinFloorSum = Math.floor(win.reduce((a, x) => a + (byDay.get(x)?.ms ?? 0), 0) / MIN);
  const first = [...byDay.keys()].sort()[0];
  const elapsed = win.filter((x) => x <= today).length; // WeekCard: every non-future day of the window (run 1 of this script wrongly started at the first brew)
  // warm days replay, written from streak.ts's documented rules (comment block), not by importing it
  const warm = new Set(focus.filter((s) => s.completed).map((s) => s.day));
  let cur = 0, best = 0, cozies = 0, run = 0; let day = [...warm].sort()[0];
  while (day && day <= today) {
    if (warm.has(day)) { run++; best = Math.max(best, run); if (run % 7 === 0 && cozies < 2) cozies++; }
    else if (day === today) break;
    else if (run && cozies > 0) cozies--;
    else run = 0;
    day = addDays(day, 1);
  }
  cur = run;
  // personal bests (en-GB: weeks start Monday)
  let bestDay = null, mostBrews = null; const weeks = new Map();
  for (const [x, t] of byDay) { if (!bestDay || t.ms > bestDay.ms) bestDay = { x, ms: t.ms }; if (t.brews > 0 && (!mostBrews || t.brews > mostBrews.n)) mostBrews = { x, n: t.brews }; const ws = addDays(x, -((dow(x) + 6) % 7)); weeks.set(ws, (weeks.get(ws) ?? 0) + t.ms); }
  let bestWeek = null; for (const [ws, ms] of weeks) if (!bestWeek || ms > bestWeek.ms) bestWeek = { ws, ms };
  let longest = null; for (const s of focus) if (s.completed && (!longest || s.focusedMs > longest.ms)) longest = { ms: s.focusedMs, x: s.day };
  const rows = [];
  const has = (hay, needle) => (hay ?? '').includes(needle);
  const add = (what, recomputed, shownIn, needle = recomputed) => rows.push({ what, recomputed: String(recomputed), shown: shownIn === null ? '(absent)' : has(shownIn, needle) ? String(recomputed) : `≠ (${(shownIn ?? '').slice(0, 90)})`, match: has(shownIn, needle) });
  add('Today: focused', `${minLabel(todayMin)} focused`, d.glance);
  add('Today: full brews', `${t0?.brews ?? 0} full brew${(t0?.brews ?? 0) === 1 ? '' : 's'}`, d.glance);
  const goalLine = goals.has(today) ? 'Daily goal met' : `${minLabel(Math.min(todayMin, d.goalMin))} of your ${minLabel(d.goalMin)} goal`;
  add('Today: goal line', goalLine, d.glance);
  add('Last 7 days (summary): focused', `${minLabel(weekMinFloorPerDay)} focused`, d.glance);
  add('Last 7 days (summary): days brewed', `Brewed on ${win.filter((x) => byDay.has(x)).length} of 7 days`, d.glance);
  const met7 = win.filter((x) => goals.has(x)).length;
  add('Last 7 days (summary): days at goal', `${met7} day${met7 === 1 ? '' : 's'} at goal`, d.glance);
  add('Last 7 days (chart card): focused', minLabel(weekMinFloorPerDay), d.weekText);
  add('Last 7 days (chart card): at goal', `${met7} of ${elapsed} day${elapsed === 1 ? '' : 's'} at goal`, d.weekText);
  add('Last 7 days (chart card): a day on average', `${minLabel(Math.round(weekMinFloorPerDay / Math.max(1, elapsed)))} a day on average`, d.weekText);
  for (const x of win) {
    const t = byDay.get(x); const m = t ? Math.floor(t.ms / MIN) : 0; const b = t?.brews ?? 0;
    const bar = d.bars.find((l) => l.startsWith(longDay(x)));
    add(`Chart bar ${x}`, `${minLabel(m)}, ${b} full brew${b === 1 ? '' : 's'}`, bar ?? null);
  }
  add('Tile: Days warm', `${cur} ${cur === 1 ? 'Day warm' : 'Days warm'}`, d.overview);
  add('Tile: Warmest run', `${best} ${best === 1 ? 'day' : 'days'}`, d.overview);
  add('Tile: Total focus', `${hm(focus.reduce((a, s) => a + s.focusedMs, 0))} Total focus`, d.overview);
  add('Tile: Full brews', `${focus.filter((s) => s.completed).length} Full brews`, d.overview);
  if (bestDay) add('Best day', hm(bestDay.ms), d.pb);
  if (bestWeek) add('Best week', hm(bestWeek.ms), d.pb);
  if (longest) add('Longest brew', hm(longest.ms), d.pb);
  if (mostBrews) add('Brews in a day', `${mostBrews.n} Brews in a day`, d.pb);
  // history: each visible day group's total, and each row's day and minutes
  let rowOk = 0, rowBad = [];
  for (const g of d.histDays) {
    const ids = g.rows.map((r) => r.id);
    const recs = d.sessions.filter((s) => ids.includes(s.id));
    const dayset = [...new Set(recs.map((s) => s.day))];
    const dayOk = dayset.length === 1 && norm(g.head) === norm(relDay(dayset[0], today));
    const tot = recs.filter((s) => s.phase === 'focus').reduce((a, s) => a + s.focusedMs, 0);
    add(`History "${g.head}" total`, hm(tot), g.total ?? '');
    for (const r of g.rows) { const s = d.sessions.find((x) => x.id === r.id); const m = Math.floor(s.focusedMs / MIN); const okm = (r.aria ?? '').includes(`${m} minute`); (dayOk && okm ? rowOk++ : rowBad.push(`${r.id}:${s.day}:${g.head}:${m}:${r.aria}`)); }
  }
  rows.push({ what: 'History rows: in the group of their own day, with whole minutes', recomputed: `${rowOk + rowBad.length} rows`, shown: rowBad.length ? `${rowBad.length} differ: ${rowBad.slice(0, 3).join(' | ')}` : `${rowOk} ok`, match: rowBad.length === 0 });
  rows.push({ what: 'Brews whose day ≠ local day of their end', recomputed: '0', shown: String(misattributed.length), match: misattributed.length === 0 });
  rows.push({ what: '(info) Σ floor per day vs floor Σ, last 7 days', recomputed: `${weekMinFloorPerDay} vs ${weekMinFloorSum}`, shown: '', match: true });
  all[seed] = { rows, raw: { glance: d.glance, overview: d.overview, weekText: d.weekText, bars: d.bars, pb: d.pb, histDays: d.histDays.slice(0, 7) } };
  console.log(`== ${label} ${seed}`);
  for (const r of rows) console.log(`${r.match ? 'OK ' : 'XX '} ${r.what} | ${r.recomputed} | ${r.shown}`);
}
fs.writeFileSync(`${outRoot}/${label}-truth.json`, JSON.stringify(all, null, 1));
await browser.close();
