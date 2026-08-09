// The turn engine. Pure simulation: no DOM, no Math.random, no time.
// Mutates `state`, returns the BattleEvent[] produced by the call.

import { createBattleState, active, aliveCount, publicView } from './battleState.js';
import { getMove } from '../data/moves.js';
import { getItem } from '../data/items.js';
import { computeDamage, accuracyCheck, critCheck } from './damage.js';
import { typeEff, effText } from './types.js';
import { boostText, STAT_NAME } from './stats.js';
import { STATUSES, VOLATILES, WEATHERS, TERRAINS, HAZARDS, SCREENS } from './status.js';
import { runAbility } from './abilities.js';
import { runItemHook } from './items.js';

/* ------------------------------------------------------------------ */
/* event helpers                                                       */
/* ------------------------------------------------------------------ */

function emit(state, ev) {
  state.events.push(ev);
  state.turnEvents.push(ev);
  if (ev.t === 'message') state.log.push(ev.text);
  return ev;
}
function msg(state, text, style) { if (text) emit(state, { t: 'message', text, style }); }
function label(mon) { return `${mon.side === 0 ? '' : 'Foe '}${mon.nickname}`; }

/* ------------------------------------------------------------------ */
/* creation                                                            */
/* ------------------------------------------------------------------ */

export function createBattle(opts) {
  const state = createBattleState(opts);
  state.turnEvents = [];
  emit(state, {
    t: 'battleStart',
    arena: state.arena,
    sides: state.sides.map((s) => ({ name: s.name, tag: s.tag, size: s.party.length }))
  });
  // Lead sends out simultaneously; side 1 first so the player's mon reads as the "answer".
  doSwitchIn(state, 1, state.sides[1].activeIndex, true);
  doSwitchIn(state, 0, state.sides[0].activeIndex, true);
  state.turn = 0;
  state.request = { 0: 'move', 1: 'move' };
  return state;
}

export function isOver(state) { return state.ended; }

/* ------------------------------------------------------------------ */
/* switching                                                           */
/* ------------------------------------------------------------------ */

function resetOnSwitchOut(mon) {
  mon.boosts = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  mon.volatiles = {};
  mon.types = mon.baseTypes.slice();
  mon.ability = mon.baseAbility;
  mon.turnsActive = 0;
  mon.protectStreak = 0;
  mon.critStageBonus = 0;
  mon.lastMoveId = null;
  if (mon.status === 'tox') mon.toxicCounter = 0;
}

function doSwitchIn(state, side, index, silent = false) {
  const s = state.sides[side];
  s.activeIndex = index;
  const mon = s.party[index];
  mon.turnsActive = 0;
  mon.movedThisTurn = false;
  emit(state, {
    t: 'switchIn', side, uid: mon.uid, speciesId: mon.speciesId,
    nickname: mon.nickname, hp: mon.hp, maxHp: mon.maxHp,
    level: mon.level, status: mon.status, types: mon.types.slice()
  });
  if (!silent) msg(state, side === 0 ? `Go! ${mon.nickname}!` : `${s.name} sent out ${mon.nickname}!`);
  applyHazards(state, mon);
  if (!mon.fainted) runAbility('onSwitchIn', { state, mon, emit: (e) => emit(state, e), msg: (t) => msg(state, t) });
}

function performSwitch(state, side, toSlot) {
  const s = state.sides[side];
  const out = s.party[s.activeIndex];
  if (out && !out.fainted) {
    emit(state, { t: 'switchOut', side, uid: out.uid });
    msg(state, side === 0 ? `${out.nickname}, come back!` : `${s.name} withdrew ${out.nickname}!`);
    resetOnSwitchOut(out);
  }
  s.switchesUsed++;
  doSwitchIn(state, side, toSlot);
}

