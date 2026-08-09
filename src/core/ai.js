// ============================================================================
// GRAND LINE ARENA — opponent AI.  Owned by the AI agent.
//
// Pure: reads state, returns a Choice. Never touches the battle RNG, never
// mutates the battle it is given, never imports render/ui/audio.
//
// Five tiers, five genuinely different brains:
//
//   rookie   swings its favourite move. Reads raw power, not matchups.
//   pirate   plays the obvious line: best expected damage, takes the KO.
//   ace      understands the matchup: pivots, statuses, knows when it's outsped.
//   warlord  plays around your win condition: one-turn joint search plus a
//            strategic layer (hazards, screens, checks, setup denial, Protect).
//   yonko    iterative-deepening expectimax over the joint action space with
//            the RNG factored out. 2–3 turns deep, hard node/time budget.
//
// Determinism contract
// --------------------
//   * `state.rng` is NEVER read or advanced. Search clones get a synthetic
//     median RNG (`QuantileRng`) so a lookahead can never desync a networked
//     or replayed battle.
//   * Tie-breaking noise comes from `scratchRng(state, side)`, derived purely
//     from the state, so the same position always yields the same choice.
//   * The search is bounded by `maxNodes` first and wall-clock second. When
//     the node budget binds (the normal case) the decision is fully
//     deterministic; the clock is only a safety valve against a pathological
//     position on a slow machine.
//
// Public API
// ----------
//   chooseAction(state, side, levelOrOptions) -> Choice
//   chooseActionDetailed(state, side, levelOrOptions) -> { choice, ...stats }
//   AI_LEVELS, AI_PERSONALITIES, aiName, aiDescribe
// ============================================================================

import { getMove } from '../data/moves.js';
import { getFighter } from '../data/fighters.js';
import { damageRange } from './damage.js';
import { typeEff } from './types.js';
import { boostMul } from './stats.js';
import { HAZARDS, SCREENS } from './status.js';
import { runAbility } from './abilities.js';
import { runItemHook } from './items.js';
import { legalMoves, legalSwitches, active, submitChoices } from './engine.js';
import { RNG } from './rng.js';

/* ------------------------------------------------------------------ */
/* tiers                                                               */
/* ------------------------------------------------------------------ */

/**
 * `knowledge`  what the AI is allowed to see of the foe's set:
 *              'none' (types only) | 'revealed' | 'learnset' | 'full'
 * `search`     turns of lookahead. 0 = pure heuristic policy.
 */
export const AI_LEVELS = {
  rookie: {
    name: 'Rookie', desc: 'Swings its favourite move and hopes.',
    noise: 0.55, knowledge: 'none', search: 0,
    switchIQ: 0.0, statusIQ: 0.10, itemIQ: 0.0, threatIQ: 0.0,
    koBlind: 0.45, favouritism: 90, rawPower: true, strategic: false
  },
  pirate: {
    name: 'Pirate', desc: 'Picks the strongest move it can see.',
    noise: 0.22, knowledge: 'revealed', search: 0,
    switchIQ: 0.25, statusIQ: 0.45, itemIQ: 0.35, threatIQ: 0.35,
    koBlind: 0.05, favouritism: 12, rawPower: false, strategic: false
  },
  ace: {
    name: 'Ace', desc: 'Reads matchups, pivots, and knows when it is outsped.',
    noise: 0.08, knowledge: 'learnset', search: 0,
    switchIQ: 0.75, statusIQ: 0.85, itemIQ: 0.8, threatIQ: 0.85,
    koBlind: 0.0, favouritism: 0, rawPower: false, strategic: false
  },
  warlord: {
    name: 'Warlord', desc: 'Plays around your win condition.',
    noise: 0.02, knowledge: 'full', search: 1,
    switchIQ: 1.0, statusIQ: 1.0, itemIQ: 1.0, threatIQ: 1.0,
    koBlind: 0.0, favouritism: 0, rawPower: false, strategic: true
  },
  yonko: {
    name: 'Yonko', desc: 'Searches the joint action space and answers your best line.',
    noise: 0.0, knowledge: 'full', search: 3,
    switchIQ: 1.0, statusIQ: 1.0, itemIQ: 1.0, threatIQ: 1.0,
    koBlind: 0.0, favouritism: 0, rawPower: false, strategic: true
  }
};

/** Evaluation weights. Everything is denominated in "percent of one HP bar". */
const BASE_W = {
  alive: 34,          // a living body on the field is worth this much on its own
  hp: 100,            // one full HP bar
  ko: 130,            // greedy bonus for a certain kill
  duel: 1.0,          // weight of the current 1v1 read
  boostOff: 13, boostDef: 9, boostSpe: 11, boostEva: 15, boostAcc: 6,
  hazard: 10,         // per layer, per body still to come in
  screen: 8,
  status: 1.0,        // multiplier on status penalties in eval
  switchCost: 15,     // baseline tempo cost of giving up a turn
  paranoia: 0.35,     // 0 = pure expectation vs the model, 1 = pure worst case
  risk: 1.0,          // how much it fears losing the active
  utility: 1.0        // multiplier on status / hazard / screen / boost move value
};

/**
 * Personality sits *on top of* a tier. Multipliers are relative to BASE_W, so
 * omitting the option leaves behaviour bit-for-bit unchanged.
 */
export const AI_PERSONALITIES = {
  balanced:  { name: 'Balanced',  desc: 'No thumb on the scale.' },
  aggressive:{ name: 'Aggressive',desc: 'Races you. Hates giving up a turn.',
    mul: { ko: 1.30, duel: 1.15, switchCost: 1.8, utility: 0.65, risk: 0.70, hazard: 0.7 },
    set: { paranoia: 0.15 }, noise: 0.02 },
  defensive: { name: 'Defensive', desc: 'Trades chip for time and keeps bodies alive.',
    mul: { hp: 1.18, switchCost: 0.60, utility: 1.30, risk: 1.40, screen: 1.6, alive: 1.15 },
    set: { paranoia: 0.60 } },
  gimmicky:  { name: 'Gimmicky',  desc: 'Hazards, weather, status — the scenic route.',
    mul: { utility: 2.0, hazard: 1.8, screen: 1.5, ko: 0.9 }, noise: 0.06 }
};

const WIN = 1e6;
const NEUTRAL_ACC = 0.85;       // assumed accuracy of an unknown foe move

/* ------------------------------------------------------------------ */
/* RNG surrogates — the battle RNG is never touched                    */
/* ------------------------------------------------------------------ */

/** Deterministic scratch RNG for tie-break noise. Derived only from state. */
function scratchRng(state, side) {
  const h = ((state.seed >>> 0)
    ^ Math.imul(state.turn + 1, 2654435761)
    ^ Math.imul(side + 1, 40503)
    ^ Math.imul(state.events.length + 1, 2246822519)) >>> 0;
  return new RNG(h);
}

/**
 * A "median" RNG: every draw returns the same quantile. Feeding this to the
 * engine turns the simulation into its expected-case forward model — damage
 * lands on the middle roll, crits never happen, coin-flip secondaries never
 * fire — which is exactly the RNG-factored-out lookahead we want, and it costs
 * zero battle entropy.
 */
class QuantileRng {
  constructor(q = 0.5) { this.q = q; this.calls = 0; this.seed = 0; }
  next() { this.calls++; return this.q; }
  int(n) { return Math.floor(this.q * n); }
  range(lo, hi) { return lo + this.int(hi - lo + 1); }
  chance(pct) { if (pct >= 100) return true; if (pct <= 0) return false; return this.q * 100 < pct; }
  pick(a) { return a[this.int(a.length)]; }
  shuffle(a) { return a.slice(); }
  save() { return { q: this.q, calls: this.calls }; }
  load(s) { this.q = s.q; this.calls = s.calls; return this; }
  clone() { return new QuantileRng(this.q); }
}

