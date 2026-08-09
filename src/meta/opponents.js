// Named opponents. An AI difficulty label is not a character; these are.
// Each one has a crew that plays like its personality, a portrait taken from
// its ace's 3D model, and something to say before, during and after.

import { makeDefaultMember } from '../data/fighters.js';
import { RNG } from '../core/rng.js';

/**
 * tier maps onto core/ai.js AI_LEVELS.
 * crew[0] is the ace — the fighter their portrait is built from and the one
 * they lead with when they are confident.
 */
export const OPPONENTS = [
  {
    id: 'vico', name: 'Deckhand Vico', title: 'East Blue Nobody', tier: 'rookie',
    crew: ['nami', 'sanji', 'luffy'], accent: '#6fb3e0', arena: 'baratie',
    taunt: 'I have lost eleven fights this month. Twelve is a nice round number.',
    win: 'Twelve! I mean — no. Wait.',
    lose: 'Knew it. Best of thirteen?',
    style: 'Swings first and reads the consequences later.'
  },
  {
    id: 'rufo', name: 'Barkeep Rufo', title: 'Keeper of the Long Bar', tier: 'rookie',
    crew: ['jinbe', 'crocodile', 'robin'], accent: '#c8a165', arena: 'baratie',
    taunt: "You drink, you pay. You fight, you pay. Same ledger.",
    win: 'Tab settled.',
    lose: 'On the house, then.',
    style: 'Bulky, patient, refuses to be rushed.'
  },
  {
    id: 'isolde', name: 'Clerk Isolde', title: 'Bounty Office, Desk 4', tier: 'pirate',
    crew: ['robin', 'law', 'nami'], accent: '#e05c9e', arena: 'marineford',
    taunt: 'I have read your file. Twice. The second time was for pleasure.',
    win: 'Filed under "expected".',
    lose: 'I will amend the record.',
    style: 'Status, hazards, and a very long memory.'
  },
  {
    id: 'kessler', name: 'Lt. Kessler', title: 'Marine 33rd Branch', tier: 'pirate',
    crew: ['sanji', 'zoro', 'mihawk'], accent: '#4a8fd0', arena: 'marineford',
    taunt: 'Justice is a schedule. You are running late.',
    win: 'Processed.',
    lose: 'Requesting reinforcements. Loudly.',
    style: 'Fast physical pressure, no wasted turns.'
  },
  {
    id: 'butcher', name: 'The Butcher', title: 'of Loguetown', tier: 'ace',
    crew: ['crocodile', 'katakuri', 'kaido'], accent: '#8a5a3a', arena: 'colosseum',
    taunt: 'Sand does not need to win. It only needs to outlast you.',
    win: 'The desert keeps everything it is given.',
    lose: 'Even a drought breaks.',
    style: 'Sandstorm chip, toxic pressure, wins the long game.'
  },
  {
    id: 'rin', name: 'Foxfire Rin', title: 'Wandering Duellist', tier: 'ace',
    crew: ['ace', 'sanji', 'luffy'], accent: '#ff6a1c', arena: 'onigashima',
    taunt: 'Burn bright. Burn first. Those are the only two rules.',
    win: 'You went out warm, at least.',
    lose: 'Ash still glows.',
    style: 'Everything is on fire, including her own gameplan.'
  },
  {
    id: 'volk', name: 'Iron Captain Volk', title: 'Unmoved in Nine Wars', tier: 'warlord',
    crew: ['jinbe', 'kaido', 'zoro'], accent: '#9aa7b5', arena: 'marineford',
    taunt: 'I have been hit by better than you and I did not sit down then either.',
    win: 'Still standing. As advertised.',
    lose: 'Ah. There it is.',
    style: 'Walls up, chips away, dares you to run out of PP.'
  },
  {
    id: 'sarai', name: 'Nightblade Sarai', title: 'Two Hundred Silent Duels', tier: 'warlord',
    crew: ['mihawk', 'law', 'zoro'], accent: '#c9d4e0', arena: 'onigashima',
    taunt: 'Do not watch the blade. It is already somewhere else.',
    win: 'You blinked.',
    lose: 'Good. Someone should be able to do that.',
    style: 'Crits, priority, and a blade that ignores your plan.'
  },
  {
    id: 'vex', name: 'Doctor Vex', title: 'Operating Theatre Nine', tier: 'warlord',
    crew: ['law', 'robin', 'crocodile'], accent: '#7fd8ff', arena: 'colosseum',
    taunt: 'Hold still. This will be interesting for exactly one of us.',
    win: 'Successful procedure. The patient disagrees.',
    lose: 'Complications.',
    style: 'Takes you apart from the inside; ignores your defenses.'
  },
  {
    id: 'yonko_beast', name: 'The Strongest Creature', title: 'Emperor of the Sea', tier: 'yonko',
    crew: ['kaido', 'katakuri', 'mihawk'], accent: '#5a7fd0', arena: 'onigashima',
    taunt: 'Bring something that can kill me. I have been looking for one for years.',
    win: 'Not today either.',
    lose: 'Finally. Do it again.',
    style: 'The wall and the hammer, in the same fighter.'
  },
  {
    id: 'yonko_sweet', name: 'The Sweet Commander', title: 'Never Knocked Down', tier: 'yonko',
    crew: ['katakuri', 'ace', 'kaido'], accent: '#c04a6a', arena: 'colosseum',
    taunt: 'I have already seen how this ends. Four seconds ago.',
    win: 'Exactly as observed.',
    lose: 'I did not see that. Say it again.',
    style: 'Reads two moves ahead and answers the one you have not made.'
  },
  {
    id: 'mirror', name: 'The Mirror', title: 'Wears Your Face', tier: 'yonko',
    crew: null,                    // filled with a copy of the player's team
    accent: '#f2c94c', arena: 'skypiea',
    taunt: 'Everything you built. Pointed the other way.',
    win: 'You knew every weakness. That was the problem.',
    lose: 'You beat yourself. Enjoy that.',
    style: 'Your exact team, played by someone who has no doubts.'
  }
];