function applyHazards(state, mon) {
  const s = state.sides[mon.side];
  const grounded = !mon.types.includes('WIND') && !mon.volatiles.magnetrise;
  for (const [id, layers] of Object.entries(s.hazards)) {
    if (!layers) continue;
    if (id === 'caltrops' && grounded) {
      const frac = [0, 1 / 8, 1 / 6, 1 / 4][Math.min(3, layers)];
      dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp * frac)), 'hazard');
      msg(state, `${label(mon)} is hurt by caltrops!`);
    } else if (id === 'shards') {
      const eff = typeEff('FROST', mon.types);
      const frac = eff >= 2 ? 1 / 4 : eff === 1 ? 1 / 8 : eff === 0.5 ? 1 / 16 : 0;
      if (frac > 0) {
        dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp * frac)), 'hazard');
        msg(state, `Ice shards tear into ${label(mon)}!`);
      }
    } else if (id === 'barbs' && grounded && !mon.status && !mon.types.includes('TOXIN')) {
      applyStatus(state, mon, layers >= 2 ? 'tox' : 'psn', 'hazard');
    } else if (id === 'oilslick' && grounded) {
      changeBoost(state, mon, 'spe', -1, 'hazard');
    }
    emit(state, { t: 'hazard', side: mon.side, id, layers });
  }
  checkFaint(state, mon);
}

/* ------------------------------------------------------------------ */
/* damage & healing primitives                                         */
/* ------------------------------------------------------------------ */

export function dealDirect(state, mon, amount, source = 'effect', meta = {}) {
  if (mon.fainted) return 0;
  const dealt = Math.min(mon.hp, Math.max(0, Math.floor(amount)));
  mon.hp -= dealt;
  mon.damageTakenThisTurn += dealt;
  mon.timesHit++;
  emit(state, {
    t: 'damage', side: mon.side, uid: mon.uid, amount: dealt,
    hpAfter: mon.hp, maxHp: mon.maxHp, source,
    eff: meta.eff ?? 1, crit: !!meta.crit, hits: meta.hits ?? 1
  });
  return dealt;
}

export function healMon(state, mon, amount, source = 'effect') {
  if (mon.fainted) return 0;
  const healed = Math.min(mon.maxHp - mon.hp, Math.max(0, Math.floor(amount)));
  if (healed <= 0) return 0;
  mon.hp += healed;
  emit(state, { t: 'heal', side: mon.side, uid: mon.uid, amount: healed, hpAfter: mon.hp, maxHp: mon.maxHp, source });
  return healed;
}

export function changeBoost(state, mon, stat, delta, source = 'move') {
  if (mon.fainted || delta === 0) return false;
  const cur = mon.boosts[stat] || 0;
  if (delta < 0 && state.sides[mon.side].screens.mist?.turns) {
    msg(state, `${label(mon)} is protected by the mist!`);
    return false;
  }
  const next = Math.max(-6, Math.min(6, cur + delta));
  if (next === cur) {
    emit(state, { t: 'boost', side: mon.side, uid: mon.uid, stat, delta: 0, stage: cur, failed: true });
    msg(state, `${label(mon)}'s ${STAT_NAME[stat]} won't go ${delta > 0 ? 'higher' : 'lower'}!`);
    return false;
  }
  mon.boosts[stat] = next;
  emit(state, { t: 'boost', side: mon.side, uid: mon.uid, stat, delta: next - cur, stage: next, failed: false, source });
  msg(state, `${label(mon)}'s ${boostText(stat, next - cur)}`);
  return true;
}

export function applyStatus(state, mon, status, source = 'move') {
  if (mon.fainted) return false;
  if (mon.status) return false;
  if (state.sides[mon.side].screens.safeguard?.turns && source !== 'self') return false;
  // Type immunities
  const IMMUNE = { brn: ['FLAME'], frz: ['FROST'], par: ['STORM'], psn: ['TOXIN'], tox: ['TOXIN'] };
  if (IMMUNE[status]?.some((t) => mon.types.includes(t))) return false;
  if (runAbility('onStatusImmune', { state, mon, status }) === true) return false;

  mon.status = status;
  mon.statusTurns = status === 'slp' ? state.rng.range(1, 3) : 0;
  if (status === 'tox') mon.toxicCounter = 1;
  emit(state, { t: 'statusApply', side: mon.side, uid: mon.uid, status });
  msg(state, `${label(mon)} ${STATUSES[status].msg}`);
  return true;
}