/* ------------------------------------------------------------------ */
/* cloning — cheap, targeted, and it never copies the battle RNG       */
/* ------------------------------------------------------------------ */
// Only the fields the engine mutates are copied. `stats`, `ivs`, `evs`,
// `types`/`baseTypes` (reassigned, never mutated in place) and `format` are
// shared by reference. Events and the log are dropped: a search node never
// reads them, and dropping them is the single biggest clone saving.
// NOTE for the engine agent: if a published `cloneBattle()` ever lands, this
// should defer to it. See docs/HANDOFF.md.

function cloneMon(m) {
  const c = { ...m };
  c.boosts = { ...m.boosts };
  const mv = m.moves; const n = mv.length; const om = new Array(n);
  for (let i = 0; i < n; i++) om[i] = { ...mv[i] };
  c.moves = om;
  const v = {};
  for (const k in m.volatiles) {
    const s = m.volatiles[k];
    v[k] = { turns: s.turns, data: s.data ? { ...s.data } : {} };
  }
  c.volatiles = v;
  return c;
}

function cloneSide(s) {
  const c = { ...s };
  const p = s.party; const n = p.length; const op = new Array(n);
  for (let i = 0; i < n; i++) op[i] = cloneMon(p[i]);
  c.party = op;
  c.hazards = { ...s.hazards };
  const sc = {};
  for (const k in s.screens) sc[k] = { ...s.screens[k] };
  c.screens = sc;
  c.items = { ...s.items };
  return c;
}

function cloneState(state, rng) {
  const f = state.field;
  return {
    ...state,
    rng,
    sides: [cloneSide(state.sides[0]), cloneSide(state.sides[1])],
    field: { ...f, weather: { ...f.weather }, terrain: { ...f.terrain } },
    request: { ...state.request },
    pendingSwitch: { ...state.pendingSwitch },
    events: [], turnEvents: [], log: []
  };
}

/* ------------------------------------------------------------------ */
/* small shared primitives                                             */
/* ------------------------------------------------------------------ */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

function speedOf(state, mon) {
  if (!mon) return 0;
  let spe = mon.stats.spe;
  const stage = mon.boosts.spe || 0;
  spe = Math.floor(spe * (stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage)));
  if (mon.status === 'par') spe = Math.floor(spe * 0.5);
  if (state.sides[mon.side].screens.tailwind?.turns) spe *= 2;
  if (mon.item === 'weighted_bands') spe = Math.floor(spe * 0.5);
  try { spe = runAbility('modifySpeed', { state, mon, value: spe }) ?? spe; } catch { /* hook mid-edit */ }
  return spe;
}

/** Does `a` act before `b` this turn, given the two moves (either may be null)? */
function actsFirst(state, a, b, moveA, moveB) {
  const pa = moveA?.priority || 0;
  const pb = moveB?.priority || 0;
  if (pa !== pb) return pa > pb;
  const sa = speedOf(state, a), sb = speedOf(state, b);
  if (sa === sb) return false;
  return state.field.trickRoom > 0 ? sa < sb : sa > sb;
}

/** Expected / min / max hit count for a multi-hit move (engine's distribution). */
function hitsInfo(move) {
  if (!move.hits) return { avg: 1, min: 1, max: 1 };
  const [lo, hi] = move.hits;
  if (lo === hi) return { avg: lo, min: lo, max: lo };
  const cl = (n) => clamp(n, lo, hi);
  const avg = cl(2) * 0.35 + cl(3) * 0.35 + cl(4) * 0.15 + cl(5) * 0.15;
  return { avg, min: lo, max: hi };
}

/** Chance the roll spread alone gets there. 16 uniform buckets min..max. */
function koProb(min, max, hp) {
  if (max < hp) return 0;
  if (min >= hp) return 1;
  return clamp((max - hp + 1) / (max - min + 1), 0, 1);
}

/** Mirrors engine.applyStatus's gate list, read-only. */
function canStatus(state, mon, status) {
  if (!mon || mon.fainted || mon.status) return false;
  if (state.sides[mon.side].screens.safeguard?.turns) return false;
  const IMMUNE = { brn: ['FLAME'], frz: ['FROST'], par: ['STORM'], psn: ['TOXIN'], tox: ['TOXIN'] };
  if (IMMUNE[status]?.some((t) => mon.types.includes(t))) return false;
  try { if (runAbility('onStatusImmune', { state, mon, status }) === true) return false; } catch { /* mid-edit */ }
  return true;
}

/** Entry cost of `mon` walking into its own side's hazards. */
function hazardToll(state, side, mon) {
  const hz = state.sides[side].hazards;
  let damage = 0, status = null, speDrop = 0;
  const grounded = !mon.types.includes('WIND');
  const layers = hz.caltrops | 0;
  if (layers && grounded) {
    const frac = [0, 1 / 8, 1 / 6, 1 / 4][Math.min(3, layers)];
    damage += Math.max(1, Math.floor(mon.maxHp * frac));
  }
  if (hz.shards) {
    const e = typeEff('FROST', mon.types);
    const frac = e >= 2 ? 1 / 4 : e === 1 ? 1 / 8 : e === 0.5 ? 1 / 16 : 0;
    if (frac > 0) damage += Math.max(1, Math.floor(mon.maxHp * frac));
  }
  if (hz.barbs && grounded && !mon.status && !mon.types.includes('TOXIN')) {
    status = hz.barbs >= 2 ? 'tox' : 'psn';
  }
  if (hz.oilslick && grounded) speDrop = 1;
  return { damage, status, speDrop };
}

/** Total future cost of the hazards sitting on `side`, per body still to come. */
function hazardBurden(state, side) {
  const s = state.sides[side];
  let per = 0;
  for (const [id, layers] of Object.entries(s.hazards)) {
    if (!layers) continue;
    per += (id === 'caltrops' ? 9 * layers : id === 'barbs' ? 13 * layers : id === 'shards' ? 10 : 7);
  }
  if (!per) return 0;
  const bodies = s.party.filter((p, i) => !p.fainted && i !== s.activeIndex).length;
  return per * Math.min(bodies, 3) * 0.34;
}

/* ------------------------------------------------------------------ */
/* knowledge model — lower tiers do not get to see your whole set      */
/* ------------------------------------------------------------------ */

function revealedFor(state, uid) {
  const out = new Set();
  const ev = state.events;
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i];
    if (e.t === 'moveUsed' && e.uid === uid) out.add(e.moveId);
  }
  return out;
}

/** Move slots of `mon` that `knowledge` lets the AI reason about. */
function knownMoves(state, mon, knowledge) {
  if (!mon) return [];
  if (knowledge === 'full') return mon.moves.filter((m) => m.pp > 0 && !m.disabled);
  if (knowledge === 'none') return [];                    // a rookie reads nothing
  const seen = revealedFor(state, mon.uid);
  if (knowledge === 'learnset') {
    const f = getFighter(mon.speciesId);
    const learn = new Set((f?.learnset || []).filter((l) => l.lv <= mon.level).map((l) => l.move));
    return mon.moves.filter((m) => (seen.has(m.id) || learn.has(m.id)) && m.pp > 0 && !m.disabled);
  }
  return mon.moves.filter((m) => seen.has(m.id) && m.pp > 0 && !m.disabled);
}

/* ------------------------------------------------------------------ */
/* damage estimation                                                   */
/* ------------------------------------------------------------------ */

