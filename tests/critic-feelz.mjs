// FEEL critic (independent run) — one boot, three captures:
//   pass 1: screenshot burst across a full attacking turn at NORMAL speed
//           (software rendering is slow enough that sequential screenshots
//            already sample ~every game frame)
//   pass 2: several more turns, timings only, on the game clock
//   pass 3: screenshot burst across a KO
// Everything is measured with window.__ARENA.stage.time (the game clock), never
// wall-clock.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8875);
const OUT = process.env.OUT || 'tests/shots/critic-feelz';
const VW = Number(process.env.VW || 960), VH = Number(process.env.VH || 600);
const SEED = process.env.SEED || 'FEELZ-3';
const BURST = Number(process.env.BURST || 60);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${PORT}/?quality=${process.env.Q || 'low'}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);

// audio cue log (muted, but every cue timestamped on the game clock)
await page.evaluate(() => {
  const A = window.__ARENA; window.__SFX = [];
  for (const k of ['sfx', 'cry', 'music', 'stinger']) {
    if (typeof A.audio[k] !== 'function') continue;
    const orig = A.audio[k].bind(A.audio);
    A.audio[k] = (...a) => {
      try { window.__SFX.push({ k, n: typeof a[0] === 'string' ? a[0] : (a[0]?.id || '?'), gt: +A.stage.time.toFixed(3) }); } catch {}
      return orig(...a);
    };
  }
  A.audio.setMuted(true);
});

// per-frame recorder on the game clock (dt is clamped to 0.05 → ~20 samples/game-second)
await page.evaluate(() => {
  const A = window.__ARENA; const S = []; window.__REC = S; window.__RECON = true;
  const tick = () => {
    if (window.__RECON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, D = A.app.dir, T = A.app.textbox, F = A.stage.feel, C = A.stage.camera;
      S.push({
        gt: +A.stage.time.toFixed(4),
        shot: D.shot?.id ?? null, blend: +(D.blend ?? 1).toFixed(3),
        cam: [+C.position.x.toFixed(2), +C.position.y.toFixed(2), +C.position.z.toFixed(2)], fov: +C.fov.toFixed(1),
        chars: T.charIdx, full: T.current ? (T.current.text || '').length : 0, tq: T.queue.length, wfi: !!T.waitingForInput,
        txt: T.$txt ? T.$txt.textContent : '',
        hp: A.app.plates.map((p) => [p.hp, +(p.hpSpring?.value ?? 0).toFixed(4)]),
        shake: +F.shake.amp.toFixed(4), flash: +F.flash.a.toFixed(4), hs: +F.hitstopMs.toFixed(1),
        zoom: +F.zoomPunch.toFixed(4), chroma: +F.chroma.toFixed(3), ts: +F.timeScale.toFixed(3),
        vfx: V.vfx?.active?.length ?? -1, q: V.queue?.length ?? -1,
        act: (V.actors || []).map((a) => (a ? [+a.root.position.x.toFixed(2), +a.root.position.y.toFixed(2), +a.root.position.z.toFixed(2)] : null)),
        wait: A.battle.waitingFor?.() ?? null, anim: A.battle.isAnimating?.() ?? null,
        dock: !!document.querySelector('.cmdbtn')
      });
    } catch (e) { S.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
});

const gt = () => page.evaluate(() => +window.__ARENA.stage.time.toFixed(3));
const probe = () => page.evaluate(() => {
  const A = window.__ARENA, F = A.stage.feel, D = A.app.dir, T = A.app.textbox, V = A.app.view;
  return { gt: +A.stage.time.toFixed(3), fps: +(A.perf.fps || 0).toFixed(1), shot: D.shot?.id ?? null,
    hs: +F.hitstopMs.toFixed(0), sh: +F.shake.amp.toFixed(3), fl: +F.flash.a.toFixed(3), z: +F.zoomPunch.toFixed(3),
    ch: +F.chroma.toFixed(2), ts: +F.timeScale.toFixed(2), txt: T.$txt?.textContent || '',
    hp: A.app.plates.map((p) => p.hp), vfx: V.vfx?.active?.length ?? -1,
    w: A.battle.waitingFor(), dock: !!document.querySelector('.cmdbtn'), r: A.router.currentId };
});
const waitPrompt = async (maxMs = 420000) => {
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > maxMs) return { st: 'stall' };
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId,
      f: window.__ARENA.battle.screen?.()?.forcedSwitch ?? null, gt: +window.__ARENA.stage.time.toFixed(3), fps: window.__ARENA.perf.fps }));
    if (s.r !== 'battle') return { st: 'over', ...s };
    if (s.w === 0) return { st: 'prompt', ...s };
    await sleep(120);
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
  return { kind: 'move', name: best.d.name, power: best.d.power, fx: best.d.fx };
});

const burst = async (tag, n) => {
  const a = await gt();
  const rows = [];
  for (let i = 0; i < n; i++) {
    await page.screenshot({ path: `${OUT}/${tag}-${String(i).padStart(2, '0')}.png` });
    const s = await probe();
    rows.push({ i, dgt: +(s.gt - a).toFixed(3), ...s });
    console.log(JSON.stringify(rows.at(-1)));
    if (s.r !== 'battle') break;
    if (s.w === 0 && i > 6) break;
  }
  await writeFile(`${OUT}/${tag}-frames.json`, JSON.stringify(rows, null, 1));
  return rows;
};

// ---------------------------------------------------------------------------
const tBoot = await gt();
await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
const first = await waitPrompt();
console.log('== intro: first prompt @gt', first.gt, ' intro game-seconds', (first.gt - tBoot).toFixed(2), 'fps', first.fps);
await page.screenshot({ path: `${OUT}/a-prompt.png` });
console.log('prompt state', JSON.stringify(await probe()));

// pass 1 — one whole attacking turn, sampled hard
console.log('== pass 1: turn burst');
console.log('chose', JSON.stringify(await pickMove()));
await burst('t1', BURST);
console.log('after-turn state', JSON.stringify(await probe()));
await writeFile(`${OUT}/rec-1.json`, JSON.stringify(await page.evaluate(() => ({ rec: window.__REC.slice(), sfx: window.__SFX.slice() }))));

// pass 2 — more turns, timings only, until the foe is nearly dead
console.log('== pass 2: turn timings');
const rows = [];
for (let t = 0; t < 12; t++) {
  const near = await page.evaluate(() => {
    const s = window.__ARENA.battle.screen(); if (!s) return null;
    const f = s.battle.sides[1]; const m = f.party[f.activeIndex];
    return { frac: m.hp / m.maxHp, forced: s.forcedSwitch, name: m.nickname };
  });
  if (near && near.frac < 0.40 && !near.forced) { console.log('near-KO reached', JSON.stringify(near)); break; }
  const a = await gt();
  const c = await pickMove();
  const r = await waitPrompt();
  rows.push({ t, choice: c.name || c.kind, gs: +((r.gt ?? (await gt())) - a).toFixed(2), st: r.st, forced: r.f });
  console.log(JSON.stringify(rows.at(-1)));
  if (r.st !== 'prompt') break;
}
await writeFile(`${OUT}/turns.json`, JSON.stringify(rows, null, 1));

// pass 3 — the KO
console.log('== pass 3: KO burst');
console.log('chose', JSON.stringify(await pickMove()));
await burst('ko', Number(process.env.KOBURST || 46));
console.log('post-KO state', JSON.stringify(await probe()));
await writeFile(`${OUT}/rec-2.json`, JSON.stringify(await page.evaluate(() => ({ rec: window.__REC.slice(), sfx: window.__SFX.slice() }))));

console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 8)));
await browser.close();
