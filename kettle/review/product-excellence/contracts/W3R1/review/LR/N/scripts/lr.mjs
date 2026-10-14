// W3R1 · Lane R (LR) · Maker N: independent capture + separation probe for Chai's face (eyes / nose vs the fur around them).
// Written by the reviewer lane; it does NOT use the maker's id-frame masks. Masks here come from "hide-diff" frames:
//   N  = the normal frame (gl.readPixels of the engine's own drawing buffer, after tone mapping)
//   Hn = same frame with the eyes hidden / nose hidden / every non-fur Chai part hidden / the whole Chai hidden
//   a pixel belongs to the part when |N - Hx| > threshold on any channel. Eyes / nose / non-fur / Chai masks follow.
//   fur = Chai pixels that are not non-fur parts (eroded 1 px); ring around a feature = fur within r px of it,
//   with a 1 px gap. r = round(0.5 x feature diameter) (like the maker) and a second ring of r = 1 x diameter.
// The hide is done with mesh.visible after neutralising chai.update (it would re-toggle eyes_open/closed each frame).
//   node lr.mjs --base http://127.0.0.1:5534 --label TRIAL --out DIR --cfgs "1440x900@1:light:high,..." [--times day,dusk,night]
//        [--init day] [--views nook,close] [--raw RAWDIR] [--shots 1] [--text 100|200] [--rm 1] [--nochai3d 1]
// Time of day: the scene's own debug override ?nooktime= for the first time of a context (the product path); later times in
// the same context use engine.setState({time}) with the loop stopped (the same call React makes), which applies at once.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const CFGS = (args.cfgs ?? '1440x900@1:light:high').split(',');
const TIMES = (args.times ?? 'day,dusk,night').split(',');
const INIT = args.init ?? TIMES[0];
const VIEWS = ['nook', 'close'].filter((v) => (args.views ?? 'nook,close').split(',').includes(v)); // nook (default camera) always before close: the close camera persists in the engine
const SHOTS = (args.shots ?? '1') === '1';
const SHOTVIEWS = (args.shotviews ?? 'nook,close').split(',');
const TEXT = +(args.text ?? 100);
const RM = (args.rm ?? '1') === '1';
const AT = '2026-10-12T07:40:00Z'; // PLAN frozen date (a Monday); the hour is the scene's own override
mkdirSync(args.out, { recursive: true });
if (args.raw) mkdirSync(args.raw, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const out = { label: args.label, base: args.base, clock: AT, rm: RM, text: TEXT, init: INIT, startedAt: new Date().toISOString(), runs: [] };
const save = () => writeFileSync(`${args.out}/lr-${args.label}.json`, JSON.stringify(out, null, 1));

/** In page: put the engine in a still state, freeze chai.update, and (optionally) the close camera. */
const PREP = async ({ close }) => {
  const e = window.__nook;
  e.setRunning(false);
  e.setState({ reducedMotion: true });
  if (close) {
    e.fitTarget.set(-0.95, 0.82, 1.15); // C's art camera: the room's direction moved in on Chai (same as the maker's, for comparability)
    e.zoomT = e.zoomC = 0.2;
    e.targetC.copy(e.fitTarget);
  }
  return { quality: e.quality, chaiKind: e.chaiKind, exposure: e.renderer.toneMappingExposure, time: e.state.time, dim: e.state.dim };
};

/** In page: normal + hide-diff frames and the statistics. */
const MEASURE = async ({ wantRaw, wantCrop }) => {
  const e = window.__nook;
  const gl = e.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, N = W * H;
  const read = () => { const px = new Uint8Array(N * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const frame = () => { e.frame(0); e.frame(0); };
  const root = e.chai.root;
  const upd = e.chai.update;
  e.chai.update = () => {}; // keep the visibility toggles we make
  // enumerate Chai's meshes
  const meshes = [];
  root.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const matName = (o) => (Array.isArray(o.material) ? o.material.map((m) => m.name).join('+') : o.material?.name ?? '');
  const inEyes = new Set(); root.getObjectByName('eyes_open')?.traverse((o) => inEyes.add(o));
  const eyeMeshes = meshes.filter((o) => inEyes.has(o));
  const noseMeshes = meshes.filter((o) => !inEyes.has(o) && o.name === 'mesh_0_1' && o.parent?.name === 'body');
  const nonFur = meshes.filter((o) => matName(o) !== 'chai_fur' || inEyes.has(o));
  const listing = meshes.map((o) => `${o.parent?.name}/${o.name}:${matName(o)}:${o.material?.type}:${o.visible ? 'v' : '-'}${inEyes.has(o) ? ':eye' : ''}`);
  const hide = (list) => { const s = list.map((o) => [o, o.visible]); for (const o of list) o.visible = false; return () => { for (const [o, v] of s) o.visible = v; }; };
  const fillNow = (() => { let v = null; root.traverse((o) => { if (o.isMesh && matName(o) === 'chai_fur' && v === null) v = +o.material.emissiveIntensity.toFixed(4); }); return v; })();
  frame();
  const normal = read();
  let h = 0x811c9dc5; for (let i = 0; i < normal.length; i++) { h ^= normal[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  const shot = (list) => { const back = hide(list); frame(); const px = read(); back(); return px; };
  const hEyes = shot(eyeMeshes), hNose = shot(noseMeshes), hNonFur = shot(nonFur);
  const hAll = (() => { const prev = root.visible; root.visible = false; frame(); const px = read(); root.visible = prev; return px; })();
  frame();
  const again = read(); // the frame after restoring: must equal `normal`
  let restoreDiff = 0; for (let i = 0; i < normal.length; i++) if (normal[i] !== again[i]) restoreDiff++;
  e.chai.update = upd;

  const diffMask = (A, B, thr) => { const m = new Uint8Array(N); let n = 0; for (let i = 0; i < N; i++) { const o = i * 4; const d = Math.max(Math.abs(A[o] - B[o]), Math.abs(A[o + 1] - B[o + 1]), Math.abs(A[o + 2] - B[o + 2])); if (d > thr) { m[i] = 1; n++; } } return { m, n }; };
  const eyeD = diffMask(normal, hEyes, 24), noseD = diffMask(normal, hNose, 24), nfD = diffMask(normal, hNonFur, 24), chaiD = diffMask(normal, hAll, 8);
  const erode = (m) => { const o = new Uint8Array(N); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; o[i] = m[i] && m[i - 1] && m[i + 1] && m[i - W] && m[i + W] ? 1 : 0; } return o; };
  const dilate = (src, n) => { let a = src; for (let k = 0; k < n; k++) { const d = new Uint8Array(N); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; d[i] = a[i] || a[i - 1] || a[i + 1] || a[i - W] || a[i + W] ? 1 : 0; } a = d; } return a; };
  const comps = (m) => { // 4-connected components: count and sizes
    const seen = new Uint8Array(N); const sizes = []; const stack = [];
    for (let s = 0; s < N; s++) if (m[s] && !seen[s]) { let c = 0; stack.push(s); seen[s] = 1; while (stack.length) { const i = stack.pop(); c++; const x = i % W; if (x > 0 && m[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack.push(i - 1); } if (x < W - 1 && m[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack.push(i + 1); } if (i >= W && m[i - W] && !seen[i - W]) { seen[i - W] = 1; stack.push(i - W); } if (i < N - W && m[i + W] && !seen[i + W]) { seen[i + W] = 1; stack.push(i + W); } } sizes.push(c); }
    return sizes.sort((a, b) => b - a);
  };
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const Yof = (i) => 0.2126 * lin(normal[i * 4]) + 0.7152 * lin(normal[i * 4 + 1]) + 0.0722 * lin(normal[i * 4 + 2]);
  const Ls = (Y) => (Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : (24389 / 27) * Y);
  const stats = (mask) => {
    const ys = []; const rgb = [0, 0, 0]; let sum = 0;
    for (let i = 0; i < N; i++) if (mask[i]) { const y = Yof(i); ys.push(y); sum += y; rgb[0] += normal[i * 4]; rgb[1] += normal[i * 4 + 1]; rgb[2] += normal[i * 4 + 2]; }
    const n = ys.length; if (!n) return { n: 0 };
    ys.sort((p, q) => p - q);
    const q = (f) => ys[Math.min(n - 1, Math.floor(n * f))];
    return { n, Ymed: +q(0.5).toFixed(5), Ymean: +(sum / n).toFixed(5), Lmed: +Ls(q(0.5)).toFixed(2), Lp25: +Ls(q(0.25)).toFixed(2), Lp75: +Ls(q(0.75)).toFixed(2), meanHex: '#' + rgb.map((s) => Math.round(s / n).toString(16).padStart(2, '0')).join('') };
  };
  // fur = Chai pixels that are not (a dilated by 1 px) non-fur part, eroded 1 px
  const nfDil = dilate(nfD.m, 1);
  const furRaw = new Uint8Array(N); for (let i = 0; i < N; i++) furRaw[i] = chaiD.m[i] && !nfDil[i] ? 1 : 0;
  const fur = erode(furRaw);
  const feature = (D, pieces) => {
    const core = erode(D.m);
    const area = D.n; const d = Math.sqrt((4 * area) / pieces / Math.PI);
    const gap = dilate(D.m, 1);
    const ringOf = (rad) => { const near = dilate(D.m, rad); const ring = new Uint8Array(N); for (let i = 0; i < N; i++) ring[i] = near[i] && !gap[i] && fur[i] ? 1 : 0; return ring; };
    const r1 = Math.max(2, Math.round(d * 0.5)), r2 = Math.max(3, Math.round(d * 1.0));
    const f = stats(core), g1 = stats(ringOf(r1)), g2 = stats(ringOf(r2));
    const cr = (g) => (f.n && g.n ? +((g.Ymed + 0.05) / (f.Ymed + 0.05)).toFixed(3) : null);
    const crMean = (g) => (f.n && g.n ? +((g.Ymean + 0.05) / (f.Ymean + 0.05)).toFixed(3) : null);
    const dl = (g) => (f.n && g.n ? +(g.Lmed - f.Lmed).toFixed(2) : null);
    return { areaPx: area, diamPx: +d.toFixed(1), components: comps(D.m).slice(0, 6), feature: f, ringHalf: { rad: r1, ...g1, CR: cr(g1), CRmean: crMean(g1), dL: dl(g1) }, ringFull: { rad: r2, ...g2, CR: cr(g2), CRmean: crMean(g2), dL: dl(g2) } };
  };
  const eyes = feature(eyeD, 2), nose = feature(noseD, 1);
  // the face crop around the eyes + nose (native resolution), as PNG
  let cx0 = 1e9, cx1 = -1, cy0 = 1e9, cy1 = -1; // Chai's whole silhouette (GL rows), from the hide-diff mask
  for (let i = 0; i < N; i++) if (chaiD.m[i]) { const x = i % W, y = (i - x) / W; if (x < cx0) cx0 = x; if (x > cx1) cx1 = x; if (y < cy0) cy0 = y; if (y > cy1) cy1 = y; }
  let cropPng = null, cropBox = null;
  const feat = new Uint8Array(N); for (let i = 0; i < N; i++) feat[i] = eyeD.m[i] || noseD.m[i] ? 1 : 0;
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; // y is GL row (bottom-up)
  for (let i = 0; i < N; i++) if (feat[i]) { const x = i % W, y = (i - x) / W; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (wantCrop && x1 >= 0) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, span = Math.max(x1 - x0, y1 - y0, 12);
    const half = Math.round(Math.max(48, span * 1.9));
    const cxp = Math.round(cx), cyp = Math.round(cy);
    const bx0 = Math.max(0, cxp - half), bx1 = Math.min(W, cxp + half), by0 = Math.max(0, cyp - half), by1 = Math.min(H, cyp + half);
    const cw = bx1 - bx0, ch = by1 - by0;
    const img = new ImageData(cw, ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const s = ((by0 + (ch - 1 - y)) * W + (bx0 + x)) * 4; const d = (y * cw + x) * 4; img.data[d] = normal[s]; img.data[d + 1] = normal[s + 1]; img.data[d + 2] = normal[s + 2]; img.data[d + 3] = 255; }
    const cv = new OffscreenCanvas(cw, ch); cv.getContext('2d').putImageData(img, 0, 0);
    const blob = await cv.convertToBlob({ type: 'image/png' });
    const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    cropPng = btoa(s); cropBox = { x: bx0, y: H - by1, w: cw, h: ch, half };
  }
  let b64 = null;
  if (wantRaw) { let s = ''; for (let i = 0; i < normal.length; i += 0x8000) s += String.fromCharCode.apply(null, normal.subarray(i, i + 0x8000)); b64 = btoa(s); }
  // projected Chai head centre in the viewport (CSS px), for the frame-contents check
  const v = root.position.clone(); v.y += 0.55; v.project(e.camera);
  return {
    buffer: [W, H], fnv: h.toString(16), restoreDiffBytes: restoreDiff, fillNow,
    chaiMeshes: listing, eyeMeshCount: eyeMeshes.length, noseMeshCount: noseMeshes.length, nonFurCount: nonFur.length,
    masks: { eyePx: eyeD.n, nosePx: noseD.n, nonFurPx: nfD.n, chaiPx: chaiD.n, furPx: fur.reduce((a, x) => a + x, 0) },
    featBox: x1 >= 0 ? { x0, x1, y0: H - 1 - y1, y1: H - 1 - y0 } : null,
    chaiBox: cx1 >= 0 ? { x0: cx0, x1: cx1, y0: H - 1 - cy1, y1: H - 1 - cy0 } : null,
    headNdc: [+v.x.toFixed(3), +v.y.toFixed(3)],
    eyes, nose, cropPng, cropBox, b64,
  };
};

for (const cfg of CFGS) {
  const m = cfg.match(/^(\d+)x(\d+)@([\d.]+):(light|dark):(high|low)$/);
  const [w, h, dpr] = [+m[1], +m[2], +m[3]];
  const theme = m[4], tier = m[5];
  const mobile = w < 900 || h < 500;
  const name = `${w}x${h}-${theme}-${tier}`;
  const rec = { cfg, name, theme, tier, dpr, init: INIT, errors: [], notes: [], frames: {} };
  const t0 = Date.now();
  const ctxOpts = { viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' };
  if (RM) ctxOpts.reducedMotion = 'reduce';
  const ctx = await b.newContext(ctxOpts);
  if (TEXT !== 100) await ctx.addInitScript((pct) => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), TEXT);
  const p = await ctx.newPage();
  p.on('pageerror', (er) => rec.errors.push(er.message.slice(0, 200)));
  p.on('console', (c) => { if ((c.type() === 'error' || c.type() === 'warning') && !/Service Worker/i.test(c.text())) rec.errors.push('console ' + c.type() + ': ' + c.text().slice(0, 160)); });
  await p.clock.install({ time: Date.parse(AT) });
  await p.clock.resume();
  try {
    const url = `${args.base}/?debug&seed=veteran&theme=${theme}&nookq=${tier}&nooktime=${INIT}&nookweather=clear${args.nochai3d ? '' : ''}#/nook`;
    rec.url = url;
    await p.goto(url);
    await p.waitForSelector('section[aria-label="The room"] [data-scene-ready="true"]', { timeout: 240_000 });
    await p.waitForFunction(() => window.__nook?.chaiKind === 'model', null, { timeout: 120_000 });
    rec.readyMs = Date.now() - t0;
    await sleep(2000);
    for (const view of VIEWS) {
      const prep = await p.evaluate(PREP, { close: view === 'close' });
      rec.prep = prep;
      for (const time of TIMES) {
        const key = `${view}-${time}`;
        // switch the hour the way React does (the loop is stopped, so the mood applies at once)
        await p.evaluate((t) => { const e = window.__nook; e.setRunning(false); if (e.state.time !== t) e.setState({ time: t }); }, time);
        await sleep(300);
        const wantRaw = !!args.raw && time === 'day';
        const r = await p.evaluate(MEASURE, { wantRaw, wantCrop: true });
        const f = { ...r }; delete f.cropPng; delete f.b64; delete f.chaiMeshes;
        f.timeApplied = await p.evaluate(() => window.__nook.state.time);
        if (!rec.chaiMeshes) rec.chaiMeshes = r.chaiMeshes;
        if (r.b64) writeFileSync(`${args.raw}/${name}-${key}.rgba.gz`, gzipSync(Buffer.from(r.b64, 'base64')));
        if (r.cropPng) writeFileSync(`${args.out}/${name}-${time}-${view}-face.png`, Buffer.from(r.cropPng, 'base64'));
        if (SHOTS && SHOTVIEWS.includes(view)) {
          await p.evaluate(() => { window.__nook.setRunning(false); window.__nook.frame(0); });
          await p.screenshot({ path: `${args.out}/${name}-${time}-${view}-frame.png`, animations: 'disabled', timeout: 300_000 });
        }
        rec.frames[key] = f;
        const c = (g) => `${g.ringHalf.CR}/${g.ringHalf.dL}`;
        console.log(new Date().toISOString().slice(11, 19), args.label, name, key, `eyes CR/dL ${c(f.eyes)} (n ${f.eyes.feature.n}, comps ${f.eyes.components.length}) | nose ${c(f.nose)} (n ${f.nose.feature.n}, comps ${f.nose.components.length}) | fill ${f.fillNow} | restoreDiff ${f.restoreDiffBytes} | fnv ${f.fnv}`);
        save();
      }
    }
  } catch (er) {
    rec.errors.push('SCRIPT: ' + er.message.slice(0, 300));
    console.log(name, 'FAILED', er.message.slice(0, 300));
  }
  rec.elapsedMs = Date.now() - t0;
  out.runs.push(rec);
  save();
  await ctx.close();
}
out.endedAt = new Date().toISOString();
save();
await b.close();