function applyDamageMods(state, attacker, defender, move, value) {
  let v = value;
  try { v = runAbility('modifyDamage', { state, mon: attacker, target: defender, move, value: v }) ?? v; } catch { /* mid-edit */ }
  try { v = runAbility('modifyDamageTaken', { state, mon: defender, attacker, move, value: v }) ?? v; } catch { /* mid-edit */ }
  try { v = runItemHook('modifyDamage', { state, mon: attacker, target: defender, move, value: v }) ?? v; } catch { /* mid-edit */ }
  return Math.max(1, Math.floor(v));
}

/**
 * What `moveId` actually does to `defender`, ability/item/multi-hit aware and
 * without consuming a single unit of battle entropy.
 */
function estimateMove(state, atkSide, moveId, attacker, defender) {
  const move = getMove(moveId);
  if (!move) return null;
  const out = {
    id: moveId, move, status: move.category === 'status',
    acc: move.accuracy == null ? 1 : move.accuracy / 100,
    min: 0, avg: 0, max: 0, expected: 0, ko: 0, eff: 1, immune: false
  };
  if (out.status) return out;

  const r = damageRange({
    move, user: attacker, target: defender, field: state.field,
    side: state.sides[atkSide], foeSide: state.sides[1 - atkSide],
    crit: false, rng: null
  });
  out.eff = r.eff;
  if (r.immune || r.eff === 0) { out.immune = true; return out; }

  const h = hitsInfo(move);
  const lo = applyDamageMods(state, attacker, defender, move, r.min);
  const hi = applyDamageMods(state, attacker, defender, move, r.max);
  out.min = lo * h.min;
  out.max = hi * h.max;
  out.avg = ((lo + hi) / 2) * h.avg;
  out.expected = out.avg * out.acc;
  out.ko = koProb(out.min, out.max, defender.hp) * out.acc;
  if (defender.volatiles?.substitute) out.ko = 0;   // has to break the sub first
  return out;
}

/** Best damaging option `attacker` has into `defender`, from a slot list. */
function bestThreat(state, atkSide, attacker, defender, slots) {
  const res = { expected: 0, avg: 0, min: 0, max: 0, ko: 0, acc: 1, move: null, options: [], byId: null };
  if (!attacker || !defender || attacker.fainted || defender.fainted) return res;
  if (!slots.length) {
    // Unknown set: assume a neutral, roughly average attack off its better stat.
    const off = Math.max(attacker.stats.atk, attacker.stats.spa);
    const def = attacker.stats.atk >= attacker.stats.spa ? defender.stats.def : defender.stats.spd;
    const guess = Math.max(1, Math.floor((((2 * attacker.level) / 5 + 2) * 80 * off / def) / 50 + 2));
    res.expected = guess * NEUTRAL_ACC; res.avg = guess; res.min = Math.floor(guess * 0.85);
    res.max = guess; res.ko = koProb(res.min, res.max, defender.hp) * NEUTRAL_ACC; res.acc = NEUTRAL_ACC;
    return res;
  }
  for (const s of slots) {
    const e = estimateMove(state, atkSide, s.id, attacker, defender);
    if (!e || e.status) continue;
    res.options.push(e);
    // Rank by "can it kill" first, expected damage second.
    const better = e.ko > res.ko + 0.02 || (Math.abs(e.ko - res.ko) <= 0.02 && e.expected > res.expected);
    if (better) {
      res.expected = e.expected; res.avg = e.avg; res.min = e.min;
      res.max = e.max; res.ko = e.ko; res.acc = e.acc; res.move = e;
    }
  }
  return res;
}

/** Turns for `atk` to remove `def`, given a per-turn expectation. */
function turnsToKO(hp, perTurn) {
  if (perTurn <= 0) return 99;
  return Math.max(1, Math.ceil(hp / perTurn));
}

/* ------------------------------------------------------------------ */
/* evaluation                                                          */
/* ------------------------------------------------------------------ */

const STATUS_PENALTY = { brn: 17, psn: 13, tox: 22, par: 20, slp: 24, frz: 30 };

function monValue(state, mon, W) {
  if (mon.fainted) return 0;
  let v = W.alive + W.hp * (mon.hp / mon.maxHp);
  if (mon.status) {
    let p = STATUS_PENALTY[mon.status] || 12;
    if (mon.status === 'brn' && mon.stats.atk > mon.stats.spa) p *= 1.35;
    if (mon.status === 'tox') p += 4 * Math.min(6, mon.toxicCounter || 1);
    v -= p * W.status;
  }
  return v;
}

function boostValue(mon, W) {
  if (!mon || mon.fainted) return 0;
  const b = mon.boosts;
  const off = mon.stats.atk >= mon.stats.spa ? b.atk : b.spa;
  const other = mon.stats.atk >= mon.stats.spa ? b.spa : b.atk;
  return off * W.boostOff + other * W.boostOff * 0.35
    + (b.def + b.spd) * W.boostDef + b.spe * W.boostSpe
    + b.eva * W.boostEva + b.acc * W.boostAcc;
}

function sideValue(state, side, W) {
  const s = state.sides[side];
  let v = 0;
  for (const p of s.party) v += monValue(state, p, W);
  v += boostValue(active(state, side), W);
  v -= hazardBurden(state, side) * (W.hazard / BASE_W.hazard);
  for (const [id, sc] of Object.entries(s.screens)) {
    if (!sc?.turns) continue;
    v += (SCREENS[id]?.mul ? W.screen : W.screen * 0.6) * Math.min(1, sc.turns / 3);
  }
  return v;
}

/**
 * Position value from `side`'s point of view. Team strength, status, boosts,
 * hazards, screens, speed control, and who is actually winning the 1v1.
 */
function evaluate(state, side, cfg) {
  if (state.ended) {
    return state.winner === side ? WIN : state.winner === 'draw' ? 0 : -WIN;
  }
  const W = cfg.W;
  let v = sideValue(state, side, W) - sideValue(state, 1 - side, W);

  const me = active(state, side);
  const foe = active(state, 1 - side);
  if (me && foe && !me.fainted && !foe.fainted) {
    const mine = bestThreat(state, side, me, foe, knownMoves(state, me, 'full'));
    const theirs = bestThreat(state, 1 - side, foe, me, knownMoves(state, foe, cfg.knowledge));
    const myTurns = turnsToKO(foe.hp, mine.expected);
    const theirTurns = turnsToKO(me.hp, theirs.expected);
    const fast = actsFirst(state, me, foe, mine.move?.move, theirs.move?.move);
    // I win the duel if I need no more turns than they do (and I move first on ties).
    let duel = clamp(theirTurns - myTurns, -4, 4) * 11;
    if (myTurns === theirTurns) duel += fast ? 9 : -9;
    if (myTurns <= 1) duel += 16;
    if (theirTurns <= 1) duel -= 16 * W.risk;
    v += duel * W.duel;
    if (fast) v += 6;
  }
  return v;
}

/* ------------------------------------------------------------------ */
/* utility (status / field / setup) move valuation                     */
/* ------------------------------------------------------------------ */

function protectish(move) {
  return !!move.effects?.some((e) => e.kind === 'volatile' && e.value === 'protect');
}

