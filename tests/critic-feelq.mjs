// FEEL critic (independent) — capture ONE full attacking turn as a burst of frames
// with game-time stamps, plus in-page per-frame telemetry (camera, actors, feel,
// HP bar, textbox, sfx). Timings are measured with stage.time, never wall clock.
//
//   PORT=8901 SEED=FQ-1 TURNS=1 node tests/critic-feelq.mjs
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8901);
const OUT = process.env.OUT || 'tests/shots/critic-feelq';
const SEED = process.env.SEED || 'FQ-1';
const TURNS = Number(process.env.TURNS || 1);
const SHOTS = process.env.SHOTS !== '0';
const ARENA = process.env.ARENA || '';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 900, height: 560 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 90000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

// ---- instrumentation ------------------------------------------------------
await page.evaluate(() => {
  const A = window.__ARENA;
  const T = { frames: [], sfx: [], text: [], marks: [] };
  window.__T = T;
  const gt = () => +A.stage.time.toFixed(4);

  // audio punctuation (muted, but we log the calls)
  const rawSfx = A.audio.sfx.bind(A.audio), rawCry = A.audio.cry.bind(A.audio);
  A.audio.sfx = (n, o) => { T.sfx.push({ gt: gt(), n: String(n) }); return rawSfx(n, o); };
  A.audio.cry = (w, o) => { T.sfx.push({ gt: gt(), n: 'cry' }); return rawCry(w, o); };

  const num = (v) => (typeof v === 'number' ? +v.toFixed(4) : v);
  let lastText = null;
  const tick = () => {
    if (window.__ON) requestAnimationFrame(tick);
    if (!window.__REC) return;
    try {
      const st = A.stage, f = st.feel, cam = st.camera, V = A.app.view, dir = A.app.dir;
      const row = {
        gt: gt(),
        fps: num(A.perf.fps),
        busy: !!V.busy,
        shot: dir?.shot?.id ?? dir?.shot?.kind ?? null,
        cam: [num(cam.position.x), num(cam.position.y), num(cam.position.z)],
        fov: num(cam.fov),
        hitstop: num(f.hitstopMs), shake: num(f.shake.amp), flash: num(f.flash.a),
        zoom: num(f.zoomPunch), ts: num(f.timeScale),
        fx: st.fxGroup ? st.fxGroup.children.length : -1,
        a: [0, 1].map((s) => {
          const act = V.actors?.[s];
          if (!act) return null;
          const p = act.root.position;
          return [num(p.x), num(p.y), num(p.z), num(act.root.rotation.y)];
        })
      };
      const bars = document.querySelectorAll('.nameplate .np-fill');
      row.hp = [...bars].map((b) => +(parseFloat(b.style.width) || 0).toFixed(1));
      const tb = document.querySelector('.textbox');
      row.tbHidden = tb ? tb.classList.contains('hidden') : null;
      const txt = document.querySelector('.textbox .txt');
      row.txt = txt ? txt.textContent : '';
      if (row.txt !== lastText) { T.text.push({ gt: row.gt, txt: row.txt }); lastText = row.txt; }
      T.frames.push(row);
    } catch (e) { T.frames.push({ gt: gt(), err: String(e.message) }); }
  };
  window.__ON = true; window.__REC = false;
  requestAnimationFrame(tick);
});

const gtNow = () => page.evaluate(() => +window.__ARENA.stage.time.toFixed(4));
const waitPrompt = async (maxMs = 600000) => {
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > maxMs) return 'stall';
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId }));
    if (s.r !== 'battle') return 'over';
    if (s.w === 0) return 'prompt';
    await sleep(100);
  }
};

await page.evaluate(([s, a]) => window.__ARENA.battle.quick(a ? { seed: s, arena: a, mode: 'ai', aiLevel: 'ace', teamSize: 3 } : s), [SEED, ARENA]);
console.log('intro ->', await waitPrompt());
console.log('arena', await page.evaluate(() => window.__ARENA.app.router.current?.battle?.arena ?? '?'));

let shotN = 0;
for (let turn = 0; turn < TURNS; turn++) {
  await page.evaluate(() => { window.__REC = true; window.__T.marks.push({ gt: +window.__ARENA.stage.time.toFixed(4), m: 'prompt-open' }); });
  const before = await gtNow();
  const pick = await page.evaluate(() => {
    const A = window.__ARENA, s = A.battle.screen();
    const side = s.battle.sides[0];
    if (s.forcedSwitch) {
      const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
      A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
      return { kind: 'switch' };
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
    window.__T.marks.push({ gt: +A.stage.time.toFixed(4), m: 'choice-submitted:' + best.d.name });
    return { kind: 'move', name: best.d.name, power: best.d.power, fx: best.d.fx, user: mon.speciesId };
  });
  console.log(`turn ${turn + 1} choice:`, JSON.stringify(pick), 'gt', before);

  // burst-capture frames until the next prompt
  const t0 = Date.now();
  for (;;) {
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId,
      gt: +window.__ARENA.stage.time.toFixed(3), busy: window.__ARENA.app.view.busy }));
    if (SHOTS && shotN < Number(process.env.MAXSHOTS || 44)) {
      shotN++;
      const name = `${OUT}/t${turn + 1}-${String(shotN).padStart(3, '0')}-gt${s.gt}.png`;
      await page.screenshot({ path: name });
    }
    if (s.r !== 'battle') { console.log('battle ended'); turn = TURNS; break; }
    if (s.w === 0) break;
    if (Date.now() - t0 > 600000) { console.log('STALL'); break; }
  }
  const after = await gtNow();
  await page.evaluate(() => window.__T.marks.push({ gt: +window.__ARENA.stage.time.toFixed(4), m: 'prompt-open' }));
  console.log(`turn ${turn + 1} game-time cost: ${(after - before).toFixed(2)}s  (wall ${(Date.now() - t0) / 1000}s)`);
}

const T = await page.evaluate(() => window.__T);
await writeFile(`${OUT}/telemetry.json`, JSON.stringify(T));
console.log('frames', T.frames.length, 'sfx', T.sfx.length, 'textlines', T.text.length);
console.log('MARKS', JSON.stringify(T.marks));
console.log('SFX  ', JSON.stringify(T.sfx));
console.log('TEXT ', JSON.stringify(T.text, null, 0));
console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 8)));
await browser.close();
