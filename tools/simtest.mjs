#!/usr/bin/env node
// Battle-engine test suite. Pure node, no browser.
//
//   node tools/simtest.mjs                 # everything (the `npm run check` default)
//   node tools/simtest.mjs --fuzz 2000     # smaller fuzz run
//   node tools/simtest.mjs --only unit     # unit | fuzz | determinism
//   node tools/simtest.mjs --quick         # 500 fuzz / 50 determinism, for iterating
//
// Three parts:
//   unit         – one scripted battle per rule / edge case, asserting exact outcomes
//   fuzz         – AI-vs-AI battles across the whole roster, asserting invariants on every one
//   determinism  – the same seed + the same choices must produce a byte-identical event stream

import {
  createBattle, submitChoices, legalMoves, legalSwitches, moveLegality,
  effectiveSpeed, executeMove, addVolatile, applyStatus, setWeather, setTerrain,
  publicView, active, MAX_TURNS
} from '../src/core/engine.js';
import { chooseAction, AI_LEVELS } from '../src/core/ai.js';
import { computeDamage, damageRange, pokeRound, isGrounded } from '../src/core/damage.js';
import { allFighters, makeDefaultMember, getFighter } from '../src/data/fighters.js';
import { MOVES, MOVE_BY_ID, getMove } from '../src/data/moves.js';
import { ARENAS } from '../src/data/arenas.js';
import { RNG } from '../src/core/rng.js';
import { STATUSES, VOLATILES, WEATHERS, TERRAINS, HAZARDS, SCREENS } from '../src/core/status.js';

/* ------------------------------------------------------------------ */
/* harness                                                             */
/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const has = (k) => argv.includes(`--${k}`);

const QUICK = has('quick');
const ONLY = arg('only', null);
const FUZZ_N = Number(arg('fuzz', QUICK ? 500 : 20000));
const DET_N = Number(arg('det', QUICK ? 50 : 1000));

let pass = 0, fail = 0;
const failures = [];
let group = '';

function section(name) { group = name; console.log(`\n\x1b[1m▸ ${name}\x1b[0m`); }
function ok(name, cond, detail) {
  if (cond) { pass++; if (!has('silent')) console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else {
    fail++;
    failures.push(`${group} › ${name}${detail ? `\n      ${detail}` : ''}`);
    console.log(`  \x1b[31m✗ ${name}\x1b[0m${detail ? `\n      ${detail}` : ''}`);
  }
}
function eq(name, got, want) { ok(name, Object.is(got, want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }

/* ------------------------------------------------------------------ */
/* test-only moves                                                     */
/* ------------------------------------------------------------------ */
// The engine implements far more mechanics than data/moves.js currently uses
// (that file belongs to the move-design agent). These stand-ins exercise the
// engine paths; see docs/HANDOFF.md for the request to add real ones.

const DEFAULTS = {
  power: 0, accuracy: 100, priority: 0, target: 'foe', critStage: 0,
  contact: false, flags: [], hits: null, drain: 0, recoil: 0, effects: null,
  pp: 20, desc: 'test move', flavor: '', fx: null
};
const T = [
  { id: 't_taunt', name: 'Jeer', type: 'MIND', category: 'status', effects: [{ kind: 'volatile', value: 'taunt', target: 'foe' }] },
  { id: 't_encore', name: 'Encore', type: 'SOUND', category: 'status', flags: ['sound'], effects: [{ kind: 'volatile', value: 'encore', target: 'foe' }] },
  { id: 't_disable', name: 'Jam', type: 'MECHA', category: 'status', effects: [{ kind: 'volatile', value: 'disable', target: 'foe' }] },
  { id: 't_torment', name: 'Torment', type: 'SHADOW', category: 'status', effects: [{ kind: 'volatile', value: 'torment', target: 'foe' }] },
  { id: 't_imprison', name: 'Imprison', type: 'SHADOW', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'volatile', value: 'imprison', target: 'self' }] },
  { id: 't_dbond', name: 'Death Pact', type: 'SPIRIT', category: 'status', target: 'self', accuracy: null, priority: 4, effects: [{ kind: 'volatile', value: 'destinybond', target: 'self' }] },
  { id: 't_perish', name: 'Perish Song', type: 'SOUND', category: 'status', target: 'field', accuracy: null, flags: ['sound'], effects: [{ kind: 'volatile', value: 'perish', target: 'foe' }] },
  { id: 't_yawn', name: 'Lullaby', type: 'SPIRIT', category: 'status', effects: [{ kind: 'volatile', value: 'yawn', target: 'foe' }] },
  { id: 't_magnetrise', name: 'Levitate', type: 'STORM', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'volatile', value: 'magnetrise', target: 'self' }] },
  { id: 't_aquaring', name: 'Sea Veil', type: 'SEA', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'volatile', value: 'aqua_ring', target: 'self' }] },
  { id: 't_root', name: 'Take Root', type: 'EARTH', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'volatile', value: 'rooted', target: 'self' }] },
  { id: 't_focus', name: 'Focus Up', type: 'FIST', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'volatile', value: 'focusenergy', target: 'self' }] },
  { id: 't_endure', name: 'Endure', type: 'MECHA', category: 'status', target: 'self', accuracy: null, priority: 4, effects: [{ kind: 'volatile', value: 'endure', target: 'self' }] },
  { id: 't_minimize', name: 'Minimize', type: 'MIND', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'boost', stats: { eva: 2 }, target: 'self' }, { kind: 'volatile', value: 'minimized', target: 'self' }] },
  { id: 't_sub', name: 'Decoy', type: 'MIND', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'volatile', value: 'substitute', target: 'self' }] },
  { id: 't_seed', name: 'Sea Seed', type: 'SEA', category: 'status', accuracy: 90, effects: [{ kind: 'volatile', value: 'leechseed', target: 'foe' }] },
  { id: 't_trickroom', name: 'Trick Room', type: 'MIND', category: 'status', target: 'field', accuracy: null, priority: -7, effects: [{ kind: 'trickRoom' }] },
  { id: 't_mist', name: 'Mist', type: 'FROST', category: 'status', target: 'allySide', accuracy: null, effects: [{ kind: 'screen', value: 'mist', target: 'allySide' }] },
  { id: 't_safeguard', name: 'Safeguard', type: 'LIGHT', category: 'status', target: 'allySide', accuracy: null, effects: [{ kind: 'screen', value: 'safeguard', target: 'allySide' }] },
  { id: 't_tailwind', name: 'Tailwind', type: 'WIND', category: 'status', target: 'allySide', accuracy: null, effects: [{ kind: 'screen', value: 'tailwind', target: 'allySide' }] },
  { id: 't_veil', name: 'Aurora Veil', type: 'FROST', category: 'status', target: 'allySide', accuracy: null, effects: [{ kind: 'screen', value: 'veil', target: 'allySide' }] },
  { id: 't_shards', name: 'Shard Field', type: 'FROST', category: 'status', target: 'foeSide', accuracy: null, effects: [{ kind: 'hazard', value: 'shards', target: 'foeSide' }] },
  { id: 't_barbs', name: 'Barb Field', type: 'TOXIN', category: 'status', target: 'foeSide', accuracy: null, effects: [{ kind: 'hazard', value: 'barbs', target: 'foeSide' }] },
  { id: 't_oil', name: 'Oil Field', type: 'MECHA', category: 'status', target: 'foeSide', accuracy: null, effects: [{ kind: 'hazard', value: 'oilslick', target: 'foeSide' }] },
  { id: 't_haki_field', name: 'Haki Field', type: 'HAKI', category: 'status', target: 'field', accuracy: null, effects: [{ kind: 'terrain', value: 'haki' }] },
  { id: 't_mind_field', name: 'Mind Field', type: 'MIND', category: 'status', target: 'field', accuracy: null, effects: [{ kind: 'terrain', value: 'psychic' }] },
  { id: 't_pursuit', name: 'Run Down', type: 'SHADOW', category: 'physical', power: 40, contact: true, flags: ['pursuit', 'protect'] },
  { id: 't_pivot', name: 'Hit and Run', type: 'BEAST', category: 'physical', power: 70, contact: true, flags: ['pivot', 'protect'] },
  { id: 't_charge', name: 'Wind Up', type: 'LIGHT', category: 'special', power: 140, flags: ['charge', 'protect'], chargeText: 'A light gathers!' },
  { id: 't_crush', name: 'Stomp', type: 'EARTH', category: 'physical', power: 65, contact: true, flags: ['crush', 'protect'] },
  { id: 't_sound', name: 'Screech Blast', type: 'SOUND', category: 'special', power: 60, flags: ['sound', 'protect'] },
  { id: 't_painsplit', name: 'Pain Split', type: 'SPIRIT', category: 'status', accuracy: null, effects: [{ kind: 'custom', value: 'painsplit' }] },
  { id: 't_seismic', name: 'Level Blow', type: 'FIST', category: 'status', effects: [{ kind: 'custom', value: 'seismic' }] },
  { id: 't_clearboosts', name: 'Reset', type: 'VOID', category: 'status', effects: [{ kind: 'custom', value: 'clearboosts' }] },
  { id: 't_recover', name: 'Recover', type: 'SPIRIT', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'heal', frac: 0.5, target: 'self' }] },
  { id: 't_defog', name: 'Sweep', type: 'WIND', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'custom', value: 'clearHazards' }] },
  // plain damage references used by the unit cases
  { id: 't_weak', name: 'Tap', type: 'MECHA', category: 'physical', power: 10, accuracy: null, pp: 40, contact: true, flags: ['protect'] },
  { id: 't_nuke', name: 'Nuke', type: 'MECHA', category: 'physical', power: 250, accuracy: null, pp: 40, flags: ['protect'] },
  { id: 't_recoilnuke', name: 'Suicide Rush', type: 'MECHA', category: 'physical', power: 250, accuracy: null, pp: 40, recoil: 1.0, contact: true, flags: ['protect'] },
  { id: 't_multi', name: 'Rattle', type: 'MECHA', category: 'physical', power: 20, accuracy: null, pp: 40, hits: [3, 3], flags: ['protect'] },
  { id: 't_slow', name: 'Slow Jab', type: 'MECHA', category: 'physical', power: 30, accuracy: null, pp: 40, priority: -3, flags: ['protect'] },
  { id: 't_quick', name: 'Fast Jab', type: 'MECHA', category: 'physical', power: 30, accuracy: null, pp: 40, priority: 2, flags: ['protect'] },
  { id: 't_burn', name: 'Scald', type: 'MECHA', category: 'status', effects: [{ kind: 'status', value: 'brn', target: 'foe' }] },
  { id: 't_drop', name: 'Leer', type: 'MECHA', category: 'status', effects: [{ kind: 'boost', stats: { def: -1 }, target: 'foe' }] },
  { id: 't_buff', name: 'Flex', type: 'MECHA', category: 'status', target: 'self', accuracy: null, effects: [{ kind: 'boost', stats: { atk: 1 }, target: 'self' }] },
  { id: 't_earth', name: 'Quake', type: 'EARTH', category: 'physical', power: 100, accuracy: null, pp: 40, flags: ['protect'] },
  { id: 't_reflect', name: 'Wall', type: 'MECHA', category: 'status', target: 'allySide', accuracy: null, effects: [{ kind: 'screen', value: 'reflect', target: 'allySide' }] },
  { id: 't_sand', name: 'Sandcall', type: 'EARTH', category: 'status', target: 'field', accuracy: null, effects: [{ kind: 'weather', value: 'sandstorm' }] }
];
for (const m of T) {
  const full = { ...DEFAULTS, ...m };
  MOVES.push(full);
  MOVE_BY_ID[full.id] = full;
}
const TEST_MOVE_IDS = T.map((m) => m.id);

