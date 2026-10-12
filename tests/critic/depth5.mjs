// CRITIC — THE GAME UNDERNEATH, round 5.
//
// Rounds 2-4 left three things unmeasured, and a roster rebalance has since
// happened aimed squarely at the standing gap ("nothing can take a hit and stay
// in"). This round measures, from scratch:
//
//   wall       Is there a real wall? Not "is there a high bulk stat" — does the
//              recovery loop actually outpace the incoming damage, against how
//              many of the other 31 fighters, and does that hold in a real 1v1?
//   switchpay  Does a switch buy more than it costs, priced in win% at real
//              positions with common random numbers — the exact claim in the
//              standing gap.
//   archteam   Do archetype-pure teams play differently against each other, or
//              is one composition simply better?
//   panel      Does the SWITCH panel in the running build tell the player what
//              they need to make that switch decision?
//
//   node tests/critic/depth5.mjs wall
//   node tests/critic/depth5.mjs switchpay --pos 90 --k 40
//   node tests/critic/depth5.mjs archteam  --games 120
//   node tests/critic/depth5.mjs panel     --port 8812

import {
  createBattle, submitChoices, legalMoves, legalSwitches, active
} from '../../src/core/engine.js';
import { chooseAction } from '../../src/core/ai.js';
import { damageRange } from '../../src/core/damage.js';
import { RNG } from '../../src/core/rng.js';
import { getMove } from '../../src/data/moves.js';
import { allFighters, getFighter, makeDefaultMember, defaultMoves } from '../../src/data/fighters.js';
import { defaultBag } from '../../src/data/items.js';
import { computeStats } from '../../src/core/stats.js';
import { typeEff } from '../../src/core/types.js';

const MODE = process.argv[2] || 'wall';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const SIZE = Number(arg('size', 3));
const MAXT = 400;
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const pp = (x) => `${(x * 100).toFixed(1)}pp`;
const IDS = allFighters().map((f) => f.id);

function team(rng, size = SIZE) {
  const pool = IDS.slice(); const out = [];
  for (let i = 0; i < size && pool.length; i++) {
    const k = rng.int(pool.length);
    out.push(makeDefaultMember(pool[k], 50)); pool.splice(k, 1);
  }
  return out;
}
function mkBattle(seed, t0, t1, bag = true) {
  return createBattle({
    seed, arena: 'colosseum', format: { level: 50, teamSize: SIZE, bring: SIZE },
    sides: [
      { name: 'A', team: t0, items: bag ? defaultBag() : {} },
      { name: 'B', team: t1, items: bag ? defaultBag() : {} }
    ]
  });
}
function fork(state, seed) {
  const { rng, ...rest } = state;
  const c = structuredClone(rest);
  c.rng = new RNG(seed >>> 0);
  c.events = []; c.turnEvents = []; c.log = [];
  return c;
}
function rollout(state, polA, polB) {
  let g = 0;
  while (!state.ended && g++ < MAXT) {
    const c = [null, null];
    for (const s of [0, 1]) if (state.request[s]) c[s] = (s === 0 ? polA : polB)(state, s);
    submitChoices(state, c);
  }
  if (state.winner === 0) return 1;
  if (state.winner === 1) return 0;
  return 0.5;
}
const ace = (state, side) => chooseAction(state, side, 'ace');

function dmgFrac(state, side, id, me, foe) {
  const move = getMove(id);
  if (!move || move.category === 'status' || !(move.power > 0)) return 0;
  const r = damageRange({ move, user: me, target: foe, field: state.field, foeSide: state.sides[1 - side], crit: false });
  const acc = move.accuracy === null ? 1 : move.accuracy / 100;
  return (r.avg / Math.max(1, foe.hp)) * acc;
}
function greedyMoveId(state, side) {
  const me = active(state, side), foe = active(state, 1 - side);
  if (!me || !foe) return null;
  const r = legalMoves(state, side).map((id) => ({ id, s: dmgFrac(state, side, id, me, foe) }))
    .sort((a, b) => b.s - a.s);
  return r.length ? r[0].id : null;
}
/** fraction of victim's MAX hp removed by the attacker's best move */
function threatFrac(state, attackerSide, victim) {
  const atk = active(state, attackerSide);
  if (!atk || !victim) return 0;
  let best = 0;
  for (const mv of atk.moves) {
    const move = getMove(mv.id);
    if (!move || move.category === 'status' || !(move.power > 0)) continue;
    const r = damageRange({ move, user: atk, target: victim, field: state.field, foeSide: state.sides[victim.side], crit: false });
    const acc = move.accuracy === null ? 1 : move.accuracy / 100;
    const f = (r.avg / Math.max(1, victim.maxHp)) * acc;
    if (f > best) best = f;
  }
  return best;
}

