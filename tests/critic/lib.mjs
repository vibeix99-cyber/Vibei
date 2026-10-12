// Critic harness helpers. Pure node — imports the sim directly.
// NOTHING here mutates a source file; scenarios mutate only the battle state
// object they created themselves.

import { createBattle, submitChoices } from '../../src/core/engine.js';
import { RNG } from '../../src/core/rng.js';
import { MOVES, getMove } from '../../src/data/moves.js';
import { allFighters, getFighter, makeDefaultMember } from '../../src/data/fighters.js';
import { typeEff } from '../../src/core/types.js';
import { STATUSES } from '../../src/core/status.js';

export { createBattle, submitChoices, MOVES, getMove, allFighters, getFighter, makeDefaultMember, typeEff, RNG, STATUSES };

/** RNG that always returns the same float — lets us force every chance roll. */
export class RiggedRNG extends RNG {
  constructor(v = 0.0001) { super(1); this.v = v; }
  next() { this.calls++; return this.v; }
  clone() { const r = new RiggedRNG(this.v); return r; }
}

export const FILLER = 'draw_cut';           // SLASH 40 phys, priority +1, 30 PP
export const FILLER_SLOW = 'one_sword_slash';

/** A fighter that is not immune to `moveType`, preferring plain neutral. */
export function pickTarget(moveType, { avoidStatus = null, avoidTypes = [] } = {}) {
  const pool = allFighters();
  const ok = [];
  for (const f of pool) {
    const e = moveType ? typeEff(moveType, f.types) : 1;
    if (e === 0) continue;
    if (avoidTypes.some((t) => f.types.includes(t))) continue;
    if (avoidStatus) {
      const own = STATUSES[avoidStatus]?.ownType;
      if (own && (f.types.includes(own) || typeEff(own, f.types) === 0)) continue;
    }
    ok.push({ f, e });
  }
  if (!ok.length) return null;
  ok.sort((a, b) => Math.abs(a.e - 1) - Math.abs(b.e - 1));
  return ok[0].f.id;
}

export function member(speciesId, moves, extra = {}) {
  return {
    speciesId, level: 50, nature: 'hardy',
    ability: extra.ability ?? '__none', item: extra.item ?? null,
    moves, nickname: extra.nickname
  };
}

/**
 * Build a 1v1(+bench) battle with total control.
 * Returns { state, user, target, step }.
 */
export function arena(opts) {
  const {
    userSpecies, targetSpecies, userMoves, targetMoves,
    userAbility = '__none', targetAbility = '__none',
    userItem = null, targetItem = null,
    bench = true, rig = 0.0001, seed = 20240809
  } = opts;

  const p0 = [member(userSpecies, userMoves, { ability: userAbility, item: userItem })];
  const p1 = [member(targetSpecies, targetMoves, { ability: targetAbility, item: targetItem })];
  if (bench) {
    p0.push(member(userSpecies, [FILLER], { ability: '__none', nickname: 'Bench0' }));
    p1.push(member(targetSpecies, [FILLER], { ability: '__none', nickname: 'Bench1' }));
  }
  const state = createBattle({
    seed,
    format: { level: 50, teamSize: p0.length, bring: p0.length },
    sides: [{ name: 'A', team: p0 }, { name: 'B', team: p1 }],
    arena: 'marineford'
  });
  if (rig !== null) state.rng = new RiggedRNG(rig);

  const user = state.sides[0].party[0];
  const target = state.sides[1].party[0];
  // Deterministic speed order: the user always moves first unless priority says otherwise.
  user.stats.spe = 400; target.stats.spe = 20;
  return { state, user, target };
}

/** Submit one turn; auto-answers any replacement/pivot request with slot 1. */
export function turn(state, c0, c1) {
  let evs = submitChoices(state, [c0, c1]);
  let guard = 0;
  while (!state.ended && (state.request[0] === 'switch' || state.request[1] === 'switch') && guard++ < 6) {
    const rc = [null, null];
    for (const i of [0, 1]) {
      if (state.request[i] !== 'switch') continue;
      const s = state.sides[i];
      const idx = s.party.findIndex((m, j) => j !== s.activeIndex && !m.fainted);
      rc[i] = { kind: 'switch', toSlot: idx < 0 ? s.activeIndex : idx };
    }
    evs = evs.concat(submitChoices(state, rc));
  }
  return evs;
}

export const mv = (id) => ({ kind: 'move', moveId: id, target: 'foe' });

export function has(evs, t, pred = () => true) { return evs.some((e) => e.t === t && pred(e)); }
export function pick(evs, t, pred = () => true) { return evs.filter((e) => e.t === t && pred(e)); }
export function texts(evs) { return evs.filter((e) => e.t === 'message').map((e) => e.text); }
