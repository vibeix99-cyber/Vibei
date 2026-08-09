// Construction, cloning and serialization of battle state.

import { RNG } from './rng.js';
import { computeStats, defaultIVs, defaultEVs } from './stats.js';
import { getFighter } from '../data/fighters.js';
import { getMove } from '../data/moves.js';

let UID = 0;

export function makeCombatant(member, side, slot) {
  const def = getFighter(member.speciesId);
  if (!def) throw new Error(`Unknown fighter: ${member.speciesId}`);
  const level = member.level ?? 50;
  const ivs = { ...defaultIVs(), ...(member.ivs || {}) };
  const evs = { ...defaultEVs(), ...(member.evs || {}) };
  const nature = member.nature || 'hardy';
  const stats = computeStats(def.base, level, ivs, evs, nature);
  const moves = (member.moves || []).slice(0, 4).map((id) => {
    const m = getMove(id);
    return { id, pp: m ? m.pp : 5, maxPp: m ? m.pp : 5, disabled: false };
  });
  return {
    uid: `p${side}-${slot}-${++UID}`,
    side, slot,
    speciesId: def.id,
    nickname: member.nickname || def.name,
    name: def.name,
    epithet: def.epithet,
    level, nature, ivs, evs,
    types: def.types.slice(),
    baseTypes: def.types.slice(),
    stats,
    hp: stats.hp, maxHp: stats.hp,
    moves,
    ability: member.ability || def.abilities[0],
    baseAbility: member.ability || def.abilities[0],
    item: member.item || null, itemUsed: false,
    status: null, statusTurns: 0, toxicCounter: 0,
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
    volatiles: {},
    fainted: false,
    lastMoveId: null, lastMoveFailed: false,
    movedThisTurn: false, turnsActive: 0, timesHit: 0,
    damageTakenThisTurn: 0, protectStreak: 0,
    critStageBonus: 0
  };
}

export function makeSide(index, cfg) {
  const party = (cfg.team || []).map((m, i) => makeCombatant(m, index, i));
  return {
    index,
    name: cfg.name || (index === 0 ? 'Player 1' : 'Player 2'),
    tag: cfg.tag || (index === 0 ? 'P1' : 'P2'),
    isAI: !!cfg.isAI,
    aiLevel: cfg.aiLevel || 'ace',
    party,
    activeIndex: 0,
    hazards: {},        // id -> layers
    screens: {},        // id -> {turns}
    items: cfg.items ? { ...cfg.items } : {},
    switchesUsed: 0,
    faints: 0
  };
}

export function createBattleState(opts) {
  const rng = new RNG(opts.seed ?? 12345);
  return {
    seed: opts.seed ?? 12345,
    rng,
    turn: 0,
    sides: [makeSide(0, opts.sides[0]), makeSide(1, opts.sides[1])],
    field: {
      weather: { id: 'none', turns: 0, source: null },
      terrain: { id: 'none', turns: 0 },
      trickRoom: 0,
      gravity: 0
    },
    arena: opts.arena || 'colosseum',
    format: { level: 50, teamSize: 6, bring: 6, ...(opts.format || {}) },
    request: { 0: null, 1: null },
    pendingSwitch: { 0: false, 1: false },
    winner: null,
    ended: false,
    events: [],
    turnEvents: [],
    log: []
  };
}

export function active(state, side) {
  const s = state.sides[side];
  return s.party[s.activeIndex];
}

export function foeOf(state, side) { return active(state, 1 - side); }

export function aliveCount(side) { return side.party.filter((p) => !p.fainted).length; }

export function publicView(state) {
  return JSON.parse(JSON.stringify({
    turn: state.turn,
    winner: state.winner,
    ended: state.ended,
    request: state.request,
    field: state.field,
    arena: state.arena,
    sides: state.sides.map((s) => ({
      index: s.index, name: s.name, tag: s.tag, isAI: s.isAI,
      activeIndex: s.activeIndex, hazards: s.hazards, screens: s.screens,
      items: s.items,
      party: s.party.map((p) => ({
        uid: p.uid, speciesId: p.speciesId, nickname: p.nickname, name: p.name,
        level: p.level, types: p.types, hp: p.hp, maxHp: p.maxHp,
        status: p.status, boosts: p.boosts, volatiles: Object.keys(p.volatiles),
        fainted: p.fainted, ability: p.ability, item: p.item,
        moves: p.moves.map((m) => ({ ...m })), stats: p.stats
      }))
    }))
  }));
}
