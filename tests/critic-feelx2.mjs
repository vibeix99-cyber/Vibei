// FEEL critic harness #2 — bullet-time frame capture + honest game-clock timing.
//
// The page's main loop clamps dt to 0.05s, so at 4 real fps the game clock runs
// ~5x slower than the wall clock. stage.time is therefore the ONLY honest
// measure of intended duration. For pixel inspection we additionally scale the
// raw dt fed to the loop, which multiplies rendered frames per game-second
// without changing any tuning.
//
//   node tests/critic-feelx2.mjs turn        # full turn, real speed, timings
//   node tests/critic-feelx2.mjs bullet 0.1  # frame burst at 1/10 game speed
//   node tests/critic-feelx2.mjs battle      # whole battle, per-turn timings
//   node tests/critic-feelx2.mjs occl        # camera line-of-sight audit
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8872);
const MODE = process.argv[2] || 'turn';
const ARG = process.argv[3];
const OUT = 'tests/shots/critic-feel-x';
const VW = Number(process.env.VW || 960), VH = Number(process.env.VH || 600);
const Q = process.env.Q || 'low';
const SEED = process.env.SEED || 'FEELX-7';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${PORT}/?quality=${Q}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 40000 });
await page.evaluate(() => window.__ARENA.ready);

// ---- audio instrumentation (muted, but every cue logged on the game clock) --
await page.evaluate(() => {
  const A = window.__ARENA; window.__SFX = [];
  for (const k of ['sfx', 'cry']) {
    const orig = A.audio[k].bind(A.audio);
    A.audio[k] = (...a) => {
      try { window.__SFX.push({ k, n: typeof a[0] === 'string' ? a[0] : '?', gt: +A.stage.time.toFixed(3) }); } catch {}
      return orig(...a);
    };
  }
  A.audio.setMuted(true);
});

// ---- per-frame recorder on the game clock ---------------------------------
await page.evaluate(() => {
  const A = window.__ARENA; const S = []; window.__REC = S; window.__RECON = true;
  const tick = () => {
    if (window.__RECON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, D = A.app.dir, T = A.app.textbox, F = A.stage.feel, C = A.stage.camera;
      S.push({
        gt: +A.stage.time.toFixed(4), w: +performance.now().toFixed(0),
        shot: D.shot?.id ?? null, blend: +(D.blend ?? 1).toFixed(3),
        cam: [+C.position.x.toFixed(2), +C.position.y.toFixed(2), +C.position.z.toFixed(2)], fov: +C.fov.toFixed(1),
        chars: T.charIdx, full: T.current ? (T.current.text || '').length : 0, tq: T.queue.length, wfi: !!T.waitingForInput,
        txt: T.$txt ? T.$txt.textContent : '',
        hp: A.app.plates.map((p) => [p.hp, +p.hpSpring.value.toFixed(4)]),
        shake: +F.shake.amp.toFixed(4), flash: +F.flash.a.toFixed(4), hs: +F.hitstopMs.toFixed(1),
        zoom: +F.zoomPunch.toFixed(4), chroma: +F.chroma.toFixed(3), ts: +F.timeScale.toFixed(3),
        vfx: V.vfx?.active?.length ?? -1, gate: +(V.gate ?? 0).toFixed(3), q: V.queue?.length ?? -1,
        beats: V.beats?.length ?? -1,
        act: (V.actors || []).map((a) => (a ? [+a.root.position.x.toFixed(2), +a.root.position.y.toFixed(2), +a.root.position.z.toFixed(2)] : null)),
        wait: A.battle.waitingFor?.() ?? null, anim: A.battle.isAnimating?.() ?? null,
        dock: !!document.querySelector('.cmdbtn')
      });
    } catch (e) { S.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
});

const gt = () => page.evaluate(() => +window.__ARENA.stage.time.toFixed(3));
const shot = async (n) => { const t = await gt(); await page.screenshot({ path: `${OUT}/${n}.png` }); return t; };
const waitPrompt = async (maxMs = 400000) => {
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > maxMs) return { st: 'stall' };
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId,
      f: window.__ARENA.battle.screen?.()?.forcedSwitch ?? null, gt: +window.__ARENA.stage.time.toFixed(3), fps: window.__ARENA.perf.fps }));
    if (s.r !== 'battle') return { st: 'over', ...s };
    if (s.w === 0) return { st: 'prompt', ...s };
    await sleep(100);
  }
};
const pickMove = () => page.evaluate(() => {
  const A = window.__ARENA, s = A.battle.screen();
  if (s.forcedSwitch) {
    const side = s.battle.sides[0];
    const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
    A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
    return { kind: 'switch' };
  }
  const side = s.battle.sides[0], mon = side.party[side.activeIndex];
  let best = null;
  for (const m of mon.moves) {
    const d = A.data.moves.find((x) => x.id === m.id);
    if (!d || m.pp <= 0 || d.category === 'status') continue;
    if (!best || (d.power || 0) > (best.d.power || 0)) best = { m, d };
  }
  if (!best) { const m = mon.moves.find((x) => x.pp > 0) || mon.moves[0]; best = { m, d: A.data.moves.find((x) => x.id === m.id) }; }
  A.battle.choose(0, { kind: 'move', moveId: best.m.id, target: 'foe' });
  return { kind: 'move', name: best.d.name, power: best.d.power, fx: best.d.fx, hp: side.party[side.activeIndex].hp };
});