/* ===================================================================== wall */
// A wall is not a stat line. A wall is a fighter whose recovery loop wins the
// per-turn HP race against the attacker in front of it. Measure the race.
if (MODE === 'wall') {
  const fs = allFighters();
  const recovOf = (id) => defaultMoves(id, 50).map(getMove).filter(Boolean)
    .find((m) => (m.effects || []).some((e) => e.kind === 'heal'));

  console.log(`\n════ IS THERE A REAL WALL? ════\n`);
  console.log(`Part A — the arithmetic. For every (defender, attacker) pair on DEFAULT sets at`);
  console.log(`lv50, "incoming" is the attacker's best move as a fraction of the defender's MAX`);
  console.log(`hp (accuracy- and STAB-weighted). A defender "walls" an attacker if its own`);
  console.log(`recovery per turn strictly exceeds incoming — i.e. it can stand there forever.\n`);

  // build one real battle so damageRange sees genuine Combatants (items/abilities on)
  function pairIncoming(defId, atkId) {
    const b = createBattle({
      seed: 999, arena: 'colosseum', format: { level: 50, teamSize: 1, bring: 1 },
      sides: [{ name: 'D', team: [makeDefaultMember(defId, 50)] }, { name: 'A', team: [makeDefaultMember(atkId, 50)] }]
    });
    return threatFrac(b, 1, b.sides[0].party[0]);
  }

  const rows = [];
  for (const d of fs) {
    const rec = recovOf(d.id);
    const heal = rec ? (rec.effects.find((e) => e.kind === 'heal').frac || 0) : 0;
    let walled = 0, sum = 0, worst = 0, worstId = '';
    for (const a of fs) {
      if (a.id === d.id) continue;
      const inc = pairIncoming(d.id, a.id);
      sum += inc;
      if (inc > worst) { worst = inc; worstId = a.id; }
      if (heal > 0 && inc < heal) walled++;
    }
    rows.push({ id: d.id, heal, walled, meanInc: sum / (fs.length - 1), worst, worstId, hitsToKO: 1 / (sum / (fs.length - 1)) });
  }
  rows.sort((a, b) => b.walled - a.walled || a.meanInc - b.meanInc);
  console.log('defender          recov  mean incoming  hits-to-KO  walls N/31  worst matchup');
  for (const r of rows) {
    console.log(`${r.id.padEnd(17)} ${(r.heal ? (r.heal * 100).toFixed(0) + '%' : '  -').padStart(5)}  ${pct(r.meanInc).padStart(12)}  ${r.hitsToKO.toFixed(2).padStart(10)}  ${String(r.walled).padStart(6)}/31   ${pct(r.worst)} ${r.worstId}`);
  }
  const withRec = rows.filter((r) => r.heal > 0);
  console.log(`\nfighters with recovery on the default set: ${withRec.length}/32`);
  console.log(`fighters that hard-wall >=1/3 of the roster: ${rows.filter((r) => r.walled >= 11).length}`);
  console.log(`roster mean incoming per hit: ${pct(rows.reduce((a, c) => a + c.meanInc, 0) / rows.length)}  (= ${(1 / (rows.reduce((a, c) => a + c.meanInc, 0) / rows.length)).toFixed(2)} hits to KO)`);

  // Part B — does the arithmetic survive a real fight?
  console.log(`\nPart B — the fight. 1v1, no bench, no bag. The defender plays a WALL policy`);
  console.log(`(recover below 55%, else its best damaging move); the attacker clicks its`);
  console.log(`biggest number. Both sides' real items/abilities/residuals are live.\n`);

  const wallPol = (state, side) => {
    const me = active(state, side);
    if (!me) return null;
    const rec = legalMoves(state, side).map(getMove).filter(Boolean)
      .find((m) => (m.effects || []).some((e) => e.kind === 'heal'));
    if (rec && me.hp / me.maxHp < 0.55) return { kind: 'move', moveId: rec.id, target: 'self' };
    const g = greedyMoveId(state, side);
    return { kind: 'move', moveId: g || (rec ? rec.id : 'struggle'), target: 'foe' };
  };
  const greedyPol = (state, side) => ({ kind: 'move', moveId: greedyMoveId(state, side) || 'struggle', target: 'foe' });

  const CAND = rows.slice(0, 8).map((r) => r.id);
  const ATTACKERS = allFighters().filter((f) => Math.max(f.base.atk, f.base.spa) >= 110).map((f) => f.id);
  console.log(`attackers used (off stat >= 110): ${ATTACKERS.length}\n`);
  console.log('defender          1v1 win% vs those attackers   mean turns   struggle-ended%');
  for (const dId of CAND) {
    let w = 0, n = 0, tn = 0, strug = 0;
    for (const aId of ATTACKERS) {
      if (aId === dId) continue;
      for (let s = 0; s < 3; s++) {
        const b = createBattle({
          seed: 4242 + s * 7717, arena: 'colosseum', format: { level: 50, teamSize: 1, bring: 1 },
          sides: [{ name: 'D', team: [makeDefaultMember(dId, 50)] }, { name: 'A', team: [makeDefaultMember(aId, 50)] }]
        });
        let g = 0;
        while (!b.ended && g++ < MAXT) {
          const c = [null, null];
          for (const side of [0, 1]) if (b.request[side]) c[side] = (side === 0 ? wallPol : greedyPol)(b, side);
          submitChoices(b, c);
        }
        n++; tn += b.turn;
        if ((b.log || []).some((t) => /struggle/i.test(String(t)))) strug++;
        if (b.winner === 0) w++; else if (b.winner !== 1) w += 0.5;
      }
    }
    console.log(`${dId.padEnd(17)} ${pct(w / n).padStart(12)}                 ${(tn / n).toFixed(1).padStart(6)}       ${pct(strug / n)}`);
  }
}

