// Pacing instrumentation harness — the ruler for GAME FEEL.
//
//   node tools/pacing.mjs --label before                     # 1x/2x/4x sweep
//   node tools/pacing.mjs --label after --burst              # + dense frame burst on a big hit
//   node tools/pacing.mjs --label reduced --reduced          # reduced-motion pass
//
// Why not just wall clock?  The renderer is software (swiftshader) in CI, so the
// browser produces ~15-30 fps and main.js clamps each frame's dt to 50 ms.  Every
// animation in the game is dt-driven, so the number that actually decides how long
// a turn *feels* is the sum of those clamped dts — the "game clock".  We record
// wall clock, game clock and observed fps, and report all three.
//
// Outputs <out>/<label>.json and prints a table.

import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import net from 'node:net';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const PORT = Number(args.port || 8306);
const OUT = args.out || 'tests/pacing';
const LABEL = String(args.label || 'run');
const TURNS = Number(args.turns || 14);
const SEED = String(args.seed || 'PACE-7');
const SPEEDS = String(args.speeds || '1,2,4').split(',').map(Number);
const BURST = !!args.burst;
const REDUCED = !!args.reduced;
const BASE = `http://127.0.0.1:${PORT}`;

/* ------------------------------------------------------------------ */
/* server                                                              */
/* ------------------------------------------------------------------ */

function portOpen(port) {
  return new Promise((res) => {
    const s = net.connect(port, '127.0.0.1');
    s.on('connect', () => { s.destroy(); res(true); });
    s.on('error', () => res(false));
    setTimeout(() => { s.destroy(); res(false); }, 1200);
  });
}

async function ensureServer() {
  if (await portOpen(PORT)) { console.log(`  (reusing server on ${PORT})`); return null; }
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('server start timeout')), 8000);
    p.stdout.on('data', (d) => { if (String(d).includes('serving')) { clearTimeout(t); res(); } });
    p.stderr.on('data', (d) => process.stderr.write(d));
  });
  return p;
}

/* ------------------------------------------------------------------ */
/* in-page probe                                                       */
/* ------------------------------------------------------------------ */

