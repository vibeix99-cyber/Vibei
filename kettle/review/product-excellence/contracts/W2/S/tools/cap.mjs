// W2 Maker S — same-session BEFORE/AFTER summary captures (adapted from the orchestrator's before.mjs).
// Frozen start clock (page.clock.install + resume), animations:'disabled' screenshots, fresh profile per day.
// node cap.mjs --base http://127.0.0.1:5330 --rev "90a11e5 …" --out <dir> --cfgs 390x844@2:light:100,…
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { measureInPage } from './measure.mjs';
const require = createRequire('/home/user/wt/w2s/kettle/package.json');
const { chromium } = require('playwright');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const AXE = '/home/user/wt/w2s/kettle/node_modules/axe-core/axe.min.js';
const axeRun = async (p) => {
  if (!(await p.evaluate(() => !!window.axe))) await p.addScriptTag({ path: AXE });
  return p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) }));
  });
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function one(cfg) {
  const m = cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
  const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
  const dir = `${args.out}/${W}x${H}-${theme}-t${text}`;
  mkdirSync(dir, { recursive: true });
  const mobile = W < 900;
  const meta = { base: args.base, rev: args.rev, viewport: { w: W, h: H }, dpr: DPR, theme, text: `${text}%`, fixedTime: '2026-10-11T07:40:00Z', states: {}, errors: [] };
  async function context() {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
    if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
    const p = await ctx.newPage();
    await p.clock.install({ time: FIXED });
    await p.clock.resume();
    p.on('pageerror', (e) => meta.errors.push(e.message.slice(0, 200)));
    return { ctx, p };
  }
  const q = (seed) => `${args.base}/?debug&seed=${seed}&theme=${theme}`;
  const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
  const shot = async (p, name, desc, full = false) => {
    try {
      await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', fullPage: full, timeout: 120_000 });
      meta.states[name] = { desc, ...(await p.evaluate(measureInPage, { PEEK: 6, phase: name })) };
      if (/settled|end/.test(name)) meta.states[name].axe = await axeRun(p);
    } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 160)}`); }
  };
  const settings = (p, s) => p.evaluate((x) => window.__kettle.settings.getState().set(x), s);
  const toEnd = async (p) => {
    const r = meta.states[Object.keys(meta.states).at(-1)]?.scroll?.rect;
    if (!r) return;
    const cx = r[0] + r[2] / 2, cy = r[1] + Math.min(r[3] - 40, Math.max(40, r[3] * 0.75));
    await p.mouse.move(cx, cy);
    for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 240); await sleep(60); }
    await sleep(400);
    await p.getByRole('button', { name: /How your leaves added up/ }).click({ timeout: 10_000 });
    await sleep(300);
    await p.mouse.move(cx, cy);
    for (let i = 0; i < 16; i++) { await p.mouse.wheel(0, 240); await sleep(60); }
    await sleep(700);
  };
  async function group(label, fn) {
    const { ctx, p } = await context();
    try { await fn(p); } catch (e) { meta.errors.push(`${label}: ${e.message.slice(0, 160)}`); }
    await ctx.close();
  }
  try {
    await group('routine', async (p) => {
      await p.goto(q('veteran') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
      await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1500);
      const l = p.getByRole('button', { name: /put the kettle on/i }).first(); await l.click({ timeout: 30_000 });
      await sleep(4000);
      await p.evaluate(() => window.__kettle.finish());
      await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
      await sleep(1500); await shot(p, '07-summary-routine', 'Summary, routine day, 1.5 s');
      await sleep(3000); await shot(p, '07-summary-routine-settled', 'Summary, routine day, 4.5 s');
      await shot(p, '07-summary-routine-full', 'Summary, routine day, full page', true);
      await toEnd(p); await shot(p, '07-summary-routine-end', 'Summary, routine day, arithmetic open, wheeled to the end');
    });
    await group('big-day', async (p) => {
      await p.goto(q('celebrate') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
      await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1200);
      const l = p.getByRole('button', { name: /put the kettle on/i }).first(); await l.click({ timeout: 30_000 });
      await sleep(2500);
      await p.evaluate(() => window.__kettle.finish());
      await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
      await sleep(4000); await shot(p, '07-summary-bigday', 'Summary, big day (unlock), 4 s');
      await sleep(6000); await shot(p, '07-summary-bigday-settled', 'Summary, big day, 10 s');
      await shot(p, '07-summary-bigday-full', 'Summary, big day, full page', true);
      await toEnd(p); await shot(p, '07-summary-bigday-end', 'Summary, big day, arithmetic open, wheeled to the end');
    });
  } finally {
    writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
    console.log(args.rev.split(' ')[0], `${W}x${H}-${theme}-t${text}`, 'states', Object.keys(meta.states).length, 'errors', meta.errors.length, meta.errors.join(' ; ').slice(0, 300));
  }
}

try {
  for (const cfg of args.cfgs.split(',')) await one(cfg);
} finally {
  await b.close();
}