/* ================================================================ switchpay */
// The standing gap, priced. At real positions where the active fighter is in a
// bad matchup, is switching worth more win% than staying and hitting?
if (MODE === 'switchpay') {
  const NPOS = Number(arg('pos', 90));
  const K = Number(arg('k', 40));
  const HARVEST = Number(arg('harvest', 500));

  const pool = [];
  for (let n = 0; n < HARVEST; n++) {
    const rng = new RNG(5150 + n * 6151);
    const b = mkBattle(770000 + n * 271, team(rng), team(rng));
    let g = 0;
    while (!b.ended && g++ < MAXT) {
      if (!b.resume && b.request[0] === 'move' && b.request[1] === 'move' && b.turn >= 1) {
        const me = active(b, 0);
        const sw = legalSwitches(b, 0);
        if (me && sw.length) {
          const inc = threatFrac(b, 1, me);
          // best available resist on the bench
          let bestT = 9, bestS = -1;
          for (const s of sw) { const t = threatFrac(b, 1, b.sides[0].party[s]); if (t < bestT) { bestT = t; bestS = s; } }
          pool.push({ st: fork(b, 1), turn: b.turn, gameId: n, inc, bestT, bestS, bad: inc >= 0.5 });
        }
      }
      const c = [null, null];
      for (const s of [0, 1]) if (b.request[s]) c[s] = ace(b, s);
      submitChoices(b, c);
    }
  }
  const bad = pool.filter((p) => p.bad && p.bestT < p.inc * 0.75);
  const ok = pool.filter((p) => !p.bad);
  console.log(`\n════ WHAT DOES A SWITCH COST, AND WHAT DOES IT BUY? ════\n`);
  console.log(`harvested ${pool.length} real move-turns with a legal switch available.`);
  console.log(`  the active is in a BAD matchup (foe's best >= 50% of its bar): ${pct(pool.filter((p) => p.bad).length / pool.length)}`);
  console.log(`  ...and a bench mon takes <75% of that:                        ${pct(bad.length / pool.length)}`);
  console.log(`  mean incoming on the active:  ${pct(pool.reduce((a, c) => a + c.inc, 0) / pool.length)}`);
  console.log(`  mean incoming on the best bench answer: ${pct(pool.reduce((a, c) => a + c.bestT, 0) / pool.length)}\n`);

  const prng = new RNG(31337);
  const seen = new Map();
  const picked = [];
  for (const p of prng.shuffle(bad)) {
    const c = seen.get(p.gameId) || 0; if (c >= 2) continue;
    seen.set(p.gameId, c + 1); picked.push(p);
    if (picked.length >= NPOS) break;
  }
  console.log(`Rolling out ${picked.length} of those BAD-matchup positions, ${K} common-random-number`);
  console.log(`rollouts per arm, ace opponent, ace continuation.\n`);

  let stayW = 0, swW = 0, bestSwW = 0, n = 0;
  const deltas = [];
  const entryCost = [];
  for (let i = 0; i < picked.length; i++) {
    const { st, bestS } = picked[i];
    const seeds = []; for (let k = 0; k < K; k++) seeds.push((1200000 + i * 9973 + k * 7919) >>> 0);
    const gid = greedyMoveId(st, 0);
    let a = 0, b2 = 0, ec = 0;
    for (let k = 0; k < K; k++) {
      const f1 = fork(st, seeds[k]);
      submitChoices(f1, [{ kind: 'move', moveId: gid || 'struggle', target: 'foe' }, ace(f1, 1)]);
      a += rollout(f1, ace, ace);
      const f2 = fork(st, seeds[k]);
      const hpBefore = f2.sides[0].party[bestS].hp, mx = f2.sides[0].party[bestS].maxHp;
      submitChoices(f2, [{ kind: 'switch', toSlot: bestS }, ace(f2, 1)]);
      const inc = active(f2, 0);
      if (inc && inc.slot === bestS) ec += (hpBefore - inc.hp) / mx;
      b2 += rollout(f2, ace, ace);
    }
    stayW += a / K; swW += b2 / K; n++;
    deltas.push(b2 / K - a / K);
    entryCost.push(ec / K);
  }
  const q = (arr, p) => { const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
  console.log(`stay in and click the biggest number : ${pct(stayW / n)} win`);
  console.log(`switch to the best bench answer      : ${pct(swW / n)} win`);
  console.log(`  delta ${(swW >= stayW ? '+' : '') + pp(swW / n - stayW / n)}   switching is better on ${pct(deltas.filter((d) => d > 0.02).length / n)} of these turns,`);
  console.log(`  worse on ${pct(deltas.filter((d) => d < -0.02).length / n)}, a wash on ${pct(deltas.filter((d) => Math.abs(d) <= 0.02).length / n)}`);
  console.log(`  delta p10 ${pp(q(deltas, 0.1))}  median ${pp(q(deltas, 0.5))}  p90 ${pp(q(deltas, 0.9))}`);
  console.log(`\nprice of admission: mean HP the incoming fighter loses on the turn it enters`);
  console.log(`  ${pct(entryCost.reduce((a, c) => a + c, 0) / entryCost.length)} of its bar   (median ${pct(q(entryCost, 0.5))}, p90 ${pct(q(entryCost, 0.9))})`);
}

/* ================================================================= archteam */
// Do archetypes play differently, or is one composition just better?
if (MODE === 'archteam') {
  const GAMES = Number(arg('games', 120));
  const fs = allFighters();
  const arch = (f) => {
    const b = f.base, bulk = b.hp + b.def + b.spd, off = Math.max(b.atk, b.spa);
    if (bulk >= 300 && off <= 100) return 'WALL';
    if (b.spe >= 110 && off >= 115) return 'SWEEPER';
    if (off >= 125 && b.spe < 95) return 'WALLBREAKER';
    if (bulk >= 290 && off >= 105) return 'BULKY';
    if (b.spe >= 105) return 'FAST';
    return 'MID';
  };
  const byArch = {};
  for (const f of fs) (byArch[arch(f)] ||= []).push(f.id);
  console.log(`\n════ DO ARCHETYPES PLAY DIFFERENTLY? — ace vs ace, ${GAMES * 2} games per cell ════\n`);
  for (const [k, v] of Object.entries(byArch)) console.log(`  ${k.padEnd(12)} ${v.length}: ${v.join(' ')}`);

  const comps = {
    'STALL  (3 walls)': (rng) => pickN(rng, byArch.WALL, 3),
    'HYPER  (3 sweepers)': (rng) => pickN(rng, byArch.SWEEPER, 3),
    'BALANCE(wall+bulky+sweeper)': (rng) => [pick1(rng, byArch.WALL), pick1(rng, byArch.BULKY), pick1(rng, byArch.SWEEPER)],
    'FAST   (3 fast-util)': (rng) => pickN(rng, byArch.FAST, 3),
    'RANDOM (any 3)': (rng) => pickN(rng, IDS, 3)
  };
  function pickN(rng, arr, n) { const p = arr.slice(), o = []; for (let i = 0; i < n && p.length; i++) { const k = rng.int(p.length); o.push(p[k]); p.splice(k, 1); } while (o.length < n) o.push(arr[rng.int(arr.length)]); return o; }
  function pick1(rng, arr) { return arr[rng.int(arr.length)]; }

  const names = Object.keys(comps);
  const W = {};
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    let wi = 0, tn = 0, cnt = 0;
    for (let g = 0; g < GAMES; g++) {
      const rng = new RNG(88000 + g * 3313);
      const ta = comps[names[i]](rng).map((id) => makeDefaultMember(id, 50));
      const tb = comps[names[j]](rng).map((id) => makeDefaultMember(id, 50));
      for (const flip of [false, true]) {
        const b = mkBattle(4400 + g * 617, (flip ? tb : ta).map((m) => ({ ...m })), (flip ? ta : tb).map((m) => ({ ...m })));
        let s = 0;
        while (!b.ended && s++ < MAXT) {
          const c = [null, null];
          for (const k of [0, 1]) if (b.request[k]) c[k] = ace(b, k);
          submitChoices(b, c);
        }
        tn += b.turn; cnt++;
        const iWon = flip ? b.winner === 1 : b.winner === 0;
        if (iWon) wi++; else if (b.winner !== 0 && b.winner !== 1) wi += 0.5;
      }
    }
    W[`${i}|${j}`] = { wr: wi / cnt, turns: tn / cnt };
  }
  const pad = 30;
  console.log('\n' + ' '.repeat(pad) + names.map((n) => n.slice(0, 7).padStart(9)).join('') + '     avg');
  for (let i = 0; i < names.length; i++) {
    let row = names[i].padEnd(pad); let s = 0, c = 0;
    for (let j = 0; j < names.length; j++) {
      if (i === j) { row += '     —   '; continue; }
      const k = i < j ? `${i}|${j}` : `${j}|${i}`;
      const wr = i < j ? W[k].wr : 1 - W[k].wr;
      row += pct(wr).padStart(9); s += wr; c++;
    }
    console.log(row + pct(s / c).padStart(9));
  }
  console.log('\nturn counts:');
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    console.log(`  ${names[i].padEnd(28)} vs ${names[j].padEnd(28)} ${W[`${i}|${j}`].turns.toFixed(1)} turns`);
  }
}

