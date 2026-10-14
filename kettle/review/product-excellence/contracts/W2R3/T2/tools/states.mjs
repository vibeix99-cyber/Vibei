// BEFORE / AFTER full-size captures of the Undo surfaces and the strip on the tab screens (Maker T2, W2R3).
// One browser per invocation (slot gate). Same frozen Monday as the BEFORE set.
//   node states.mjs --base http://127.0.0.1:5481 --out <dir> --cfg 390x844@2:light:100
// States: 11 Mark done tapped (its Undo), 12 Stats: History delete confirmed (its Undo), 13 Settings › Your data:
// backup imported (its Undo), 14 Stats with a notice raised by Edit › Save ("Brew updated").
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse(args.at ?? '2026-10-12T07:40:00.000Z');
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
const dir = `${args.out}/${W}x${H}-${theme}-t${text}`;
mkdirSync(dir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const meta = { base: args.base, cfg: args.cfg, fixed: new Date(FIXED).toISOString(), states: {}, errors: [] };
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
async function context() {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: W < 900 && W < H, hasTouch: W < 900, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block', acceptDownloads: true });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  return { ctx, p };
}
const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
const facts = (p) => p.evaluate(() => ({
  scroll: Math.round(document.scrollingElement.scrollTop),
  notices: [...document.querySelectorAll('[aria-label="Notifications"] li, [data-notice-strip] li')].map((li) => { const r = li.getBoundingClientRect(); return { text: li.innerText.replace(/\s+/g, ' ').slice(0, 70), box: [r.left, r.top, r.width, r.height].map(Math.round) }; }),
  undo: [...document.querySelectorAll('[data-inline-undo]')].map((u) => { const r = u.getBoundingClientRect(); return { for: u.getAttribute('data-undo-for'), text: u.innerText.replace(/\s+/g, ' ').slice(0, 70), box: [r.left, r.top, r.width, r.height].map(Math.round) }; }),
}));
const shot = async (p, name, desc) => {
  try {
    meta.states[name] = { desc, ...(await facts(p)) };
    await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', timeout: 60_000 });
  } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 160)}`); }
};
const tap = async (p, loc) => { await loc.scrollIntoViewIfNeeded(); const r = await loc.boundingBox(); if (W < 900) await p.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); else await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); };
const settings = (p, s) => p.evaluate((x) => window.__kettle.settings.getState().set(x), s);
async function group(name, fn) {
  const { ctx, p } = await context();
  try { await fn(p); } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 200)}`); }
  await ctx.close();
}
try {
  await group('markdone', async (p) => {
    await p.goto(`${args.base}/?debug&seed=newbie&theme=${theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false });
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await sleep(1500); await p.evaluate(() => window.__kettle.ff(180_000)); await sleep(300);
    await p.evaluate(() => window.__kettle.timer.getState().end('user'));
    await p.waitForFunction(() => location.hash === '#/'); await sleep(4500);
    await tap(p, p.getByRole('button', { name: /^Mark “Chapter 3 notes” done/ }));
    await sleep(500);
    await shot(p, '11-mark-done-undo', 'Today: Mark done tapped, its Undo (base: a toast; fix: in the line)');
  });
  await group('history', async (p) => {
    await p.goto(`${args.base}/?debug&seed=veteran&theme=${theme}#/stats`); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true }); await sleep(1500);
    const row = p.locator('main button[aria-label*="Edit"]').nth(2);
    await tap(p, row);
    await p.getByRole('dialog', { name: 'Edit brew' }).waitFor(); await sleep(500);
    await p.getByRole('dialog', { name: 'Edit brew' }).getByRole('button', { name: 'Save' }).click();
    await sleep(700);
    await shot(p, '14-stats-brew-updated', 'Stats: Edit › Save, "Brew updated" (base: toast; fix: the strip, above the view here)');
    await tap(p, row);
    await p.getByRole('dialog', { name: 'Edit brew' }).waitFor(); await sleep(500);
    await p.getByRole('dialog', { name: 'Edit brew' }).getByRole('button', { name: 'Delete this brew' }).click();
    await p.getByRole('dialog', { name: 'Delete this brew?' }).waitFor(); await sleep(400);
    await p.getByRole('dialog', { name: 'Delete this brew?' }).getByRole('button', { name: 'Delete', exact: true }).evaluate((e) => e.click());
    await sleep(900);
    await shot(p, '12-history-delete-undo', 'Stats › History: a brew deleted, its Undo (base: a toast; fix: the row, in place)');
  });
  await group('import', async (p) => {
    await p.goto(`${args.base}/?debug&seed=veteran&theme=${theme}#/settings`); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true }); await sleep(1500);
    const [dl] = await Promise.all([p.waitForEvent('download'), tap(p, p.getByRole('button', { name: /Export a backup/ }))]);
    const file = await dl.path();
    await sleep(3800); // the export's own notice comes and goes
    await p.locator('input[type=file]').setInputFiles(file);
    const sheet = p.getByRole('dialog');
    await sheet.waitFor(); await sleep(500);
    // Everything in the backup is already here (it was just exported): restore it ("Replace"), which is what the
    // import's Undo is for.
    const replace = sheet.getByRole('radio', { name: /Replace/ });
    if (await replace.count()) { await replace.evaluate((e) => e.click()); await sleep(400); }
    const go = sheet.getByRole('button').filter({ hasText: /^(Restore|Replace)/ }).last();
    await go.evaluate((e) => e.click());
    await sleep(900);
    await p.getByText(/Import a backup|from your backup|Backup restored/).first().scrollIntoViewIfNeeded().catch(() => {});
    await sleep(300);
    await shot(p, '13-import-undo', 'Settings › Your data: a backup imported, its Undo (base: a toast; fix: the Import row)');
  });
} finally {
  writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(dir, Object.keys(meta.states).length, 'states', meta.errors.join(' | ').slice(0, 300));
}
