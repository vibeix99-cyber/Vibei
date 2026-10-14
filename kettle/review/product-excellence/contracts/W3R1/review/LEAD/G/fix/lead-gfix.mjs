// LEAD-5 · W3R1 G fix round: my own rerun of acceptance checks 2–5 (independent of the maker's fix-measure.mjs).
//   node lead-gfix.mjs --base http://127.0.0.1:5525 --label FIX --out <dir>
// One Chromium launch; a fresh context per config; frozen clock 2026-10-12T07:40Z then resume(); seed veteran.
// Modes:
//   granted : Notification.permission faked 'granted' (as whistle.spec's fakePermission), notifications on, sound on
//   safari  : window.Notification and Navigator.prototype.vibrate removed (an iOS Safari tab), sound on
// For each known line it records the rendered text, line count (distinct line boxes of the text, and height ÷ line-height)
// and writes an element screenshot of its row at full size.
import { chromium } from '/home/user/wt/w5tr-g2/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const AT = Date.parse('2026-10-12T07:40:00.000Z');
mkdirSync(args.out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LINES = {
  sounds: [
    'Effects, the kettle’s whistle and ambience, while Kettle is open. A phone’s silent switch or lock screen can keep them quiet.',
    'The whistle, effects and ambience play while Kettle is open, in a tab or as the app, after your first tap. Closed, Kettle is silent. A phone’s silent switch or lock screen can quiet it too.',
    'The whistle, effects and ambience play after your first tap. A phone can quiet them when locked, on silent or out of sight.',
  ],
  nudgesOn: [
    'On. I’ll nudge you when a brew or tea break ends. A locked phone may hold the nudge until you’re back.',
    'On. When a brew or tea break ends while Kettle is open but out of sight, I’ll nudge you. With Kettle closed, no nudge can come. A locked phone may hold the nudge until you’re back.',
    'On. When a brew or tea break ends while Kettle is open but out of sight, I’ll nudge you. If Kettle is closed or your phone has paused it by then, no nudge comes.',
  ],
  nudgesUnsupported: ['This browser can’t show notifications. With sound on, Kettle chimes while it’s on screen.'],
  hapticsUnsupported: ['This device can’t vibrate.', 'Vibration isn’t available in this browser.'],
  keepAwake: [
    'Stops your screen dimming during a brew.',
    'Stops your screen dimming while a brew is on screen.',
    'Stops your screen dimming while a brew runs on screen.',
  ],
};

// cfg: <w>x<h>:<theme>:<100|200>:<phone|desk>:<granted|safari>
const CFGS = (args.cfgs ?? [
  '375x667:light:200:desk:granted', '375x667:dark:200:desk:granted',
  '375x667:light:200:phone:granted', '375x667:dark:200:phone:granted',
  '390x844:light:100:phone:granted', '1440x900:light:100:desk:granted',
  '390x844:light:100:phone:safari',
].join(',')).split(',');

const b = await chromium.launch();
const out = { label: args.label, base: args.base, clock: '2026-10-12T07:40:00Z', startedAt: new Date().toISOString(), runs: [] };
for (const cfg of CFGS) {
  const [wh, theme, text, kind, mode] = cfg.split(':');
  const [w, h] = wh.split('x').map(Number);
  const phone = kind === 'phone';
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
  if (text === '200') await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{font-size:200%!important}'; document.head.appendChild(s); }));
  if (mode === 'granted') await ctx.addInitScript(() => { try { Object.defineProperty(Notification, 'permission', { get: () => 'granted' }); } catch { /* */ } });
  if (mode === 'safari') await ctx.addInitScript(() => { delete window.Notification; delete Navigator.prototype.vibrate; });
  const page = await ctx.newPage();
  await page.clock.install({ time: AT });
  await page.clock.resume();
  const run = { cfg, ok: true };
  try {
    await page.goto(`${args.base}/?debug&seed=veteran&theme=${theme}#/settings`);
    await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('heading', { name: 'Settings', level: 1 }).waitFor();
    await page.evaluate((m) => window.__kettle.settings.getState().set(m === 'granted' ? { muted: false, notifications: true } : { muted: false }), mode);
    await sleep(900);
    run.found = await page.evaluate((LINES) => {
      const res = {};
      const all = [...document.querySelectorAll('main *, body *')];
      for (const [key, texts] of Object.entries(LINES)) {
        const el = all.find((e) => e.children.length === 0 && texts.includes(e.textContent.trim()));
        if (!el) { res[key] = null; continue; }
        const r = document.createRange();
        r.selectNodeContents(el);
        const tops = new Set([...r.getClientRects()].filter((q) => q.width > 0.5).map((q) => Math.round(q.top)));
        const cs = getComputedStyle(el);
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        const box = el.getBoundingClientRect();
        el.setAttribute('data-lead5', key);
        const row = el.closest('[class*="row"]') ?? el.parentElement;
        row.setAttribute('data-lead5-row', key);
        const sw = row.querySelector('[role="switch"]');
        res[key] = { which: texts.indexOf(el.textContent.trim()), text: el.textContent.trim(), chars: el.textContent.trim().length, lines: tops.size, linesByHeight: Math.round(box.height / lh), height: Math.round(box.height * 10) / 10, width: Math.round(box.width), switchDisabled: sw ? sw.disabled || sw.getAttribute('aria-disabled') === 'true' : null };
      }
      const txt = document.querySelector('main')?.innerText ?? document.body.innerText;
      res.sweep = { inATab: /in a tab/i.test(txt), mayHold: /may hold/i.test(txt), untilBack: /until you’re back/i.test(txt), streak: /streak/i.test(txt) };
      return res;
    }, LINES);
    for (const key of Object.keys(LINES)) {
      const loc = page.locator(`[data-lead5-row="${key}"]`).first();
      if (await loc.count()) {
        await loc.scrollIntoViewIfNeeded();
        await sleep(150);
        await loc.screenshot({ path: `${args.out}/${args.label}-${wh}-${theme}-${text}-${kind}-${mode}-${key}.png` });
      }
    }
  } catch (e) {
    run.ok = false;
    run.error = String(e).slice(0, 400);
  }
  out.runs.push(run);
  console.log(cfg, JSON.stringify(Object.fromEntries(Object.entries(run.found ?? {}).map(([k, v]) => [k, v && v.lines !== undefined ? `${v.which}:${v.lines}/${v.linesByHeight}L:${v.chars}c${v.switchDisabled ? ':sw-off' : ''}` : v]))), run.error ?? '');
  await ctx.close();
}
await b.close();
out.finishedAt = new Date().toISOString();
writeFileSync(`${args.out}/lead-gfix-${args.label}.json`, JSON.stringify(out, null, 1));
