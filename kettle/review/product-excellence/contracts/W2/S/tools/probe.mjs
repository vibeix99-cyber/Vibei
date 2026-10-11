// W2 Maker S — summary probe (control and acceptance). One Chromium per invocation (run under the slot gate).
// node probe.mjs --base http://127.0.0.1:5310 --label ctl-90a11e5 --out <dir> --cfgs 375x667:light:100,... [--days routine,bigday]
// Real input only (clicks, wheel); the debug API is used for setup (seed, settings, finish) only.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire('/home/user/wt/w2s/kettle/package.json');
const { chromium } = require('playwright');
import { measureInPage } from './measure.mjs';
const AXE = '/home/user/wt/w2s/kettle/node_modules/axe-core/axe.min.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const PEEK = 6;
const days = (args.days ?? 'routine,bigday').split(',');
const cfgs = args.cfgs.split(',');
mkdirSync(args.out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function run(cfg, day) {
  const m = cfg.match(/^(\d+)x(\d+):(light|dark):(\d+)$/);
  const [W, H, theme, text] = [+m[1], +m[2], m[3], +m[4]];
  const mobile = W < 900;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  const seed = day === 'bigday' ? 'celebrate' : day === 'milestone' ? (args.mseed ?? 'atRisk') : 'veteran';
  const res = { cfg, day, seed, base: args.base, label: args.label, errors };
  try {
    await p.goto(`${args.base}/?debug&seed=${seed}&theme=${theme}#/`);
    await p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
    await sleep(1200);
    if (day === 'task') {
      const task = p.getByPlaceholder(/Chapter 3 notes/);
      await task.click();
      await p.keyboard.type('Chapter 3 notes', { delay: 20 });
      await sleep(300);
    }
    const start = p.getByRole('button', { name: /put the kettle on/i }).first();
    await start.click({ timeout: 30_000 });
    await sleep(2500);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
    await sleep(1500);
    res.arrival = await p.evaluate(measureInPage, { PEEK, phase: 'arrival-1.5s' });
    await sleep(3000);
    res.settled = await p.evaluate(measureInPage, { PEEK, phase: 'settled-4.5s' });
    if (args.shots) await p.screenshot({ path: `${args.out}/${args.label}-${W}x${H}-${theme}-t${text}-${day}-arrival.png`, animations: 'disabled' });
    // axe on the settled summary
    await p.addScriptTag({ path: AXE });
    res.axe = await p.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) }));
    });
    // to the end: wheel down over the summary, open the arithmetic, wheel to the end again
    const box = res.settled.scroll.rect;
    const cx = box[0] + box[2] / 2, cy = box[1] + Math.min(box[3] - 40, Math.max(40, box[3] * 0.75));
    await p.mouse.move(cx, cy);
    for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 240); await sleep(60); }
    await sleep(500);
    const toggle = p.getByRole('button', { name: /How your leaves added up/ });
    await toggle.click({ timeout: 10_000 });
    await sleep(300);
    await p.mouse.move(cx, cy);
    for (let i = 0; i < 16; i++) { await p.mouse.wheel(0, 240); await sleep(60); }
    await sleep(600);
    res.end = await p.evaluate(measureInPage, { PEEK, phase: 'end-expanded' });
    res.axeEnd = await p.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) }));
    });
    if (args.shots) {
      await p.screenshot({ path: `${args.out}/${args.label}-${W}x${H}-${theme}-t${text}-${day}-end.png`, animations: 'disabled' });
    }
  } catch (e) {
    res.error = e.message.slice(0, 300);
  }
  await ctx.close();
  return res;
}

const all = [];
try {
  for (const cfg of cfgs) for (const day of days) {
    const r = await run(cfg, day);
    all.push(r);
    const s = r.settled, e = r.end;
    console.log(`${args.label} ${cfg} ${day}: settled cut=${JSON.stringify(s?.cut?.map((c) => `${c.kind}:${c.text.slice(0, 24)}[${c.top}-${c.bottom}|F${c.F}-${c.fade}]`))} occl=${s?.occluded?.length} ovl=${s?.overlaps?.length} chai=${s?.chai?.shownAboveSheet} scroll=${s?.scroll?.top} | end last=${e?.lastUnit?.kind}:${e?.lastUnit?.status}[${e?.lastUnit?.bottom}|F${e?.F}] cut=${e?.cut?.length} | axe=${r.axe?.length}/${r.axeEnd?.length} err=${r.error ?? ''}${r.errors.length ? ' pageerr=' + r.errors.length : ''}`);
  }
} finally {
  writeFileSync(`${args.out}/${args.label}.json`, JSON.stringify(all, null, 1));
  await b.close();
}