function utilityValue(c, move) {
  const { state, side, me, foe, W } = c;
  const s = state.sides[side], fs = state.sides[1 - side];
  let v = 0;
  const myHpFrac = me.hp / me.maxHp;
  const foeBodies = fs.party.filter((p, i) => !p.fainted && i !== fs.activeIndex).length;
  const myBodies = s.party.filter((p, i) => !p.fainted && i !== s.activeIndex).length;

  // How long is the thing in front of me going to be alive? Statusing / debuffing
  // something that dies this turn is pure waste.
  const foeTurns = turnsToKO(foe.hp, c.myThreat.expected);
  const lifeFactor = clamp((foeTurns - 0.4) / 2.6, 0.08, 1);
  // Am I going to be gone before this pays off?
  const doomed = c.foeThreat.ko > 0.55 && !c.faster;
  const foePhysical = (c.foeThreat.move?.move?.category ?? 'physical') === 'physical';
  const isProtect = protectish(move);
  let healy = false;

  for (const e of move.effects || []) {
    const chance = (e.chance ?? 100) / 100;
    const self = e.target === 'self' || e.target === 'allySide';
    switch (e.kind) {
      case 'status': {
        const tgt = self ? me : foe;
        if (!canStatus(state, tgt, e.value)) break;
        let w = { par: 46, brn: 44, tox: 52, slp: 62, psn: 30, frz: 55 }[e.value] || 22;
        if (e.value === 'par' && !c.faster) w *= 1.55;
        if (e.value === 'par' && c.faster) w *= 0.55;
        if (e.value === 'brn') w *= foePhysical ? 1.4 : 0.5;
        if (e.value === 'tox') w *= foeTurns >= 4 ? 1.35 : 0.7;
        v += w * chance * lifeFactor * (self ? -1 : 1);
        break;
      }
      case 'cure':
        if ((self ? me : foe).status) v += self ? 34 : -34;
        break;
      case 'boost': {
        // `g` is always expressed in *my* favour: positive = good for me.
        // A stage change on myself is good when it is positive; the same change
        // on the foe is good when it is negative.
        const tgt = self ? me : foe;
        const mine = self ? 1 : -1;
        for (const [k, d] of Object.entries(e.stats || {})) {
          const cur = tgt.boosts[k] || 0;
          const nxt = clamp(cur + d, -6, 6);
          if (nxt === cur) continue;
          const rel = boostMul(nxt) / boostMul(cur) - 1;      // + when the stage rises
          let g = 0;
          if (k === 'atk' || k === 'spa') {
            const cat = k === 'atk' ? 'physical' : 'special';
            const used = self ? c.myThreat.move?.move?.category : c.foeThreat.move?.move?.category;
            const fallback = (self ? me : foe).stats.atk >= (self ? me : foe).stats.spa ? 'physical' : 'special';
            const relevance = (used || fallback) === cat ? 1 : 0.22;
            const bar = self ? c.myThreat.expected / Math.max(1, foe.maxHp)
              : c.foeThreat.expected / Math.max(1, me.maxHp);
            g = rel * relevance * bar * 100 * 2.1 * mine;
          } else if (k === 'def' || k === 'spd') {
            const cat = k === 'def' ? 'physical' : 'special';
            const incoming = self ? c.foeThreat.move?.move?.category : c.myThreat.move?.move?.category;
            const relevance = (incoming || 'physical') === cat ? 1 : 0.25;
            // Damage scales ~1/def, so a `rel` rise cuts damage by rel/(1+rel).
            const cut = rel / (1 + rel);
            const bar = self ? c.foeThreat.expected / Math.max(1, me.maxHp)
              : c.myThreat.expected / Math.max(1, foe.maxHp);
            g = cut * relevance * bar * 100 * 2.1 * mine;
          } else if (k === 'spe') {
            const flips = !c.faster && (self ? d > 0 : d < 0);
            g = (flips ? 30 : 9) * d * mine;
          } else {
            g = (k === 'eva' ? 16 : 7) * d * mine;
          }
          v += g * chance * (self ? 1 : lifeFactor);
        }
        break;
      }
      case 'heal': {
        healy = true;
        const tgt = self ? me : foe;
        const healed = Math.min(tgt.maxHp - tgt.hp, Math.floor(tgt.maxHp * (e.frac ?? 0.5)));
        let g = (healed / tgt.maxHp) * 100 * 1.05;
        // Healing into a guaranteed KO is a wasted turn.
        if (doomed && healed + me.hp <= c.foeThreat.max) g *= 0.15;
        if (tgt.hp / tgt.maxHp > 0.72) g *= 0.25;
        v += g * chance;
        break;
      }
      case 'volatile': {
        const tgt = self ? me : foe;
        if (e.value === 'protect') {
          healy = true;
          // Protect never fails in this engine, so the AI self-limits: spamming it
          // would stall the battle out and is not a line we want to play.
          if (protectish(getMove(me.lastMoveId) || {})) { v -= 100; break; }
          let g = 8;
          if (foe.status === 'tox' || foe.status === 'psn' || foe.status === 'brn') g += 22;
          if (me.item === 'leftovers') g += 12;
          if (foe.volatiles?.charging) g += 26;
          if (c.foeThreat.ko > 0.6) g += 14 * W.risk;
          if (c.myThreat.ko > 0.8) g -= 25;      // just take the kill
          v += g;
        } else if (e.value === 'confusion') {
          if (!tgt.volatiles?.confusion) v += 26 * chance * lifeFactor * (self ? -1 : 1);
        } else if (e.value === 'substitute') {
          if (me.volatiles?.substitute) break;
          v += (myHpFrac > 0.6 ? 20 : -20) - (c.foeThreat.avg > me.maxHp / 4 ? 14 : 0);
        } else if (e.value === 'focusenergy') {
          v += me.volatiles?.focusenergy ? -20 : 14;
        } else if (e.value === 'flinch') {
          v += 18 * chance * (c.faster ? 1 : 0.15);
        } else if (e.value === 'leechseed') {
          v += tgt.volatiles?.leechseed ? -20 : 26 * lifeFactor;
        } else if (e.value === 'endure') {
          v += c.foeThreat.ko > 0.7 ? 12 : -8;
        } else {
          v += 8 * chance;
        }
        break;
      }
      case 'screen': {
        const tgtSide = e.target === 'foeSide' ? fs : s;
        if (tgtSide.screens[e.value]?.turns) { v -= 40; break; }
        let g = 26;
        const def = SCREENS[e.value];
        if (def?.category && def.category === (c.foeThreat.move?.move?.category)) g += 12;
        if (def?.category === 'both') g += 14;
        g *= 0.7 + 0.3 * Math.min(2, myBodies);
        if (doomed) g *= 0.3;
        v += g;
        break;
      }
      case 'hazard': {
        const tgtSide = e.target === 'allySide' ? s : fs;
        const max = HAZARDS[e.value]?.maxLayers ?? 1;
        if ((tgtSide.hazards[e.value] || 0) >= max) { v -= 45; break; }
        if (foeBodies <= 0) { v -= 25; break; }   // nothing left to punish
        v += (16 + 13 * foeBodies) * (state.turn <= 4 ? 1.15 : 0.85);
        break;
      }
      case 'weather': {
        if (state.field.weather.id === e.value) { v -= 35; break; }
        let g = 6;
        for (const m of c.myMoves) {
          const mv = getMove(m.id); if (!mv || mv.category === 'status') continue;
          if (e.value === 'rain' && mv.type === 'SEA') g += 16;
          if (e.value === 'sun' && mv.type === 'FLAME') g += 16;
        }
        const chipMe = { sandstorm: ['EARTH', 'MECHA', 'BEAST'], hail: ['FROST'] }[e.value];
        if (chipMe) {
          if (!chipMe.some((t) => me.types.includes(t))) g -= 12;
          if (!chipMe.some((t) => foe.types.includes(t))) g += 12;
        }
        v += g;
        break;
      }
      case 'terrain': {
        if (state.field.terrain.id === e.value) { v -= 30; break; }
        let g = 4;
        for (const m of c.myMoves) {
          const mv = getMove(m.id); if (!mv) continue;
          if (mv.type && e.value && mv.category !== 'status' && mv.type === ({ blade: 'SLASH', ember: 'FLAME', psychic: 'MIND', haki: 'HAKI' }[e.value])) g += 15;
        }
        v += g;
        break;
      }
      case 'clearHazards':
        v += hazardBurden(state, side) * 1.6;
        break;
      case 'trickRoom':
        v += c.faster ? -26 : 26;
        break;
      default:
        v += 6;
        break;
    }
  }

  if (!move.effects || !move.effects.length) v -= 30;   // a status move that does nothing
  // Global sanity: don't fiddle while you're being knocked out, and don't fiddle
  // with something that is already dead on its feet.
  if (doomed && !healy) v *= 0.22;
  if (c.myThreat.ko > 0.9 && !healy) v *= 0.30;
  if (move.accuracy != null) v *= move.accuracy / 100;
  return v * W.utility;
}

