// The turn engine. Pure simulation: no DOM, no Math.random, no time.
// Mutates `state`, returns the BattleEvent[] produced by the call.
//
// Turn shape
// ----------
//   submitChoices()  →  startTurn
//                       build + sort the action queue   (bracket › priority › speed › coin)
//                       run each action                 (pursuit intercepts a switch; a pivot
//                                                        move pauses the queue for a replacement)
//                       end-of-turn residuals           (weather › terrain › per-fighter › sides)
//                       ask for replacements for anyone who fainted
//
// A turn can pause mid-queue: `state.resume` holds the remaining actions while the
// caller answers a `request` of 'switch'. Feeding that switch back into
// submitChoices resumes exactly where the turn left off.

import { createBattleState, active, aliveCount, publicView, emptyBoosts } from './battleState.js';
import { getMove } from '../data/moves.js';
import { getItem } from '../data/items.js';
import { computeDamage, accuracyCheck, critCheck, isGrounded } from './damage.js';
import { typeEff, effText } from './types.js';
import { boostText, boostCapText, clampStage, speedStat, STAT_NAME } from './stats.js';
import {
  STATUSES, VOLATILES, WEATHERS, TERRAINS, HAZARDS, SCREENS,
  THAW_CHANCE, PARALYSIS_CHANCE, CONFUSION_CHANCE, CONFUSION_POWER,
  TRAPPING_VOLATILES
} from './status.js';
import { runAbility } from './abilities.js';
import { runItemHook } from './items.js';

/** Hard stop so a stalemate can never hang a client. */
export const MAX_TURNS = 400;

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
function label(mon) { return mon ? `${mon.side === 0 ? '' : 'Foe '}${mon.nickname}` : 'it'; }
function sideName(state, i) { return state.sides[i].name; }

/* ------------------------------------------------------------------ */
/* creation                                                            */
/* ------------------------------------------------------------------ */

export function createBattle(opts) {
  const state = createBattleState(opts);
  state.turnEvents = [];
  if (opts?.maxTurns) state.format.maxTurns = opts.maxTurns;
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
/* speed & ordering                                                    */
/* ------------------------------------------------------------------ */

export function effectiveSpeed(state, mon) {
  if (!mon) return 0;
  let spe = speedStat(mon, {
    tailwind: (state.sides[mon.side].screens.tailwind?.turns || 0) > 0,
    itemHalve: mon.item === 'weighted_bands'
  });
  spe = runAbility('modifySpeed', { state, mon, value: spe }) ?? spe;
  return Math.max(1, Math.floor(spe));
}

/** Both sides in the order they act this turn (Trick Room aware, ties coin-flipped). */
function residualOrder(state) {
  const a = active(state, 0), b = active(state, 1);
  const sa = effectiveSpeed(state, a), sb = effectiveSpeed(state, b);
  if (sa === sb) return state.rng.next() < 0.5 ? [0, 1] : [1, 0];
  const faster = sa > sb ? 0 : 1;
  return state.field.trickRoom > 0 ? [1 - faster, faster] : [faster, 1 - faster];
}

/* ------------------------------------------------------------------ */
/* switching                                                           */
/* ------------------------------------------------------------------ */

function resetOnSwitchOut(mon) {
  mon.boosts = emptyBoosts();
  mon.volatiles = {};
  mon.types = mon.baseTypes.slice();
  mon.ability = mon.baseAbility;
  mon.turnsActive = 0;
  mon.protectStreak = 0;
  mon.endureStreak = 0;
  mon.critStageBonus = 0;
  mon.lastMoveId = null;
  mon.lastMoveFailed = false;
  mon.damageTakenThisTurn = 0;
  mon.hitThisTurn = false;
  if (mon.status === 'tox') mon.toxicCounter = 1;
}

function doSwitchIn(state, side, index, silent = false) {
  const s = state.sides[side];
  s.activeIndex = index;
  const mon = s.party[index];
  mon.turnsActive = 0;
  mon.movedThisTurn = false;
  mon.switchedInOnTurn = state.turn;
  emit(state, {
    t: 'switchIn', side, uid: mon.uid, speciesId: mon.speciesId,
    nickname: mon.nickname, hp: mon.hp, maxHp: mon.maxHp,
    level: mon.level, status: mon.status, types: mon.types.slice()
  });
  if (!silent) msg(state, side === 0 ? `Go! ${mon.nickname}!` : `${s.name} sent out ${mon.nickname}!`);
  applyHazards(state, mon);
  if (!mon.fainted) {
    runAbility('onSwitchIn', { state, mon, emit: (e) => emit(state, e), msg: (t) => msg(state, t) });
  }
  runFaints(state);
}

function performSwitch(state, side, toSlot, reason = 'choice') {
  const s = state.sides[side];
  const out = s.party[s.activeIndex];
  if (out && !out.fainted) {
    emit(state, { t: 'switchOut', side, uid: out.uid, reason });
    msg(state, side === 0 ? `${out.nickname}, come back!` : `${s.name} withdrew ${out.nickname}!`);
    resetOnSwitchOut(out);
  }
  s.switchesUsed++;
  doSwitchIn(state, side, toSlot);
}

/** Slots this side may voluntarily switch to. */
export function legalSwitches(state, side) {
  const s = state.sides[side];
  const cur = s.party[s.activeIndex];
  if (cur && !cur.fainted) {
    for (const v of TRAPPING_VOLATILES) if (cur.volatiles[v]) return [];
  }
  return replacementOptions(state, side);
}

/** Slots this side may send out to replace a fallen fighter (ignores trapping). */
function replacementOptions(state, side) {
  const s = state.sides[side];
  const out = [];
  for (let i = 0; i < s.party.length; i++) {
    if (i === s.activeIndex) continue;
    if (!s.party[i].fainted) out.push(i);
  }
  return out;
}

function applyHazards(state, mon) {
  const s = state.sides[mon.side];
  const grounded = isGrounded(mon);
  for (const id of Object.keys(s.hazards)) {
    if (mon.fainted || state.ended) break;
    const layers = s.hazards[id];
    if (!layers) continue;
    const def = HAZARDS[id];
    if (!def) continue;
    if (def.grounded && !grounded) continue;

    if (def.absorbedBy && mon.types.includes(def.absorbedBy)) {
      delete s.hazards[id];
      emit(state, { t: 'hazard', side: mon.side, id, layers: 0, phase: 'clear' });
      msg(state, def.absorbMsg ? def.absorbMsg(label(mon)) : `${label(mon)} swept the hazard away!`);
      continue;
    }

    const trigger = () => emit(state, { t: 'hazard', side: mon.side, id, layers, phase: 'trigger' });

    if (id === 'barbs') {
      const status = layers >= 2 ? 'tox' : 'psn';
      if (mon.status || mon.volatiles.substitute) continue;
      trigger();
      applyStatus(state, mon, status, 'hazard', { loud: false });
      continue;
    }
    if (id === 'oilslick') {
      if ((mon.boosts.spe || 0) <= -6) continue;
      trigger();
      msg(state, def.hitMsg(label(mon)));
      changeBoost(state, mon, 'spe', -1, 'hazard', { byFoe: true });
      continue;
    }

    let frac = 0;
    if (def.layerFrac) frac = def.layerFrac[Math.min(def.layerFrac.length - 1, layers)];
    else if (def.typedBy) frac = (def.baseFrac ?? 1 / 8) * typeEff(def.typedBy, mon.types);
    if (frac <= 0) continue;

    trigger();
    msg(state, def.hitMsg(label(mon)));
    dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp * frac)), 'hazard');
    checkFaint(state, mon);
  }
}

/* ------------------------------------------------------------------ */
/* damage & healing primitives                                         */
/* ------------------------------------------------------------------ */

