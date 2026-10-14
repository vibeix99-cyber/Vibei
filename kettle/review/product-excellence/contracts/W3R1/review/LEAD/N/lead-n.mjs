// LEAD-4 · W3R1 N: my own frames of Chai's face, base vs trial, as people see the Nook (default camera), plus the
// separation numbers with the maker's MEASURE function (copied verbatim from W3R1/N/scripts/sep.mjs, which I read),
// loaded through the URL path only (no setFill injection). One Chromium launch, one fresh context per config.
//   node lead-n.mjs --base http://127.0.0.1:5524 --label TRIAL --out <dir> --cfgs 390x844@3:light:default:day,...
// cfg = <w>x<h>@<dpr>:<theme>:<tier high|low|default>:<day|dusk|night>[:close]
import { chromium } from '/home/user/wt/w5tr-n/kettle/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const AT = '2026-10-12T07:40:00Z';
mkdirSync(args.out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const out = { label: args.label, base: args.base, clock: AT, startedAt: new Date().toISOString(), runs: [] };
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


const faceClip = (scale) => {
  const e = window.__nook;
  const r = e.canvas.getBoundingClientRect();
  const foot = e.chai.root.position.clone();
  const top = foot.clone(); top.y += 1.15;
  const mid = foot.clone(); mid.y += 0.62;
  const P = (v) => { const q = v.clone().project(e.camera); return [r.left + ((q.x + 1) / 2) * r.width, r.top + ((1 - q.y) / 2) * r.height]; };
  const [, fy] = P(foot), [, ty] = P(top), [cx, cy] = P(mid);
  const s = Math.max(40, Math.abs(fy - ty) * scale);
  const x = Math.max(0, cx - s / 2), y = Math.max(0, cy - s / 2);
  return { x, y, width: Math.min(s, innerWidth - x), height: Math.min(s, innerHeight - y), chaiPx: Math.abs(fy - ty) };
};
for (const cfg of args.cfgs.split(',')) {
  const [vp, theme, tier, time, close] = cfg.split(':');
  const [, w, h, dpr] = vp.match(/^(\d+)x(\d+)@(\d+)$/).map(Number);
  const mobile = w < 900;
  const name = `${w}x${h}-${theme}-${tier}-${time}`;
  const rec = { name, cfg, errors: [] };
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile && w < h, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.on('pageerror', (er) => rec.errors.push(er.message.slice(0, 200)));
  await p.clock.install({ time: Date.parse(AT) });
  await p.clock.resume();
  const t0 = Date.now();
  try {
    const tq = tier === 'default' ? '' : `&nookq=${tier}`;
    await p.goto(`${args.base}/?debug&seed=veteran&theme=${theme}${tq}&nooktime=${time}&nookweather=clear#/nook`);
    await p.waitForSelector('section[aria-label="The room"] [data-scene-ready="true"]', { timeout: 150_000 });
    await p.waitForFunction(() => window.__nook?.chaiKind === 'model', null, { timeout: 60_000 });
    await sleep(2500);
    rec.fill = await p.evaluate(() => { const s = new Set(); window.__nook.chai.root.traverse((o) => { if (o.isMesh && o.material?.name === 'chai_fur') s.add(+o.material.emissiveIntensity.toFixed(4)); }); return [...s]; });
    rec.exposure = await p.evaluate(() => window.__nook.renderer.toneMappingExposure);
    const canvasFilter = await p.evaluate(() => { const c = window.__nook.canvas; return getComputedStyle(c).filter + ' | ' + getComputedStyle(c.parentElement).filter; });
    rec.canvasFilter = canvasFilter;
    const nook = await p.evaluate(MEASURE, { close: false });
    delete nook.b64; delete nook.dbg;
    await p.screenshot({ path: `${args.out}/${name}-nook.png`, timeout: 240_000 });
    const clip = await p.evaluate(faceClip, 0.75);
    rec.chaiPx = clip.chaiPx; delete clip.chaiPx;
    await p.screenshot({ path: `${args.out}/${name}-face.png`, clip, timeout: 240_000 });
    let closeM = null;
    if (close) {
      closeM = await p.evaluate(MEASURE, { close: true });
      delete closeM.b64; delete closeM.dbg;
      const c2 = await p.evaluate(() => {
        const e = window.__nook; const r = e.canvas.getBoundingClientRect();
        const v = e.chai.root.position.clone(); v.y += 0.55; v.project(e.camera);
        const cx = r.left + ((v.x + 1) / 2) * r.width, cy = r.top + ((1 - v.y) / 2) * r.height;
        const s = Math.min(r.width, r.height) * 0.62;
        return { x: Math.max(r.left, cx - s / 2), y: Math.max(r.top, cy - s / 2), width: s, height: s };
      });
      await p.screenshot({ path: `${args.out}/${name}-close.png`, clip: c2, timeout: 240_000 });
    }
    Object.assign(rec, { nook, close: closeM, ms: Date.now() - t0 });
    const s = (m) => (m ? `eyes ${m.eyes.contrast}/${m.eyes.dL} nose ${m.nose.contrast}/${m.nose.dL} ringL ${m.eyes.ring.L} ${m.eyes.ring.meanHex} ${m.quality} ${m.chaiKind}` : '-');
    console.log(new Date().toISOString(), args.label, name, 'fill', rec.fill, 'exp', rec.exposure, 'nook:', s(nook), 'close:', s(closeM), rec.errors.join('|'));
  } catch (er) {
    rec.errors.push('SCRIPT: ' + er.message.slice(0, 300));
    console.log(name, 'FAILED', er.message.slice(0, 200));
  }
  out.runs.push(rec);
  writeFileSync(`${args.out}/lead-${args.label}.json`, JSON.stringify(out, null, 1));
  await ctx.close();
}
out.endedAt = new Date().toISOString();
writeFileSync(`${args.out}/lead-${args.label}.json`, JSON.stringify(out, null, 1));
await b.close();
