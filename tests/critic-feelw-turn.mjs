// FEEL critic (w) — one full attacking turn, instrumented per render frame,
// plus a screenshot burst. All durations measured in GAME time (stage.time).
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8921);
const OUT = process.env.OUT || 'tests/shots/critic-feelw';
const SEED = process.env.SEED || 'FEELW-1';
const ARENA = process.env.ARENA || '';
const SHOTS = process.env.SHOTS !== '0';
const TURNS = Number(process.env.TURNS || 1);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

const st = () => page.evaluate(() => {
  const A = window.__ARENA;
  return { w: A.battle.waitingFor(), r: A.router.currentId, gt: +A.stage.time.toFixed(3),
    anim: A.battle.isAnimating?.() ?? null, ev: A.battle.events().length };
});
const waitPrompt = async (maxMs = 600000) => {
  const t0 = Date.now();
  for (;;) {
    const s = await st();
    if (s.r !== 'battle') return { ...s, st: 'over' };
    if (s.w === 0) return { ...s, st: 'prompt' };
    if (Date.now() - t0 > maxMs) return { ...s, st: 'stall' };
    await sleep(150);
  }
};

// ---- install recorder -------------------------------------------------------
const installRecorder = () => page.evaluate(async () => {
  const A = window.__ARENA;
  const THREE = await import('three');
  const F = []; window.__F = F; window.__ON = true;
  window.__SFX = [];
  // instrument audio: wrap every function-valued own+proto property
  try {
    const au = A.audio;
    for (const proto of [Object.getPrototypeOf(au), au]) {
      for (const k of Object.getOwnPropertyNames(proto)) {
        if (k === 'constructor') continue;
        const d = Object.getOwnPropertyDescriptor(proto, k);
        if (!d || typeof d.value !== 'function') continue;
        if (!/^(play|sfx|cue|hit|cry|blip|note|thud|impact|whoosh|beep|ui)/i.test(k)) continue;
        const orig = d.value;
        Object.defineProperty(au, k, { configurable: true, writable: true, value: function (...a) {
          try { window.__SFX.push({ gt: +A.stage.time.toFixed(3), fn: k, arg: typeof a[0] === 'string' ? a[0] : (a[0]?.id || typeof a[0]) }); } catch {}
          return orig.apply(this, a);
        } });
      }
    }
  } catch (e) { window.__SFXERR = String(e.message); }

  const cam = A.stage.camera;
  const prevCam = new THREE.Vector3();
  const tick = () => {
    if (window.__ON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, dir = A.app.dir, sc = A.stage.scene;
      cam.updateMatrixWorld(true);
      const cp = cam.position;
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      const tb = A.textbox;
      const plates = [...document.querySelectorAll('.nameplate')].map((p) => {
        const fill = p.querySelector('.hpfill, .hp-fill, [class*=fill]');
        const cs = fill ? getComputedStyle(fill) : null;
        return { w: cs ? cs.width : null, c: cs ? cs.backgroundColor : null,
          hpTxt: (p.querySelector('[class*=hpnum], [class*=hptext], .hp-num')?.textContent || '').trim(),
          hidden: p.classList.contains('hidden') };
      });
      const row = {
        gt: +A.stage.time.toFixed(3),
        shot: dir?.shot?.id ?? dir?.shot?.kind ?? null,
        cam: [+cp.x.toFixed(3), +cp.y.toFixed(3), +cp.z.toFixed(3)],
        fwd: [+fwd.x.toFixed(3), +fwd.y.toFixed(3), +fwd.z.toFixed(3)],
        fov: +cam.fov.toFixed(2),
        fx: A.stage.fxGroup ? A.stage.fxGroup.children.length : -1,
        feel: (() => { const f = A.stage.feel; if (!f) return null;
          const o = {}; for (const k of Object.keys(f)) { const v = f[k];
            if (typeof v === 'number') o[k] = +v.toFixed(3); } return o; })(),
        txt: tb ? (tb.$txt?.textContent || '').slice(0, 90) : null,
        tbBusy: tb ? !!(tb.current || tb.queue?.length) : null,
        tbWait: tb ? !!tb.waitingForInput : null,
        plates,
        s: [0, 1].map((i) => {
          const act = V?.actors?.[i]; if (!act) return null;
          const p = new THREE.Vector3().setFromMatrixPosition(act.root.matrixWorld);
          const a = dir?.act?.[i]; const h = a?.fullH || 1.9;
          const head = p.clone(); head.y += h;
          const mid = p.clone(); mid.y += h * 0.5;
          const nd = mid.clone().project(cam);
          const nh = head.clone().project(cam);
          const nf = p.clone().project(cam);
          return { p: [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)],
            rot: +act.root.rotation.y.toFixed(3),
            sy: +act.root.scale.y.toFixed(3),
            ndc: [+nd.x.toFixed(3), +nd.y.toFixed(3)],
            hy: +nh.y.toFixed(3), fy: +nf.y.toFixed(3),
            hFrac: +((nh.y - nf.y) / 2).toFixed(3),
            on: Math.abs(nd.x) <= 1 && Math.abs(nd.y) <= 1 && nd.z < 1 };
        })
      };
      F.push(row);
    } catch (e) { F.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
});

// ---- go ---------------------------------------------------------------------
const t0 = Date.now();
await page.evaluate(([s, a]) => window.__ARENA.battle.quick(a ? { seed: s, arena: a } : s), [SEED, ARENA]);
const p0 = await waitPrompt();
console.log('first prompt', JSON.stringify(p0), 'wall', ((Date.now() - t0) / 1000).toFixed(1) + 's');
await installRecorder();

const pick = () => page.evaluate(() => {
  const A = window.__ARENA, s = A.battle.screen();
  const side = s.battle.sides[0];
  if (s.forcedSwitch) {
    const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
    A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
    return { kind: 'switch', gt: +A.stage.time.toFixed(3) };
  }
  const mon = side.party[side.activeIndex];
  let best = null;
  for (const m of mon.moves) {
    const d = A.data.moves.find((x) => x.id === m.id);
    if (!d || m.pp <= 0 || d.category === 'status') continue;
    if (!best || (d.power || 0) > (best.d.power || 0)) best = { m, d };
  }
  if (!best) { const m = mon.moves.find((x) => x.pp > 0) || mon.moves[0]; best = { m, d: A.data.moves.find((x) => x.id === m.id) }; }
  A.battle.choose(0, { kind: 'move', moveId: best.m.id, target: 'foe' });
  return { kind: 'move', name: best.d.name, power: best.d.power, gt: +A.stage.time.toFixed(3),
    evBefore: A.battle.events().length };
});

const all = { turns: [] };
for (let n = 0; n < TURNS; n++) {
  const chosen = await pick();
  console.log(`turn ${n + 1} choice`, JSON.stringify(chosen));
  const marks = [];
  let i = 0;
  const deadline = Date.now() + 600000;
  for (;;) {
    const s = await st();
    if (SHOTS && n === 0) {
      const f = `${OUT}/t${n + 1}-${String(i).padStart(3, '0')}.png`;
      await page.screenshot({ path: f });
      marks.push({ i, gt: s.gt, file: f });
    }
    i++;
    if (s.r !== 'battle') { console.log('battle over'); break; }
    if (s.w === 0) { console.log('back to prompt at gt', s.gt); break; }
    if (Date.now() > deadline) { console.log('STALL'); break; }
    if (!SHOTS || n > 0) await sleep(120);
  }
  const evs = await page.evaluate(() => window.__ARENA.battle.events().slice(-40));
  const log = await page.evaluate(() => window.__ARENA.battle.log().slice(-12));
  all.turns.push({ chosen, marks, evs, log });
  console.log('log:', JSON.stringify(log));
}

const F = await page.evaluate(() => window.__F.slice());
const SFX = await page.evaluate(() => window.__SFX.slice());
await writeFile(`${OUT}/frames.json`, JSON.stringify({ F, SFX, all }, null, 0));
console.log('frames', F.length, 'errFrames', F.filter((f) => f.err).length, F.find((f) => f.err)?.err || '');
console.log('sfx events', SFX.length, JSON.stringify(SFX.slice(0, 12)));
console.log('gt span', F[0]?.gt, '->', F[F.length - 1]?.gt);
console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 6)));
await browser.close();
