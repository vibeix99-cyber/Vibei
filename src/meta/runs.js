// Run structures: the tournament ladder, the survival gauntlet, and the daily
// challenge. All of them are plain serialisable objects living in the save, so
// a run survives a reload — including a run you are halfway through losing.
//
// The bracket's AI-vs-AI matches are *actually simulated* with the real engine,
// so the name in the other half of the draw got there by winning.

import { createBattle, submitChoices } from '../core/engine.js';
import { chooseAction } from '../core/ai.js';
import { defaultBag } from '../data/items.js';
import { makeDefaultMember, allFighters } from '../data/fighters.js';
import { RNG, seedFromString } from '../core/rng.js';
import { OPPONENTS, getOpponent, opponentTeam, TIER_ORDER } from './opponents.js';
import * as Save from './save.js';
import { unlockedArenas } from './progression.js';

/* ------------------------------------------------------------------ */
/* cups                                                                */
/* ------------------------------------------------------------------ */

export const CUPS = [
  {
    id: 'rookie_cup', name: 'Rookie Cup', sub: 'East Blue',
    size: 4, teamSize: 3, level: 50,
    pool: ['vico', 'rufo', 'isolde', 'kessler', 'butcher'],
    reward: 'A first trophy, and the Grand Line noticing you.',
    accent: '#6fb3e0'
  },
  {
    id: 'grand_line_cup', name: 'Grand Line Cup', sub: 'Paradise',
    size: 8, teamSize: 3, level: 50,
    pool: ['rufo', 'isolde', 'kessler', 'butcher', 'rin', 'volk', 'sarai', 'vex', 'vico'],
    reward: 'The bracket everyone means when they say "the cup".',
    accent: '#f2c94c'
  },
  {
    id: 'yonko_cup', name: 'Emperor\'s Cup', sub: 'New World',
    size: 4, teamSize: 3, level: 50,
    pool: ['sarai', 'vex', 'volk', 'yonko_beast', 'yonko_sweet', 'mirror'],
    reward: 'Four fights. All of them want you dead.',
    accent: '#c04a6a'
  }
];
export function getCup(id) { return CUPS.find((c) => c.id === id) || CUPS[1]; }

/* ------------------------------------------------------------------ */
/* headless match simulation (for the other half of the draw)          */
/* ------------------------------------------------------------------ */

/** @returns {0|1} winner index, decided by a real simulated battle. */
export function simulateMatch(teamA, teamB, levelA, levelB, seed) {
  try {
    const b = createBattle({
      seed: seed >>> 0,
      arena: 'colosseum',
      format: { level: 50, teamSize: teamA.length, bring: teamA.length },
      sides: [
        { name: 'A', team: teamA, items: defaultBag(), isAI: true, aiLevel: levelA },
        { name: 'B', team: teamB, items: defaultBag(), isAI: true, aiLevel: levelB }
      ]
    });
    let guard = 0;
    while (!b.ended && guard++ < 400) {
      submitChoices(b, [0, 1].map((s) => (b.request[s] ? chooseAction(b, s, s === 0 ? levelA : levelB) : null)));
    }
    if (b.winner === 0 || b.winner === 1) return b.winner;
    // Draw or stall: fall back to whoever has more HP left.
    const hp = b.sides.map((s) => s.party.reduce((a, p) => a + p.hp, 0));
    return hp[0] >= hp[1] ? 0 : 1;
  } catch (e) {
    console.warn('[runs] match sim failed, falling back to tier weighting', e);
    const w = TIER_ORDER.indexOf(levelA) - TIER_ORDER.indexOf(levelB);
    return w >= 0 ? 0 : 1;
  }
}

/* ------------------------------------------------------------------ */
/* tournament                                                          */
/* ------------------------------------------------------------------ */

