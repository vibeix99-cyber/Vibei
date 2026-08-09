// Opponent AI. Pure: reads state, returns a Choice. Owned by the AI agent.
// Levels: 'rookie' | 'pirate' | 'ace' | 'warlord' | 'yonko'

import { getMove } from '../data/moves.js';
import { damageRange } from './damage.js';
import { typeEff } from './types.js';
import { legalMoves, legalSwitches, active } from './engine.js';
import { RNG } from './rng.js';

export const AI_LEVELS = {
  rookie:  { name: 'Rookie',  noise: 0.55, switchIQ: 0.0, statusIQ: 0.1, predicts: 0, desc: 'Swings at whatever is in front of it.' },
  pirate:  { name: 'Pirate',  noise: 0.30, switchIQ: 0.2, statusIQ: 0.4, predicts: 0, desc: 'Picks the strongest move it can see.' },
  ace:     { name: 'Ace',     noise: 0.12, switchIQ: 0.5, statusIQ: 0.7, predicts: 1, desc: 'Reads matchups and pivots.' },
  warlord: { name: 'Warlord', noise: 0.05, switchIQ: 0.8, statusIQ: 0.9, predicts: 1, desc: 'Plays around your win conditions.' },
  yonko:   { name: 'Yonko',   noise: 0.0,  switchIQ: 1.0, statusIQ: 1.0, predicts: 2, desc: 'Assumes your best line and answers it.' }
};

function scratchRng(state) {
  // Never consume the battle RNG — AI thinking must not desync a networked battle.
  return new RNG((state.seed ^ (state.turn * 2654435761)) >>> 0);
}

function estimate(state, attackerSide, moveId, attacker, defender) {
  const move = getMove(moveId);
  if (!move) return { score: -Infinity };
  if (move.category === 'status') return { score: 0, move, status: true };
  const r = damageRange({
    move, user: attacker, target: defender, field: state.field,
    side: state.sides[attackerSide], foeSide: state.sides[1 - attackerSide],
    crit: false, rng: null
  });
  const acc = move.accuracy === null ? 1 : move.accuracy / 100;
  const expected = r.avg * acc;
  const kills = r.min >= defender.hp;
  return { score: expected, move, kills, range: r, acc };
}

function statusValue(state, level, move, attacker, defender) {
  const cfg = AI_LEVELS[level] || AI_LEVELS.ace;
  if (!move.effects) return 0;
  let v = 0;
  const hpFrac = defender.hp / defender.maxHp;
  for (const e of move.effects) {
    if (e.kind === 'status' && !defender.status) {
      const w = { par: 55, brn: 50, tox: 60, slp: 70, psn: 35, frz: 65 }[e.value] || 25;
      v += w * ((e.chance ?? 100) / 100) * (hpFrac > 0.5 ? 1 : 0.4);
    }
    if (e.kind === 'boost') {
      const self = e.target === 'self';
      const sum = Object.values(e.stats).reduce((a, b) => a + b, 0);
      v += (self ? 22 : 18) * sum * (hpFrac > 0.6 ? 1 : 0.5);
    }
    if (e.kind === 'heal') v += (1 - attacker.hp / attacker.maxHp) * 120;
    if (e.kind === 'screen') v += 30;
    if (e.kind === 'hazard') v += 28 * (state.turn < 4 ? 1.3 : 0.6);
    if (e.kind === 'weather' || e.kind === 'terrain') v += 20;
    if (e.value === 'protect') v += defender.status === 'tox' || defender.status === 'brn' ? 30 : 8;
  }
  return v * (0.4 + 0.6 * cfg.statusIQ);
}

function matchupScore(state, mine, theirs) {
  // How good is `mine` against `theirs`? Offense minus defense.
  let off = 0;
  for (const m of mine.moves) {
    const mv = getMove(m.id);
    if (!mv || mv.category === 'status' || m.pp <= 0) continue;
    const e = typeEff(mv.type, theirs.types);
    off = Math.max(off, e * (mv.power || 0));
  }
  let dfn = 0;
  for (const m of theirs.moves) {
    const mv = getMove(m.id);
    if (!mv || mv.category === 'status') continue;
    const e = typeEff(mv.type, mine.types);
    dfn = Math.max(dfn, e * (mv.power || 0));
  }
  const hpTerm = (mine.hp / mine.maxHp) * 60;
  return off - dfn * 0.9 + hpTerm;
}

export function chooseAction(state, side, level = 'ace') {
  const cfg = AI_LEVELS[level] || AI_LEVELS.ace;
  const rng = scratchRng(state);
  const me = active(state, side);
  const foe = active(state, 1 - side);

  if (state.request[side] === 'switch' || me.fainted) {
    const opts = legalSwitches(state, side);
    if (!opts.length) return { kind: 'move', moveId: legalMoves(state, side)[0] };
    let best = opts[0], bestScore = -Infinity;
    for (const i of opts) {
      const s = matchupScore(state, state.sides[side].party[i], foe) + rng.next() * cfg.noise * 40;
      if (s > bestScore) { bestScore = s; best = i; }
    }
    return { kind: 'switch', toSlot: best };
  }

  const moves = legalMoves(state, side);
  if (!moves.length) return { kind: 'move', moveId: me.moves[0]?.id };

  const scored = moves.map((id) => {
    const est = estimate(state, side, id, me, foe);
    const mv = est.move;
    let score = est.score;
    if (mv.category === 'status') score = statusValue(state, level, mv, me, foe);
    else {
      const overkillRatio = est.range.avg / Math.max(1, foe.hp);
      if (est.kills) score += 400;                        // guaranteed KO is king
      else if (overkillRatio > 0.9) score += 120;
      if (mv.priority > 0 && foe.hp / foe.maxHp < 0.25) score += 90;
      if (mv.recoil) score -= est.range.avg * mv.recoil * 0.6;
      if (mv.flags?.includes('recharge')) score -= 40;
      score *= (est.acc);
    }
    score += rng.next() * cfg.noise * 120;
    return { id, score, est };
  }).sort((a, b) => b.score - a.score);

  // Consider switching out of a bad matchup
  if (cfg.switchIQ > 0 && state.request[side] === 'move') {
    const cur = matchupScore(state, me, foe);
    const opts = legalSwitches(state, side);
    let bestAlt = null, bestAltScore = -Infinity;
    for (const i of opts) {
      const s = matchupScore(state, state.sides[side].party[i], foe);
      if (s > bestAltScore) { bestAltScore = s; bestAlt = i; }
    }
    const topKills = scored[0]?.est?.kills;
    if (!topKills && bestAlt !== null && bestAltScore > cur + 60 / cfg.switchIQ && rng.next() < cfg.switchIQ) {
      return { kind: 'switch', toSlot: bestAlt };
    }
  }

  // Emergency healing item
  if (cfg.statusIQ > 0.6 && me.hp / me.maxHp < 0.3) {
    const bag = state.sides[side].items || {};
    if (bag.hyper_potion > 0 && rng.next() < cfg.statusIQ * 0.5) {
      return { kind: 'item', itemId: 'hyper_potion', targetSlot: state.sides[side].activeIndex };
    }
  }

  return { kind: 'move', moveId: scored[0].id, target: 'foe' };
}

export function aiName(level) { return AI_LEVELS[level]?.name ?? 'Ace'; }
