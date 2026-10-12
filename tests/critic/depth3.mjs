// CRITIC — THE GAME UNDERNEATH, round 3.
// Extends tests/critic/depth2.mjs where it was thin:
//   * depth2 only ever pitted the AI against itself or against a crippled copy
//     of itself. It never asked what a *human-plausible* player experiences.
//   * depth2 never checked whether the tactical option is VISIBLE to the player
//     at the moment of choosing.
//   * depth2 counted turns but never asked whether the extra turns carry
//     information — longer is not the same as deeper.
//
//   node tests/critic/depth3.mjs human   --games 120
//   node tests/critic/depth3.mjs tempo   --games 200
//   node tests/critic/depth3.mjs matrix  --reps 3
//   node tests/critic/depth3.mjs cost    --games 200
//   node tests/critic/depth3.mjs pp      --games 200
//   node tests/critic/depth3.mjs ui      --port 8812

import {
  createBattle, submitChoices, legalMoves, legalSwitches, active
} from '../../src/core/engine.js';
import { chooseAction } from '../../src/core/ai.js';
import { damageRange } from '../../src/core/damage.js';
import { RNG } from '../../src/core/rng.js';
import { getMove } from '../../src/data/moves.js';
import { allFighters, makeDefaultMember, defaultMoves } from '../../src/data/fighters.js';
import { defaultBag } from '../../src/data/items.js';

const MODE = process.argv[2] || 'human';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const GAMES = Number(arg('games', 120));
const SIZE = Number(arg('size', 3));
const MAXT = 300;
const pct = (x) => `${(x * 100).toFixed(1)}%`;

const IDS = allFighters().map((f) => f.id);
const BY = Object.fromEntries(allFighters().map((f) => [f.id, f]));

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

/* ---------------------------------------------------------------- helpers */

/** expected damage of `id` from `me` onto `foe`, as a fraction of foe's CURRENT hp */
function dmgFrac(state, side, id, me, foe) {
  const move = getMove(id);
  if (!move || move.category === 'status' || !(move.power > 0)) return 0;
  const r = damageRange({ move, user: me, target: foe, field: state.field, foeSide: state.sides[1 - side], crit: false });
  const acc = move.accuracy === null ? 1 : move.accuracy / 100;
  return (r.avg / Math.max(1, foe.hp)) * acc;
}
function rankMoves(state, side) {
  const me = active(state, side), foe = active(state, 1 - side);
  if (!me || !foe) return [];
  return legalMoves(state, side)
    .map((id) => ({ id, score: dmgFrac(state, side, id, me, foe) }))
    .sort((a, b) => b.score - a.score);
}
/** worst-case fraction of `victim`'s MAX hp the attacker's best move removes */
function threatFrac(state, attackerSide, victim) {
  const atk = active(state, attackerSide);
  if (!atk || !victim) return 0;
  let best = 0;
  for (const mv of atk.moves) {
    const move = getMove(mv.id);
    if (!move || move.category === 'status' || !(move.power > 0)) continue;
    const r = damageRange({ move, user: atk, target: victim, field: state.field, foeSide: state.sides[victim.side], crit: false });
    const f = r.avg / Math.max(1, victim.maxHp);
    if (f > best) best = f;
  }
  return best;
}

/* ------------------------------------------------------- player policies */
// Written as the moves a person actually makes, not as an optimiser.

const P = {};

// "click the biggest number"
P.greedy = (state, side) => {
  if (state.request[side] === 'switch') {
    const sw = legalSwitches(state, side);
    return sw.length ? { kind: 'switch', toSlot: sw[0] } : null;
  }
  const r = rankMoves(state, side);
  return { kind: 'move', moveId: r.length ? r[0].id : 'struggle', target: 'foe' };
};