function pickEntrants(cup, rng) {
  const pool = cup.pool.map(getOpponent).filter(Boolean);
  // Weakest first so the bracket escalates as the player advances.
  const sorted = pool.slice().sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
  const need = cup.size - 1;
  const chosen = [];
  const bands = Math.max(1, Math.ceil(sorted.length / need));
  for (let i = 0; i < need; i++) {
    const band = sorted.slice(i * bands, (i + 1) * bands);
    const from = band.length ? band : sorted;
    chosen.push(from[rng.int(from.length)]);
  }
  // Deduplicate — a bracket with the same captain twice reads as a bug.
  const seen = new Set();
  return chosen.map((o) => {
    if (!seen.has(o.id)) { seen.add(o.id); return o; }
    const alt = sorted.find((x) => !seen.has(x.id)) || o;
    seen.add(alt.id);
    return alt;
  });
}

export function createTournament({ cupId = 'grand_line_cup', seed, playerTeam, playerName = 'You', teamName = 'Your Crew' }) {
  const cup = getCup(cupId);
  const s = (typeof seed === 'number' ? seed : seedFromString(String(seed ?? Date.now()))) >>> 0;
  const rng = new RNG(s);
  const ai = pickEntrants(cup, rng);

  const entrants = [];
  const playerSlot = rng.int(cup.size);
  let ai_i = 0;
  for (let i = 0; i < cup.size; i++) {
    if (i === playerSlot) entrants.push({ slot: i, kind: 'player', name: teamName, label: playerName, tier: null, opId: null });
    else {
      const o = ai[ai_i++];
      entrants.push({ slot: i, kind: 'ai', opId: o.id, name: o.name, label: o.title, tier: o.tier });
    }
  }

  const rounds = [];
  let width = cup.size;
  let r = 0;
  while (width > 1) {
    const matches = [];
    for (let m = 0; m < width / 2; m++) {
      matches.push({
        round: r, index: m,
        a: r === 0 ? entrants[m * 2].slot : null,
        b: r === 0 ? entrants[m * 2 + 1].slot : null,
        winner: null, played: false, score: null
      });
    }
    rounds.push(matches);
    width /= 2; r++;
  }

  const run = {
    kind: 'tournament',
    id: 'trn_' + s.toString(36) + '_' + Date.now().toString(36),
    cupId: cup.id, seed: s, createdAt: Date.now(),
    playerSlot, playerName, teamName,
    playerTeam: playerTeam || [],
    entrants,
    rounds,
    roundIndex: 0,
    status: 'active',          // 'active' | 'won' | 'lost'
    history: []                // [{round, opId, win, turns}]
  };
  resolveAiMatches(run);
  return run;
}

export function entrantOf(run, slot) { return run.entrants.find((e) => e.slot === slot) || null; }

export function playerMatch(run) {
  const round = run.rounds[run.roundIndex];
  if (!round) return null;
  return round.find((m) => m.a === run.playerSlot || m.b === run.playerSlot) || null;
}

export function playerOpponent(run) {
  const m = playerMatch(run);
  if (!m) return null;
  const foeSlot = m.a === run.playerSlot ? m.b : m.a;
  const e = entrantOf(run, foeSlot);
  return e && e.kind === 'ai' ? getOpponent(e.opId) : null;
}

function teamForEntrant(run, entrant, cup) {
  if (!entrant) return [];
  if (entrant.kind === 'player') return run.playerTeam;
  const op = getOpponent(entrant.opId);
  return opponentTeam(op, { level: cup.level, size: cup.teamSize, playerTeam: run.playerTeam });
}

/** Play out every AI-vs-AI match in the current round. */
export function resolveAiMatches(run) {
  const cup = getCup(run.cupId);
  const round = run.rounds[run.roundIndex];
  if (!round) return run;
  round.forEach((m, i) => {
    if (m.played || m.a == null || m.b == null) return;
    if (m.a === run.playerSlot || m.b === run.playerSlot) return;
    const ea = entrantOf(run, m.a), eb = entrantOf(run, m.b);
    const w = simulateMatch(
      teamForEntrant(run, ea, cup), teamForEntrant(run, eb, cup),
      ea.tier || 'ace', eb.tier || 'ace',
      (run.seed ^ (run.roundIndex * 7919) ^ (i * 104729)) >>> 0
    );
    m.winner = w === 0 ? m.a : m.b;
    m.played = true;
  });
  return run;
}