/** Installed into the page. Samples one record per animation frame. */
const PROBE_SRC = `
(() => {
  if (window.__PACE) return;
  const A = window.__ARENA;
  const P = {
    frame: 0, gameClock: 0, wall0: performance.now(),
    dead: { frames: 0, time: 0 },
    byType: {},          // event type -> seconds where a beat of that type was live
    gateType: {},        // event type -> seconds where that beat was the newest one
    log: [],             // sparse: beat starts
    maxRunLen: 0, curRun: 0,
    fpsSamples: []
  };
  window.__PACE = P;

  let lastNow = performance.now();
  let prevSig = null;

  function view() { return A.app.view; }
  function beats(v) {
    if (Array.isArray(v.beats)) return v.beats;
    return v.beat ? [v.beat] : [];
  }

  function signature(v) {
    const f = A.app.stage.feel;
    const s = [];
    s.push(f.shake.amp, f.flash.a, f.zoomPunch, f.hitstopMs, f.timeScale, f.chroma || 0);
    s.push(v.vfx.active.length);
    for (const a of v.actors) {
      if (!a) { s.push(0, 0, 0, 0, 0); continue; }
      s.push(a.root.position.x, a.root.position.y, a.root.position.z, a.root.rotation.z, a.root.scale.x);
      s.push(a.rig.spine.rotation.y || 0, a.rig.body.position.y || 0, a.rig.auraMat.opacity || 0);
    }
    for (const p of A.app.plates) s.push(p.hpSpring.value, p.hpSpring.vel);
    const tb = A.app.textbox;
    s.push(tb.charIdx, tb.queue.length, tb.current ? 1 : 0);
    s.push(document.querySelectorAll('.dmgnum').length);
    s.push(v.dir.blend);
    return s;
  }

  function isStatic(v, sig) {
    if (!prevSig || prevSig.length !== sig.length) return false;
    for (let i = 0; i < sig.length; i++) if (Math.abs(sig[i] - prevSig[i]) > 1e-6) return false;
    return true;
  }

  function tick() {
    requestAnimationFrame(tick);
    const now = performance.now();
    const raw = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    const v = view();
    if (!v) return;
    P.frame++;
    P.gameClock += raw;

    const bs = beats(v);
    const seen = new Set();
    for (const b of bs) {
      const t = b.ev && b.ev.t; if (!t) continue;
      if (!seen.has(t)) { P.byType[t] = (P.byType[t] || 0) + raw; seen.add(t); }
    }
    const gate = bs.length ? (bs[bs.length - 1].ev && bs[bs.length - 1].ev.t) : (v.queue.length ? '_gated' : '_idle');
    P.gateType[gate] = (P.gateType[gate] || 0) + raw;

    const sig = signature(v);
    const st = isStatic(v, sig);
    prevSig = sig;
    if (st) {
      P.dead.frames++; P.dead.time += raw; P.curRun += raw;
      if (P.curRun > P.maxRunLen) P.maxRunLen = P.curRun;
    } else P.curRun = 0;
  }
  requestAnimationFrame(tick);

  P.snap = () => ({
    t: performance.now(), frame: P.frame, gameClock: P.gameClock,
    deadFrames: P.dead.frames, deadTime: P.dead.time,
    byType: { ...P.byType }, gateType: { ...P.gateType }
  });
  P.diff = (a, b) => {
    const d = {
      wall: (b.t - a.t) / 1000, frames: b.frame - a.frame,
      game: b.gameClock - a.gameClock,
      deadFrames: b.deadFrames - a.deadFrames, deadTime: b.deadTime - a.deadTime,
      byType: {}, gateType: {}
    };
    for (const k of new Set([...Object.keys(a.byType), ...Object.keys(b.byType)]))
      { const v = (b.byType[k] || 0) - (a.byType[k] || 0); if (v > 1e-4) d.byType[k] = +v.toFixed(3); }
    for (const k of new Set([...Object.keys(a.gateType), ...Object.keys(b.gateType)]))
      { const v = (b.gateType[k] || 0) - (a.gateType[k] || 0); if (v > 1e-4) d.gateType[k] = +v.toFixed(3); }
    return d;
  };

  P.waitFor = (fn, ms = 45000) => new Promise((res) => {
    const t0 = performance.now();
    const step = () => {
      if (fn()) return res(true);
      if (performance.now() - t0 > ms) return res(false);
      requestAnimationFrame(step);
    };
    step();
  });

  /** Play up to n turns, returning one record per turn. */
  P.play = async (n) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const ok = await P.waitFor(() => A.battle.waitingFor() === 0 || A.router.currentId !== 'battle');
      if (!ok || A.router.currentId !== 'battle') break;
      const s = A.battle.screen();
      const forced = !!s.forcedSwitch;
      const evLen = s.battle.events.length;
      const a = P.snap();
      if (forced) {
        const side = s.battle.sides[0];
        let idx = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
        A.battle.choose(0, { kind: 'switch', toSlot: idx < 0 ? 0 : idx });
      } else {
        A.battle.choose(0, A.sim.chooseAction(s.battle, 0, 'ace'));
      }
      const done = await P.waitFor(() => A.battle.waitingFor() === 0 || A.router.currentId !== 'battle');
      const b = P.snap();
      const evs = s.battle.events.slice(evLen);
      const hist = {};
      for (const e of evs) hist[e.t] = (hist[e.t] || 0) + 1;
      const dmg = evs.filter((e) => e.t === 'damage');
      out.push({
        turn: i + 1, forced, timedOut: !done,
        ...P.diff(a, b),
        events: evs.length, hist,
        attacks: hist.moveUsed || 0,
        biggestHitPct: dmg.length ? Math.max(...dmg.map((e) => e.amount / e.maxHp)) : 0,
        fps: A.perf.fps
      });
      if (A.router.currentId !== 'battle') break;
    }
    return out;
  };

  /* --- burst support: report when a heavy damage beat goes live --- */
  P.bigHit = null;
  P.watchBigHit = (minPct) => {
    P.bigHit = null;
    const seen = new WeakSet();
    const step = () => {
      const v = view();
      if (v) {
        const bs = beats(v);
        for (const b of bs) {
          if (seen.has(b)) continue; seen.add(b);
          const e = b.ev;
          if (e && e.t === 'damage' && (e.amount / e.maxHp >= minPct || e.crit)) {
            P.bigHit = { t: performance.now(), epoch: performance.timeOrigin + performance.now(),
              amount: e.amount, maxHp: e.maxHp, crit: !!e.crit, eff: e.eff, hpAfter: e.hpAfter };
          }
        }
      }
      requestAnimationFrame(step);
    };
    step();
  };
})();
`;