// greedy + "I'm low, drink the potion" — the single-player reflex
P.novice = (state, side) => {
  if (state.request[side] === 'switch') return P.greedy(state, side);
  const me = active(state, side);
  const bag = state.sides[side].items || {};
  if (me && me.hp / me.maxHp < 0.35) {
    for (const id of ['hyper_potion', 'super_potion', 'potion']) {
      if (bag[id] > 0) return { kind: 'item', itemId: id, targetSlot: me.slot };
    }
  }
  if (me && me.status && (bag.full_heal > 0) && me.hp / me.maxHp > 0.5) {
    return { kind: 'item', itemId: 'full_heal', targetSlot: me.slot };
  }
  return P.greedy(state, side);
};

// novice + the two reads a club player makes: switch out of a losing matchup
// into something that resists, and open with a status move when safe.
P.solid = (state, side) => {
  if (state.request[side] === 'switch') {
    // pick the bench mon that takes least from the foe's best move
    const sw = legalSwitches(state, side);
    if (!sw.length) return null;
    let best = sw[0], bestT = 9;
    for (const s of sw) {
      const cand = state.sides[side].party[s];
      const t = threatFrac(state, 1 - side, cand);
      if (t < bestT) { bestT = t; best = s; }
    }
    return { kind: 'switch', toSlot: best };
  }
  const me = active(state, side), foe = active(state, 1 - side);
  if (!me || !foe) return P.novice(state, side);
  const bag = state.sides[side].items || {};
  const inc = threatFrac(state, 1 - side, me);            // what the foe does to me
  const out = rankMoves(state, side);
  const myBest = out.length ? out[0].score : 0;           // fraction of foe's CURRENT hp

  // 1. can I just kill it? do that.
  if (myBest >= 1) return { kind: 'move', moveId: out[0].id, target: 'foe' };

  // 2. am I about to die and can I heal out of range? potion.
  if (me.hp / me.maxHp < 0.4 && inc * me.maxHp < me.hp + 0.35 * me.maxHp) {
    for (const id of ['hyper_potion', 'super_potion', 'potion']) {
      if (bag[id] > 0) return { kind: 'item', itemId: id, targetSlot: me.slot };
    }
  }

  // 3. losing the matchup badly? pivot to whatever resists it.
  if (inc >= 0.55 && myBest < 0.5) {
    const sw = legalSwitches(state, side);
    let best = -1, bestT = inc * 0.7;   // must be a real improvement
    for (const s of sw) {
      const cand = state.sides[side].party[s];
      const t = threatFrac(state, 1 - side, cand);
      if (t < bestT) { bestT = t; best = s; }
    }
    if (best >= 0) return { kind: 'switch', toSlot: best };
  }

  // 4. safe turn against something I can't 2HKO — put a status on it / set up.
  if (inc < 0.4 && myBest < 0.5) {
    const stat = legalMoves(state, side).map(getMove).filter(Boolean)
      .filter((m) => m.category === 'status');
    const inflict = stat.find((m) => (m.effects || []).some((e) => e.kind === 'status'));
    if (inflict && !foe.status) return { kind: 'move', moveId: inflict.id, target: 'foe' };
    const boost = stat.find((m) => (m.effects || []).some((e) => e.kind === 'boost' && e.target === 'self'));
    if (boost && (me.boosts.atk + me.boosts.spa) < 2) return { kind: 'move', moveId: boost.id, target: 'self' };
  }
  return P.novice(state, side);
};

const AI = (lvl) => (state, side) => chooseAction(state, side, lvl);

function play(pA, pB, seed, ta, tb, bag = true) {
  const b = mkBattle(seed, ta.map((m) => ({ ...m })), tb.map((m) => ({ ...m })), bag);
  let g = 0;
  while (!b.ended && g++ < MAXT) {
    const c = [null, null];
    for (const s of [0, 1]) {
      if (!b.request[s]) continue;
      c[s] = (s === 0 ? pA : pB)(b, s) || chooseAction(b, s, 'pirate');
    }
    submitChoices(b, c);
  }
  return b;
}