export function cureStatus(state, mon) {
  if (!mon.status) return;
  const old = mon.status;
  mon.status = null; mon.statusTurns = 0; mon.toxicCounter = 0;
  emit(state, { t: 'statusCure', side: mon.side, uid: mon.uid, status: old });
  msg(state, `${label(mon)} ${STATUSES[old].cure}`);
}

export function addVolatile(state, mon, id, turns) {
  if (mon.fainted || mon.volatiles[id]) return false;
  const def = VOLATILES[id];
  const t = turns ?? (def ? (def.turns[0] === def.turns[1] ? def.turns[0] : state.rng.range(def.turns[0], def.turns[1])) : 0);
  mon.volatiles[id] = { turns: t, data: {} };
  emit(state, { t: 'volatileStart', side: mon.side, uid: mon.uid, id });
  return true;
}

export function removeVolatile(state, mon, id) {
  if (!mon.volatiles[id]) return false;
  delete mon.volatiles[id];
  emit(state, { t: 'volatileEnd', side: mon.side, uid: mon.uid, id });
  return true;
}

export function setWeather(state, id, turns = 5, source = null) {
  if (state.field.weather.id === id) return false;
  state.field.weather = { id, turns, source };
  emit(state, { t: 'weather', id, phase: 'start' });
  msg(state, weatherStartText(id));
  return true;
}

export function setTerrain(state, id, turns = 5) {
  if (state.field.terrain.id === id) return false;
  state.field.terrain = { id, turns };
  emit(state, { t: 'terrain', id, phase: 'start' });
  msg(state, `The battlefield becomes a ${TERRAINS[id]?.name ?? id}!`);
  return true;
}

function weatherStartText(id) {
  return {
    rain: 'A driving squall sweeps the arena!',
    sun: 'The sun blazes down!',
    sandstorm: 'A sandstorm kicks up!',
    hail: 'A blizzard rolls in!',
    fog: 'Sea fog blankets the field…',
    none: 'The weather cleared.'
  }[id] || '';
}