/** Record the player's result for this round and advance (or end) the run. */
export function advanceTournament(run, playerWon, meta = {}) {
  const round = run.rounds[run.roundIndex];
  const m = playerMatch(run);
  if (!m) return run;
  const foeSlot = m.a === run.playerSlot ? m.b : m.a;
  m.winner = playerWon ? run.playerSlot : foeSlot;
  m.played = true;
  run.history.push({
    round: run.roundIndex,
    opId: entrantOf(run, foeSlot)?.opId ?? null,
    win: !!playerWon, turns: meta.turns ?? 0
  });

  if (!playerWon) { run.status = 'lost'; return run; }

  // Feed winners into the next round.
  const next = run.rounds[run.roundIndex + 1];
  if (!next) { run.status = 'won'; return run; }
  round.forEach((mm, i) => {
    const target = next[Math.floor(i / 2)];
    if (!target) return;
    if (i % 2 === 0) target.a = mm.winner; else target.b = mm.winner;
  });
  run.roundIndex++;
  resolveAiMatches(run);
  return run;
}

export function roundName(run, i = run.roundIndex) {
  const total = run.rounds.length;
  const fromEnd = total - 1 - i;
  return ['Final', 'Semi-final', 'Quarter-final', 'Round of 16'][fromEnd] || `Round ${i + 1}`;
}

/* ------------------------------------------------------------------ */
/* gauntlet                                                            */
/* ------------------------------------------------------------------ */

// Survival rules that the current engine API can actually enforce:
// a fighter that faints is *out of the run*. No revives, no healing, and the
// team you finish with is smaller than the one you started with.
export const GAUNTLET_LADDER = ['vico', 'rufo', 'kessler', 'isolde', 'rin', 'butcher', 'volk', 'sarai', 'vex', 'yonko_sweet', 'yonko_beast'];

export function createGauntlet({ seed, playerTeam, teamName = 'Your Crew' }) {
  const s = (typeof seed === 'number' ? seed : seedFromString(String(seed ?? Date.now()))) >>> 0;
  return {
    kind: 'gauntlet',
    id: 'gnt_' + s.toString(36) + '_' + Date.now().toString(36),
    seed: s, createdAt: Date.now(),
    teamName,
    roster: (playerTeam || []).map((m) => ({ ...m })),
    down: [],                       // speciesIds knocked out of the run
    stage: 0,
    best: 0,
    status: 'active',
    boons: [],                      // rewards taken between stages
    history: []
  };
}

export function gauntletLive(run) {
  return (run.roster || []).filter((m) => !run.down.includes(m.speciesId));
}

export function gauntletOpponent(run) {
  const id = GAUNTLET_LADDER[Math.min(run.stage, GAUNTLET_LADDER.length - 1)];
  return getOpponent(id);
}

export const BOONS = [
  { id: 'medic', name: 'Ship\'s Doctor', desc: 'Bring one fallen fighter back into the run.', pick: 'revive' },
  { id: 'recruit', name: 'New Recruit', desc: 'Add a random fighter to your roster.', pick: 'recruit' },
  { id: 'quartermaster', name: 'Quartermaster', desc: 'Give a fighter a held item.', pick: 'item' }
];

