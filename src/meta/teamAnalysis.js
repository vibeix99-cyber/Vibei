// Team analysis for the builder: coverage, shared weaknesses, speed tiers, and
// the two questions every competitive team has to answer — "what absorbs a
// status?" and "what happens when they set hazards?".
//
// Every rule here mirrors an actual rule in core/, not a guess:
//   • status type immunities come from engine.applyStatus's IMMUNE table
//   • hazard grounding comes from engine.applyHazards (`WIND` types float)
//   • speed comes from stats.computeStats, not from base stats

import { TYPES, typeEff } from '../core/types.js';
import { computeStats } from '../core/stats.js';
import { getFighter } from '../data/fighters.js';
import { getMove } from '../data/moves.js';
import { ABILITIES } from '../core/abilities.js';

// Mirrors engine.applyStatus.
const STATUS_TYPE_IMMUNE = { brn: ['FLAME'], frz: ['FROST'], par: ['STORM'], psn: ['TOXIN'], tox: ['TOXIN'] };

export function memberStats(m) {
  const def = getFighter(m.speciesId);
  if (!def) return null;
  return computeStats(def.base, m.level || 50, m.ivs, m.evs, m.nature || 'hardy');
}

function damagingMoves(m) {
  return (m.moves || []).map(getMove).filter((mv) => mv && mv.category !== 'status' && mv.power > 0);
}

/**
 * @param {Array} members TeamMember[]
 */
export function analyseTeam(members) {
  const rows = (members || []).map((m) => {
    const def = getFighter(m.speciesId);
    if (!def) return null;
    return { m, def, stats: memberStats(m), types: def.types, moves: (m.moves || []).map(getMove).filter(Boolean) };
  }).filter(Boolean);

  const size = rows.length;

  /* ---- offensive coverage: best multiplier the team can put on each type ---- */
  const coverage = TYPES.map((t) => {
    let best = 0, by = null;
    for (const r of rows) {
      for (const mv of damagingMoves(r.m)) {
        const e = typeEff(mv.type, [t]);
        if (e > best) { best = e; by = { who: r.def.name, move: mv.name, type: mv.type }; }
      }
    }
    return { type: t, mult: best, by };
  });
  const holes = coverage.filter((c) => c.mult < 1);

  /* ---- defensive profile ---- */
  const threats = TYPES.map((t) => {
    let weak = 0, resist = 0, immune = 0;
    const weakTo = [];
    for (const r of rows) {
      const e = typeEff(t, r.types);
      if (e === 0) immune++;
      else if (e >= 2) { weak++; weakTo.push({ who: r.def.name, mult: e }); }
      else if (e <= 0.5) resist++;
    }
    return { type: t, weak, resist, immune, weakTo, share: size ? weak / size : 0 };
  });
  const shared = threats.filter((t) => t.weak >= 2 && t.share >= 0.5).sort((a, b) => b.weak - a.weak);
  const unresisted = threats.filter((t) => t.resist === 0 && t.immune === 0 && t.weak > 0);

  /* ---- speed tiers ---- */
  const speeds = rows.map((r) => ({
    name: r.m.nickname || r.def.name, id: r.def.id,
    spe: r.stats?.spe ?? 0,
    scarfed: r.m.item === 'weighted_bands'
  })).sort((a, b) => b.spe - a.spe);

  /* ---- status absorbers ---- */
  const absorbers = rows.filter((r) => {
    if (r.m.item === 'sea_stone_band') return true;
    const ab = ABILITIES[r.m.ability];
    if (ab?.onStatusImmune) return true;
    return false;
  }).map((r) => ({
    name: r.m.nickname || r.def.name,
    how: r.m.item === 'sea_stone_band' ? 'Sea-Stone Band' : (ABILITIES[r.m.ability]?.name ?? r.m.ability)
  }));
  // Partial cover: type immunity to the common statuses.
  const typeCover = {};
  for (const [st, types] of Object.entries(STATUS_TYPE_IMMUNE)) {
    typeCover[st] = rows.filter((r) => types.some((t) => r.types.includes(t))).map((r) => r.m.nickname || r.def.name);
  }

  /* ---- hazards ---- */
  const floaters = rows.filter((r) => r.types.includes('WIND')).map((r) => r.m.nickname || r.def.name);
  const setters = rows.filter((r) => r.moves.some((mv) => mv.effects?.some((e) => e.kind === 'hazard')))
    .map((r) => r.m.nickname || r.def.name);
  const rations = rows.filter((r) => r.m.item === 'leftovers').map((r) => r.m.nickname || r.def.name);
  const shardBait = rows.filter((r) => typeEff('FROST', r.types) >= 2).map((r) => r.m.nickname || r.def.name);

  /* ---- move-shape roles ---- */
  const phys = rows.filter((r) => damagingMoves(r.m).filter((mv) => mv.category === 'physical').length
    > damagingMoves(r.m).filter((mv) => mv.category === 'special').length).length;
  const spec = rows.filter((r) => damagingMoves(r.m).filter((mv) => mv.category === 'special').length
    > damagingMoves(r.m).filter((mv) => mv.category === 'physical').length).length;
  const priority = rows.filter((r) => r.moves.some((mv) => mv.priority > 0)).map((r) => r.m.nickname || r.def.name);
  const recovery = rows.filter((r) => r.moves.some((mv) => mv.effects?.some((e) => e.kind === 'heal')) || r.m.item === 'leftovers')
    .map((r) => r.m.nickname || r.def.name);
  const setup = rows.filter((r) => r.moves.some((mv) => mv.effects?.some((e) => e.kind === 'boost' && e.target === 'self')))
    .map((r) => r.m.nickname || r.def.name);
  const screens = rows.filter((r) => r.moves.some((mv) => mv.effects?.some((e) => e.kind === 'screen')))
    .map((r) => r.m.nickname || r.def.name);
  const statusMoves = rows.filter((r) => r.moves.some((mv) => mv.category === 'status' && mv.target === 'foe'))
    .map((r) => r.m.nickname || r.def.name);

  /* ---- verdicts ---- */
  const notes = [];
  const bad = (text) => notes.push({ level: 'bad', text });
  const warn = (text) => notes.push({ level: 'warn', text });
  const good = (text) => notes.push({ level: 'good', text });

  if (!size) return emptyAnalysis();

  if (shared.length) {
    const s = shared[0];
    bad(`${s.weak} of ${size} fold to ${s.type}. One well-timed ${s.type} move takes half your crew.`);
    for (const s2 of shared.slice(1, 3)) warn(`${s2.weak} of ${size} are also weak to ${s2.type}.`);
  } else good('No type takes out more than one of you at a time.');

  if (holes.length > 6) warn(`${holes.length} of 18 types resist everything you can throw. Widest gap: ${holes.slice(0, 3).map((h) => h.type).join(', ')}.`);
  else if (holes.length) warn(`Nothing hits ${holes.map((h) => h.type).join(', ')} neutrally.`);
  else good('You have at least neutral coverage on all 18 types.');

  if (!absorbers.length) warn('Nothing on this team shrugs off a status. A single Toxic Brand is a free win condition against you.');
  else good(`${absorbers.map((a) => a.name).join(', ')} can eat a status (${absorbers[0].how}).`);

  if (!floaters.length && !rations.length) warn('Every member is grounded and nothing heals: caltrops chip you 12.5% per switch, all game.');
  else if (floaters.length) good(`${floaters.join(', ')} float over ground hazards.`);

  if (shardBait.length >= Math.ceil(size / 2)) warn(`Ice Shards would bite ${shardBait.length} of ${size} for 25% on entry.`);

  if (!priority.length) warn('No priority move — anything faster than you at 1 HP gets a free turn.');
  if (!recovery.length) warn('No recovery anywhere. Every point of chip damage is permanent.');
  if (size >= 3 && (phys === size || spec === size)) {
    warn(`Every attacker is ${phys === size ? 'physical' : 'special'}. One Iron Wall / Light Wall halves your whole team.`);
  }

  const fastest = speeds[0]?.spe ?? 0;
  const slowest = speeds[speeds.length - 1]?.spe ?? 0;
  if (size >= 3 && fastest - slowest < 25) warn('Your whole team sits in one speed tier — you will win or lose every race together.');

  return {
    size, rows,
    coverage, holes, threats, shared, unresisted,
    speeds, absorbers, typeCover,
    hazards: { floaters, setters, rations, shardBait },
    roles: { phys, spec, priority, recovery, setup, screens, statusMoves },
    notes,
    score: scoreOf({ shared, holes, absorbers, priority, recovery, size })
  };
}

