// FEEL critic harness (independent). Server must be running on $PORT (default 8872).
//   node tests/critic-feelx.mjs <mode>
// modes: intro | turn | slow | occl
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8872);
const MODE = process.argv[2] || 'turn';
const OUT = 'tests/shots/critic-feel-x';
const VW = Number(process.env.VW || 960), VH = Number(process.env.VH || 600);
const Q = process.env.Q || 'low';
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

// --- instrument audio (keep it muted but log every sfx/cry with game time) ---
await page.evaluate(() => {
  const A = window.__ARENA;
  window.__SFX = [];
  const a = A.audio;
  const wrap = (k) => {
    const orig = a[k].bind(a);
    a[k] = (...args) => {
      try {
        window.__SFX.push({ k, name: typeof args[0] === 'string' ? args[0] : (args[0]?.id || '?'),
          gt: +A.stage.time.toFixed(3), w: +performance.now().toFixed(1) });
      } catch {}
      return orig(...args);
    };
  };
  wrap('sfx'); wrap('cry');
  a.setMuted?.(true);
});

const shot = async (name) => {
  const gt = await page.evaluate(() => +window.__ARENA.stage.time.toFixed(3));
  const f = `${OUT}/${name}.png`;
  await page.screenshot({ path: f });
  return { f, gt };
};

// in-page recorder on the render loop
const INSTALL = () => {
  const A = window.__ARENA;
  const S = []; window.__REC = S; window.__RECON = true;
  const tick = () => {
    if (window.__RECON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, D = A.app.dir, T = A.app.textbox, F = A.stage.feel, C = A.stage.camera;
      S.push({
        gt: +A.stage.time.toFixed(4), w: +performance.now().toFixed(1),
        shot: D.shot?.id ?? null, subj: D.shot?.subject ?? null, blend: +(D.blend ?? 1).toFixed(3),
        cam: [+C.position.x.toFixed(2), +C.position.y.toFixed(2), +C.position.z.toFixed(2)],
        fov: +C.fov.toFixed(2),
        txt: T.$txt ? T.$txt.textContent : '', chars: T.charIdx,
        full: T.current ? (T.current.text || '').length : 0, tq: T.queue.length, wfi: !!T.waitingForInput,
        hp: A.app.plates.map((p) => [p.hp, p.maxHp, +p.hpSpring.value.toFixed(4), +p.hpSpring.target.toFixed(4), +(p.ghost ?? 0).toFixed(4)]),
        shake: +F.shake.amp.toFixed(4), flash: +F.flash.a.toFixed(4), hits: +F.hitstopMs.toFixed(1),
        zoom: +F.zoomPunch.toFixed(4), chroma: +F.chroma.toFixed(4), ts: +F.timeScale.toFixed(3),
        vfx: V.vfx?.active?.length ?? -1, gate: +(V.gate ?? 0).toFixed(3), q: V.queue?.length ?? -1,
        act: (V.actors || []).map((a) => (a ? [+a.root.position.x.toFixed(2), +a.root.position.y.toFixed(2), +a.root.position.z.toFixed(2)] : null)),
        wait: A.battle.waitingFor?.() ?? null, anim: A.battle.isAnimating?.() ?? null,
        menu: !!document.querySelector('.cmdbtn, .movecard, .cmd-fight')
      });
    } catch (e) { S.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
};

const dumpRec = async (name) => {
  const rec = await page.evaluate(() => window.__REC.slice());
  const sfx = await page.evaluate(() => window.__SFX.slice());
  await writeFile(`${OUT}/${name}.json`, JSON.stringify({ rec, sfx }, null, 0));
  return { rec, sfx };
};

const waitPrompt = async (maxMs = 300000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await page.evaluate(() => ({
      w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId,
      gt: +window.__ARENA.stage.time.toFixed(3), fps: window.__ARENA.perf.fps
    }));
    if (s.r !== 'battle') return { st: 'over', ...s };
    if (s.w === 0) return { st: 'prompt', ...s };
    await sleep(120);
  }
  return { st: 'stall' };
};

// ---------------------------------------------------------------- modes ----
if (MODE === 'intro') {
  await page.evaluate(INSTALL);
  const t0 = await page.evaluate(() => { window.__ARENA.battle.quick('FEELX-1'); return +window.__ARENA.stage.time.toFixed(3); });
  console.log('battle.quick at gt=' + t0);
  // burst of shots during the intro
  const marks = [];
  const t0w = Date.now();
  for (let i = 0; i < 26; i++) {
    const s = await shot(`intro-${String(i).padStart(2, '0')}`);
    const st = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), fps: window.__ARENA.perf.fps,
      shot: window.__ARENA.app.dir.shot?.id, txt: window.__ARENA.app.textbox.$txt?.textContent }));
    marks.push({ i, gt: s.gt, dgt: +(s.gt - t0).toFixed(2), wall: Date.now() - t0w, ...st });
    console.log(JSON.stringify(marks.at(-1)));
    if (st.w === 0) break;
  }
  const p = await waitPrompt();
  console.log('FIRST PROMPT', JSON.stringify(p), 'intro game-seconds =', (p.gt - t0).toFixed(2));
  await shot('intro-prompt');
  await dumpRec('rec-intro');
}