function checkFaint(state, mon) {
  if (mon.fainted || mon.hp > 0) return false;
  mon.hp = 0;
  mon.fainted = true;
  state.sides[mon.side].faints++;
  emit(state, { t: 'faint', side: mon.side, uid: mon.uid });
  msg(state, `${label(mon)} fainted!`);
  if (mon.volatiles.destinybond) {
    const foe = active(state, 1 - mon.side);
    if (foe && !foe.fainted) {
      dealDirect(state, foe, foe.hp, 'destinybond');
      msg(state, `${label(mon)} took ${label(foe)} down with it!`);
      checkFaint(state, foe);
    }
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* turn resolution                                                     */
/* ------------------------------------------------------------------ */

function speedOf(state, mon) {
  let spe = mon.stats.spe;
  const stage = mon.boosts.spe || 0;
  spe = Math.floor(spe * (stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage)));
  if (mon.status === 'par') spe = Math.floor(spe * 0.5);
  if (state.sides[mon.side].screens.tailwind?.turns) spe *= 2;
  if (mon.item === 'weighted_bands') spe = Math.floor(spe * 0.5);
  spe = runAbility('modifySpeed', { state, mon, value: spe }) ?? spe;
  return spe;
}

function actionPriority(state, side, choice) {
  if (!choice) return -99;
  if (choice.kind === 'switch') return 7;
  if (choice.kind === 'item') return 6;
  if (choice.kind === 'run') return 8;
  const move = getMove(choice.moveId);
  let p = move ? (move.priority || 0) : 0;
  const mon = active(state, side);
  p = runAbility('modifyPriority', { state, mon, move, value: p }) ?? p;
  return p;
}

export function submitChoices(state, choices) {
  state.turnEvents = [];
  if (state.ended) return state.turnEvents;

  // --- forced switch phase (someone fainted last turn) ---
  if (state.request[0] === 'switch' || state.request[1] === 'switch') {
    for (let i = 0; i < 2; i++) {
      if (state.request[i] === 'switch' && choices[i]?.kind === 'switch') {
        doSwitchIn(state, i, choices[i].toSlot);
      }
    }
    state.request = { 0: 'move', 1: 'move' };
    if (checkBattleEnd(state)) return state.turnEvents;
    return state.turnEvents;
  }

  state.turn++;
  emit(state, { t: 'turnStart', turn: state.turn });

  for (const s of state.sides) {
    for (const p of s.party) { p.movedThisTurn = false; p.damageTakenThisTurn = 0; }
  }

  // Order actions
  const entries = [0, 1].map((i) => ({ side: i, choice: choices[i] }));
  const order = entries.slice().sort((a, b) => {
    const pa = actionPriority(state, a.side, a.choice);
    const pb = actionPriority(state, b.side, b.choice);
    if (pa !== pb) return pb - pa;
    const sa = speedOf(state, active(state, a.side));
    const sb = speedOf(state, active(state, b.side));
    if (sa !== sb) return state.field.trickRoom > 0 ? sa - sb : sb - sa;
    return state.rng.next() < 0.5 ? -1 : 1;
  });

  for (const entry of order) {
    if (state.ended) break;
    const mon = active(state, entry.side);
    if (!mon || mon.fainted) continue;
    runAction(state, entry.side, entry.choice);
    // fainted checks
    for (let i = 0; i < 2; i++) checkFaint(state, active(state, i));
    if (checkBattleEnd(state)) return state.turnEvents;
  }

  if (!state.ended) endOfTurn(state);
  if (checkBattleEnd(state)) return state.turnEvents;

  // Request switches for fainted actives
  let needSwitch = false;
  for (let i = 0; i < 2; i++) {
    const a = active(state, i);
    if (a && a.fainted) { state.request[i] = 'switch'; needSwitch = true; }
    else state.request[i] = 'move';
  }
  if (needSwitch) { for (let i = 0; i < 2; i++) if (state.request[i] !== 'switch') state.request[i] = null; }

  return state.turnEvents;
}

function runAction(state, side, choice) {
  if (!choice) return;
  if (choice.kind === 'switch') { performSwitch(state, side, choice.toSlot); return; }
  if (choice.kind === 'item') { useItem(state, side, choice); return; }
  if (choice.kind === 'run') {
    msg(state, `${state.sides[side].name} fled the battle!`);
    state.ended = true; state.winner = 1 - side;
    emit(state, { t: 'battleEnd', winner: state.winner });
    return;
  }
  executeMove(state, side, choice.moveId, choice);
}

function useItem(state, side, choice) {
  const s = state.sides[side];
  const item = getItem(choice.itemId);
  if (!item || !(s.items[choice.itemId] > 0)) { msg(state, 'But it failed!'); return; }
  const target = s.party[choice.targetSlot ?? s.activeIndex];
  s.items[choice.itemId]--;
  emit(state, { t: 'itemUse', side, uid: target.uid, itemId: item.id, consumed: true });
  msg(state, `${s.name} used a ${item.name}!`);
  item.use?.({ state, target, side, healMon, cureStatus, changeBoost, msg: (t) => msg(state, t), emit: (e) => emit(state, e) });
}

/* ------------------------------------------------------------------ */
/* move execution                                                      */
/* ------------------------------------------------------------------ */

function canMove(state, mon, move) {
  // recharge
  if (mon.volatiles.recharge) {
    removeVolatile(state, mon, 'recharge');
    emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'recharge' });
    msg(state, `${label(mon)} must recharge!`);
    return false;
  }
  if (mon.volatiles.flinch) {
    removeVolatile(state, mon, 'flinch');
    emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'flinch' });
    msg(state, `${label(mon)} flinched!`);
    return false;
  }
  if (mon.status === 'slp') {
    if (mon.statusTurns <= 0) { cureStatus(state, mon); }
    else {
      mon.statusTurns--;
      emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'slp' });
      msg(state, `${label(mon)} is fast asleep.`);
      return false;
    }
  }
  if (mon.status === 'frz') {
    if (state.rng.chance(20) || move?.type === 'FLAME') { cureStatus(state, mon); }
    else {
      emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'frz' });
      msg(state, `${label(mon)} is frozen solid!`);
      return false;
    }
  }
  if (mon.status === 'par' && state.rng.chance(25)) {
    emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'par' });
    msg(state, `${label(mon)} is paralyzed! It can't move!`);
    return false;
  }
  if (mon.volatiles.confusion) {
    const v = mon.volatiles.confusion;
    if (v.turns <= 0) { removeVolatile(state, mon, 'confusion'); msg(state, `${label(mon)} snapped out of confusion!`); }
    else {
      v.turns--;
      msg(state, `${label(mon)} is confused!`);
      if (state.rng.chance(33)) {
        const self = computeDamage({
          rng: state.rng, move: { type: '???', category: 'physical', power: 40 },
          user: mon, target: mon, field: state.field,
          side: state.sides[mon.side], foeSide: state.sides[mon.side], crit: false
        });
        emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'confusion' });
        msg(state, `It hurt itself in its confusion!`);
        dealDirect(state, mon, self.damage, 'confusion');
        checkFaint(state, mon);
        return false;
      }
    }
  }
  return true;
}

