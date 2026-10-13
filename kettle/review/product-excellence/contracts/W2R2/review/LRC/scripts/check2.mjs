// Lane R (C) check 2: default-tier behaviour on the preview, no forcing (no nookq, no chai3d param).
// node check2.mjs --base http://127.0.0.1:5461 --out <file.json>
// Variants per viewport:
//   A  home -> nook (debug navigate): the Home pre-warm may already have fetched the model
//   B  cold load straight at #/nook
//   C  cold load at #/nook, the .glb data request held back until 1 s after the room is ready (guarantees the swap
//      happens inside the sampling window; the tier is still the default one)
// Per-frame probe (requestAnimationFrame, from document start): for every engine seen on window.__nook, counts the
// frames it was sampled and the frames in which the scene graph held no visible object named "chai".
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const base = args.base;
const VPS = [{ w: 390, h: 844, dpr: 2, mobile: true }, { w: 1440, h: 900, dpr: 1, mobile: false }];
const VARIANTS = (args.variants ?? 'A,B,C').split(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const out = { base, startedAt: new Date().toISOString(), runs: [] };

const PROBE = () => {
  const P = (window.__probe = { engines: [], t0: performance.now(), frames: 0, glbSeen: [] });
  const ids = new WeakMap();
  const tick = () => {
    P.frames++;
    const e = window.__nook;
    if (e && e.scene) {
      let rec = ids.get(e);
      const now = performance.now();
      if (!rec) {
        rec = { id: P.engines.length, mode: e.state?.mode ?? null, quality: e.quality, firstAt: Math.round(now - P.t0), sampled: 0, noChai: 0, noChaiAt: [], kindFirst: e.chaiKind ?? 'procedural', swapFrame: null, swapAt: null, framesIn3s: 0, noChaiIn3s: 0, firstKindIn3s: null, lastKind: null, canvasInDom: !!e.canvas?.isConnected };
        ids.set(e, rec);
        P.engines.push(rec);
        // Also count the engine's real renders (renderer.render calls) and those with no visible chai in the scene graph.
        rec.renders = 0; rec.rendersNoChai = 0; rec.rendersModel = 0; rec.rendersProcedural = 0;
        try {
          const r0 = e.renderer.render.bind(e.renderer);
          e.renderer.render = (sc, cam) => {
            rec.renders++;
            let has = false; sc.traverse((o) => { if (o.name === 'chai' && o.visible) has = true; });
            if (!has) rec.rendersNoChai++;
            if (e.chaiKind === 'model') rec.rendersModel++; else rec.rendersProcedural++;
            return r0(sc, cam);
          };
        } catch (err) { rec.renderHookError = String(err); }
      }
      let has = false, modelMesh = false;
      e.scene.traverse((o) => { if (o.name === 'chai' && o.visible) { has = true; if (o.userData && o.userData.model) modelMesh = true; } });
      rec.sampled++;
      const within = now - P.t0 - rec.firstAt <= 3000;
      if (within) { rec.framesIn3s++; if (rec.firstKindIn3s === null) rec.firstKindIn3s = e.chaiKind ?? 'procedural'; }
      if (!has) { rec.noChai++; if (rec.noChaiAt.length < 20) rec.noChaiAt.push(rec.sampled); if (within) rec.noChaiIn3s++; }
      const kind = e.chaiKind ?? 'procedural';
      if (rec.lastKind === 'procedural' && kind === 'model' && rec.swapFrame === null) { rec.swapFrame = rec.sampled; rec.swapAt = Math.round(now - P.t0 - rec.firstAt); }
      rec.lastKind = kind;
      rec.lastHasModelFlag = modelMesh; rec.lastRootModelFlag = e.chai?.root?.userData?.model === true; if (rec.firstRootModelFlag === undefined) rec.firstRootModelFlag = rec.lastRootModelFlag;
      rec.canvasInDom = !!e.canvas?.isConnected;
      rec.mode = e.state?.mode ?? rec.mode;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

for (const vp of VPS) {
  for (const v of VARIANTS) {
    const rec = { vp: `${vp.w}x${vp.h}@${vp.dpr}`, variant: v, errors: [], console: [], glb: [], failedReq: [], startedAt: new Date().toISOString() };
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr, isMobile: vp.mobile, hasTouch: vp.mobile, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
    await ctx.addInitScript(PROBE);
    const p = await ctx.newPage();
    await p.clock.install({ time: Date.parse('2026-10-11T07:40:00Z') });
    await p.clock.resume();
    const t0 = Date.now();
    p.on('pageerror', (e) => rec.errors.push(`${Date.now() - t0}ms ${e.message.slice(0, 200)}`));
    p.on('console', (m) => { const t = m.type(); const txt = m.text(); if (t === 'error' || t === 'warning' || /chai3d/i.test(txt)) rec.console.push(`${Date.now() - t0}ms ${t}: ${txt.slice(0, 220)}`); });
    p.on('requestfailed', (r) => rec.failedReq.push(`${Date.now() - t0}ms ${r.url().slice(0, 140)} ${r.failure()?.errorText}`));
    p.on('request', (r) => { const u = new URL(r.url()); if (/\.glb$/i.test(u.pathname)) rec.glb.push({ at: Date.now() - t0, url: u.pathname + u.search, type: r.resourceType(), nav: p.url().split('#')[1] ?? '' }); });
    p.on('response', (r) => { const u = new URL(r.url()); if (/\.glb$/i.test(u.pathname)) { const g = rec.glb.find((x) => x.url === u.pathname + u.search && x.status === undefined); if (g) { g.status = r.status(); g.fromSW = r.fromServiceWorker(); } } });
    let release;
    if (v === 'C' || v === 'D') {
      const held = new Promise((r) => (release = r));
      await p.route((u) => /\.glb$/i.test(u.pathname) && !u.search, async (r) => { await held; await r.continue().catch(() => {}); });
    }
    const q = '?debug&seed=veteran&theme=light';
    try {
      if (v === 'A') {
        await p.goto(`${base}/${q}#/`);
        await p.waitForFunction(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); }, null, { timeout: 120_000 });
        await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
        rec.beforeNook = { glbRequestsSoFar: rec.glb.length, scenePref: await p.evaluate(() => window.__kettle.settings.getState().scene), engineBeforeNavigate: await p.evaluate(() => (window.__nook ? { mode: window.__nook.state?.mode, kind: window.__nook.chaiKind } : null)) };
        await sleep(1500);
        rec.beforeNook.glbRequestsAfter1500ms = rec.glb.length;
        rec.navAt = Date.now() - t0;
        await p.evaluate(() => window.__kettle.navigate('/nook'));
      } else {
        await p.goto(`${base}/${q}#/nook`);
        rec.navAt = Date.now() - t0;
      }
      if (v === 'D') {
        // D: release 150 ms after the engine object exists (before its first frame is final), so the swap lands in the window
        await p.waitForFunction(() => !!window.__nook, null, { timeout: 120_000, polling: 25 });
        rec.engineAt = Date.now() - t0; await sleep(150); rec.releasedAt = Date.now() - t0; release();
      }
      await p.waitForSelector('section[aria-label="The room"] [data-scene-ready="true"]', { timeout: 120_000 });
      rec.readyAt = Date.now() - t0;
      if (v === 'C') { await sleep(1000); rec.releasedAt = Date.now() - t0; release(); }
      await sleep(6000);
      rec.facts = await p.evaluate(() => {
        const e = window.__nook;
        const host = document.querySelector('section[aria-label="The room"] [data-scene-mode]');
        let chaiObj = null; e?.scene.traverse((o) => { if (o.name === 'chai') chaiObj = o; });
        return {
          scenePref: window.__kettle.settings.getState().scene,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: navigator.deviceMemory ?? null,
          resolvedTier: e?.quality ?? null,
          chaiKind: e?.chaiKind ?? null,
          rootUserDataModel: e?.chai?.root?.userData?.model === true, rootName: e?.chai?.root?.name ?? null, rootInScene: (() => { let f = false; e?.scene.traverse((o) => { if (o === e.chai.root) f = true; }); return f; })(), sceneGraphChai: chaiObj ? { visible: chaiObj.visible, userDataModel: !!chaiObj.userData?.model, childCount: chaiObj.children.length } : null,
          chai3dStatus: window.__chai3d?.status?.() ?? null,
          hostAttrs: host ? { mode: host.getAttribute('data-scene-mode'), ready: host.getAttribute('data-scene-ready'), static: host.getAttribute('data-scene-static') } : null,
          canvasSize: e ? [e.canvas.width, e.canvas.height] : null,
          stats: e?.stats ?? null,
          hash: location.hash,
        };
      });
      rec.probe = await p.evaluate(() => ({ frames: window.__probe.frames, engines: window.__probe.engines, elapsedMs: Math.round(performance.now() - window.__probe.t0) }));
    } catch (e) {
      rec.errors.push('SCRIPT: ' + e.message.slice(0, 300));
    }
    rec.endedAt = new Date().toISOString();
    out.runs.push(rec);
    console.log(rec.vp, v, 'tier', rec.facts?.resolvedTier, 'kind', rec.facts?.chaiKind, 'glb', rec.glb.length, 'errors', rec.errors.length, 'engines', JSON.stringify((rec.probe?.engines ?? []).map((e) => [e.mode, e.sampled, e.noChai, e.swapFrame])));
    await ctx.close();
  }
}
out.endedAt = new Date().toISOString();
writeFileSync(args.out, JSON.stringify(out, null, 1));
await b.close();
