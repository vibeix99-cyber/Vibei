// Wave 2 · Maker N — same-session BEFORE / AFTER captures of the room states (I09), frozen start clock
// (page.clock.install 2026-10-11T07:40:00Z + resume), animations:'disabled', fresh context per state group.
// Mirrors the orchestrator's BEFORE script (.tmp/before/before.mjs) for the states this change touches.
// node capture.mjs --base http://127.0.0.1:5330 --out <dir> --label BEFORE --cfgs 390x844@3:light:100,... [--par 2]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cfgs = args.cfgs.split(',');
const PAR = +(args.par || 1);

async function runCfg({ cfg, label, base, out }) {
  const args2 = { ...args, label, base, out };
  const m = cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
  const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
  const dir = `${out}/${W}x${H}-${theme}-t${text}`;
  mkdirSync(dir, { recursive: true });
  const mobile = W < 900;
  const meta = { label, base, viewport: { w: W, h: H }, dpr: DPR, theme, text: `${text}%`, fixedTime: '2026-10-11T07:40:00Z', startedAt: new Date().toISOString(), states: {}, errors: [] };
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
  const q = (seed, extra = '') => `${base}/?debug&seed=${seed}&theme=${theme}${extra}`;
  const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
  const measure = (p) => p.evaluate(() => {
    const host = document.querySelector('[data-scene-mode="window"]');
    const layers = host ? [...host.querySelectorAll('image[data-item]')].map((i) => i.getAttribute('data-item')) : [];
    const stillImg = host?.querySelector('img');
    const hintEl = [...document.querySelectorAll('section[aria-label="The room"] p')].find((e) => /look around|drawing of your room/i.test(e.textContent || ''));
    return {
      hash: location.hash,
      backdrop: host ? { static: host.getAttribute('data-scene-static') ?? (host.getAttribute('data-scene-ready') === 'true' ? 'live' : 'loading'), still: stillImg ? (stillImg.currentSrc || stillImg.src).split('/').pop() : null, layers } : null,
      canvases: [...document.querySelectorAll('canvas')].map((c) => { const r = c.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }),
      hint: hintEl ? hintEl.textContent.trim() : null,
      cls: window.__cls ?? null,
      clsSources: window.__clsSrc ?? null,
    };
  });
  const shot = async (p, name, desc, full = false) => {
    try {
      await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', fullPage: full, timeout: 120_000 });
      meta.states[name] = { desc, ...(await measure(p)) };
    } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 120)}`); }
  };
  const click = async (p, name) => { const l = p.getByRole('button', { name }).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.click({ timeout: 30_000 }); };
  const settings = (p, s) => p.evaluate((x) => window.__kettle.settings.getState().set(x), s);
  const cls = (p) => p.evaluate(() => {
    window.__cls = 0; window.__clsSrc = [];
    const name = (n) => { if (!n || !n.tagName) return String(n && n.nodeName); const c = typeof n.className === 'string' ? n.className.split(' ')[0] : ''; return `${n.tagName.toLowerCase()}${c ? '.' + c : ''}${n.dataset?.sceneMode ? '[scene=' + n.dataset.sceneMode + ']' : ''}${n.closest?.('[data-scene-mode]') ? ' (in scene host)' : ''}`; };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__clsSrc.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).map((x) => name(x.node)) }); } }).observe({ type: 'layout-shift', buffered: false });
  });
  async function group(label, fn) {
    if (args.groups && !args.groups.split(',').includes(label)) return;
    const { ctx, p } = await context();
    try { await fn(p); } catch (e) { meta.errors.push(`${label}: ${e.message.slice(0, 160)}`); }
    await ctx.close();
  }
  try {
    await group('3d-on', async (p) => {
      await p.goto(q('veteran') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
      await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1500);
      await click(p, /put the kettle on/i); await sleep(4000);
      await shot(p, '02-focus', 'Focus, 4 s (3D on, default)');
      await p.evaluate(() => window.__kettle.finish());
      await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
      await sleep(1500); if (W === 375) await shot(p, '07-summary-routine', 'Summary, routine day, 1.5 s (375×667 backdrop question)');
      await click(p, /^skip break$/i).catch(() => {}); await sleep(1500);
      await p.evaluate(() => window.__kettle.navigate('/nook')); await sleep(7000);
      await shot(p, '10-nook-3d', 'Nook, 3D on');
    });
    await group('3d-off', async (p) => {
      await p.goto(q('veteran') + '#/'); await ready(p);
      await settings(p, { scene: 'off', muted: true, autoStartBreaks: false }); await p.reload(); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1200);
      await cls(p);
      await click(p, /put the kettle on/i); await sleep(4000);
      await shot(p, '02-focus-3doff', 'Focus, 3D off (pre-rendered still backdrop)');
      await p.evaluate(() => window.__kettle.finish()); await sleep(2500);
      await click(p, /^skip break$/i).catch(() => {}); await sleep(1200);
      await p.evaluate(() => window.__kettle.navigate('/nook')); await sleep(3000);
      await shot(p, '10-nook-static', 'Nook, 3D off (static room)');
    });
    await group('3d-loading', async (p) => {
      await p.goto(q('veteran') + '#/'); await p.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
      await settings(p, { muted: true, autoStartBreaks: false });
      await cls(p);
      await click(p, /put the kettle on/i); await sleep(500);
      await shot(p, '02-focus-loading', 'Focus 0.5 s after a cold start (3D loading)');
    });
    if (!args.nobig && (!args.bigcfgs || args.bigcfgs.split(',').includes(cfg))) await group('big-day', async (p) => {
      await p.goto(q('celebrate') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
      await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1200);
      await click(p, /put the kettle on/i); await sleep(2500);
      await p.evaluate(() => window.__kettle.finish());
      await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
      await sleep(4000); await shot(p, '07-summary-bigday', 'Summary, big day (unlock), 4 s');
    });
  } finally {
    meta.endedAt = new Date().toISOString();
    writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
    await b.close();
    console.log(label, `${W}x${H}-${theme}-t${text}`, 'states', Object.keys(meta.states).length, 'errors', meta.errors.length);
  }
}

const queue = cfgs.flatMap((cfg) => [{ cfg, label: 'BEFORE', base: args.before, out: args.outbefore }, { cfg, label: 'AFTER', base: args.after, out: args.outafter }]).filter((j) => !args.only || j.label === args.only);
await Promise.all(Array.from({ length: PAR }, async () => { while (queue.length) await runCfg(queue.shift()).catch((e) => console.log('job failed', e.message.slice(0, 200))); }));
