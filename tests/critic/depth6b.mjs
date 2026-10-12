// CRITIC — DEPTH round 6b. Why is switching worth nothing?
//   node tests/critic/depth6b.mjs pay    --pos 90 --k 40
//   node tests/critic/depth6b.mjs entry
//   node tests/critic/depth6b.mjs oracle --pos 80 --k 30

import { createBattle, submitChoices, legalMoves, legalSwitches, active } from '../../src/core/engine.js';
import { chooseAction } from '../../src/core/ai.js';
import { damageRange } from '../../src/core/damage.js';
import { RNG } from '../../src/core/rng.js';
import { getMove } from '../../src/data/moves.js';
import { allFighters, makeDefaultMember } from '../../src/data/fighters.js';
import { defaultBag } from '../../src/data/items.js';
import { typeEff } from '../../src/core/types.js';

const MODE = process.argv[2] || 'pay';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const SIZE = Number(arg('size', 3));
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const IDS = allFighters().map((f) => f.id);

function team(rng, size = SIZE) {
  const pool = IDS.slice(); const out = [];
  for (let i = 0; i < size && pool.length; i++) { const k = rng.int(pool.length); out.push(makeDefaultMember(pool[k], 50)); pool.splice(k, 1); }
  return out;
}
function mkBattle(seed, t0, t1) {
  return createBattle({ seed, arena: 'colosseum', format: { level: 50, teamSize: SIZE, bring: SIZE },
    sides: [{ name: 'A', team: t0, items: defaultBag() }, { name: 'B', team: t1, items: defaultBag() }] });
}
function fork(state, seed) { const { rng, ...rest } = state; const c = structuredClone(rest); c.rng = new RNG(seed >>> 0); return c; }
function material(state, side) {
  const m = (s) => state.sides[s].party.reduce((a, p) => a + (p.fainted ? 0 : 0.34 + p.hp / p.maxHp), 0);
  return m(side) - m(1 - side);
}
function settle(f) {
  let g = 0;
  while (!f.ended && (f.request[0] === 'switch' || f.request[1] === 'switch') && g++ < 6) {
    const fc = [null, null];
    for (let s = 0; s < 2; s++) if (f.request[s] === 'switch') fc[s] = chooseAction(f, s, 'ace');
    submitChoices(f, fc);
  }
}
/** Roll a position forward `horizon` turns with both sides on 'ace', score material. */
function rollout(state, choice0, choice1, seed, horizon) {
  const f = fork(state, seed);
  try { submitChoices(f, [choice0, choice1]); settle(f); } catch { return null; }
  let g = 0;
  while (!f.ended && g++ < horizon) {
    const ch = [null, null];
    for (let s = 0; s < 2; s++) {
      if (f.request[s] === 'switch') ch[s] = chooseAction(f, s, 'ace');
      else if (f.request[s] === 'move') ch[s] = chooseAction(f, s, 'ace');
    }
    try { submitChoices(f, ch); } catch { break; }
  }
  if (f.ended) return f.winner === 0 ? 6 : f.winner === 1 ? -6 : 0;
  return material(f, 0);
}

function positions(n, rngSeed = 909090) {
  const rng = new RNG(rngSeed);
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 6) {
    const st = mkBattle(rng.int(1e9), team(rng), team(rng));
    const depth = 1 + rng.int(8);
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
    if (!legalSwitches(st, 0).length) continue;
    out.push({ st, seed: rng.int(1e9) });
  }
  return out;
}

/* ------------------------------------------------------------- pay */
function payMode() {
  const POS = Number(arg('pos', 80)), K = Number(arg('k', 30)), H = Number(arg('horizon', 12));
  console.log(`════ WHAT IS A SWITCH WORTH? ${POS} positions × ${K} rollouts × ${H}-turn horizon ════\n`);
  const list = positions(POS);
  let bestMoveSum = 0, bestSwitchSum = 0, switchWins = 0, n = 0;
  let aiSwitched = 0;
  for (const { st, seed } of list) {
    const foeChoice = chooseAction(st, 1, 'ace');
    const score = (c) => {
      let a = 0;
      for (let r = 0; r < K; r++) { const v = rollout(st, c, foeChoice, seed + r * 7919, H); a += (v == null ? 0 : v); }
      return a / K;
    };
    let bm = -Infinity;
    for (const id of legalMoves(st, 0)) { const v = score({ kind: 'move', moveId: id, target: 'foe' }); if (v > bm) bm = v; }
    let bs = -Infinity;
    for (const i of legalSwitches(st, 0)) { const v = score({ kind: 'switch', toSlot: i }); if (v > bs) bs = v; }
    bestMoveSum += bm; bestSwitchSum += bs; if (bs > bm) switchWins++; n++;
    if (chooseAction(st, 0, 'warlord').kind === 'switch') aiSwitched++;
  }
  console.log(`  positions                                ${n}`);
  console.log(`  best move    (material, ${H} turns on)   ${(bestMoveSum / n).toFixed(3)}`);
  console.log(`  best switch                             ${(bestSwitchSum / n).toFixed(3)}`);
  console.log(`  switching is the right call in           ${pct(switchWins / n)} of positions`);
  console.log(`  the warlord actually switches in         ${pct(aiSwitched / n)} of them`);
  console.log(`  average cost of the best switch          ${((bestMoveSum - bestSwitchSum) / n).toFixed(3)} material`);
}

