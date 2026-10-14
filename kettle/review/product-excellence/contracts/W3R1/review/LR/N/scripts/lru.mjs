// W3R1 · Lane R (LR) · Maker N: the summary's object unlock (drawing -> 3D close-up of the record player), base vs trial.
// Flow (same route the LRC lane and maker N used): celebrate seed on Home -> "Put the kettle on" -> wait 3 s -> __kettle.finish()
// -> #/done -> early frame (the drawing, ~0.9 s) -> wait for the unlock card's data-scene-ready="true" -> +3.5 s -> hold the loop.
// Per hour (first = ?nooktime= URL override, the next via engine.setState({time}) on the card's engine, loop held):
//   * facts: engine mode, chai kind, camera framing, Chai's pixels in the card's frame (hide-diff: normal frame vs the frame with
//     Chai's root hidden, |d| > 8 on any channel), Chai head NDC;
//   * card canvas: raw drawing buffer (gz, for the base/trial pixel diff) + native PNG; full-viewport screenshot with the card in view.
// reducedMotion is emulated (the product's still path), so the record-player platter does not accumulate real dt and base/trial
// frames are comparable.
//   node lru.mjs --base URL --label X --out DIR --raw RAWDIR --cfgs 390x844@2:light,1440x900@1:light --times night,day
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const CFGS = (args.cfgs ?? '390x844@2:light').split(',');
const TIMES = (args.times ?? 'night,day').split(',');
const TIER = args.tier ?? 'default'; // default = no nookq: the device's own tier (low on this SwiftShader machine)
const RM = (args.rm ?? '1') === '1';
const AT = '2026-10-12T07:40:00Z';
mkdirSync(args.out, { recursive: true });
if (args.raw) mkdirSync(args.raw, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const out = { label: args.label, base: args.base, clock: AT, rm: RM, tier: TIER, startedAt: new Date().toISOString(), runs: [] };
const save = () => writeFileSync(`${args.out}/lru-${args.label}.json`, JSON.stringify(out, null, 1));

const CARD = async ({ wantRaw }) => {
  const e = window.__nook;
  e.setRunning(false);
  const gl = e.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, N = W * H;
  const read = () => { const px = new Uint8Array(N * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const frame = () => { e.frame(0); e.frame(0); };
  frame();
  const normal = read();
  const upd = e.chai.update; e.chai.update = () => {};
  const prev = e.chai.root.visible; e.chai.root.visible = false; frame();
  const hidden = read();
  e.chai.root.visible = prev; frame(); e.chai.update = upd;
  let chaiPx = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  for (let i = 0; i < N; i++) { const o = i * 4; if (Math.max(Math.abs(normal[o] - hidden[o]), Math.abs(normal[o + 1] - hidden[o + 1]), Math.abs(normal[o + 2] - hidden[o + 2])) > 8) { chaiPx++; const x = i % W, y = (i - x) / W; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  const v = e.chai.root.position.clone(); v.y += 0.55; v.project(e.camera);
  const c = e.canvas.getBoundingClientRect();
  let h = 0x811c9dc5; for (let i = 0; i < normal.length; i++) { h ^= normal[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  let b64 = null;
  if (wantRaw) { let s = ''; for (let i = 0; i < normal.length; i += 0x8000) s += String.fromCharCode.apply(null, normal.subarray(i, i + 0x8000)); b64 = btoa(s); }
  // native PNG of the whole card canvas
  const img = new ImageData(W, H);
  for (let y = 0; y < H; y++) { const s = (H - 1 - y) * W * 4; img.data.set(normal.subarray(s, s + W * 4), y * W * 4); }
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
  const cv = new OffscreenCanvas(W, H); cv.getContext('2d').putImageData(img, 0, 0);
  const blob = await cv.convertToBlob({ type: 'image/png' });
  const buf = new Uint8Array(await blob.arrayBuffer()); let s2 = ''; for (let i = 0; i < buf.length; i += 0x8000) s2 += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return {
    time: e.state.time, mode: e.state.mode, quality: e.quality, chaiKind: e.chaiKind ?? 'procedural (no field)', highlight: e.state.highlightItem,
    buffer: [W, H], canvasRect: [Math.round(c.x), Math.round(c.y), Math.round(c.width), Math.round(c.height)], fnv: h.toString(16),
    chaiPixelsInFrame: chaiPx, chaiBox: x1 >= 0 ? [x0, H - 1 - y1, x1, H - 1 - y0] : null, chaiHeadNdc: [+v.x.toFixed(3), +v.y.toFixed(3)], chaiRootVisible: prev,
    furFill: (() => { let f = null; e.chai.root.traverse((o) => { if (o.isMesh && o.material?.name === 'chai_fur' && f === null) f = +o.material.emissiveIntensity.toFixed(4); }); return f; })(),
    camera: { pos: e.camera.position.toArray().map((x) => +x.toFixed(3)), zoom: +e.zoom.toFixed(3) },
    png: btoa(s2), b64,
  };
};

for (const cfg of CFGS) {
  const m = cfg.match(/^(\d+)x(\d+)@([\d.]+):(light|dark)$/);
  const [w, h, dpr] = [+m[1], +m[2], +m[3]]; const theme = m[4];
  const mobile = w < 900;
  const name = `${w}x${h}-${theme}`;
  const rec = { cfg, name, errors: [], states: {} };
  const ctxOpts = { viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' };
  if (RM) ctxOpts.reducedMotion = 'reduce';
  const ctx = await b.newContext(ctxOpts);
  const p = await ctx.newPage();
  p.on('pageerror', (er) => rec.errors.push(er.message.slice(0, 200)));
  p.on('console', (c) => { if ((c.type() === 'error' || c.type() === 'warning') && !/Service Worker/i.test(c.text())) rec.errors.push('console ' + c.type() + ': ' + c.text().slice(0, 160)); });
  await p.clock.install({ time: Date.parse(AT) });
  await p.clock.resume();
  const tierQ = TIER === 'default' ? '' : `&nookq=${TIER}`;
  const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 120_000 }).catch(() => {});
  try {
    await p.goto(`${args.base}/?debug&seed=celebrate&theme=${theme}${tierQ}&nooktime=${TIMES[0]}#/`);
    await ready(); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false })); await sleep(1500);
    const btn = p.getByRole('button', { name: /put the kettle on/i }).first();
    await btn.scrollIntoViewIfNeeded().catch(() => {}); await btn.click({ timeout: 60_000 }); await sleep(3000);
    await p.evaluate(() => {
      window.__t = {}; const t0 = performance.now();
      const tick = () => {
        const u = document.querySelector('section[aria-label^="Cozy level"] [data-scene-mode]');
        if (location.hash.includes('done') && !window.__t.done) window.__t.done = performance.now() - t0;
        if (u && !window.__t.mounted) window.__t.mounted = performance.now() - t0;
        if (u?.getAttribute('data-scene-ready') === 'true' && !window.__t.ready) window.__t.ready = performance.now() - t0;
        if (performance.now() - t0 < 120000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 60_000 }).catch(() => {});
    await sleep(900);
    const early = await p.evaluate(() => ({ hash: location.hash, hosts: [...document.querySelectorAll('[data-scene-mode]')].map((h) => [h.getAttribute('data-scene-mode'), h.getAttribute('data-scene-ready'), h.getAttribute('data-scene-static')]) }));
    await p.locator('section[aria-label^="Cozy level"]').first().scrollIntoViewIfNeeded().catch(() => {});
    await p.screenshot({ path: `${args.out}/${name}-${TIMES[0]}-unlock-early.png`, animations: 'disabled', timeout: 300_000 });
    rec.early = early;
    await p.waitForFunction(() => !!window.__t.ready, null, { timeout: 150_000 }).catch(() => rec.errors.push('unlock: scene never ready'));
    await sleep(3500);
    const t = await p.evaluate(() => window.__t);
    rec.timing = { doneMs: Math.round(t.done ?? -1), mountedAfterDoneMs: Math.round((t.mounted ?? NaN) - t.done), readyAfterDoneMs: Math.round((t.ready ?? NaN) - t.done) };
    await p.locator('section[aria-label^="Cozy level"]').first().scrollIntoViewIfNeeded().catch(() => {});
    for (const time of TIMES) {
      await p.evaluate((tm) => { const e = window.__nook; e.setRunning(false); if (e.state.time !== tm) e.setState({ time: tm }); }, time);
      await sleep(400);
      const r = await p.evaluate(CARD, { wantRaw: !!args.raw });
      if (r.b64) writeFileSync(`${args.raw}/${name}-${time}-card.rgba.gz`, gzipSync(Buffer.from(r.b64, 'base64')));
      writeFileSync(`${args.out}/${name}-${time}-unlock-card-canvas.png`, Buffer.from(r.png, 'base64'));
      await p.evaluate(() => { window.__nook.setRunning(false); window.__nook.frame(0); });
      const host = await p.evaluate(() => [...document.querySelectorAll('section[aria-label^="Cozy level"] [data-scene-mode]')].map((h) => [h.getAttribute('data-scene-mode'), h.getAttribute('data-scene-ready')]));
      await p.screenshot({ path: `${args.out}/${name}-${time}-unlock-frame.png`, animations: 'disabled', timeout: 300_000 });
      const f = { ...r, host }; delete f.png; delete f.b64;
      rec.states[time] = f;
      console.log(new Date().toISOString().slice(11, 19), args.label, name, time, JSON.stringify({ mode: f.mode, q: f.quality, kind: f.chaiKind, chaiPx: f.chaiPixelsInFrame, head: f.chaiHeadNdc, fill: f.furFill, buf: f.buffer, fnv: f.fnv, host }));
      save();
    }
  } catch (er) {
    rec.errors.push('SCRIPT: ' + er.message.slice(0, 300));
    console.log(name, 'FAILED', er.message.slice(0, 300));
  }
  out.runs.push(rec);
  save();
  await ctx.close();
}
out.endedAt = new Date().toISOString();
save();
await b.close();