const dump = async (n) => {
  const d = await page.evaluate(() => ({ rec: window.__REC.slice(), sfx: window.__SFX.slice() }));
  await writeFile(`${OUT}/${n}.json`, JSON.stringify(d));
  console.log(`  wrote ${OUT}/${n}.json  frames=${d.rec.length} sfx=${d.sfx.length}`);
  return d;
};

// ---------------------------------------------------------------------------
await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
const first = await waitPrompt();
console.log('first prompt @gt', first.gt, 'fps', first.fps);

if (MODE === 'battle') {
  let t = 0; const rows = [];
  for (; t < 14; t++) {
    const a = await gt();
    const c = await pickMove();
    const r = await waitPrompt();
    const b = r.gt ?? (await gt());
    rows.push({ t, choice: c.name || c.kind, gs: +(b - a).toFixed(2), st: r.st, forced: r.f });
    console.log(JSON.stringify(rows.at(-1)));
    if (r.st !== 'prompt') break;
  }
  const dmg = rows.filter((r) => r.st === 'prompt');
  console.log('turn game-seconds: ' + dmg.map((r) => r.gs).join(', '));
  console.log('median', dmg.map((r) => r.gs).sort((x, y) => x - y)[Math.floor(dmg.length / 2)]);
  await dump('rec-battle');
}

if (MODE === 'turn') {
  const a = await gt();
  const c = await pickMove();
  console.log('chose', JSON.stringify(c));
  const r = await waitPrompt();
  console.log('turn game-seconds', (r.gt - a).toFixed(2), JSON.stringify(r));
  await dump('rec-turn');
}

if (MODE === 'bullet') {
  const scale = Number(ARG || 0.12);
  // slow the raw dt fed to the whole loop; every subsystem stays in proportion
  await page.evaluate((s) => {
    const F = window.__ARENA.stage.feel; const orig = F.update.bind(F);
    F.update = (raw) => orig(raw * s); window.__SLOW = s;
  }, scale);
  const a = await gt();
  const c = await pickMove();
  console.log('chose', JSON.stringify(c), '@gt', a, 'timeScale', scale);
  const frames = [];
  for (let i = 0; i < 46; i++) {
    const t = await shot(`bullet-${String(i).padStart(2, '0')}`);
    const s = await page.evaluate(() => {
      const A = window.__ARENA, F = A.stage.feel, D = A.app.dir, T = A.app.textbox;
      return { shot: D.shot?.id, hs: +F.hitstopMs.toFixed(0), sh: +F.shake.amp.toFixed(3), fl: +F.flash.a.toFixed(3),
        z: +F.zoomPunch.toFixed(3), ch: +F.chroma.toFixed(2), txt: T.$txt?.textContent,
        hp: A.app.plates.map((p) => p.hp), vfx: A.app.view.vfx?.active?.length, w: A.battle.waitingFor() };
    });
    frames.push({ i, dgt: +(t - a).toFixed(3), ...s });
    console.log(JSON.stringify(frames.at(-1)));
    if (s.w === 0 && i > 6) break;
  }
  await writeFile(`${OUT}/bullet-frames.json`, JSON.stringify(frames, null, 1));
  await dump('rec-bullet');
}

if (MODE === 'occl') {
  // Ray from camera to each actor's chest; report the first mesh hit.
  const rows = [];
  for (let n = 0; n < 26; n++) {
    const r = await page.evaluate(async () => {
      const A = window.__ARENA;
      const THREE = await import('three');
      const V = A.app.view, cam = A.stage.camera, sc = A.stage.scene;
      cam.updateMatrixWorld(true);
      const out = [];
      for (let s = 0; s < 2; s++) {
        const act = V.actors[s]; if (!act) { out.push(null); continue; }
        const p = new THREE.Vector3().setFromMatrixPosition(act.root.matrixWorld);
        p.y += 0.9;
        const camPos = cam.position.clone();
        const dirv = p.clone().sub(camPos); const dist = dirv.length(); dirv.normalize();
        const rc = new THREE.Raycaster(camPos, dirv, 0.05, dist - 0.35);
        // exclude the actors themselves
        const hits = rc.intersectObject(sc, true).filter((h) => {
          let o = h.object; while (o) { if (o === V.actors[0]?.root || o === V.actors[1]?.root) return false; o = o.parent; }
          return h.object.visible && h.object.material && !h.object.material.transparent;
        });
        // on-screen position
        const ndc = p.clone().project(cam);
        out.push({ s, blocked: hits.length > 0, by: hits[0]?.object?.name || hits[0]?.object?.type || null,
          d: hits[0] ? +hits[0].distance.toFixed(2) : null, dist: +dist.toFixed(2),
          x: +((ndc.x * 0.5 + 0.5) * 100).toFixed(1), y: +((1 - (ndc.y * 0.5 + 0.5)) * 100).toFixed(1),
          onscreen: Math.abs(ndc.x) < 1 && Math.abs(ndc.y) < 1 && ndc.z < 1 });
      }
      return { gt: +A.stage.time.toFixed(2), shot: A.app.dir.shot?.id, out, w: A.battle.waitingFor() };
    });
    rows.push(r);
    console.log(JSON.stringify(r));
    if (r.w === 0) { await pickMove(); }
    await sleep(500);
  }
  await writeFile(`${OUT}/occl.json`, JSON.stringify(rows, null, 1));
}

console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 8)));
await browser.close();