export function executeMove(state, side, moveId, choice = {}) {
  const user = active(state, side);
  const move = getMove(moveId);
  if (!move) { msg(state, 'But nothing happened!'); return; }
  if (moveId !== 'struggle' && !user.moves.some((m) => m.pp > 0 && !m.disabled)) {
    // No usable move: fall through to Struggle rather than deadlocking the battle.
    return executeMove(state, side, 'struggle', choice);
  }

  if (!canMove(state, user, move)) { user.lastMoveFailed = true; return; }

  // Two-turn charge moves
  const chargeFlag = move.flags?.includes('charge');
  if (chargeFlag && !user.volatiles.charging) {
    addVolatile(state, user, 'charging', 1);
    user.volatiles.charging.data = { moveId };
    emit(state, { t: 'prepare', side, uid: user.uid, moveId, text: move.chargeText || `${label(user)} is winding up!` });
    msg(state, move.chargeText || `${label(user)} is winding up!`);
    return;
  }
  if (user.volatiles.charging) removeVolatile(state, user, 'charging');

  const slot = moveId === 'struggle' ? null : user.moves.find((m) => m.id === moveId);
  if (slot) {
    if (slot.pp <= 0) { msg(state, `${label(user)} has no PP left for ${move.name}!`); return; }
    slot.pp--;
  }

  user.lastMoveId = moveId;
  user.movedThisTurn = true;
  const target = move.target === 'self' ? user : active(state, 1 - side);

  emit(state, {
    t: 'moveUsed', side, uid: user.uid, moveId,
    targetSide: target.side, targetUid: target.uid,
    moveName: move.name, moveType: move.type, category: move.category, fx: move.fx || null
  });
  msg(state, `${label(user)} used ${move.name}!`);

  // Protect
  if (target !== user && target.volatiles.protect && move.flags?.includes('protect') !== false) {
    emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'protect' });
    msg(state, `${label(target)} protected itself!`);
    return;
  }

  // Status/field moves
  if (move.category === 'status') {
    if (move.accuracy !== null && target !== user && !accuracyCheck(state.rng, move, user, target, state.field)) {
      emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'accuracy' });
      msg(state, `${label(user)}'s attack missed!`);
      return;
    }
    applyEffects(state, move, user, target, 0, true);
    return;
  }

  // Immunity
  const eff = typeEff(move.type, target.types);
  if (eff === 0) {
    emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'immune' });
    msg(state, `It doesn't affect ${label(target)}…`);
    return;
  }

  // Accuracy
  if (!accuracyCheck(state.rng, move, user, target, state.field)) {
    emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'accuracy' });
    msg(state, `${label(user)}'s attack missed!`);
    user.lastMoveFailed = true;
    return;
  }

  // Hit count
  let hits = 1;
  if (move.hits) {
    const [lo, hi] = move.hits;
    if (lo === hi) hits = lo;
    else {
      const r = state.rng.next();
      hits = r < 0.35 ? 2 : r < 0.70 ? 3 : r < 0.85 ? 4 : 5;
      hits = Math.max(lo, Math.min(hi, hits));
    }
  }

  let totalDamage = 0;
  let anyCrit = false;
  let landed = 0;

  for (let h = 0; h < hits; h++) {
    if (target.fainted) break;
    const crit = critCheck(state.rng, move, user);
    if (crit) anyCrit = true;
    const res = computeDamage({
      rng: state.rng, move, user, target, field: state.field,
      side: state.sides[side], foeSide: state.sides[target.side], crit
    });
    let dmg = res.damage;
    dmg = runAbility('modifyDamage', { state, mon: user, target, move, value: dmg }) ?? dmg;
    dmg = runAbility('modifyDamageTaken', { state, mon: target, attacker: user, move, value: dmg }) ?? dmg;
    dmg = runItemHook('modifyDamage', { state, mon: user, target, move, value: dmg }) ?? dmg;
    dmg = Math.max(1, dmg);

    // Substitute soak
    if (target.volatiles.substitute) {
      const sub = target.volatiles.substitute;
      sub.data.hp = (sub.data.hp ?? Math.floor(target.maxHp / 4)) - dmg;
      msg(state, `The substitute took the hit!`);
      if (sub.data.hp <= 0) { removeVolatile(state, target, 'substitute'); msg(state, `${label(target)}'s substitute faded!`); }
      landed++;
      continue;
    }

    if (target.volatiles.endure && dmg >= target.hp) dmg = target.hp - 1;

    const dealt = dealDirect(state, target, dmg, 'move', { eff: res.eff, crit, hits });
    totalDamage += dealt;
    landed++;
    if (target.hp <= 0) break;
  }

  if (hits > 1) msg(state, `Hit ${landed} time${landed === 1 ? '' : 's'}!`);
  if (anyCrit) msg(state, 'A critical hit!', 'crit');
  const et = effText(eff, label(target));
  if (et) msg(state, et, eff > 1 ? 'super' : 'weak');

  // Drain / recoil
  if (move.drain && totalDamage > 0) {
    healMon(state, user, Math.max(1, Math.floor(totalDamage * move.drain)), 'drain');
    msg(state, `${label(user)} drained health!`);
  }
  if (move.recoil && totalDamage > 0) {
    const r = Math.max(1, Math.floor(totalDamage * move.recoil));
    dealDirect(state, user, r, 'recoil');
    msg(state, `${label(user)} is hit by recoil!`);
    checkFaint(state, user);
  }

  // Contact-triggered abilities on the defender
  if (move.contact && !target.fainted) {
    runAbility('onContact', { state, mon: target, attacker: user, move, emit: (e) => emit(state, e), msg: (t) => msg(state, t) });
  }

  if (totalDamage > 0 || move.category !== 'status') applyEffects(state, move, user, target, totalDamage, false);

  if (move.flags?.includes('recharge')) addVolatile(state, user, 'recharge', 1);

  checkFaint(state, target);
  checkFaint(state, user);
}