/* ==================================================================== human */
if (MODE === 'human') {
  const cast = {
    'greedy (biggest number)': P.greedy,
    'novice (greedy + potions)': P.novice,
    'club player (+switch,+status)': P.solid,
    'AI pirate': AI('pirate'),
    'AI ace': AI('ace'),
    'AI warlord': AI('warlord')
  };
  const names = Object.keys(cast);
  console.log(`\n════ HUMAN-PLAUSIBLE PLAYERS — ${GAMES} mirrored pairs (${GAMES * 2} games) per cell ════`);
  console.log(`(row's win rate vs column. If clicking the biggest number is near 50% against`);
  console.log(` a thinking player, there is no game underneath.)\n`);
  const W = {};
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      let wi = 0, wj = 0, dr = 0, tn = 0;
      for (let n = 0; n < GAMES; n++) {
        const rng = new RNG(60600 + n * 7211);
        const ta = team(rng), tb = team(rng);
        const seed = 33000 + n * 419;
        for (const flip of [false, true]) {
          const b = play(flip ? cast[names[j]] : cast[names[i]], flip ? cast[names[i]] : cast[names[j]], seed, ta, tb);
          tn += b.turn;
          const iWon = flip ? b.winner === 1 : b.winner === 0;
          const jWon = flip ? b.winner === 0 : b.winner === 1;
          if (iWon) wi++; else if (jWon) wj++; else dr++;
        }
      }
      W[`${i}|${j}`] = { wi, wj, dr, n: GAMES * 2, turns: tn / (GAMES * 2) };
    }
  }
  const pad = 30;
  console.log(' '.repeat(pad) + names.map((n) => n.slice(0, 9).padStart(10)).join(''));
  for (let i = 0; i < names.length; i++) {
    let row = names[i].padEnd(pad);
    for (let j = 0; j < names.length; j++) {
      if (i === j) { row += '     —    '; continue; }
      const k = i < j ? `${i}|${j}` : `${j}|${i}`;
      const c = W[k];
      const w = i < j ? c.wi : c.wj;
      row += pct(w / c.n).padStart(10);
    }
    console.log(row);
  }
  console.log('\nheadline gaps:');
  const g = (a, b) => {
    const i = names.indexOf(a), j = names.indexOf(b);
    const k = i < j ? `${i}|${j}` : `${j}|${i}`; const c = W[k];
    const w = i < j ? c.wi : c.wj;
    console.log(`  ${a.padEnd(30)} vs ${b.padEnd(30)} ${pct(w / c.n).padStart(7)}  (${c.turns.toFixed(1)} turns)`);
  };
  g('greedy (biggest number)', 'AI ace');
  g('novice (greedy + potions)', 'AI ace');
  g('club player (+switch,+status)', 'AI ace');
  g('greedy (biggest number)', 'club player (+switch,+status)');
  g('greedy (biggest number)', 'novice (greedy + potions)');
  g('novice (greedy + potions)', 'club player (+switch,+status)');
  g('AI ace', 'AI warlord');
}

