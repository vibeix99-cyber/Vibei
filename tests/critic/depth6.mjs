// CRITIC — DEPTH, independent pass (round 6).
//
// I did not build this and I am not reusing depth2-5's conclusions; these are
// my own instruments. Everything here is read-only against src/.
//
//   node tests/critic/depth6.mjs chart
//   node tests/critic/depth6.mjs speed
//   node tests/critic/depth6.mjs oracle   --pos 120 --k 40
//   node tests/critic/depth6.mjs ladder   --games 120
//   node tests/critic/depth6.mjs ablate   --games 150
//   node tests/critic/depth6.mjs turnshape --games 60

import {
  createBattle, submitChoices, legalMoves, legalSwitches, active
} from '../../src/core/engine.js';
import { chooseAction } from '../../src/core/ai.js';
import { damageRange } from '../../src/core/damage.js';
import { RNG } from '../../src/core/rng.js';
import { getMove, MOVES } from '../../src/data/moves.js';
import { allFighters, getFighter, makeDefaultMember } from '../../src/data/fighters.js';
import { defaultBag } from '../../src/data/items.js';
import { TYPES, CHART, typeEff } from '../../src/core/types.js';
import { computeStats } from '../../src/core/stats.js';

const MODE = process.argv[2] || 'chart';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const SIZE = Number(arg('size', 3));
const MAXT = 300;
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const IDS = allFighters().map((f) => f.id);

/* ---------------------------------------------------------------- setup */

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
  return c;
}

/* ============================================================ 1. CHART */
// The real Gen6+ Pokemon chart, typed out from the source material, so the
// density comparison is against a number I computed rather than a claim.