/* ------------------------------------------------------------------ */
/* the heuristic policy (rookie → warlord's strategic layer)           */
/* ------------------------------------------------------------------ */

function makeCtx(state, side, cfg) {
  const me = active(state, side);
  const foe = active(state, 1 - side);
  const myIds = legalMoves(state, side);
  const myMoves = myIds.map((id) => ({ id, pp: 1, disabled: false }));
  const foeMoves = knownMoves(state, foe, cfg.knowledge);
  const myThreat = bestThreat(state, side, me, foe, myMoves);
  const foeThreat = bestThreat(state, 1 - side, foe, me, foeMoves);
  const faster = actsFirst(state, me, foe, myThreat.move?.move, foeThreat.move?.move);
  return {
    state, side, me, foe, myMoves, foeMoves, myThreat, foeThreat, faster,
    W: cfg.W, cfg, level: cfg.level
  };
}

/** The move a rookie will not shut up about. */
function favouriteMoveId(state, side, ids) {
  const me = active(state, side);
  const sig = getFighter(me.speciesId)?.signature;
  if (sig && ids.includes(sig)) return sig;
  let best = ids[0], bp = -1;
  for (const id of ids) {
    const m = getMove(id);
    const p = (m?.power || 0) + (m?.category === 'status' ? -10 : 0);
    if (p > bp) { bp = p; best = id; }
  }
  return best;
}

/** Score every legal move for `side`. Returns [{id, score, est}] unsorted. */
function scoreMoves(c) {
  const { state, side, me, foe, cfg, W } = c;
  const out = [];
  const fav = cfg.favouritism > 0 ? favouriteMoveId(state, side, c.myMoves.map((m) => m.id)) : null;

  for (const slot of c.myMoves) {
    const est = estimateMove(state, side, slot.id, me, foe);
    if (!est) continue;
    const mv = est.move;
    let score;

    if (est.status) {
      score = cfg.statusIQ <= 0.15
        ? -20 + (mv.target === 'self' ? 14 : 0)     // a rookie basically ignores these
        : utilityValue(c, mv) * (0.45 + 0.55 * cfg.statusIQ);
    } else if (cfg.rawPower) {
      // Rookie reads the number on the card, not the matchup.
      const eff = est.immune ? 0.30 : 1;
      score = (mv.power || 0) * eff * (mv.hits ? hitsInfo(mv).avg : 1) * 0.8;
      if (est.ko >= 1) score += W.ko * (1 - cfg.koBlind);
    } else {
      score = (est.expected / Math.max(1, foe.maxHp)) * 100;
      if (est.immune) score = -25;
      const koNow = est.ko * (1 - cfg.koBlind);
      score += koNow * W.ko;
      // A kill you land first is worth far more than a kill you land second.
      if (koNow > 0.5) {
        const first = actsFirst(state, me, foe, mv, c.foeThreat.move?.move);
        score += first ? 34 : (c.foeThreat.ko > 0.6 ? -22 * W.risk : 8);
      }
      if (mv.priority > 0 && c.foeThreat.ko > 0.5 && est.ko > 0.35) score += 55;
      if (mv.recoil) {
        const rec = est.avg * mv.recoil;
        score -= (rec / me.maxHp) * 100 * 1.1;
        if (rec >= me.hp) score -= 90;            // do not KO yourself
      }
      if (mv.drain) score += (est.avg * mv.drain / me.maxHp) * 100 * 0.55;
      if (mv.flags?.includes('recharge')) score -= est.ko > 0.85 ? 6 : 26;
      if (mv.flags?.includes('charge')) score -= 34;
      // Secondary effects riding on a damaging move are a bonus, not the point.
      if (mv.effects?.length && cfg.statusIQ > 0.3) score += utilityValue(c, mv) * 0.22;
      // Overkill is waste when something bulkier is behind it.
      if (est.avg > foe.hp * 2.2 && est.ko >= 1) score -= 4;
    }

    if (fav && slot.id === fav) score += cfg.favouritism;
    out.push({ kind: 'move', id: slot.id, score, est });
  }
  return out;
}

/**
 * Value of bringing party member `idx` in *right now*: hazards on entry, the
 * free turn the foe gets, the risk of losing the body, then the matchup.
 */
function switchValue(c, idx, cfg, deep = false) {
  const { state, side, foe, W } = c;
  const s = state.sides[side];
  const inc = s.party[idx];
  if (!inc || inc.fainted) return -Infinity;

  const toll = hazardToll(state, side, inc);
  const hpAfterHazard = inc.hp - toll.damage;
  if (hpAfterHazard <= 0) return -Infinity;       // walking straight into a hazard KO

  // The foe gets a free hit on the way in.
  const foeInto = bestThreat(state, 1 - side, foe, { ...inc, hp: hpAfterHazard }, c.foeMoves);
  const freeHit = foeInto.expected;
  const hpAfter = Math.max(0, hpAfterHazard - freeHit);
  const diesOnEntry = foeInto.max >= hpAfterHazard ? foeInto.ko : 0;

  // Post-entry matchup: how does this body actually fare?
  const ghost = { ...inc, hp: Math.max(1, hpAfter), boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }, volatiles: {} };
  const back = bestThreat(state, side, ghost, foe, inc.moves.filter((m) => m.pp > 0 && !m.disabled));
  const myTurns = turnsToKO(foe.hp, back.expected);
  const theirTurns = turnsToKO(Math.max(1, hpAfter), foeInto.expected);
  const incFaster = actsFirst(state, ghost, foe, back.move?.move, foeInto.move?.move);

  let v = 0;
  v += clamp(theirTurns - myTurns, -4, 4) * 13;
  if (myTurns === theirTurns) v += incFaster ? 10 : -10;
  v -= (toll.damage / inc.maxHp) * 100 * 1.15;
  if (toll.status) v -= 18;
  if (toll.speDrop) v -= 8;
  v -= (Math.min(freeHit, hpAfterHazard) / inc.maxHp) * 100 * 0.85;
  v -= diesOnEntry * 95 * W.risk;
  v -= W.switchCost;
  v += (inc.hp / inc.maxHp) * 16;
  if (inc.status) v -= (STATUS_PENALTY[inc.status] || 12) * 0.5;

  // Resist check: does it actually wall the foe's best?
  if (foeInto.move) {
    const e = typeEff(foeInto.move.move.type, inc.types);
    if (e <= 0.25) v += 26; else if (e <= 0.5) v += 15; else if (e >= 4) v -= 34; else if (e >= 2) v -= 16;
  }
  // Offensive check: does it threaten back?
  if (back.move && back.move.eff >= 2) v += 14;

  // Warlord+: do not burn the only body that answers a foe we haven't seen yet.
  // O(party²) in threat estimates, so it only runs at the root, never in the tree.
  if (cfg.strategic && deep) v -= reservedCheckPenalty(c, idx) * (diesOnEntry > 0.4 ? 1 : 0.45);
  return v;
}