if (MODE === 'turn' || MODE === 'slow') {
  await page.evaluate(() => window.__ARENA.battle.quick('FEELX-1'));
  const p0 = await waitPrompt();
  console.log('first prompt', JSON.stringify(p0));
  if (MODE === 'slow') await page.evaluate(() => { window.__ARENA.app.view.speed = 0.25; window.__ARENA.app.dir.speed = 0.25; });
  await page.evaluate(INSTALL);
  await page.evaluate(() => { window.__SFX.length = 0; });

  const tStart = await page.evaluate(() => {
    const A = window.__ARENA;
    const s = A.battle.screen ? A.battle.screen() : null;
    const st = s ? s.battle : A.battle.state();
    // pick the strongest damaging move for a clean impact read
    const side = st.sides[0]; const mon = side.party[side.activeIndex];
    let best = null;
    for (const m of mon.moves) {
      const def = A.data.moves.find((d) => d.id === m.id);
      if (!def || m.pp <= 0) continue;
      if (!best || (def.power || 0) > (best.def.power || 0)) best = { m, def };
    }
    A.battle.choose(0, { kind: 'move', moveId: best.m.id, target: 'foe' });
    return { gt: +A.stage.time.toFixed(3), move: best.def.name, power: best.def.power, fx: best.def.fx };
  });
  console.log('CHOSE', JSON.stringify(tStart));

  const nShots = MODE === 'slow' ? 40 : 30;
  const seq = [];
  for (let i = 0; i < nShots; i++) {
    const s = await shot(`${MODE}-${String(i).padStart(2, '0')}`);
    const st = await page.evaluate(() => {
      const A = window.__ARENA, F = A.stage.feel, D = A.app.dir, T = A.app.textbox;
      return { w: A.battle.waitingFor(), anim: A.battle.isAnimating(), shot: D.shot?.id, subj: D.shot?.subject,
        hits: F.hitstopMs, shake: +F.shake.amp.toFixed(3), flash: +F.flash.a.toFixed(3), zoom: +F.zoomPunch.toFixed(3),
        ts: +F.timeScale.toFixed(2), txt: T.$txt?.textContent, hp: A.app.plates.map((p) => p.hp),
        fps: A.perf.fps, vfx: A.app.view.vfx?.active?.length };
    });
    seq.push({ i, gt: +(s.gt - tStart.gt).toFixed(2), ...st });
    console.log(JSON.stringify(seq.at(-1)));
    if (st.w === 0 && i > 3) break;
  }
  const back = await waitPrompt();
  console.log('BACK IN CONTROL at gt', back.gt, 'turn game-seconds =', (back.gt - tStart.gt).toFixed(2));
  await shot(`${MODE}-control`);
  await dumpRec(`rec-${MODE}`);
}

if (MODE === 'occl') {
  await page.evaluate(() => window.__ARENA.battle.quick('FEELX-1'));
  await waitPrompt();
  await page.evaluate(INSTALL);
  // sample camera->actor line of sight across a whole battle
  await page.evaluate(() => {
    const A = window.__ARENA;
    window.__OCCL = [];
    const THREE = A.stage.scene.constructor;
    window.__occlTick = setInterval(() => {
      try {
        const V = A.app.view, cam = A.stage.camera;
        const rc = new (A.__THREE?.Raycaster || Object)();
      } catch {}
    }, 100000);
  });
  console.log('occl mode: use in-page raycast below');
}

console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 10)));
await browser.close();
