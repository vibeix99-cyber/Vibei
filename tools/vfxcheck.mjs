// Can you see the fighter the effect is happening to?
//
//   node tools/vfxcheck.mjs [--port 8930] [--turns 8] [--seed FEELZ-3]
//
// Every other camera measurement in this repo is geometry: is the fighter
// inside the frustum, is a raycast to it blocked by scenery. A blind critic
// scored feel 5/10 on a defect all of those score as fine —
//
//   "the fighter that just took 87 damage is a solid white ball"
//
// — because the thing hiding the defender is not scenery, it is the defender's
// own hit effect. Geometry cannot see that. This can: at each impact it renders
// the frame twice, once as the player sees it and once with every live VFX
// object hidden, and diffs the two inside the defender's own screen-space box.
// The pixels that change are the pixels its effect painted over it.
//
//   masked   share of the defender's silhouette covered by its own VFX
//   prom     the defender's height as a share of the attacker's — a hit framed
//            on the attacker while the victim is a speck reads as nothing
//            happening to anyone

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 8930));
const TURNS = Number(arg('turns', 8));
const SEED = arg('seed', 'FEELZ-3');

const server = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('serving') && r()));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

// Screen-space box of an actor, and a render with VFX toggled.
await page.evaluate(() => {
  const A = window.__ARENA, THREE = A.debug.THREE;
  window.__box = (i) => {
    const act = A.app.view.actors[i];
    if (!act?.root) return null;
    const cam = A.stage.camera;
    cam.updateMatrixWorld();
    const b = new THREE.Box3().setFromObject(act.root);
    if (!Number.isFinite(b.min.x)) return null;
    let lo = [9, 9], hi = [-9, -9];
    for (let k = 0; k < 8; k++) {
      const v = new THREE.Vector3(k & 1 ? b.max.x : b.min.x, k & 2 ? b.max.y : b.min.y, k & 4 ? b.max.z : b.min.z).project(cam);
      lo[0] = Math.min(lo[0], v.x); hi[0] = Math.max(hi[0], v.x);
      lo[1] = Math.min(lo[1], v.y); hi[1] = Math.max(hi[1], v.y);
    }
    const W = innerWidth, H = innerHeight;
    return {
      x0: Math.max(0, Math.round((lo[0] + 1) / 2 * W)), x1: Math.min(W, Math.round((hi[0] + 1) / 2 * W)),
      y0: Math.max(0, Math.round((1 - hi[1]) / 2 * H)), y1: Math.min(H, Math.round((1 - lo[1]) / 2 * H)),
      hFrac: (hi[1] - lo[1]) / 2
    };
  };
  /**
   * Render the current frame twice — as the player sees it, and with every live
   * VFX object hidden — and diff the two inside `box`. The pixels that changed
   * are the pixels the effect painted over whatever was behind it.
   *
   * Read straight off the drawing buffer with `gl.readPixels` rather than
   * screenshotting: it needs no image decoding, and it works while the game
   * loop is frozen by hitstop, which is exactly the moment worth measuring.
   */
  window.__diff = (box) => {
    const R = A.stage.renderer, gl = R.getContext();
    const dpr = R.getPixelRatio();
    const w = Math.max(1, Math.round((box.x1 - box.x0) * dpr));
    const h = Math.max(1, Math.round((box.y1 - box.y0) * dpr));
    const x = Math.round(box.x0 * dpr);
    const y = gl.drawingBufferHeight - Math.round(box.y1 * dpr);   // GL origin is bottom-left
    if (w < 4 || h < 4) return null;
    const show = (on) => { for (const e of A.app.view.vfx.active) if (e?.obj) e.obj.visible = on; };
    const read = () => {
      const buf = new Uint8Array(w * h * 4);
      gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      return buf;
    };
    show(true);  R.render(A.stage.scene, A.stage.camera); const withFx = read();
    show(false); R.render(A.stage.scene, A.stage.camera); const noFx = read();
    show(true);  R.render(A.stage.scene, A.stage.camera);
    let diff = 0;
    for (let i = 0; i < withFx.length; i += 4) {
      const d = Math.abs(withFx[i] - noFx[i]) + Math.abs(withFx[i + 1] - noFx[i + 1])
        + Math.abs(withFx[i + 2] - noFx[i + 2]);
      if (d > 90) diff++;                                          // visibly repainted
    }
    return { masked: diff / (w * h), px: w * h };
  };
});

