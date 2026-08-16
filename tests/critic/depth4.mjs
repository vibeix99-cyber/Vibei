// CRITIC — THE GAME UNDERNEATH, round 4.
//
// depth2 asked "does the AI use its tools?" and depth3 asked "does a human-shaped
// policy beat another human-shaped policy?". Neither ever priced a *single turn*.
// A policy comparison averages over thousands of decisions; it cannot tell you
// whether the decision in front of the player right now has a right answer, how
// much the right answer is worth, and whether "click the biggest number" is it.
//
// depth4 prices the turn directly, by rollout, with common random numbers.
//
//   node tests/critic/depth4.mjs regret    --pos 120 --k 40
//   node tests/critic/depth4.mjs firststep --games 150
//   node tests/critic/depth4.mjs arc       --games 400
//   node tests/critic/depth4.mjs ui        --port 8812

import {
  createBattle, submitChoices, legalMoves, legalSwitches, active
} from '../../src/core/engine.js';
import { chooseAction } from '../../src/core/ai.js';
import { damageRange } from '../../src/core/damage.js';
import { RNG } from '../../src/core/rng.js';
import { getMove } from '../../src/data/moves.js';
import { allFighters, makeDefaultMember } from '../../src/data/fighters.js';
import { defaultBag } from '../../src/data/items.js';

const MODE = process.argv[2] || 'regret';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const SIZE = Number(arg('size', 3));
const MAXT = 300;
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

/** Deep copy of a battle position with a FRESH rng stream.
 *  Reseeding is deliberate: it is the only way to compare two actions from the
 *  same position without the "changing the action shifts the dice" confound that
 *  depth2's swing2 had to apologise for. */
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

