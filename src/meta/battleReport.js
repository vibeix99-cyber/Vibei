// Turns a finished battle into something worth reading: who did the damage,
// who the MVP was, and a turn-by-turn account of how it actually went.
//
// Pure — reads the battle's event stream (docs/ARCHITECTURE.md §4) and nothing else.
// Damage events carry the *victim*, not the attacker, so attribution walks the
// stream and credits the most recent `moveUsed` actor.

import { getMove } from '../data/moves.js';
import { getFighter } from '../data/fighters.js';
import { STATUSES, WEATHERS, TERRAINS, volatileName } from '../core/status.js';
import { STAT_SHORT } from '../core/stats.js';

const EFF_LABEL = { 0: 'no effect', 0.25: 'barely scratched', 0.5: 'resisted', 1: '', 2: 'super effective', 4: 'devastating' };

function blankTally(mon, side) {
  return {
    uid: mon.uid, side,
    speciesId: mon.speciesId, nickname: mon.nickname, name: mon.name,
    level: mon.level, types: (mon.types || []).slice(),
    damage: 0, taken: 0, kos: 0, fainted: !!mon.fainted,
    hp: mon.hp, maxHp: mon.maxHp,
    hits: 0, crits: 0, misses: 0, bestHit: 0, bestMove: null,
    movesUsed: 0, switchIns: 0, statusInflicted: 0, turnsActive: 0
  };
}

/**
 * @param {object} battle   the raw battle state (has .events, .sides, .turn, .winner)
 * @param {number} playerSide
 */