/** How badly do we need party member `idx` kept alive for a later foe? */
function reservedCheckPenalty(c, idx) {
  const { state, side } = c;
  const s = state.sides[side], fs = state.sides[1 - side];
  const inc = s.party[idx];
  let penalty = 0;
  for (let j = 0; j < fs.party.length; j++) {
    const threat = fs.party[j];
    if (threat.fainted || j === fs.activeIndex) continue;
    let bestOther = -Infinity, mineHere = -Infinity;
    for (let k = 0; k < s.party.length; k++) {
      const mon = s.party[k];
      if (mon.fainted) continue;
      const a = bestThreat(state, side, mon, threat, mon.moves.filter((m) => m.pp > 0));
      const b = bestThreat(state, 1 - side, threat, mon, threat.moves);
      const score = turnsToKO(mon.hp, b.expected) * 10 - turnsToKO(threat.hp, a.expected) * 10;
      if (k === idx) mineHere = score; else bestOther = Math.max(bestOther, score);
    }
    if (mineHere > bestOther + 8) penalty += 16;   // idx is the unique answer to `threat`
  }
  return penalty;
}

/* ------------------------------------------------------------------ */
/* bag                                                                 */
/* ------------------------------------------------------------------ */

const HEAL_AMOUNT = { potion: 40, hyper_potion: 120 };

/**
 * Bag lines, scored on the same scale as moves so the ordinary comparison (or
 * the search) decides. Items cost a whole turn, so the bar is high.
 */