/* ==================================================================== panel */
if (MODE === 'panel') {
  const { chromium } = await import('playwright');
  const { mkdir } = await import('node:fs/promises');
  const OUT = 'tests/shots/depth5';
  const PORT = Number(arg('port', 8812));
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 60000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const shot = async (n) => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('  shot', `${OUT}/${n}.png`); };
  const clickText = async (src) => page.evaluate((s) => {
    const rx = new RegExp(s, 'i');
    const all = [...document.querySelectorAll('button,[role=button],.btn,li,div,span')];
    const b = all.reverse().find((e) => rx.test((e.textContent || '').trim()) && e.offsetParent && (e.textContent || '').trim().length < 26);
    if (b) { b.click(); return (b.textContent || '').trim(); }
    return null;
  }, src);

  await page.evaluate(() => window.__ARENA.battle.quick(717171));
  await page.waitForFunction(() => !!window.__ARENA.battle.state()?.request?.[0], null, { timeout: 60000 });
  await page.evaluate(() => window.__ARENA.battle.skipAnimations(true));
  await sleep(2500);

  // drive to a genuinely bad matchup so the switch decision is LIVE
  const drive = await page.evaluate(async () => {
    const A = window.__ARENA;
    for (let i = 0; i < 120; i++) {
      const st = A.battle.state();
      if (!st || st.ended) break;
      if (st.turn >= 5) break;
      if (st.request && st.request[0]) {
        const me = st.sides[0].party[st.sides[0].activeIndex];
        A.battle.choose(0, { kind: 'move', moveId: me.moves[0].id, target: 'foe' });
      }
      await new Promise((r) => setTimeout(r, 80));
    }
    const st = A.battle.state();
    const s0 = st.sides[0], s1 = st.sides[1];
    return {
      turn: st.turn,
      me: (() => { const m = s0.party[s0.activeIndex]; return { sp: m.speciesId, types: m.types, hp: m.hp, max: m.maxHp, status: m.status, boosts: m.boosts }; })(),
      foe: (() => { const m = s1.party[s1.activeIndex]; return { sp: m.speciesId, types: m.types, hp: m.hp, max: m.maxHp, status: m.status }; })(),
      bench: s0.party.map((p, i) => ({ i, sp: p.speciesId, types: p.types, hp: p.hp, max: p.maxHp, fainted: p.fainted, active: i === s0.activeIndex })),
      hazards: st.sides.map((s) => s.hazards), screens: st.sides.map((s) => s.screens), field: st.field
    };
  });
  // wait until the command menu is actually on screen and idle
  await page.waitForFunction(() => {
    const A = window.__ARENA;
    if (!A.battle.state()?.request?.[0]) return false;
    if (A.battle.isAnimating()) return false;
    return /fight/i.test((document.querySelector('#ui') || document.body).innerText || '');
  }, null, { timeout: 60000 }).catch(() => console.log('  (menu never appeared)'));
  await sleep(1200);
  await shot('01-decision');
  console.log('\n════ THE SWITCH DECISION, AS A PLAYER MEETS IT ════\n');
  console.log('TRUTH: ' + JSON.stringify(drive, null, 1));

  const btns = await page.evaluate(() => [...document.querySelectorAll('button,[role=button],.btn,[class*=cmd],[class*=menu] *')]
    .filter((e) => e.offsetParent && (e.textContent || '').trim().length < 24)
    .map((e) => `${e.tagName}.${e.className}:${(e.textContent || '').trim()}`).filter((s) => s.length > 6).slice(0, 40));
  console.log('\nvisible clickables: ' + JSON.stringify(btns, null, 1));

  const label = await clickText('^(party|switch|team|swap|pokemon|fighters)$');
  await sleep(1600);
  await shot('02-switch-panel');
  const ptxt = await page.evaluate(() => (document.querySelector('#ui') || document.body).innerText);
  console.log(`\nopened via button: ${label}`);
  console.log('SWITCH PANEL TEXT:\n  ' + ptxt.split('\n').filter(Boolean).join('\n  '));

  const T = ptxt.toLowerCase();
  const bench = drive.bench.filter((b) => !b.active);
  const checks = [
    ['bench fighter names listed', bench.every((b) => T.includes(b.sp.replace(/_/g, ' ').split(' ')[0]))],
    ['bench HP numbers shown', bench.some((b) => ptxt.includes(String(b.hp)))],
    ['bench TYPES shown', bench.some((b) => b.types.some((t) => T.includes(t.toLowerCase())))],
    ['foe types shown while choosing', drive.foe.types.some((t) => T.includes(t.toLowerCase()))],
    ['matchup hint (resists / weak to / takes)', /(resist|weak|immune|super|takes|×|x2|effective|safe|risky)/i.test(ptxt)],
    ['entry cost / hazards flagged', /(hazard|caltrop|barb|shard|spike|entry|on switch)/i.test(ptxt)],
    ['bench status shown', bench.every((b) => !b.status) || bench.some((b) => b.status && T.includes(b.status))]
  ];
  console.log('\nwhat the switch panel tells you:');
  for (const [k, v] of checks) console.log(`  ${v ? 'YES' : 'NO '}  ${k}`);
  console.log('\nconsole errors: ' + (errs.length ? errs.slice(0, 6).join(' // ') : 'none'));
  await browser.close();
}