function scoreOf({ shared, holes, absorbers, priority, recovery, size }) {
  let s = 100;
  s -= shared.length * 14;
  s -= Math.max(0, holes.length - 2) * 3;
  if (!absorbers.length) s -= 10;
  if (!priority.length) s -= 8;
  if (!recovery.length) s -= 8;
  if (size < 3) s -= (3 - size) * 12;
  return Math.max(5, Math.min(100, Math.round(s)));
}

function emptyAnalysis() {
  return {
    size: 0, rows: [], coverage: [], holes: [], threats: [], shared: [], unresisted: [],
    speeds: [], absorbers: [], typeCover: {},
    hazards: { floaters: [], setters: [], rations: [], shardBait: [] },
    roles: { phys: 0, spec: 0, priority: [], recovery: [], setup: [], screens: [], statusMoves: [] },
    notes: [{ level: 'warn', text: 'Add a fighter to see how the crew holds up.' }],
    score: 0
  };
}

/** Legality, mirroring what battleState/engine will actually accept. */
export function validateTeam(members) {
  const errors = [];
  const warnings = [];
  if (!members?.length) errors.push('A team needs at least one fighter.');
  if (members?.length > 6) errors.push('Six fighters maximum.');
  members?.forEach((m, i) => {
    const def = getFighter(m.speciesId);
    const who = m.nickname || def?.name || `Slot ${i + 1}`;
    if (!def) { errors.push(`${who}: unknown fighter.`); return; }
    if (!m.moves?.length) errors.push(`${who} has no moves.`);
    if (m.moves?.length > 4) errors.push(`${who} has more than four moves.`);
    if (new Set(m.moves).size !== (m.moves || []).length) errors.push(`${who} has a duplicate move.`);
    for (const id of m.moves || []) if (!getMove(id)) errors.push(`${who}: unknown move "${id}".`);
    if (!def.abilities.includes(m.ability)) errors.push(`${who} cannot have that ability.`);
    const evTotal = Object.values(m.evs || {}).reduce((a, b) => a + b, 0);
    if (evTotal > 508) errors.push(`${who} spends ${evTotal} training points — the cap is 508.`);
    for (const [k, v] of Object.entries(m.evs || {})) if (v > 252) errors.push(`${who}: ${k.toUpperCase()} training over 252.`);
    if (evTotal === 0) warnings.push(`${who} has no training points spent.`);
    if ((m.moves || []).every((id) => getMove(id)?.category === 'status')) warnings.push(`${who} has no attacking move.`);
  });
  return { ok: errors.length === 0, errors, warnings };
}