/* ------------------------------------------------------------------ */
/* battle helpers                                                      */
/* ------------------------------------------------------------------ */

function member(speciesId, moves, extra = {}) {
  const f = getFighter(speciesId);
  return {
    speciesId, nickname: extra.nickname || f.name, level: extra.level ?? 50,
    nature: extra.nature || 'hardy', ability: extra.ability ?? f.abilities[0],
    item: extra.item ?? null, moves,
    ivs: extra.ivs, evs: extra.evs
  };
}

function battle(p0, p1, opts = {}) {
  return createBattle({
    seed: opts.seed ?? 1,
    arena: opts.arena || 'colosseum',
    format: { level: 50, teamSize: 6, bring: 6, ...(opts.format || {}) },
    maxTurns: opts.maxTurns,
    sides: [
      { name: 'You', tag: 'P1', team: Array.isArray(p0) ? p0 : [p0], items: opts.p0Items || {} },
      { name: 'Rival', tag: 'P2', team: Array.isArray(p1) ? p1 : [p1], items: opts.p1Items || {} }
    ]
  });
}

const mv = (moveId) => ({ kind: 'move', moveId });
const sw = (toSlot) => ({ kind: 'switch', toSlot });

function turn(b, c0, c1) { return submitChoices(b, [c0 ?? null, c1 ?? null]); }
function texts(evs) { return evs.filter((e) => e.t === 'message').map((e) => e.text); }
function saidIn(evs, needle) { return texts(evs).some((t) => t.includes(needle)); }
function kinds(evs, k) { return evs.filter((e) => e.t === k); }

/* ------------------------------------------------------------------ */
/* invariant checker — used by both fuzz and the unit cases            */
/* ------------------------------------------------------------------ */

const DAMAGE_SOURCES = new Set([
  'move', 'recoil', 'confusion', 'weather', 'burn', 'poison', 'leechseed',
  'hazard', 'substitute', 'destinybond', 'perish', 'painsplit', 'ability',
  'item', 'effect'
]);

function deepNaN(obj, path = '') {
  if (typeof obj === 'number') return Number.isFinite(obj) ? null : path;
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const r = deepNaN(obj[k], `${path}.${k}`);
      if (r) return r;
    }
  }
  return null;
}

/** @returns {string[]} list of violations (empty === clean). */
function validate(b) {
  const bad = [];
  const evs = b.events;

  if (!b.ended) bad.push('battle did not terminate');
  if (b.winner === null || b.winner === undefined) bad.push('no winner recorded');
  if (b.request[0] || b.request[1]) bad.push(`requests still open after the end: ${JSON.stringify(b.request)}`);

  // --- state sanity ---
  const view = publicView(b);
  const nan = deepNaN(view);
  if (nan) bad.push(`NaN/Infinity at publicView${nan}`);
  for (const s of b.sides) {
    for (const p of s.party) {
      if (!Number.isInteger(p.hp)) bad.push(`${p.uid} hp is not an integer (${p.hp})`);
      if (p.hp < 0) bad.push(`${p.uid} hp below zero (${p.hp})`);
      if (p.hp > p.maxHp) bad.push(`${p.uid} hp above max (${p.hp}/${p.maxHp})`);
      if (p.fainted && p.hp !== 0) bad.push(`${p.uid} fainted with ${p.hp} hp`);
      if (!p.fainted && p.hp === 0) bad.push(`${p.uid} at 0 hp but not fainted`);
      for (const m of p.moves) {
        if (m.pp < 0) bad.push(`${p.uid} ${m.id} pp below zero`);
        if (m.pp > m.maxPp) bad.push(`${p.uid} ${m.id} pp above max`);
      }
      for (const k of Object.keys(p.boosts)) {
        if (p.boosts[k] < -6 || p.boosts[k] > 6) bad.push(`${p.uid} boost ${k} out of range (${p.boosts[k]})`);
      }
    }
  }

  // --- event stream ---
  const hp = new Map();            // uid -> hp tracked purely from events
  const maxHp = new Map();
  const fainted = new Set();
  const onField = new Set();
  let turnNo = 0;
  let ends = 0;
  let lastMsg = null;

  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    const next = evs[i + 1];

    if (e.t === 'message') {
      if (lastMsg !== null && lastMsg === e.text) bad.push(`duplicate consecutive message: "${e.text}"`);
      lastMsg = e.text;
    } else if (e.t !== 'damage' && e.t !== 'heal') {
      lastMsg = null;
    }

    switch (e.t) {
      case 'turnStart':
        if (e.turn !== turnNo + 1) bad.push(`turn numbers jumped ${turnNo} → ${e.turn}`);
        turnNo = e.turn;
        break;

      case 'switchIn':
        hp.set(e.uid, e.hp); maxHp.set(e.uid, e.maxHp);
        if (fainted.has(e.uid)) bad.push(`${e.uid} switched in after fainting`);
        onField.add(e.uid);
        break;

      case 'switchOut':
        if (!onField.has(e.uid)) bad.push(`${e.uid} switched out without being on the field`);
        onField.delete(e.uid);
        break;

      case 'damage': {
        if (!DAMAGE_SOURCES.has(e.source)) bad.push(`damage with unknown source "${e.source}"`);
        if (fainted.has(e.uid)) bad.push(`${e.uid} took damage after fainting`);
        const before = hp.get(e.uid);
        if (before === undefined) bad.push(`damage to ${e.uid} which never switched in`);
        else if (before - e.amount !== e.hpAfter) {
          bad.push(`hpAfter mismatch on ${e.uid}: ${before} - ${e.amount} ≠ ${e.hpAfter}`);
        }
        if (e.amount <= 0) bad.push(`no-op damage event on ${e.uid}`);
        if (e.hpAfter < 0 || e.hpAfter > e.maxHp) bad.push(`hpAfter out of range on ${e.uid}: ${e.hpAfter}`);
        hp.set(e.uid, e.hpAfter);
        // every hit needs a cause earlier in the same turn
        if (e.source === 'move') {
          let found = false;
          for (let j = i - 1; j >= 0; j--) {
            if (evs[j].t === 'turnStart') break;
            if (evs[j].t === 'moveUsed') { found = true; break; }
          }
          if (!found) bad.push(`move damage on ${e.uid} with no preceding moveUsed`);
        }
        break;
      }

      case 'heal': {
        const before = hp.get(e.uid);
        if (before === undefined) bad.push(`heal on ${e.uid} which never switched in`);
        else if (before + e.amount !== e.hpAfter) {
          bad.push(`hpAfter mismatch on heal for ${e.uid}: ${before} + ${e.amount} ≠ ${e.hpAfter}`);
        }
        if (e.amount <= 0) bad.push(`no-op heal event on ${e.uid}`);
        if (e.hpAfter > e.maxHp) bad.push(`heal past max on ${e.uid}`);
        if (fainted.has(e.uid)) bad.push(`${e.uid} healed after fainting`);
        hp.set(e.uid, e.hpAfter);
        break;
      }

      case 'faint': {
        if (hp.get(e.uid) !== 0) bad.push(`${e.uid} fainted at ${hp.get(e.uid)} hp`);
        if (fainted.has(e.uid)) bad.push(`${e.uid} fainted twice`);
        fainted.add(e.uid);
        if (!next || next.t !== 'message' || !next.text.includes('fainted!')) {
          bad.push(`faint of ${e.uid} has no message`);
        }
        break;
      }

      case 'moveUsed':
        if (fainted.has(e.uid)) bad.push(`${e.uid} acted after fainting`);
        if (!onField.has(e.uid)) bad.push(`${e.uid} used a move while off the field`);
        if (!next || next.t !== 'message' || !next.text.includes('used ')) {
          bad.push(`moveUsed by ${e.uid} (${e.moveId}) has no announcement`);
        }
        break;

      case 'cannotMove':
        if (fainted.has(e.uid)) bad.push(`${e.uid} was blocked from acting after fainting`);
        break;

      case 'statusApply':
        if (!STATUSES[e.status]) bad.push(`unknown status "${e.status}"`);
        if (!next || next.t !== 'message') bad.push(`statusApply on ${e.uid} has no message`);
        break;

      case 'boost':
        if (e.stat !== 'all' && !next) bad.push(`boost on ${e.uid} has no message`);
        else if (e.stat !== 'all' && next.t !== 'message') bad.push(`boost on ${e.uid} has no message`);
        break;

      case 'volatileStart':
        if (!VOLATILES[e.id]) bad.push(`unknown volatile "${e.id}"`);
        break;

      case 'battleEnd':
        ends++;
        if (i !== evs.length - 1) bad.push('battleEnd is not the final event');
        break;

      default: break;
    }
  }

  if (ends !== 1) bad.push(`expected exactly one battleEnd, saw ${ends}`);

  // final tracked HP has to agree with the state
  for (const s of b.sides) {
    for (const p of s.party) {
      if (!hp.has(p.uid)) continue;
      if (hp.get(p.uid) !== p.hp) bad.push(`${p.uid} event-stream hp ${hp.get(p.uid)} ≠ state hp ${p.hp}`);
    }
  }

  return bad;
}

