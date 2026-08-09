// Damage formula. Pure: takes a context object, returns a result object.

import { typeEff } from './types.js';
import { boostMul, accBoostMul } from './stats.js';
import { WEATHERS, TERRAINS, SCREENS } from './status.js';

export const CRIT_STAGE_ODDS = [1 / 24, 1 / 8, 1 / 2, 1, 1];
export const CRIT_MULTIPLIER = 1.5;

/** Effective stat after boosts, status and field. */
export function effectiveStat(mon, key, opts = {}) {
  let v = mon.stats[key];
  let stage = mon.boosts[key] || 0;
  if (opts.ignoreBoosts && stage > 0) stage = 0;       // crits ignore defensive drops on the attacker's side
  if (opts.ignoreNegative && stage < 0) stage = 0;
  v = Math.floor(v * boostMul(stage));
  if (key === 'atk' && mon.status === 'brn' && !opts.noBurnDrop) v = Math.floor(v * 0.5);
  if (key === 'spe' && mon.status === 'par') v = Math.floor(v * 0.5);
  return Math.max(1, v);
}

/** Accuracy check. Returns true if the move connects. */
export function accuracyCheck(rng, move, user, target, field) {
  if (move.accuracy === null || move.accuracy === undefined) return true;
  const accStage = (user.boosts.acc || 0) - (target.boosts.eva || 0);
  let acc = move.accuracy * accBoostMul(Math.max(-6, Math.min(6, accStage)));
  const w = WEATHERS[field.weather?.id || 'none'];
  if (w?.accMod) acc *= w.accMod;
  if (user.volatiles.locked_on) return true;
  acc = Math.max(1, Math.min(100, acc));
  return rng.next() * 100 < acc;
}

/** Crit roll. */
export function critCheck(rng, move, user) {
  let stage = (move.critStage || 0) + (user.volatiles.focusenergy ? 2 : 0) + (user.critStageBonus || 0);
  stage = Math.max(0, Math.min(4, stage));
  const odds = CRIT_STAGE_ODDS[stage];
  if (odds >= 1) return true;
  return rng.next() < odds;
}

/**
 * @returns {{damage:number, eff:number, crit:boolean, stab:number, immune:boolean, breakdown:object}}
 */
export function computeDamage(ctx) {
  const { rng, move, user, target, field, side, foeSide, crit, fixedRoll } = ctx;
  const defTypes = target.types;
  const eff = typeEff(move.type, defTypes);

  if (eff === 0) return { damage: 0, eff: 0, crit: false, stab: 1, immune: true, breakdown: {} };
  if (move.category === 'status' || !move.power) {
    return { damage: 0, eff, crit: false, stab: 1, immune: false, breakdown: {} };
  }

  const physical = move.category === 'physical';
  const atkKey = physical ? 'atk' : 'spa';
  const defKey = physical ? 'def' : 'spd';

  const A = effectiveStat(user, atkKey, { ignoreNegative: crit });
  const D = effectiveStat(target, defKey, { ignoreBoosts: crit });

  const level = user.level;
  let base = Math.floor(Math.floor((Math.floor((2 * level) / 5) + 2) * move.power * A / D) / 50) + 2;

  // --- multipliers ---
  let m = 1;
  const bd = {};

  // STAB
  let stab = 1;
  if (user.types.includes(move.type)) {
    stab = user.ability === 'adaptability' ? 2 : 1.5;
  }
  bd.stab = stab;
  m *= stab;

  // Type effectiveness
  bd.eff = eff;
  m *= eff;

  // Crit
  if (crit) { m *= CRIT_MULTIPLIER; bd.crit = CRIT_MULTIPLIER; }

  // Weather
  const w = WEATHERS[field.weather?.id || 'none'];
  if (w?.boosts && w.boosts[move.type]) { m *= w.boosts[move.type]; bd.weather = w.boosts[move.type]; }

  // Terrain
  const t = TERRAINS[field.terrain?.id || 'none'];
  if (t?.boost && t.boost === move.type) { m *= 1.3; bd.terrain = 1.3; }

  // Screens (defender's side), ignored on crits
  if (!crit) {
    for (const [id, sc] of Object.entries(foeSide.screens || {})) {
      const def = SCREENS[id];
      if (!def || !def.mul || !sc.turns) continue;
      if (def.category === 'both' || def.category === move.category) { m *= def.mul; bd.screen = def.mul; }
    }
  }

  // Burn already handled inside effectiveStat.

  // Random spread 0.85..1.00 (16 buckets, like the source material)
  const roll = fixedRoll !== undefined ? fixedRoll : (85 + rng.int(16)) / 100;
  bd.roll = roll;

  let dmg = Math.floor(base * m);
  dmg = Math.max(1, Math.floor(dmg * roll));

  return { damage: dmg, eff, crit: !!crit, stab, immune: false, breakdown: bd };
}

/** Best-case / worst-case damage without consuming RNG — used by the AI. */
export function damageRange(ctx) {
  const lo = computeDamage({ ...ctx, fixedRoll: 0.85 });
  const hi = computeDamage({ ...ctx, fixedRoll: 1.0 });
  return { min: lo.damage, max: hi.damage, avg: Math.floor((lo.damage + hi.damage) / 2), eff: lo.eff, immune: lo.immune };
}
