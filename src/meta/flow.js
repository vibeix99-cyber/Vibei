// The glue between a finished battle and everything that remembers it.
//
// The battle screen knows nothing about tournaments, dailies or XP — it just
// hands the results screen `replayFrom` (its own mount params) and the router
// keeps the finished battle around. This module turns that pair into:
//   • a readable report            (meta/battleReport.js)
//   • progression + unlocks        (meta/progression.js)
//   • an advanced run              (meta/runs.js)
//   • the parameters for a rematch that keeps the same two crews
//
// Everything here is defensive: a battle that ended in a weird state, a run
// that vanished from the save, a storage write that failed — none of them may
// stop the player getting back to a menu.

import { buildReport, teamsFromBattle } from './battleReport.js';
import * as Save from './save.js';
import { recordBattle, awardTrophy, recordDaily, rankFor } from './progression.js';
import {
  advanceTournament, advanceGauntlet, gauntletLive, storeRun, loadRun,
  getCup, roundName, dailyScore, dateKey
} from './runs.js';
import { getOpponent } from './opponents.js';

/** Battle params carry `meta` describing why the fight happened. */
export function battleMeta(params) {
  return (params && params.meta) || {};
}

/**
 * Fold a finished battle into the save and any run it belonged to.
 * Safe to call more than once for the same battle — the second call is a
 * read-only replay of the first result.
 *
 * @param {object} battle  raw battle state (from the router's `lastBattle`)
 * @param {object} params  the battle screen's mount params
 * @returns {{report, rewards, meta, run, runOutcome, trophy, daily}}
 */
export function finishBattle(battle, params = {}) {
  const meta = battleMeta(params);
  if (battle && battle.__glaOutcome) return battle.__glaOutcome;

  let report;
  try {
    report = buildReport(battle, 0, { aiLevel: params.aiLevel || meta.aiLevel || null, mode: meta.kind || null });
  } catch (e) {
    console.warn('[flow] report failed', e);
    report = fallbackReport(battle);
  }

  const out = { report, rewards: null, meta, run: null, runOutcome: null, trophy: null, daily: null };

  // The tutorial is a lesson, not a match: it must not pollute the record.
  if (meta.kind !== 'tutorial') {
    try { out.rewards = recordBattle(report); } catch (e) { console.warn('[flow] recordBattle failed', e); }
  }

  try {
    if (meta.kind === 'tournament') advanceTournamentRun(out, report);
    else if (meta.kind === 'gauntlet') advanceGauntletRun(out, report);
    else if (meta.kind === 'daily') recordDailyRun(out, report, meta);
    else if (meta.kind === 'tutorial') markTutorialDone();
  } catch (e) {
    console.warn('[flow] run advance failed', e);
  }

  if (battle) { try { battle.__glaOutcome = out; } catch { /* frozen state; fine */ } }
  return out;
}

function fallbackReport(battle) {
  const winner = battle?.winner ?? null;
  return {
    win: winner === 0, draw: winner === 'draw', lose: winner === 1,
    winner, turns: battle?.turn || 0, arena: battle?.arena || null, playerSide: 0,
    sideNames: battle?.sides?.map((s) => s.name) || ['You', 'Rival'],
    playerTeam: [], foeTeam: [], playerDamage: 0, foeDamage: 0,
    playerKos: 0, playerFaints: 0, foeFaints: 0, survivors: 0,
    mvp: null, turnLines: [], highlights: [], aiLevel: null, mode: null, seed: battle?.seed
  };
}

/* ------------------------------------------------------------------ */
/* runs                                                                */
/* ------------------------------------------------------------------ */

function advanceTournamentRun(out, report) {
  const run = loadRun('tournament');
  if (!run || run.status !== 'active') return;
  advanceTournament(run, report.win, { turns: report.turns });
  storeRun('tournament', run);
  out.run = run;
  out.runOutcome = run.status;                 // 'active' | 'won' | 'lost'
  if (run.status === 'won') {
    const cup = getCup(run.cupId);
    const trophy = { id: cup.id, name: cup.name, tier: cup.sub, cupId: cup.id };
    try { awardTrophy(trophy); out.trophy = trophy; } catch { /* storage said no */ }
  }
}

