// FEEL critic (w) — full-rate frame capture of live turns via CDP screencast,
// aligned to game time (stage.time). Records per-render-frame state and every
// rendered frame as a JPEG so impact timing can be judged from pixels.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8921);
const OUT = process.env.OUT || 'tests/shots/critic-feelw-burst';
const SEED = process.env.SEED || 'FEELW-1';
const ARENA = process.env.ARENA || '';
const TURNS = Number(process.env.TURNS || 4);
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
  return { w: A.battle.waitingFor(), r: A.router.currentId, gt: +A.stage.time.toFixed(3) };
});
const waitPrompt = async (maxMs = 900000) => {
  const t0 = Date.now();
  for (;;) {
    const s = await st();
    if (s.r !== 'battle') return { ...s, st: 'over' };
    if (s.w === 0) return { ...s, st: 'prompt' };
    if (Date.now() - t0 > maxMs) return { ...s, st: 'stall' };
    await sleep(140);
  }
};

await page.evaluate(([s, a]) => window.__ARENA.battle.quick(a ? { seed: s, arena: a } : s), [SEED, ARENA]);
const p0 = await waitPrompt();
console.log('first prompt', JSON.stringify(p0));
console.log('plateHTML', await page.evaluate(() => document.querySelector('.nameplate')?.outerHTML.slice(0, 900) || 'none'));
console.log('speed/tb', await page.evaluate(() => {
  const A = window.__ARENA, tb = A.textbox;
  return { viewSpeed: A.app.view.speed, pace: A.app.view.pace, cps: tb.cps, minHoldMs: tb.minHoldMs,
    autoAdvanceMs: tb.autoAdvanceMs, readMsPerChar: tb.readMsPerChar, instant: tb.instant, tbSpeed: tb.speed,
    feelKeys: Object.keys(A.stage.feel), fps: A.perf.fps };
}));

// ---- recorder ---------------------------------------------------------------
await page.evaluate(async () => {
  const A = window.__ARENA;
  const THREE = await import('three');
  const F = []; window.__F = F; window.__ON = true; window.__SFX = [];
  try {
    const au = A.audio;
    for (const proto of [Object.getPrototypeOf(au), au]) {
      for (const k of Object.getOwnPropertyNames(proto)) {
        const d = Object.getOwnPropertyDescriptor(proto, k);
        if (!d || typeof d.value !== 'function' || k === 'constructor') continue;
        if (!/^(sfx|play|cry|cue|hit|impact|ui)/i.test(k)) continue;
        const orig = d.value;
        Object.defineProperty(au, k, { configurable: true, writable: true, value: function (...a) {
          try { window.__SFX.push({ gt: +A.stage.time.toFixed(3), fn: k, a: typeof a[0] === 'string' ? a[0] : (a[0]?.id ?? '') }); } catch {}
          return orig.apply(this, a);
        } });
      }
    }
  } catch {}
  const cam = A.stage.camera;
  const tick = () => {
    if (window.__ON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, dir = A.app.dir, fe = A.stage.feel, tb = A.textbox;
      cam.updateMatrixWorld(true);
      const cp = cam.position;
      const feel = {}; for (const k of Object.keys(fe)) { const v = fe[k]; if (typeof v === 'number') feel[k] = +v.toFixed(4); }
      const plates = [...document.querySelectorAll('.nameplate')].map((p) => {
        const f = p.querySelector('.hp-fill, .hpfill, .bar > i, .bar span, [class*=fill]');
        return { w: f ? +parseFloat(getComputedStyle(f).width).toFixed(1) : null,
          hid: p.classList.contains('hidden'),
          num: (p.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) };
      });
      F.push({
        gt: +A.stage.time.toFixed(3), wall: +performance.now().toFixed(1),
        shot: dir?.shot?.id ?? null,
        cam: [+cp.x.toFixed(3), +cp.y.toFixed(3), +cp.z.toFixed(3)], fov: +cam.fov.toFixed(2),
        fx: A.stage.fxGroup?.children.length ?? -1, feel,
        txt: (tb?.$txt?.textContent || '').slice(0, 80),
        prev: (tb?.$prev?.textContent || '').slice(0, 60),
        wait: !!tb?.waitingForInput, q: tb?.queue?.length ?? -1,
        plates,
        s: [0, 1].map((i) => {
          const act = V?.actors?.[i]; if (!act) return null;
          const p = new THREE.Vector3().setFromMatrixPosition(act.root.matrixWorld);
          const a = dir?.act?.[i]; const h = a?.fullH || 1.9;
          const nd = p.clone().add(new THREE.Vector3(0, h * 0.5, 0)).project(cam);
          const nh = p.clone().add(new THREE.Vector3(0, h, 0)).project(cam);
          const nf = p.clone().project(cam);
          return { p: [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)],
            ndc: [+nd.x.toFixed(3), +nd.y.toFixed(3)], hy: +nh.y.toFixed(3), fy: +nf.y.toFixed(3),
            hFrac: +((nh.y - nf.y) / 2).toFixed(3),
            on: Math.abs(nd.x) <= 1 && Math.abs(nd.y) <= 1 && nd.z < 1 };
        })
      });
    } catch (e) { F.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
});

// ---- screencast -------------------------------------------------------------
const client = await page.context().newCDPSession(page);
const shots = [];
client.on('Page.screencastFrame', async (f) => {
  shots.push({ ts: f.metadata.timestamp, data: f.data });
  try { await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
});
await client.send('Page.startScreencast', { format: 'jpeg', quality: 55, everyNthFrame: 1 });

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
  return { kind: 'move', name: best.d.name, power: best.d.power, gt: +A.stage.time.toFixed(3) };
});

const turns = [];
for (let n = 0; n < TURNS; n++) {
  const before = await page.evaluate(() => window.__ARENA.battle.events().length);
  const chosen = await pick();
  const wallStart = Date.now();
  const r = await waitPrompt();
  const evs = await page.evaluate((b) => window.__ARENA.battle.events().slice(b), before);
  console.log(`turn ${n + 1}`, JSON.stringify(chosen), '->', r.st, 'gt', r.gt,
    'evs', evs.map((e) => e.t + (e.t === 'damage' ? `(s${e.side},${e.amount},eff${e.eff}${e.crit ? ',CRIT' : ''})` : e.t === 'message' ? `("${e.text?.slice(0, 26)}")` : '')).join(' '));
  turns.push({ chosen, endGt: r.gt, startGt: chosen.gt, evs, wallStart });
  if (r.st !== 'prompt') break;
}

await client.send('Page.stopScreencast').catch(() => {});
const F = await page.evaluate(() => window.__F.slice());
const SFX = await page.evaluate(() => window.__SFX.slice());
await writeFile(`${OUT}/frames.json`, JSON.stringify({ F, SFX, turns: turns.map((t) => ({ ...t })) }));
// write jpegs
const { writeFile: wf } = await import('node:fs/promises');
let i = 0;
const index = [];
for (const s of shots) {
  const name = `f${String(i).padStart(4, '0')}.jpg`;
  await wf(`${OUT}/${name}`, Buffer.from(s.data, 'base64'));
  index.push({ i, ts: s.ts, name });
  i++;
}
await writeFile(`${OUT}/index.json`, JSON.stringify(index));
console.log('screencast frames', shots.length, 'render frames', F.length, 'errFrames', F.filter((f) => f.err).length);
console.log('sfx', SFX.length);
console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 6)));
await browser.close();