export const OPPONENT_BY_ID = Object.fromEntries(OPPONENTS.map((o) => [o.id, o]));
export function getOpponent(id) { return OPPONENT_BY_ID[id] || null; }

export const TIER_ORDER = ['rookie', 'pirate', 'ace', 'warlord', 'yonko'];

export function opponentsByTier(tier) { return OPPONENTS.filter((o) => o.tier === tier); }

/** The fighter whose model is used for this opponent's portrait. */
export function portraitSpecies(op) { return op?.crew?.[0] || 'luffy'; }

/**
 * Build the opponent's actual team.
 * @param {object} op
 * @param {object} opts { level, size, playerTeam (for the Mirror), rng }
 */
export function opponentTeam(op, opts = {}) {
  const level = opts.level ?? 50;
  const size = Math.max(1, Math.min(6, opts.size ?? 3));
  if (!op) return [];
  if (!op.crew) {
    const mine = opts.playerTeam || [];
    if (mine.length) return mine.slice(0, size).map((m) => ({ ...m, nickname: (m.nickname || '') + ' ??' }));
    const rng = opts.rng || new RNG(1);
    return Array.from({ length: size }, () => makeDefaultMember(OPPONENTS[rng.int(OPPONENTS.length - 1)].crew[0], level));
  }
  const crew = op.crew.slice(0, size);
  while (crew.length < size) crew.push(op.crew[crew.length % op.crew.length]);
  return crew.map((id) => makeDefaultMember(id, level));
}

/** A line to show mid-run, so an opponent keeps talking after the first screen. */
export function bark(op, situation) {
  if (!op) return '';
  if (situation === 'win') return op.win;
  if (situation === 'lose') return op.lose;
  return op.taunt;
}