export function dealDirect(state, mon, amount, source = 'effect', meta = {}) {
  if (!mon || mon.fainted) return 0;
  const dealt = Math.min(mon.hp, Math.max(0, Math.floor(amount)));
  if (dealt <= 0) return 0;                    // never emit a no-op damage event
  mon.hp -= dealt;
  mon.damageTakenThisTurn += dealt;
  mon.timesHit++;
  mon.hitThisTurn = true;
  // Stamp the order in which fighters hit 0 so `runFaints` can announce them in
  // the order they actually fell (a defender before the recoil that killed its
  // attacker), rather than in side order.
  if (mon.hp <= 0) {
    mon.hp = 0;
    mon.faintCause = source;
    mon.faintOrder = (state.faintSeq = (state.faintSeq || 0) + 1);
  }
  emit(state, {
    t: 'damage', side: mon.side, uid: mon.uid, amount: dealt,
    hpAfter: mon.hp, maxHp: mon.maxHp, source,
    eff: meta.eff ?? 1, crit: !!meta.crit, hits: meta.hits ?? 1
  });
  return dealt;
}

export function healMon(state, mon, amount, source = 'effect') {
  if (!mon || mon.fainted) return 0;
  const healed = Math.min(mon.maxHp - mon.hp, Math.max(0, Math.floor(amount)));
  if (healed <= 0) return 0;
  mon.hp += healed;
  emit(state, { t: 'heal', side: mon.side, uid: mon.uid, amount: healed, hpAfter: mon.hp, maxHp: mon.maxHp, source });
  return healed;
}

export function changeBoost(state, mon, stat, delta, source = 'move', opts = {}) {
  if (!mon || mon.fainted || !delta) return false;
  const byFoe = opts.byFoe ?? false;

  if (delta < 0 && byFoe) {
    if (mon.volatiles.substitute && !opts.bypassSub) {
      msg(state, `${label(mon)}'s substitute shrugged it off!`);
      return false;
    }
    if ((state.sides[mon.side].screens.mist?.turns || 0) > 0) {
      msg(state, `${label(mon)} is protected by the mist!`);
      return false;
    }
  }

  const cur = mon.boosts[stat] || 0;
  const next = clampStage(cur + delta);
  if (next === cur) {
    emit(state, { t: 'boost', side: mon.side, uid: mon.uid, stat, delta: 0, stage: cur, failed: true });
    msg(state, `${label(mon)}'s ${boostCapText(stat, delta)}`);
    return false;
  }
  mon.boosts[stat] = next;
  emit(state, { t: 'boost', side: mon.side, uid: mon.uid, stat, delta: next - cur, stage: next, failed: false, source });
  msg(state, `${label(mon)}'s ${boostText(stat, next - cur)}`);
  return true;
}

export function applyStatus(state, mon, status, source = 'move', opts = {}) {
  if (!mon || mon.fainted) return false;
  const def = STATUSES[status];
  if (!def) return false;
  const byFoe = opts.byFoe ?? (source !== 'self' && source !== 'item');
  const loud = opts.loud !== false;

  if (mon.status) {
    if (loud && source === 'move') msg(state, `${label(mon)} is already ${STATUSES[mon.status].already}!`);
    return false;
  }
  if (byFoe && mon.volatiles.substitute && !opts.bypassSub) return false;
  if (byFoe && (state.sides[mon.side].screens.safeguard?.turns || 0) > 0) {
    if (loud) msg(state, `${label(mon)} is protected by the safeguard!`);
    return false;
  }
  const ter = TERRAINS[state.field.terrain.id];
  if (ter?.statusGuard && isGrounded(mon)) {
    if (loud) msg(state, `The pressure on the field shields ${label(mon)}!`);
    return false;
  }
  if (def.ownType && (mon.types.includes(def.ownType) || typeEff(def.ownType, mon.types) === 0)) {
    if (loud) msg(state, `It doesn't affect ${label(mon)}…`);
    return false;
  }
  if (runAbility('onStatusImmune', { state, mon, status, source }) === true) {
    emit(state, { t: 'ability', side: mon.side, uid: mon.uid, abilityId: mon.ability });
    if (loud) msg(state, `${label(mon)} shrugs it off!`);
    return false;
  }
  if (runItemHook('onStatusImmune', { state, mon, status, source, value: false }) === true) {
    emit(state, { t: 'itemUse', side: mon.side, uid: mon.uid, itemId: mon.item, consumed: false });
    if (loud) msg(state, `${label(mon)}'s ${getItem(mon.item)?.name ?? 'item'} shields it!`);
    return false;
  }

  mon.status = status;
  mon.statusTurns = status === 'slp' ? state.rng.range(1, 3) : 0;
  mon.toxicCounter = status === 'tox' ? 1 : 0;
  emit(state, { t: 'statusApply', side: mon.side, uid: mon.uid, status });
  msg(state, `${label(mon)} ${def.msg}`);
  return true;
}

export function cureStatus(state, mon, quiet = false) {
  if (!mon || !mon.status) return false;
  const old = mon.status;
  mon.status = null; mon.statusTurns = 0; mon.toxicCounter = 0;
  emit(state, { t: 'statusCure', side: mon.side, uid: mon.uid, status: old });
  if (!quiet) msg(state, `${label(mon)} ${STATUSES[old].cure}`);
  return true;
}

export function addVolatile(state, mon, id, turns, data = {}) {
  if (!mon || mon.fainted || mon.volatiles[id]) return false;
  const def = VOLATILES[id];
  const t = turns ?? (def
    ? (def.turns[0] === def.turns[1] ? def.turns[0] : state.rng.range(def.turns[0], def.turns[1]))
    : 0);
  mon.volatiles[id] = { turns: t, data: { ...data } };
  emit(state, { t: 'volatileStart', side: mon.side, uid: mon.uid, id, turns: t });
  if (def?.start && !def.silent) msg(state, def.start(label(mon)));
  return true;
}

export function removeVolatile(state, mon, id, quiet = false) {
  if (!mon || !mon.volatiles[id]) return false;
  const def = VOLATILES[id];
  delete mon.volatiles[id];
  emit(state, { t: 'volatileEnd', side: mon.side, uid: mon.uid, id });
  if (!quiet && def?.end && !def.silent && !def.silentEnd) msg(state, def.end(label(mon)));
  return true;
}

export function setWeather(state, id, turns = 5, source = null) {
  if (state.field.weather.id === id) return false;
  const def = WEATHERS[id];
  if (!def) return false;
  const prev = state.field.weather;
  if (prev.id !== 'none') emit(state, { t: 'weather', id: prev.id, phase: 'end' });
  state.field.weather = { id, turns, source };
  emit(state, { t: 'weather', id, phase: 'start' });
  msg(state, def.start || '');
  return true;
}

export function setTerrain(state, id, turns = 5) {
  if (state.field.terrain.id === id) return false;
  const def = TERRAINS[id];
  if (!def) return false;
  const prev = state.field.terrain;
  if (prev.id !== 'none') emit(state, { t: 'terrain', id: prev.id, phase: 'end' });
  state.field.terrain = { id, turns };
  emit(state, { t: 'terrain', id, phase: 'start' });
  msg(state, def.start || `The battlefield becomes a ${def.name}!`);
  return true;
}

function clearWeather(state) {
  const w = state.field.weather;
  if (w.id === 'none') return;
  emit(state, { t: 'weather', id: w.id, phase: 'end' });
  msg(state, WEATHERS[w.id]?.end || 'The weather cleared up.');
  state.field.weather = { id: 'none', turns: 0, source: null };
}

function clearTerrain(state) {
  const t = state.field.terrain;
  if (t.id === 'none') return;
  emit(state, { t: 'terrain', id: t.id, phase: 'end' });
  msg(state, TERRAINS[t.id]?.end || 'The field returned to normal.');
  state.field.terrain = { id: 'none', turns: 0 };
}

