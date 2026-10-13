// Lane R (C) check 3 supplement: the summary-unlock card at "scene ready + 3.5 s", frame held, control vs trial, each side twice
// (c1 t1 c2 t2) so the control-vs-control difference is a baseline for the control-vs-trial difference.
// node unlockready.mjs --vp 1440x900@1 --look light --control URL --trial URL --reps 2 --out <dir>
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const [, W, H, DPR] = args.vp.match(/^(\d+)x(\d+)@(\d+)$/).map(Number);
const look = args.look ?? 'light';
const mobile = W < 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const AT = look === 'night' ? '2026-10-11T21:40:00Z' : '2026-10-11T07:40:00Z';
const theme = look === 'dark' ? 'dark' : 'light';
const extra = look === 'night' ? '&nooktime=night' : '';
const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 120_000 });
for (let rep = 1; rep <= +(args.reps ?? 2); rep++) {
  for (const [side, base] of [['control', args.control], ['trial', args.trial]]) {
    const dir = `${args.out}/${side}/${W}x${H}-${look}-r${rep}`;
    mkdirSync(dir, { recursive: true });
    const meta = { side, base, rep, vp: args.vp, look, startedAt: new Date().toISOString(), errors: [], glb: [] };
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
    const p = await ctx.newPage();
    await p.clock.install({ time: Date.parse(AT) });
    await p.clock.resume();
    p.on('pageerror', (e) => meta.errors.push(e.message.slice(0, 200)));
    p.on('request', (r) => { const u = new URL(r.url()); if (/\.glb$/i.test(u.pathname)) meta.glb.push(u.pathname); });
    try {
      await p.goto(`${base}/?debug&seed=celebrate&theme=${theme}${extra}#/`); await ready(p); await p.evaluate(() => document.fonts.ready);
      await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false })); await sleep(1500);
      const btn = p.getByRole('button', { name: /put the kettle on/i }).first();
      await btn.scrollIntoViewIfNeeded().catch(() => {}); await btn.click({ timeout: 30_000 });
      await sleep(3000);
      const t0 = Date.now();
      await p.evaluate(() => window.__kettle.finish());
      await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
      await p.waitForFunction(() => document.querySelector('section[aria-label^="Cozy level"] [data-scene-mode][data-scene-ready="true"]'), null, { timeout: 90_000, polling: 100 });
      meta.readyAtMs = Date.now() - t0;
      await sleep(3500);
      const sec = p.locator('section[aria-label^="Cozy level"]').first();
      await p.evaluate(() => { document.querySelector('section[aria-label^="Cozy level"]')?.scrollIntoView({ block: 'center' }); window.__nook?.setRunning(false); });
      await sleep(400);
      meta.facts = await p.evaluate(() => {
        const e = window.__nook;
        const sec = document.querySelector('section[aria-label^="Cozy level"]');
        const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
        return { engineInUnlockSection: !!e?.canvas?.closest('section[aria-label^="Cozy level"]'), mode: e?.state?.mode, chaiKind: e?.chaiKind ?? 'no field (control predates the model)', rootUserDataModel: e?.chai?.root?.userData?.model === true, quality: e?.quality, canvasRect: rect(e?.canvas), unlockRect: rect(sec), scrollY: Math.round(window.scrollY), hostReady: sec?.querySelector('[data-scene-mode]')?.getAttribute('data-scene-ready'), hash: location.hash, canvasSize: e ? [e.canvas.width, e.canvas.height] : null };
      });
      await p.screenshot({ path: `${dir}/ready+3.5s.png`, animations: 'disabled', timeout: 240_000 });
      meta.shotAtMs = Date.now() - t0;
    } catch (e) { meta.errors.push('SCRIPT: ' + e.message.slice(0, 240)); }
    meta.endedAt = new Date().toISOString();
    writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
    console.log(new Date().toISOString(), side, args.vp, look, 'rep', rep, JSON.stringify({ readyAtMs: meta.readyAtMs, kind: meta.facts?.chaiKind, model: meta.facts?.rootUserDataModel, rect: meta.facts?.canvasRect, errors: meta.errors.length }));
    await ctx.close();
  }
}
await b.close();
