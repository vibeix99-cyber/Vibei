// Damage formula. Pure: takes a context object, returns a result object.
//
// The chain follows the source material's ordering, rounding at every step:
//
//   base = floor(floor(floor(2·L/5 + 2) · Power · A / D) / 50) + 2
//   × terrain  (round-half-down)
//   × weather  (round-half-down)
//   × crit     (truncate)
//   × random   (truncate, 16 buckets: 85…100 / 100)
//   × STAB     (round-half-down)
//   × type     (truncate, one defending type at a time)
//   × burn     (truncate, physical only)
//   × screens & other flat mods (round-half-down)
//   floored at 1 unless the move was immune.
//
// `rng` may be null: callers doing lookahead (`damageRange`, the AI) get the
// median bucket instead of a roll, and no RNG is consumed.

import { typeEff1 } from './types.js';
import { boostMul, accBoostMul } from './stats.js';
import { WEATHERS, TERRAINS, SCREENS, AIRBORNE_VOLATILES, GROUNDING_VOLATILES } from './status.js';

export const CRIT_STAGE_ODDS = [1 / 24, 1 / 8, 1 / 2, 1, 1];
export const CRIT_MULTIPLIER = 1.5;
/** The 16 damage buckets, as percentages. */
export const RANDOM_BUCKETS = 16;
export const RANDOM_MIN = 85;
/** Bucket used when no RNG is available (median of the spread). */
export const RANDOM_MEDIAN = 92;

/** Round half *down*, the way the games do their modifier chain. */
export function pokeRound(n) { return (n % 1 > 0.5) ? Math.ceil(n) : Math.floor(n); }

/** Is this fighter standing on the floor? Drives terrain and ground hazards. */
export function isGrounded(mon) {
  if (!mon) return true;
  for (const v of GROUNDING_VOLATILES) if (mon.volatiles?.[v]) return true;
  for (const v of AIRBORNE_VOLATILES) if (mon.volatiles?.[v]) return false;
  return !mon.types.includes('WIND');
}

/** Effective stat after boosts, status and field. */
export function effectiveStat(mon, key, opts = {}) {
  let v = mon.stats[key];
  let stage = mon.boosts[key] || 0;
  if (opts.ignoreBoosts && stage > 0) stage = 0;       // crits ignore the target's defensive boosts
  if (opts.ignoreNegative && stage < 0) stage = 0;     // crits ignore the attacker's offensive drops
  if (opts.ignoreAllBoosts) stage = 0;
  v = Math.floor(v * boostMul(stage));
  if (key === 'atk' && mon.status === 'brn' && !opts.noBurnDrop) v = Math.floor(v * 0.5);
  if (key === 'spe' && mon.status === 'par' && !opts.noParDrop) v = Math.floor(v * 0.5);
  return Math.max(1, v);
}

/** Accuracy check. Returns true if the move connects. */
export function accuracyCheck(rng, move, user, target, field, opts = {}) {
  if (move.accuracy === null || move.accuracy === undefined) return true;
  if (user.volatiles?.locked_on) return true;
  if (opts.alwaysHits) return true;

  let accStage = (user.boosts.acc || 0) - (target.boosts.eva || 0);
  if (opts.ignoreEvasion && accStage < 0) accStage = 0;
  let acc = move.accuracy * accBoostMul(Math.max(-6, Math.min(6, accStage)));

  const w = WEATHERS[field?.weather?.id || 'none'];
  if (w?.accMod && !opts.ignoreWeatherAcc) acc *= w.accMod;
  if (opts.accMod) acc *= opts.accMod;

  acc = Math.max(1, Math.min(100, acc));
  if (!rng) return true;
  return rng.next() * 100 < acc;
}

/** Crit roll. */
export function critCheck(rng, move, user, opts = {}) {
  if (opts.neverCrit) return false;
  let stage = (move.critStage || 0) + (user.volatiles?.focusenergy ? 2 : 0) + (user.critStageBonus || 0);
  stage = Math.max(0, Math.min(4, stage));
  const odds = CRIT_STAGE_ODDS[stage];
  if (odds >= 1) return true;
  if (!rng) return false;
  return rng.next() < odds;
}

/**
 * @returns {{damage:number, eff:number, crit:boolean, stab:number, immune:boolean, breakdown:object}}
 */
