// The 18-type wheel. Owned by the type-balance agent.
// Effectiveness: 0 = immune, 0.5 = resisted, 1 = neutral, 2 = super effective.

export const TYPES = [
  'SLASH', 'FIST', 'HAKI', 'FLAME', 'FROST', 'SEA', 'STORM', 'EARTH', 'WIND',
  'SHADOW', 'LIGHT', 'BEAST', 'MECHA', 'MIND', 'TOXIN', 'SOUND', 'SPIRIT', 'VOID'
];

export const TYPE_COLOR = {
  SLASH:  '#c9d4e0', FIST:   '#e8743b', HAKI:   '#2b2d42', FLAME:  '#ff5a36',
  FROST:  '#7fd8ff', SEA:    '#2a7fd4', STORM:  '#f5c542', EARTH:  '#b98b5a',
  WIND:   '#a7e8c0', SHADOW: '#5a3d7a', LIGHT:  '#ffe9a3', BEAST:  '#8a6b3d',
  MECHA:  '#9aa7b5', MIND:   '#e05c9e', TOXIN:  '#8bc34a', SOUND:  '#c084fc',
  SPIRIT: '#6fe3d0', VOID:   '#3a2f5b'
};

export const TYPE_ICON = {
  SLASH: '⚔', FIST: '✊', HAKI: '◈', FLAME: '🔥', FROST: '❄', SEA: '🌊',
  STORM: '⚡', EARTH: '⛰', WIND: '🌪', SHADOW: '🌑', LIGHT: '☀', BEAST: '🐾',
  MECHA: '⚙', MIND: '👁', TOXIN: '☠', SOUND: '♪', SPIRIT: '✧', VOID: '⬤'
};

// chart[attacker][defender]. Missing entry = 1.
// Design intent (keep when rebalancing):
//   HAKI is the "true damage" answer to intangibles (SPIRIT/SHADOW/VOID) and is the only
//   thing that reliably hurts LOGIA-flavoured elemental types. It is resisted by physical
//   discipline (FIST/SLASH) so it is not universally best.
//   SEA is the great neutraliser — it beats elementals but folds to STORM and TOXIN.
const T = (o) => o;
export const CHART = {
  SLASH:  T({ SLASH: 0.5, MECHA: 0.5, EARTH: 0.5, FLAME: 0.5, SEA: 0.5, WIND: 2, BEAST: 2, TOXIN: 2, SPIRIT: 0.5, VOID: 0.5, HAKI: 0.5, FROST: 2 }),
  FIST:   T({ MECHA: 2, EARTH: 2, FROST: 2, HAKI: 0.5, WIND: 0.5, SPIRIT: 0, MIND: 0.5, SHADOW: 0.5, BEAST: 2, SLASH: 2 }),
  HAKI:   T({ SPIRIT: 2, SHADOW: 2, VOID: 2, FLAME: 2, SEA: 2, LIGHT: 2, FIST: 0.5, SLASH: 0.5, HAKI: 2, MECHA: 0.5, MIND: 2 }),
  FLAME:  T({ FROST: 2, BEAST: 2, MECHA: 2, TOXIN: 2, SEA: 0.5, EARTH: 0.5, FLAME: 0.5, STORM: 0.5, WIND: 2 }),
  FROST:  T({ WIND: 2, EARTH: 2, BEAST: 2, SEA: 2, FLAME: 0.5, FROST: 0.5, MECHA: 0.5, HAKI: 0.5 }),
  SEA:    T({ FLAME: 2, EARTH: 2, MECHA: 2, SEA: 0.5, WIND: 0.5, SPIRIT: 0.5, STORM: 0.5, TOXIN: 0.5, FROST: 0.5 }),
  STORM:  T({ SEA: 2, WIND: 2, MECHA: 0.5, EARTH: 0, STORM: 0.5, SLASH: 2, LIGHT: 0.5, TOXIN: 2 }),
  EARTH:  T({ FLAME: 2, MECHA: 2, TOXIN: 2, STORM: 2, WIND: 0, BEAST: 0.5, SEA: 0.5, FROST: 0.5 }),
  WIND:   T({ FIST: 2, BEAST: 2, TOXIN: 2, SOUND: 2, MECHA: 0.5, STORM: 0.5, EARTH: 0.5, FROST: 0.5 }),
  SHADOW: T({ MIND: 2, SPIRIT: 2, LIGHT: 0.5, HAKI: 0.5, SHADOW: 0.5, BEAST: 2, VOID: 0.5 }),
  LIGHT:  T({ SHADOW: 2, VOID: 2, TOXIN: 2, SPIRIT: 2, MECHA: 0.5, LIGHT: 0.5, EARTH: 0.5, HAKI: 0.5 }),
  BEAST:  T({ MIND: 2, TOXIN: 0.5, MECHA: 0.5, SLASH: 0.5, SPIRIT: 0.5, EARTH: 2, SOUND: 2, HAKI: 0.5 }),
  MECHA:  T({ FROST: 2, WIND: 2, SOUND: 2, FLAME: 0.5, SEA: 0.5, STORM: 0.5, EARTH: 0.5, MECHA: 0.5, SPIRIT: 0.5 }),
  MIND:   T({ FIST: 2, TOXIN: 2, HAKI: 0.5, VOID: 0, MIND: 0.5, SHADOW: 0.5, MECHA: 0.5, SPIRIT: 2 }),
  TOXIN:  T({ BEAST: 2, SEA: 2, SPIRIT: 0.5, MECHA: 0, EARTH: 0.5, TOXIN: 0.5, MIND: 0.5, LIGHT: 2 }),
  SOUND:  T({ MIND: 2, SPIRIT: 2, BEAST: 2, MECHA: 0.5, EARTH: 0.5, SOUND: 0.5, VOID: 0, HAKI: 0.5 }),
  SPIRIT: T({ SHADOW: 2, MIND: 2, VOID: 2, HAKI: 0.5, SPIRIT: 0.5, MECHA: 0.5, BEAST: 0.5 }),
  VOID:   T({ SPIRIT: 2, LIGHT: 2, MIND: 2, VOID: 2, HAKI: 0.5, SLASH: 0.5, SOUND: 0.5 })
};

/** Multiplier for one attacking type vs one defending type. */
export function typeEff1(atk, def) {
  const row = CHART[atk];
  if (!row) return 1;
  const v = row[def];
  return v === undefined ? 1 : v;
}

/** Multiplier for one attacking type vs a (mono/dual) defender. */
export function typeEff(atk, defTypes) {
  let m = 1;
  for (const d of defTypes) m *= typeEff1(atk, d);
  return m;
}

export function effLabel(m) {
  if (m === 0) return 'immune';
  if (m >= 4) return 'quad';
  if (m > 1) return 'super';
  if (m <= 0.25) return 'quarter';
  if (m < 1) return 'weak';
  return 'neutral';
}

export function effText(m, name) {
  if (m === 0) return `It doesn't affect ${name}…`;
  if (m >= 4) return `It's devastatingly effective!`;
  if (m > 1) return `It's super effective!`;
  if (m <= 0.25) return `It barely scratches ${name}…`;
  if (m < 1) return `It's not very effective…`;
  return null;
}