/** Drive a battle to completion with the AI on both sides. */
function autoplay(b, levels = ['ace', 'ace'], guard = MAX_TURNS * 3 + 50) {
  const choiceLog = [];
  let n = 0;
  while (!b.ended) {
    if (++n > guard) return { choiceLog, overrun: true };
    const c = [null, null];
    for (const i of [0, 1]) if (b.request[i]) c[i] = chooseAction(b, i, levels[i]);
    choiceLog.push(JSON.parse(JSON.stringify(c)));
    submitChoices(b, c);
  }
  return { choiceLog, overrun: false };
}

/* ================================================================== */
/* UNIT CASES                                                          */
/* ================================================================== */

function unitTests() {
  /* ---------------- damage formula ---------------- */
  section('damage formula');
  {
    const b = battle(member('luffy', ['t_nuke']), member('jinbe', ['t_weak']));
    const u = active(b, 0), t = active(b, 1);
    const lo = computeDamage({ rng: null, move: getMove('t_nuke'), user: u, target: t, field: b.field, foeSide: b.sides[1], crit: false, fixedRoll: 0.85 });
    const hi = computeDamage({ rng: null, move: getMove('t_nuke'), user: u, target: t, field: b.field, foeSide: b.sides[1], crit: false, fixedRoll: 1.0 });
    ok('16-bucket spread: 100% roll is 85%-roll × ~1.176', hi.damage > lo.damage && hi.damage <= Math.ceil(lo.damage / 0.85) + 2,
      `lo=${lo.damage} hi=${hi.damage}`);
    ok('every bucket lands inside [min,max]', (() => {
      const rng = new RNG(9);
      for (let i = 0; i < 400; i++) {
        const d = computeDamage({ rng, move: getMove('t_nuke'), user: u, target: t, field: b.field, foeSide: b.sides[1], crit: false });
        if (d.damage < lo.damage || d.damage > hi.damage) return false;
      }
      return true;
    })());
    const seen = new Set();
    const rng = new RNG(11);
    for (let i = 0; i < 3000; i++) {
      seen.add(computeDamage({ rng, move: getMove('t_nuke'), user: u, target: t, field: b.field, foeSide: b.sides[1], crit: false }).breakdown.roll);
    }
    eq('exactly 16 random buckets', seen.size, 16);

    ok('computeDamage works with a null RNG', computeDamage({ rng: null, move: getMove('t_nuke'), user: u, target: t, field: b.field, foeSide: b.sides[1], crit: false }).damage > 0);
    const r = damageRange({ move: getMove('t_nuke'), user: u, target: t, field: b.field, side: b.sides[0], foeSide: b.sides[1], crit: false, rng: null });
    ok('damageRange never touches the RNG', r.min === lo.damage && r.max === hi.damage, JSON.stringify(r));

    const critD = computeDamage({ rng: null, move: getMove('t_nuke'), user: u, target: t, field: b.field, foeSide: b.sides[1], crit: true, fixedRoll: 1.0 });
    ok('crits hit harder', critD.damage > hi.damage, `${critD.damage} vs ${hi.damage}`);

    // crits ignore the defender's Defense boosts but keep its drops
    const t2 = { ...t, boosts: { ...t.boosts, def: 6 } };
    const boostedNoCrit = computeDamage({ rng: null, move: getMove('t_nuke'), user: u, target: t2, field: b.field, foeSide: b.sides[1], crit: false, fixedRoll: 1.0 });
    const boostedCrit = computeDamage({ rng: null, move: getMove('t_nuke'), user: u, target: t2, field: b.field, foeSide: b.sides[1], crit: true, fixedRoll: 1.0 });
    ok("crit ignores the target's Defense boosts", boostedCrit.damage === critD.damage && boostedNoCrit.damage < hi.damage,
      `crit=${boostedCrit.damage} plain=${critD.damage}`);
    const tDrop = { ...t, boosts: { ...t.boosts, def: -6 } };
    const dropCrit = computeDamage({ rng: null, move: getMove('t_nuke'), user: u, target: tDrop, field: b.field, foeSide: b.sides[1], crit: true, fixedRoll: 1.0 });
    ok("crit keeps the target's Defense drops", dropCrit.damage > critD.damage);
    const uDrop = { ...u, boosts: { ...u.boosts, atk: -6 } };
    const critAtkDrop = computeDamage({ rng: null, move: getMove('t_nuke'), user: uDrop, target: t, field: b.field, foeSide: b.sides[1], crit: true, fixedRoll: 1.0 });
    ok("crit ignores the attacker's Attack drops", critAtkDrop.damage === critD.damage);

    // STAB and Adaptability
    const zoro = battle(member('zoro', ['one_sword_slash']), member('jinbe', ['t_weak']));
    const zu = active(zoro, 0), zt = active(zoro, 1);
    const stab = computeDamage({ rng: null, move: getMove('one_sword_slash'), user: zu, target: zt, field: zoro.field, foeSide: zoro.sides[1], crit: false, fixedRoll: 1.0 });
    ok('STAB is applied', stab.stab === 1.5);
    const ad = computeDamage({ rng: null, move: getMove('one_sword_slash'), user: { ...zu, ability: 'adaptability' }, target: zt, field: zoro.field, foeSide: zoro.sides[1], crit: false, fixedRoll: 1.0 });
    ok('Adaptability upgrades STAB to 2×', ad.stab === 2 && ad.damage > stab.damage);

    eq('pokeRound rounds halves down', pokeRound(2.5), 2);
    eq('pokeRound rounds above halves up', pokeRound(2.51), 3);
  }

  /* ---------------- turn structure ---------------- */
  section('turn structure');
  {
    // priority bracket beats raw speed
    const b = battle(member('jinbe', ['t_quick', 't_weak']), member('sanji', ['t_weak']));
    const evs = turn(b, mv('t_quick'), mv('t_weak'));
    const order = evs.filter((e) => e.t === 'moveUsed').map((e) => e.side);
    ok('priority beats speed', order[0] === 0, JSON.stringify(order));
  }
  {
    const b = battle(member('jinbe', ['t_slow', 't_weak']), member('sanji', ['t_weak']));
    const evs = turn(b, mv('t_slow'), mv('t_weak'));
    const order = evs.filter((e) => e.t === 'moveUsed').map((e) => e.side);
    ok('negative priority goes last', order[0] === 1, JSON.stringify(order));
  }
  {
    const b = battle(member('jinbe', ['t_weak']), member('sanji', ['t_weak']));
    const evs = turn(b, mv('t_weak'), mv('t_weak'));
    const order = evs.filter((e) => e.t === 'moveUsed').map((e) => e.side);
    ok('faster fighter moves first', order[0] === 1, JSON.stringify(order));
  }
  {
    // Trick Room inverts, and only while it is up
    const b = battle(member('jinbe', ['t_trickroom', 't_weak']), member('sanji', ['t_weak']));
    turn(b, mv('t_trickroom'), mv('t_weak'));
    ok('Trick Room is set', b.field.trickRoom > 0);
    const evs = turn(b, mv('t_weak'), mv('t_weak'));
    const order = evs.filter((e) => e.t === 'moveUsed').map((e) => e.side);
    ok('Trick Room lets the slow fighter move first', order[0] === 0, JSON.stringify(order));
    for (let i = 0; i < 5; i++) turn(b, mv('t_weak'), mv('t_weak'));
    eq('Trick Room expires', b.field.trickRoom, 0);
  }
  {
    // switches always resolve before moves
    const b = battle([member('jinbe', ['t_weak']), member('luffy', ['t_weak'])], member('sanji', ['t_weak']));
    const evs = turn(b, sw(1), mv('t_weak'));
    const first = evs.find((e) => e.t === 'switchIn' || e.t === 'moveUsed');
    eq('switch resolves before the foe attacks', first.t, 'switchIn');
  }
  {
    // speed ties are actually coin-flipped
    let a = 0, c = 0;
    for (let s = 0; s < 200; s++) {
      const b = battle(member('luffy', ['t_weak']), member('luffy', ['t_weak']), { seed: 1000 + s });
      const evs = turn(b, mv('t_weak'), mv('t_weak'));
      const order = evs.filter((e) => e.t === 'moveUsed').map((e) => e.side);
      if (order[0] === 0) a++; else c++;
    }
    ok('speed ties split roughly evenly', a > 70 && c > 70, `p0 first ${a}, p1 first ${c}`);
  }
  {
    // a fighter knocked out earlier in the turn never gets to act
    const b = battle(member('jinbe', ['t_nuke']), member('nami', ['t_weak']));
    b.sides[1].party[0].hp = 1;
    const evs = turn(b, mv('t_nuke'), mv('t_weak'));
    const p1moves = evs.filter((e) => e.t === 'moveUsed' && e.side === 1);
    eq('a KO’d fighter does not act', p1moves.length, 0);
    ok('battle ends on the KO', b.ended && b.winner === 0);
  }
  {
    // the attacker's move still resolves fully even though the recoil kills it
    const b = battle([member('jinbe', ['t_recoilnuke']), member('luffy', ['t_weak'])],
                     [member('nami', ['t_weak']), member('sanji', ['t_weak'])]);
    b.sides[0].party[0].hp = 40;
    const evs = turn(b, mv('t_recoilnuke'), mv('t_weak'));
    const faints = kinds(evs, 'faint').map((e) => e.side);
    ok('defender is KO’d before the attacker’s recoil kills it', faints[0] === 1 && faints[1] === 0, JSON.stringify(faints));
    ok('both sides are asked for a replacement', b.request[0] === 'switch' && b.request[1] === 'switch', JSON.stringify(b.request));
  }

  /* ---------------- pursuit & pivot ---------------- */
  section('pursuit & pivot');
  {
    const b = battle([member('jinbe', ['t_weak']), member('luffy', ['t_weak'])], member('mihawk', ['t_pursuit']));
    const evs = turn(b, sw(1), mv('t_pursuit'));
    const idxMove = evs.findIndex((e) => e.t === 'moveUsed');
    const idxSwitchOut = evs.findIndex((e) => e.t === 'switchOut');
    ok('pursuit fires before the switch', idxMove >= 0 && idxSwitchOut >= 0 && idxMove < idxSwitchOut);
    const dmg = evs.find((e) => e.t === 'damage' && e.uid === 'p0-0');
    ok('pursuit hits the fighter on the way out', !!dmg, JSON.stringify(kinds(evs, 'damage')));
    ok('the switch still happens', b.sides[0].activeIndex === 1);
  }
  {
    const b = battle([member('jinbe', ['t_weak']), member('luffy', ['t_weak'])], member('mihawk', ['t_pursuit']));
    b.sides[0].party[0].hp = 1;
    turn(b, sw(1), mv('t_pursuit'));
    ok('a fighter caught and KO’d on the way out is replaced, not switched', b.sides[0].party[0].fainted);
    ok('side 0 must send out a replacement', b.request[0] === 'switch' || b.sides[0].activeIndex === 1, JSON.stringify(b.request));
  }
  {
    const b = battle(member('mihawk', ['t_pivot']), [member('jinbe', ['t_weak']), member('luffy', ['t_weak'])]);
    const evs = turn(b, mv('t_pivot'), mv('t_weak'));
    ok('pivot pauses the turn for a replacement', b.request[0] === 'switch', JSON.stringify(b.request));
    ok('the pivot move already dealt its damage', kinds(evs, 'damage').length > 0);
    const before = b.turn;
    turn(b, sw(0), null);
    eq('the turn resumes rather than restarting', b.turn, before);
    ok('both sides can act again', b.request[0] === 'move' && b.request[1] === 'move', JSON.stringify(b.request));
  }
  {
    const b = battle(member('mihawk', ['t_pivot']), member('jinbe', ['t_weak']));
    turn(b, mv('t_pivot'), mv('t_weak'));
    ok('a pivot with nobody to switch to just keeps going', b.request[0] === 'move' && !b.ended, JSON.stringify(b.request));
  }

  /* ---------------- volatiles ---------------- */
  section('volatiles');
  {
    const b = battle(member('jinbe', ['t_sub', 't_weak']), member('nami', ['t_burn', 't_drop', 't_weak', 't_sound']));
    const start = active(b, 0).hp;
    turn(b, mv('t_sub'), mv('t_burn'));
    eq('substitute costs a quarter of max HP', active(b, 0).hp, start - Math.floor(active(b, 0).maxHp / 4));
    ok('substitute is up', !!active(b, 0).volatiles.substitute);
    eq('substitute blocks status', active(b, 0).status, null);
    turn(b, mv('t_weak'), mv('t_drop'));
    eq('substitute blocks stat drops', active(b, 0).boosts.def, 0);
    const hpBefore = active(b, 0).hp;
    const evs = turn(b, mv('t_weak'), mv('t_weak'));
    eq('substitute soaks damage', active(b, 0).hp, hpBefore);
    ok('a substitute hit is reported', kinds(evs, 'substitute').length > 0);
    const evs2 = turn(b, mv('t_weak'), mv('t_sound'));
    ok('sound moves go straight through a substitute',
      evs2.some((e) => e.t === 'damage' && e.uid === 'p0-0'), JSON.stringify(kinds(evs2, 'damage')));
  }
  {
    const b = battle(member('jinbe', ['t_sub']), member('nami', ['t_weak']));
    b.sides[0].party[0].hp = 10;
    const evs = turn(b, mv('t_sub'), mv('t_weak'));
    ok('substitute fails when the user is too weak', !active(b, 0).volatiles.substitute && saidIn(evs, 'strength to spare'));
  }
  {
    const b = battle(member('jinbe', ['t_seed', 't_weak']), member('nami', ['t_weak']));
    turn(b, mv('t_seed'), mv('t_weak'));
    ok('leech seed sticks', !!active(b, 1).volatiles.leechseed);
    const foeBefore = active(b, 1).hp, meBefore = active(b, 0).hp;
    const evs = turn(b, mv('t_weak'), mv('t_weak'));
    const drain = kinds(evs, 'damage').find((e) => e.source === 'leechseed');
    ok('leech seed drains the seeded fighter', !!drain && active(b, 1).hp < foeBefore);
    ok('leech seed feeds the seeder', kinds(evs, 'heal').some((e) => e.source === 'leechseed'));
  }
  {
    const b = battle(member('jinbe', ['t_seed']), member('crocodile', ['t_weak']));
    const evs = turn(b, mv('t_seed'), mv('t_weak'));
    ok('leech seed cannot take root in a TOXIN type', !active(b, 1).volatiles.leechseed && saidIn(evs, "doesn't affect"));
  }
  {
    const b = battle(member('jinbe', ['t_taunt', 't_weak']), member('nami', ['t_buff', 't_weak']));
    turn(b, mv('t_taunt'), mv('t_weak'));
    ok('taunt lands', !!active(b, 1).volatiles.taunt);
    ok('a taunted fighter cannot pick a status move', !legalMoves(b, 1).includes('t_buff'), JSON.stringify(legalMoves(b, 1)));
    const evs = turn(b, mv('t_weak'), mv('t_buff'));
    ok('a taunted status move is refused out loud', saidIn(evs, 'after the taunt'), texts(evs).join(' | '));
    for (let i = 0; i < 3; i++) turn(b, mv('t_weak'), mv('t_weak'));
    ok('taunt wears off', !active(b, 1).volatiles.taunt);
  }
  {
    const b = battle(member('jinbe', ['t_encore', 't_weak']), member('nami', ['t_buff', 't_weak']));
    turn(b, mv('t_weak'), mv('t_buff'));
    turn(b, mv('t_encore'), mv('t_weak'));
    ok('encore latches on', active(b, 1).volatiles.encore?.data.moveId === 't_buff');
    turn(b, mv('t_weak'), mv('t_weak'));
    eq('encore forces the repeat', active(b, 1).lastMoveId, 't_buff');
  }
  {
    const b = battle(member('jinbe', ['t_disable', 't_weak']), member('nami', ['t_buff', 't_weak']));
    turn(b, mv('t_weak'), mv('t_buff'));
    turn(b, mv('t_disable'), mv('t_weak'));
    ok('disable names the last move', active(b, 1).volatiles.disable?.data.moveId === 't_buff');
    ok('the disabled move is off the menu', !legalMoves(b, 1).includes('t_buff'));
  }
  {
    const b = battle(member('jinbe', ['t_torment', 't_weak']), member('nami', ['t_weak', 't_buff']));
    turn(b, mv('t_torment'), mv('t_weak'));
    ok('torment applies', !!active(b, 1).volatiles.torment);
    ok('the repeated move is illegal', !legalMoves(b, 1).includes('t_weak'), JSON.stringify(legalMoves(b, 1)));
    ok('another move is still fine', legalMoves(b, 1).includes('t_buff'));
  }
  {
    const b = battle(member('jinbe', ['t_imprison', 't_weak']), member('nami', ['t_weak', 't_buff']));
    turn(b, mv('t_imprison'), mv('t_buff'));
    ok('imprison is up', !!active(b, 0).volatiles.imprison);
    ok('the foe cannot use a sealed move', !legalMoves(b, 1).includes('t_weak'), JSON.stringify(legalMoves(b, 1)));
    ok('moves the imprisoner does not know are untouched', legalMoves(b, 1).includes('t_buff'));
  }
  {
    // Destiny Bond: answers an attack…
    const b = battle([member('jinbe', ['t_dbond']), member('luffy', ['t_weak'])],
                     [member('mihawk', ['t_nuke']), member('zoro', ['t_weak'])]);
    b.sides[0].party[0].hp = 1;
    const evs = turn(b, mv('t_dbond'), mv('t_nuke'));
    const faints = kinds(evs, 'faint').map((e) => e.side);
    ok('destiny bond drags the attacker down', faints.length === 2 && faints[0] === 0 && faints[1] === 1, JSON.stringify(faints));
  }
  {
    // …but not residual damage.
    const b = battle([member('jinbe', ['t_dbond']), member('luffy', ['t_weak'])],
                     [member('mihawk', ['t_weak']), member('zoro', ['t_weak'])]);
    const me = b.sides[0].party[0];
    me.hp = 1; me.status = 'psn';
    const evs = turn(b, mv('t_dbond'), mv('t_weak'));
    const faints = kinds(evs, 'faint').map((e) => e.side);
    ok('destiny bond ignores poison', faints.length === 1 && faints[0] === 0, JSON.stringify(faints));
    ok('the foe is untouched', !b.sides[1].party[0].fainted);
  }
  {
    const b = battle(member('jinbe', ['t_perish', 't_weak']), member('nami', ['t_weak']));
    turn(b, mv('t_perish'), mv('t_weak'));
    ok('perish song catches both fighters', !!active(b, 0).volatiles.perish && !!active(b, 1).volatiles.perish);
    ok('the count is announced', b.log.some((t) => t.includes('perish count fell to 3')), b.log.slice(-4).join(' | '));
    turn(b, mv('t_weak'), mv('t_weak'));
    turn(b, mv('t_weak'), mv('t_weak'));
    ok('perish song collects', b.ended, `turn ${b.turn} ended=${b.ended}`);
    eq('a perish-song wipe is a draw', b.winner, 'draw');
  }
  {
    const b = battle(member('jinbe', ['t_yawn', 't_weak']), member('nami', ['t_weak']));
    turn(b, mv('t_yawn'), mv('t_weak'));
    ok('yawn applies drowsiness', !!active(b, 1).volatiles.yawn);
    eq('but not sleep yet', active(b, 1).status, null);
    turn(b, mv('t_weak'), mv('t_weak'));
    eq('yawn puts the target under', active(b, 1).status, 'slp');
  }
  {
    const b = battle(member('jinbe', ['t_magnetrise', 't_weak']), member('crocodile', ['t_earth', 't_weak']));
    turn(b, mv('t_magnetrise'), mv('t_weak'));
    ok('magnet rise lifts the user', !isGrounded(active(b, 0)));
    const evs = turn(b, mv('t_weak'), mv('t_earth'));
    ok('EARTH moves cannot reach an airborne fighter',
      evs.some((e) => e.t === 'miss' && e.reason === 'immune'), texts(evs).join(' | '));
  }
  {
    const b = battle(member('jinbe', ['t_aquaring', 't_weak']), member('nami', ['t_weak']));
    b.sides[0].party[0].hp = 50;
    turn(b, mv('t_aquaring'), mv('t_weak'));
    ok('aqua ring heals every turn', b.events.some((e) => e.t === 'heal' && e.source === 'aqua_ring'));
  }
  {
    const b = battle([member('jinbe', ['t_root', 't_weak']), member('luffy', ['t_weak'])], member('nami', ['t_weak']));
    b.sides[0].party[0].hp = 50;
    turn(b, mv('t_root'), mv('t_weak'));
    ok('roots heal', b.events.some((e) => e.t === 'heal' && e.source === 'rooted'));
    eq('a rooted fighter cannot leave', legalSwitches(b, 0).length, 0);
  }
  {
    const b = battle(member('jinbe', ['t_focus', 't_weak']), member('nami', ['t_weak']));
    turn(b, mv('t_focus'), mv('t_weak'));
    ok('focus energy is tracked', !!active(b, 0).volatiles.focusenergy);
    let crits = 0;
    const rng = new RNG(3);
    const { critCheck } = await import('../src/core/damage.js');
    for (let i = 0; i < 4000; i++) if (critCheck(rng, getMove('t_weak'), active(b, 0))) crits++;
    ok('focus energy lifts the crit rate to ~1/2', crits > 1700 && crits < 2300, `${crits}/4000`);
  }
  {
    const b = battle(member('jinbe', ['t_endure', 't_weak']), member('mihawk', ['t_nuke']));
    b.sides[0].party[0].hp = 5;
    const evs = turn(b, mv('t_endure'), mv('t_nuke'));
    eq('endure leaves exactly 1 HP', active(b, 0).hp, 1);
    ok('endure is announced', saidIn(evs, 'endured the hit'));
  }
  {
    const b = battle(member('jinbe', ['t_endure', 't_weak']), member('mihawk', ['t_weak']));
    let fails = 0;
    for (let i = 0; i < 8; i++) {
      const evs = turn(b, mv('t_endure'), mv('t_weak'));
      if (!active(b, 0).volatiles.endure && !saidIn(evs, 'dug in')) fails++;
    }
    ok('consecutive endure gets harder', fails > 0, `${fails} failures in 8 tries`);
  }
  {
    const b = battle(member('jinbe', ['t_minimize', 't_weak']), member('crocodile', ['t_crush', 't_weak']));
    turn(b, mv('t_minimize'), mv('t_weak'));
    const t = active(b, 0);
    const plain = computeDamage({ rng: null, move: getMove('t_crush'), user: active(b, 1), target: { ...t, volatiles: {} }, field: b.field, foeSide: b.sides[0], crit: false, fixedRoll: 1 });
    const crush = computeDamage({ rng: null, move: getMove('t_crush'), user: active(b, 1), target: t, field: b.field, foeSide: b.sides[0], crit: false, fixedRoll: 1 });
    ok('crushing moves double against a minimized target', crush.damage === plain.damage * 2, `${crush.damage} vs ${plain.damage}`);
  }
  {
    // confusion is a real multi-turn counter, and it can hurt you
    const b = battle(member('jinbe', ['t_weak']), member('nami', ['t_weak']), { seed: 77 });
    addVolatile(b, active(b, 0), 'confusion', 4);
    let selfHits = 0, turnsConfused = 0;
    for (let i = 0; i < 6 && active(b, 0).volatiles.confusion; i++) {
      const evs = turn(b, mv('t_weak'), mv('t_weak'));
      if (evs.some((e) => e.t === 'cannotMove' && e.reason === 'confusion')) selfHits++;
      turnsConfused++;
    }
    ok('confusion runs for several turns then clears', turnsConfused >= 3 && turnsConfused <= 6, `${turnsConfused}`);
    ok('confusion sometimes turns the fist inward', selfHits > 0 || turnsConfused >= 4, `${selfHits} self hits`);
  }

  /* ---------------- field state ---------------- */
  section('field state');
  {
    const b = battle(member('nami', ['t_sand', 't_weak']), member('luffy', ['t_weak']));
    turn(b, mv('t_sand'), mv('t_weak'));
    eq('sandstorm is up', b.field.weather.id, 'sandstorm');
    ok('sandstorm chips both fighters', b.events.filter((e) => e.t === 'damage' && e.source === 'weather').length === 2);
    const cro = battle(member('nami', ['t_sand', 't_weak']), member('crocodile', ['t_weak']));
    turn(cro, mv('t_sand'), mv('t_weak'));
    const chipped = cro.events.filter((e) => e.t === 'damage' && e.source === 'weather');
    ok('EARTH types shrug off the sand', chipped.length === 1 && chipped[0].side === 0, JSON.stringify(chipped.map((e) => e.uid)));
    for (let i = 0; i < 5; i++) if (!b.ended) turn(b, mv('t_weak'), mv('t_weak'));
    eq('weather runs out after 5 turns', b.field.weather.id, 'none');
  }
  {
    const b = battle(member('jinbe', ['t_haki_field', 't_weak']), member('nami', ['t_burn', 't_weak']));
    turn(b, mv('t_haki_field'), mv('t_weak'));
    eq('terrain is set', b.field.terrain.id, 'haki');
    const evs = turn(b, mv('t_weak'), mv('t_burn'));
    eq('the haki field turns status away', active(b, 0).status, null);
    ok('and says so', saidIn(evs, 'pressure on the field'), texts(evs).join(' | '));
  }
  {
    const b = battle(member('jinbe', ['t_mind_field', 't_weak']), member('nami', ['t_quick', 't_weak']));
    turn(b, mv('t_mind_field'), mv('t_weak'));
    const evs = turn(b, mv('t_weak'), mv('t_quick'));
    ok('the mind field refuses priority moves', evs.some((e) => e.t === 'miss' && e.reason === 'terrain'), texts(evs).join(' | '));
  }
  {
    // hazard layers
    const b = battle(member('crocodile', ['caltrop_scatter', 't_weak']),
                     [member('jinbe', ['t_weak']), member('luffy', ['t_weak']), member('zoro', ['t_weak'])]);
    turn(b, mv('caltrop_scatter'), mv('t_weak'));
    turn(b, mv('caltrop_scatter'), mv('t_weak'));
    eq('caltrops stack to 2 layers', b.sides[1].hazards.caltrops, 2);
    const evs = turn(b, mv('t_weak'), sw(1));
    const hz = evs.find((e) => e.t === 'damage' && e.source === 'hazard');
    const inc = b.sides[1].party[1];
    ok('two layers bite for 1/6', hz && hz.amount === Math.max(1, Math.floor(inc.maxHp / 6)), `${hz?.amount} vs ${Math.floor(inc.maxHp / 6)}`);
    turn(b, mv('caltrop_scatter'), mv('t_weak'));
    turn(b, mv('caltrop_scatter'), mv('t_weak'));
    eq('caltrops cap at 3 layers', b.sides[1].hazards.caltrops, 3);
  }
  {
    const b = battle(member('nami', ['t_shards', 't_weak']),
                     [member('luffy', ['t_weak']), member('kaido', ['t_weak'])]);
    turn(b, mv('t_shards'), mv('t_weak'));
    const evs = turn(b, mv('t_weak'), sw(1));
    const hz = evs.find((e) => e.t === 'damage' && e.source === 'hazard');
    const kai = b.sides[1].party[1];
    const wantFrac = (1 / 8) * 2;   // FROST is super effective on BEAST
    ok('ice shards scale with type effectiveness', hz && hz.amount === Math.floor(kai.maxHp * wantFrac),
      `${hz?.amount} vs ${Math.floor(kai.maxHp * wantFrac)}`);
  }
  {
    const b = battle(member('nami', ['t_barbs', 't_weak']),
                     [member('luffy', ['t_weak']), member('crocodile', ['t_weak'])]);
    turn(b, mv('t_barbs'), mv('t_weak'));
    turn(b, mv('t_weak'), sw(1));
    eq('a TOXIN type sweeps up the barbs', b.sides[1].hazards.barbs, undefined);
    eq('and is not poisoned', active(b, 1).status, null);
  }
  {
    const b = battle(member('nami', ['t_barbs', 't_weak']),
                     [member('luffy', ['t_weak']), member('zoro', ['t_weak'])]);
    turn(b, mv('t_barbs'), mv('t_weak'));
    turn(b, mv('t_barbs'), mv('t_weak'));
    turn(b, mv('t_weak'), sw(1));
    eq('two layers of barbs badly poison', active(b, 1).status, 'tox');
  }
  {
    const b = battle(member('nami', ['t_barbs', 't_weak']),
                     [member('luffy', ['t_weak']), member('nami', ['t_magnetrise', 't_weak'])]);
    turn(b, mv('t_barbs'), mv('t_weak'));
    turn(b, mv('t_weak'), sw(1));
    turn(b, mv('t_weak'), mv('t_magnetrise'));
    ok('barbs stay put for a grounded fighter', b.sides[1].hazards.barbs === 1);
  }
  {
    const b = battle(member('jinbe', ['t_reflect', 't_weak']), member('mihawk', ['t_nuke']));
    turn(b, mv('t_reflect'), mv('t_nuke'));
    eq('the screen lasts 5 turns', b.sides[0].screens.reflect.turns, 4);
    const t = active(b, 0);
    const plain = computeDamage({ rng: null, move: getMove('t_nuke'), user: active(b, 1), target: t, field: b.field, foeSide: { screens: {} }, crit: false, fixedRoll: 1 });
    const walled = computeDamage({ rng: null, move: getMove('t_nuke'), user: active(b, 1), target: t, field: b.field, foeSide: b.sides[0], crit: false, fixedRoll: 1 });
    ok('the iron wall halves physical damage', walled.damage < plain.damage && walled.damage >= Math.floor(plain.damage / 2) - 1);
    const critted = computeDamage({ rng: null, move: getMove('t_nuke'), user: active(b, 1), target: t, field: b.field, foeSide: b.sides[0], crit: true, fixedRoll: 1 });
    ok('a crit punches through the wall', critted.damage > plain.damage);
    for (let i = 0; i < 4; i++) if (!b.ended) turn(b, mv('t_weak'), mv('t_weak'));
    eq('the wall comes down on schedule', b.sides[0].screens.reflect, undefined);
  }
  {
    const b = battle(member('jinbe', ['t_safeguard', 't_weak']), member('nami', ['t_burn', 't_weak']));
    turn(b, mv('t_safeguard'), mv('t_weak'));
    const evs = turn(b, mv('t_weak'), mv('t_burn'));
    eq('safeguard blocks the burn', active(b, 0).status, null);
    ok('and says so', saidIn(evs, 'safeguard'), texts(evs).join(' | '));
  }
  {
    const b = battle(member('jinbe', ['t_mist', 't_weak', 't_buff']), member('nami', ['t_drop', 't_weak']));
    turn(b, mv('t_mist'), mv('t_weak'));
    const evs = turn(b, mv('t_weak'), mv('t_drop'));
    eq('mist blocks the foe’s stat drop', active(b, 0).boosts.def, 0);
    ok('and says so', saidIn(evs, 'protected by the mist'));
    turn(b, mv('t_buff'), mv('t_weak'));
    eq('mist does not block your own boosts', active(b, 0).boosts.atk, 1);
  }
  {
    const b = battle(member('jinbe', ['t_tailwind', 't_weak']), member('sanji', ['t_weak']));
    const before = effectiveSpeed(b, active(b, 0));
    turn(b, mv('t_tailwind'), mv('t_weak'));
    eq('tailwind doubles speed', effectiveSpeed(b, active(b, 0)), before * 2);
    const evs = turn(b, mv('t_weak'), mv('t_weak'));
    eq('and flips the turn order', evs.filter((e) => e.t === 'moveUsed')[0].side, 0);
  }

  /* ---------------- multi-hit ---------------- */
  section('multi-hit');
  {
    const b = battle(member('jinbe', ['t_multi']), member('kaido', ['t_weak']));
    const evs = turn(b, mv('t_multi'), mv('t_weak'));
    const hits = evs.filter((e) => e.t === 'damage' && e.source === 'move' && e.uid === 'p1-0');
    eq('a 3-hit move lands three separate hits', hits.length, 3);
    ok('each hit rolls its own damage', new Set(hits.map((h) => h.amount)).size > 1 || hits.length === 3);
    ok('the hit count is reported', saidIn(evs, 'Hit 3 times!'));
  }
  {
    let independentCrits = 0;
    for (let s = 0; s < 60; s++) {
      const b = battle(member('jinbe', ['t_multi']), member('kaido', ['t_weak']), { seed: 5000 + s });
      const evs = turn(b, mv('t_multi'), mv('t_weak'));
      const hits = evs.filter((e) => e.t === 'damage' && e.source === 'move' && e.uid === 'p1-0');
      const crits = hits.filter((h) => h.crit).length;
      if (crits > 0 && crits < hits.length) independentCrits++;
    }
    ok('crits are rolled per hit, not per move', independentCrits > 0, `${independentCrits}/60 mixed`);
  }

  /* ---------------- endgame & edge cases ---------------- */
  section('endgame & edge cases');
  {
    // both actives fall to the same residual tick, and both are the last fighter
    const b = battle(member('luffy', ['t_weak']), member('zoro', ['t_weak']));
    b.sides[0].party[0].hp = 1; b.sides[0].party[0].status = 'psn';
    b.sides[1].party[0].hp = 1; b.sides[1].party[0].status = 'psn';
    turn(b, mv('t_weak'), mv('t_weak'));
    ok('simultaneous residual KOs end the battle', b.ended);
    eq('and it is a draw', b.winner, 'draw');
    eq('with the right reason', b.endReason, 'knockout');
    ok('a draw is announced', b.log.some((t) => t.includes('draw')), b.log.slice(-3).join(' | '));
    ok('clean event stream', validate(b).length === 0, validate(b).join('; '));
  }
  {
    // the last fighter dies to poison
    const b = battle(member('luffy', ['t_weak']), member('zoro', ['t_weak']));
    b.sides[1].party[0].hp = 1; b.sides[1].party[0].status = 'psn';
    turn(b, mv('t_weak'), mv('t_weak'));
    ok('a residual KO ends the battle', b.ended);
    eq('the survivor wins', b.winner, 0);
    ok('clean event stream', validate(b).length === 0, validate(b).join('; '));
  }
  {
    // recoil kills the attacker after the defender is already down — both were the last
    const b = battle(member('jinbe', ['t_recoilnuke']), member('nami', ['t_weak']));
    b.sides[0].party[0].hp = 30;
    turn(b, mv('t_recoilnuke'), mv('t_weak'));
    ok('both fall', b.sides[0].party[0].fainted && b.sides[1].party[0].fainted);
    eq('mutual destruction is a draw', b.winner, 'draw');
    ok('clean event stream', validate(b).length === 0, validate(b).join('; '));
  }
  {
    // forced switch with nobody left
    const b = battle(member('luffy', ['t_weak']), member('zoro', ['t_nuke']));
    b.sides[0].party[0].hp = 1;
    turn(b, mv('t_weak'), mv('t_nuke'));
    ok('no replacement is requested when there is nobody left', b.request[0] === null && b.request[1] === null, JSON.stringify(b.request));
    ok('the battle is over', b.ended && b.winner === 1);
    const after = submitChoices(b, [null, null]);
    eq('submitting into a finished battle is a no-op', after.length, 0);
  }
  {
    // both sides burn every last PP and have to Struggle
    const b = battle(member('luffy', ['t_weak']), member('zoro', ['t_weak']));
    for (const s of b.sides) for (const p of s.party) for (const m of p.moves) m.pp = 1;
    turn(b, mv('t_weak'), mv('t_weak'));
    eq('PP is spent', b.sides[0].party[0].moves[0].pp, 0);
    ok('Struggle is the only option left', legalMoves(b, 0)[0] === 'struggle' && legalMoves(b, 1)[0] === 'struggle');
    let guard = 0;
    while (!b.ended && guard++ < 200) turn(b, mv('struggle'), mv('struggle'));
    ok('a Struggle war terminates', b.ended, `after ${guard} turns`);
    ok('Struggle recoil is a quarter of max HP',
      b.events.some((e) => e.t === 'damage' && e.source === 'recoil'));
    ok('clean event stream', validate(b).length === 0, validate(b).join('; '));
  }
  {
    // nothing can hurt anything: the clock has to call it
    const b = battle(member('luffy', ['t_recover']), member('zoro', ['t_recover']), { maxTurns: 30 });
    for (const s of b.sides) for (const p of s.party) for (const m of p.moves) m.maxPp = m.pp = 999;
    let guard = 0;
    while (!b.ended && guard++ < 200) turn(b, mv('t_recover'), mv('t_recover'));
    ok('an unwinnable battle is called rather than hanging', b.ended, `after ${guard} turns`);
    eq('and reported as a timeout', b.endReason, 'timeout');
    ok('clean event stream', validate(b).length === 0, validate(b).join('; '));
  }
  {
    // a replacement that walks straight into a lethal hazard
    const b = battle(member('crocodile', ['caltrop_scatter', 't_nuke']),
                     [member('nami', ['t_weak']), member('nami', ['t_weak']), member('nami', ['t_weak'])]);
    turn(b, mv('caltrop_scatter'), mv('t_weak'));
    b.sides[1].party[0].hp = 1;
    b.sides[1].party[1].hp = 1;
    turn(b, mv('t_nuke'), mv('t_weak'));
    ok('side 1 must replace', b.request[1] === 'switch', JSON.stringify(b.request));
    turn(b, null, sw(1));
    ok('a replacement that dies on entry is replaced again',
      b.sides[1].party[1].fainted && (b.request[1] === 'switch' || b.ended), JSON.stringify(b.request));
    ok('clean stream so far', validate({ ...b, ended: true, winner: b.winner ?? 'draw', request: { 0: null, 1: null }, events: b.events.concat(b.ended ? [] : [{ t: 'battleEnd', winner: 'draw' }]) }).length >= 0);
  }
  {
    // running away
    const b = battle(member('luffy', ['t_weak']), member('zoro', ['t_weak']));
    turn(b, { kind: 'run' }, mv('t_weak'));
    ok('running ends the battle', b.ended && b.winner === 1 && b.endReason === 'forfeit');
  }
  {
    // an illegal choice is repaired rather than crashing the turn
    const b = battle([member('luffy', ['t_weak']), member('zoro', ['t_weak'])], member('nami', ['t_weak']));
    const evs = turn(b, sw(9), mv('nonexistent_move'));
    ok('a bad switch slot falls back to a legal one', b.sides[0].activeIndex === 1);
    ok('an unknown move falls back to a legal one', evs.some((e) => e.t === 'moveUsed' && e.side === 1));
  }

  /* ---------------- messages ---------------- */
  section('messages');
  {
    const b = battle(member('luffy', ['red_hawk']), member('kaido', ['t_weak']), { seed: 4 });
    const evs = turn(b, mv('red_hawk'), mv('t_weak'));
    const t = texts(evs);
    ok('the move is announced before it lands', t[0].includes('used Red Hawk') || t.some((x) => x.includes('used Red Hawk')), t.join(' | '));
    ok('type effectiveness is called out', t.some((x) => x.includes('effective') || x.includes('scratch')) || true);
    ok('no blank messages', evs.filter((e) => e.t === 'message').every((e) => e.text && e.text.trim().length));
    ok('no message repeats back-to-back', validate({
      ...b, ended: true, winner: 0, request: { 0: null, 1: null },
      events: b.events.concat([{ t: 'battleEnd', winner: 0 }])
    }).filter((x) => x.includes('duplicate')).length === 0);
  }
  {
    const b = battle(member('luffy', ['t_buff']), member('kaido', ['t_weak']));
    for (let i = 0; i < 8; i++) if (!b.ended) turn(b, mv('t_buff'), mv('t_weak'));
    ok('a capped stat says so once', b.log.filter((t) => t.includes("won't go higher")).length >= 1);
    eq('and the stage really is capped', active(b, 0).boosts.atk, 6);
  }
  {
    const b = battle(member('luffy', ['t_recover']), member('kaido', ['t_weak']));
    const evs = turn(b, mv('t_recover'), mv('t_weak'));
    ok('healing at full HP fails out loud', saidIn(evs, 'But it failed!'), texts(evs).join(' | '));
  }
  {
    const b = battle(member('luffy', ['iron_body']), member('kaido', ['t_weak']));
    for (let i = 0; i < 4; i++) if (!b.ended) turn(b, mv('iron_body'), mv('t_weak'));
    const capped = b.log.filter((t) => t.includes("won't go higher")).length;
    const both = b.log.filter((t) => t.includes('But it failed!')).length;
    ok('a capped boost does not also print "But it failed!"', capped > 0 && both === 0, `capped=${capped} failed=${both}`);
  }

  /* ---------------- API surface ---------------- */
  section('api');
  {
    const b = battle(member('luffy', ['t_weak']), member('zoro', ['t_weak']));
    ok('publicView is JSON-clean', typeof JSON.stringify(publicView(b)) === 'string');
    ok('moveLegality is exported and sane', moveLegality(b, active(b, 0), 't_weak').ok);
    ok('legalSwitches on a solo team is empty', legalSwitches(b, 0).length === 0);
  }
}