export function buildReport(battle, playerSide = 0, extra = {}) {
  const tallies = new Map();
  const sides = [[], []];
  for (const s of battle.sides) {
    for (const mon of s.party) {
      const t = blankTally(mon, s.index);
      tallies.set(mon.uid, t);
      sides[s.index].push(t);
    }
  }

  const turnLines = [];
  let turn = { turn: 0, entries: [] };
  turnLines.push(turn);

  let lastMover = null;         // { uid, side, moveId, move }
  let pendingHit = null;        // the entry a damage event should attach to
  const push = (e) => { turn.entries.push(e); return e; };

  const nameOf = (uid) => tallies.get(uid)?.nickname ?? '?';
  const sideTag = (s) => (s === playerSide ? 'you' : 'foe');

  for (const ev of battle.events || []) {
    switch (ev.t) {
      case 'turnStart':
        turn = { turn: ev.turn, entries: [] };
        turnLines.push(turn);
        lastMover = null;
        break;

      case 'switchIn': {
        const t = tallies.get(ev.uid);
        if (t) t.switchIns++;
        push({ kind: 'switch', side: ev.side, who: sideTag(ev.side), text: `${ev.nickname} enters` });
        break;
      }

      case 'moveUsed': {
        const move = getMove(ev.moveId);
        lastMover = { uid: ev.uid, side: ev.side, moveId: ev.moveId, move };
        const t = tallies.get(ev.uid);
        if (t) t.movesUsed++;
        pendingHit = push({
          kind: 'move', side: ev.side, who: sideTag(ev.side),
          actor: nameOf(ev.uid), move: move?.name || ev.moveId,
          moveType: move?.type || null, category: move?.category || 'status',
          target: nameOf(ev.targetUid), damage: 0, pct: 0, eff: 1, crit: false, hits: 0, note: ''
        });
        break;
      }

      case 'miss': {
        const t = tallies.get(ev.uid);
        if (t) t.misses++;
        if (pendingHit) pendingHit.note = ev.reason === 'protect' ? 'blocked' : ev.reason === 'immune' ? 'no effect' : 'missed';
        break;
      }

      case 'damage': {
        const victim = tallies.get(ev.uid);
        if (victim) { victim.taken += ev.amount; victim.hp = ev.hpAfter; }
        const bySelf = lastMover && lastMover.uid === ev.uid;
        if (ev.source === 'move' && lastMover && !bySelf) {
          const dealer = tallies.get(lastMover.uid);
          if (dealer) {
            dealer.damage += ev.amount;
            dealer.hits++;
            if (ev.crit) dealer.crits++;
            if (ev.amount > dealer.bestHit) { dealer.bestHit = ev.amount; dealer.bestMove = lastMover.move?.name || lastMover.moveId; }
          }
          if (pendingHit) {
            pendingHit.damage += ev.amount;
            pendingHit.pct = victim ? Math.round((pendingHit.damage / victim.maxHp) * 100) : 0;
            pendingHit.eff = ev.eff ?? 1;
            pendingHit.crit = pendingHit.crit || !!ev.crit;
            pendingHit.hits = (pendingHit.hits || 0) + 1;
          }
        } else if (ev.source !== 'move') {
          push({
            kind: 'chip', side: ev.side, who: sideTag(ev.side),
            text: `${nameOf(ev.uid)} −${ev.amount} (${chipLabel(ev.source)})`
          });
        }
        break;
      }

      case 'heal':
        if (ev.amount > 0) {
          const t = tallies.get(ev.uid);
          if (t) t.hp = ev.hpAfter;
          push({ kind: 'heal', side: ev.side, who: sideTag(ev.side), text: `${nameOf(ev.uid)} +${ev.amount} HP` });
        }
        break;

      case 'statusApply': {
        if (lastMover && lastMover.uid !== ev.uid) {
          const dealer = tallies.get(lastMover.uid);
          if (dealer) dealer.statusInflicted++;
        }
        push({ kind: 'status', side: ev.side, who: sideTag(ev.side), status: ev.status,
          text: `${nameOf(ev.uid)} — ${STATUSES[ev.status]?.name ?? ev.status}` });
        break;
      }

      case 'boost':
        if (!ev.failed && ev.delta) {
          push({ kind: 'boost', side: ev.side, who: sideTag(ev.side), delta: ev.delta,
            text: `${nameOf(ev.uid)} ${STAT_SHORT[ev.stat] || ev.stat} ${ev.delta > 0 ? '+' : ''}${ev.delta}` });
        }
        break;

      case 'volatileStart':
        push({ kind: 'note', side: ev.side, who: sideTag(ev.side), text: `${nameOf(ev.uid)} — ${volatileName(ev.id)}` });
        break;

      case 'weather':
        if (ev.phase === 'start') push({ kind: 'field', text: `${WEATHERS[ev.id]?.name ?? ev.id} begins` });
        break;
      case 'terrain':
        if (ev.phase === 'start') push({ kind: 'field', text: `${TERRAINS[ev.id]?.name ?? ev.id} spreads` });
        break;
      case 'hazard':
        push({ kind: 'field', text: `Hazards on ${sideTag(ev.side)} side` });
        break;

      case 'cannotMove':
        push({ kind: 'note', side: ev.side, who: sideTag(ev.side), text: `${nameOf(ev.uid)} couldn't move (${ev.reason})` });
        break;

      case 'faint': {
        const t = tallies.get(ev.uid);
        if (t) { t.fainted = true; t.hp = 0; }
        // Credit the KO to whoever last landed a move on them.
        if (lastMover && lastMover.uid !== ev.uid) {
          const dealer = tallies.get(lastMover.uid);
          if (dealer && dealer.side !== ev.side) dealer.kos++;
        }
        push({ kind: 'faint', side: ev.side, who: sideTag(ev.side), text: `${nameOf(ev.uid)} is down` });
        break;
      }

      default: break;
    }
  }

  // Drop turn 0 if the opening had nothing but the two lead switch-ins.
  const cleaned = turnLines.filter((t, i) => t.entries.length > 0 || i > 0);

  const mine = sides[playerSide], theirs = sides[1 - playerSide];
  const sum = (arr, k) => arr.reduce((a, x) => a + x[k], 0);

  const winner = battle.winner;
  const win = winner === playerSide;
  const draw = winner === 'draw';

  const mvp = pickMvp(win ? mine : theirs, win ? theirs : mine, win);

  return {
    win, draw, lose: !win && !draw,
    winner,
    turns: battle.turn || 0,
    arena: battle.arena,
    playerSide,
    sideNames: battle.sides.map((s) => s.name),
    playerTeam: mine, foeTeam: theirs,
    playerDamage: sum(mine, 'damage'), foeDamage: sum(theirs, 'damage'),
    playerKos: sum(mine, 'kos'), playerFaints: mine.filter((m) => m.fainted).length,
    foeFaints: theirs.filter((m) => m.fainted).length,
    survivors: mine.filter((m) => !m.fainted).length,
    mvp,
    turnLines: cleaned,
    highlights: highlightsOf(mine, theirs, cleaned),
    aiLevel: extra.aiLevel || null,
    mode: extra.mode || null,
    seed: battle.seed
  };
}