export function computeDamage(ctx) {
  const {
    rng, move, user, target, field, foeSide, crit,
    fixedRoll, powerMod = 1, ignoreDefBoosts = false, ignoreScreens = false, typeless = false
  } = ctx;

  const defTypes = target.types;
  let eff = 1;
  const effSteps = [];
  if (!typeless) {
    for (const d of defTypes) { const e = typeEff1(move.type, d); effSteps.push(e); eff *= e; }
  }

  if (eff === 0) return { damage: 0, eff: 0, crit: false, stab: 1, immune: true, breakdown: {} };
  if (move.category === 'status' || !move.power) {
    return { damage: 0, eff, crit: false, stab: 1, immune: false, breakdown: {} };
  }

  const physical = move.category === 'physical';
  const atkKey = physical ? 'atk' : 'spa';
  const defKey = physical ? 'def' : 'spd';

  // Burn is a damage modifier further down, not an Attack drop, so it rounds once.
  const A = effectiveStat(user, atkKey, { ignoreNegative: crit, noBurnDrop: true });
  const D = effectiveStat(target, defKey, { ignoreBoosts: crit, ignoreAllBoosts: ignoreDefBoosts });

  const level = user.level;
  const power = Math.max(1, Math.floor(move.power * powerMod));
  let dmg = Math.floor(Math.floor(Math.floor((2 * level) / 5 + 2) * power * A / D) / 50) + 2;

  const bd = { base: dmg, power, A, D };

  // --- terrain (grounded attacker only) ---
  const t = TERRAINS[field?.terrain?.id || 'none'];
  if (t?.boost && t.boost === move.type && isGrounded(user)) {
    const mul = t.mul ?? 1.3;
    dmg = pokeRound(dmg * mul); bd.terrain = mul;
  }

  // --- weather ---
  const w = WEATHERS[field?.weather?.id || 'none'];
  if (w?.boosts && w.boosts[move.type]) {
    dmg = pokeRound(dmg * w.boosts[move.type]); bd.weather = w.boosts[move.type];
  }

  // --- crit ---
  if (crit) { dmg = Math.floor(dmg * CRIT_MULTIPLIER); bd.crit = CRIT_MULTIPLIER; }

  // --- random spread: 16 buckets, 85%…100% ---
  let pct;
  if (fixedRoll !== undefined && fixedRoll !== null) pct = Math.round(fixedRoll * 100);
  else if (rng) pct = RANDOM_MIN + rng.int(RANDOM_BUCKETS);
  else pct = RANDOM_MEDIAN;
  pct = Math.max(RANDOM_MIN, Math.min(100, pct));
  dmg = Math.floor(dmg * pct / 100);
  bd.roll = pct / 100;

  // --- STAB ---
  let stab = 1;
  if (!typeless && user.types.includes(move.type)) {
    stab = user.ability === 'adaptability' ? 2 : 1.5;
    dmg = pokeRound(dmg * stab);
  }
  bd.stab = stab;

  // --- type effectiveness, one defending type at a time ---
  for (const e of effSteps) { if (e !== 1) dmg = Math.floor(dmg * e); }
  bd.eff = eff;

  // --- burn ---
  if (physical && user.status === 'brn' && !move.ignoresBurn) { dmg = Math.floor(dmg * 0.5); bd.burn = 0.5; }

  // --- screens on the defending side (crits punch straight through) ---
  if (!crit && !ignoreScreens && foeSide) {
    for (const [id, sc] of Object.entries(foeSide.screens || {})) {
      const def = SCREENS[id];
      if (!def || !def.mul || !sc || sc.turns <= 0) continue;
      if (def.category === 'both' || def.category === move.category) { dmg = pokeRound(dmg * def.mul); bd.screen = def.mul; }
    }
  }

  // --- Minimize doubles the impact of crushing moves ---
  if (target.volatiles?.minimized && move.flags?.includes('crush')) { dmg = dmg * 2; bd.minimize = 2; }

  dmg = Math.max(1, dmg);
  return { damage: dmg, eff, crit: !!crit, stab, immune: false, breakdown: bd };
}

/** Best-case / worst-case damage without consuming RNG — used by the AI. */
export function damageRange(ctx) {
  const base = { ...ctx, rng: null };
  const lo = computeDamage({ ...base, fixedRoll: RANDOM_MIN / 100 });
  const hi = computeDamage({ ...base, fixedRoll: 1.0 });
  return {
    min: lo.damage, max: hi.damage,
    avg: Math.floor((lo.damage + hi.damage) / 2),
    eff: lo.eff, immune: lo.immune
  };
}
