// W3R1 · N: Chai's face separation (eyes / nose vs the fur around them) in the real room, measured from the engine's
// own drawing buffer, plus full-size captures. One Chromium launch, one fresh context per config.
//
// For each config (viewport, theme, tier, time of day):
//  1. the Nook as people see it (default camera), loop stopped, reduced-motion time (fixed breath / no blink): screenshot;
//  2. measurement in that view and in a close view (C's art camera: the room's own direction moved in on Chai):
//     a. normal frame → gl.readPixels (what is drawn);
//     b. an id frame (same camera, same geometry, same depth): eyes red, nose blue, face fur green, everything else
//        black, transparent overlays hidden → gl.readPixels → masks;
//     c. regions: eye / nose pixels (eroded by 1 px), and a fur ring around each (face fur within ½ a feature
//        diameter of it, 1 px gap, eroded); medians of relative luminance Y (sRGB → linear) and CIE L*;
//     d. separation = WCAG contrast ratio (Y_ring + 0.05) / (Y_feature + 0.05) and ΔL* = L*_ring − L*_feature;
//  3. the normal frame's pixels are hashed (and saved raw for the day pixel-compare).
//   node sep.mjs --base http://127.0.0.1:5478 --label BEFORE --out <dir> [--vps 390x844@3,1440x900@2] [--tiers high,low]
//                [--times day,dusk,night] [--themes light,dark] [--raw <dir>]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const list = (k, d) => (args[k] ?? d).split(',');
const VPS = list('vps', '390x844@3,1440x900@2');
const TIERS = list('tiers', 'high,low');
const TIMES = list('times', 'day,dusk,night');
const THEMES = list('themes', 'light,dark');
const AT = '2026-10-12T07:40:00Z'; // PLAN frozen date; the time of day is the scene's own override (nooktime)
mkdirSync(args.out, { recursive: true });
if (args.raw) mkdirSync(args.raw, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const out = { label: args.label, base: args.base, clock: AT, startedAt: new Date().toISOString(), runs: [], errors: [] };

/** In-page: normal + id frame, regions and separation. `close` moves the camera in on Chai (C's art camera). */
const MEASURE = async ({ close, k }) => {
  const e = window.__nook;
  if (k != null) e.chai.setFill(k);
  e.setRunning(false);
  e.state.reducedMotion = true; // fixed t (STILL_T): same breath on both builds, no blink
  e.chai.setPose('awake');
  if (close) {
    e.fitTarget.set(-0.95, 0.82, 1.15);
    e.zoomT = e.zoomC = 0.2;
    e.targetC.copy(e.fitTarget);
  }
  const gl = e.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const read = () => {
    const px = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px;
  };
  e.frame(0);
  e.frame(0);
  const normal = read();
  // id frame
  let Basic = null;
  e.scene.traverse((o) => { const m = o.material; if (!Basic && m && !Array.isArray(m) && m.type === 'MeshBasicMaterial') Basic = m.constructor; });
  const mk = (hex) => { const m = Basic ? new Basic() : null; m.color.setHex(hex); m.toneMapped = false; m.fog = false; m.transparent = false; m.depthWrite = true; m.vertexColors = false; m.map = null; return m; };
  const ids = { black: mk(0x000000), eye: mk(0xff0000), nose: mk(0x0000ff), fur: mk(0x00ff00) };
  const eyeNodes = new Set();
  const eyesName = 'eyes_open';
  e.chai.root.getObjectByName(eyesName)?.traverse((o) => eyeNodes.add(o));
  const chaiSet = new Set(); e.chai.root.traverse((o) => chaiSet.add(o));
  const saved = [];
  e.scene.traverse((o) => {
    if (o.isMesh) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const transparent = mats.some((m) => m.transparent || m.blending !== 1 || m.depthWrite === false);
      saved.push([o, o.material, o.visible]);
      if (eyeNodes.has(o)) o.material = ids.eye;
      else if (o.name === 'mesh_0_1' && o.parent?.name === 'body') o.material = ids.nose;
      else if (o.name === 'mesh_0' && o.parent?.name === 'body') o.material = ids.fur;
      else o.visible = false; // only Chai's face parts are drawn (nothing stands between the camera and Chai's face in these views; the tap proxy would)
    } else if (o.isSprite || o.isPoints || o.isLine) {
      saved.push([o, o.material, o.visible]);
      o.visible = false;
    }
  });
  const bg = e.scene.background;
  e.scene.background = null;
  const cc = e.renderer.getClearColor(e.hemi.color.clone());
  const ca = e.renderer.getClearAlpha();
  e.renderer.setClearColor(0x000000, 1);
  // new programs: let them finish compiling (KHR_parallel_shader_compile skips objects whose program is not ready)
  if (e.renderer.compileAsync) await e.renderer.compileAsync(e.scene, e.camera);
  e.frame(0);
  await new Promise((r) => setTimeout(r, 200));
  e.frame(0);
  const idpx = read();
  const idCalls = e.renderer.info.render.calls;
  const visMeshes = []; e.scene.traverseVisible((o) => o.isMesh && visMeshes.push(o.name + ':' + o.material?.type + ':' + (o.material?.color?.getHexString?.() ?? '')));
  for (const [o, m, v] of saved) { o.material = m; o.visible = v; }
  e.scene.background = bg;
  e.renderer.setClearColor(cc, ca);
  for (const m of Object.values(ids)) m.dispose();
  e.frame(0);
  e.frame(0);

  // classes: 0 other, 1 eye, 2 nose, 3 fur
  const N = W * H;
  const cls = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = idpx[i * 4], g = idpx[i * 4 + 1], bl = idpx[i * 4 + 2];
    cls[i] = r > 200 && g < 60 && bl < 60 ? 1 : bl > 200 && r < 60 && g < 60 ? 2 : g > 200 && r < 60 && bl < 60 ? 3 : 0;
  }
  const eroded = (c) => {
    const m = new Uint8Array(N);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      m[i] = cls[i] === c && cls[i - 1] === c && cls[i + 1] === c && cls[i - W] === c && cls[i + W] === c ? 1 : 0;
    }
    return m;
  };
  const dilate = (src, n) => {
    let a = src;
    for (let k = 0; k < n; k++) {
      const d = new Uint8Array(N);
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        d[i] = a[i] || a[i - 1] || a[i + 1] || a[i - W] || a[i + W] ? 1 : 0;
      }
      a = d;
    }
    return a;
  };
  const raw = (c) => { const m = new Uint8Array(N); for (let i = 0; i < N; i++) m[i] = cls[i] === c ? 1 : 0; return m; };
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const Yof = (i) => 0.2126 * lin(normal[i * 4]) + 0.7152 * lin(normal[i * 4 + 1]) + 0.0722 * lin(normal[i * 4 + 2]);
  const Lstar = (Y) => (Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : (24389 / 27) * Y);
  const stats = (mask) => {
    const ys = [];
    const rgb = [0, 0, 0];
    for (let i = 0; i < N; i++) if (mask[i]) { ys.push(Yof(i)); rgb[0] += normal[i * 4]; rgb[1] += normal[i * 4 + 1]; rgb[2] += normal[i * 4 + 2]; }
    ys.sort((p, q) => p - q);
    const n = ys.length;
    if (!n) return { n: 0 };
    const Y = ys[Math.floor(n / 2)];
    const hex = '#' + rgb.map((s) => Math.round(s / n).toString(16).padStart(2, '0')).join('');
    return { n, Y: +Y.toFixed(5), L: +Lstar(Y).toFixed(2), p25L: +Lstar(ys[Math.floor(n * 0.25)]).toFixed(2), p75L: +Lstar(ys[Math.floor(n * 0.75)]).toFixed(2), meanHex: hex };
  };
  const furE = eroded(3);
  const feature = (c, perPiece) => {
    const core = eroded(c);
    const all = raw(c);
    let area = 0;
    for (let i = 0; i < N; i++) area += all[i];
    const d = Math.sqrt((4 * area) / perPiece / Math.PI);
    const rad = Math.max(2, Math.round(d * 0.5));
    const near = dilate(all, rad);
    const gap = dilate(all, 1);
    const ring = new Uint8Array(N);
    for (let i = 0; i < N; i++) ring[i] = near[i] && !gap[i] && furE[i] ? 1 : 0;
    const f = stats(core), r = stats(ring);
    const cr = f.n && r.n ? +((r.Y + 0.05) / (f.Y + 0.05)).toFixed(3) : null;
    const dL = f.n && r.n ? +(r.L - f.L).toFixed(2) : null;
    return { areaPx: area, ringRadPx: rad, feature: f, ring: r, contrast: cr, dL };
  };
  // a canvas-pixel hash input: the normal frame (FNV-1a over all bytes)
  let h = 0x811c9dc5;
  for (let i = 0; i < normal.length; i++) { h ^= normal[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  let b64 = null;
  if (window.__wantRaw) { let s = ''; for (let i = 0; i < normal.length; i += 0x8000) s += String.fromCharCode.apply(null, normal.subarray(i, i + 0x8000)); b64 = btoa(s); }
  return {
    buffer: [W, H], quality: e.quality, chaiKind: e.chaiKind, exposure: e.renderer.toneMappingExposure, fnv: h.toString(16),
    dbg: (() => { const c=[0,0,0,0]; void 0; for (let i=0;i<N;i++) c[cls[i]]++; const u=new Map(); for (let i=0;i<N;i+=97){const k=idpx[i*4]+','+idpx[i*4+1]+','+idpx[i*4+2]+','+idpx[i*4+3]; u.set(k,(u.get(k)??0)+1);} return {c, names:[...chaiSet].filter(o=>o.isMesh).map(o=>o.name+'/'+o.parent?.name+'/'+o.visible), u:[...u.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8), basic: !!Basic, idCalls, visMeshes, saved: saved.length, eyeNodes: eyeNodes.size}; })(),
    eyes: feature(1, 2), nose: feature(2, 1), fur: stats(furE), b64,
  };
};

for (const vp of VPS) for (const theme of THEMES) for (const tier of TIERS) for (const time of TIMES) {
  const [, w, h, dpr] = vp.match(/^(\d+)x(\d+)@(\d+)$/).map(Number);
  const mobile = w < 900;
  const name = `${w}x${h}-${theme}-${tier}-${time}`;
  const rec = { name, vp, theme, tier, time, errors: [] };
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.on('pageerror', (er) => rec.errors.push(er.message.slice(0, 200)));
  await p.clock.install({ time: Date.parse(AT) });
  await p.clock.resume();
  try {
    await p.goto(`${args.base}/?debug&seed=veteran&theme=${theme}&nookq=${tier}&nooktime=${time}&nookweather=clear&chai3d=model#/nook`);
    await p.waitForSelector('section[aria-label="The room"] [data-scene-ready="true"]', { timeout: 120_000 });
    await p.waitForFunction(() => window.__nook?.chaiKind === 'model', null, { timeout: 30_000 });
    await sleep(2500);
    if (args.ks) {
      // tuning: the close view at several fills (this build's setFill), face crops + numbers
      rec.tune = [];
      for (const k of args.ks.split(',').map(Number)) {
        const m = await p.evaluate(MEASURE, { close: true, k });
        delete m.b64; delete m.dbg;
        rec.tune.push({ k, eyes: m.eyes, nose: m.nose, fur: m.fur });
        const clip = await p.evaluate(() => {
          const e = window.__nook;
          const r = e.canvas.getBoundingClientRect();
          const v = e.chai.root.position.clone(); v.y += 0.55; v.project(e.camera);
          const cx = r.left + ((v.x + 1) / 2) * r.width, cy = r.top + ((1 - v.y) / 2) * r.height;
          const s = Math.min(r.width, r.height) * 0.62;
          return { x: Math.max(r.left, cx - s / 2), y: Math.max(r.top, cy - s / 2), width: s, height: s };
        });
        await p.screenshot({ path: `${args.out}/${name}-k${k}.png`, clip, timeout: 240_000 });
        console.log(name, 'k', k, 'eyes CR', m.eyes.contrast, 'dL', m.eyes.dL, '| nose CR', m.nose.contrast, 'dL', m.nose.dL, '| ring L', m.eyes.ring.L, m.nose.ring.L, m.eyes.ring.meanHex);
      }
      out.runs.push(rec);
      await ctx.close();
      continue;
    }
    if (args.raw && time === 'day') await p.evaluate(() => (window.__wantRaw = true));
    const nook = await p.evaluate(MEASURE, { close: false });
    await p.screenshot({ path: `${args.out}/${name}-nook.png`, timeout: 240_000 });
    let closeM = null;
    if (!mobile) {
      closeM = await p.evaluate(MEASURE, { close: true });
      // full-size face crop around Chai's head (same projection as C's art renders)
      const clip = await p.evaluate(() => {
        const e = window.__nook;
        const r = e.canvas.getBoundingClientRect();
        const v = e.chai.root.position.clone(); v.y += 0.55; v.project(e.camera);
        const cx = r.left + ((v.x + 1) / 2) * r.width, cy = r.top + ((1 - v.y) / 2) * r.height;
        const s = Math.min(r.width, r.height) * 0.62;
        return { x: Math.max(r.left, cx - s / 2), y: Math.max(r.top, cy - s / 2), width: s, height: s };
      });
      await p.screenshot({ path: `${args.out}/${name}-face.png`, clip, timeout: 240_000 });
    }
    for (const [k, m] of [['nook', nook], ['close', closeM]]) {
      if (!m) continue;
      if (m.b64 && args.raw) writeFileSync(`${args.raw}/${name}-${k}.rgba.gz`, gzipSync(Buffer.from(m.b64, 'base64')));
      delete m.b64;
    }
    Object.assign(rec, { nook, close: closeM });
    const s = (m) => (m ? `eyes CR ${m.eyes.contrast} dL ${m.eyes.dL} | nose CR ${m.nose.contrast} dL ${m.nose.dL} | ${m.quality} ${m.chaiKind}` : '-');
    console.log(new Date().toISOString(), args.label, name, 'nook:', s(nook), ' close:', s(closeM), rec.errors.length ? 'ERR ' + rec.errors.join('|') : '');
  } catch (er) {
    rec.errors.push('SCRIPT: ' + er.message.slice(0, 300));
    console.log(name, 'FAILED', er.message.slice(0, 200));
  }
  out.runs.push(rec);
  writeFileSync(`${args.out}/sep-${args.label}.json`, JSON.stringify(out, null, 1)); // after every config
  await ctx.close();
}
out.endedAt = new Date().toISOString();
writeFileSync(`${args.out}/sep-${args.label}.json`, JSON.stringify(out, null, 1));
await b.close();