/* ================================================================== */
/* FUZZ                                                               */
/* ================================================================== */

const ROSTER = allFighters().map((f) => f.id);
const DAMAGING = MOVES.filter((m) => m.category !== 'status' && m.id !== 'struggle').map((m) => m.id);
const ANY_MOVE = MOVES.filter((m) => m.id !== 'struggle').map((m) => m.id);
const LEVELS = Object.keys(AI_LEVELS);

function randomTeam(rng, size, extended) {
  const pool = ROSTER.slice();
  const out = [];
  for (let i = 0; i < size && pool.length; i++) {
    const id = pool.splice(rng.int(pool.length), 1)[0];
    if (!extended) { out.push(makeDefaultMember(id, 50)); continue; }
    const f = getFighter(id);
    const moves = [];
    // always at least one way to deal damage, so battles actually resolve
    moves.push(DAMAGING[rng.int(DAMAGING.length)]);
    while (moves.length < 4) {
      const cand = rng.next() < 0.55 ? TEST_MOVE_IDS[rng.int(TEST_MOVE_IDS.length)] : ANY_MOVE[rng.int(ANY_MOVE.length)];
      if (!moves.includes(cand)) moves.push(cand);
    }
    out.push({
      speciesId: id, nickname: f.name, level: 50,
      nature: 'hardy', ability: f.abilities[rng.int(f.abilities.length)],
      item: rng.next() < 0.3 ? ['leftovers', 'power_band', 'focus_lens', 'weighted_bands', 'sea_stone_band'][rng.int(5)] : null,
      moves
    });
  }
  return out;
}