/* ------------------------------------------------------------------ */
/* fainting                                                            */
/* ------------------------------------------------------------------ */

function checkFaint(state, mon) {
  if (!mon || mon.fainted || mon.hp > 0) return false;
  mon.hp = 0;
  mon.fainted = true;
  state.sides[mon.side].faints++;
  emit(state, { t: 'faint', side: mon.side, uid: mon.uid });
  // Styled, so the presentation layer can weight it. Without this the line falls
  // through to the plain hold and the `faint: 900` entry in the HOLD table is
  // unreachable — measured by a critic as "Jinbe fainted!" holding 0.75s against
  // 1.05s for "Jinbe used Karakusagawara Seiken!", because a plain hold is
  // computed from character count and a KO is a short sentence.
  msg(state, `${label(mon)} fainted!`, 'faint');

  // Destiny Bond only answers a foe's attack — not poison, not a hazard.
  if (mon.volatiles.destinybond && mon.faintCause === 'move') {
    const foe = active(state, 1 - mon.side);
    if (foe && !foe.fainted) {
      msg(state, `${label(mon)} takes ${label(foe)} down with it!`);
      dealDirect(state, foe, foe.hp, 'destinybond');
      checkFaint(state, foe);
    }
  }
  mon.volatiles = {};
  return true;
}

/** Faint anything sitting at 0 HP, in the order it got there. */
function runFaints(state) {
  const down = [];
  for (const s of state.sides) {
    for (const p of s.party) if (!p.fainted && p.hp <= 0) down.push(p);
  }
  if (!down.length) return;
  down.sort((a, b) => (a.faintOrder ?? 0) - (b.faintOrder ?? 0) || (a.side - b.side));
  for (const p of down) checkFaint(state, p);
}

/* ------------------------------------------------------------------ */
/* move legality                                                       */
/* ------------------------------------------------------------------ */

function slotOf(mon, moveId) { return mon.moves.find((m) => m.id === moveId); }

/** Why (if at all) this fighter may not pick this move right now. */
export function moveLegality(state, mon, moveId) {
  const move = getMove(moveId);
  if (!move) return { ok: false, reason: 'unknown' };
  if (moveId === 'struggle') return { ok: true, move };

  const slot = slotOf(mon, moveId);
  if (!slot) return { ok: false, reason: 'unknown' };
  if (slot.pp <= 0) return { ok: false, reason: 'pp', move };
  if (slot.disabled) return { ok: false, reason: 'disabled', move };

  const dis = mon.volatiles.disable;
  if (dis && dis.data.moveId === moveId) return { ok: false, reason: 'disable', move };
  if (mon.volatiles.taunt && move.category === 'status') return { ok: false, reason: 'taunt', move };
  if (mon.volatiles.torment && mon.lastMoveId === moveId) return { ok: false, reason: 'torment', move };

  const enc = mon.volatiles.encore;
  if (enc?.data?.moveId && enc.data.moveId !== moveId) return { ok: false, reason: 'encore', move };

  const foe = active(state, 1 - mon.side);
  if (foe && !foe.fainted && foe.volatiles.imprison && slotOf(foe, moveId)) {
    return { ok: false, reason: 'imprison', move };
  }
  return { ok: true, move };
}

function legalityText(reason, mon, move) {
  const n = label(mon);
  switch (reason) {
    case 'pp':       return `${n} has no PP left for ${move?.name ?? 'that move'}!`;
    case 'disable':
    case 'disabled': return `${move?.name ?? 'That move'} is disabled!`;
    case 'taunt':    return `${n} can't use ${move?.name ?? 'that'} after the taunt!`;
    case 'torment':  return `${n} can't use the same move twice in a row!`;
    case 'encore':   return `${n} must keep going!`;
    case 'imprison': return `${move?.name ?? 'That move'} is sealed!`;
    default:         return `But it failed!`;
  }
}

export function legalMoves(state, side) {
  const mon = active(state, side);
  if (!mon) return ['struggle'];
  const ok = mon.moves.filter((m) => moveLegality(state, mon, m.id).ok).map((m) => m.id);
  return ok.length ? ok : ['struggle'];
}

/* ------------------------------------------------------------------ */
/* turn resolution                                                     */
/* ------------------------------------------------------------------ */

const BRACKET = { run: 4, switch: 3, item: 2, move: 1 };

function normalizeChoice(state, side, choice) {
  const mon = active(state, side);
  if (!mon || mon.fainted) return { kind: 'pass' };
  if (!choice) return { kind: 'move', moveId: legalMoves(state, side)[0] };

  if (choice.kind === 'switch') {
    const opts = legalSwitches(state, side);
    if (opts.includes(choice.toSlot)) return { kind: 'switch', toSlot: choice.toSlot };
    if (opts.length) return { kind: 'switch', toSlot: opts[0] };
    return { kind: 'move', moveId: legalMoves(state, side)[0] };
  }
  if (choice.kind === 'run') return { kind: 'run' };
  if (choice.kind === 'item') {
    const bag = state.sides[side].items || {};
    if (getItem(choice.itemId) && bag[choice.itemId] > 0) return { ...choice };
    return { kind: 'move', moveId: legalMoves(state, side)[0] };
  }

  let moveId = choice.moveId;
  const enc = mon.volatiles.encore;
  if (enc?.data?.moveId) {
    const l = moveLegality(state, mon, enc.data.moveId);
    if (l.ok) moveId = enc.data.moveId;
    else removeVolatile(state, mon, 'encore');
  }
  const legal = legalMoves(state, side);
  if (!legal.includes(moveId)) moveId = legal[0];
  return { kind: 'move', moveId, target: choice.target };
}

function buildActions(state, choices) {
  const acts = [];
  for (let side = 0; side < 2; side++) {
    const choice = normalizeChoice(state, side, choices?.[side]);
    if (choice.kind === 'pass') continue;
    const mon = active(state, side);
    let priority = 0;
    let moveId = null;
    if (choice.kind === 'move') {
      moveId = choice.moveId;
      const mv = getMove(moveId);
      priority = mv?.priority || 0;
      priority = runAbility('modifyPriority', { state, mon, move: mv, value: priority }) ?? priority;
    }
    acts.push({
      side, choice, kind: choice.kind, moveId,
      bracket: BRACKET[choice.kind] ?? 1,
      priority,
      speed: effectiveSpeed(state, mon),
      done: false
    });
  }
  return sortActions(state, acts);
}

