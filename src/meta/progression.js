// Progression: XP, ranks, unlocks, per-fighter usage records, trophies.
// Pure over the save object — every mutation goes through save.patch().

import * as Save from './save.js';
import { ARENAS } from '../data/arenas.js';
import { heldItems } from '../data/items.js';

/* ------------------------------------------------------------------ */
/* ranks                                                               */
/* ------------------------------------------------------------------ */

export const RANKS = [
  { xp: 0,     name: 'Rookie',        bounty: '30,000,000' },
  { xp: 250,   name: 'Bounty Hunter', bounty: '77,000,000' },
  { xp: 700,   name: 'Supernova',     bounty: '150,000,000' },
  { xp: 1500,  name: 'Warlord',       bounty: '320,000,000' },
  { xp: 3000,  name: 'Commander',     bounty: '860,000,000' },
  { xp: 5500,  name: 'Emperor',       bounty: '1,500,000,000' },
  { xp: 9000,  name: 'Pirate King',   bounty: '5,564,800,000' }
];

export function rankFor(xp) {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].xp) i = k;
  const cur = RANKS[i], next = RANKS[i + 1] || null;
  const span = next ? next.xp - cur.xp : 1;
  return {
    index: i, name: cur.name, bounty: cur.bounty, next,
    into: xp - cur.xp, span,
    progress: next ? Math.min(1, (xp - cur.xp) / span) : 1
  };
}

/* ------------------------------------------------------------------ */
/* unlocks                                                             */
/* ------------------------------------------------------------------ */

// Everything on the roster is playable from turn one — locking fighters would
// make a new player's game worse, not better. What you earn is *variety*:
// stages, held items, modes and titles.
export const UNLOCKS = [
  { id: 'mode.tournament', cat: 'modes',  ref: 'tournament',      name: 'Grand Line Cup', blurb: 'An eight-fighter bracket you can lose.', test: (s) => s.record.played >= 1 },
  { id: 'mode.gauntlet',   cat: 'modes',  ref: 'gauntlet',        name: 'Survival Gauntlet', blurb: 'One team, no healing between fights.', test: (s) => s.record.won >= 2 },
  { id: 'arena.sunny',     cat: 'arenas', ref: 'sunny_deck',      name: 'Thousand Sunny', blurb: 'Fight on the deck.', test: (s) => s.record.played >= 2 },
  { id: 'arena.onigashima', cat: 'arenas', ref: 'onigashima',     name: 'Onigashima Rooftop', blurb: 'Night, drums, no rails.', test: (s) => s.record.won >= 3 },
  { id: 'arena.skypiea',   cat: 'arenas', ref: 'skypiea',         name: 'Upper Yard', blurb: 'Ten thousand metres up.', test: (s) => s.record.won >= 6 },
  { id: 'arena.baratie',   cat: 'arenas', ref: 'baratie',         name: 'Baratie', blurb: 'The sea restaurant.', test: (s) => s.trophies.length >= 1 },
  { id: 'item.leftovers',  cat: 'items',  ref: 'leftovers',       name: 'Ship Rations', blurb: 'Held item: heals 1/16 each turn.', test: (s) => s.record.played >= 3 },
  { id: 'item.focus',      cat: 'items',  ref: 'focus_lens',      name: 'Focus Lens', blurb: 'Held item: +20% special damage.', test: (s) => s.record.won >= 4 },
  { id: 'item.weighted',   cat: 'items',  ref: 'weighted_bands',  name: 'Weighted Bands', blurb: 'Held item: +50% damage, half Speed.', test: (s) => s.record.kos >= 20 },
  { id: 'item.seastone',   cat: 'items',  ref: 'sea_stone_band',  name: 'Sea-Stone Band', blurb: 'Held item: blocks status.', test: (s) => s.record.won >= 8 },
  { id: 'title.unbeaten',  cat: 'titles', ref: 'Unbeaten',        name: 'Title: Unbeaten', blurb: 'Win five in a row.', test: (s) => s.record.bestStreak >= 5 },
  { id: 'title.flawless',  cat: 'titles', ref: 'Flawless',        name: 'Title: Flawless', blurb: 'Win without losing a fighter.', test: (s) => s.record.perfect >= 1 },
  { id: 'title.champion',  cat: 'titles', ref: 'Champion',        name: 'Title: Champion', blurb: 'Take a cup.', test: (s) => s.trophies.length >= 1 }
];

// Available from the very first boot.
const STARTING = {
  arenas: ['colosseum', 'marineford'],
  items: ['power_band'],
  modes: ['quick', 'versus', 'daily', 'tutorial'],
  titles: ['Unknown']
};

export function isUnlocked(cat, ref, save = Save.data()) {
  if (STARTING[cat]?.includes(ref)) return true;
  return !!save.unlocked?.[cat]?.includes(ref);
}

export function unlockedArenas(save = Save.data()) {
  return ARENAS.filter((a) => isUnlocked('arenas', a.id, save));
}
export function unlockedHeldItems(save = Save.data()) {
  return heldItems().filter((i) => isUnlocked('items', i.id, save));
}
export function lockedList(save = Save.data()) {
  return UNLOCKS.filter((u) => !isUnlocked(u.cat, u.ref, save));
}

