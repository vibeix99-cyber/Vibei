// Stat computation, natures, boost stages.

export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
export const STAT_NAME = {
  hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed',
  acc: 'Accuracy', eva: 'Evasion'
};
export const STAT_SHORT = {
  hp: 'HP', atk: 'ATK', def: 'DEF', spa: 'SPA', spd: 'SPD', spe: 'SPE', acc: 'ACC', eva: 'EVA'
};

// nature -> { up, down }. Neutral natures have up === down.
export const NATURES = {
  adamant: { up: 'atk', down: 'spa' }, modest:  { up: 'spa', down: 'atk' },
  jolly:   { up: 'spe', down: 'spa' }, timid:   { up: 'spe', down: 'atk' },
  brave:   { up: 'atk', down: 'spe' }, quiet:   { up: 'spa', down: 'spe' },
  impish:  { up: 'def', down: 'spa' }, careful: { up: 'spd', down: 'spa' },
  bold:    { up: 'def', down: 'atk' }, calm:    { up: 'spd', down: 'atk' },
  naughty: { up: 'atk', down: 'spd' }, lonely:  { up: 'atk', down: 'def' },
  rash:    { up: 'spa', down: 'spd' }, mild:    { up: 'spa', down: 'def' },
  relaxed: { up: 'def', down: 'spe' }, sassy:   { up: 'spd', down: 'spe' },
  hardy:   { up: 'atk', down: 'atk' }, serious: { up: 'spe', down: 'spe' },
  docile:  { up: 'def', down: 'def' }, quirky:  { up: 'spd', down: 'spd' }
};
export const NATURE_LIST = Object.keys(NATURES);

export function natureMod(nature, stat) {
  const n = NATURES[nature];
  if (!n || n.up === n.down) return 1;
  if (n.up === stat) return 1.1;
  if (n.down === stat) return 0.9;
  return 1;
}

export const MAX_EV_TOTAL = 508;
export const MAX_EV_STAT = 252;

export function defaultIVs() { return { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }; }
export function defaultEVs() { return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }; }

/** Full stat block for a build at a level. */
export function computeStats(base, level, ivs, evs, nature) {
  const iv = ivs || defaultIVs();
  const ev = evs || defaultEVs();
  const out = {};
  out.hp = Math.floor(((2 * base.hp + iv.hp + Math.floor(ev.hp / 4)) * level) / 100) + level + 10;
  for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) {
    const raw = Math.floor(((2 * base[k] + iv[k] + Math.floor(ev[k] / 4)) * level) / 100) + 5;
    out[k] = Math.floor(raw * natureMod(nature, k));
  }
  return out;
}

/** Boost multiplier for atk/def/spa/spd/spe. */
export function boostMul(stage) {
  const s = Math.max(-6, Math.min(6, stage));
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

/** Boost multiplier for accuracy/evasion (different curve). */
export function accBoostMul(stage) {
  const s = Math.max(-6, Math.min(6, stage));
  return s >= 0 ? (3 + s) / 3 : 3 / (3 - s);
}

export function baseStatTotal(base) {
  return STAT_KEYS.reduce((a, k) => a + base[k], 0);
}

/** Clamp a boost stage into the legal -6..+6 window. */
export function clampStage(n) { return Math.max(-6, Math.min(6, n)); }

/**
 * Speed used for turn order. Kept here so the engine and the AI can never
 * disagree about who is faster.
 *   opts.tailwind  – the fighter's side has Tailwind up
 *   opts.itemHalve – held item halves Speed
 */
export function speedStat(mon, opts = {}) {
  let spe = Math.floor(mon.stats.spe * boostMul(mon.boosts.spe || 0));
  if (opts.itemHalve) spe = Math.floor(spe * 0.5);
  if (mon.status === 'par' && !opts.ignoreParalysis) spe = Math.floor(spe * 0.5);
  if (opts.tailwind) spe = Math.floor(spe * 2);
  return Math.max(1, spe);
}

export const BOOST_TEXT = {
  1: 'rose!', 2: 'rose sharply!', 3: 'rose drastically!',
  '-1': 'fell!', '-2': 'harshly fell!', '-3': 'severely fell!'
};

export function boostText(stat, delta) {
  const key = Math.max(-3, Math.min(3, delta));
  return `${STAT_NAME[stat]} ${BOOST_TEXT[String(key)] || 'changed.'}`;
}

/** "…won't go higher!" / "…won't go lower!" */
export function boostCapText(stat, delta) {
  return `${STAT_NAME[stat]} won't go ${delta > 0 ? 'higher' : 'lower'}!`;
}