/* ================================================================== regret */
// The value of the turn: enumerate every action available to side 0 at a real
// mid-game position, play each one out many times with the SAME dice, and see
// how far apart the win rates are.
if (MODE === 'regret') {
  const NPOS = Number(arg('pos', 120));
  const K = Number(arg('k', 40));
  const HARVEST = Number(arg('harvest', 400));

  // 1. harvest realistic positions
  const pool = [];
  for (let n = 0; n < HARVEST; n++) {
    const rng = new RNG(778800 + n * 6151);
    const b = mkBattle(311000 + n * 271, team(rng), team(rng));
    let g = 0;
    while (!b.ended && g++ < MAXT) {
      if (!b.resume && b.request[0] === 'move' && b.request[1] === 'move' && b.turn >= 1) {
        pool.push({ st: fork(b, 1), turn: b.turn, gameId: n });
      }
      const c = [null, null];
      for (const s of [0, 1]) if (b.request[s]) c[s] = ace(b, s);
      submitChoices(b, c);
    }
  }
  // spread the sample over distinct games and turns
  const prng = new RNG(4242);
  const picked = [];
  const seenGame = new Map();
  const shuffled = prng.shuffle(pool);
  for (const p of shuffled) {
    const c = seenGame.get(p.gameId) || 0;
    if (c >= 2) continue;
    seenGame.set(p.gameId, c + 1);
    picked.push(p);
    if (picked.length >= NPOS) break;
  }

  console.log(`\n════ WHAT IS THE TURN WORTH? — ${picked.length} real mid-game positions, ${K} rollouts per action ════\n`);
  console.log(`Every action legal to side 0 is played out ${K} times against an ace opponent,`);
  console.log(`all candidates sharing the same ${K} rollout seeds (common random numbers).\n`);

  const rows = [];
  let nullSpreads = [];
  let t0 = Date.now();
  for (let i = 0; i < picked.length; i++) {
    const { st, turn } = picked[i];
    const me = active(st, 0);
    if (!me) continue;
    const cands = [];
    for (const id of legalMoves(st, 0)) {
      const m = getMove(id);
      cands.push({ label: id, kind: m?.category === 'status' ? 'status' : 'attack', choice: { kind: 'move', moveId: id, target: 'foe' } });
    }
    for (const s of legalSwitches(st, 0)) {
      cands.push({ label: `switch:${st.sides[0].party[s].speciesId}`, kind: 'switch', choice: { kind: 'switch', toSlot: s } });
    }
    const bag = st.sides[0].items || {};
    for (const it of ['hyper_potion', 'full_heal']) {
      if (bag[it] > 0) cands.push({ label: `item:${it}`, kind: 'item', choice: { kind: 'item', itemId: it, targetSlot: me.slot } });
    }
    if (cands.length < 2) continue;

    const seeds = [];
    for (let k = 0; k < K; k++) seeds.push((900000 + i * 9973 + k * 7919) >>> 0);

    for (const c of cands) {
      let w = 0;
      for (let k = 0; k < K; k++) {
        const f = fork(st, seeds[k]);
        const first = [c.choice, ace(f, 1)];
        submitChoices(f, first);
        w += rollout(f, ace, ace);
      }
      c.wr = w / K;
    }
    // null arm: the SAME action, six independent batches. This is the spread you
    // would see from dice alone if no action were better than any other.
    const nullAct = cands[0];
    const nb = [];
    for (let b = 0; b < Math.min(6, cands.length); b++) {
      let w = 0;
      for (let k = 0; k < K; k++) {
        const f = fork(st, (5500000 + i * 31 + b * 104729 + k * 7919) >>> 0);
        submitChoices(f, [nullAct.choice, ace(f, 1)]);
        w += rollout(f, ace, ace);
      }
      nb.push(w / K);
    }
    nullSpreads.push(Math.max(...nb) - Math.min(...nb));

    cands.sort((a, b) => b.wr - a.wr);
    const gid = greedyMoveId(st, 0);
    const greedyCand = cands.find((c) => c.choice.kind === 'move' && c.choice.moveId === gid) || cands[0];
    // what the game's own strong AI would have played here, and what the best
    // *human-legible* heuristics would have played
    const aceCh = chooseAction(st, 0, 'ace');
    const matches = (c) => c.choice.kind === aceCh.kind
      && (aceCh.kind !== 'move' || c.choice.moveId === aceCh.moveId)
      && (aceCh.kind !== 'switch' || c.choice.toSlot === aceCh.toSlot)
      && (aceCh.kind !== 'item' || c.choice.itemId === aceCh.itemId);
    const aceCand = cands.find(matches);
    const meanWr = cands.reduce((a, c) => a + c.wr, 0) / cands.length;
    rows.push({
      turn, n: cands.length,
      best: cands[0], worst: cands[cands.length - 1],
      spread: cands[0].wr - cands[cands.length - 1].wr,
      greedyLoss: cands[0].wr - greedyCand.wr,
      aceLoss: aceCand ? cands[0].wr - aceCand.wr : null,
      randLoss: cands[0].wr - meanWr,
      greedyIsBest: greedyCand === cands[0],
      bestKind: cands[0].kind,
      // how many actions are statistically indistinguishable from the best
      tied: cands.filter((c) => cands[0].wr - c.wr <= 0.05).length,
      cands: cands.map((c) => ({ l: c.label, k: c.kind, wr: c.wr }))
    });
    if ((i + 1) % 20 === 0) console.error(`  …${i + 1}/${picked.length} positions (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }

  const q = (arr, p) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(a.length * p))]; };
  const spreads = rows.map((r) => r.spread);
  const nullQ = { p50: q(nullSpreads, 0.5), p90: q(nullSpreads, 0.9), mean: nullSpreads.reduce((a, c) => a + c, 0) / nullSpreads.length };
  console.log(`NOISE FLOOR (same action, 6 independent batches of ${K}):`);
  console.log(`  spread  mean ${pp(nullQ.mean)}   median ${pp(nullQ.p50)}   p90 ${pp(nullQ.p90)}\n`);
  console.log(`REAL SPREAD across all legal actions (best win% − worst win%):`);
  console.log(`  p10 ${pp(q(spreads, 0.1))}  p25 ${pp(q(spreads, 0.25))}  median ${pp(q(spreads, 0.5))}  p75 ${pp(q(spreads, 0.75))}  p90 ${pp(q(spreads, 0.9))}`);
  console.log(`  mean ${pp(spreads.reduce((a, c) => a + c, 0) / spreads.length)}   mean candidates per turn ${(rows.reduce((a, c) => a + c.n, 0) / rows.length).toFixed(1)}`);
  const real = rows.filter((r) => r.spread > nullQ.p90);
  console.log(`  turns whose spread beats the p90 noise floor: ${pct(real.length / rows.length)}`);
  console.log(`  turns where EVERY action is within 5pp of the best: ${pct(rows.filter((r) => r.spread <= 0.05).length / rows.length)}`);

  const gl = rows.map((r) => r.greedyLoss);
  console.log(`\nCLICK THE BIGGEST NUMBER — cost of always taking the highest-expected-damage move:`);
  console.log(`  it IS the best action        ${pct(rows.filter((r) => r.greedyIsBest).length / rows.length)} of turns`);
  console.log(`  within 5pp of the best       ${pct(rows.filter((r) => r.greedyLoss <= 0.05).length / rows.length)}`);
  console.log(`  mean win% given up per turn  ${pp(gl.reduce((a, c) => a + c, 0) / gl.length)}   median ${pp(q(gl, 0.5))}   p90 ${pp(q(gl, 0.9))}`);
  const al = rows.filter((r) => r.aceLoss !== null).map((r) => r.aceLoss);
  const rl = rows.map((r) => r.randLoss);
  console.log(`\nHOW MUCH OF THAT REGRET IS RECOVERABLE? (same positions, same rollouts)`);
  console.log(`  pick uniformly at random   mean regret ${pp(rl.reduce((a, c) => a + c, 0) / rl.length)}   within 5pp of best ${pct(rows.filter((r) => r.randLoss <= 0.05).length / rows.length)}`);
  console.log(`  click the biggest number   mean regret ${pp(gl.reduce((a, c) => a + c, 0) / gl.length)}   within 5pp of best ${pct(rows.filter((r) => r.greedyLoss <= 0.05).length / rows.length)}`);
  console.log(`  the game's own ace AI      mean regret ${pp(al.reduce((a, c) => a + c, 0) / al.length)}   within 5pp of best ${pct(rows.filter((r) => r.aceLoss !== null && r.aceLoss <= 0.05).length / al.length)}   (matched on ${al.length}/${rows.length} turns)`);

  const kinds = {};
  for (const r of rows) kinds[r.bestKind] = (kinds[r.bestKind] || 0) + 1;
  console.log(`\nWHEN THERE IS A BEST ACTION, WHAT IS IT?`);
  console.log(`  all turns:            ${Object.entries(kinds).map(([k, v]) => `${k} ${pct(v / rows.length)}`).join('   ')}`);
  const k2 = {};
  for (const r of real) k2[r.bestKind] = (k2[r.bestKind] || 0) + 1;
  console.log(`  turns that matter:    ${Object.entries(k2).map(([k, v]) => `${k} ${pct(v / real.length)}`).join('   ')}`);
  console.log(`  size of the "correct set" (actions within 5pp of best): mean ${(rows.reduce((a, c) => a + c.tied, 0) / rows.length).toFixed(2)} of ${(rows.reduce((a, c) => a + c.n, 0) / rows.length).toFixed(1)} legal`);

  // a few worked examples of the sharpest turns
  rows.sort((a, b) => b.spread - a.spread);
  console.log(`\nSHARPEST FIVE TURNS (the game at its most interesting):`);
  for (const r of rows.slice(0, 5)) {
    console.log(`  turn ${r.turn}  spread ${pp(r.spread)}:  ` + r.cands.map((c) => `${c.l}(${c.k[0]}) ${pct(c.wr)}`).join('  '));
  }
  console.log(`\nFLATTEST FIVE TURNS:`);
  for (const r of rows.slice(-5)) {
    console.log(`  turn ${r.turn}  spread ${pp(r.spread)}:  ` + r.cands.map((c) => `${c.l}(${c.k[0]}) ${pct(c.wr)}`).join('  '));
  }
}

/* =============================================================== firststep */
// depth3 asked which human policy beats which. It never isolated ONE tool as an
// ADDITION to the beginner's repertoire, measured against a fixed benchmark.
// This is the "does the first step toward playing well pay?" question.
if (MODE === 'firststep') {
  const GAMES = Number(arg('games', 150));

  const base = (state, side) => {
    if (state.request[side] === 'switch') {
      const sw = legalSwitches(state, side);
      return sw.length ? { kind: 'switch', toSlot: sw[0] } : null;
    }
    const id = greedyMoveId(state, side);
    return { kind: 'move', moveId: id || 'struggle', target: 'foe' };
  };
  // + potions
  const wPotion = (state, side) => {
    if (state.request[side] === 'move') {
      const me = active(state, side), bag = state.sides[side].items || {};
      if (me && me.hp / me.maxHp < 0.35) {
        for (const id of ['hyper_potion', 'super_potion', 'potion']) if (bag[id] > 0) return { kind: 'item', itemId: id, targetSlot: me.slot };
      }
    }
    return base(state, side);
  };
  // + switch out of a bad matchup, into the bench mon that takes least
  const wSwitch = (state, side) => {
    if (state.request[side] === 'switch') {
      const sw = legalSwitches(state, side);
      if (!sw.length) return null;
      let best = sw[0], bt = 9;
      for (const s of sw) { const t = threatFrac(state, 1 - side, state.sides[side].party[s]); if (t < bt) { bt = t; best = s; } }
      return { kind: 'switch', toSlot: best };
    }
    const me = active(state, side);
    if (me) {
      const inc = threatFrac(state, 1 - side, me);
      const mine = legalMoves(state, side).map((id) => dmgFrac(state, side, id, me, active(state, 1 - side)));
      const myBest = mine.length ? Math.max(...mine) : 0;
      if (myBest < 1 && inc >= 0.55 && myBest < 0.5) {
        let best = -1, bt = inc * 0.7;
        for (const s of legalSwitches(state, side)) {
          const t = threatFrac(state, 1 - side, state.sides[side].party[s]);
          if (t < bt) { bt = t; best = s; }
        }
        if (best >= 0) return { kind: 'switch', toSlot: best };
      }
    }
    return base(state, side);
  };
  // + one status move on a safe turn
  const wStatus = (state, side) => {
    if (state.request[side] === 'move') {
      const me = active(state, side), foe = active(state, 1 - side);
      if (me && foe) {
        const inc = threatFrac(state, 1 - side, me);
        const mine = legalMoves(state, side).map((id) => dmgFrac(state, side, id, me, foe));
        const myBest = mine.length ? Math.max(...mine) : 0;
        if (myBest < 1 && inc < 0.4 && myBest < 0.5) {
          const stat = legalMoves(state, side).map(getMove).filter((m) => m && m.category === 'status');
          const inflict = stat.find((m) => (m.effects || []).some((e) => e.kind === 'status'));
          if (inflict && !foe.status) return { kind: 'move', moveId: inflict.id, target: 'foe' };
          const boost = stat.find((m) => (m.effects || []).some((e) => e.kind === 'boost' && e.target === 'self'));
          if (boost && (me.boosts.atk + me.boosts.spa) < 2) return { kind: 'move', moveId: boost.id, target: 'self' };
        }
      }
    }
    return base(state, side);
  };
  const combine = (...fns) => (state, side) => {
    for (const f of fns) { const c = f(state, side); if (c && !sameAsBase(c, state, side)) return c; }
    return base(state, side);
  };
  function sameAsBase(c, state, side) {
    const b = base(state, side);
    if (!b || !c) return false;
    return b.kind === c.kind && b.moveId === c.moveId && b.toSlot === c.toSlot;
  }
  const all = combine(wSwitch, wStatus, wPotion);

  const opponents = { 'AI pirate': (s, i) => chooseAction(s, i, 'pirate'), 'AI ace': (s, i) => chooseAction(s, i, 'ace') };
  const players = {
    'A. greedy (biggest number)': base,
    'B. + potion when low': wPotion,
    'C. + switch out of bad matchup': wSwitch,
    'D. + one status on a safe turn': wStatus,
    'E. all three (club player)': all
  };

  console.log(`\n════ DOES THE FIRST STEP TOWARD PLAYING WELL PAY? — ${GAMES * 2} games per cell ════\n`);
  console.log(`Each row is the beginner's policy plus exactly one new habit, against a FIXED`);
  console.log(`opponent. 95% CI on a ${GAMES * 2}-game cell is about ±${(1.96 * Math.sqrt(0.25 / (GAMES * 2)) * 100).toFixed(1)}pp.\n`);
  console.log('player                            ' + Object.keys(opponents).map((o) => o.padStart(14)).join('') + '     turns');
  const res = {};
  for (const [pn, pf] of Object.entries(players)) {
    let line = pn.padEnd(34); let tn = 0, tg = 0;
    for (const [on, of_] of Object.entries(opponents)) {
      let w = 0;
      for (let n = 0; n < GAMES; n++) {
        const rng = new RNG(60600 + n * 7211);
        const ta = team(rng), tb = team(rng);
        const seed = 33000 + n * 419;
        for (const flip of [false, true]) {
          const b = mkBattle(seed, ta.map((m) => ({ ...m })), tb.map((m) => ({ ...m })));
          let g = 0;
          while (!b.ended && g++ < MAXT) {
            const c = [null, null];
            for (const s of [0, 1]) {
              if (!b.request[s]) continue;
              const isMe = (s === 0) !== flip;
              c[s] = (isMe ? pf : of_)(b, s) || chooseAction(b, s, 'pirate');
            }
            submitChoices(b, c);
          }
          tn += b.turn; tg++;
          const meWon = flip ? b.winner === 1 : b.winner === 0;
          if (meWon) w++; else if (b.winner !== 0 && b.winner !== 1) w += 0.5;
        }
      }
      res[`${pn}|${on}`] = w / (GAMES * 2);
      line += pct(w / (GAMES * 2)).padStart(14);
    }
    console.log(line + (tn / tg).toFixed(1).padStart(10));
  }
  console.log(`\nvalue of each habit, added to pure greedy:`);
  for (const on of Object.keys(opponents)) {
    const b0 = res[`A. greedy (biggest number)|${on}`];
    console.log(`  vs ${on}:`);
    for (const pn of Object.keys(players).slice(1)) {
      const d = res[`${pn}|${on}`] - b0;
      console.log(`    ${pn.padEnd(34)} ${(d >= 0 ? '+' : '') + pp(d).padStart(7)}`);
    }
  }
}

/* ====================================================================== arc */
// Longer, or deeper? If the winner is already readable off the HP bars at 40%
// of the way through, the back half of a long game is ceremony, not tactics.
if (MODE === 'arc') {
  const GAMES = Number(arg('games', 400));
  const variants = [
    ['full game (bag, status, heal)', (s, i) => chooseAction(s, i, 'ace'), true],
    ['pure greedy, no bag', (s, i) => {
      if (s.request[i] === 'switch') { const sw = legalSwitches(s, i); return sw.length ? { kind: 'switch', toSlot: sw[0] } : null; }
      return { kind: 'move', moveId: greedyMoveId(s, i) || 'struggle', target: 'foe' };
    }, false]
  ];
  console.log(`\n════ LONGER, OR DEEPER? — ${GAMES} games per variant ════\n`);
  console.log(`At each decile of a game's length, does the side currently ahead on total team HP`);
  console.log(`go on to win? 50% = the game is still open. 100% = the rest is ceremony.\n`);
  for (const [label, pol, bag] of variants) {
    const bins = Array.from({ length: 10 }, () => ({ n: 0, hit: 0 }));
    let totTurns = 0, dec = 0, comebacks = 0;
    for (let n = 0; n < GAMES; n++) {
      const rng = new RNG(24680 + n * 5171);
      const b = mkBattle(15000 + n * 233, team(rng), team(rng), bag);
      const track = [];
      let g = 0;
      const frac = (side) => {
        let h = 0, m = 0;
        for (const p of b.sides[side].party) { h += Math.max(0, p.hp); m += p.maxHp; }
        return h / m;
      };
      while (!b.ended && g++ < MAXT) {
        track.push(Math.sign(frac(0) - frac(1)));
        const c = [null, null];
        for (const s of [0, 1]) if (b.request[s]) c[s] = pol(b, s);
        submitChoices(b, c);
      }
      if (b.winner !== 0 && b.winner !== 1) continue;
      dec++; totTurns += b.turn;
      const wsign = b.winner === 0 ? 1 : -1;
      // did the eventual loser ever lead by more than 20% of a team bar?
      for (let i = 0; i < track.length; i++) {
        const d = Math.floor(i / track.length * 10);
        if (track[i] === 0) continue;
        bins[d].n++; if (track[i] === wsign) bins[d].hit++;
      }
      // comeback: leader at the 60% mark loses
      const at60 = track[Math.floor(track.length * 0.6)];
      if (at60 && at60 !== wsign) comebacks++;
    }
    console.log(`${label}   (${dec} decided games, ${(totTurns / dec).toFixed(1)} turns avg)`);
    console.log('  progress   ' + bins.map((_, i) => `${i * 10}%`.padStart(7)).join(''));
    console.log('  leader wins' + bins.map((b) => pct(b.hit / Math.max(1, b.n)).padStart(7)).join(''));
    console.log(`  comeback from behind at the 60% mark: ${pct(comebacks / dec)}`);
    // information: how many turns remain after the winner is 90% readable?
    let firstLocked = bins.findIndex((b) => b.hit / Math.max(1, b.n) >= 0.9);
    console.log(`  winner readable (>=90%) from the ${firstLocked < 0 ? 'never' : firstLocked * 10 + '%'} mark`
      + (firstLocked >= 0 ? `  →  ${((10 - firstLocked) / 10 * (totTurns / dec)).toFixed(1)} of ${(totTurns / dec).toFixed(1)} turns are already decided` : ''));
    console.log('');
  }
}

/* ======================================================================= ui */
if (MODE === 'ui') {
  const { chromium } = await import('playwright');
  const { mkdir } = await import('node:fs/promises');
  const OUT = 'tests/shots/depth4';
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
  const shot = async (n) => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('  shot', `${OUT}/${n}.png`); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clickText = async (src) => page.evaluate((s) => {
    const rx = new RegExp(s, 'i');
    const all = [...document.querySelectorAll('button,[role=button],.btn,li,div,span')];
    const b = all.reverse().find((e) => rx.test((e.textContent || '').trim()) && e.offsetParent && (e.textContent || '').trim().length < 26);
    if (b) { b.click(); return (b.textContent || '').trim(); }
    return null;
  }, src);

  await page.evaluate(() => window.__ARENA.battle.quick(515151));
  await page.waitForFunction(() => !!window.__ARENA.battle.state()?.request?.[0], null, { timeout: 60000 });
  await page.evaluate(() => window.__ARENA.battle.skipAnimations(true));
  await page.waitForFunction(() => !window.__ARENA.battle.isAnimating(), null, { timeout: 60000 }).catch(() => {});
  await sleep(2200);
  await shot('01-turn1');
  console.log('\n════ IS THE INTERESTING OPTION LEGIBLE AT THE MOMENT OF CHOOSING? ════\n');
  await clickText('^fight$');
  await sleep(1000);
  await shot('02-fight');

  const seen = await page.evaluate(() => {
    const st = window.__ARENA.battle.state();
    const root = document.querySelector('#ui') || document.body;
    const me = st.sides[0].party[st.sides[0].activeIndex];
    const foe = st.sides[1].party[st.sides[1].activeIndex];
    return {
      text: root.innerText || '',
      me: { sp: me.speciesId, types: me.types, hp: me.hp, maxHp: me.maxHp, moves: me.moves.map((m) => `${m.id} ${m.pp}/${m.maxPp}`) },
      foe: { sp: foe.speciesId, types: foe.types, hp: foe.hp, maxHp: foe.maxHp, status: foe.status, ability: foe.ability, item: foe.item },
      bench: st.sides[0].party.filter((p, i) => i !== st.sides[0].activeIndex).map((p) => `${p.speciesId} ${p.hp}/${p.maxHp} ${p.types.join('/')}`)
    };
  });
  console.log('FIGHT PANEL TEXT:\n  ' + seen.text.split('\n').filter(Boolean).join('\n  '));
  console.log('\nTRUTH  me:', JSON.stringify(seen.me));
  console.log('TRUTH foe:', JSON.stringify(seen.foe));
  console.log('TRUTH bench:', JSON.stringify(seen.bench));
  const T = seen.text.toLowerCase();
  const checks = [
    ['move type shown on card', /(slash|fist|haki|flame|frost|sea|storm|earth|wind|shadow|light|beast|mecha|mind|toxin|sound|spirit|void)/i.test(seen.text)],
    ['PP shown on card', /\b\d+\s*\/\s*\d+\b/.test(seen.text)],
    ['base power shown', /\b(pow|bp)\b/i.test(seen.text)],
    ['effectiveness vs THIS foe', /(super\s*eff|not very|no effect|×\s*[024]|x[024]\b|2×|4×|½|resist|immune)/i.test(seen.text)],
    ['foe types shown', seen.foe.types.some((t) => T.includes(t.toLowerCase()))],
    ['foe ability shown', T.includes(String(seen.foe.ability).replace(/_/g, ' '))],
    ['what the move DOES (rider text)', /(burn|poison|para|sleep|flinch|lower|raise|heal|switch|hazard|screen|drain|recoil|priority)/i.test(seen.text)]
  ];
  console.log('\nvisible at choice time:');
  for (const [k, v] of checks) console.log(`  ${v ? 'YES' : 'NO '}  ${k}`);

  // switch panel
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(500);
  const p = await clickText('^(party|switch|team)$');
  await sleep(900);
  await shot('03-party');
  const ptxt = await page.evaluate(() => (document.querySelector('#ui') || document.body).innerText);
  console.log(`\nparty button: ${p}\nparty panel:\n  ` + ptxt.split('\n').filter(Boolean).join('\n  ').slice(0, 1400));

  // Drive to a real mid-game turn with status/hazards on the board
  await page.keyboard.press('Escape').catch(() => {});
  const mid = await page.evaluate(async () => {
    const A = window.__ARENA;
    for (let i = 0; i < 90; i++) {
      const st = A.battle.state();
      if (!st || st.ended) break;
      if (st.request && st.request[0]) {
        const me = st.sides[0].party[st.sides[0].activeIndex];
        A.battle.choose(0, { kind: 'move', moveId: me.moves[0].id, target: 'foe' });
      }
      await new Promise((r) => setTimeout(r, 80));
      const s2 = A.battle.state();
      if (s2 && s2.turn >= 7) break;
    }
    const st = A.battle.state();
    return {
      turn: st?.turn, ended: st?.ended, field: st?.field,
      hazards: st?.sides?.map((s) => s.hazards), screens: st?.sides?.map((s) => s.screens),
      mons: st?.sides?.map((s) => s.party.map((x) => `${x.speciesId}:${x.status || '-'}:${x.hp}/${x.maxHp}:b${JSON.stringify(x.boosts)}`))
    };
  });
  await sleep(1600);
  await shot('04-midgame');
  console.log('\nmid-game truth: ' + JSON.stringify(mid));
  const mtxt = await page.evaluate(() => (document.querySelector('#ui') || document.body).innerText);
  console.log('mid-game UI text:\n  ' + mtxt.split('\n').filter(Boolean).join('\n  ').slice(0, 1400));
  await clickText('^fight$');
  await sleep(900);
  await shot('05-midgame-fight');
  const mf = await page.evaluate(() => (document.querySelector('#ui') || document.body).innerText);
  console.log('\nmid-game FIGHT panel:\n  ' + mf.split('\n').filter(Boolean).join('\n  ').slice(0, 1400));
  console.log('\nconsole errors: ' + (errs.length ? errs.slice(0, 6).join(' // ') : 'none'));
  await browser.close();
}