function sortActions(state, acts) {
  const tr = state.field.trickRoom > 0;
  const groups = new Map();
  for (const a of acts) {
    const k = `${a.bracket}|${a.priority}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(a);
  }
  const keys = [...groups.keys()].sort((x, y) => {
    const [bx, px] = x.split('|').map(Number);
    const [by, py] = y.split('|').map(Number);
    return (by - bx) || (py - px);
  });
  const out = [];
  for (const k of keys) {
    const g = groups.get(k);
    g.sort((a, b) => (tr ? a.speed - b.speed : b.speed - a.speed) || (a.side - b.side));
    // Genuine speed ties get a coin flip, not "player 1 always wins".
    for (let i = 0; i < g.length - 1; i++) {
      if (g[i].speed === g[i + 1].speed && state.rng.next() < 0.5) {
        const t = g[i]; g[i] = g[i + 1]; g[i + 1] = t;
      }
    }
    out.push(...g);
  }
  return out;
}

export function submitChoices(state, choices) {
  state.turnEvents = [];
  if (state.ended) return state.turnEvents;

  if (state.request[0] === 'switch' || state.request[1] === 'switch') {
    resolveReplacements(state, choices);
    return state.turnEvents;
  }

  state.turn++;
  emit(state, { t: 'turnStart', turn: state.turn });

  for (const s of state.sides) {
    for (const p of s.party) { p.movedThisTurn = false; p.damageTakenThisTurn = 0; p.hitThisTurn = false; }
  }

  state.resume = { actions: buildActions(state, choices), index: 0 };
  runQueue(state);
  return state.turnEvents;
}

function runQueue(state) {
  const q = state.resume;
  if (!q) return;
  while (q.index < q.actions.length) {
    if (state.ended) { state.resume = null; return; }
    const a = q.actions[q.index++];
    if (a.done) continue;
    a.done = true;
    runActionEntry(state, a);
    runFaints(state);
    if (checkBattleEnd(state)) { state.resume = null; return; }
    // A pivot move parked a replacement request: pause and wait for the caller.
    if (state.request[0] === 'switch' || state.request[1] === 'switch') return;
  }
  state.resume = null;
  endOfTurn(state);
  if (checkBattleEnd(state)) return;
  finishTurn(state);
}

function finishTurn(state) {
  emit(state, { t: 'turnEnd', turn: state.turn });
  if (state.turn >= (state.format.maxTurns ?? MAX_TURNS)) { callTheFight(state); return; }
  if (!requestReplacements(state)) state.request = { 0: 'move', 1: 'move' };
}

/** Ask any side with a fallen active for a replacement. Returns true if anyone must. */
function requestReplacements(state) {
  let any = false;
  for (let i = 0; i < 2; i++) {
    const a = active(state, i);
    if (a && a.fainted && replacementOptions(state, i).length) {
      state.request[i] = 'switch'; state.pendingSwitch[i] = true; any = true;
    } else {
      state.request[i] = null; state.pendingSwitch[i] = false;
    }
  }
  return any;
}

function resolveReplacements(state, choices) {
  const midTurn = !!state.resume;
  const pending = [0, 1].filter((i) => state.request[i] === 'switch');
  const order = residualOrder(state).filter((i) => pending.includes(i));

  for (const i of order) {
    const opts = replacementOptions(state, i);
    state.request[i] = null;
    state.pendingSwitch[i] = false;
    if (!opts.length) continue;
    let slot = choices?.[i]?.kind === 'switch' ? choices[i].toSlot : undefined;
    if (!opts.includes(slot)) slot = opts[0];
    if (midTurn) performSwitch(state, i, slot, 'pivot');
    else doSwitchIn(state, i, slot);
    if (state.ended) return;
  }

  runFaints(state);
  if (checkBattleEnd(state)) return;
  // A replacement can drop to hazards on the way in — ask again.
  if (requestReplacements(state)) return;
  if (midTurn) { runQueue(state); return; }
  state.request = { 0: 'move', 1: 'move' };
}

function runActionEntry(state, a) {
  const mon = active(state, a.side);
  if (!mon || mon.fainted) return;

  if (a.kind === 'switch') {
    interceptPursuit(state, a);
    const cur = active(state, a.side);
    if (!cur || cur.fainted || state.ended) return;
    const opts = legalSwitches(state, a.side);
    let slot = a.choice.toSlot;
    if (!opts.includes(slot)) {
      if (!opts.length) { msg(state, `${label(cur)} can't get away!`); return; }
      slot = opts[0];
    }
    performSwitch(state, a.side, slot);
    return;
  }
  if (a.kind === 'item') { useItem(state, a.side, a.choice); return; }
  if (a.kind === 'run') { doRun(state, a.side); return; }
  executeMove(state, a.side, a.moveId, a.choice);
}

/** A pursuit-flagged move fires early, at double power, on the fighter running away. */
function interceptPursuit(state, switchAction) {
  const q = state.resume;
  if (!q) return;
  for (let i = q.index; i < q.actions.length; i++) {
    const other = q.actions[i];
    if (other.done || other.side === switchAction.side || other.kind !== 'move') continue;
    const mv = getMove(other.moveId);
    if (!mv?.flags?.includes('pursuit')) continue;
    const chaser = active(state, other.side);
    if (!chaser || chaser.fainted) continue;
    other.done = true;
    msg(state, `${label(active(state, switchAction.side))} is caught on the way out!`);
    executeMove(state, other.side, other.moveId, other.choice, { pursuit: true });
    runFaints(state);
    return;
  }
}

function doRun(state, side) {
  msg(state, `${sideName(state, side)} fled the battle!`);
  state.ended = true;
  state.winner = 1 - side;
  state.endReason = 'forfeit';
  state.request = { 0: null, 1: null };
  emit(state, { t: 'battleEnd', winner: state.winner, reason: 'forfeit' });
}

function useItem(state, side, choice) {
  const s = state.sides[side];
  const item = getItem(choice.itemId);
  if (!item || !(s.items[choice.itemId] > 0)) { msg(state, 'But it failed!'); return; }
  const target = s.party[choice.targetSlot ?? s.activeIndex];
  if (!target) { msg(state, 'But it failed!'); return; }
  s.items[choice.itemId]--;
  emit(state, { t: 'itemUse', side, uid: target.uid, itemId: item.id, consumed: true });
  msg(state, `${s.name} used a ${item.name}!`);
  item.use?.({
    state, target, side,
    healMon, cureStatus, changeBoost,
    msg: (t) => msg(state, t), emit: (e) => emit(state, e)
  });
  runFaints(state);
}

/* ------------------------------------------------------------------ */
/* move execution                                                      */
/* ------------------------------------------------------------------ */

function canMove(state, mon, move) {
  if (mon.volatiles.recharge) {
    removeVolatile(state, mon, 'recharge', true);
    emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'recharge' });
    msg(state, `${label(mon)} must recharge!`);
    return false;
  }

  if (mon.status === 'slp') {
    if (mon.statusTurns <= 0) cureStatus(state, mon);
    else {
      mon.statusTurns--;
      emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'slp' });
      msg(state, `${label(mon)} is fast asleep.`);
      return false;
    }
  }

  if (mon.status === 'frz') {
    const sun = WEATHERS[state.field.weather.id]?.thawing;
    if (state.rng.chance(THAW_CHANCE) || move?.type === 'FLAME' || sun) cureStatus(state, mon);
    else {
      emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'frz' });
      msg(state, `${label(mon)} is frozen solid!`);
      return false;
    }
  }

  if (mon.volatiles.flinch) {
    removeVolatile(state, mon, 'flinch', true);
    emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'flinch' });
    msg(state, `${label(mon)} flinched!`);
    return false;
  }

  if (mon.volatiles.confusion) {
    const v = mon.volatiles.confusion;
    if (v.turns <= 0) removeVolatile(state, mon, 'confusion');
    else {
      v.turns--;
      msg(state, `${label(mon)} is confused!`);
      if (state.rng.chance(CONFUSION_CHANCE)) {
        const self = computeDamage({
          rng: state.rng,
          move: { type: '???', category: 'physical', power: CONFUSION_POWER, flags: [] },
          user: mon, target: mon, field: state.field,
          foeSide: null, crit: false, typeless: true, ignoreScreens: true
        });
        emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'confusion' });
        msg(state, 'It hurt itself in its confusion!');
        dealDirect(state, mon, self.damage, 'confusion');
        checkFaint(state, mon);
        return false;
      }
    }
  }

  if (mon.status === 'par' && state.rng.chance(PARALYSIS_CHANCE)) {
    emit(state, { t: 'cannotMove', side: mon.side, uid: mon.uid, reason: 'par' });
    msg(state, `${label(mon)} is paralyzed! It can't move!`);
    return false;
  }

  return true;
}

function bypassesSub(move) {
  return !!(move.flags?.includes('bypassSub') || move.flags?.includes('sound'));
}