/* ==================================================================== tempo */
// Where do the turns go, and does a longer game carry more information?
if (MODE === 'tempo') {
  const noHeal = (lvl) => (state, side) => {
    const c = chooseAction(state, side, lvl);
    if (state.request[side] === 'move' && c.kind === 'move') {
      const m = getMove(c.moveId);
      const heals = m && ((m.effects || []).some((e) => e.kind === 'heal') || m.drain);
      if (heals) return P.greedy(state, side);
    }
    if (c.kind === 'item') return P.greedy(state, side);
    return c;
  };
  const noStatusNoHeal = (lvl) => (state, side) => {
    const c = chooseAction(state, side, lvl);
    if (state.request[side] === 'move' && c.kind === 'move' && getMove(c.moveId)?.category === 'status') return P.greedy(state, side);
    if (c.kind === 'item') return P.greedy(state, side);
    return c;
  };

  function run(label, pol, bag) {
    let turns = 0, stall = 0, contested = 0, flips = 0, koTurns = 0, games = 0;
    let hpRemoved = 0, hpHealed = 0, decided = 0;
    const lifeTurns = [];
    for (let n = 0; n < GAMES; n++) {
      const rng = new RNG(24680 + n * 5171);
      const b = mkBattle(15000 + n * 233, team(rng), team(rng), bag);
      let g = 0, lastSign = 0;
      const frac = (side) => {
        const s = b.sides[side];
        let h = 0, m = 0;
        for (const p of s.party) { h += Math.max(0, p.hp); m += p.maxHp; }
        return h / m;
      };
      while (!b.ended && g++ < MAXT) {
        const before = [frac(0), frac(1)];
        const c = [null, null];
        for (const s of [0, 1]) if (b.request[s]) c[s] = pol(b, s);
        const evs = submitChoices(b, c);
        const after = [frac(0), frac(1)];
        const moved = Math.abs(after[0] - before[0]) + Math.abs(after[1] - before[1]);
        contested++;
        if (moved < 0.06) stall++;
        const ko = evs.some((e) => e.t === 'faint');
        if (ko) koTurns++;
        for (const e of evs) {
          if (e.t === 'damage') hpRemoved += e.amount / (e.maxHp || 1);
          if (e.t === 'heal') hpHealed += e.amount / (e.maxHp || 1);
          if (e.t === 'faint') {
            const mon = b.sides[e.side].party.find((p) => p.uid === e.uid);
            if (mon) lifeTurns.push(mon.turnsActive);
          }
        }
        const sign = Math.sign(after[0] - after[1]);
        if (sign !== 0 && lastSign !== 0 && sign !== lastSign) flips++;
        if (sign !== 0) lastSign = sign;
      }
      turns += b.turn; games++;
      if (b.winner === 0 || b.winner === 1) decided++;
    }
    console.log(`${label.padEnd(34)} ${(turns / games).toFixed(1).padStart(5)} ${pct(stall / contested).padStart(8)} ${pct(koTurns / contested).padStart(8)} ${(flips / games).toFixed(2).padStart(7)} ${(hpRemoved / turns).toFixed(3).padStart(9)} ${(hpHealed / Math.max(1, hpRemoved)).toFixed(2).padStart(8)} ${(lifeTurns.reduce((a, c) => a + c, 0) / Math.max(1, lifeTurns.length)).toFixed(2).padStart(7)}`);
  }
  console.log(`\n════ WHERE DO THE TURNS GO? — ace vs ace, ${GAMES} games each row ════\n`);
  console.log('a "stall turn" = combined team-HP moved by less than 6% of a full bar.');
  console.log('"lead flips"   = how many times the HP lead changed hands in a game.\n');
  console.log('variant                            turns    stall%   KOturn%  flips  HP/turn  heal:dmg  life\n');
  run('full game (bag + status + heal)', AI('ace'), true);
  run('no bag items', AI('ace'), false);
  run('no bag, no recovery', noHeal('ace'), false);
  run('no bag, no status at all', noStatusNoHeal('ace'), false);
  run('pure greedy, no bag', P.greedy, false);
}

