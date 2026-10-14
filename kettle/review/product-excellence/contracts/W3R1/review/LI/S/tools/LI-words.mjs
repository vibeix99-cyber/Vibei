// Lane I (W3R1, maker S): "streak" in visible text, sr text and attributes on Stats, History, Edit brew, Delete this
// brew? and the Warm Days badge sheet; the warm-days card's line and when the Tea Cozy sentence shows.
//   node LI-words.mjs <url> <label> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';

const [url, label, outRoot] = process.argv.slice(2);
fs.mkdirSync(outRoot, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CASES = [
  ['fresh', '2026-10-12T07:40:00Z'], ['newbie', '2026-10-12T07:40:00Z'], ['veteran', '2026-10-12T07:40:00Z'], ['celebrate', '2026-10-12T07:40:00Z'],
  ['atRisk', '2026-10-12T07:40:00Z'], ['atRisk', '2026-10-12T19:10:00Z'], ['veteran', '2026-10-12T19:10:00Z'],
];
const scan = (page, sel) => page.evaluate((sel) => {
  const hits = [];
  for (const root of document.querySelectorAll(sel)) {
    const tc = root.textContent || '';
    for (const m of tc.matchAll(/[^.]{0,40}streak[^.]{0,40}/gi)) hits.push(`text: ${m[0].trim()}`);
    for (const el of [root, ...root.querySelectorAll('*')]) for (const a of ['aria-label', 'title', 'aria-description', 'alt', 'aria-valuetext', 'placeholder']) { const v = el.getAttribute(a); if (v && /streak/i.test(v)) hits.push(`${a}: ${v}`); }
  }
  return hits;
}, sel);
const out = [];
const MIN = 60_000;
const recs = (from, to) => { const o = []; for (let t = Date.parse(`${from}T09:00:00Z`); t <= Date.parse(`${to}T09:00:00Z`); t += 86_400_000) { const d = new Date(t).toISOString().slice(0, 10); o.push({ id: `w-${d}`, phase: 'focus', startedAt: t, endedAt: t + 25 * MIN, plannedMs: 25 * MIN, focusedMs: 25 * MIN, completed: true, intention: '', tag: null, day: d }); } return o; };
// cozy: warm 3–11 Oct (9 days, a Cozy earned on day 7), nothing yet on Mon 12. broken: warm 1–9 Oct, then 10 and 11 missed.
CASES.push(['custom-cozy', '2026-10-12T19:10:00Z', recs('2026-10-03', '2026-10-11')], ['custom-cozy', '2026-10-12T07:40:00Z', recs('2026-10-03', '2026-10-11')], ['custom-broken', '2026-10-12T19:10:00Z', recs('2026-10-01', '2026-10-09')]);
// Run 1 used seed=blank for the custom cases; blank pins the app clock to 15:30 (seed.ts:279), so 19:10 was never
// reached. 'fresh' pins nothing. ONLY=custom runs just those cases.
for (const [seed, at, custom] of CASES.filter((c) => process.env.ONLY !== 'custom' || c[2])) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const page = await ctx.newPage();
  await page.clock.install({ time: Date.parse(at) });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=${custom ? 'fresh' : seed}&onboarded=1#/stats`);
  await page.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 60000 });
  if (custom) { await page.evaluate((rs) => { for (const r of rs) window.__kettle.progress.getState().recordSession(r); }, custom); await page.evaluate(() => window.__kettle.navigate('/')); await sleep(600); await page.evaluate(() => window.__kettle.navigate('/stats')); }
  await page.getByRole('heading', { name: 'Stats', level: 1 }).waitFor();
  await sleep(1200);
  const r = { seed, at };
  r.engine = await page.evaluate(async () => {
    const st = window.__kettle.progress.getState();
    const s = await import(/* @vite-ignore */ '/src/progress/streak.ts');
    const t = s.streakTimeline(s.warmDays(st.sessions), new Date(Date.now()).toISOString().slice(0, 10));
    return { current: t.current, best: t.best, cozies: t.cozies, todayDone: t.todayDone, hour: new Date().getUTCHours(), atRisk: t.current > 0 && !t.todayDone && new Date().getUTCHours() >= 18, cozyDays: t.cozyDays.slice(-3), missed: Object.entries(t.days).filter(([, v]) => v === 'missed').map(([d]) => d).slice(-3) };
  });
  r.main = await scan(page, 'main');
  r.card = await page.evaluate(() => { const s = [...document.querySelectorAll('main section')].find((x) => [...x.querySelectorAll('caption')].some((c) => /calendar/i.test(c.textContent))); return s ? s.innerText.replace(/\s+/g, ' ').trim().slice(0, 400) : null; });
  r.overview = await page.evaluate(() => document.querySelector('main section[aria-label="Overview"]')?.innerText.replace(/\s+/g, ' ').trim() ?? null);
  r.cozyLine = /Tea Cozy keeps/.test(r.card ?? '');
  await page.screenshot({ path: `${outRoot}/${label}-${seed}-${at.slice(11, 16).replace(':', '')}.png`, fullPage: true });
  // Badge sheet: Warm Days
  try {
    const b = page.locator('button[aria-label^="Warm Days"]').first();
    if (await b.count()) { await b.scrollIntoViewIfNeeded(); await b.click(); await page.locator('[role=dialog]').first().waitFor(); await sleep(800); r.badgeSheet = await scan(page, '[role=dialog]'); r.badgeText = await page.locator('[role=dialog]').last().innerText(); await page.keyboard.press('Escape'); await sleep(700); }
  } catch (e) { r.badgeErr = e.message.slice(0, 120); }
  // Edit brew + Delete this brew?
  try {
    const row = page.locator('[data-session-row] button').first();
    if (await row.count()) {
      await row.scrollIntoViewIfNeeded(); await row.click(); await page.getByRole('dialog', { name: 'Edit brew' }).waitFor(); await sleep(800);
      r.edit = await scan(page, '[role=dialog]');
      await page.getByRole('button', { name: 'Delete this brew' }).click(); await page.getByRole('dialog', { name: 'Delete this brew?' }).waitFor(); await sleep(800);
      r.del = await scan(page, '[role=dialog]');
      r.delText = (await page.getByRole('dialog', { name: 'Delete this brew?' }).innerText()).replace(/\s+/g, ' ');
    }
  } catch (e) { r.dlgErr = e.message.slice(0, 120); }
  out.push(r);
  console.log(JSON.stringify({ seed, at: at.slice(11, 16), engine: r.engine, main: r.main, badge: r.badgeSheet, edit: r.edit, del: r.del, cozyLine: r.cozyLine, card: r.card?.slice(0, 160), overview: r.overview }));
  await ctx.close();
}
fs.writeFileSync(`${outRoot}/${label}-words${process.env.ONLY ? '-' + process.env.ONLY : ''}.json`, JSON.stringify(out, null, 1));
await browser.close();