/** Evaluate every unlock rule; returns the ones that just fired. */
export function checkUnlocks(save) {
  const fired = [];
  for (const u of UNLOCKS) {
    if (isUnlocked(u.cat, u.ref, save)) continue;
    let ok = false;
    try { ok = !!u.test(save); } catch { ok = false; }
    if (!ok) continue;
    save.unlocked[u.cat] = [...new Set([...(save.unlocked[u.cat] || []), u.ref])];
    fired.push(u);
  }
  return fired;
}

/* ------------------------------------------------------------------ */
/* fighter records                                                     */
/* ------------------------------------------------------------------ */

export function fighterRecord(id, save = Save.data()) {
  return save.fighters[id] || { battles: 0, wins: 0, kos: 0, damage: 0, faints: 0, seen: 0 };
}

export function mostUsed(save = Save.data(), n = 5) {
  return Object.entries(save.fighters)
    .map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => b.battles - a.battles || b.damage - a.damage)
    .slice(0, n);
}

/* ------------------------------------------------------------------ */
/* recording a battle                                                  */
/* ------------------------------------------------------------------ */

export function xpForBattle(report) {
  if (!report) return 0;
  const base = report.win ? 120 : report.draw ? 50 : 35;
  const turnBonus = Math.min(80, (report.turns || 0) * 4);
  const koBonus = (report.playerKos || 0) * 18;
  const perfect = report.win && (report.playerFaints || 0) === 0 ? 60 : 0;
  const tier = { rookie: 0.7, pirate: 0.9, ace: 1, warlord: 1.25, yonko: 1.5 }[report.aiLevel] ?? 1;
  return Math.round((base + turnBonus + koBonus + perfect) * tier);
}

/**
 * Fold a finished battle into the save.
 * @param {object} report  from meta/battleReport.js → buildReport()
 * @returns {{xp:number, rankUp:object|null, unlocks:array, trophy:object|null}}
 */
export function recordBattle(report) {
  const gained = xpForBattle(report);
  let rankUp = null, unlocks = [];

  Save.patch((s) => {
    const before = rankFor(s.xp);
    s.record.played++;
    if (report.draw) s.record.drawn++;
    else if (report.win) s.record.won++;
    else s.record.lost++;

    s.record.streak = report.win ? s.record.streak + 1 : 0;
    s.record.bestStreak = Math.max(s.record.bestStreak, s.record.streak);
    s.record.turns += report.turns || 0;
    s.record.damageDealt += report.playerDamage || 0;
    s.record.damageTaken += report.foeDamage || 0;
    s.record.kos += report.playerKos || 0;
    s.record.koed += report.playerFaints || 0;
    if (report.win && (report.playerFaints || 0) === 0) s.record.perfect++;

    for (const m of report.playerTeam || []) {
      const r = s.fighters[m.speciesId] || { battles: 0, wins: 0, kos: 0, damage: 0, faints: 0, seen: 0 };
      r.battles++;
      if (report.win) r.wins++;
      r.kos += m.kos || 0;
      r.damage += m.damage || 0;
      if (m.fainted) r.faints++;
      s.fighters[m.speciesId] = r;
    }
    for (const m of report.foeTeam || []) {
      const r = s.fighters[m.speciesId] || { battles: 0, wins: 0, kos: 0, damage: 0, faints: 0, seen: 0 };
      r.seen++;
      s.fighters[m.speciesId] = r;
    }

    s.xp += gained;
    const after = rankFor(s.xp);
    if (after.index > before.index) rankUp = after;
    unlocks = checkUnlocks(s);
  });

  return { xp: gained, rankUp, unlocks, trophy: null };
}

export function awardTrophy(trophy) {
  let unlocks = [];
  Save.patch((s) => {
    s.trophies.push({ at: Date.now(), ...trophy });
    unlocks = checkUnlocks(s);
  });
  return unlocks;
}

export function recordDaily(dateKey, result) {
  Save.patch((s) => { s.daily[dateKey] = { at: Date.now(), ...result }; checkUnlocks(s); });
}

/* ------------------------------------------------------------------ */
/* teams                                                               */
/* ------------------------------------------------------------------ */

export function saveTeam(team) {
  const id = team.id || 'team_' + Math.random().toString(36).slice(2, 9);
  Save.patch((s) => {
    const rec = { id, name: team.name || 'New Crew', members: team.members || [], updatedAt: Date.now() };
    const i = s.teams.findIndex((t) => t.id === id);
    if (i >= 0) s.teams[i] = rec; else s.teams.push(rec);
    s.activeTeamId = id;
  });
  return id;
}

export function deleteTeam(id) {
  Save.patch((s) => {
    s.teams = s.teams.filter((t) => t.id !== id);
    if (s.activeTeamId === id) s.activeTeamId = s.teams[0]?.id ?? null;
  });
}

export function getTeam(id, save = Save.data()) { return save.teams.find((t) => t.id === id) || null; }

export function activeTeam(save = Save.data()) {
  return getTeam(save.activeTeamId, save) || save.teams[0] || null;
}