/** A hit on a substitute. Returns the damage the doll ate. */
function hitSubstitute(state, target, dmg) {
  const sub = target.volatiles.substitute;
  const absorbed = Math.min(sub.data.hp, dmg);
  sub.data.hp -= absorbed;
  emit(state, {
    t: 'substitute', side: target.side, uid: target.uid, phase: 'hit',
    damage: absorbed, hp: Math.max(0, sub.data.hp), maxHp: sub.data.maxHp
  });
  msg(state, `The substitute takes the hit for ${label(target)}!`);
  if (sub.data.hp <= 0) {
    removeVolatile(state, target, 'substitute', true);
    emit(state, { t: 'substitute', side: target.side, uid: target.uid, phase: 'break', hp: 0, maxHp: sub.data.maxHp });
    msg(state, `${label(target)}'s substitute broke!`);
  }
  return absorbed;
}

function protectSuccessOdds(streak) { return 100 / Math.pow(3, Math.max(0, streak)); }

/**
 * Pivot: the user strikes and leaves. Parks a `switch` request for its own side
 * so `runQueue` pauses the turn and the caller can pick a replacement; the rest
 * of the queue resumes afterwards (see `resolveReplacements`, reason 'pivot').
 *
 * Driven either by `flags: ['pivot']` on a damaging move, or by
 * `{ kind:'custom', value:'pivot' }` on any move.
 * @returns {boolean} true if the switch request was actually raised.
 */
function tryPivot(state, user, moveId) {
  if (!user || user.fainted || state.ended) return false;
  if (state.request[user.side] === 'switch') return false;      // already leaving
  if (!legalSwitches(state, user.side).length) return false;    // trapped, or nobody left
  emit(state, { t: 'pivot', side: user.side, uid: user.uid, moveId: moveId ?? user.lastMoveId ?? null });
  msg(state, `${label(user)} breaks off!`);
  state.request[user.side] = 'switch';
  state.request[1 - user.side] = null;
  state.pendingSwitch[user.side] = true;
  return true;
}

export function executeMove(state, side, moveId, choice = {}, opts = {}) {
  const user = active(state, side);
  if (!user || user.fainted) return;
  let move = getMove(moveId);
  if (!move) { msg(state, 'But nothing happened!'); return; }

  if (!canMove(state, user, move)) { user.lastMoveFailed = true; return; }

  // Destiny Bond only covers the turn it was called.
  if (user.volatiles.destinybond && moveId !== user.volatiles.destinybond.data?.moveId) {
    removeVolatile(state, user, 'destinybond', true);
  }

  // --- two-turn charge moves ---------------------------------------
  const chargeFlag = move.flags?.includes('charge');
  if (chargeFlag && !user.volatiles.charging) {
    addVolatile(state, user, 'charging', 1, { moveId });
    emit(state, { t: 'prepare', side, uid: user.uid, moveId, text: move.chargeText || `${label(user)} is winding up!` });
    msg(state, move.chargeText || `${label(user)} is winding up!`);
    return;
  }
  if (user.volatiles.charging) removeVolatile(state, user, 'charging', true);

  // --- legality & PP ------------------------------------------------
  // The queue already picked a legal move; this catches state that changed
  // mid-turn (a foe's Disable, Imprison or Torment landing first).
  if (moveId !== 'struggle') {
    const legal = moveLegality(state, user, moveId);
    if (!legal.ok) {
      emit(state, { t: 'cannotMove', side, uid: user.uid, reason: legal.reason, moveId });
      msg(state, legalityText(legal.reason, user, move));
      user.lastMoveFailed = true;
      return;
    }
    slotOf(user, moveId).pp--;
  }

  user.lastMoveId = moveId;
  user.movedThisTurn = true;
  user.lastMoveFailed = false;
  if (!isProtectMove(move)) { user.protectStreak = 0; user.endureStreak = 0; }

  const selfTargeted = move.target === 'self' || move.target === 'allySide';
  const target = selfTargeted ? user : active(state, 1 - side);

  emit(state, {
    t: 'moveUsed', side, uid: user.uid, moveId,
    targetSide: target ? target.side : side, targetUid: target ? target.uid : user.uid,
    moveName: move.name, moveType: move.type, category: move.category, fx: move.fx || null,
    pursuit: !!opts.pursuit
  });
  msg(state, `${label(user)} used ${move.name}!`);

  if (!target || (target.fainted && target !== user)) { msg(state, 'But there was no target!'); return; }

  // --- protection ---------------------------------------------------
  if (target !== user && target.volatiles.protect && move.flags?.includes('protect')) {
    emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'protect' });
    msg(state, `${label(target)} protected itself!`);
    return;
  }

  // --- Mind Field turns away priority -------------------------------
  const ter = TERRAINS[state.field.terrain.id];
  if (ter?.blocksPriority && target !== user && (move.priority || 0) > 0 && isGrounded(target)) {
    emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'terrain' });
    msg(state, `The field's hum shields ${label(target)}!`);
    return;
  }

  /* ---------------- status / field moves ---------------- */
  if (move.category === 'status') {
    if (target !== user) {
      if (target.volatiles.substitute && !bypassesSub(move) && affectsTargetDirectly(move)) {
        emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'substitute' });
        msg(state, `${label(target)}'s substitute blocked it!`);
        return;
      }
      if (!accuracyCheck(state.rng, move, user, target, state.field, accuracyOpts(state, user, move))) {
        emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'accuracy' });
        msg(state, `${label(user)}'s attack missed!`);
        user.lastMoveFailed = true;
        return;
      }
    }
    const r = applyEffects(state, move, user, target, 0, true);
    if (!r.did && !r.spoke) { msg(state, 'But it failed!'); user.lastMoveFailed = true; }
    runFaints(state);
    return;
  }

  /* ---------------- damaging moves ---------------- */
  const eff = typeEff(move.type, target.types);
  if (eff === 0 && moveId !== 'struggle') {
    emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'immune' });
    msg(state, `It doesn't affect ${label(target)}…`);
    user.lastMoveFailed = true;
    return;
  }
  if (move.type === 'EARTH' && !isGrounded(target)) {
    emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'immune' });
    msg(state, `${label(target)} is out of reach!`);
    user.lastMoveFailed = true;
    return;
  }

  if (!accuracyCheck(state.rng, move, user, target, state.field, accuracyOpts(state, user, move))) {
    emit(state, { t: 'miss', side, uid: user.uid, targetUid: target.uid, reason: 'accuracy' });
    msg(state, `${label(user)}'s attack missed!`);
    user.lastMoveFailed = true;
    return;
  }

  // hit count — each hit rolls damage and crit independently
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

  const behindSub = () => target.volatiles.substitute && !bypassesSub(move) && target !== user;

  let totalDamage = 0;      // damage that actually touched the target
  let subDamage = 0;        // damage soaked by a substitute
  let anyCrit = false;
  let landed = 0;

  for (let h = 0; h < hits; h++) {
    if (target.fainted || state.ended) break;
    const soaked = behindSub();
    const crit = critCheck(state.rng, move, user, { neverCrit: soaked });
    if (crit) anyCrit = true;

    const res = computeDamage({
      rng: state.rng, move, user, target, field: state.field,
      side: state.sides[side], foeSide: state.sides[target.side], crit,
      powerMod: opts.pursuit ? 2 : 1,
      ignoreDefBoosts: move.ignoreDefBoosts || false
    });

    let dmg = res.damage;
    dmg = runAbility('modifyDamage', { state, mon: user, target, move, value: dmg }) ?? dmg;
    dmg = runAbility('modifyDamageTaken', { state, mon: target, attacker: user, move, value: dmg }) ?? dmg;
    dmg = runItemHook('modifyDamage', { state, mon: user, target, move, value: dmg }) ?? dmg;
    dmg = Math.max(1, Math.floor(dmg));

    if (soaked) {
      subDamage += hitSubstitute(state, target, dmg);
      landed++;
      continue;
    }

    let endured = false;
    if (target.volatiles.endure && dmg >= target.hp) {
      dmg = Math.max(0, target.hp - 1);
      endured = true;
    }

    const dealt = dealDirect(state, target, dmg, 'move', { eff: res.eff, crit, hits });
    totalDamage += dealt;
    landed++;
    if (endured) msg(state, `${label(target)} endured the hit!`);
    if (target.hp <= 0) break;
  }

  if (hits > 1 && landed > 0) msg(state, `Hit ${landed} time${landed === 1 ? '' : 's'}!`);
  if (anyCrit) msg(state, 'A critical hit!', 'crit');
  if (landed > 0) {
    const et = effText(eff, label(target));
    if (et) msg(state, et, eff > 1 ? 'super' : 'weak');
  }

  const damageForDrain = totalDamage + subDamage;

  // --- drain / recoil ------------------------------------------------
  if (move.drain && damageForDrain > 0 && !user.fainted) {
    const got = healMon(state, user, Math.max(1, Math.floor(damageForDrain * move.drain)), 'drain');
    if (got > 0) msg(state, `${label(user)} drained health!`);
  }
  if (move.recoil && (damageForDrain > 0 || moveId === 'struggle')) {
    const r = moveId === 'struggle'
      ? Math.max(1, Math.floor(user.maxHp / 4))
      : Math.max(1, Math.floor(damageForDrain * move.recoil));
    msg(state, `${label(user)} is hit by recoil!`);
    dealDirect(state, user, r, 'recoil');
  }

  // --- contact ---------------------------------------------------------
  if (move.contact && !target.fainted && totalDamage > 0 && !user.fainted) {
    runAbility('onContact', {
      state, mon: target, attacker: user, move,
      emit: (e) => emit(state, e), msg: (t) => msg(state, t)
    });
  }

  // --- secondary effects ------------------------------------------------
  if (!state.ended) applyEffects(state, move, user, target, totalDamage, false, { behindSub: behindSub() });

  if (move.flags?.includes('recharge') && !user.fainted) addVolatile(state, user, 'recharge', 1);

  runFaints(state);

  // --- pivot: strike and leave -----------------------------------------
  if (move.flags?.includes('pivot') && landed > 0) tryPivot(state, user, moveId);
}

