// CRITIC harness — "the battle, as experienced".
// Not part of the build. Writes only under tests/.
//
//   node tests/critic-feel.mjs --port 8701 --scenario giant --out tests/shots/critic-feel
//
// Scenarios:
//   giant   kaido (7m) vs levi (1.6m), dense frame burst through a whole battle
//   arenas  one mid-battle frame in each of the six arenas
//   fx      forced move sampling across vfx shape families
//   ko      faint / switch-in burst
//   timing  in-page measurement of beat durations against the game clock

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]?.startsWith('--') === false ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const PORT = Number(args.port || 8701);
const QUALITY = args.quality || 'high';
const VW = Number(args.vw || 1440);
const VH = Number(args.vh || 900);
const OUT = args.out || 'tests/shots/critic-feel';
const SCEN = args.scenario || 'giant';
const MAXSHOTS = Number(args.maxshots || 60);
const BASE = `http://127.0.0.1:${PORT}`;

const errors = [];
const manifest = [];

async function boot(browser) {
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(`${BASE}/?quality=${QUALITY}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  // Our own copy of the game's clamped clock, so durations can be read in GAME
  // seconds rather than wall seconds (the harness renders at ~1-4fps).
  await page.evaluate(() => {
    window.__CF = { frames: 0, game: 0, last: performance.now(), seen: 0 };
    const loop = (t) => {
      const raw = Math.min(0.05, (t - window.__CF.last) / 1000);
      window.__CF.last = t; window.__CF.game += raw; window.__CF.frames++;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  return page;
}

/** Everything a critic wants stamped on a frame. */
const SNAP = () => {
  const A = window.__ARENA;
  const s = A.battle.screen();
  const st = A.battle.state();
  const evs = A.battle.events();
  const since = evs.slice(window.__CF.seen);
  window.__CF.seen = evs.length;
  const act = (i) => {
    if (!st) return null;
    const sd = st.sides[i]; const p = sd.party[sd.activeIndex];
    return p && { n: p.name || p.nickname, sp: p.speciesId, hp: p.hp, max: p.maxHp, st: p.status, types: p.types };
  };
  const tb = document.querySelector('.textbox .txt');
  return {
    frames: window.__CF.frames, game: +window.__CF.game.toFixed(2), fps: A.perf.fps,
    tris: A.perf.tris, calls: A.perf.drawCalls,
    screen: A.router.currentId,
    turn: st?.turn ?? null, weather: st?.field?.weather?.id || null, terrain: st?.field?.terrain?.id || null,
    p0: act(0), p1: act(1),
    waiting: s?.waitingChoice ?? null, forced: !!s?.forcedSwitch, busy: A.battle.isAnimating(),
    text: tb ? tb.textContent.trim() : '',
    cmd: document.body.dataset.cmd,
    evs: since.map((e) => {
      const o = { t: e.t };
      for (const k of ['moveName', 'moveId', 'amount', 'hpAfter', 'eff', 'crit', 'uid', 'side', 'id', 'phase', 'speciesId', 'status', 'text', 'reason', 'winner', 'stat', 'delta', 'abilityId'])
        if (e[k] !== undefined) o[k] = e[k];
      return o;
    })
  };
};

/** Wait N seconds of GAME clock (the harness renders far below real time). */
const waitGame = (page, sec) => page.evaluate(async (s) => {
  const target = window.__CF.game + s;
  const hardStop = Date.now() + 180000;
  while (window.__CF.game < target && Date.now() < hardStop) await new Promise((r) => setTimeout(r, 25));
  return +window.__CF.game.toFixed(2);
}, sec);

/** Wait until the battle view has nothing left to animate and wants a command. */
const waitIdle = (page) => page.evaluate(async () => {
  const A = window.__ARENA;
  const hardStop = Date.now() + 180000;
  const g0 = window.__CF.game;
  while (Date.now() < hardStop) {
    const s = A.battle.screen();
    if (!s) break;
    if (!A.battle.isAnimating() && s.waitingChoice !== null) break;
    if (A.textbox?.busy) A.battle.advanceText();
    await new Promise((r) => setTimeout(r, 25));
  }
  return +(window.__CF.game - g0).toFixed(2);
});

async function shot(page, name, tag) {
  const snap = await page.evaluate(SNAP);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  const line = { file: `${name}.png`, tag: tag || '', ...snap };
  manifest.push(line);
  const ev = snap.evs.map((e) => e.t + (e.moveName ? `:${e.moveName}` : '') + (e.crit ? '!CRIT' : '') + (e.eff !== undefined && e.eff !== 1 ? `x${e.eff}` : '')).join(' ');
  console.log(`  ${name} [g=${snap.game}s f=${snap.frames} fps=${snap.fps}] ${snap.p0?.sp || '-'} ${snap.p0?.hp}/${snap.p0?.max} vs ${snap.p1?.sp || '-'} ${snap.p1?.hp}/${snap.p1?.max} | ${ev}`);
  if (snap.text) console.log(`      "${snap.text}"`);
  return snap;
}

const team = (ids, moves) => ({ ids, moves });

async function startBattle(page, { p0, p1, arena, seed }) {
  await page.evaluate(({ p0, p1, arena, seed }) => {
    const A = window.__ARENA;
    const build = (spec) => spec.ids.map((id, i) => {
      const m = A.sim.makeDefaultMember(id, 50);
      if (spec.moves && spec.moves[i]) m.moves = spec.moves[i];
      return m;
    });
    A.battle.start({ seed, arena, mode: 'ai', aiLevel: 'ace', p0Team: build(p0), p1Team: build(p1) });
    window.__CF.seen = 0;
  }, { p0, p1, arena, seed });
}

/** Advance one player decision; returns 'moved' | 'ended' | 'waiting' | 'timeout'. */
async function playerAct(page, prefMoveIds) {
  return page.evaluate(async (pref) => {
    const A = window.__ARENA;
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      if (A.router.currentId !== 'battle') return 'ended';
      const s = A.battle.screen();
      if (!s) return 'ended';
      if (s.waitingChoice === 0) {
        const st = A.battle.state();
        const side = st.sides[0];
        if (s.forcedSwitch) {
          const i = side.party.findIndex((p, i2) => !p.fainted && i2 !== side.activeIndex);
          A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
          return 'switched';
        }
        const mon = side.party[side.activeIndex];
        let pick = null;
        if (pref) for (const id of pref) {
          const mv = mon.moves.find((m) => m.id === id && m.pp > 0 && !m.disabled);
          if (mv) { pick = { kind: 'move', moveId: mv.id, target: 'foe' }; break; }
        }
        if (!pick) pick = A.sim.chooseAction(A.battle.raw(), 0, 'ace');
        A.battle.choose(0, pick);
        return 'moved';
      }
      if (A.textbox?.busy) A.battle.advanceText();
      await new Promise((r) => setTimeout(r, 60));
    }
    return 'timeout';
  }, prefMoveIds || null);
}

/* ------------------------------------------------------------------ */

async function scenGiant(page) {
  // 7.0m vs 1.6m — the worst case for framing and for the camera.
  await startBattle(page, {
    seed: 'CRITIC-GIANT',
    arena: 'onigashima',
    p0: team(['levi', 'usopp', 'chopper']),
    p1: team(['kaido', 'bigmom', 'saitama'])
  });
  await waitGame(page, 0.6);
  await shot(page, 'g-00-intro', 'battle start / intro');
  for (let i = 0; i < 8; i++) { await shot(page, `g-01-intro-${i}`, 'intro burst'); }

  let n = 0;
  for (let t = 0; t < 26 && n < MAXSHOTS; t++) {
    const r = await playerAct(page);
    if (r === 'ended') break;
    if (r === 'timeout') { errors.push('stalled'); break; }
    // dense burst through the resolution of this turn
    for (let k = 0; k < 7 && n < MAXSHOTS; k++) {
      const s = await shot(page, `g-t${String(t).padStart(2, '0')}-${k}`, `turn ${t} beat ${k}`);
      n++;
      if (s.waiting === 0 && !s.busy) break;
    }
  }
  await waitGame(page, 1.0);
  await shot(page, 'g-99-end', 'end');
}

async function scenArenas(page) {
  const arenas = await page.evaluate(() => window.__ARENA.data.arenas.map((a) => a.id));
  for (const a of arenas) {
    await startBattle(page, {
      seed: 'CRITIC-ARENA-' + a, arena: a,
      p0: team(['luffy', 'zoro']), p1: team(['ace', 'law'])
    });
    await waitGame(page, 0.8);
    await shot(page, `a-${a}-intro`, `arena ${a} intro`);
    await waitIdle(page);
    await shot(page, `a-${a}-settled`, `arena ${a} settled, awaiting command`);
    await playerAct(page);
    await waitGame(page, 0.9);
    await shot(page, `a-${a}-mid`, `arena ${a} mid-turn`);
    await waitIdle(page);
    await shot(page, `a-${a}-post`, `arena ${a} after turn`);
  }
}

async function scenFx(page) {
  // Pick one move per fx shape family, from moves any of these fighters can learn.
  const plan = await page.evaluate(() => {
    const A = window.__ARENA;
    const byId = Object.fromEntries(A.data.moves.map((m) => [m.id, m]));
    const out = [];
    const wantShapes = ['beam', 'burst', 'arc', 'melee', 'aura'];
    for (const f of A.data.fighters) {
      const lv = f.learnset.filter((l) => l.lv <= 50).map((l) => l.move);
      for (const id of lv) {
        const m = byId[id];
        if (!m) continue;
        const sh = m.fx?.shape;
        if (!wantShapes.includes(sh)) continue;
        if (out.some((o) => o.shape === sh && o.type === m.type)) continue;
        if (out.filter((o) => o.shape === sh).length >= 3) continue;
        out.push({ fighter: f.id, move: id, shape: sh, type: m.type, name: m.name, scale: m.fx?.scale, power: m.power });
      }
    }
    return out;
  });
  console.log('  fx plan:', plan.map((p) => `${p.shape}/${p.type}:${p.move}@${p.fighter}`).join(', '));
  await writeFile(`${OUT}/fx-plan.json`, JSON.stringify(plan, null, 2));

  for (const p of plan.slice(0, Number(args.fxn || 12))) {
    await startBattle(page, {
      seed: 'CRITIC-FX-' + p.move, arena: 'colosseum',
      p0: team([p.fighter], [[p.move, p.move, p.move, p.move]]),
      p1: team(['chopper'])
    });
    await waitIdle(page);
    const r = await playerAct(page, [p.move]);
    if (r !== 'moved') { console.log('  skip', p.move, r); continue; }
    for (let k = 0; k < 5; k++) {
      const s = await shot(page, `fx-${p.shape}-${p.move}-${k}`, `${p.name} (${p.type}/${p.shape}, scale ${p.scale}) by ${p.fighter}`);
      if (s.waiting === 0 && k > 1) break;
    }
  }
}

async function scenKo(page) {
  // Weak attacker cannot one-shot; give the victim 1 hp worth of bulk by
  // fighting a full battle and bursting only around faint + switch-in.
  await startBattle(page, {
    seed: 'CRITIC-KO', arena: 'marineford',
    p0: team(['saitama', 'goku', 'gojo']), p1: team(['chopper', 'usopp', 'nami'])
  });
  await waitIdle(page);
  await shot(page, 'k-00-intro', 'intro');
  let n = 0;
  for (let t = 0; t < 20 && n < MAXSHOTS; t++) {
    const before = await page.evaluate(() => {
      const st = window.__ARENA.battle.state();
      return st ? st.sides[1].party.filter((p) => p.fainted).length : -1;
    });
    const r = await playerAct(page);
    if (r === 'ended') break;
    for (let k = 0; k < 8 && n < MAXSHOTS; k++) {
      const s = await shot(page, `k-t${String(t).padStart(2, '0')}-${k}`, `turn ${t}`);
      n++;
      if (s.waiting === 0 && !s.busy) break;
    }
    const after = await page.evaluate(() => {
      const st = window.__ARENA.battle.state();
      return st ? st.sides[1].party.filter((p) => p.fainted).length : -1;
    });
    if (after > before) console.log(`  >>> KO happened on turn ${t}`);
  }
  await waitGame(page, 1.0);
  await shot(page, 'k-99-end', 'end / results');
}

/** Duration of each beat, measured on the game's own clamped clock. */
async function scenTiming(page) {
  await startBattle(page, {
    seed: 'CRITIC-TIME', arena: 'colosseum',
    p0: team(['luffy', 'zoro', 'nami']), p1: team(['ace', 'law', 'smoker'])
  });
  await waitIdle(page);
  // Track how long each finished message line stays legible, on the game clock.
  await page.evaluate(() => {
    window.__MSG = [];
    const el = () => document.querySelector('.textbox .txt');
    let prev = '', stableSince = window.__CF.game, longest = '';
    const tick = () => {
      const e = el();
      const now = window.__CF.game;
      const txt = e ? e.textContent.trim() : '';
      if (txt !== prev) {
        // a shrinking / different prefix means a NEW line started typing
        const isGrowth = txt.startsWith(prev) && txt.length >= prev.length;
        if (!isGrowth && longest) {
          window.__MSG.push({ text: longest, shown: +(now - stableSince).toFixed(2), full: +(now - stableSince).toFixed(2) });
          stableSince = now; longest = '';
        }
        if (txt.length > longest.length) longest = txt;
        prev = txt;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const res = await page.evaluate(async () => {
    const A = window.__ARENA;
    const CF = window.__CF;
    const marks = [];
    const t0 = CF.game;
    let lastLen = A.battle.events().length;
    let lastGame = CF.game;
    const deadline = Date.now() + 240000;
    let turns = 0;
    const turnMarks = [];
    while (Date.now() < deadline && turns < 8) {
      const s = A.battle.screen();
      if (!s) break;
      if (s.waitingChoice === 0) {
        const st = A.battle.state();
        if (s.forcedSwitch) {
          const side = st.sides[0];
          const i = side.party.findIndex((p, i2) => !p.fainted && i2 !== side.activeIndex);
          A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
        } else {
          const gStart = CF.game;
          A.battle.choose(0, A.sim.chooseAction(A.battle.raw(), 0, 'ace'));
          turns++;
          // wait for the turn to fully resolve (back to waiting for input)
          const wait = async () => {
            while (Date.now() < deadline) {
              const s2 = A.battle.screen();
              if (!s2) return;
              if (s2.waitingChoice === 0 && !A.battle.isAnimating()) return;
              if (A.textbox?.busy) A.battle.advanceText();
              await new Promise((r) => setTimeout(r, 30));
            }
          };
          await wait();
          turnMarks.push(+(CF.game - gStart).toFixed(2));
        }
      }
      if (A.textbox?.busy) A.battle.advanceText();
      // record event arrival times on the game clock
      const evs = A.battle.events();
      if (evs.length !== lastLen) {
        for (let i = lastLen; i < evs.length; i++) marks.push({ t: evs[i].t, g: +(CF.game - t0).toFixed(2) });
        lastLen = evs.length; lastGame = CF.game;
      }
      await new Promise((r) => setTimeout(r, 20));
    }
    return { turnMarks, marks: marks.slice(0, 200), fps: A.perf.fps, totalGame: +(CF.game - t0).toFixed(2) };
  });
  const msgs = await page.evaluate(() => window.__MSG);
  console.log('  turn durations (game seconds):', res.turnMarks.join(', '));
  console.log('  fps', res.fps, 'total game s', res.totalGame);
  console.log(`  messages: ${msgs.length}`);
  msgs.forEach((m) => console.log(`    ${String(m.shown).padStart(5)}s  "${m.text}"`));
  const shown = msgs.map((m) => m.shown).sort((a, b) => a - b);
  if (shown.length) console.log(`  message screen time: median ${shown[shown.length >> 1]}s  min ${shown[0]}s  max ${shown[shown.length - 1]}s`);
  await writeFile(`${OUT}/timing.json`, JSON.stringify({ ...res, msgs }, null, 2));
}

async function scenWeather(page) {
  // Force weather via a weather move, then look at the arena.
  const plan = await page.evaluate(() => {
    const A = window.__ARENA;
    const out = [];
    for (const m of A.data.moves) {
      const w = (m.effects || []).find((e) => e.kind === 'weather');
      if (!w) continue;
      const f = A.data.fighters.find((f) => f.learnset.some((l) => l.lv <= 50 && l.move === m.id));
      if (!f) continue;
      if (out.some((o) => o.weather === w.value)) continue;
      out.push({ weather: w.value, move: m.id, name: m.name, fighter: f.id });
    }
    return out;
  });
  console.log('  weather plan:', JSON.stringify(plan));
  for (const p of plan) {
    await startBattle(page, {
      seed: 'CRITIC-W-' + p.weather, arena: 'sunny_deck',
      p0: team([p.fighter], [[p.move, p.move, p.move, p.move]]), p1: team(['chopper'])
    });
    await waitIdle(page);
    await shot(page, `w-${p.weather}-before`, `before ${p.name}`);
    const r = await playerAct(page, [p.move]);
    if (r !== 'moved') continue;
    for (let k = 0; k < 4; k++) await shot(page, `w-${p.weather}-${k}`, `${p.weather} via ${p.name}`);
  }
}

async function scenUi(page) {
  // What the player actually looks at when choosing: the command dock.
  await startBattle(page, {
    seed: 'CRITIC-UI', arena: 'baratie',
    p0: team(['luffy', 'zoro', 'nami']), p1: team(['mihawk', 'crocodile', 'enel'])
  });
  await waitIdle(page);
  await shot(page, 'u-00-choose', 'waiting for command');
  await page.keyboard.press('Enter').catch(() => {});
  await waitGame(page, 0.4);
  await shot(page, 'u-01-fight', 'after Enter (FIGHT?)');
  await page.keyboard.press('ArrowRight').catch(() => {});
  await waitGame(page, 0.3);
  await shot(page, 'u-02-nav', 'after ArrowRight');
  await page.keyboard.press('Escape').catch(() => {});
  await waitGame(page, 0.3);
  await shot(page, 'u-03-back', 'after Escape');
  // hover a move card via mouse
  const box = await page.evaluate(() => {
    const el = document.querySelector('.movecard, .move-card, [data-move]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (box) { await page.mouse.move(box.x, box.y); await waitGame(page, 0.3); await shot(page, 'u-04-hover', 'hover move card'); }
}

/* Screen-space geometry: where are the two fighters, and how big is the VFX? */
const MEASURE = () => {
  const A = window.__ARENA;
  const THREE = A.debug.THREE;
  const cam = A.stage.camera;
  const W = innerWidth, H = innerHeight;
  const project = (obj) => {
    if (!obj) return null;
    const box = new THREE.Box3().setFromObject(obj);
    if (!isFinite(box.min.x) || box.isEmpty()) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, anyFront = false;
    for (let i = 0; i < 8; i++) {
      const v = new THREE.Vector3(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z
      ).project(cam);
      if (v.z < 1) anyFront = true;
      const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const inView = anyFront && x1 > 0 && x0 < W && y1 > 0 && y0 < H;
    const centreIn = cx > 0 && cx < W && cy > 0 && cy < H;
    return {
      x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1),
      wPct: +(((x1 - x0) / W) * 100).toFixed(1), hPct: +(((y1 - y0) / H) * 100).toFixed(1),
      inView, centreIn
    };
  };
  const view = A.app.view;
  const fx = A.stage.fxGroup;
  let fxCount = 0; fx?.traverse?.((o) => { if (o.isMesh || o.isPoints || o.isSprite || o.isLine) fxCount++; });
  return {
    p0: project(view.actors[0]?.root), p1: project(view.actors[1]?.root),
    fx: fxCount ? project(fx) : null, fxCount,
    dock: (() => { const el = document.querySelector('.textbox'); if (!el) return null; const r = el.getBoundingClientRect(); return { y0: Math.round(r.y), h: Math.round(r.height) }; })()
  };
};

async function scenFrame(page) {
  const pairs = [
    ['levi', 'kaido', 'onigashima'],      // 1.60 vs 7.00
    ['luffy', 'zoro', 'colosseum'],       // both ~1.7
    ['chopper', 'bigmom', 'marineford'],  // tiny vs huge
    ['kaido', 'levi', 'skypiea'],         // reversed: giant is the PLAYER
    ['mihawk', 'hancock', 'baratie'],
    ['franky', 'gojo', 'sunny_deck']
  ];
  const rows = [];
  for (const [a, b, arena] of pairs) {
    await startBattle(page, { seed: 'CRITIC-FRAME-' + a + b, arena, p0: team([a, 'nami']), p1: team([b, 'usopp']) });
    await waitIdle(page);
    const idle = await page.evaluate(MEASURE);
    const heights = await page.evaluate(({ a, b }) => {
      const F = window.__ARENA.data.fighters;
      return { h0: F.find((f) => f.id === a).model.height, h1: F.find((f) => f.id === b).model.height };
    }, { a, b });
    await shot(page, `f-${a}-vs-${b}-idle`, `idle framing ${a}(${heights.h0}m) vs ${b}(${heights.h1}m) @${arena}`);
    console.log(`   IDLE ${a} ${JSON.stringify(idle.p0)}  |  ${b} ${JSON.stringify(idle.p1)}`);
    rows.push({ pair: `${a}/${b}`, arena, phase: 'idle', ...heights, ...idle });
    // during an attack
    await playerAct(page);
    const mid = [];
    for (let k = 0; k < 5; k++) {
      const m = await page.evaluate(MEASURE);
      mid.push(m);
      await shot(page, `f-${a}-vs-${b}-t${k}`, `turn beat ${k}`);
      rows.push({ pair: `${a}/${b}`, arena, phase: 'beat' + k, ...heights, ...m });
      console.log(`   BEAT${k} p0=${JSON.stringify(m.p0)} p1=${JSON.stringify(m.p1)} fx=${JSON.stringify(m.fx)} n=${m.fxCount}`);
    }
  }
  await writeFile(`${OUT}/framing.json`, JSON.stringify(rows, null, 2));
  const off = rows.filter((r) => !r.p0?.inView || !r.p1?.inView);
  console.log(`\n  frames where a fighter is entirely off-screen: ${off.length}/${rows.length}`);
  off.forEach((r) => console.log(`   ${r.pair} ${r.phase}: p0 in=${r.p0?.inView} p1 in=${r.p1?.inView}`));
}

/** Is the fighter actually visible, or is arena geometry in front of it? */
const OCCLUSION = () => {
  const A = window.__ARENA;
  const THREE = A.debug.THREE;
  const cam = A.stage.camera;
  const view = A.app.view;
  const test = (side) => {
    const root = view.actors[side]?.root;
    if (!root) return null;
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return null;
    const c = box.getCenter(new THREE.Vector3());
    c.y = box.min.y + (box.max.y - box.min.y) * 0.7;   // chest/head height
    const dir = c.clone().sub(cam.position);
    const dist = dir.length();
    const rc = new THREE.Raycaster(cam.position, dir.normalize(), 0.05, dist - 0.02);
    rc.camera = cam;   // three needs this to raycast sprites
    const hits = rc.intersectObjects(A.stage.scene.children, true)
      .filter((h) => h.object.visible && h.object.material && h.object.material.opacity !== 0
        && !(h.object.material.transparent && h.object.material.opacity < 0.35));
    let blocker = null;
    for (const h of hits) {
      let o = h.object, mine = false;
      while (o) { if (o === root) { mine = true; break; } o = o.parent; }
      if (!mine) { blocker = h; break; }
    }
    return { blocked: !!blocker, by: blocker ? (blocker.object.name || blocker.object.type) : null, dist: +dist.toFixed(2) };
  };
  return {
    cam: [+cam.position.x.toFixed(2), +cam.position.y.toFixed(2), +cam.position.z.toFixed(2)],
    p0: test(0), p1: test(1)
  };
};

async function scenIntro(page) {
  for (const arena of ['colosseum', 'marineford', 'sunny_deck', 'onigashima', 'skypiea', 'baratie']) {
    await startBattle(page, { seed: 'CRITIC-INTRO-' + arena, arena, p0: team(['luffy', 'nami']), p1: team(['zoro', 'usopp']) });
    let last = 0;
    for (const at of [0.5, 1.5, 3.0, 5.0]) {
      await waitGame(page, at - last); last = at;
      const occ = await page.evaluate(OCCLUSION);
      const m = await page.evaluate(MEASURE);
      const s = await shot(page, `i-${arena}-${String(at).replace('.', '_')}s`, `${arena} @${at}s from battle start`);
      console.log(`   ${arena} t=${at}s prompt=${s.waiting === 0 ? 'YES' : 'no'} cam=${JSON.stringify(occ.cam)} p0blocked=${occ.p0?.blocked} p1blocked=${occ.p1?.blocked} p0=${m.p0?.wPct}%x${m.p0?.hPct}% p1=${m.p1?.wPct}%x${m.p1?.hPct}%`);
    }
  }
}

/** The state a player actually sits in: waiting to pick a move, turn after turn. */
async function scenRest(page) {
  const arenas = ['colosseum', 'marineford', 'sunny_deck', 'onigashima', 'skypiea', 'baratie'];
  const rows = [];
  for (const arena of arenas) {
    await startBattle(page, { seed: 'CRITIC-REST-' + arena, arena, p0: team(['luffy', 'nami', 'zoro']), p1: team(['ace', 'usopp', 'law']) });
    for (let t = 0; t < 4; t++) {
      await waitIdle(page);
      await waitGame(page, 1.6);          // give the camera time to arrive
      const m = await page.evaluate(MEASURE);
      const o = await page.evaluate(OCCLUSION);
      const s = await shot(page, `r-${arena}-t${t}`, `${arena} resting, turn ${t}`);
      const bad = [];
      if (!m.p0?.inView) bad.push('P0 OFF-SCREEN');
      if (!m.p1?.inView) bad.push('P1 OFF-SCREEN');
      if (o.p0?.blocked) bad.push('P0 occluded');
      if (o.p1?.blocked) bad.push('P1 occluded');
      if ((m.p0?.hPct || 0) < 12) bad.push(`P0 tiny ${m.p0?.hPct}%`);
      if ((m.p1?.hPct || 0) < 12) bad.push(`P1 tiny ${m.p1?.hPct}%`);
      console.log(`   REST ${arena} t${t}: p0 ${m.p0?.wPct}x${m.p0?.hPct}% in=${m.p0?.inView} blk=${o.p0?.blocked} | p1 ${m.p1?.wPct}x${m.p1?.hPct}% in=${m.p1?.inView} blk=${o.p1?.blocked} ${bad.length ? '<<< ' + bad.join(', ') : 'ok'}`);
      rows.push({ arena, turn: t, bad, m, o, text: s.text });
      const r = await playerAct(page);
      if (r === 'ended') break;
    }
  }
  const bad = rows.filter((r) => r.bad.length);
  console.log(`\n  resting frames with a problem: ${bad.length}/${rows.length}`);
  await writeFile(`${OUT}/rest.json`, JSON.stringify(rows, null, 2));
}

async function scenImpact(page) {
  // Slow the view down so the harness's ~2fps capture lands several frames
  // inside each beat. Pacing is judged separately, at 1x, in `timing`.
  const SLOW = Number(args.slow || 0.35);
  await startBattle(page, {
    seed: args.seed || 'CRITIC-IMPACT-3', arena: 'colosseum',
    p0: team(['zoro', 'luffy', 'nami']), p1: team(['chopper', 'usopp', 'brook'])
  });
  await page.evaluate((v) => window.__ARENA.battle.setSpeed(v), SLOW);
  await waitIdle(page);
  await shot(page, 'x-00-idle', 'awaiting command');
  let n = 0;
  for (let t = 0; t < 14 && n < MAXSHOTS; t++) {
    const r = await playerAct(page);
    if (r === 'ended') break;
    if (r === 'timeout') { errors.push('stall'); break; }
    for (let k = 0; k < 12 && n < MAXSHOTS; k++) {
      const s = await shot(page, `x-t${String(t).padStart(2, '0')}-${String(k).padStart(2, '0')}`, `turn ${t}`);
      n++;
      if (s.waiting !== null && !s.busy) break;
    }
  }
  await waitGame(page, 1.0);
  await shot(page, 'x-99-end', 'after last turn');
}

/** A switch-in, and a guaranteed-ish critical hit, both captured densely. */
async function scenBeats(page) {
  const pick = await page.evaluate(() => {
    const A = window.__ARENA;
    const best = A.data.moves.filter((m) => (m.critStage || 0) >= 2 && m.power > 0)
      .sort((a, b) => (b.critStage - a.critStage) || (b.power - a.power));
    const out = [];
    for (const m of best) {
      const f = A.data.fighters.find((f) => f.learnset.some((l) => l.lv <= 50 && l.move === m.id));
      if (f) out.push({ move: m.id, name: m.name, critStage: m.critStage, power: m.power, fighter: f.id, type: m.type, fx: m.fx });
      if (out.length >= 3) break;
    }
    return out;
  });
  console.log('  high-crit moves:', JSON.stringify(pick));
  const p = pick[0] || { move: 'gum_gum_pistol', name: 'Gum-Gum Pistol', critStage: 0, fighter: 'luffy' };
  await startBattle(page, {
    seed: 'CRITIC-BEATS', arena: 'marineford',
    p0: team([p.fighter, 'nami', 'chopper'], [[p.move, p.move, p.move, p.move]]),
    p1: team(['usopp', 'brook', 'franky'])
  });
  await page.evaluate(() => {
    window.__ARENA.battle.setSpeed(0.4);
    // force crits: bump the live combatants' crit stage through the debug surface
    for (const s of window.__ARENA.battle.raw().sides) for (const m of s.party) m.critStageBonus = 4;
  });
  await waitIdle(page); await waitGame(page, 1.2);
  await shot(page, 'b-00-rest', 'resting');

  // --- switch out / in ---
  await page.evaluate(() => window.__ARENA.battle.choose(0, { kind: 'switch', toSlot: 1 }));
  for (let k = 0; k < 8; k++) {
    const s = await shot(page, `b-01-switch-${k}`, 'switch out / in');
    if (s.waiting !== null && !s.busy && k > 3) break;
  }
  await waitIdle(page);
  // switch back to the crit user
  await page.evaluate(() => window.__ARENA.battle.choose(0, { kind: 'switch', toSlot: 0 }));
  await waitIdle(page);

  // --- hunt a crit ---
  let found = false;
  for (let t = 0; t < 14 && !found; t++) {
    const r = await playerAct(page, [p.move]);
    if (r === 'ended') break;
    for (let k = 0; k < 10; k++) {
      const s = await shot(page, `b-t${String(t).padStart(2, '0')}-${k}`, `${p.name} (critStage ${p.critStage})`);
      if (s.evs.some((e) => e.crit)) { found = true; console.log('   *** CRIT on this turn ***'); }
      if (s.waiting !== null && !s.busy) break;
    }
    if (found) { for (let k = 0; k < 4; k++) await shot(page, `b-crit-after-${k}`, 'after crit'); }
  }
  console.log('  crit captured:', found);
}

async function scenAudio(page) {
  const keys = await page.evaluate(() => {
    const a = window.__ARENA.audio;
    window.__AC = [];
    const names = [];
    let o = a;
    const seen = new Set();
    while (o && o !== Object.prototype) { for (const k of Object.getOwnPropertyNames(o)) seen.add(k); o = Object.getPrototypeOf(o); }
    for (const k of seen) {
      let fn; try { fn = a[k]; } catch { continue; }
      if (typeof fn !== 'function') continue;
      names.push(k);
      const orig = fn.bind(a);
      a[k] = (...args) => {
        window.__AC.push({ g: +window.__CF.game.toFixed(2), fn: k, a: args.map((x) => (x && typeof x === 'object' ? '{obj}' : String(x))).join(',') });
        return orig(...args);
      };
    }
    // count live WebAudio nodes actually being created
    const AC = window.AudioContext || window.webkitAudioContext;
    for (const m of ['createOscillator', 'createBufferSource', 'createGain']) {
      const o0 = AC.prototype[m];
      AC.prototype[m] = function (...a2) { window.__AC.push({ g: +window.__CF.game.toFixed(2), fn: 'node:' + m, a: '' }); return o0.apply(this, a2); };
    }
    a.setMuted(false);
    return names;
  });
  console.log('  audio api:', keys.sort().join(', '));
  await startBattle(page, { seed: 'CRITIC-AUDIO', arena: 'colosseum', p0: team(['zoro', 'luffy']), p1: team(['chopper', 'usopp']) });
  await waitIdle(page);
  for (let t = 0; t < 4; t++) { const r = await playerAct(page); if (r === 'ended') break; await waitIdle(page); }
  const calls = await page.evaluate(() => window.__AC);
  const byFn = {};
  for (const c of calls) byFn[c.fn + (c.a ? ' ' + c.a : '')] = (byFn[c.fn + (c.a ? ' ' + c.a : '')] || 0) + 1;
  console.log('  calls over 4 turns:');
  Object.entries(byFn).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`    ${v}x  ${k}`));
  await writeFile(`${OUT}/audio.json`, JSON.stringify(calls, null, 2));
}

const SCENARIOS = { giant: scenGiant, arenas: scenArenas, fx: scenFx, ko: scenKo, timing: scenTiming, weather: scenWeather, ui: scenUi, frame: scenFrame, intro: scenIntro, rest: scenRest, beats: scenBeats, impact: scenImpact, audio: scenAudio };

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await boot(browser);
  const fn = SCENARIOS[SCEN];
  if (!fn) throw new Error('unknown scenario ' + SCEN);
  console.log(`▶ scenario ${SCEN} @ ${VW}x${VH} quality=${QUALITY}`);
  await fn(page);
  await writeFile(`${OUT}/manifest-${SCEN}.json`, JSON.stringify({ manifest, errors }, null, 2));
  console.log(`\n${errors.length} console/page errors`);
  [...new Set(errors)].slice(0, 20).forEach((e) => console.log('  - ' + e));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
