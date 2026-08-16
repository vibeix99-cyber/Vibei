// Shareable team codes. `GLA1.xxxxxxxx…` — paste it to a friend, they get your
// exact crew: species, level, nature, ability, item, moves, EVs and IVs.
//
// Design notes
//   • Ids are stored as 24-bit FNV-1a hashes of the *string* id, never as an
//     index into a data array. The roster is being edited by other agents; an
//     index-based code would silently decode into the wrong fighter the moment
//     somebody inserts a row. A hash either resolves or it doesn't.
//   • Unknown hashes degrade: an unknown move is dropped, an unknown item is
//     cleared, an unknown species drops that member — and the importer reports
//     exactly what it lost instead of failing the whole paste.
//   • Defaults are flagged, not stored: max IVs and empty EVs cost one bit each.

import { getFighter } from '../data/fighters.js';
import { getMove, allMoves } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { ABILITIES } from '../core/abilities.js';
import { allFighters } from '../data/fighters.js';
import { NATURES, defaultIVs, defaultEVs, STAT_KEYS } from '../core/stats.js';

export const CODE_PREFIX = 'GLA1.';
const CODE_VERSION = 1;

// A frozen ordering owned by this file. core/stats.js may reorder NATURES; this
// list must not change, or old codes decode to the wrong nature.
const NATURE_ORDER = [
  'hardy', 'adamant', 'modest', 'jolly', 'timid', 'brave', 'quiet', 'impish',
  'careful', 'bold', 'calm', 'naughty', 'lonely', 'rash', 'mild', 'relaxed',
  'sassy', 'serious', 'docile', 'quirky'
];

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

function h24(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h & 0xffffff;
}

class BitW {
  constructor() { this.bytes = []; this.cur = 0; this.n = 0; }
  w(v, bits) {
    for (let i = bits - 1; i >= 0; i--) {
      this.cur = ((this.cur << 1) | ((v >>> i) & 1)) & 0xff;
      if (++this.n === 8) { this.bytes.push(this.cur); this.cur = 0; this.n = 0; }
    }
  }
  str(s, lenBits) {
    const clean = [...String(s)].filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127).slice(0, (1 << lenBits) - 1);
    this.w(clean.length, lenBits);
    for (const c of clean) this.w(c.charCodeAt(0) - 32, 7);
  }
  bytesOut() {
    const out = this.bytes.slice();
    if (this.n) out.push((this.cur << (8 - this.n)) & 0xff);
    return Uint8Array.from(out);
  }
}

class BitR {
  constructor(bytes) { this.b = bytes; this.i = 0; }
  get left() { return this.b.length * 8 - this.i; }
  r(bits) {
    let v = 0;
    for (let k = 0; k < bits; k++) {
      const byte = this.b[this.i >> 3] ?? 0;
      v = (v << 1) | ((byte >> (7 - (this.i & 7))) & 1);
      this.i++;
    }
    return v >>> 0;
  }
  str(lenBits) {
    const n = this.r(lenBits);
    let s = '';
    for (let i = 0; i < n; i++) s += String.fromCharCode(this.r(7) + 32);
    return s;
  }
}