/* ------------------------------------------------------------------ */
/* report formatting                                                   */
/* ------------------------------------------------------------------ */

function stat(xs) {
  if (!xs.length) return { n: 0, mean: 0, med: 0, p90: 0, max: 0 };
  const s = [...xs].sort((a, b) => a - b);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    n: xs.length, mean: +mean.toFixed(3),
    med: +s[Math.floor(s.length / 2)].toFixed(3),
    p90: +s[Math.min(s.length - 1, Math.floor(s.length * 0.9))].toFixed(3),
    max: +s[s.length - 1].toFixed(3)
  };
}

function summarise(turns) {
  const full = turns.filter((t) => !t.forced && t.attacks >= 1);
  const two = full.filter((t) => t.attacks >= 2);
  const merge = (key) => {
    const acc = {};
    for (const t of turns) for (const [k, v] of Object.entries(t[key] || {})) acc[k] = +((acc[k] || 0) + v).toFixed(3);
    return Object.fromEntries(Object.entries(acc).sort((a, b) => b[1] - a[1]));
  };
  return {
    turns: turns.length,
    gameAll: stat(turns.map((t) => t.game)),
    gameTwoAttack: stat(two.map((t) => t.game)),
    wallAll: stat(turns.map((t) => t.wall)),
    fps: stat(turns.map((t) => t.fps)),
    deadTime: stat(turns.map((t) => t.deadTime)),
    deadPct: +(100 * turns.reduce((a, t) => a + t.deadTime, 0) / Math.max(1e-6, turns.reduce((a, t) => a + t.game, 0))).toFixed(1),
    deadFrames: turns.reduce((a, t) => a + t.deadFrames, 0),
    frames: turns.reduce((a, t) => a + t.frames, 0),
    byType: merge('byType'),
    gateType: merge('gateType')
  };
}