const hits = [];
await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);

for (let i = 0; i < 600; i++) {
  const st = await page.evaluate(() => {
    const A = window.__ARENA;
    const w = A.battle.waitingFor();
    if (w === 0) {
      const s = A.battle.screen();
      if (s) A.battle.choose(0, A.sim.chooseAction(s.battle, 0, 'ace'));
    }
    const b = A.battle.screen()?.battle;
    return {
      ended: !!b?.ended, turn: b?.turn ?? 0,
      fl: A.stage.feel.flash.a, hs: A.stage.feel.hitstopMs,
      vfx: A.app.view.vfx.active.length,
      shot: A.app.dir?.shot?.id ?? null
    };
  });
  if (st.ended || st.turn > TURNS) break;

  // An impact frame: the flash is up and effects are live.
  if (st.fl > 0.05 && st.vfx > 0) {
    // Which side is taking it? The one whose HP is dropping is unreliable at
    // this instant, so use the director's subject when it names one, else the
    // actor nearest the freshest effect.
    const who = await page.evaluate(() => {
      const A = window.__ARENA;
      const d = A.app.dir;
      if (typeof d.shot?.subject === 'number') return d.shot.subject;
      return A.app.view.actors.findIndex((a) => a?.root) ?? 0;
    });
    const r = await page.evaluate((w) => {
      const b0 = window.__box(0), b1 = window.__box(1);
      const box = w === 0 ? b0 : b1, other = w === 0 ? b1 : b0;
      if (!box) return null;
      const d = window.__diff(box);
      return d ? { masked: d.masked, hFrac: box.hFrac, prom: other?.hFrac ? box.hFrac / other.hFrac : null } : null;
    }, who);
    if (r) hits.push({ shot: st.shot, hs: Math.round(st.hs), ...r });
    await sleep(400);                                 // do not re-sample one hit
  }
  await sleep(120);
}

await browser.close();
server.kill();

if (!hits.length) { console.log('\n❌ no impact frames captured'); process.exit(1); }
const med = (a) => { const v = [...a].sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
const masked = hits.map((h) => h.masked);
const proms = hits.map((h) => h.prom).filter((x) => x != null);
const pct = (v) => `${(v * 100).toFixed(1)}%`;

console.log(`\n════ VFX MASKING — can you see who got hit? ════\n`);
console.log(`  impacts sampled          ${hits.length}`);
console.log(`  defender masked by VFX   median ${pct(med(masked))}, worst ${pct(Math.max(...masked))}`);
console.log(`  defender screen height   median ${med(hits.map((h) => h.hFrac)).toFixed(3)}`);
if (proms.length) console.log(`  defender vs attacker     median ${med(proms).toFixed(2)}x`);
console.log('');
for (const h of hits) {
  console.log(`    ${String(h.shot).padEnd(9)} hitstop ${String(h.hs).padStart(3)}ms  masked ${pct(h.masked).padStart(6)}  h ${h.hFrac.toFixed(3)}`);
}

const bad = [];
if (med(masked) > 0.55) bad.push(`the defender is ${pct(med(masked))} covered by its own effect (target <=55%)`);
if (Math.max(...masked) > 0.85) bad.push(`an impact covers ${pct(Math.max(...masked))} of the defender (target <=85%)`);
if (errors.length) bad.push(`page error: ${errors[0]}`);
console.log('');
if (bad.length) { for (const b of bad) console.log(`  ✗ ${b}`); console.log(`\n❌ ${bad.length} problem(s)`); }
else console.log(`✅ the fighter taking the hit stays visible through it`);
process.exit(bad.length ? 1 : 0);
