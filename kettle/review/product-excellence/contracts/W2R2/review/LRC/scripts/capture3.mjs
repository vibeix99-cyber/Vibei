// Lane R (C) check 3: Nook and summary-unlock captures, control vs trial, alternating per config in one browser session.
// node capture3.mjs --vp 390x844@2 --looks light,dark,night --control http://127.0.0.1:5430 --trial http://127.0.0.1:5461 --out <captures dir>
// light = theme light, day;  dark = theme dark, day;  night = theme light + nooktime=night (the maker's three looks).
// Default tier (no nookq, no chai3d). Frozen clock (install + resume). Service workers blocked.
// Nook: shot 4 s after the room is ready (loop held for the shot, last frame stays up).
// Unlock: celebrate seed, "Put the kettle on", 3 s, window.__kettle.finish(); shots at 4 s and 10 s after the finish() call.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const [, W, H, DPR] = args.vp.match(/^(\d+)x(\d+)@(\d+)$/).map(Number);
const mobile = W < 900;
const LOOKS = args.looks.split(',');
const SIDES = [['control', args.control], ['trial', args.trial]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 120_000 });
const facts = (p) => p.evaluate(() => {
  const e = window.__nook;
  let chaiObj = null; e?.scene.traverse((o) => { if (o.name === 'chai') chaiObj = o; });
  const unlockSec = document.querySelector('section[aria-label^="Cozy level"]');
  return {
    hash: location.hash,
    quality: e?.quality ?? null,
    engineMode: e?.state?.mode ?? null,
    engineInUnlockSection: e?.canvas ? !!e.canvas.closest('section[aria-label^="Cozy level"]') : null,
    engineSectionLabel: e?.canvas?.closest('section')?.getAttribute('aria-label') ?? null,
    chaiKindField: e ? (e.chaiKind ?? 'no field (control predates the model)') : null,
    rootUserDataModel: e?.chai?.root?.userData?.model === true, sceneGraphChai: chaiObj ? { visible: chaiObj.visible, userDataModel: !!chaiObj.userData?.model, children: chaiObj.children.length } : null,
    chai3dStatus: window.__chai3d?.status?.() ?? null,
    hosts: [...document.querySelectorAll('[data-scene-mode]')].map((h) => ({ mode: h.getAttribute('data-scene-mode'), ready: h.getAttribute('data-scene-ready'), static: h.getAttribute('data-scene-static'), inSection: h.closest('section')?.getAttribute('aria-label') ?? null })),
    unlockRect: unlockSec ? (() => { const r = unlockSec.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() : null,
    canvasRect: e?.canvas?.isConnected ? (() => { const r = e.canvas.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() : null,
    scrollY: Math.round(window.scrollY),
    unlockText: unlockSec ? unlockSec.innerText.replace(/\s+/g, ' ').trim() : null,
    mainText: (document.querySelector('main') ?? document.body).innerText.replace(/\s+/g, ' ').trim().slice(0, 1500),
    canvasSize: e ? [e.canvas.width, e.canvas.height] : null,
    stats: e?.stats ? { ...e.stats } : null,
  };
});

async function oneGroup(side, base, look, kind, dir, meta) {
  const AT = look === 'night' ? '2026-10-11T21:40:00Z' : '2026-10-11T07:40:00Z';
  const theme = look === 'dark' ? 'dark' : 'light';
  const extra = look === 'night' ? '&nooktime=night' : '';
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.clock.install({ time: Date.parse(AT) });
  await p.clock.resume();
  const t00 = Date.now();
  const g = { glb: [], errors: [], consoleErr: [], states: {} };
  p.on('pageerror', (e) => g.errors.push(`${Date.now() - t00}ms ${e.message.slice(0, 200)}`));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') g.consoleErr.push(`${Date.now() - t00}ms ${m.type()}: ${m.text().slice(0, 200)}`); });
  p.on('request', (r) => { const u = new URL(r.url()); if (/\.glb$/i.test(u.pathname)) g.glb.push({ at: Date.now() - t00, url: u.pathname + u.search, hash: p.url().split('#')[1] ?? '' }); });
  const q = (seed) => `${base}/?debug&seed=${seed}&theme=${theme}${extra}`;
  const shot = async (name, hold) => {
    try {
      if (hold) await p.evaluate(() => window.__nook?.setRunning(false)).catch(() => {});
      const f = await facts(p);
      const s0 = Date.now();
      await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', timeout: 240_000 });
      g.states[name] = { ...f, sinceT0Ms: s0 - (g.t0 ?? t00), shotMs: Date.now() - s0, glbSoFar: g.glb.length };
    } catch (e) { g.errors.push(`${name}: ${e.message.slice(0, 160)}`); }
  };
  try {
    if (kind === 'nook') {
      await p.goto(q('veteran') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
      await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false })); await sleep(1200);
      await p.evaluate(() => window.__kettle.navigate('/nook'));
      await p.waitForSelector('section[aria-label="The room"] [data-scene-ready="true"]', { timeout: 120_000 });
      g.t0 = Date.now();
      await sleep(4000);
      await shot('nook-3d', true);
    } else {
      await p.goto(q('celebrate') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
      await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false })); await sleep(1500);
      const btn = p.getByRole('button', { name: /put the kettle on/i }).first();
      await btn.scrollIntoViewIfNeeded().catch(() => {}); await btn.click({ timeout: 30_000 });
      await sleep(3000);
      await p.evaluate(() => {
        window.__t = {}; const t0 = performance.now();
        const tick = () => {
          const u = document.querySelector('section[aria-label^="Cozy level"] [data-scene-mode]');
          if (location.hash.includes('done') && !window.__t.done) window.__t.done = performance.now() - t0;
          if (u && !window.__t.mounted) window.__t.mounted = performance.now() - t0;
          if (u?.getAttribute('data-scene-ready') === 'true' && !window.__t.ready) window.__t.ready = performance.now() - t0;
          if (performance.now() - t0 < 40000) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      g.t0 = Date.now();
      await p.evaluate(() => window.__kettle.finish());
      await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => g.errors.push('never reached #done'));
      g.doneAtMs = Date.now() - g.t0;
      const sec = () => p.locator('section[aria-label^="Cozy level"]').first();
      const until = async (ms) => { const w = g.t0 + ms - Date.now(); if (w > 0) await sleep(w); };
      if (args.fast) {
        // screenshot first (no scroll or evaluate in front of it), facts right after; the scroll is done at ~2.5 s and ~8 s
        const fastShot = async (name) => {
          const s0 = Date.now();
          try { await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', timeout: 240_000 }); } catch (e) { g.errors.push(`${name}: ${e.message.slice(0, 160)}`); }
          const s1 = Date.now();
          const f = await facts(p);
          g.states[name] = { ...f, sinceT0Ms: s0 - g.t0, shotDoneMs: s1 - g.t0, factsDoneMs: Date.now() - g.t0, glbSoFar: g.glb.length, fast: true };
        };
        await until(2500); await sec().scrollIntoViewIfNeeded().catch(() => {});
        await until(4000); await fastShot('unlock-4s');
        await until(8000); await sec().scrollIntoViewIfNeeded().catch(() => {});
        await until(10000); await fastShot('unlock-10s');
      } else {
      await until(4000);
      await sec().scrollIntoViewIfNeeded().catch(() => {});
      await shot('unlock-4s', false);
      await until(10000);
      await sec().scrollIntoViewIfNeeded().catch(() => {});
      await shot('unlock-10s', false);
      }
      const t = await p.evaluate(() => window.__t);
      g.unlockTiming = { doneMs: Math.round(t.done ?? -1), mountedAfterDoneMs: Math.round((t.mounted ?? NaN) - t.done), readyAfterDoneMs: Math.round((t.ready ?? NaN) - t.done) };
    }
  } catch (e) { g.errors.push(`${kind}: ${e.message.slice(0, 240)}`); }
  await ctx.close();
  meta[kind] = g;
}

for (const look of LOOKS) {
  for (const [side, base] of SIDES) {
    const dir = `${args.out}/${side}/${W}x${H}-${look}`;
    mkdirSync(dir, { recursive: true });
    const meta = { side, base, vp: args.vp, look, startedAt: new Date().toISOString() };
    for (const kind of (args.kinds ?? 'nook,unlock').split(',')) await oneGroup(side, base, look, kind, dir, meta);
    meta.endedAt = new Date().toISOString();
    writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
    console.log(new Date().toISOString(), side, args.vp, look, 'nook errs', meta.nook?.errors.length, 'unlock errs', meta.unlock?.errors.length, JSON.stringify(meta.unlock?.unlockTiming ?? null), 'shots', Object.keys(meta.nook?.states ?? {}).length + Object.keys(meta.unlock?.states ?? {}).length);
  }
}
await b.close();
