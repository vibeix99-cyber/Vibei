// CRITIC — DEPTH 6c. Is switching load-bearing, and does team size change that?
//   node tests/critic/depth6c.mjs --games 100 --size 3
//   node tests/critic/depth6c.mjs --games 100 --size 6

import { createBattle, submitChoices, legalMoves, legalSwitches, active } from '../../src/core/engine.js';
import { chooseAction } from '../../src/core/ai.js';
import { damageRange } from '../../src/core/damage.js';
import { RNG } from '../../src/core/rng.js';
import { getMove } from '../../src/data/moves.js';
import { allFighters, makeDefaultMember } from '../../src/data/fighters.js';
import { defaultBag } from '../../src/data/items.js';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const GAMES = Number(arg('games', 100));
const SIZE = Number(arg('size', 3));
const LEVEL = arg('level', 'ace');
const MAXT = 400;
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
function bestDamaging(state, side) {
  const me = active(state, side), foe = active(state, 1 - side);
  let best = null, bs = -Infinity;
  for (const id of legalMoves(state, side)) {
    const mv = getMove(id);
    if (!mv) continue;
    let s;
    if (mv.category === 'status' || !(mv.power > 0)) s = -1;
    else {
      const r = damageRange({ move: mv, user: me, target: foe, field: state.field, side: state.sides[side], foeSide: state.sides[1 - side], crit: false, rng: null });
      s = r.avg * (mv.accuracy == null ? 1 : mv.accuracy / 100);
    }
    if (s > bs) { bs = s; best = id; }
  }
  return { kind: 'move', moveId: best || legalMoves(state, side)[0], target: 'foe' };
}
const full = (st, s) => chooseAction(st, s, LEVEL);
/** Same brain, but it may never leave the field voluntarily. */
const rooted = (st, s) => { const c = chooseAction(st, s, LEVEL); return c.kind === 'switch' ? bestDamaging(st, s) : c; };

function playOut(seed, t0, t1, p0, p1) {
  const st = mkBattle(seed, t0, t1);
  let g = 0, sw = [0, 0], turns = 0;
  while (!st.ended && g++ < MAXT) {
    const ch = [null, null];
    let counted = false;
    for (let s = 0; s < 2; s++) {
      if (st.request[s] === 'switch') ch[s] = chooseAction(st, s, LEVEL);
      else if (st.request[s] === 'move') {
        counted = true;
        ch[s] = (s === 0 ? p0 : p1)(st, s);
        if (ch[s].kind === 'switch') sw[s]++;
      }
    }
    if (counted) turns++;
    try { submitChoices(st, ch); } catch { break; }
  }
  return { st, sw, turns };
}

console.log(`════ IS SWITCHING LOAD-BEARING?  ${SIZE}v${SIZE}, ${LEVEL}, ${GAMES * 2} games ════\n`);
const rng = new RNG(112358);
let wFull = 0, wRoot = 0, dr = 0, swTurns = 0, allTurns = 0;
for (let i = 0; i < GAMES; i++) {
  const seed = rng.int(1e9), t0 = team(rng), t1 = team(rng);
  for (const flip of [0, 1]) {
    const r = playOut(seed + flip, flip ? t1 : t0, flip ? t0 : t1, flip ? rooted : full, flip ? full : rooted);
    const fullSide = flip ? 1 : 0;
    swTurns += r.sw[fullSide]; allTurns += r.turns;
    const w = r.st.winner === 'draw' ? 'd' : (r.st.winner === fullSide ? 'f' : 'r');
    if (w === 'f') wFull++; else if (w === 'r') wRoot++; else dr++;
  }
}
console.log(`  full brain vs the same brain that can never switch out`);
console.log(`  full wins   ${pct(wFull / Math.max(1, wFull + wRoot))}   (${wFull}-${wRoot}-${dr})`);
console.log(`  the full brain used its switch on ${pct(swTurns / allTurns)} of its move-request turns`);
console.log(`  → giving up switching entirely costs ${((wFull / Math.max(1, wFull + wRoot)) * 100 - 50).toFixed(1)} percentage points.`);