function applyEffects(state, move, user, target, damageDealt, isStatusMove) {
  if (!move.effects) { if (isStatusMove) msg(state, 'But it failed!'); return; }
  for (const e of move.effects) {
    const chance = e.chance ?? 100;
    if (chance < 100 && !state.rng.chance(chance)) continue;
    const tgt = e.target === 'self' ? user : target;
    if (tgt.fainted && e.target !== 'self') continue;

    switch (e.kind) {
      case 'status': applyStatus(state, tgt, e.value); break;
      case 'cure': cureStatus(state, tgt); break;
      case 'boost':
        for (const [k, v] of Object.entries(e.stats)) changeBoost(state, tgt, k, v);
        break;
      case 'volatile': addVolatile(state, tgt, e.value, e.turns);
        if (e.value === 'confusion') msg(state, `${label(tgt)} became confused!`);
        if (e.value === 'protect') msg(state, `${label(tgt)} braced itself!`);
        if (e.value === 'substitute') {
          tgt.volatiles.substitute.data = { hp: Math.floor(tgt.maxHp / 4) };
          dealDirect(state, tgt, Math.floor(tgt.maxHp / 4), 'substitute');
          msg(state, `${label(tgt)} put up a substitute!`);
        }
        break;
      case 'heal': healMon(state, tgt, Math.floor(tgt.maxHp * (e.frac ?? 0.5)), 'move');
        msg(state, `${label(tgt)} regained health!`); break;
      case 'weather': setWeather(state, e.value, e.turns ?? 5); break;
      case 'terrain': setTerrain(state, e.value, e.turns ?? 5); break;
      case 'hazard': {
        const s = state.sides[e.target === 'allySide' ? user.side : 1 - user.side];
        const max = HAZARDS[e.value]?.maxLayers ?? 1;
        s.hazards[e.value] = Math.min(max, (s.hazards[e.value] || 0) + 1);
        emit(state, { t: 'hazard', side: s.index, id: e.value, layers: s.hazards[e.value] });
        msg(state, `${HAZARDS[e.value]?.name ?? e.value} scattered around ${s.name}'s side!`);
        break;
      }
      case 'screen': {
        const s = state.sides[e.target === 'foeSide' ? 1 - user.side : user.side];
        const def = SCREENS[e.value];
        s.screens[e.value] = { turns: def?.turns ?? 5 };
        emit(state, { t: 'screen', side: s.index, id: e.value, turns: s.screens[e.value].turns, phase: 'start' });
        msg(state, `${def?.name ?? e.value} shielded ${s.name}'s side!`);
        break;
      }
      case 'clearHazards': {
        const s = state.sides[user.side];
        s.hazards = {};
        msg(state, `The hazards were blown away!`);
        break;
      }
      case 'trickRoom':
        state.field.trickRoom = state.field.trickRoom > 0 ? 0 : 5;
        msg(state, state.field.trickRoom ? 'The dimensions twist!' : 'The dimensions returned to normal.');
        break;
      case 'custom': runCustom(state, e.value, { move, user, target, damageDealt }); break;
      default: break;
    }
  }
}

