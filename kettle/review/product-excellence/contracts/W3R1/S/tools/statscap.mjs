// Maker S (W3R1): Stats / History captures and the numbers they show. One browser per invocation (slot gate).
// Frozen clock 2026-10-12T07:40:00Z (Monday) then resume(); fresh profile per state group; animations disabled.
//   node statscap.mjs --base http://127.0.0.1:5478 --out <dir> --cfg 390x844:light:100 [--groups empty,veteran,...] [--full 1]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse(args.at ?? '2026-10-12T07:40:00.000Z');
const m = args.cfg.match(/^(\d+)x(\d+):(light|dark):(\d+)$/);
const [W, H, theme, text] = [+m[1], +m[2], m[3], +m[4]];
const dir = `${args.out}/${W}x${H}-${theme}-t${text}`;
mkdirSync(dir, { recursive: true });
const mobile = W < 900;
const groups = (args.groups ?? 'empty,veteran,newbie,celebrate,atRisk').split(',');
const full = args.full === '1';
const meta = { base: args.base, viewport: { w: W, h: H }, theme, text: `${text}%`, fixedTime: new Date(FIXED).toISOString(), states: {}, errors: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function context() {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  p.on('pageerror', (e) => meta.errors.push(e.message.slice(0, 200)));
  return { ctx, p };
}
const open = async (p, seed) => {
  await p.goto(`${args.base}/?debug&seed=${seed}&theme=${theme}${seed === 'blank' ? '&onboarded=1' : ''}#/stats`);
  await p.waitForFunction(() => !!window.__kettle, null, { timeout: 30_000 });
  await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, scene: 'off' }));
  await p.getByRole('heading', { name: 'Stats', level: 1 }).waitFor({ timeout: 30_000 });
  await p.waitForFunction(() => !document.querySelector('[data-route-leaving]') && document.querySelectorAll('main section').length > 0, null, { timeout: 30_000 });
  await p.evaluate(() => document.fonts.ready);
  await sleep(1500);
};
// What the top of Stats says, as text (tiles, the summary if any), and the page's horizontal overflow.
const read = (p) => p.evaluate(() => {
  const main = document.querySelector('main');
  const q = (sel) => [...main.querySelectorAll(sel)].map((e) => e.innerText.replace(/\s+/g, ' ').trim());
  return {
    overflowX: document.scrollingElement.scrollWidth - innerWidth,
    summary: q('[data-area="summary"]'),
    tiles: q('section[aria-label="Overview"] > div > *'),
    headings: q('h1, h2'),
    streakText: [...main.querySelectorAll('[aria-labelledby]')].map((e) => e.innerText).filter((t) => /warm|Tea Cozy/.test(t)).map((t) => t.split('\n').slice(0, 6).join(' | ')).slice(0, 1),
    streakWords: (main.innerText.match(/[^\n]*streak[^\n]*/gi) ?? []).slice(0, 8),
    ariaStreak: [...main.querySelectorAll('[aria-label], [title], caption')].map((e) => e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent).filter((t) => t && /streak/i.test(t)).slice(0, 8),
  };
});
const shot = async (p, name, desc, fullPage = false) => {
  try {
    const facts = await read(p);
    await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', fullPage, timeout: 120_000 });
    meta.states[name] = { desc, ...facts };
  } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 120)}`); }
};
async function group(label, fn) {
  if (!groups.includes(label)) return;
  const { ctx, p } = await context();
  try { await fn(p); } catch (e) { meta.errors.push(`${label}: ${e.message.slice(0, 160)}`); }
  await ctx.close();
}
const scrollTo = async (p, loc) => { await loc.scrollIntoViewIfNeeded(); await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r()))); await sleep(500); };

try {
  await group('empty', async (p) => { await open(p, 'blank'); await shot(p, 'S01-empty', 'Stats, empty (blank seed, onboarded)'); if (full) await shot(p, 'S01-empty-full', 'Stats, empty, full page', true); });
  await group('veteran', async (p) => {
    // One profile for the populated walk: top (the summary), calendar, History, the edit sheet, the delete dialog.
    await open(p, 'veteran');
    await shot(p, 'S02-veteran-top', 'Stats, populated (veteran): top of the page, the summary');
    if (full) await shot(p, 'S02-veteran-full', 'Stats, populated (veteran), full page', true);
    await scrollTo(p, p.getByRole('heading', { name: /warm|Ready for|Start a new/ }).first());
    await shot(p, 'S03-veteran-calendar', 'Stats (veteran): the warm-days card and calendar');
    await scrollTo(p, p.getByRole('heading', { name: 'History', level: 2 }));
    await shot(p, 'S08-history', 'Stats (veteran): History');
    const row = p.locator('[data-session-row] button').first();
    await scrollTo(p, row);
    if (mobile) await row.tap(); else await row.click();
    await p.getByRole('dialog', { name: 'Edit brew' }).waitFor(); await sleep(900);
    await shot(p, 'S09-edit-sheet', 'History › a brew: Edit brew sheet');
    const del = p.getByRole('button', { name: 'Delete this brew' });
    await del.scrollIntoViewIfNeeded();
    if (mobile) await del.tap(); else await del.click();
    await p.getByRole('dialog', { name: 'Delete this brew?' }).waitFor(); await sleep(1000);
    await shot(p, 'S10-delete-dialog', 'History › a brew › Delete this brew: the confirmation');
  });
  if (text === 100) {
    await group('newbie', async (p) => { await open(p, 'newbie'); await shot(p, 'S04-newbie-top', 'Stats, populated (newbie): top'); });
    await group('celebrate', async (p) => { await open(p, 'celebrate'); await shot(p, 'S05-celebrate-top', 'Stats, populated (celebrate): top'); });
  }
  await group('atRisk', async (p) => {
    // At-risk needs the evening: 2026-10-12 19:10 local (UTC).
    await p.clock.setSystemTime(Date.parse('2026-10-12T19:10:00Z'));
    await open(p, 'atRisk');
    await shot(p, 'S06-atrisk-top', 'Stats (atRisk seed, 19:10): top');
    await scrollTo(p, p.getByRole('heading', { name: /warm|Ready for|Start a new/ }).first());
    await shot(p, 'S07-atrisk-calendar', 'Stats (atRisk, 19:10): the warm-days card');
  });
} finally {
  writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(`${W}x${H}-${theme}-t${text}`, 'states', Object.keys(meta.states).length, 'errors', meta.errors.length, meta.errors.join(' | ').slice(0, 300));
}