/* ------------------------------------------------------------- entry */
// Why switching costs what it costs: what does the bench eat on the way in?
function entryMode() {
  console.log('════ THE PRICE OF ENTRY ════\n');
  const rng = new RNG(5150);
  const roster = allFighters();
  // For every (attacker, defender) pair: best move damage as % of defender max HP
  let rows = [];
  for (const a of roster) {
    const ma = makeDefaultMember(a.id, 50);
    for (const d of roster) {
      if (d.id === a.id) continue;
      const md = makeDefaultMember(d.id, 50);
      const st = mkBattle(1, [ma], [md]);
      const me = active(st, 0), foe = active(st, 1);
      let best = 0, bestEff = 1;
      for (const id of legalMoves(st, 0)) {
        const mv = getMove(id);
        if (!mv || mv.category === 'status' || !(mv.power > 0)) continue;
        const r = damageRange({ move: mv, user: me, target: foe, field: st.field, side: st.sides[0], foeSide: st.sides[1], crit: false, rng: null });
        const v = r.avg * (mv.accuracy == null ? 1 : mv.accuracy / 100);
        if (v > best) { best = v; bestEff = r.eff; }
      }
      rows.push({ a: a.id, d: d.id, frac: best / foe.maxHp, eff: bestEff });
    }
  }
  rows.sort((x, y) => x.frac - y.frac);
  const fr = rows.map((r) => r.frac);
  const q = (p) => fr[Math.floor(p * (fr.length - 1))];
  console.log(`  best-move damage as a share of the target's HP over all ${rows.length} ordered pairs:`);
  console.log(`    p10 ${pct(q(0.1))}   p25 ${pct(q(0.25))}   median ${pct(q(0.5))}   p75 ${pct(q(0.75))}   p90 ${pct(q(0.9))}`);
  console.log(`  pairs where the attacker's best move does <=15% (a true "free switch-in"): ${pct(fr.filter((f) => f <= 0.15).length / fr.length)}`);
  console.log(`  pairs where it does >=50% (switching in is a third of a body): ${pct(fr.filter((f) => f >= 0.5).length / fr.length)}`);

  // For a random 3-body bench, what is the BEST entry cost available?
  const bench = (k) => {
    const sample = [];
    for (let i = 0; i < 4000; i++) {
      const pool = IDS.slice(); const pick = [];
      for (let j = 0; j < k; j++) { const x = rng.int(pool.length); pick.push(pool[x]); pool.splice(x, 1); }
      const atk = IDS[rng.int(IDS.length)];
      let best = 1;
      for (const p of pick) {
        if (p === atk) continue;
        const r = rows.find((z) => z.a === atk && z.d === p);
        if (r && r.frac < best) best = r.frac;
      }
      sample.push(best);
    }
    sample.sort((a, b) => a - b);
    return sample;
  };
  for (const k of [2, 3, 5]) {
    const s = bench(k);
    console.log(`  best entry cost across a ${k}-body bench: median ${pct(s[Math.floor(s.length / 2)])}, p25 ${pct(s[Math.floor(s.length * 0.25)])}`);
  }
}

/* ------------------------------------------------------------- oracle */
function oracleMode() {
  const POS = Number(arg('pos', 70)), K = Number(arg('k', 25)), H = Number(arg('horizon', 10));
  console.log(`════ THE PRICE OF A READ — ${POS} positions ════\n`);
  console.log('Two identical one-ply optimisers, same position, same dice. One is told');
  console.log("the opponent's actual choice before picking. The gap is what a read buys.\n");
  const list = positions(POS, 606060);
  let blind = 0, orac = 0, differ = 0, n = 0;
  for (const { st, seed } of list) {
    const foeChoice = chooseAction(st, 1, 'ace');
    const acts = [...legalMoves(st, 0).map((id) => ({ kind: 'move', moveId: id, target: 'foe' })),
                  ...legalSwitches(st, 0).map((i) => ({ kind: 'switch', toSlot: i }))];
    // model of the foe used by the blind player: the 'pirate' guess (a plausible
    // but imperfect read), so "blind" is not artificially stupid.
    const guess = chooseAction(st, 1, 'pirate');
    const score = (mine, theirs, off) => {
      let a = 0;
      for (let r = 0; r < K; r++) { const v = rollout(st, mine, theirs, seed + off + r * 7919, H); a += (v == null ? 0 : v); }
      return a / K;
    };
    let bBlind = acts[0], vBlind = -Infinity, bOrac = acts[0], vOrac = -Infinity;
    for (const a of acts) {
      const vb = score(a, guess, 0);
      if (vb > vBlind) { vBlind = vb; bBlind = a; }
      const vo = score(a, foeChoice, 500000);
      if (vo > vOrac) { vOrac = vo; bOrac = a; }
    }
    if (JSON.stringify(bBlind) !== JSON.stringify(bOrac)) differ++;
    blind += score(bBlind, foeChoice, 900000);
    orac += score(bOrac, foeChoice, 900000);
    n++;
  }
  console.log(`  positions                       ${n}`);
  console.log(`  the read changes the pick in    ${pct(differ / n)} of them`);
  console.log(`  blind  material ${H} turns on   ${(blind / n).toFixed(3)}`);
  console.log(`  oracle material ${H} turns on   ${(orac / n).toFixed(3)}`);
  console.log(`  a perfect read is worth         ${((orac - blind) / n).toFixed(3)} material per turn`);
}

({ pay: payMode, entry: entryMode, oracle: oracleMode }[MODE] || payMode)();
