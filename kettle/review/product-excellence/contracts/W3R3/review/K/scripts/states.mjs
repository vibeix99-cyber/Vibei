// Lane K: every screen/state where a painted pose (reading/sipping/cheering) shows -> full-page PNGs.
//   node states.mjs <baseURL> <outDir> <cfgs csv> <themes csv> <variant: normal|t200|rm> [states csv]
import fs from 'node:fs';
import { launch, newCtx, shot, facts, CONFIGS, NOTIF_GRANTED } from './lib.mjs';
const [base, outDir, cfgsArg, themesArg, variant = 'normal', statesArg] = process.argv.slice(2);
const ALL = ['kit-chai', 'settings', 'home-evening', 'focus-running', 'home-live', 'focus-paused', 'whistle', 'summary', 'focus-break', 'home-break', 'welcome-sound', 'welcome-notify', 'welcome-ready'];
const want = statesArg ? statesArg.split(',') : ALL;
const log = [];
const SETTLED = new Set(['focus-running', 'home-live', 'focus-paused', 'focus-break', 'home-break']); // only these entrance-animated states get the longer settle (BEFORE was captured the same way)
const SET = Number(process.env.K_SETTLE || 1); // multiplies the settle waits (the Stage scene and the tab bar animate on entry)
const b = await launch();

for (const cfg of cfgsArg.split(',')) for (const theme of themesArg.split(',')) {
  const [vw, vh] = CONFIGS[cfg];
  const tag = `${cfg}-${theme}${variant === 'normal' ? '' : '-' + variant}`;
  const dir = `${outDir}/${tag}`; fs.mkdirSync(dir, { recursive: true });
  const reduced = variant === 'rm';
  const qs = `debug&theme=${theme}${reduced ? '&motion=reduce' : '&motion=full'}`;
  const mk = async (init) => {
    const ctx = await newCtx(b, { vw, vh, reduced, text200: variant === 't200' });
    if (init) await ctx.addInitScript(init);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => log.push(`${tag} pageerror ${e.message}`));
    return { ctx, page };
  };
  const boot = async (page, seed, hash = '/') => {
    await page.goto(`${base}/?${qs}&seed=${seed}#${hash}`);
    await page.waitForFunction(() => window.__kettle, null, { timeout: 60000 });
    await page.waitForTimeout(1500);
  };
  const snap = async (page, name, wait = 600) => {
    if (!want.includes(name)) return;
    await page.waitForTimeout(wait * (SETTLED.has(name) ? SET : 1));
    await shot(page, `${dir}/${name}.png`);
    const f = await facts(page);
    log.push(`${tag} ${name} ${JSON.stringify(f.chai.map((c) => `${c.pose}:${c.box.join(',')}`))}`);
  };
  const only = (...names) => names.some((n) => want.includes(n));
  const guard = async (label, fn) => { try { await fn(); } catch (e) { log.push(`${tag} FAIL ${label}: ${String(e.message).split('\n')[0]}`); } };

  // static pages: one fresh context each so no screen leaks into the next
  for (const [name, seed, hash, pre] of [['kit-chai', 'veteran', '/kit?part=art&view=chai'], ['settings', 'veteran', '/settings']]) {
    if (!want.includes(name)) continue;
    await guard(name, async () => { const { ctx, page } = await mk(); await boot(page, seed, hash); await snap(page, name, 900); await ctx.close(); });
  }
  if (want.includes('home-evening')) await guard('home-evening', async () => {
    const { ctx, page } = await mk(); await boot(page, 'veteran'); await page.evaluate(() => window.__kettle.ff(3.5 * 3600e3)); await snap(page, 'home-evening', 1500); await ctx.close();
  });
  if (only('focus-running', 'home-live', 'focus-paused', 'whistle', 'summary', 'focus-break', 'home-break')) await guard('flow', async () => {
    const { ctx, page } = await mk(); await boot(page, 'veteran');
    await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
    await page.getByRole('button', { name: /put the kettle on/i }).first().click();
    await page.waitForFunction(() => location.hash === '#/focus'); await page.waitForTimeout(1200 * SET);
    await snap(page, 'focus-running', 1200);
    await page.evaluate(() => window.__kettle.navigate('/')); await snap(page, 'home-live', 1800);
    await page.evaluate(() => window.__kettle.navigate('/focus')); await page.waitForTimeout(900);
    await guard('pause', async () => { await page.getByRole('button', { name: /^pause$/i }).first().click(); await snap(page, 'focus-paused', 1000); await page.getByRole('button', { name: /^resume$/i }).first().click(); await page.waitForTimeout(500); });
    await page.evaluate(() => window.__kettle.finish());
    await snap(page, 'whistle', 700);
    await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 }).catch(() => {});
    await snap(page, 'summary', 3000);
    await guard('tea', async () => { await page.getByRole('button', { name: /tea time/i }).first().click(); await page.waitForTimeout(2200); });
    await snap(page, 'focus-break', 600);
    await page.evaluate(() => window.__kettle.navigate('/')); await snap(page, 'home-break', 1800);
    await ctx.close();
  });
  if (only('welcome-sound', 'welcome-notify', 'welcome-ready')) await guard('welcome', async () => {
    const { ctx, page } = await mk(NOTIF_GRANTED); await boot(page, 'fresh');
    await page.getByRole('button', { name: /set things up first/i }).click(); await page.waitForTimeout(900);
    await page.locator('input').first().fill('Robin');
    const next = async () => { await page.getByRole('button', { name: /^continue$/i }).first().click(); await page.waitForTimeout(1100); };
    await next(); await page.locator('fieldset label').first().click(); await next(); // goal
    await page.locator('fieldset label').first().click(); await next();             // rhythm
    await page.locator('fieldset label').first().click(); await page.waitForTimeout(300);
    await snap(page, 'welcome-sound', 900);                                          // ambience step
    await page.getByRole('button', { name: /^continue$/i }).first().click(); await page.waitForTimeout(1200); // notify
    await snap(page, 'welcome-notify', 900);
    await page.getByRole('button', { name: /^continue$/i }).first().click().catch(async () => { await page.getByRole('button', { name: /not now/i }).first().click(); });
    await page.waitForTimeout(1200);
    await snap(page, 'welcome-ready', 900);
    await ctx.close();
  });
}
await b.close();
fs.appendFileSync(`${outDir}/states.log.txt`, log.join('\n') + '\n');
console.log(log.join('\n'));