/* ===================================================================== cost */
// What does a switch actually cost, in the currency of this game?
if (MODE === 'cost') {
  let hits = 0, dmgSum = 0, ohko = 0, twoHKO = 0;
  let switches = 0, switchDmg = 0, switchFree = 0;
  let benchResists = 0, benchChecked = 0, benchGoodAndFaster = 0;
  for (let n = 0; n < GAMES; n++) {
    const rng = new RNG(9182 + n * 6151);
    const b = mkBattle(41000 + n * 307, team(rng), team(rng));
    let g = 0;
    while (!b.ended && g++ < MAXT) {
      // Does the bench even contain an answer to what is in front of me?
      for (const s of [0, 1]) {
        if (b.request[s] !== 'move') continue;
        const me = active(b, s);
        const cur = threatFrac(b, 1 - s, me);
        const sw = legalSwitches(b, s);
        if (!sw.length || !me) continue;
        benchChecked++;
        let any = false, anyFast = false;
        for (const k of sw) {
          const cand = b.sides[s].party[k];
          if (threatFrac(b, 1 - s, cand) < cur * 0.6) {
            any = true;
            if (cand.stats.spe > (active(b, 1 - s)?.stats.spe || 0)) anyFast = true;
          }
        }
        if (any) benchResists++;
        if (anyFast) benchGoodAndFaster++;
      }
      const c = [null, null];
      for (const s of [0, 1]) if (b.request[s]) c[s] = chooseAction(b, s, 'ace');
      const wasSwitch = c[0] && c[0].kind === 'switch' && b.request[0] === 'move';
      const evs = submitChoices(b, c);
      for (const e of evs) {
        if (e.t === 'damage' && e.source === 'move') {
          hits++; dmgSum += e.amount / e.maxHp;
          if (e.amount >= e.maxHp) ohko++;
          if (e.amount >= e.maxHp * 0.5) twoHKO++;
        }
      }
      if (wasSwitch) {
        switches++;
        const taken = evs.filter((e) => e.t === 'damage' && e.side === 0 && e.source === 'move')
          .reduce((a, e) => a + e.amount / e.maxHp, 0);
        switchDmg += taken;
        if (taken < 0.02) switchFree++;
      }
    }
  }
  console.log(`\n════ WHAT DOES POSITION COST? — ace vs ace, ${GAMES} games ════\n`);
  console.log(`damaging hits landed          ${hits}`);
  console.log(`mean damage per hit           ${pct(dmgSum / hits)} of the target's max HP`);
  console.log(`hits that OHKO from full      ${pct(ohko / hits)}`);
  console.log(`hits that are a clean 2HKO    ${pct(twoHKO / hits)}  (>=50% of max HP)`);
  console.log(`\nbench answers available       ${pct(benchResists / benchChecked)} of move-turns had a bench mon`);
  console.log(`                              taking <60% of what the active takes`);
  console.log(`  ...and outspeeding the foe  ${pct(benchGoodAndFaster / benchChecked)}`);
  console.log(`\nAI switches observed          ${switches}`);
  console.log(`mean HP paid on a switch turn ${switches ? pct(switchDmg / switches) : 'n/a'} of the incoming mon's bar`);
  console.log(`switches that were free       ${switches ? pct(switchFree / switches) : 'n/a'}`);
}