function isProtectMove(move) {
  return !!move.effects?.some((e) => e.kind === 'volatile' && (e.value === 'protect' || e.value === 'endure'));
}

/** Does this status move actually reach into the target (vs. hitting its side)? */
function affectsTargetDirectly(move) {
  return move.target === 'foe';
}

function accuracyOpts(state, user, move) {
  const o = {};
  const ab = user.ability;
  if (ab === 'perfect_edge' && move.flags?.includes('slice')) o.alwaysHits = true;
  if (ab === 'weather_read') { o.ignoreWeatherAcc = true; o.ignoreEvasion = true; }
  const r = runAbility('modifyAccuracy', { state, mon: user, move, value: null });
  if (typeof r === 'number') o.accMod = r;
  return o;
}

/* ------------------------------------------------------------------ */
/* move effects                                                        */
/* ------------------------------------------------------------------ */

/**
 * Effect kinds that act on the field or on a *side*, not on a combatant.
 * They resolve even if the fighter that would have been the "target" is down —
 * a hazard-removal attack that silently fails because it landed a KO is a rules
 * surprise, not a rule.
 */
const FIELD_EFFECTS = new Set(['weather', 'terrain', 'hazard', 'screen', 'clearHazards', 'trickRoom']);

/** @returns {{did:boolean, spoke:boolean}} did = state changed, spoke = a line was printed. */
function applyEffects(state, move, user, target, damageDealt, isStatusMove, ctx = {}) {
  if (!move.effects) return { did: false, spoke: false };
  let did = false;
  let spoke = false;

  for (const e of move.effects) {
    if (state.ended) break;
    const chance = e.chance ?? 100;
    if (chance < 100 && !state.rng.chance(chance)) continue;

    const toSelf = e.target === 'self' || e.target === 'allySide';
    const tgt = toSelf ? user : target;
    const fieldWide = FIELD_EFFECTS.has(e.kind);
    if (!fieldWide) {
      if (!tgt) continue;
      if (tgt.fainted && !toSelf) continue;
      if (user.fainted && toSelf) continue;
      // A substitute swallows anything aimed through it.
      if (!toSelf && tgt.volatiles.substitute && !bypassesSub(move) &&
          ['status', 'boost', 'volatile', 'cure'].includes(e.kind)) continue;
    }

    const mark = state.events.length;
    switch (e.kind) {
      case 'status':
        if (applyStatus(state, tgt, e.value, toSelf ? 'self' : 'move', { byFoe: !toSelf, loud: isStatusMove })) did = true;
        break;

      case 'cure':
        if (cureStatus(state, tgt)) did = true;
        break;

      case 'boost':
        for (const [k, v] of Object.entries(e.stats)) {
          if (changeBoost(state, tgt, k, v, 'move', { byFoe: !toSelf })) did = true;
        }
        break;

      case 'volatile':
        if (applyVolatileEffect(state, move, user, tgt, e, toSelf)) did = true;
        break;

      case 'heal': {
        const w = WEATHERS[state.field.weather.id];
        const frac = (e.frac ?? 0.5) * (w?.healMod && e.weatherScaled ? w.healMod : 1);
        const got = healMon(state, tgt, Math.floor(tgt.maxHp * frac), 'move');
        if (got > 0) { msg(state, `${label(tgt)} regained health!`); did = true; }
        break;
      }

      case 'weather':
        if (setWeather(state, e.value, e.turns ?? 5, user.uid)) did = true;
        break;

      case 'terrain':
        if (setTerrain(state, e.value, e.turns ?? 5)) did = true;
        break;

      case 'hazard': {
        const s = state.sides[e.target === 'allySide' ? user.side : 1 - user.side];
        const def = HAZARDS[e.value];
        const max = def?.maxLayers ?? 1;
        const cur = s.hazards[e.value] || 0;
        if (cur >= max) break;
        s.hazards[e.value] = cur + 1;
        emit(state, { t: 'hazard', side: s.index, id: e.value, layers: s.hazards[e.value], phase: 'set' });
        msg(state, def?.setMsg ? def.setMsg(s.name) : `${def?.name ?? e.value} scattered around ${s.name}'s side!`);
        did = true;
        break;
      }

      case 'clearHazards': {
        const s = state.sides[user.side];
        if (!Object.keys(s.hazards).length) break;
        s.hazards = {};
        emit(state, { t: 'hazard', side: s.index, id: 'all', layers: 0, phase: 'clear' });
        msg(state, 'The hazards were blown away!');
        did = true;
        break;
      }

      case 'screen': {
        const s = state.sides[e.target === 'foeSide' ? 1 - user.side : user.side];
        const def = SCREENS[e.value];
        if (s.screens[e.value]?.turns > 0) break;
        s.screens[e.value] = { turns: e.turns ?? def?.turns ?? 5 };
        emit(state, { t: 'screen', side: s.index, id: e.value, turns: s.screens[e.value].turns, phase: 'start' });
        msg(state, def?.start ? def.start(s.name) : `${def?.name ?? e.value} shielded ${s.name}'s side!`);
        did = true;
        break;
      }

      case 'trickRoom':
        if (state.field.trickRoom > 0) {
          state.field.trickRoom = 0;
          msg(state, 'The dimensions returned to normal.');
        } else {
          state.field.trickRoom = e.turns ?? 5;
          msg(state, 'The dimensions twist!');
        }
        emit(state, { t: 'trickRoom', turns: state.field.trickRoom });
        did = true;
        break;

      case 'custom':
        if (runCustom(state, e.value, { move, user, target: tgt, damageDealt, effect: e })) did = true;
        break;

      default:
        break;
    }
    for (let i = mark; i < state.events.length; i++) {
      if (state.events[i].t === 'message') { spoke = true; break; }
    }
  }
  return { did, spoke };
}