function bagOptions(c, cfg) {
  const out = [];
  if (cfg.itemIQ <= 0) return out;
  const { state, side, me } = c;
  const s = state.sides[side];
  const bag = s.items || {};
  const hpFrac = me.hp / me.maxHp;
  const missing = me.maxHp - me.hp;
  const incoming = c.foeThreat.max;
  const iq = cfg.itemIQ;
  const tempo = cfg.W.switchCost;               // a turn spent is a turn spent

  // Reviving is only right when it buys a whole extra body for free.
  if (iq >= 0.9 && (bag.revive | 0) > 0) {
    const fainted = s.party.findIndex((p) => p.fainted);
    const aliveOthers = s.party.filter((p, i) => !p.fainted && i !== s.activeIndex).length;
    if (fainted >= 0 && aliveOthers === 0 && hpFrac > 0.7 && incoming < me.hp * 0.55) {
      out.push({ kind: 'item', itemId: 'revive', targetSlot: fainted, score: 70 });
    }
  }

  for (const id of ['hyper_potion', 'potion']) {
    if (!(bag[id] > 0)) continue;
    const amount = Math.min(HEAL_AMOUNT[id], missing);
    if (amount < HEAL_AMOUNT[id] * 0.55) continue;              // don't waste the item
    const threshold = iq >= 0.7 ? 0.45 : 0.22;
    if (hpFrac > threshold) continue;
    if (iq >= 0.7) {
      if (me.hp + amount <= incoming) continue;                 // heals straight into a KO
      if (c.myThreat.ko > 0.85 && c.faster) continue;           // just take the kill instead
    }
    out.push({
      kind: 'item', itemId: id, targetSlot: s.activeIndex,
      score: (amount / me.maxHp) * 100 * 1.05 - tempo + (c.foeThreat.ko > 0.5 ? -18 : 10)
    });
    break;
  }

  if (iq >= 0.7 && (bag.full_heal | 0) > 0 && me.status) {
    const bad = me.status === 'par' || me.status === 'slp' || me.status === 'frz'
      || (me.status === 'tox' && (me.toxicCounter || 1) >= 3)
      || (me.status === 'brn' && me.stats.atk > me.stats.spa);
    if (bad && hpFrac > 0.35 && c.foeThreat.ko < 0.5) {
      out.push({
        kind: 'item', itemId: 'full_heal', targetSlot: s.activeIndex,
        score: (STATUS_PENALTY[me.status] || 12) * 1.2 - tempo
      });
    }
  }

  if (iq >= 0.8 && hpFrac > 0.72 && c.foeThreat.ko < 0.2 && c.myThreat.ko < 0.5) {
    if ((bag.x_speed | 0) > 0 && !c.faster && (me.boosts.spe | 0) === 0) {
      out.push({ kind: 'item', itemId: 'x_speed', targetSlot: s.activeIndex, score: 40 - tempo });
    } else if ((bag.x_attack | 0) > 0 && (me.boosts.atk | 0) === 0 && me.stats.atk > me.stats.spa && c.faster) {
      out.push({ kind: 'item', itemId: 'x_attack', targetSlot: s.activeIndex, score: 34 - tempo });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* strategic layer (warlord+)                                          */
/* ------------------------------------------------------------------ */

/** Rough odds the foe hides behind Protect this turn. */
function protectRisk(c) {
  const { state, side, foe } = c;
  const hasProtect = foe.moves.some((m) => m.pp > 0 && protectish(getMove(m.id) || {}));
  if (!hasProtect) return 0;
  if (protectish(getMove(foe.lastMoveId) || {})) return 0.06;   // rarely twice running
  let p = 0.14;
  if (c.myThreat.ko > 0.7) p += 0.22;             // it knows it's dead otherwise
  if (foe.hp / foe.maxHp < 0.3) p += 0.10;
  return Math.min(0.5, p);
}

/** Adjust scored options for things only a warlord thinks about. */
function strategicPass(c, options, cfg) {
  const { state, side, me, foe } = c;
  const s = state.sides[side], fs = state.sides[1 - side];
  const pRisk = protectRisk(c);
  const foeSetup = Math.max(foe.boosts.atk | 0, foe.boosts.spa | 0);
  const myBodies = s.party.filter((p, i) => !p.fainted && i !== s.activeIndex).length;

  for (const o of options) {
    if (o.kind === 'move') {
      const mv = getMove(o.id);
      if (!mv) continue;
      const blockable = mv.target !== 'self' && mv.target !== 'field' && mv.target !== 'allySide';
      if (blockable && pRisk > 0) {
        // A blocked turn costs roughly the whole value of the move.
        o.score -= pRisk * Math.max(0, o.score) * 0.9;
        if (mv.flags?.includes('recharge') || mv.flags?.includes('charge')) o.score -= pRisk * 60;
      } else if (!blockable && pRisk > 0.15) {
        o.score += pRisk * 22;                    // free turn to set up / set hazards
      }
      // The foe is snowballing. Answer it or leave.
      if (foeSetup >= 2) {
        if (o.est && o.est.ko > 0.6) o.score += 30;
        else if (mv.category === 'status'
          && mv.effects?.some((e) => e.kind === 'status' || (e.kind === 'boost' && e.target === 'foe'))) o.score += 18;
        else if (mv.category !== 'status' && (o.est?.expected || 0) < foe.hp * 0.3) o.score -= 22;
      }
      // Hazards are only worth a turn while there are bodies left to walk into them.
      if (mv.effects?.some((e) => e.kind === 'hazard')) {
        const foeBodies = fs.party.filter((p, i) => !p.fainted && i !== fs.activeIndex).length;
        if (foeBodies === 0) o.score -= 60;
      }
    } else if (o.kind === 'switch') {
      // Don't pivot when it hands the foe a free setup turn it can convert.
      if (foeSetup >= 2 && myBodies > 0) o.score -= 12;
      if (pRisk > 0.25) o.score += 10;            // pivoting is free against a Protect
    }
  }
  return options;
}

/* ------------------------------------------------------------------ */
/* option generation                                                   */
/* ------------------------------------------------------------------ */

function allOptions(c, cfg, rng) {
  const { state, side } = c;
  let options = scoreMoves(c);

  if (cfg.switchIQ > 0) {
    for (const i of legalSwitches(state, side)) {
      const v = switchValue(c, i, cfg, true);
      if (v === -Infinity) continue;
      // Switching competes against the best thing staying in can do.
      options.push({ kind: 'switch', toSlot: i, score: v * cfg.switchIQ + (1 - cfg.switchIQ) * -40 });
    }
  }
  for (const it of bagOptions(c, cfg)) options.push(it);
  if (cfg.strategic) options = strategicPass(c, options, cfg);

  if (cfg.noise > 0 && rng) {
    for (const o of options) o.score += (rng.next() - 0.5) * cfg.noise * 140;
  }
  options.sort((a, b) => b.score - a.score);
  return options;
}

function toChoice(o) {
  if (o.kind === 'switch') return { kind: 'switch', toSlot: o.toSlot };
  if (o.kind === 'item') return { kind: 'item', itemId: o.itemId, targetSlot: o.targetSlot };
  return { kind: 'move', moveId: o.id, target: 'foe' };
}

/* ------------------------------------------------------------------ */
/* forced switch (something fainted)                                   */
/* ------------------------------------------------------------------ */

function chooseForcedSwitch(state, side, cfg, rng) {
  const opts = legalSwitches(state, side);
  if (!opts.length) return { kind: 'move', moveId: legalMoves(state, side)[0] };
  const foe = active(state, 1 - side);
  const c = {
    state, side, me: state.sides[side].party[state.sides[side].activeIndex], foe,
    myMoves: [], foeMoves: knownMoves(state, foe, cfg.knowledge),
    myThreat: { expected: 0, ko: 0, max: 0, min: 0, avg: 0, move: null },
    foeThreat: bestThreat(state, 1 - side, foe, state.sides[side].party[opts[0]], knownMoves(state, foe, cfg.knowledge)),
    faster: false, W: cfg.W, cfg
  };
  let best = opts[0], bestScore = -Infinity;
  for (const i of opts) {
    // A forced switch pays no tempo cost — the turn is already gone.
    let v = switchValue(c, i, cfg, !!rng) + cfg.W.switchCost;
    if (cfg.switchIQ < 0.5) {
      // Low tiers just send out whatever is healthiest and next in line.
      const p = state.sides[side].party[i];
      v = (p.hp / p.maxHp) * 60 - i * 2;
    }
    if (rng && cfg.noise > 0) v += (rng.next() - 0.35) * cfg.noise * 90;
    if (v > bestScore) { bestScore = v; best = i; }
  }
  return { kind: 'switch', toSlot: best };
}

/* ------------------------------------------------------------------ */
/* search (warlord: 1 turn, yonko: iterative deepening 2–3 turns)      */
/* ------------------------------------------------------------------ */

function makeSearchCtx(state, side, cfg, opts) {
  const clock = opts.now || defaultClock();
  return {
    root: side, cfg, nodes: 0, evals: 0,
    maxNodes: cfg.maxNodes, deadline: clock ? clock() + cfg.budgetMs : Infinity,
    clock, checkIn: 0, aborted: false,
    rng: new QuantileRng(0.5),
    depthReached: 0
  };
}

let _clock = undefined;
function defaultClock() {
  // Time is only ever used as a safety valve on the search; it never touches
  // the battle. `performance.now` exists in both the browser and node.
  if (_clock !== undefined) return _clock;
  const p = globalThis.performance;
  _clock = (p && typeof p.now === 'function') ? () => p.now() : null;
  return _clock;
}

function outOfBudget(sc) {
  if (sc.aborted) return true;
  if (sc.nodes >= sc.maxNodes) { sc.aborted = true; return true; }
  if (sc.clock && (++sc.checkIn & 31) === 0 && sc.clock() > sc.deadline) { sc.aborted = true; return true; }
  return false;
}

/** Simulate one joint turn on a clone. Never touches `state`, never the real RNG. */
function simulate(state, choices, sc) {
  const c = cloneState(state, sc.rng);
  sc.nodes++;
  try {
    submitChoices(c, choices);
    // Resolve any forced switches so every search node sits on a move request.
    let guard = 0;
    while (!c.ended && (c.request[0] === 'switch' || c.request[1] === 'switch') && guard++ < 6) {
      const fc = [null, null];
      for (let i = 0; i < 2; i++) {
        if (c.request[i] !== 'switch') continue;
        fc[i] = chooseForcedSwitch(c, i, sc.cfg, null);
      }
      submitChoices(c, fc);
    }
  } catch { return null; }
  return c;
}

/** Candidate actions for `side` inside the tree, capped at `width`. */
function candidates(state, side, sc, width, includeSwitches) {
  const cfg = sc.cfg;
  const c = makeCtx(state, side, cfg);
  let opts = scoreMoves(c);
  if (includeSwitches && cfg.switchIQ > 0) {
    const sw = legalSwitches(state, side)
      .map((i) => ({ kind: 'switch', toSlot: i, score: switchValue(c, i, cfg, false) }))
      .filter((o) => o.score > -Infinity)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    opts = opts.concat(sw);
  }
  if (cfg.strategic) opts = strategicPass(c, opts, cfg);
  opts.sort((a, b) => b.score - a.score);
  return opts.slice(0, width);
}

/** Softmax over heuristic scores — the opponent model used inside the tree. */
function modelWeights(options, temperature) {
  const n = options.length;
  if (n === 1) return [1];
  let top = -Infinity;
  for (const o of options) if (o.score > top) top = o.score;
  const w = new Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const e = Math.exp((options[i].score - top) / temperature);
    w[i] = e; sum += e;
  }
  for (let i = 0; i < n; i++) w[i] /= sum;
  return w;
}

/**
 * Value of a joint node, from the root player's point of view. Both sides pick
 * simultaneously, so at every node we take the best row of a payoff matrix,
 * scoring each row as a blend of "what the model says they'll do" and "the
 * worst they could do". Depth counts whole turns.
 */
function nodeValue(state, depth, sc) {
  if (state.ended) return state.winner === sc.root ? WIN - state.turn : state.winner === 'draw' ? 0 : -WIN + state.turn;
  if (depth <= 0 || outOfBudget(sc)) { sc.evals++; return evaluate(state, sc.root, sc.cfg); }

  const me = sc.root, foe = 1 - sc.root;
  const myOpts = candidates(state, me, sc, sc.cfg.innerWidth, depth >= 2);
  const foeOpts = candidates(state, foe, sc, sc.cfg.foeWidth, false);
  if (!myOpts.length) { sc.evals++; return evaluate(state, sc.root, sc.cfg); }
  if (!foeOpts.length) foeOpts.push({ kind: 'move', id: legalMoves(state, foe)[0], score: 0 });

  const w = modelWeights(foeOpts, sc.cfg.temperature);
  const paranoia = sc.cfg.W.paranoia;
  let best = -Infinity;

  for (let i = 0; i < myOpts.length; i++) {
    let exp = 0, worst = Infinity;
    for (let j = 0; j < foeOpts.length; j++) {
      const ch = [null, null];
      ch[me] = toChoice(myOpts[i]);
      ch[foe] = toChoice(foeOpts[j]);
      const next = simulate(state, ch, sc);
      const v = next ? nodeValue(next, depth - 1, sc) : -WIN;
      exp += w[j] * v;
      if (v < worst) worst = v;
      if (sc.aborted) break;
    }
    const row = (1 - paranoia) * exp + paranoia * worst;
    if (row > best) best = row;
    if (sc.aborted) break;
  }
  return best === -Infinity ? evaluate(state, sc.root, sc.cfg) : best;
}

function searchRoot(state, side, cfg, opts) {
  const sc = makeSearchCtx(state, side, cfg, opts);
  const c = makeCtx(state, side, cfg);
  const rng = scratchRng(state, side);
  let rootOpts = allOptions(c, cfg, cfg.noise > 0 ? rng : null);
  // Prune obviously dominated actions before spending nodes on them.
  rootOpts = rootOpts.slice(0, cfg.rootWidth);
  if (rootOpts.length <= 1) {
    return { choice: rootOpts.length ? toChoice(rootOpts[0]) : { kind: 'move', moveId: legalMoves(state, side)[0] },
      value: 0, nodes: 0, depth: 0 };
  }

  const foeOpts = candidates(state, 1 - side, sc, cfg.foeWidth, false);
  if (!foeOpts.length) foeOpts.push({ kind: 'move', id: legalMoves(state, 1 - side)[0], score: 0 });
  const w = modelWeights(foeOpts, cfg.temperature);
  const paranoia = cfg.W.paranoia;

  let bestChoice = toChoice(rootOpts[0]);
  let bestValue = -Infinity;
  let reached = 0;

  for (let depth = 1; depth <= cfg.search; depth++) {
    const scored = [];
    let localBest = -Infinity, localChoice = null;
    let bailed = false;
    for (let i = 0; i < rootOpts.length; i++) {
      let exp = 0, worst = Infinity;
      for (let j = 0; j < foeOpts.length; j++) {
        const ch = [null, null];
        ch[side] = toChoice(rootOpts[i]);
        ch[1 - side] = toChoice(foeOpts[j]);
        const next = simulate(state, ch, sc);
        const v = next ? nodeValue(next, depth - 1, sc) : -WIN;
        exp += w[j] * v;
        if (v < worst) worst = v;
        if (sc.aborted) break;
      }
      const row = (1 - paranoia) * exp + paranoia * worst
        + rootOpts[i].score * cfg.heurBlend;      // keep a whiff of the heuristic
      scored.push({ i, row });
      if (row > localBest) { localBest = row; localChoice = toChoice(rootOpts[i]); }
      if (sc.aborted) { bailed = true; break; }
    }
    if (localChoice && (!bailed || depth === 1)) {
      bestChoice = localChoice; bestValue = localBest; reached = depth;
      // Order the next iteration best-first so the cutoffs bite.
      scored.sort((a, b) => b.row - a.row);
      rootOpts = scored.map((s) => rootOpts[s.i]);
    }
    if (sc.aborted) break;
  }

  return { choice: bestChoice, value: bestValue, nodes: sc.nodes, evals: sc.evals, depth: reached, aborted: sc.aborted };
}

/* ------------------------------------------------------------------ */
/* configuration                                                       */
/* ------------------------------------------------------------------ */

function resolveConfig(levelOrOpts) {
  const o = typeof levelOrOpts === 'string' || levelOrOpts == null
    ? { level: levelOrOpts || 'ace' } : { ...levelOrOpts };
  const level = AI_LEVELS[o.level] ? o.level : 'ace';
  const tier = AI_LEVELS[level];

  const W = { ...BASE_W };
  const pid = o.personality && AI_PERSONALITIES[o.personality] ? o.personality : null;
  const p = pid ? AI_PERSONALITIES[pid] : null;
  let noise = tier.noise;
  if (p) {
    for (const [k, m] of Object.entries(p.mul || {})) if (W[k] !== undefined) W[k] *= m;
    for (const [k, v] of Object.entries(p.set || {})) W[k] = v;
    noise += p.noise || 0;
  }
  if (o.weights) Object.assign(W, o.weights);

  return {
    level, personality: pid, tier, W,
    name: tier.name,
    noise: o.noise !== undefined ? o.noise : noise,
    knowledge: o.knowledge || tier.knowledge,
    switchIQ: tier.switchIQ, statusIQ: tier.statusIQ, itemIQ: tier.itemIQ,
    threatIQ: tier.threatIQ, koBlind: tier.koBlind, favouritism: tier.favouritism,
    rawPower: tier.rawPower, strategic: tier.strategic,
    search: o.depth !== undefined ? o.depth : tier.search,
    budgetMs: o.budgetMs !== undefined ? o.budgetMs : (level === 'yonko' ? 140 : 40),
    maxNodes: o.maxNodes !== undefined ? o.maxNodes : (level === 'yonko' ? 2600 : 420),
    rootWidth: o.rootWidth || (level === 'yonko' ? 6 : 5),
    innerWidth: o.innerWidth || (level === 'yonko' ? 3 : 2),
    foeWidth: o.foeWidth || (level === 'yonko' ? 3 : 2),
    temperature: o.temperature || 26,
    heurBlend: o.heurBlend !== undefined ? o.heurBlend : 0.02
  };
}

/* ------------------------------------------------------------------ */
/* entry points                                                        */
/* ------------------------------------------------------------------ */

/**
 * @param {object} state   live battle state (never mutated, RNG never touched)
 * @param {number} side    0 | 1
 * @param {string|object} levelOrOpts
 *        'yonko'  — or  { level, personality, budgetMs, maxNodes, depth, now }
 * @returns {{choice:object, level:string, personality:?string, nodes:number,
 *            depth:number, ms:number}}
 */
export function chooseActionDetailed(state, side, levelOrOpts = 'ace') {
  const cfg = resolveConfig(levelOrOpts);
  const opts = (typeof levelOrOpts === 'object' && levelOrOpts) || {};
  const clock = opts.now || defaultClock();
  const t0 = clock ? clock() : 0;
  const rng = scratchRng(state, side);
  const stat = { level: cfg.level, personality: cfg.personality, nodes: 0, depth: 0, ms: 0 };

  let choice;
  try {
    const me = active(state, side);
    if (state.request[side] === 'switch' || (me && me.fainted)) {
      choice = chooseForcedSwitch(state, side, cfg, rng);
    } else if (!me) {
      choice = { kind: 'move', moveId: legalMoves(state, side)[0] };
    } else if (cfg.search > 0) {
      const r = searchRoot(state, side, cfg, opts);
      choice = r.choice;
      stat.nodes = r.nodes; stat.evals = r.evals; stat.depth = r.depth; stat.value = r.value;
    } else {
      const c = makeCtx(state, side, cfg);
      const options = allOptions(c, cfg, rng);
      choice = options.length ? toChoice(options[0]) : { kind: 'move', moveId: legalMoves(state, side)[0] };
      stat.value = options[0]?.score ?? 0;
    }
  } catch (err) {
    // Never hang or crash the battle screen because of the AI.
    const ids = legalMoves(state, side);
    choice = { kind: 'move', moveId: ids[0] || 'struggle', target: 'foe' };
    stat.error = String(err && err.message ? err.message : err);
  }

  stat.ms = clock ? clock() - t0 : 0;
  stat.choice = choice;
  return stat;
}

/** The engine-facing entry point. Back-compatible: `chooseAction(state, side, 'ace')`. */
export function chooseAction(state, side, levelOrOpts = 'ace') {
  return chooseActionDetailed(state, side, levelOrOpts).choice;
}

export function aiName(level) { return AI_LEVELS[level]?.name ?? 'Ace'; }
export function aiDescribe(level) { return AI_LEVELS[level]?.desc ?? ''; }
export function aiLevels() { return Object.keys(AI_LEVELS); }
export function personalityName(id) { return AI_PERSONALITIES[id]?.name ?? 'Balanced'; }