/* =================================================================== matrix */
// 32x32 one-on-one. Is the roster a pecking order or a web?
if (MODE === 'matrix') {
  const REPS = Number(arg('reps', 3));
  const n = IDS.length;
  const win = Array.from({ length: n }, () => new Array(n).fill(0));
  const played = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let r = 0; r < REPS; r++) {
        const seed = 700000 + (i * 97 + j) * 131 + r * 17;
        const ta = [makeDefaultMember(IDS[i], 50)];
        const tb = [makeDefaultMember(IDS[j], 50)];
        const b = createBattle({
          seed, arena: 'colosseum', format: { level: 50, teamSize: 1, bring: 1 },
          sides: [{ name: 'A', team: ta, items: {} }, { name: 'B', team: tb, items: {} }]
        });
        let g = 0;
        while (!b.ended && g++ < MAXT) {
          const c = [null, null];
          for (const s of [0, 1]) if (b.request[s]) c[s] = chooseAction(b, s, 'ace');
          submitChoices(b, c);
        }
        played[i][j]++; played[j][i]++;
        if (b.winner === 0) win[i][j]++;
        else if (b.winner === 1) win[j][i]++;
        else { win[i][j] += 0.5; win[j][i] += 0.5; }
      }
    }
  }
  const rate = (i, j) => played[i][j] ? win[i][j] / played[i][j] : 0.5;
  const overall = IDS.map((id, i) => {
    let w = 0, p = 0;
    for (let j = 0; j < n; j++) { if (i === j) continue; w += win[i][j]; p += played[i][j]; }
    return { id, wr: w / p, arch: BY[id] };
  }).sort((a, b) => b.wr - a.wr);
  console.log(`\n════ 1v1 ROUND ROBIN — ${n} fighters, ${REPS} reps each pairing, ace AI both sides ════\n`);
  console.log('rank  fighter            winrate   bst  spe');
  overall.forEach((r, k) => {
    const b = r.arch.base;
    console.log(`${String(k + 1).padStart(4)}  ${r.id.padEnd(18)} ${pct(r.wr).padStart(7)}  ${String(b.hp + b.atk + b.def + b.spa + b.spd + b.spe).padStart(4)} ${String(b.spe).padStart(4)}`);
  });
  // intransitivity
  let triads = 0, cyclic = 0, decisive = 0, coinflip = 0, hardCounter = 0, pairs = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    pairs++;
    const r = rate(i, j);
    if (r === 1 || r === 0) hardCounter++;
    if (r >= 0.34 && r <= 0.66) coinflip++; else decisive++;
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    triads++;
    const ab = rate(i, j) > 0.5, bc = rate(j, k) > 0.5, ca = rate(k, i) > 0.5;
    if ((ab && bc && ca) || (!ab && !bc && !ca)) cyclic++;
  }
  console.log(`\npairings              ${pairs}`);
  console.log(`decisive matchups     ${pct(decisive / pairs)}  (one side wins >66% of the series)`);
  console.log(`hard counters (100-0) ${pct(hardCounter / pairs)}`);
  console.log(`cyclic triads         ${pct(cyclic / triads)} of ${triads}  (0% = a strict pecking order, ~25% = rock-paper-scissors)`);
  const spread = overall[0].wr - overall[overall.length - 1].wr;
  console.log(`winrate spread        ${pct(overall[0].wr)} (${overall[0].id}) down to ${pct(overall[overall.length - 1].wr)} (${overall[overall.length - 1].id}), spread ${pct(spread)}`);
  // does anything wall a sweeper?
  const WALLS = ['franky', 'crocodile', 'smoker', 'chopper', 'jinbe'];
  const SWEEP = ['killua', 'levi', 'ichigo_bankai', 'gojo', 'goku', 'shanks', 'luffy_g4', 'enel'];
  console.log(`\nwall-vs-sweeper table (row = wall's win rate):`);
  console.log('           ' + SWEEP.map((s) => s.slice(0, 8).padStart(9)).join(''));
  for (const w of WALLS) {
    const i = IDS.indexOf(w);
    console.log(w.padEnd(11) + SWEEP.map((s) => pct(rate(i, IDS.indexOf(s))).padStart(9)).join(''));
  }
  let wallWins = 0, wallGames = 0;
  for (const w of WALLS) for (const s of SWEEP) { wallWins += rate(IDS.indexOf(w), IDS.indexOf(s)); wallGames++; }
  console.log(`\nwalls beat sweepers ${pct(wallWins / wallGames)} of the time`);
  // average 1v1 length
}

/* ======================================================================= pp */
if (MODE === 'pp') {
  let struggles = 0, games = 0, ppOutMon = 0, monCount = 0, turns = 0;
  const firstOut = [];
  for (let n = 0; n < GAMES; n++) {
    const rng = new RNG(3141 + n * 7919);
    const b = mkBattle(52000 + n * 179, team(rng), team(rng));
    let g = 0, seenOut = -1;
    while (!b.ended && g++ < MAXT) {
      const c = [null, null];
      for (const s of [0, 1]) if (b.request[s]) c[s] = chooseAction(b, s, 'ace');
      const evs = submitChoices(b, c);
      for (const e of evs) if (e.t === 'moveUsed' && e.moveId === 'struggle') struggles++;
      if (seenOut < 0) {
        for (const side of b.sides) for (const m of side.party) for (const mo of m.moves) if (mo.pp === 0) seenOut = b.turn;
      }
    }
    if (seenOut > 0) firstOut.push(seenOut);
    for (const side of b.sides) for (const m of side.party) { monCount++; if (m.moves.some((mo) => mo.pp === 0)) ppOutMon++; }
    turns += b.turn; games++;
  }
  console.log(`\n════ PP AS A RESOURCE — ace vs ace, ${games} games, ${(turns / games).toFixed(1)} turns avg ════\n`);
  console.log(`struggle used                 ${struggles} times in ${games} games`);
  console.log(`fighters that ran a move dry  ${pct(ppOutMon / monCount)}`);
  console.log(`first empty move slot on turn ${firstOut.length ? (firstOut.reduce((a, c) => a + c, 0) / firstOut.length).toFixed(1) : 'never'} (in ${pct(firstOut.length / games)} of games)`);
}