/* ------------------------------------------------------------------ */

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await ensureServer();
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 20000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  await page.evaluate((r) => { window.__ARENA.app.stage.feel.reduced = r; }, REDUCED);

  const result = { label: LABEL, seed: SEED, reduced: REDUCED, speeds: {}, errors: [] };

  for (const sp of SPEEDS) {
    console.log(`\n▶ speed ${sp}×`);
    await page.evaluate(({ seed }) => window.__ARENA.battle.start({ mode: 'ai', aiLevel: 'ace', teamSize: 3, seed }), { seed: SEED });
    await sleep(600);
    await page.evaluate((s) => window.__ARENA.battle.setSpeed(s), sp);
    await page.evaluate((r) => { window.__ARENA.app.stage.feel.reduced = r; }, REDUCED);
    await page.evaluate(PROBE_SRC);
    // let the battle-start beats drain before we start counting
    await page.evaluate(() => window.__PACE.waitFor(() => window.__ARENA.battle.waitingFor() === 0, 30000));
    await sleep(250);

    const turns = await page.evaluate((n) => window.__PACE.play(n), TURNS);
    const sum = summarise(turns);
    result.speeds[sp] = { turns, summary: sum };
    console.log(`  ${sum.turns} turns · game-clock median ${sum.gameAll.med}s (2-attack ${sum.gameTwoAttack.med}s)`
      + ` · wall median ${sum.wallAll.med}s @ ${sum.fps.med}fps · dead ${sum.deadPct}% (${sum.deadFrames}/${sum.frames} frames)`);
  }

  /* ---------- dense frame burst around one heavy hit ---------- */
  if (BURST) {
    console.log('\n▶ frame burst');
    const dir = `${OUT}/burst-${LABEL}`;
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    await page.evaluate(({ seed }) => window.__ARENA.battle.start({ mode: 'ai', aiLevel: 'ace', teamSize: 3, seed }), { seed: SEED });
    await sleep(700);
    await page.evaluate(() => window.__ARENA.battle.setSpeed(1));
    await page.evaluate((r) => { window.__ARENA.app.stage.feel.reduced = r; }, REDUCED);
    await page.evaluate(PROBE_SRC);
    await page.evaluate(() => window.__PACE.watchBigHit(0.28));

    const cdp = await page.context().newCDPSession(page);
    const ring = [];
    const RING = 260;
    cdp.on('Page.screencastFrame', async (f) => {
      ring.push({ data: f.data, ts: f.metadata.timestamp * 1000 });
      if (ring.length > RING) ring.shift();
      try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch { /* closed */ }
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 72, maxWidth: 900, maxHeight: 563, everyNthFrame: 1 });

    let hit = null;
    const deadline = Date.now() + 90000;
    // drive the battle until a heavy hit shows up
    page.evaluate((n) => window.__PACE.play(n), 30).catch(() => {});
    while (Date.now() < deadline) {
      hit = await page.evaluate(() => window.__PACE.bigHit);
      if (hit) break;
      await sleep(60);
    }
    if (hit) {
      await sleep(1400);          // keep recording the aftermath
      await cdp.send('Page.stopScreencast').catch(() => {});
      const lo = hit.epoch - 450, hi = hit.epoch + 1350;
      const win = ring.filter((f) => f.ts >= lo && f.ts <= hi);
      let i = 0;
      for (const f of win) {
        const rel = Math.round(f.ts - hit.epoch);
        const nm = `${String(i).padStart(2, '0')}_${rel >= 0 ? '+' : '-'}${String(Math.abs(rel)).padStart(4, '0')}ms.jpg`;
        await writeFile(`${dir}/${nm}`, Buffer.from(f.data, 'base64'));
        i++;
      }
      result.burst = { hit, frames: win.length, dir, spanMs: win.length ? Math.round(win[win.length - 1].ts - win[0].ts) : 0 };
      console.log(`  captured ${win.length} frames around a ${(hit.amount / hit.maxHp * 100).toFixed(0)}% hit`
        + `${hit.crit ? ' (CRIT)' : ''} → ${dir}`);
    } else {
      console.log('  no heavy hit observed');
      await cdp.send('Page.stopScreencast').catch(() => {});
    }
  }

  result.errors = [...new Set(errors)];
  await writeFile(`${OUT}/${LABEL}.json`, JSON.stringify(result, null, 2));

  console.log('\n──────── ' + LABEL + (REDUCED ? ' (reduced motion)' : '') + ' ────────');
  console.log('speed   turns  game/turn  2-atk    wall     fps   dead%  deadMax');
  for (const sp of SPEEDS) {
    const s = result.speeds[sp]?.summary; if (!s) continue;
    console.log(`  ${sp}×      ${String(s.turns).padStart(2)}    ${s.gameAll.med.toFixed(2)}s      `
      + `${s.gameTwoAttack.med.toFixed(2)}s   ${s.wallAll.med.toFixed(2)}s   ${String(s.fps.med).padStart(3)}   `
      + `${String(s.deadPct).padStart(5)}  ${s.deadTime.max.toFixed(2)}s`);
  }
  const one = result.speeds[SPEEDS[0]]?.summary;
  if (one) {
    console.log('\ntime by event type (1×, seconds live):');
    for (const [k, v] of Object.entries(one.byType).slice(0, 14)) console.log(`  ${k.padEnd(14)} ${v.toFixed(2)}`);
    console.log('gate holder (who is blocking the queue):');
    for (const [k, v] of Object.entries(one.gateType).slice(0, 14)) console.log(`  ${k.padEnd(14)} ${v.toFixed(2)}`);
  }
  if (result.errors.length) {
    console.log(`\n⚠ ${result.errors.length} page error(s):`);
    result.errors.slice(0, 10).forEach((e) => console.log('  - ' + e));
  }

  await browser.close();
  server?.kill();
}

main().catch((e) => { console.error(e); process.exit(1); });