function b64urlEncode(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ------------------------------------------------------------------ */
/* hash → id resolution                                                */
/* ------------------------------------------------------------------ */

let MAPS = null;
function maps() {
  if (MAPS) return MAPS;
  const build = (ids) => {
    const m = new Map();
    for (const id of ids) {
      const h = h24(id);
      if (m.has(h) && m.get(h) !== id) console.warn('[teamcode] hash collision', id, m.get(h));
      m.set(h, id);
    }
    return m;
  };
  MAPS = {
    species: build(allFighters().map((f) => f.id)),
    move: build(allMoves().map((m) => m.id)),
    item: build(ITEMS.map((i) => i.id)),
    ability: build(Object.keys(ABILITIES))
  };
  return MAPS;
}
/** Data can change at runtime (other agents hot-add). Allow a rebuild. */
export function invalidateCodeMaps() { MAPS = null; }

/* ------------------------------------------------------------------ */
/* encode                                                              */
/* ------------------------------------------------------------------ */

const isDefaultIVs = (iv) => STAT_KEYS.every((k) => (iv?.[k] ?? 31) === 31);
const isEmptyEVs = (ev) => STAT_KEYS.every((k) => (ev?.[k] ?? 0) === 0);

/**
 * @param {{name?:string, members:Array}} team
 * @returns {string} shareable code
 */
export function encodeTeam(team) {
  const w = new BitW();
  const members = (team.members || []).slice(0, 6);
  w.str(team.name || '', 6);
  w.w(members.length, 3);

  for (const m of members) {
    const def = getFighter(m.speciesId);
    w.w(h24(m.speciesId || ''), 24);
    w.w(Math.max(1, Math.min(100, m.level || 50)), 7);
    const nIdx = Math.max(0, NATURE_ORDER.indexOf(m.nature || 'hardy'));
    w.w(nIdx, 8);
    w.w(h24(m.ability || def?.abilities?.[0] || ''), 24);

    if (m.item) { w.w(1, 1); w.w(h24(m.item), 24); } else w.w(0, 1);

    const moves = (m.moves || []).filter(Boolean).slice(0, 4);
    w.w(moves.length, 3);
    for (const id of moves) w.w(h24(id), 24);

    if (isEmptyEVs(m.evs)) w.w(0, 1);
    else { w.w(1, 1); for (const k of STAT_KEYS) w.w(Math.min(63, Math.round((m.evs?.[k] ?? 0) / 4)), 6); }

    if (isDefaultIVs(m.ivs)) w.w(0, 1);
    else { w.w(1, 1); for (const k of STAT_KEYS) w.w(Math.max(0, Math.min(31, m.ivs?.[k] ?? 31)), 5); }

    const nick = m.nickname && def && m.nickname !== def.name ? m.nickname : '';
    if (nick) { w.w(1, 1); w.str(nick, 5); } else w.w(0, 1);
  }

  const body = w.bytesOut();
  let sum = 0;
  for (const b of body) sum = (sum + b) & 0xff;
  const full = new Uint8Array(body.length + 2);
  full[0] = CODE_VERSION;
  full[1] = sum;
  full.set(body, 2);
  return CODE_PREFIX + b64urlEncode(full);
}

/* ------------------------------------------------------------------ */
/* decode                                                              */
/* ------------------------------------------------------------------ */

/**
 * @returns {{ok:true, team:{name,members}, warnings:string[]} | {ok:false, error:string}}
 */
export function decodeTeam(code) {
  if (typeof code !== 'string') return { ok: false, error: 'No code given.' };
  let s = code.trim().replace(/\s+/g, '');
  if (!s) return { ok: false, error: 'No code given.' };
  if (s.toUpperCase().startsWith(CODE_PREFIX)) s = s.slice(CODE_PREFIX.length);
  else if (/^GLA\d\./i.test(s)) return { ok: false, error: 'That code is from a different version of the game.' };

  let bytes;
  try { bytes = b64urlDecode(s); } catch { return { ok: false, error: 'That does not look like a team code.' }; }
  if (bytes.length < 4) return { ok: false, error: 'That code is too short to be a team.' };
  if (bytes[0] !== CODE_VERSION) return { ok: false, error: `Unsupported code version ${bytes[0]}.` };

  const body = bytes.slice(2);
  let sum = 0;
  for (const b of body) sum = (sum + b) & 0xff;
  if (sum !== bytes[1]) return { ok: false, error: 'That code is damaged — a character is missing or changed.' };

  const M = maps();
  const warnings = [];
  const r = new BitR(body);

  try {
    const name = r.str(6);
    const count = r.r(3);
    if (count > 6) return { ok: false, error: 'That code claims an illegal team size.' };
    const members = [];

    for (let i = 0; i < count; i++) {
      const speciesId = M.species.get(r.r(24));
      const level = Math.max(1, Math.min(100, r.r(7)));
      const nature = NATURE_ORDER[r.r(8)] || 'hardy';
      const abilityHash = r.r(24);
      const hasItem = r.r(1);
      const itemHash = hasItem ? r.r(24) : 0;
      const moveCount = r.r(3);
      const moveHashes = [];
      for (let k = 0; k < Math.min(4, moveCount); k++) moveHashes.push(r.r(24));
      for (let k = 4; k < moveCount; k++) r.r(24);   // tolerate a future 5-move format

      let evs = defaultEVs();
      if (r.r(1)) { evs = {}; for (const k of STAT_KEYS) evs[k] = r.r(6) * 4; }
      let ivs = defaultIVs();
      if (r.r(1)) { ivs = {}; for (const k of STAT_KEYS) ivs[k] = r.r(5); }
      const nickname = r.r(1) ? r.str(5) : '';

      if (!speciesId) { warnings.push(`Slot ${i + 1}: that fighter isn't in this build — dropped.`); continue; }
      const def = getFighter(speciesId);

      let ability = M.ability.get(abilityHash);
      if (!ability || !def.abilities.includes(ability)) {
        if (ability) warnings.push(`${def.name}: ability not legal here — reset to ${def.abilities[0]}.`);
        ability = def.abilities[0];
      }

      let item = hasItem ? M.item.get(itemHash) : null;
      if (hasItem && !item) { warnings.push(`${def.name}: held item unknown — removed.`); item = null; }

      const moves = [];
      for (const h of moveHashes) {
        const id = M.move.get(h);
        if (id && getMove(id)) moves.push(id);
        else warnings.push(`${def.name}: a move in this code doesn't exist here — dropped.`);
      }
      if (!moves.length) {
        const fallback = def.learnset.filter((l) => l.lv <= level).map((l) => l.move);
        moves.push(...[...new Set(fallback)].slice(-4));
        warnings.push(`${def.name}: no usable moves in the code — filled from the learnset.`);
      }

      members.push({
        speciesId, nickname: nickname || def.name, level, nature,
        ability, item, moves,
        evs: clampEVs(evs), ivs
      });
    }

    if (!members.length) return { ok: false, error: 'That code decoded, but none of its fighters exist in this build.' };
    return { ok: true, team: { name: name || 'Imported Crew', members }, warnings };
  } catch {
    return { ok: false, error: 'That code ended unexpectedly — it may have been cut short.' };
  }
}

function clampEVs(evs) {
  const out = {};
  let total = 0;
  for (const k of STAT_KEYS) {
    const v = Math.max(0, Math.min(252, evs[k] || 0));
    out[k] = v; total += v;
  }
  if (total > 508) {
    // Trim from the largest stat down until legal, so a hand-edited code can't cheat.
    const order = [...STAT_KEYS].sort((a, b) => out[b] - out[a]);
    let over = total - 508;
    for (const k of order) {
      const cut = Math.min(out[k], over);
      out[k] -= cut; over -= cut;
      if (over <= 0) break;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* human-readable export                                               */
/* ------------------------------------------------------------------ */

const EV_ORDER = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const EV_LABEL = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };

export function teamToText(team) {
  const lines = [`=== ${team.name || 'Crew'} ===`, ''];
  for (const m of team.members || []) {
    const def = getFighter(m.speciesId);
    if (!def) continue;
    const head = m.nickname && m.nickname !== def.name ? `${m.nickname} (${def.name})` : def.name;
    lines.push(`${head}${m.item ? ' @ ' + (ITEMS.find((i) => i.id === m.item)?.name ?? m.item) : ''}`);
    lines.push(`Ability: ${ABILITIES[m.ability]?.name ?? m.ability}`);
    lines.push(`Level: ${m.level}`);
    const evs = EV_ORDER.filter((k) => (m.evs?.[k] || 0) > 0).map((k) => `${m.evs[k]} ${EV_LABEL[k]}`);
    if (evs.length) lines.push(`EVs: ${evs.join(' / ')}`);
    const ivs = EV_ORDER.filter((k) => (m.ivs?.[k] ?? 31) !== 31).map((k) => `${m.ivs[k]} ${EV_LABEL[k]}`);
    if (ivs.length) lines.push(`IVs: ${ivs.join(' / ')}`);
    const n = NATURES[m.nature];
    lines.push(`${m.nature[0].toUpperCase() + m.nature.slice(1)} Nature${n && n.up !== n.down ? ` (+${EV_LABEL[n.up]}, −${EV_LABEL[n.down]})` : ''}`);
    for (const id of m.moves || []) lines.push(`- ${getMove(id)?.name ?? id}`);
    lines.push('');
  }
  lines.push(encodeTeam(team));
  return lines.join('\n');
}