const CUSTOM = {
  seismic: ({ state, user, target }) => { dealDirect(state, target, user.level, 'move'); },
  halfhp:  ({ state, target }) => { dealDirect(state, target, Math.max(1, Math.floor(target.hp / 2)), 'move'); },
  ohko:    ({ state, target }) => { dealDirect(state, target, target.hp, 'move'); msg(state, 'It was a one-hit KO!'); },
  painsplit: ({ state, user, target }) => {
    const total = user.hp + target.hp;
    const each = Math.floor(total / 2);
    user.hp = Math.min(user.maxHp, each); target.hp = Math.min(target.maxHp, each);
    msg(state, 'The pain was shared!');
  },
  swapboosts: ({ user, target }) => { const t = user.boosts; user.boosts = target.boosts; target.boosts = t; },
  clearboosts: ({ state, target }) => { target.boosts = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }; msg(state, 'All stat changes were eliminated!'); }
};

function runCustom(state, id, ctx) {
  const fn = CUSTOM[id];
  if (fn) fn({ state, ...ctx });
}

/* ------------------------------------------------------------------ */
/* end of turn                                                         */
/* ------------------------------------------------------------------ */

function endOfTurn(state) {
  const order = [0, 1].sort((a, b) => speedOf(state, active(state, b)) - speedOf(state, active(state, a)));

  // Weather chip
  const w = state.field.weather;
  if (w.id !== 'none' && w.turns > 0) {
    emit(state, { t: 'weather', id: w.id, phase: 'upkeep' });
    const def = WEATHERS[w.id];
    if (def?.chip) {
      for (const side of order) {
        const mon = active(state, side);
        if (!mon || mon.fainted) continue;
        if (def.chip.some((t) => mon.types.includes(t))) continue;
        dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp / 16)), 'weather');
        msg(state, `${label(mon)} is buffeted by the ${def.name.toLowerCase()}!`);
        checkFaint(state, mon);
      }
    }
    w.turns--;
    if (w.turns <= 0) { emit(state, { t: 'weather', id: w.id, phase: 'end' }); msg(state, 'The weather cleared up.'); state.field.weather = { id: 'none', turns: 0 }; }
  }

  // Status chip + volatiles
  for (const side of order) {
    const mon = active(state, side);
    if (!mon || mon.fainted) continue;
    mon.turnsActive++;

    if (mon.status === 'brn') {
      dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp / 16)), 'burn');
      msg(state, `${label(mon)} is hurt by its burn!`);
    } else if (mon.status === 'psn') {
      dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp / 8)), 'poison');
      msg(state, `${label(mon)} is hurt by poison!`);
    } else if (mon.status === 'tox') {
      dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp * mon.toxicCounter / 16)), 'poison');
      msg(state, `${label(mon)} is racked by poison!`);
      mon.toxicCounter = Math.min(15, mon.toxicCounter + 1);
    }
    checkFaint(state, mon);
    if (mon.fainted) continue;

    if (mon.volatiles.leechseed) {
      const foe = active(state, 1 - side);
      const drained = dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp / 8)), 'leechseed');
      if (foe && !foe.fainted) healMon(state, foe, drained, 'leechseed');
      msg(state, `${label(mon)}'s health is sapped!`);
      checkFaint(state, mon);
    }
    if (mon.volatiles.aqua_ring) {
      healMon(state, mon, Math.floor(mon.maxHp / 16), 'aqua_ring');
    }
    if (mon.volatiles.yawn) {
      const v = mon.volatiles.yawn; v.turns--;
      if (v.turns <= 0) { removeVolatile(state, mon, 'yawn'); applyStatus(state, mon, 'slp'); }
    }
    // tick timed volatiles
    for (const [id, v] of Object.entries(mon.volatiles)) {
      if (['confusion', 'charging', 'recharge', 'yawn'].includes(id)) continue;
      if (v.turns > 0) { v.turns--; if (v.turns <= 0) removeVolatile(state, mon, id); }
    }
    if (mon.volatiles.protect) removeVolatile(state, mon, 'protect');
    if (mon.volatiles.endure) removeVolatile(state, mon, 'endure');
    if (mon.volatiles.flinch) removeVolatile(state, mon, 'flinch');

    runItemHook('onResidual', { state, mon, healMon, dealDirect, msg: (t) => msg(state, t), emit: (e) => emit(state, e) });
    runAbility('onResidual', { state, mon, healMon, dealDirect, msg: (t) => msg(state, t), emit: (e) => emit(state, e) });
    checkFaint(state, mon);
  }

  // Screens / terrain tick
  for (const s of state.sides) {
    for (const [id, sc] of Object.entries(s.screens)) {
      sc.turns--;
      if (sc.turns <= 0) {
        delete s.screens[id];
        emit(state, { t: 'screen', side: s.index, id, turns: 0, phase: 'end' });
        msg(state, `${SCREENS[id]?.name ?? id} wore off on ${s.name}'s side.`);
      }
    }
  }
  const ter = state.field.terrain;
  if (ter.id !== 'none' && ter.turns > 0) {
    ter.turns--;
    if (ter.turns <= 0) { emit(state, { t: 'terrain', id: ter.id, phase: 'end' }); msg(state, 'The field returned to normal.'); state.field.terrain = { id: 'none', turns: 0 }; }
  }
  if (state.field.trickRoom > 0) { state.field.trickRoom--; if (state.field.trickRoom === 0) msg(state, 'The dimensions returned to normal.'); }
}

function checkBattleEnd(state) {
  if (state.ended) return true;
  const a0 = aliveCount(state.sides[0]);
  const a1 = aliveCount(state.sides[1]);
  if (a0 === 0 || a1 === 0) {
    state.ended = true;
    state.winner = a0 === 0 && a1 === 0 ? 'draw' : (a0 === 0 ? 1 : 0);
    state.request = { 0: null, 1: null };
    if (state.winner === 'draw') msg(state, 'The battle ended in a draw!');
    else msg(state, `${state.sides[state.winner].name} wins!`);
    emit(state, { t: 'battleEnd', winner: state.winner });
    return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */

export { publicView, active };
export function forceSwitch(state, side, toSlot) { doSwitchIn(state, side, toSlot); }
export function legalSwitches(state, side) {
  const s = state.sides[side];
  return s.party.map((p, i) => (!p.fainted && i !== s.activeIndex ? i : -1)).filter((i) => i >= 0);
}
export function legalMoves(state, side) {
  const mon = active(state, side);
  const usable = mon.moves.filter((m) => m.pp > 0 && !m.disabled).map((m) => m.id);
  return usable.length ? usable : ['struggle'];
}