function applyVolatileEffect(state, move, user, tgt, e, toSelf) {
  const id = e.value;

  if (id === 'protect' || id === 'endure') {
    const streak = id === 'protect' ? user.protectStreak : user.endureStreak;
    if (streak > 0 && !state.rng.chance(protectSuccessOdds(streak))) {
      user.protectStreak = 0; user.endureStreak = 0;
      return false;
    }
    if (!addVolatile(state, tgt, id, 1)) return false;
    if (id === 'protect') { user.protectStreak = streak + 1; msg(state, `${label(tgt)} braced itself!`); }
    else { user.endureStreak = streak + 1; msg(state, `${label(tgt)} dug in!`); }
    return true;
  }

  if (id === 'substitute') {
    const cost = Math.floor(tgt.maxHp / 4);
    if (tgt.volatiles.substitute) { msg(state, `${label(tgt)} already has a substitute!`); return false; }
    if (cost < 1 || tgt.hp <= cost) { msg(state, `${label(tgt)} doesn't have the strength to spare!`); return false; }
    dealDirect(state, tgt, cost, 'substitute');
    addVolatile(state, tgt, 'substitute', 0, { hp: cost, maxHp: cost });
    emit(state, { t: 'substitute', side: tgt.side, uid: tgt.uid, phase: 'start', hp: cost, maxHp: cost });
    msg(state, `${label(tgt)} put up a substitute!`);
    return true;
  }

  if (id === 'disable') {
    const last = tgt.lastMoveId;
    if (!last || !slotOf(tgt, last) || tgt.volatiles.disable) { return false; }
    if (!addVolatile(state, tgt, 'disable', e.turns, { moveId: last })) return false;
    msg(state, `${getMove(last)?.name ?? 'That move'} was sealed off!`);
    return true;
  }

  if (id === 'encore') {
    const last = tgt.lastMoveId;
    if (!last || !slotOf(tgt, last) || slotOf(tgt, last).pp <= 0 || tgt.volatiles.encore) return false;
    return addVolatile(state, tgt, 'encore', e.turns, { moveId: last });
  }

  if (id === 'leechseed') {
    if (tgt.volatiles.leechseed) { msg(state, `${label(tgt)} is already seeded!`); return false; }
    if (tgt.types.includes('TOXIN')) { msg(state, `It doesn't affect ${label(tgt)}…`); return false; }
    return addVolatile(state, tgt, 'leechseed', 0, { by: user.side });
  }

  if (id === 'perish') {
    // Perish Song catches everyone on the field.
    let any = false;
    for (const i of [0, 1]) {
      const m = active(state, i);
      if (!m || m.fainted || m.volatiles.perish) continue;
      if (addVolatile(state, m, 'perish', e.turns)) { any = true; }
    }
    if (any) msg(state, 'All fighters that heard the song will faint in three turns!');
    return any;
  }

  if (id === 'destinybond') {
    if (!addVolatile(state, user, 'destinybond', 1, { moveId: move.id })) return false;
    return true;
  }

  if (id === 'imprison') {
    return addVolatile(state, user, 'imprison', 0);
  }

  if (id === 'yawn') {
    if (tgt.status || tgt.volatiles.yawn) return false;
    return addVolatile(state, tgt, 'yawn', e.turns);
  }

  if (id === 'confusion') {
    if (tgt.volatiles.confusion) { msg(state, `${label(tgt)} is already confused!`); return false; }
    return addVolatile(state, tgt, 'confusion', e.turns);
  }

  if (id === 'minimized') {
    return addVolatile(state, tgt, 'minimized', 0);
  }

  return addVolatile(state, tgt, id, e.turns);
}

/* ------------------------------------------------------------------ */
/* custom handlers                                                     */
/* ------------------------------------------------------------------ */

const CUSTOM = {
  seismic: ({ state, user, target }) => {
    if (typeEff('FIST', target.types) === 0) { msg(state, `It doesn't affect ${label(target)}…`); return false; }
    dealDirect(state, target, user.level, 'move'); return true;
  },
  halfhp: ({ state, target }) => {
    if (target.hp <= 1) return false;
    dealDirect(state, target, Math.max(1, Math.floor(target.hp / 2)), 'move'); return true;
  },
  ohko: ({ state, target }) => {
    dealDirect(state, target, target.hp, 'move');
    msg(state, 'It was a one-hit KO!'); return true;
  },
  painsplit: ({ state, user, target }) => {
    const each = Math.floor((user.hp + target.hp) / 2);
    for (const m of [user, target]) {
      const want = Math.min(m.maxHp, each);
      if (want > m.hp) healMon(state, m, want - m.hp, 'painsplit');
      else if (want < m.hp) dealDirect(state, m, m.hp - want, 'painsplit');
    }
    msg(state, 'The pain was shared!'); return true;
  },
  swapboosts: ({ state, user, target }) => {
    const t = user.boosts; user.boosts = target.boosts; target.boosts = t;
    emit(state, { t: 'boost', side: user.side, uid: user.uid, stat: 'all', delta: 0, stage: 0, failed: false, source: 'swap' });
    emit(state, { t: 'boost', side: target.side, uid: target.uid, stat: 'all', delta: 0, stage: 0, failed: false, source: 'swap' });
    msg(state, 'The fighters traded their momentum!'); return true;
  },
  clearboosts: ({ state, target }) => {
    target.boosts = emptyBoosts();
    emit(state, { t: 'boost', side: target.side, uid: target.uid, stat: 'all', delta: 0, stage: 0, failed: false, source: 'clear' });
    msg(state, 'All stat changes were eliminated!'); return true;
  },
  clearHazards: ({ state, user }) => {
    const s = state.sides[user.side];
    if (!Object.keys(s.hazards).length) return false;
    s.hazards = {};
    emit(state, { t: 'hazard', side: s.index, id: 'all', layers: 0, phase: 'clear' });
    msg(state, 'The hazards were blown away!'); return true;
  },
  pivot: ({ state, user, move }) => tryPivot(state, user, move?.id)
};

function runCustom(state, id, ctx) {
  const fn = CUSTOM[id];
  if (!fn) return false;
  return fn({ state, ...ctx }) !== false;
}

/* ------------------------------------------------------------------ */
/* end of turn                                                         */
/* ------------------------------------------------------------------ */