function advanceGauntletRun(out, report) {
  const run = loadRun('gauntlet');
  if (!run || run.status !== 'active') return;
  advanceGauntlet(run, report.win, report);
  storeRun('gauntlet', run);
  out.run = run;
  out.runOutcome = run.status;                 // 'active' | 'over' | 'cleared'
}

function recordDailyRun(out, report, meta) {
  const key = meta.dailyKey || dateKey();
  const score = dailyScore(report);
  const prev = Save.data().daily?.[key] || null;
  const best = prev && prev.score > score ? prev.score : score;
  recordDaily(key, {
    win: report.win, turns: report.turns, score, best,
    alive: report.survivors, twist: meta.twist || null
  });
  out.daily = { key, score, best, improved: !prev || score >= (prev.score || 0) };
}

function markTutorialDone() {
  Save.patch((s) => { s.tutorial.done = true; });
}

/* ------------------------------------------------------------------ */
/* rematch                                                             */
/* ------------------------------------------------------------------ */

/**
 * Parameters that replay the same matchup with a fresh seed.
 * The old results screen re-used the original params, which for a random
 * matchup meant "roll two brand-new teams" — the one thing a rematch must
 * never do. Teams are read back out of the finished battle instead.
 */
export function rematchParams(params = {}, battle = null) {
  const next = { ...params };
  delete next.seed;
  const teams = battle ? teamsFromBattle(battle) : null;
  if (teams) { next.p0Team = teams[0]; next.p1Team = teams[1]; }
  if (battle?.sides) {
    next.p0Name = battle.sides[0].name;
    next.p1Name = battle.sides[1].name;
    next.arena = battle.arena;
  }
  if (next.p0Team) next.teamSize = next.p0Team.length;
  next.meta = { ...(params.meta || {}), rematch: true };
  return next;
}

/* ------------------------------------------------------------------ */
/* what the player should do next                                      */
/* ------------------------------------------------------------------ */

/**
 * The one button the results screen should make loudest.
 * @returns {{label:string, screen:string, params?:object, cls?:string}|null}
 */
export function nextStep(out) {
  const meta = out.meta || {};
  if (meta.kind === 'tournament' && out.run) {
    if (out.run.status === 'active') {
      return { label: `Next: ${roundName(out.run)}`, screen: 'tournament', cls: 'btn primary' };
    }
    return { label: out.run.status === 'won' ? 'Collect your trophy' : 'Back to the bracket', screen: 'tournament', cls: 'btn primary' };
  }
  if (meta.kind === 'gauntlet' && out.run) {
    if (out.run.status === 'active') return { label: `Stage ${out.run.stage + 1}`, screen: 'gauntlet', cls: 'btn primary' };
    return { label: out.run.status === 'cleared' ? 'The gauntlet is clear' : 'See how far you got', screen: 'gauntlet', cls: 'btn primary' };
  }
  if (meta.kind === 'daily') return { label: 'Daily challenge', screen: 'daily', cls: 'btn primary' };
  if (meta.kind === 'tutorial') return { label: 'Done — take me to the game', screen: 'title', cls: 'btn primary' };
  if (meta.kind === 'link') return { label: 'Link battle', screen: 'link', cls: 'btn primary' };
  return null;
}

/** A short line naming who you just fought, for the results header. */
export function opponentLine(out) {
  const meta = out.meta || {};
  const op = meta.opId ? getOpponent(meta.opId) : null;
  if (op) return `${op.name} · ${op.title}`;
  if (meta.kind === 'daily') return 'Daily challenge';
  if (meta.kind === 'link') return 'Link battle';
  return out.report?.sideNames?.[1] || 'Rival';
}

/** Bark from the opponent you just fought, if they are a character. */
export function opponentBark(out) {
  const meta = out.meta || {};
  const op = meta.opId ? getOpponent(meta.opId) : null;
  if (!op) return null;
  return { name: op.name, line: out.report?.win ? op.lose : op.win, accent: op.accent, species: op.crew?.[0] || 'luffy' };
}

/* ------------------------------------------------------------------ */
/* rank helper used by the results screen                              */
/* ------------------------------------------------------------------ */

export function rankSnapshot() {
  const s = Save.data();
  return { xp: s.xp, ...rankFor(s.xp) };
}

export { gauntletLive };
