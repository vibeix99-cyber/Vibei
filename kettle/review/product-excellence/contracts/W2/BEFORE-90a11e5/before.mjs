// Wave 2 round 1 — BEFORE captures on 90a11e5 (orchestrator). One browser per invocation (run under the slot gate).
// Frozen start clock (page.clock.install + resume), animations:'disabled' screenshots, fresh profile per state group.
// node before.mjs --base http://127.0.0.1:5330 --out <dir> --cfg 390x844@2:light:100
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
const dir = `${args.out}/${W}x${H}-${theme}-t${text}`;
mkdirSync(dir, { recursive: true });
const mobile = W < 900;
const meta = { base: args.base, rev: '90a11e5 (kettle/src 42e106d), production preview', viewport: { w: W, h: H }, dpr: DPR, theme, text: `${text}%`, fixedTime: '2026-10-11T07:40:00Z', states: {}, errors: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function context() {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  p.on('pageerror', (e) => meta.errors.push(e.message.slice(0, 200)));
  return { ctx, p };
}
const q = (seed, extra = '') => `${args.base}/?debug&seed=${seed}&theme=${theme}${extra}`;
const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
const measure = (p) => p.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight; };
  const rect = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const buttons = [...document.querySelectorAll('button,[role=button],[role=radio],a[href]')].filter(vis).map((e) => ({ name: (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50), box: rect(e) }));
  const imgs = [...document.querySelectorAll('img')].filter(vis).map((i) => ({ src: (i.currentSrc || i.src).split('/').pop().slice(0, 40), box: rect(i) }));
  const canvases = [...document.querySelectorAll('canvas')].filter(vis).map((c) => ({ box: rect(c) }));
  const pills = [...document.querySelectorAll('[aria-label="Rewards"] li')].map((li) => ({ text: li.innerText.replace(/\s+/g, ' ').slice(0, 60), box: rect(li) }));
  const hint = [...document.querySelectorAll('p,span,div')].find((e) => e.childElementCount <= 2 && /look around/i.test(e.textContent || ''));
  return { hash: location.hash, scroll: Math.round(document.scrollingElement.scrollTop), buttons, imgs, canvases, pills, hint: hint ? hint.textContent.trim() : null };
});
const shot = async (p, name, desc, full = false) => {
  try {
    await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', fullPage: full, timeout: 120_000 });
    meta.states[name] = { desc, ...(await measure(p)) };
  } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 120)}`); }
};
const click = async (p, name) => { const l = p.getByRole('button', { name }).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.click({ timeout: 30_000 }); };
const settings = (p, s) => p.evaluate((x) => window.__kettle.settings.getState().set(x), s);

async function group(label, fn) {
  const { ctx, p } = await context();
  try { await fn(p); } catch (e) { meta.errors.push(`${label}: ${e.message.slice(0, 160)}`); }
  await ctx.close();
}

try {
  // First visit (fresh profile, not onboarded)
  await group('first-visit', async (p) => {
    await p.goto(q('fresh', '&onboarded=0') + '#/welcome'); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1500);
    await shot(p, '00-first-visit', 'First visit (fresh profile)');
    await shot(p, '00-first-visit-full', 'First visit, full page', true);
  });
  // Home + routine summary + static Nook + 3D Nook (veteran)
  await group('home-summary', async (p) => {
    await p.goto(q('veteran') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1500);
    await shot(p, '01-home', 'Home (veteran), first viewport');
    await shot(p, '01-home-full', 'Home, full page', true);
    await click(p, /put the kettle on/i); await sleep(4000);
    await shot(p, '02-focus', 'Focus, 4 s (3D on, default)');
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
    await sleep(1500); await shot(p, '07-summary-routine', 'Summary, routine day, 1.5 s');
    await sleep(3000); await shot(p, '07-summary-routine-settled', 'Summary, routine day, 4.5 s');
    await shot(p, '07-summary-routine-full', 'Summary, routine day, full page', true);
    await click(p, /^skip break$/i).catch(() => {}); await sleep(1500);
    await p.evaluate(() => window.__kettle.navigate('/nook')); await sleep(7000);
    await shot(p, '10-nook-3d', 'Nook, 3D on');
  });
  // 3D off: focus backdrop still + static Nook
  await group('3d-off', async (p) => {
    await p.goto(q('veteran') + '#/'); await ready(p);
    await settings(p, { scene: 'off', muted: true, autoStartBreaks: false }); await p.reload(); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1200);
    await click(p, /put the kettle on/i); await sleep(4000);
    await shot(p, '02-focus-3doff', 'Focus, 3D off (pre-rendered still backdrop)');
    await p.evaluate(() => window.__kettle.finish()); await sleep(2500);
    await click(p, /^skip break$/i).catch(() => {}); await sleep(1200);
    await p.evaluate(() => window.__kettle.navigate('/nook')); await sleep(3000);
    await shot(p, '10-nook-static', 'Nook, 3D off (static room)');
  });
  // 3D loading: brew started right after a cold load (backdrop before the engine is ready)
  await group('3d-loading', async (p) => {
    await p.goto(q('veteran') + '#/'); await p.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
    await settings(p, { muted: true, autoStartBreaks: false });
    await click(p, /put the kettle on/i); await sleep(500);
    await shot(p, '02-focus-loading', 'Focus 0.5 s after a cold start (3D loading)');
  });
  // Big day: celebrate seed (level-up + unlock + streak milestone + badges)
  await group('big-day', async (p) => {
    await p.goto(q('celebrate') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1200);
    await click(p, /put the kettle on/i); await sleep(2500);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
    await sleep(4000); await shot(p, '07-summary-bigday', 'Summary, big day (unlock), 4 s');
    await sleep(6000); await shot(p, '07-summary-bigday-settled', 'Summary, big day, 10 s');
    await shot(p, '07-summary-bigday-full', 'Summary, big day, full page', true);
  });
} finally {
  writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(`${W}x${H}-${theme}-t${text}`, 'states', Object.keys(meta.states).length, 'errors', meta.errors.length);
}