/* ======================================================================= ui */
// Can the player SEE the tactical option at the moment of choosing?
if (MODE === 'ui') {
  const { chromium } = await import('playwright');
  const { mkdir } = await import('node:fs/promises');
  const OUT = 'tests/shots/depth3';
  const PORT = Number(arg('port', 8812));
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 40000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  const shot = async (n) => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('  shot', `${OUT}/${n}.png`); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  await page.evaluate(() => window.__ARENA.battle.quick(919191));
  await page.waitForFunction(() => !!window.__ARENA.battle.state()?.request?.[0], null, { timeout: 40000 });
  await page.evaluate(() => window.__ARENA.battle.skipAnimations(true));
  await page.waitForFunction(() => !window.__ARENA.battle.isAnimating(), null, { timeout: 40000 }).catch(() => {});
  await sleep(2000);
  await shot('01-turn1-menu');

  const clickText = async (re) => page.evaluate((src) => {
    const rx = new RegExp(src, 'i');
    const all = [...document.querySelectorAll('button,[role=button],.btn,li,div,span')];
    const b = all.reverse().find((e) => rx.test((e.textContent || '').trim()) && e.offsetParent && (e.textContent || '').trim().length < 24);
    if (b) { b.click(); return (b.textContent || '').trim(); }
    return null;
  }, re);

  console.log('\n════ WHAT THE PLAYER CAN SEE AT THE MOMENT OF CHOOSING ════\n');
  const fight = await clickText('^fight$');
  await sleep(900);
  await shot('02-fight-cards');
  const seen = await page.evaluate(() => {
    const st = window.__ARENA.battle.state();
    const root = document.querySelector('#ui') || document.body;
    const text = (root.innerText || '');
    const me = st.sides[0].party[st.sides[0].activeIndex];
    const foe = st.sides[1].party[st.sides[1].activeIndex];
    return {
      text,
      myMoves: me.moves.map((m) => ({ id: m.id, pp: m.pp, maxPp: m.maxPp })),
      foe: { species: foe.speciesId, types: foe.types, hp: foe.hp, maxHp: foe.maxHp, status: foe.status, boosts: foe.boosts, item: foe.item, ability: foe.ability },
      field: st.field,
      sideState: st.sides.map((s) => ({ hazards: s.hazards, screens: s.screens, items: s.items }))
    };
  });
  console.log('--- FIGHT PANEL, RAW TEXT ---');
  console.log(seen.text.split('\n').filter(Boolean).join(' | '));
  console.log('\nmy moves (truth):', JSON.stringify(seen.myMoves));
  console.log('foe (truth):', JSON.stringify(seen.foe));
  console.log('field (truth):', JSON.stringify(seen.field));
  console.log('side state (truth):', JSON.stringify(seen.sideState));

  const T = seen.text.toLowerCase();
  const checks = [
    ['move name', seen.myMoves.some((m) => T.includes((m.id || '').split('_')[0]))],
    ['PP counter', /\b\d+\s*\/\s*\d+\b/.test(seen.text)],
    ['move type label', /(slash|fist|haki|flame|frost|sea|storm|earth|wind|shadow|light|beast|mecha|mind|toxin|sound|spirit|void)/i.test(seen.text)],
    ['base power number', /\bpow(er)?\b|\b(4[0-9]|[5-9][0-9]|1[0-9][0-9])\s*(bp|pow)/i.test(seen.text)],
    ['effectiveness cue', /(super effective|not very|no effect|2×|2x|×2|resist|weak to|immune)/i.test(seen.text)],
    ['foe type shown', seen.foe.types.some((t) => T.includes(t.toLowerCase()))],
    ['foe HP as a number', new RegExp(`\\b${seen.foe.hp}\\b`).test(seen.text)],
    ['foe status pip text', !!seen.foe.status && T.includes(seen.foe.status)]
  ];
  console.log('\nvisible at choice time:');
  for (const [k, v] of checks) console.log(`  ${v ? 'YES' : 'no '}  ${k}`);

  // hover / focus a move card -> does more information appear?
  const before = seen.text.length;
  const hovered = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('*')].filter((e) => /move-?card|movebtn|move-button/i.test(String(e.className)));
    if (!cards.length) return null;
    const c = cards[0];
    c.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    c.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    if (c.focus) c.focus();
    return String(c.className);
  });
  await sleep(700);
  await shot('03-move-hover');
  const after = await page.evaluate(() => (document.querySelector('#ui') || document.body).innerText);
  console.log(`\nhovered card class: ${hovered}`);
  console.log(`text grew on hover: ${after.length - before} chars`);
  if (after.length !== before) console.log('hover text: ' + after.replace(/\n+/g, ' | ').slice(0, 900));

  // party panel — is a switch legible?
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(500);
  const party = await clickText('^(party|switch|team)$');
  await sleep(900);
  await shot('04-party');
  const partyText = await page.evaluate(() => (document.querySelector('#ui') || document.body).innerText);
  console.log(`\nparty button: ${party}`);
  console.log('party panel: ' + partyText.replace(/\n+/g, ' | ').slice(0, 1200));

  await page.keyboard.press('Escape').catch(() => {});
  await sleep(400);
  await clickText('^bag$');
  await sleep(900);
  await shot('05-bag');
  console.log('\nbag panel: ' + (await page.evaluate(() => (document.querySelector('#ui') || document.body).innerText)).replace(/\n+/g, ' | ').slice(0, 900));

  // Play forward to a mid-game turn where field state exists, screenshot again
  await page.keyboard.press('Escape').catch(() => {});
  const mid = await page.evaluate(async () => {
    const A = window.__ARENA;
    for (let i = 0; i < 60; i++) {
      const st = A.battle.state();
      if (!st || st.ended) break;
      if (st.request && st.request[0]) {
        const me = st.sides[0].party[st.sides[0].activeIndex];
        A.battle.choose(0, { kind: 'move', moveId: me.moves[0].id, target: 'foe' });
      }
      await new Promise((r) => setTimeout(r, 90));
      const s2 = A.battle.state();
      if (s2 && s2.turn >= 6) break;
    }
    const st = A.battle.state();
    return {
      turn: st?.turn, ended: st?.ended,
      field: st?.field,
      hazards: st?.sides?.map((s) => s.hazards),
      screens: st?.sides?.map((s) => s.screens),
      statuses: st?.sides?.map((s) => s.party.map((p) => `${p.speciesId}:${p.status || '-'}:${p.hp}/${p.maxHp}`))
    };
  });
  await sleep(1500);
  await shot('06-midgame');
  console.log('\nmid-game truth:', JSON.stringify(mid));
  const midText = await page.evaluate(() => (document.querySelector('#ui') || document.body).innerText);
  console.log('mid-game UI text: ' + midText.replace(/\n+/g, ' | ').slice(0, 1200));
  console.log('\nconsole errors: ' + (errs.length ? errs.slice(0, 6).join(' // ') : 'none'));
  await browser.close();
}