const PK_TYPES = ['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground',
                  'Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
const PK = {
  Normal:  { Rock:.5, Ghost:0, Steel:.5 },
  Fire:    { Fire:.5, Water:.5, Grass:2, Ice:2, Bug:2, Rock:.5, Dragon:.5, Steel:2 },
  Water:   { Fire:2, Water:.5, Grass:.5, Ground:2, Rock:2, Dragon:.5 },
  Electric:{ Water:2, Electric:.5, Grass:.5, Ground:0, Flying:2, Dragon:.5 },
  Grass:   { Fire:.5, Water:2, Grass:.5, Poison:.5, Ground:2, Flying:.5, Bug:.5, Rock:2, Dragon:.5, Steel:.5 },
  Ice:     { Fire:.5, Water:.5, Grass:2, Ice:.5, Ground:2, Flying:2, Dragon:2, Steel:.5 },
  Fighting:{ Normal:2, Ice:2, Poison:.5, Flying:.5, Psychic:.5, Bug:.5, Rock:2, Ghost:0, Dark:2, Steel:2, Fairy:.5 },
  Poison:  { Grass:2, Poison:.5, Ground:.5, Rock:.5, Ghost:.5, Steel:0, Fairy:2 },
  Ground:  { Fire:2, Electric:2, Grass:.5, Poison:2, Flying:0, Bug:.5, Rock:2, Steel:2 },
  Flying:  { Electric:.5, Grass:2, Fighting:2, Bug:2, Rock:.5, Steel:.5 },
  Psychic: { Fighting:2, Poison:2, Psychic:.5, Dark:0, Steel:.5 },
  Bug:     { Fire:.5, Grass:2, Fighting:.5, Poison:.5, Flying:.5, Psychic:2, Ghost:.5, Dark:2, Steel:.5, Fairy:.5 },
  Rock:    { Fire:2, Ice:2, Fighting:.5, Ground:.5, Flying:2, Bug:2, Steel:.5 },
  Ghost:   { Normal:0, Psychic:2, Ghost:2, Dark:.5 },
  Dragon:  { Dragon:2, Steel:.5, Fairy:0 },
  Dark:    { Fighting:.5, Psychic:2, Ghost:2, Dark:.5, Fairy:.5 },
  Steel:   { Fire:.5, Water:.5, Electric:.5, Ice:2, Rock:2, Steel:.5, Fairy:2 },
  Fairy:   { Fire:.5, Fighting:2, Poison:.5, Dragon:2, Dark:2, Steel:.5 }
};

function chartStats(types, chart) {
  let sup = 0, res = 0, imm = 0, n = 0;
  const offSuper = {}, defWeak = {};
  for (const a of types) {
    offSuper[a] = 0;
    for (const d of types) {
      const v = chart[a]?.[d] ?? 1; n++;
      if (v > 1) { sup++; offSuper[a]++; defWeak[d] = (defWeak[d] || 0) + 1; }
      else if (v === 0) imm++;
      else if (v < 1) res++;
    }
  }
  return { sup, res, imm, n, offSuper, defWeak };
}

function chartMode() {
  console.log('════ TYPE CHART — density and shape ════\n');
  for (const [tag, types, chart] of [['OURS', TYPES, CHART], ['POKEMON g6+', PK_TYPES, PK]]) {
    const s = chartStats(types, chart);
    console.log(`${tag.padEnd(12)} cells ${s.n}  super ${pct(s.sup / s.n)}  resisted ${pct(s.res / s.n)}  immune ${pct(s.imm / s.n)}  (res+imm ${pct((s.res + s.imm) / s.n)})`);
    const off = Object.entries(s.offSuper).sort((a, b) => b[1] - a[1]);
    const def = types.map((t) => [t, s.defWeak[t] || 0]).sort((a, b) => b[1] - a[1]);
    console.log(`             offence spread: best ${off[0][0]} hits ${off[0][1]}, worst ${off[off.length - 1][0]} hits ${off[off.length - 1][1]}`);
    console.log(`             defence spread: ${def[0][0]} weak to ${def[0][1]}, ${def[def.length - 1][0]} weak to ${def[def.length - 1][1]}`);
  }

  // Dual-type reality: how often is a random attacking type interesting vs a
  // roster member (not vs an abstract mono type)?
  console.log('\n──── vs the actual 32-fighter roster ────');
  const roster = allFighters();
  const bucket = { 0: 0, 0.25: 0, 0.5: 0, 1: 0, 2: 0, 4: 0 };
  let n = 0;
  for (const t of TYPES) for (const f of roster) { const e = typeEff(t, f.types); bucket[e] = (bucket[e] || 0) + 1; n++; }
  console.log('  attacking-type × fighter:', Object.entries(bucket).map(([k, v]) => `${k}× ${pct(v / n)}`).join('  '));

  // How many fighters does each fighter's OWN move set hit super-effectively?
  let seCover = [];
  for (const f of roster) {
    const myTypes = new Set((f.learnset || []).map((l) => getMove(l.move)).filter((m) => m && m.category !== 'status' && m.power > 0).map((m) => m.type));
    let c = 0;
    for (const g of roster) {
      if (g.id === f.id) continue;
      let best = 0;
      for (const t of myTypes) best = Math.max(best, typeEff(t, g.types));
      if (best >= 2) c++;
    }
    seCover.push([f.id, myTypes.size, c]);
  }
  seCover.sort((a, b) => a[2] - b[2]);
  console.log(`  learnset type breadth: median ${seCover.map((x) => x[1]).sort((a, b) => a - b)[16]} distinct attacking types`);
  console.log(`  can hit SE (from full learnset): worst ${seCover[0][0]} ${seCover[0][2]}/31, best ${seCover[31][0]} ${seCover[31][2]}/31`);

  // …and from the DEFAULT four moves the game actually gives you.
  const dflt = [];
  for (const f of roster) {
    const mem = makeDefaultMember(f.id, 50);
    const types = new Set(mem.moves.map(getMove).filter((m) => m && m.category !== 'status' && m.power > 0).map((m) => m.type));
    let c = 0, imm = 0;
    for (const g of roster) {
      if (g.id === f.id) continue;
      let best = 0;
      for (const t of types) best = Math.max(best, typeEff(t, g.types));
      if (best >= 2) c++;
      if (best === 0) imm++;
    }
    dflt.push([f.id, [...types].join('/'), c, imm]);
  }
  dflt.sort((a, b) => a[2] - b[2]);
  const cov = dflt.map((d) => d[2]);
  console.log(`  DEFAULT set SE coverage: median ${cov.sort((a, b) => a - b)[16]}/31   worst ${dflt[0][0]} ${dflt[0][2]}/31 (${dflt[0][1]})`);
  const walled = dflt.filter((d) => d[3] > 0);
  console.log(`  default sets that are hard-walled (zero damage) by someone: ${walled.length}/32`);
}

/* ============================================================ 2. SPEED */

function speedMode() {
  console.log('════ SPEED TIERS ════\n');
  const rows = allFighters().map((f) => {
    const st = computeStats(f.base, 50, null, null, 'hardy');
    return [f.id, f.base.spe, st.spe];
  }).sort((a, b) => b[2] - a[2]);
  console.log('  L50 speed, no EVs, neutral nature:');
  for (const r of rows) console.log(`    ${String(r[2]).padStart(4)}  ${r[0]}`);
  const vals = rows.map((r) => r[2]);
  // how many distinct meaningful tiers? count gaps > 3
  let gaps = 0;
  for (let i = 1; i < vals.length; i++) if (vals[i - 1] - vals[i] > 3) gaps++;
  console.log(`\n  range ${vals[vals.length - 1]}..${vals[0]} (${(vals[0] / vals[vals.length - 1]).toFixed(2)}× ends apart)`);
  console.log(`  distinct tiers separated by >3 points: ${gaps + 1}`);
  // pairs within 5 points (i.e. an EV investment or one Speed stage flips them)
  let close = 0, total = 0, ties = 0;
  for (let i = 0; i < vals.length; i++) for (let j = i + 1; j < vals.length; j++) {
    total++; const d = Math.abs(vals[i] - vals[j]);
    if (d === 0) ties++; if (d > 0 && d <= 6) close++;
  }
  console.log(`  exact speed ties among the 32: ${ties} pairs; within 6 points: ${close} pairs (${pct((ties + close) / total)} of all pairs)`);
  console.log(`  a maxed Speed EV spread (+31) moves you past ${(() => {
    let worst = 0;
    for (const v of vals) { const passed = vals.filter((w) => w > v && w <= v + 31).length; worst = Math.max(worst, passed); }
    return worst;
  })()} fighters at best.`);
}

/* ============================================================ 3. ORACLE */
// How much is PREDICTION worth? Two identical one-ply policies play the same
// positions from common random numbers. The oracle is told the opponent's
// actual choice for this turn before it picks; the blind one is not.
// The win-rate gap is the price of a read.

function greedyChoice(state, side) {
  const me = active(state, side), foe = active(state, 1 - side);
  if (!me || !foe) return { kind: 'move', moveId: legalMoves(state, side)[0] };
  let best = null, bs = -Infinity;
  for (const id of legalMoves(state, side)) {
    const mv = getMove(id);
    if (!mv || mv.category === 'status' || !(mv.power > 0)) continue;
    const r = damageRange({ move: mv, user: me, target: foe, field: state.field,
      side: state.sides[side], foeSide: state.sides[1 - side], crit: false, rng: null });
    const s = r.avg * (mv.accuracy == null ? 1 : mv.accuracy / 100);
    if (s > bs) { bs = s; best = id; }
  }
  return { kind: 'move', moveId: best || legalMoves(state, side)[0] };
}

/** One-ply best response. If `foeChoice` is given, it is the true opponent move. */
function bestResponse(state, side, foeChoice, rolls, seedBase) {
  const opts = [];
  for (const id of legalMoves(state, side)) opts.push({ kind: 'move', moveId: id, target: 'foe' });
  for (const i of legalSwitches(state, side)) opts.push({ kind: 'switch', toSlot: i });
  let best = opts[0], bs = -Infinity;
  for (const o of opts) {
    let acc = 0;
    for (let r = 0; r < rolls; r++) {
      const f = fork(state, seedBase + r * 7919);
      const ch = [null, null];
      ch[side] = o;
      ch[1 - side] = foeChoice || greedyChoice(f, 1 - side);
      try { submitChoices(f, ch); } catch { continue; }
      // resolve forced switches
      let g = 0;
      while (!f.ended && (f.request[0] === 'switch' || f.request[1] === 'switch') && g++ < 6) {
        const fc = [null, null];
        for (let s2 = 0; s2 < 2; s2++) if (f.request[s2] === 'switch') fc[s2] = chooseAction(f, s2, 'ace');
        submitChoices(f, fc);
      }
      acc += material(f, side);
    }
    const v = acc / rolls;
    if (v > bs) { bs = v; best = o; }
  }
  return best;
}

function material(state, side) {
  const m = (s) => state.sides[s].party.reduce((a, p) => a + (p.fainted ? 0 : 0.34 + p.hp / p.maxHp), 0);
  return m(side) - m(1 - side);
}

function playOut(seed, t0, t1, policy0, policy1) {
  const st = mkBattle(seed, t0, t1);
  let guard = 0;
  while (!st.ended && guard++ < MAXT) {
    const ch = [null, null];
    for (let s = 0; s < 2; s++) {
      if (st.request[s] === 'switch') ch[s] = chooseAction(st, s, 'ace');
      else if (st.request[s] === 'move') ch[s] = (s === 0 ? policy0 : policy1)(st, s);
    }
    try { submitChoices(st, ch); } catch (e) { return null; }
  }
  return st;
}

function oracleMode() {
  const POS = Number(arg('pos', 100));
  const K = Number(arg('k', 30));
  console.log(`════ THE PRICE OF A READ — ${POS} positions × ${K} rollouts ════\n`);
  console.log('Same position, same dice. One policy is told what the opponent picked');
  console.log('this turn before choosing; the other is not. Both then act optimally');
  console.log('over one ply. The gap is what perfect prediction is worth.\n');

  let blindSum = 0, oracleSum = 0, differ = 0, n = 0;
  const rng = new RNG(20260812);
  for (let p = 0; p < POS; p++) {
    // walk a random battle to a random mid-game turn
    const st = mkBattle(rng.int(1e9), team(rng), team(rng));
    const depth = 2 + rng.int(7);
    let g = 0;
    while (!st.ended && st.turn < depth && g++ < 40) {
      const ch = [null, null];
      for (let s = 0; s < 2; s++) {
        if (st.request[s] === 'switch') ch[s] = chooseAction(st, s, 'ace');
        else if (st.request[s] === 'move') ch[s] = chooseAction(st, s, s === 0 ? 'pirate' : 'ace');
      }
      try { submitChoices(st, ch); } catch { break; }
    }
    if (st.ended || st.request[0] !== 'move') continue;

    const foeChoice = chooseAction(st, 1, 'ace');
    const seedBase = rng.int(1e9);
    const blind = bestResponse(st, 0, null, K, seedBase);
    const orac = bestResponse(st, 0, foeChoice, K, seedBase);
    const same = JSON.stringify(blind) === JSON.stringify(orac);
    if (!same) differ++;

    // score both against the TRUE foe choice
    const score = (o) => {
      let acc = 0;
      for (let r = 0; r < K; r++) {
        const f = fork(st, seedBase + 104729 + r * 7919);
        const ch = [null, null]; ch[0] = o; ch[1] = foeChoice;
        try { submitChoices(f, ch); } catch { continue; }
        let g2 = 0;
        while (!f.ended && (f.request[0] === 'switch' || f.request[1] === 'switch') && g2++ < 6) {
          const fc = [null, null];
          for (let s2 = 0; s2 < 2; s2++) if (f.request[s2] === 'switch') fc[s2] = chooseAction(f, s2, 'ace');
          submitChoices(f, fc);
        }
        acc += material(f, 0);
      }
      return acc / K;
    };
    blindSum += score(blind); oracleSum += score(orac); n++;
  }
  console.log(`  positions scored          ${n}`);
  console.log(`  the read changes the pick ${pct(differ / n)} of turns`);
  console.log(`  blind  material after 1 turn  ${(blindSum / n).toFixed(4)}`);
  console.log(`  oracle material after 1 turn  ${(oracleSum / n).toFixed(4)}`);
  console.log(`  value of a perfect read       ${((oracleSum - blindSum) / n).toFixed(4)} bodies-equivalent per turn`);
}

/* ============================================================ 4. LADDER */

function ladderMode() {
  const GAMES = Number(arg('games', 100));
  console.log(`════ AI LADDER — does the brain matter? (${GAMES} games each) ════\n`);
  const rng = new RNG(777);
  const pairs = [
    ['greedy', 'rookie'], ['greedy', 'pirate'], ['greedy', 'ace'], ['greedy', 'warlord'], ['greedy', 'yonko'],
    ['rookie', 'ace'], ['pirate', 'ace'], ['ace', 'warlord'], ['warlord', 'yonko']
  ];
  const pol = (tag) => (tag === 'greedy' ? greedyChoice : (st, s) => chooseAction(st, s, tag));
  for (const [a, b] of pairs) {
    let wa = 0, wb = 0, dr = 0, turns = 0, ok = 0;
    for (let i = 0; i < GAMES; i++) {
      const seed = rng.int(1e9);
      const t0 = team(rng), t1 = team(rng);
      // play both seatings to cancel any side bias
      for (const flip of [0, 1]) {
        const st = playOut(seed + flip, flip ? t1 : t0, flip ? t0 : t1,
          flip ? pol(b) : pol(a), flip ? pol(a) : pol(b));
        if (!st) continue;
        ok++; turns += st.turn;
        const winnerTag = st.winner === 'draw' ? 'draw' : (st.winner === 0 ? (flip ? b : a) : (flip ? a : b));
        if (winnerTag === a) wa++; else if (winnerTag === b) wb++; else dr++;
      }
    }
    const rate = wb / Math.max(1, wa + wb);
    console.log(`  ${b.padEnd(8)} vs ${a.padEnd(8)}  ${pct(rate).padStart(6)}   (${wb}-${wa}-${dr}, ${(turns / ok).toFixed(1)} turns avg)`);
  }
}

/* ============================================================ 5. ABLATE */
// Take away one subsystem from BOTH players and see whether the game notices.
// If removing switching / status / items barely moves the result, that system
// is decoration.

function ablateMode() {
  const GAMES = Number(arg('games', 120));
  console.log(`════ ABLATION — which subsystems actually carry the game? ════\n`);
  console.log('An "ace" policy plays a crippled copy of itself. A subsystem that is');
  console.log('load-bearing shows a big win rate for the side that still has it.\n');

  const rng = new RNG(4242);
  const full = (st, s) => chooseAction(st, s, 'ace');
  const noSwitch = (st, s) => {
    const c = chooseAction(st, s, { level: 'ace', switchIQ: 0 });
    if (c.kind === 'switch') return { kind: 'move', moveId: legalMoves(st, s)[0] };
    return c;
  };
  const noStatusMoves = (st, s) => {
    const c = chooseAction(st, s, 'ace');
    if (c.kind === 'move' && getMove(c.moveId)?.category === 'status') {
      // pick the best damaging move instead
      return greedyChoice(st, s);
    }
    return c;
  };
  const noItems = (st, s) => {
    const c = chooseAction(st, s, 'ace');
    if (c.kind === 'item') return greedyChoice(st, s);
    return c;
  };
  const greedyPol = greedyChoice;

  const cases = [
    ['full vs no-switching', full, noSwitch],
    ['full vs no-status-moves', full, noStatusMoves],
    ['full vs no-bag', full, noItems],
    ['full vs click-biggest-number', full, greedyPol]
  ];
  for (const [tag, A, B] of cases) {
    let wa = 0, wb = 0, dr = 0;
    for (let i = 0; i < GAMES; i++) {
      const seed = rng.int(1e9);
      const t0 = team(rng), t1 = team(rng);
      for (const flip of [0, 1]) {
        const st = playOut(seed + flip, flip ? t1 : t0, flip ? t0 : t1,
          flip ? B : A, flip ? A : B);
        if (!st) continue;
        const w = st.winner === 'draw' ? 'd' : (st.winner === 0 ? (flip ? 'b' : 'a') : (flip ? 'a' : 'b'));
        if (w === 'a') wa++; else if (w === 'b') wb++; else dr++;
      }
    }
    console.log(`  ${tag.padEnd(30)} full wins ${pct(wa / Math.max(1, wa + wb)).padStart(6)}  (${wa}-${wb}-${dr})`);
  }
}

/* ============================================================ 6. TURNSHAPE */
// What is a turn actually made of, and how many turns have a real decision?

function turnshapeMode() {
  const GAMES = Number(arg('games', 60));
  console.log(`════ TURN SHAPE — what is the player choosing between? ════\n`);
  const rng = new RNG(31337);
  let turns = 0, dmgOnly = 0, statusTurn = 0, switchTurn = 0, itemTurn = 0;
  let seSpread = 0, koPressure = 0, forced = 0, oneMoveDominant = 0;
  let hazTurns = 0, weatherTurns = 0, boostTurns = 0;
  const histo = {};
  for (let i = 0; i < GAMES; i++) {
    const st = mkBattle(rng.int(1e9), team(rng), team(rng));
    let g = 0;
    while (!st.ended && g++ < MAXT) {
      if (st.request[0] === 'move') {
        const me = active(st, 0), foe = active(st, 1);
        const legal = legalMoves(st, 0);
        const rows = [];
        for (const id of legal) {
          const mv = getMove(id);
          if (!mv || mv.category === 'status' || !(mv.power > 0)) continue;
          const r = damageRange({ move: mv, user: me, target: foe, field: st.field,
            side: st.sides[0], foeSide: st.sides[1], crit: false, rng: null });
          rows.push({ id, avg: r.avg * (mv.accuracy == null ? 1 : mv.accuracy / 100), eff: r.eff });
        }
        rows.sort((a, b) => b.avg - a.avg);
        turns++;
        if (rows.length >= 2) {
          const ratio = rows[1].avg > 0 ? rows[0].avg / rows[1].avg : 9;
          if (ratio > 1.6) oneMoveDominant++;
          if (rows.some((r) => r.eff >= 2) && rows.some((r) => r.eff <= 0.5)) seSpread++;
        }
        if (rows.length && rows[0].avg >= foe.hp) koPressure++;
        if (legal.length === 1) forced++;
        if (legalSwitches(st, 0).length === 0) { /* trapped */ }
        if (Object.keys(st.sides[0].hazards).length || Object.keys(st.sides[1].hazards).length) hazTurns++;
        if (st.field.weather.id !== 'none') weatherTurns++;
        if (Object.values(me.boosts).some((v) => v !== 0) || Object.values(foe.boosts).some((v) => v !== 0)) boostTurns++;
      }
      const ch = [null, null];
      for (let s = 0; s < 2; s++) {
        if (st.request[s] === 'switch') ch[s] = chooseAction(st, s, 'ace');
        else if (st.request[s] === 'move') {
          const c = chooseAction(st, s, s === 0 ? 'warlord' : 'ace');
          if (s === 0) {
            if (c.kind === 'switch') switchTurn++;
            else if (c.kind === 'item') itemTurn++;
            else if (getMove(c.moveId)?.category === 'status') statusTurn++;
            else dmgOnly++;
            histo[c.kind === 'move' ? getMove(c.moveId).category : c.kind] = (histo[c.kind === 'move' ? getMove(c.moveId).category : c.kind] || 0) + 1;
          }
          ch[s] = c;
        }
      }
      try { submitChoices(st, ch); } catch { break; }
    }
  }
  console.log(`  move-request turns observed        ${turns}`);
  console.log(`  turns with only one legal move     ${pct(forced / turns)}`);
  console.log(`  turns where one move dominates >1.6× the next  ${pct(oneMoveDominant / turns)}`);
  console.log(`  turns where the move list spans SE and resisted ${pct(seSpread / turns)}`);
  console.log(`  turns with a KO available now      ${pct(koPressure / turns)}`);
  console.log(`  turns with hazards on the field    ${pct(hazTurns / turns)}`);
  console.log(`  turns with weather up              ${pct(weatherTurns / turns)}`);
  console.log(`  turns with a stat stage in play    ${pct(boostTurns / turns)}`);
  console.log('\n  what the warlord actually did:', Object.entries(histo).map(([k, v]) => `${k} ${pct(v / (dmgOnly + statusTurn + switchTurn + itemTurn))}`).join('  '));
}

/* ---------------------------------------------------------------- main */
const MODES = { chart: chartMode, speed: speedMode, oracle: oracleMode, ladder: ladderMode, ablate: ablateMode, turnshape: turnshapeMode };
(MODES[MODE] || chartMode)();