function endOfTurn(state) {
  const order = residualOrder(state);

  /* --- weather ----------------------------------------------------- */
  const w = state.field.weather;
  if (w.id !== 'none') {
    const def = WEATHERS[w.id];
    emit(state, { t: 'weather', id: w.id, phase: 'upkeep', turns: w.turns });
    if (def?.chipFrac) {
      for (const side of order) {
        const mon = active(state, side);
        if (!mon || mon.fainted) continue;
        if (def.chipImmune?.some((t) => mon.types.includes(t))) continue;
        if (runAbility('weatherImmune', { state, mon, weather: w.id, value: false }) === true) continue;
        if (mon.ability === 'sand_body' && w.id === 'sandstorm') continue;
        msg(state, def.chipMsg ? def.chipMsg(label(mon)) : `${label(mon)} is buffeted by the ${def.name.toLowerCase()}!`);
        dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp * def.chipFrac)), 'weather');
        checkFaint(state, mon);
      }
    }
    w.turns--;
    if (w.turns <= 0) clearWeather(state);
  }
  if (checkBattleEnd(state)) return;

  /* --- terrain ------------------------------------------------------ */
  const ter = state.field.terrain;
  if (ter.id !== 'none') {
    const def = TERRAINS[ter.id];
    emit(state, { t: 'terrain', id: ter.id, phase: 'upkeep', turns: ter.turns });
    if (def?.heal) {
      for (const side of order) {
        const mon = active(state, side);
        if (!mon || mon.fainted || !isGrounded(mon) || mon.hp >= mon.maxHp) continue;
        healMon(state, mon, Math.max(1, Math.floor(mon.maxHp * def.heal)), 'terrain');
        msg(state, `${label(mon)} draws strength from the field.`);
      }
    }
    ter.turns--;
    if (ter.turns <= 0) clearTerrain(state);
  }

  /* --- per-fighter residuals ---------------------------------------- */
  for (const side of order) {
    if (state.ended) return;
    const mon = active(state, side);
    if (!mon || mon.fainted) continue;
    mon.turnsActive++;

    // roots and rings first, then chip, so a fighter can out-heal a tick
    if (mon.volatiles.rooted && mon.hp < mon.maxHp) {
      healMon(state, mon, Math.max(1, Math.floor(mon.maxHp / 16)), 'rooted');
      msg(state, `${label(mon)} drinks through its roots.`);
    }
    if (mon.volatiles.aqua_ring && mon.hp < mon.maxHp) {
      healMon(state, mon, Math.max(1, Math.floor(mon.maxHp / 16)), 'aqua_ring');
      msg(state, `${label(mon)}'s veil of water restores it.`);
    }

    runItemHook('onResidual', { state, mon, healMon, dealDirect, msg: (t) => msg(state, t), emit: (e) => emit(state, e) });
    runAbility('onResidual', { state, mon, healMon, dealDirect, msg: (t) => msg(state, t), emit: (e) => emit(state, e) });
    runFaints(state);
    if (mon.fainted) continue;

    // leech seed
    if (mon.volatiles.leechseed) {
      const foe = active(state, 1 - side);
      msg(state, `${label(mon)}'s health is sapped!`);
      const drained = dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp / 8)), 'leechseed');
      if (foe && !foe.fainted && drained > 0) healMon(state, foe, drained, 'leechseed');
      checkFaint(state, mon);
      if (mon.fainted) continue;
    }

    // status chip
    const sdef = STATUSES[mon.status];
    if (sdef?.residual) {
      const frac = mon.status === 'tox' ? sdef.residual * mon.toxicCounter : sdef.residual;
      msg(state, sdef.residualMsg(label(mon)));
      dealDirect(state, mon, Math.max(1, Math.floor(mon.maxHp * frac)), mon.status === 'brn' ? 'burn' : 'poison');
      if (mon.status === 'tox') mon.toxicCounter = Math.min(15, mon.toxicCounter + 1);
      checkFaint(state, mon);
      if (mon.fainted) continue;
    }

    // yawn → sleep
    if (mon.volatiles.yawn) {
      const v = mon.volatiles.yawn;
      v.turns--;
      if (v.turns <= 0) {
        removeVolatile(state, mon, 'yawn', true);
        applyStatus(state, mon, 'slp', 'move', { byFoe: true });
      }
    }

    // perish song
    if (mon.volatiles.perish) {
      const v = mon.volatiles.perish;
      v.turns--;
      emit(state, { t: 'perish', side: mon.side, uid: mon.uid, count: Math.max(0, v.turns) });
      if (v.turns <= 0) {
        msg(state, `${label(mon)}'s perish count fell to 0!`);
        removeVolatile(state, mon, 'perish', true);
        dealDirect(state, mon, mon.hp, 'perish');
        checkFaint(state, mon);
        continue;
      }
      msg(state, `${label(mon)}'s perish count fell to ${v.turns}!`);
    }

    // timers
    tickVolatiles(state, mon);
    runFaints(state);
  }
  if (checkBattleEnd(state)) return;

  /* --- side screens -------------------------------------------------- */
  for (const s of state.sides) {
    for (const [id, sc] of Object.entries(s.screens)) {
      sc.turns--;
      if (sc.turns <= 0) {
        delete s.screens[id];
        emit(state, { t: 'screen', side: s.index, id, turns: 0, phase: 'end' });
        const def = SCREENS[id];
        msg(state, def?.end ? def.end(s.name) : `${def?.name ?? id} wore off on ${s.name}'s side.`);
      }
    }
  }

  /* --- trick room ----------------------------------------------------- */
  if (state.field.trickRoom > 0) {
    state.field.trickRoom--;
    if (state.field.trickRoom === 0) {
      emit(state, { t: 'trickRoom', turns: 0 });
      msg(state, 'The dimensions returned to normal.');
    }
  }
}

const UNTICKED = new Set(['confusion', 'charging', 'recharge', 'yawn', 'perish', 'substitute',
                          'leechseed', 'rooted', 'aqua_ring', 'imprison', 'torment',
                          'focusenergy', 'minimized', 'future_dodge']);

function tickVolatiles(state, mon) {
  for (const [id, v] of Object.entries(mon.volatiles)) {
    if (UNTICKED.has(id)) continue;
    if (v.turns > 0) { v.turns--; if (v.turns <= 0) removeVolatile(state, mon, id); }
  }
  // Single-turn guards never survive the turn they were raised in.
  if (mon.volatiles.protect) removeVolatile(state, mon, 'protect', true);
  if (mon.volatiles.endure) removeVolatile(state, mon, 'endure', true);
  if (mon.volatiles.flinch) removeVolatile(state, mon, 'flinch', true);
  if (mon.volatiles.destinybond) removeVolatile(state, mon, 'destinybond', true);
  if (!mon.movedThisTurn) { mon.protectStreak = 0; mon.endureStreak = 0; }
}

/* ------------------------------------------------------------------ */
/* end conditions                                                      */
/* ------------------------------------------------------------------ */

function endBattle(state, winner, reason) {
  state.ended = true;
  state.winner = winner;
  state.endReason = reason;
  state.request = { 0: null, 1: null };
  state.resume = null;
  if (winner === 'draw') msg(state, 'Both crews are down — the battle is a draw!');
  else {
    // "You wins!" — side 0 is named "You" in single-player, so the victory line
    // has to agree with its own subject.
    const n = state.sides[winner].name;
    msg(state, n === 'You' ? 'You win!' : `${n} wins!`);
  }
  emit(state, { t: 'battleEnd', winner, reason });
}

function checkBattleEnd(state) {
  if (state.ended) return true;
  const a0 = aliveCount(state.sides[0]);
  const a1 = aliveCount(state.sides[1]);
  if (a0 > 0 && a1 > 0) return false;
  endBattle(state, a0 === 0 && a1 === 0 ? 'draw' : (a0 === 0 ? 1 : 0), 'knockout');
  return true;
}

/** The clock ran out: most fighters standing, then most HP left, then a draw. */
function callTheFight(state) {
  msg(state, 'Neither crew will yield — the fight is called.');
  const alive = state.sides.map((s) => aliveCount(s));
  if (alive[0] !== alive[1]) { endBattle(state, alive[0] > alive[1] ? 0 : 1, 'timeout'); return; }
  const hp = state.sides.map((s) => s.party.reduce((a, p) => a + p.hp / p.maxHp, 0));
  if (Math.abs(hp[0] - hp[1]) > 1e-9) { endBattle(state, hp[0] > hp[1] ? 0 : 1, 'timeout'); return; }
  endBattle(state, 'draw', 'timeout');
}

/* ------------------------------------------------------------------ */

export { publicView, active };
export function forceSwitch(state, side, toSlot) { doSwitchIn(state, side, toSlot); }