function chipLabel(source) {
  return {
    hazard: 'hazards', recoil: 'recoil', burn: 'burn', poison: 'poison',
    weather: 'weather', confusion: 'confusion', leechseed: 'leech',
    substitute: 'substitute', destinybond: 'destiny bond', item: 'item', ability: 'ability'
  }[source] || source;
}

/** MVP = KOs first, then damage, then chip contribution. Ties break on survival. */
function pickMvp(winners, losers, playerWon) {
  const pool = winners.length ? winners : losers;
  let best = null;
  for (const t of pool) {
    const score = t.kos * 1000 + t.damage + (t.fainted ? 0 : 60) + t.statusInflicted * 40;
    if (!best || score > best.score) best = { ...t, score };
  }
  if (!best) return null;
  const reasons = [];
  if (best.kos) reasons.push(`${best.kos} knockout${best.kos === 1 ? '' : 's'}`);
  if (best.damage) reasons.push(`${best.damage} damage`);
  if (best.crits) reasons.push(`${best.crits} crit${best.crits === 1 ? '' : 's'}`);
  if (!best.fainted && playerWon) reasons.push('never went down');
  best.reason = reasons.join(' · ') || 'held the line';
  return best;
}

function highlightsOf(mine, theirs, turnLines) {
  const out = [];
  const all = [...mine, ...theirs];
  const biggest = all.reduce((a, b) => (b.bestHit > (a?.bestHit ?? -1) ? b : a), null);
  if (biggest?.bestHit) out.push({ icon: '💥', label: 'Biggest hit', value: `${biggest.nickname} · ${biggest.bestMove} · ${biggest.bestHit}` });
  const crits = all.reduce((a, b) => a + b.crits, 0);
  if (crits) out.push({ icon: '🎯', label: 'Critical hits', value: String(crits) });
  const misses = all.reduce((a, b) => a + b.misses, 0);
  if (misses) out.push({ icon: '🌫', label: 'Whiffed', value: `${misses} attack${misses === 1 ? '' : 's'}` });
  const switches = all.reduce((a, b) => a + Math.max(0, b.switchIns - 1), 0);
  if (switches) out.push({ icon: '🔁', label: 'Switches', value: String(switches) });
  const longest = turnLines.length;
  out.push({ icon: '⏱', label: 'Turns', value: String(Math.max(0, longest - 1)) });
  return out;
}

/** Rebuild TeamMember[] from a finished battle so a rematch keeps the same crews. */
export function teamsFromBattle(battle) {
  if (!battle?.sides) return null;
  return battle.sides.map((s) => s.party.map((p) => ({
    speciesId: p.speciesId,
    nickname: p.nickname,
    level: p.level,
    nature: p.nature,
    ivs: { ...p.ivs },
    evs: { ...p.evs },
    ability: p.baseAbility || p.ability,
    item: p.item,
    moves: p.moves.map((m) => m.id)
  })));
}

/** One-line summary suitable for sharing. */
export function shareLine(report) {
  const verdict = report.draw ? 'Draw' : report.win ? 'Win' : 'Loss';
  return `${verdict} in ${report.turns} turns · ${report.survivors}/${report.playerTeam.length} standing · MVP ${report.mvp?.nickname ?? '—'}`;
}

export function effWord(eff) { return EFF_LABEL[eff] ?? ''; }

export function speciesName(id) { return getFighter(id)?.name ?? id; }