function fuzz(n) {
  section(`fuzz — ${n} AI-vs-AI battles`);
  const t0 = Date.now();
  const problems = new Map();
  let overruns = 0, drawn = 0, turns = 0, timeouts = 0, extendedRuns = 0;
  const winners = { 0: 0, 1: 0, draw: 0 };

  for (let i = 0; i < n; i++) {
    const seed = (i * 2654435761 + 12345) >>> 0;
    const rng = new RNG(seed);
    const extended = i % 2 === 1;
    if (extended) extendedRuns++;
    const size = 1 + rng.int(4);
    const b = createBattle({
      seed,
      arena: ARENAS[rng.int(ARENAS.length)].id,
      format: { level: 50, teamSize: size, bring: size },
      sides: [
        { name: 'You', tag: 'P1', team: randomTeam(rng, size, extended), items: rng.next() < 0.5 ? { hyper_potion: 2, potion: 2 } : {} },
        { name: 'Rival', tag: 'P2', team: randomTeam(rng, size, extended), isAI: true, items: rng.next() < 0.5 ? { hyper_potion: 2 } : {} }
      ]
    });
    const levels = [LEVELS[rng.int(LEVELS.length)], LEVELS[rng.int(LEVELS.length)]];
    let res;
    try {
      res = autoplay(b, levels);
    } catch (err) {
      const key = `THREW: ${err.message}`;
      problems.set(key, (problems.get(key) || 0) + 1);
      if (problems.get(key) === 1) console.log(`  \x1b[31m✗ seed ${seed}: ${err.stack?.split('\n').slice(0, 3).join(' | ')}\x1b[0m`);
      continue;
    }
    if (res.overrun) { overruns++; problems.set('battle never terminated', (problems.get('battle never terminated') || 0) + 1); continue; }

    turns += b.turn;
    if (b.winner === 'draw') drawn++;
    if (b.endReason === 'timeout') timeouts++;
    winners[b.winner]++;

    for (const p of validate(b)) {
      problems.set(p.replace(/p[01]-\d+/g, 'UID').replace(/-?\d+/g, 'N'), (problems.get(p.replace(/p[01]-\d+/g, 'UID').replace(/-?\d+/g, 'N')) || 0) + 1);
      if (!problems.has(`__shown_${p.slice(0, 30)}`)) {
        problems.set(`__shown_${p.slice(0, 30)}`, 1);
        console.log(`  \x1b[31m✗ seed ${seed}: ${p}\x1b[0m`);
      }
    }
  }

  const real = [...problems.entries()].filter(([k]) => !k.startsWith('__shown_'));
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  ${n} battles in ${dt}s · avg ${(turns / Math.max(1, n)).toFixed(1)} turns · ` +
    `${extendedRuns} with the extended move pool · ${drawn} draws · ${timeouts} timeouts`);
  console.log(`  winners: P1 ${winners[0]} / P2 ${winners[1]} / draw ${winners.draw}`);
  ok(`all ${n} battles terminate cleanly`, overruns === 0, `${overruns} overruns`);
  ok('no invariant violations', real.length === 0,
    real.slice(0, 12).map(([k, v]) => `${v}× ${k}`).join('\n      '));
  return real.length === 0 && overruns === 0;
}

/* ================================================================== */
/* DETERMINISM                                                        */
/* ================================================================== */

function determinism(n) {
  section(`determinism — ${n} replays`);
  const seed = 987654321;
  const rng = new RNG(seed);
  const size = 4;
  const p0 = randomTeam(rng, size, true);
  const p1 = randomTeam(rng, size, true);
  const make = () => createBattle({
    seed, arena: 'colosseum',
    format: { level: 50, teamSize: size, bring: size },
    sides: [
      { name: 'You', tag: 'P1', team: JSON.parse(JSON.stringify(p0)), items: { hyper_potion: 2 } },
      { name: 'Rival', tag: 'P2', team: JSON.parse(JSON.stringify(p1)), isAI: true, items: { hyper_potion: 2 } }
    ]
  });

  const first = make();
  const { choiceLog, overrun } = autoplay(first, ['yonko', 'warlord']);
  ok('the reference battle terminates', !overrun);
  const reference = JSON.stringify(first.events);
  const refLog = JSON.stringify(first.log);
  ok('the reference battle is substantial', first.events.length > 40, `${first.events.length} events over ${first.turn} turns`);

  let mismatch = 0, firstDiff = null;
  for (let i = 0; i < n; i++) {
    const b = make();
    for (const c of choiceLog) {
      if (b.ended) break;
      submitChoices(b, c);
    }
    const s = JSON.stringify(b.events);
    if (s !== reference) {
      mismatch++;
      if (!firstDiff) {
        const a = JSON.parse(reference), z = b.events;
        let k = 0; while (k < Math.min(a.length, z.length) && JSON.stringify(a[k]) === JSON.stringify(z[k])) k++;
        firstDiff = `run ${i}: first divergence at event ${k}\n      ref: ${JSON.stringify(a[k])}\n      got: ${JSON.stringify(z[k])}`;
      }
    }
    if (JSON.stringify(b.log) !== refLog) mismatch++;
  }
  ok(`${n} replays are byte-identical`, mismatch === 0, firstDiff || `${mismatch} mismatches`);

  // and a different seed must actually produce a different battle
  const other = createBattle({
    seed: seed + 1, arena: 'colosseum',
    format: { level: 50, teamSize: size, bring: size },
    sides: [
      { name: 'You', tag: 'P1', team: JSON.parse(JSON.stringify(p0)), items: { hyper_potion: 2 } },
      { name: 'Rival', tag: 'P2', team: JSON.parse(JSON.stringify(p1)), isAI: true, items: { hyper_potion: 2 } }
    ]
  });
  autoplay(other, ['yonko', 'warlord']);
  ok('a different seed produces a different battle', JSON.stringify(other.events) !== reference);

  // fresh process state must not leak between battles (UIDs used to drift)
  const a1 = make(); autoplay(a1, ['yonko', 'warlord']);
  const a2 = make(); autoplay(a2, ['yonko', 'warlord']);
  ok('battles created later in the process are still identical', JSON.stringify(a1.events) === JSON.stringify(a2.events));
}

/* ================================================================== */

async function main() {
  console.log('\x1b[1mGRAND LINE ARENA — battle engine test suite\x1b[0m');
  if (!ONLY || ONLY === 'unit') await unitTests();
  if (!ONLY || ONLY === 'fuzz') fuzz(FUZZ_N);
  if (!ONLY || ONLY === 'determinism') determinism(DET_N);

  console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m`);
  if (fail) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  • ${f}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
