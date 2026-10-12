// I06 BEFORE/AFTER captures: the Nook (3D) and the summary unlock (drawing → close-up), one config per run.
// Frozen start clock (page.clock.install + resume), fresh context per group, serviceWorkers blocked, high tier forced
// with `nookq=high` on both servers (the low tier keeps the procedural Chai by design; see the packet).
// Unlock timing: from the Done route to the unlock card's `data-scene-ready="true"` (the drawing → close-up hand-off).
//   node capture.mjs --base http://127.0.0.1:5433 --label AFTER --out <dir> --cfg 390x844@3:light:day [--extra "&chai3d=model"]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(day|night)$/);
const [W, H, DPR, theme, tod] = [+m[1], +m[2], +m[3], m[4], m[5]];
const AT = tod === 'night' ? '2026-10-11T21:40:00Z' : '2026-10-11T07:40:00Z';
const dir = `${args.out}/${W}x${H}-${theme}-${tod}`;
mkdirSync(dir, { recursive: true });
const mobile = W < 900;
// NOTE: the debug seeds pin the time of day (progress/seed.ts pinTimeOfDay), so the clock alone does not make a night
// room; night runs pass --extra "&nooktime=night" (the scene's own override).
const meta = { label: args.label, base: args.base, viewport: { w: W, h: H }, dpr: DPR, theme, clock: AT, query: `nookq=high${args.extra ?? ''}`, startedAt: new Date().toISOString(), states: {}, errors: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
async function context() {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.clock.install({ time: Date.parse(AT) });
  await p.clock.resume();
  p.on('pageerror', (e) => meta.errors.push(e.message.slice(0, 200)));
  return { ctx, p };
}
const q = (seed) => `${args.base}/?debug&seed=${seed}&theme=${theme}&nookq=high${args.extra ?? ''}`;
const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 90_000 }).catch(() => {});
const facts = (p) => p.evaluate(() => ({ hash: location.hash, chaiKind: window.__nook ? (window.__nook.chaiKind ?? 'procedural (no field: control)') : null, chai3d: window.__chai3d?.status?.() ?? null, stats: window.__nook?.stats ?? null, hosts: [...document.querySelectorAll('[data-scene-mode]')].map((h) => ({ mode: h.getAttribute('data-scene-mode'), ready: h.getAttribute('data-scene-ready'), static: h.getAttribute('data-scene-static') })) }));
const shot = async (p, name, desc, hold = true) => {
  try {
    // Hold the live frame for the screenshot (a CPU rasterizer at full size is slow); the last frame stays up.
    if (hold) await p.evaluate(() => window.__nook?.setRunning(false)).catch(() => {});
    const f = await facts(p);
    await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', timeout: 240_000 });
    meta.states[name] = { desc, ...f };
  } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 160)}`); }
};
const click = async (p, name) => { const l = p.getByRole('button', { name }).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.click({ timeout: 30_000 }); };
const settings = (p, s) => p.evaluate((x) => window.__kettle.settings.getState().set(x), s);
async function group(label, fn) {
  const { ctx, p } = await context();
  try { await fn(p); } catch (e) { meta.errors.push(`${label}: ${e.message.slice(0, 200)}`); }
  await ctx.close();
}
try {
  await group('nook', async (p) => {
    await p.goto(q('veteran') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1200);
    await p.evaluate(() => window.__kettle.navigate('/nook'));
    await p.waitForSelector('section[aria-label="The room"] [data-scene-ready="true"]', { timeout: 120_000 }).catch(() => meta.errors.push('nook: not ready'));
    await sleep(4000);
    await shot(p, '10-nook-3d', 'Nook, 3D (high tier), 4 s after ready');
    // Chai close (debug camera, for the art review only): the cushion, from the room's own camera direction
    await p.evaluate(() => { const e = window.__nook; e.fitTarget.set(-0.95, 0.85, 1.15); e.zoomT = 0.22; e.zoomC = 0.22; e.targetC.copy(e.fitTarget); e.invalidate(); });
    await sleep(1500);
    await shot(p, '11-nook-chai-close', 'Nook, the same camera direction moved in on Chai (debug camera; art review)', false);
  });
  await group('unlock', async (p) => {
    await p.goto(q('celebrate') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1500);
    await click(p, /put the kettle on/i); await sleep(3000);
    await p.evaluate(() => {
      window.__t = {};
      const t0 = performance.now();
      const tick = () => {
        const u = document.querySelector('section[aria-label^="Cozy level"] [data-scene-mode]');
        if (location.hash.includes('done') && !window.__t.done) window.__t.done = performance.now() - t0;
        if (u && !window.__t.mounted) window.__t.mounted = performance.now() - t0;
        if (u?.getAttribute('data-scene-ready') === 'true' && !window.__t.ready) window.__t.ready = performance.now() - t0;
        if (performance.now() - t0 < 30000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
    await sleep(900);
    await shot(p, '07-unlock-early', 'Summary unlock, ~0.9 s after Done (drawing or hand-off)', false);
    await p.waitForFunction(() => !!window.__t.ready, null, { timeout: 60_000 }).catch(() => meta.errors.push('unlock: scene never ready'));
    await sleep(3500);
    const t = await p.evaluate(() => window.__t);
    meta.unlockTiming = { doneMs: Math.round(t.done ?? -1), mountedAfterDoneMs: Math.round((t.mounted ?? NaN) - t.done), readyAfterDoneMs: Math.round((t.ready ?? NaN) - t.done) };
    const sec = p.locator('section[aria-label^="Cozy level"]').first();
    await sec.scrollIntoViewIfNeeded().catch(() => {});
    await shot(p, '07-unlock', 'Summary unlock close-up, 3.5 s after the scene was ready');
  });
} finally {
  meta.endedAt = new Date().toISOString();
  writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(args.label, args.cfg, 'states', Object.keys(meta.states).length, 'errors', meta.errors.length, JSON.stringify(meta.unlockTiming ?? null));
}