export function advanceGauntlet(run, won, report) {
  run.history.push({ stage: run.stage, opId: gauntletOpponent(run)?.id, win: !!won, turns: report?.turns ?? 0 });
  // Anyone who fell is out for good.
  for (const t of report?.playerTeam || []) {
    if (t.fainted && !run.down.includes(t.speciesId)) run.down.push(t.speciesId);
  }
  if (!won || gauntletLive(run).length === 0) {
    run.status = 'over';
    return run;
  }
  run.stage++;
  run.best = Math.max(run.best, run.stage);
  if (run.stage >= GAUNTLET_LADDER.length) run.status = 'cleared';
  return run;
}

export function applyBoon(run, boon, arg) {
  if (boon === 'revive') {
    const id = arg || run.down[0];
    run.down = run.down.filter((d) => d !== id);
  } else if (boon === 'recruit') {
    const rng = new RNG((run.seed ^ (run.stage * 2654435761)) >>> 0);
    const pool = allFighters().filter((f) => !run.roster.some((m) => m.speciesId === f.id));
    if (pool.length) run.roster.push(makeDefaultMember(pool[rng.int(pool.length)].id, 50));
  } else if (boon === 'item') {
    const m = run.roster.find((x) => !x.item && !run.down.includes(x.speciesId));
    if (m) m.item = arg || 'power_band';
  }
  run.boons.push(boon);
  return run;
}

/* ------------------------------------------------------------------ */
/* daily challenge                                                     */
/* ------------------------------------------------------------------ */

export function dateKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Deterministic from the date alone: two friends on opposite sides of the world
 * get the same teams, the same arena, the same opponent and the same rolls.
 */
export function dailyChallenge(key = dateKey()) {
  const seed = seedFromString('GLA-DAILY-' + key) >>> 0;
  const rng = new RNG(seed);
  const ids = allFighters().map((f) => f.id);
  const take = (n) => {
    const pool = ids.slice();
    const out = [];
    for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(rng.int(pool.length), 1)[0]);
    return out;
  };
  const size = 3;
  const playerIds = take(size);
  const op = OPPONENTS[rng.int(OPPONENTS.length - 1)];   // never The Mirror
  const arenas = ['colosseum', 'marineford', 'sunny_deck', 'onigashima', 'skypiea', 'baratie'];
  const arena = arenas[rng.int(arenas.length)];
  const twists = [
    { id: 'none', name: 'Straight Fight', desc: 'No modifiers. Just the matchup.' },
    { id: 'blitz', name: 'Blitz', desc: 'Everyone brings only their fastest three moves.' },
    { id: 'ironman', name: 'Iron Man', desc: 'No switching — the lead is the whole fight.' },
    { id: 'coinflip', name: 'Wild Draw', desc: 'Both teams are randomly rolled from the same seed.' }
  ];
  const twist = twists[rng.int(twists.length)];

  return {
    key, seed, arena, twist,
    opponentId: op.id,
    aiLevel: op.tier,
    playerTeam: playerIds.map((id) => makeDefaultMember(id, 50)),
    foeTeam: opponentTeam(op, { level: 50, size })
  };
}

export function dailyScore(report) {
  if (!report) return 0;
  if (!report.win) return Math.max(0, 200 - (report.turns || 0) * 4);
  const speed = Math.max(0, 600 - (report.turns || 0) * 22);
  const survive = (report.survivors || 0) * 220;
  const hp = Math.round(report.playerTeam.reduce((a, t) => a + (t.hp / Math.max(1, t.maxHp)), 0) * 120);
  return 500 + speed + survive + hp;
}

/* ------------------------------------------------------------------ */
/* save wiring                                                         */
/* ------------------------------------------------------------------ */

export function storeRun(kind, run) { Save.patch((s) => { s.runs[kind] = run; }); }
export function loadRun(kind) { return Save.data().runs?.[kind] || null; }
export function clearRun(kind) { Save.patch((s) => { s.runs[kind] = null; }); }

/** Arena for a run stage: rotates through what the player has unlocked. */
export function arenaFor(run, index = 0) {
  const list = unlockedArenas();
  if (!list.length) return 'colosseum';
  return list[(index + (run?.seed ?? 0)) % list.length].id;
}
