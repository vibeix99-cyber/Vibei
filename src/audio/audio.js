// GRAND LINE ARENA — procedural audio. Zero asset files: every sound in the game
// is synthesised in WebAudio at runtime. Owned by the audio agent.
//
// Layout of this file
//   1. helpers            hashes, seeded rng, note parsing, small math
//   2. type voicing       per-element spectral fingerprints for impacts
//   3. sfx registry       ~90 named sounds, all built from the voice engine
//   4. music              five tracks, sectioned, intensity-driven arrangement
//   5. class Audio        bus structure, voice engine, cries, scheduler
//
// Design notes worth keeping:
//   * Every sound is transient + body + tail. Impacts carry a sub you feel, a
//     mid band that identifies the element, and a reverb tail that puts it in
//     the arena instead of on top of it.
//   * Cries are rendered additively into an AudioBuffer in JS so the timbre can
//     be derived from the fighter's identity and stat shape, not just its
//     `cry` block. Buffers are cached per fighter.
//   * The score is a real arrangement with sections; `setIntensity` gates
//     layers and swaps the harmony toward tension near the end of a battle.
//   * Nothing is left connected: every voice disconnects its whole graph on
//     `ended`, and `stopMusic()` tears its tracks down.

import { FIGHTER_BY_ID } from '../data/fighters.js';

/* ==================================================================== */
/* 1. helpers                                                            */
/* ==================================================================== */

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STEP = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
/** 'a4' 'gs5' 'bb3' -> midi number. */
function noteToMidi(tok) {
  const m = /^([a-g])([sb#]?)(-?\d+)$/.exec(tok.toLowerCase());
  if (!m) return null;
  const acc = m[2] === 's' || m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + STEP[m[1]] + acc;
}
/** '. a4 . -' -> [null, 69, null, '-']  ('-' extends the previous note). */
function pat(s) {
  return s.trim().split(/\s+/).map((t) => (t === '.' ? null : t === '-' ? '-' : noteToMidi(t)));
}
/** 'x..x' -> [1,0,0,1]; digits 1-9 give per-hit velocity. */
function rhy(s) {
  return s.split('').filter((c) => c !== ' ').map((c) => (c === 'x' ? 1 : c === '.' ? 0 : Number(c) / 9));
}

const QUAL = {
  maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8],
  dom7: [0, 4, 7, 10], min7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
  dim7: [0, 3, 6, 9], sus4: [0, 5, 7], min9: [0, 3, 7, 10, 14], b9: [0, 4, 7, 10, 13]
};
/** 'a2:min' -> { root: midi, tones: [midi...] } */
function chord(spec) {
  const [n, q] = spec.split(':');
  const root = noteToMidi(n);
  return { root, tones: (QUAL[q] || QUAL.maj).map((i) => root + i) };
}

/* ==================================================================== */
/* 2. elemental voicing                                                  */
/* ==================================================================== */

// Each entry re-colours the generic impact so the element is identifiable with
// your eyes closed. `band`/`bq` set the mid "crack" that carries the type,
// `sub` scales the low-end you feel, `tone` picks the harmonic layer, `extra`
// adds the signature detail (crackle, shimmer, bubbles, servo whine...).
const TINT = {
  NEUTRAL: { band: 1500, bq: 0.9, sweep: 0.30, sub: 1.00, subF: 1.00, tone: 'tri', toneMix: 0.30, tail: 0.9, verb: 0.24, bright: 0.5, extra: null },
  FIST:    { band: 1050, bq: 1.1, sweep: 0.26, sub: 1.12, subF: 1.02, tone: 'tri', toneMix: 0.34, tail: 0.8, verb: 0.20, bright: 0.4, extra: 'slap' },
  SLASH:   { band: 5200, bq: 2.6, sweep: 0.22, sub: 0.42, subF: 1.35, tone: 'saw', toneMix: 0.16, tail: 0.6, verb: 0.28, bright: 0.9, extra: 'ring' },
  HAKI:    { band: 420,  bq: 0.7, sweep: 0.35, sub: 1.55, subF: 0.72, tone: 'saw', toneMix: 0.42, tail: 1.5, verb: 0.34, bright: 0.15, extra: 'press' },
  FLAME:   { band: 900,  bq: 0.6, sweep: 0.22, sub: 1.05, subF: 0.94, tone: 'saw', toneMix: 0.44, tail: 1.5, verb: 0.30, bright: 0.35, extra: 'crackle' },
  FROST:   { band: 5600, bq: 3.4, sweep: 0.55, sub: 0.52, subF: 1.28, tone: 'sine', toneMix: 0.20, tail: 1.1, verb: 0.42, bright: 0.95, extra: 'shatter' },
  SEA:     { band: 1250, bq: 1.0, sweep: 0.20, sub: 0.95, subF: 0.88, tone: 'sine', toneMix: 0.30, tail: 1.2, verb: 0.36, bright: 0.35, extra: 'bubble' },
  STORM:   { band: 6400, bq: 1.4, sweep: 0.10, sub: 0.90, subF: 1.10, tone: 'square', toneMix: 0.26, tail: 1.3, verb: 0.30, bright: 0.85, extra: 'zap' },
  EARTH:   { band: 520,  bq: 0.7, sweep: 0.32, sub: 1.60, subF: 0.68, tone: 'tri', toneMix: 0.24, tail: 1.7, verb: 0.30, bright: 0.12, extra: 'rubble' },
  WIND:    { band: 2600, bq: 2.0, sweep: 0.70, sub: 0.38, subF: 1.18, tone: 'sine', toneMix: 0.12, tail: 0.9, verb: 0.30, bright: 0.7, extra: 'gust' },
  SHADOW:  { band: 780,  bq: 1.3, sweep: 0.42, sub: 1.25, subF: 0.78, tone: 'saw', toneMix: 0.38, tail: 1.6, verb: 0.44, bright: 0.2, extra: 'swell' },
  LIGHT:   { band: 4200, bq: 1.5, sweep: 0.40, sub: 0.62, subF: 1.22, tone: 'sine', toneMix: 0.34, tail: 1.4, verb: 0.42, bright: 0.9, extra: 'shimmer' },
  BEAST:   { band: 820,  bq: 1.5, sweep: 0.30, sub: 1.28, subF: 0.85, tone: 'saw', toneMix: 0.40, tail: 1.0, verb: 0.24, bright: 0.28, extra: 'growl' },
  MECHA:   { band: 3000, bq: 3.2, sweep: 0.45, sub: 0.92, subF: 1.05, tone: 'fm', toneMix: 0.46, tail: 1.2, verb: 0.30, bright: 0.72, extra: 'servo' },
  MIND:    { band: 2000, bq: 4.5, sweep: 0.60, sub: 0.60, subF: 1.12, tone: 'ring', toneMix: 0.44, tail: 1.3, verb: 0.40, bright: 0.62, extra: 'warble' },
  TOXIN:   { band: 700,  bq: 1.8, sweep: 0.26, sub: 0.88, subF: 0.82, tone: 'sine', toneMix: 0.32, tail: 1.1, verb: 0.26, bright: 0.25, extra: 'splat' },
  SOUND:   { band: 1700, bq: 6.0, sweep: 0.75, sub: 0.75, subF: 1.00, tone: 'square', toneMix: 0.42, tail: 1.4, verb: 0.38, bright: 0.6, extra: 'sweep' },
  SPIRIT:  { band: 2400, bq: 2.2, sweep: 0.50, sub: 0.55, subF: 1.15, tone: 'sine', toneMix: 0.36, tail: 1.8, verb: 0.52, bright: 0.75, extra: 'airy' },
  VOID:    { band: 340,  bq: 1.0, sweep: 0.30, sub: 1.70, subF: 0.60, tone: 'saw', toneMix: 0.30, tail: 2.0, verb: 0.46, bright: 0.05, extra: 'collapse' }
};

// Word fragments -> element / weight, used to keep unknown fx.sfx keys audible.
const TINT_WORDS = [
  [/flame|fire|burn|blaz|inferno|pyro|magma|lava|ember|hawk|scorch|heat|solar_?flare/, 'FLAME'],
  [/frost|ice|icy|freez|glaci|snow|hail|blizzard|cold|chill|crystal/, 'FROST'],
  [/sea|water|aqua|wave|tide|ocean|surf|rain|splash|torrent|bubble|whirl/, 'SEA'],
  [/storm|thunder|elec|bolt|shock|light?n|spark|volt|plasma|discharge/, 'STORM'],
  [/earth|quake|rock|stone|ground|boulder|sand|dust|terra|crag|land/, 'EARTH'],
  [/wind|gale|air|cyclone|tornado|gust|breeze|typhoon|whirlwind|vacuum/, 'WIND'],
  [/shadow|dark|night|umbra|gloom|dusk|black_?/, 'SHADOW'],
  [/light|holy|shine|flash|radia|ray|solar|lumin|glow|divine|halo|prism/, 'LIGHT'],
  [/beast|roar|fang|claw|bite|maul|feral|wolf|dragon|drake|beak|talon/, 'BEAST'],
  [/mecha|metal|steel|gear|iron|clank|robot|cannon|gun|bullet|cyber|piston|drill|blast_?er/, 'MECHA'],
  [/mind|psy|psi|hypno|confus|telekin|brain|dream|illusio/, 'MIND'],
  [/toxin|toxic|poison|venom|sludge|acid|corros|rot|plague|miasma/, 'TOXIN'],
  [/sound|sonic|screech|song|shout|note|voice|scream|howl|echo|boom_?box|siren/, 'SOUND'],
  [/spirit|soul|ghost|phantom|ether|wraith|astral|seance/, 'SPIRIT'],
  [/void|null|abyss|rift|warp|nether|oblivio|erase|nothing/, 'VOID'],
  [/haki|will|conquer|king|monarch|domin|aura|presence/, 'HAKI'],
  [/slash|cut|blade|sword|edge|slice|razor|cleave|katana|sever|rend|shear/, 'SLASH'],
  [/punch|fist|kick|strike|jab|smash|blow|hammer|bash|pummel|slam|thrust|knee|elbow|body/, 'FIST']
];
const WEIGHT_WORDS = [
  [/world|ultimate|apocal|cataclys|final|omega|god|divine|end_?all/, 1.00],
  [/heavy|big|mega|giga|massive|great|grand|super|titan|colossal|max|storm_?of/, 0.80],
  [/med|mid|normal|standard|strong/, 0.55],
  [/light|small|quick|soft|weak|minor|tap|jab|flick|tick/, 0.28]
];

/* ==================================================================== */
/* 3. SFX registry                                                       */
/* ==================================================================== */

// Each entry receives the Audio instance `A` and the resolved option bag `o`
// ({ pan, gain, pitch, w }). Keep entries declarative: the heavy lifting lives
// in the A._xxx generators so every sound shares one mix discipline.
const SFX = {
  /* ---- UI ---- */
  ui_move:   (A, o) => A._v({ wave: 'square', f0: 660 * o.pitch, f2: 700 * o.pitch, dur: 0.045, a: 0.001, gain: 0.10, filt: 'lowpass', ff0: 4200, send: 0, pan: o.pan }),
  ui_select: (A, o) => { A._v({ wave: 'square', f0: 784 * o.pitch, dur: 0.055, a: 0.001, gain: 0.11, filt: 'lowpass', ff0: 5000, send: 0.04, pan: o.pan });
                         A._v({ wave: 'square', f0: 1175 * o.pitch, dur: 0.09, a: 0.001, gain: 0.075, delay: 0.045, filt: 'lowpass', ff0: 6000, send: 0.06, pan: o.pan });
                         A._v({ wave: 'sine', f0: 2350 * o.pitch, dur: 0.06, a: 0.001, gain: 0.03, delay: 0.045, send: 0, pan: o.pan }); },
  ui_back:   (A, o) => { A._v({ wave: 'square', f0: 494 * o.pitch, f2: 294 * o.pitch, dur: 0.09, a: 0.002, gain: 0.10, filt: 'lowpass', ff0: 3200, send: 0, pan: o.pan });
                         A._v({ wave: 'sine', f0: 247 * o.pitch, dur: 0.10, a: 0.002, gain: 0.05, send: 0, pan: o.pan }); },
  ui_error:  (A, o) => { A._v({ wave: 'square', f0: 176, f2: 132, dur: 0.16, a: 0.002, gain: 0.10, filt: 'lowpass', ff0: 1400, drive: 0.4, send: 0.05, pan: o.pan });
                         A._v({ wave: 'square', f0: 118, dur: 0.19, a: 0.002, gain: 0.07, send: 0.05, pan: o.pan }); },
  ui_open:   (A, o) => { for (let i = 0; i < 3; i++) A._v({ wave: 'triangle', f0: 520 * Math.pow(1.35, i) * o.pitch, dur: 0.08, a: 0.002, gain: 0.055, delay: i * 0.028, send: 0.06, pan: o.pan }); },
  ui_close:  (A, o) => { for (let i = 0; i < 3; i++) A._v({ wave: 'triangle', f0: 900 / Math.pow(1.35, i) * o.pitch, dur: 0.08, a: 0.002, gain: 0.05, delay: i * 0.026, send: 0.05, pan: o.pan }); },
  text_blip: (A, o) => A._v({ wave: 'square', f0: (1150 + A._rand() * 420) * o.pitch, dur: 0.016, a: 0.0008, gain: 0.032, filt: 'bandpass', ff0: 2200, q: 1.2, send: 0, pan: o.pan }),
  cursor:    (A, o) => SFX.ui_move(A, o),
  page:      (A, o) => A._noiseV({ dur: 0.09, gain: 0.10, filt: 'bandpass', ff0: 3000, ff1: 900, q: 1.4, send: 0.05, pan: o.pan }),

  /* ---- generic impacts (weight ladder) ---- */
  impact_tap:   (A, o) => A._impact({ w: 0.16, tint: 'FIST', ...o }),
  impact_light: (A, o) => A._impact({ w: 0.30, tint: 'FIST', ...o }),
  impact_med:   (A, o) => A._impact({ w: 0.55, tint: 'NEUTRAL', ...o }),
  impact_heavy: (A, o) => A._impact({ w: 0.80, tint: 'NEUTRAL', ...o }),
  impact_world: (A, o) => { A._impact({ w: 1.00, tint: 'EARTH', ...o }); A._rumble({ dur: 1.9, gain: 0.30, f: 60, pan: o.pan * 0.4 }); },

  /* ---- typed impacts: same weight, unmistakably different element ---- */
  impact_fire:  (A, o) => A._impact({ w: 0.72, tint: 'FLAME', ...o }),
  hit_flame:    (A, o) => A._impact({ w: 0.66, tint: 'FLAME', ...o }),
  hit_frost:    (A, o) => A._impact({ w: 0.62, tint: 'FROST', ...o }),
  hit_sea:      (A, o) => A._impact({ w: 0.62, tint: 'SEA', ...o }),
  hit_storm:    (A, o) => A._impact({ w: 0.68, tint: 'STORM', ...o }),
  hit_earth:    (A, o) => A._impact({ w: 0.80, tint: 'EARTH', ...o }),
  hit_wind:     (A, o) => A._impact({ w: 0.50, tint: 'WIND', ...o }),
  hit_shadow:   (A, o) => A._impact({ w: 0.64, tint: 'SHADOW', ...o }),
  hit_light:    (A, o) => A._impact({ w: 0.62, tint: 'LIGHT', ...o }),
  hit_beast:    (A, o) => A._impact({ w: 0.72, tint: 'BEAST', ...o }),
  hit_mecha:    (A, o) => A._impact({ w: 0.70, tint: 'MECHA', ...o }),
  hit_mind:     (A, o) => A._impact({ w: 0.52, tint: 'MIND', ...o }),
  hit_toxin:    (A, o) => A._impact({ w: 0.55, tint: 'TOXIN', ...o }),
  hit_sound:    (A, o) => A._impact({ w: 0.60, tint: 'SOUND', ...o }),
  hit_spirit:   (A, o) => A._impact({ w: 0.52, tint: 'SPIRIT', ...o }),
  hit_void:     (A, o) => A._impact({ w: 0.86, tint: 'VOID', ...o }),
  hit_haki:     (A, o) => A._impact({ w: 0.84, tint: 'HAKI', ...o }),
  hit_fist:     (A, o) => A._impact({ w: 0.58, tint: 'FIST', ...o }),
  hit_slash:    (A, o) => A._impact({ w: 0.50, tint: 'SLASH', ...o }),

  /* ---- blades ---- */
  slash_soft:  (A, o) => A._slash({ w: 0.24, air: 1.0, ...o }),
  slash_light: (A, o) => A._slash({ w: 0.38, air: 0.7, ...o }),
  slash_air:   (A, o) => { A._slash({ w: 0.42, air: 1.5, ...o }); A._v({ wave: 'sine', f0: 620 * o.pitch, f2: 190, dur: 0.30, a: 0.004, gain: 0.09, send: 0.3, pan: o.pan }); },
  slash_heavy: (A, o) => { A._slash({ w: 0.70, air: 0.9, ...o }); A._impact({ w: 0.50, tint: 'SLASH', gain: o.gain * 0.8, pan: o.pan, pitch: o.pitch }); },
  slash_multi: (A, o) => { for (let i = 0; i < 4; i++) A._slash({ w: 0.30 + A._rand() * 0.12, air: 0.6, delay: i * 0.058 + A._rand() * 0.012, pan: o.pan + (i % 2 ? 0.16 : -0.16), pitch: o.pitch * (0.9 + A._rand() * 0.28), gain: o.gain }); },
  slash_world: (A, o) => { A._slash({ w: 1.0, air: 1.6, ...o });
                           A._v({ wave: 'sine', f0: 88, f2: 26, dur: 1.5, a: 0.004, gain: 0.44, send: 0.5, pan: o.pan * 0.3, shape: 'exp' });
                           A._rumble({ dur: 2.2, gain: 0.22, f: 74, pan: -o.pan * 0.4 });
                           A._noiseV({ dur: 1.4, gain: 0.16, filt: 'bandpass', ff0: 3400, ff1: 260, q: 0.8, a: 0.02, send: 0.6, pan: o.pan }); },

  /* ---- elemental set pieces ---- */
  fire_small: (A, o) => { A._noiseV({ dur: 0.34, gain: 0.20, filt: 'lowpass', ff0: 2200, ff1: 500, q: 0.7, a: 0.01, send: 0.28, pan: o.pan }); A._crackle({ n: 6, dur: 0.34, gain: 0.10, pan: o.pan }); },
  fire_big:   (A, o) => { A._noiseV({ dur: 0.85, gain: 0.30, filt: 'lowpass', ff0: 1500, ff1: 210, q: 0.6, a: 0.02, drive: 0.4, send: 0.4, pan: o.pan });
                          A._v({ wave: 'sawtooth', f0: 108, f2: 36, dur: 0.7, a: 0.012, gain: 0.24, filt: 'lowpass', ff0: 900, ff1: 200, send: 0.3, pan: o.pan * 0.5 });
                          A._crackle({ n: 16, dur: 0.9, gain: 0.13, pan: o.pan }); A._duck(0.26, 0.5); },
  flame_burst: (A, o) => { SFX.fire_small(A, o); A._impact({ w: 0.5, tint: 'FLAME', gain: o.gain, pan: o.pan, pitch: o.pitch }); },

  ice:        (A, o) => { A._shatter({ n: 7, f: 2300 * o.pitch, dur: 0.42, gain: 0.11, pan: o.pan });
                          A._noiseV({ dur: 0.30, gain: 0.14, filt: 'highpass', ff0: 3600, a: 0.004, send: 0.4, pan: o.pan });
                          A._v({ wave: 'sine', f0: 150, f2: 62, dur: 0.22, a: 0.002, gain: 0.20, send: 0.2, pan: o.pan * 0.4 }); },
  ice_shatter:(A, o) => { A._shatter({ n: 14, f: 3100 * o.pitch, dur: 0.7, gain: 0.10, pan: o.pan, spread: 0.5 });
                          A._noiseV({ dur: 0.5, gain: 0.18, filt: 'bandpass', ff0: 6200, ff1: 2600, q: 1.2, a: 0.002, send: 0.45, pan: o.pan }); },
  freeze:     (A, o) => { A._v({ wave: 'triangle', f0: 900 * o.pitch, f2: 2600 * o.pitch, dur: 0.55, a: 0.05, gain: 0.10, filt: 'bandpass', ff0: 2600, q: 3, send: 0.4, pan: o.pan });
                          A._shatter({ n: 5, f: 4200, dur: 0.4, gain: 0.06, pan: o.pan, delay: 0.28 }); },

  thunder:    (A, o) => { A._noiseV({ dur: 0.10, gain: 0.40, filt: 'highpass', ff0: 4200, a: 0.0005, send: 0.3, pan: o.pan });
                          A._zap({ f: 2600 * o.pitch, dur: 0.16, gain: 0.16, pan: o.pan });
                          A._noiseV({ dur: 0.75, gain: 0.24, filt: 'lowpass', ff0: 900, ff1: 130, q: 0.7, a: 0.008, delay: 0.045, send: 0.45, pan: o.pan * 0.4 });
                          A._v({ wave: 'sine', f0: 62, f2: 27, dur: 0.85, a: 0.005, gain: 0.32, delay: 0.04, send: 0.3, pan: 0 }); },
  thunder_big:(A, o) => { SFX.thunder(A, o); SFX.thunder(A, { ...o, pitch: o.pitch * 0.78, pan: -o.pan, gain: o.gain * 0.8 });
                          A._rumble({ dur: 1.8, gain: 0.26, f: 54, pan: 0, delay: 0.12 }); A._duck(0.34, 0.7); },
  zap:        (A, o) => A._zap({ f: 1800 * o.pitch, dur: 0.2, gain: 0.16, pan: o.pan }),

  water_hit:  (A, o) => { A._impact({ w: 0.48, tint: 'SEA', ...o }); A._bubbles({ n: 5, dur: 0.35, gain: 0.06, pan: o.pan }); },
  wave:       (A, o) => { A._noiseV({ dur: 1.3, gain: 0.24, filt: 'lowpass', ff0: 420, ff1: 1900, q: 0.6, a: 0.35, shape: 'lin', send: 0.5, pan: o.pan });
                          A._noiseV({ dur: 0.7, gain: 0.16, filt: 'bandpass', ff0: 1600, ff1: 400, q: 0.8, a: 0.02, delay: 0.75, send: 0.5, pan: -o.pan });
                          A._v({ wave: 'sine', f0: 72, f2: 40, dur: 1.0, a: 0.25, gain: 0.22, delay: 0.5, send: 0.3, pan: 0 }); },
  whirlpool:  (A, o) => { A._noiseV({ dur: 1.5, gain: 0.20, filt: 'bandpass', ff0: 700, ff1: 260, q: 3.2, a: 0.25, send: 0.5, pan: o.pan });
                          A._bubbles({ n: 12, dur: 1.4, gain: 0.05, pan: o.pan }); },
  bubble:     (A, o) => A._bubbles({ n: 6, dur: 0.5, gain: 0.07, pan: o.pan }),

  quake:      (A, o) => { A._rumble({ dur: 2.0, gain: 0.36, f: 46, pan: 0 });
                          A._noiseV({ dur: 1.4, gain: 0.20, filt: 'lowpass', ff0: 620, ff1: 150, q: 0.8, a: 0.05, send: 0.4, pan: o.pan });
                          A._grains({ n: 14, dur: 1.3, f: 700, gain: 0.07, pan: o.pan }); A._duck(0.32, 1.1); },
  rockfall:   (A, o) => { A._grains({ n: 11, dur: 0.9, f: 520, gain: 0.10, pan: o.pan }); A._impact({ w: 0.6, tint: 'EARTH', gain: o.gain, pan: o.pan, pitch: o.pitch, delay: 0.4 }); },
  sand:       (A, o) => { A._noiseV({ dur: 1.1, gain: 0.16, filt: 'bandpass', ff0: 2400, ff1: 1300, q: 0.7, a: 0.25, shape: 'lin', send: 0.35, pan: o.pan });
                          A._noiseV({ dur: 0.9, gain: 0.08, filt: 'highpass', ff0: 5200, a: 0.3, shape: 'lin', send: 0.2, pan: -o.pan }); },

  gale:       (A, o) => A._noiseV({ dur: 1.0, gain: 0.18, filt: 'bandpass', ff0: 900, ff1: 2800, q: 2.2, a: 0.3, shape: 'lin', send: 0.4, pan: o.pan }),
  tornado:    (A, o) => { A._noiseV({ dur: 1.8, gain: 0.22, filt: 'bandpass', ff0: 480, ff1: 1500, q: 5, a: 0.5, shape: 'lin', send: 0.5, pan: o.pan });
                          A._v({ wave: 'sawtooth', f0: 90, f2: 150, dur: 1.7, a: 0.4, gain: 0.10, filt: 'lowpass', ff0: 600, send: 0.3, pan: -o.pan }); },
  whoosh:     (A, o) => A._noiseV({ dur: 0.32, gain: 0.17, filt: 'bandpass', ff0: 3200, ff1: 700, q: 2.4, a: 0.05, send: 0.28, pan: o.pan }),

  cannon:     (A, o) => { A._v({ wave: 'square', f0: 150 * o.pitch, f2: 40, dur: 0.32, a: 0.0008, gain: 0.30, filt: 'lowpass', ff0: 1800, ff1: 300, drive: 0.6, send: 0.3, pan: o.pan });
                          A._noiseV({ dur: 0.45, gain: 0.30, filt: 'lowpass', ff0: 2600, ff1: 240, a: 0.0008, drive: 0.4, send: 0.4, pan: o.pan });
                          A._v({ wave: 'sine', f0: 78, f2: 30, dur: 0.6, a: 0.002, gain: 0.34, send: 0.25, pan: 0 }); A._duck(0.24, 0.35); },
  gunshot:    (A, o) => { A._noiseV({ dur: 0.14, gain: 0.34, filt: 'highpass', ff0: 1600, a: 0.0004, drive: 0.7, send: 0.35, pan: o.pan });
                          A._v({ wave: 'sine', f0: 190, f2: 55, dur: 0.16, a: 0.0006, gain: 0.24, send: 0.15, pan: o.pan }); },
  dragon:     (A, o) => { A._v({ wave: 'sawtooth', f0: 86 * o.pitch, f1: 70 * o.pitch, f2: 44, dur: 0.95, a: 0.05, gain: 0.26, filt: 'lowpass', ff0: 1400, ff1: 320, drive: 0.5, send: 0.4, pan: o.pan });
                          A._noiseV({ dur: 1.0, gain: 0.22, filt: 'lowpass', ff0: 1600, ff1: 260, q: 0.7, a: 0.06, send: 0.4, pan: o.pan });
                          A._v({ wave: 'sawtooth', f0: 43 * o.pitch, f2: 24, dur: 1.0, a: 0.05, gain: 0.20, send: 0.2, pan: 0 }); A._duck(0.24, 0.8); },
  beast_roar: (A, o) => { A._v({ wave: 'sawtooth', f0: 130 * o.pitch, f1: 155 * o.pitch, f2: 70, dur: 0.7, a: 0.03, gain: 0.24, filt: 'lowpass', ff0: 1700, ff1: 500, q: 2, drive: 0.5, send: 0.35, pan: o.pan });
                          A._noiseV({ dur: 0.7, gain: 0.13, filt: 'bandpass', ff0: 1100, ff1: 600, q: 1.2, a: 0.04, send: 0.3, pan: o.pan }); },

  light:      (A, o) => { A._bellCluster({ f: 1400 * o.pitch, n: 5, dur: 0.65, gain: 0.075, pan: o.pan, ratios: [1, 1.5, 2, 2.66, 3.5] });
                          A._v({ wave: 'sine', f0: 700 * o.pitch, f2: 3200 * o.pitch, dur: 0.4, a: 0.03, gain: 0.09, send: 0.45, pan: o.pan });
                          A._noiseV({ dur: 0.5, gain: 0.07, filt: 'highpass', ff0: 6000, a: 0.06, send: 0.5, pan: -o.pan }); },
  light_beam: (A, o) => { A._v({ wave: 'sawtooth', f0: 320 * o.pitch, f2: 1400 * o.pitch, dur: 0.7, a: 0.09, gain: 0.14, filt: 'bandpass', ff0: 2200, ff1: 5200, q: 3, send: 0.4, pan: o.pan });
                          A._bellCluster({ f: 2100, n: 4, dur: 0.7, gain: 0.05, pan: o.pan, delay: 0.25 }); },
  shadow:     (A, o) => { A._v({ wave: 'sawtooth', f0: 300 * o.pitch, f2: 78, dur: 0.55, a: 0.09, gain: 0.17, filt: 'lowpass', ff0: 1400, ff1: 380, q: 2.5, send: 0.45, pan: o.pan });
                          A._v({ wave: 'sine', f0: 66, dur: 0.7, a: 0.12, gain: 0.16, send: 0.3, pan: 0 });
                          A._noiseV({ dur: 0.6, gain: 0.08, filt: 'lowpass', ff0: 700, a: 0.2, shape: 'lin', send: 0.5, pan: -o.pan }); },
  voidfx:     (A, o) => { A._v({ wave: 'sine', f0: 120 * o.pitch, f2: 22, dur: 1.2, a: 0.15, gain: 0.30, send: 0.4, pan: 0 });
                          A._v({ wave: 'sawtooth', f0: 44, f2: 20, dur: 1.3, a: 0.2, gain: 0.14, filt: 'lowpass', ff0: 400, send: 0.3, pan: o.pan });
                          A._noiseV({ dur: 1.0, gain: 0.10, filt: 'lowpass', ff0: 260, a: 0.4, shape: 'lin', send: 0.6, pan: -o.pan }); },
  soul:       (A, o) => { A._bellCluster({ f: 660 * o.pitch, n: 4, dur: 1.1, gain: 0.07, pan: o.pan, ratios: [1, 1.5, 2.02, 3.01], detune: 8 });
                          A._v({ wave: 'sine', f0: 330 * o.pitch, f2: 240, dur: 1.0, a: 0.2, gain: 0.09, send: 0.6, pan: -o.pan }); },
  spirit:     (A, o) => SFX.soul(A, o),
  sonic:      (A, o) => { A._v({ wave: 'sawtooth', f0: 900 * o.pitch, f2: 260, dur: 0.4, a: 0.004, gain: 0.14, filt: 'bandpass', ff0: 2000, ff1: 700, q: 5, send: 0.35, pan: o.pan });
                          A._v({ wave: 'square', f0: 450 * o.pitch, f2: 130, dur: 0.38, a: 0.004, gain: 0.07, send: 0.2, pan: -o.pan }); },
  screech:    (A, o) => { A._v({ wave: 'sawtooth', f0: 1700 * o.pitch, f1: 2400 * o.pitch, f2: 900, dur: 0.5, a: 0.01, gain: 0.11, filt: 'bandpass', ff0: 3000, q: 7, drive: 0.5, send: 0.4, pan: o.pan });
                          A._noiseV({ dur: 0.4, gain: 0.08, filt: 'highpass', ff0: 4000, a: 0.02, send: 0.3, pan: -o.pan }); },
  sludge:     (A, o) => { A._noiseV({ dur: 0.42, gain: 0.20, filt: 'lowpass', ff0: 900, ff1: 190, q: 1.8, a: 0.008, send: 0.24, pan: o.pan });
                          A._v({ wave: 'sine', f0: 190 * o.pitch, f1: 130, f2: 74, dur: 0.4, a: 0.006, gain: 0.16, send: 0.2, pan: o.pan });
                          A._bubbles({ n: 4, dur: 0.45, gain: 0.05, pan: o.pan, low: true }); },
  poison:     (A, o) => SFX.sludge(A, o),
  psychic:    (A, o) => { A._v({ wave: 'sine', f0: 620 * o.pitch, f1: 780, f2: 520, dur: 0.7, a: 0.03, gain: 0.10, send: 0.5, pan: o.pan, ring: 233 });
                          A._v({ wave: 'sine', f0: 930 * o.pitch, f2: 660, dur: 0.6, a: 0.05, gain: 0.06, send: 0.5, pan: -o.pan, ring: 97 }); },
  mecha_whirr:(A, o) => { A._v({ wave: 'sawtooth', f0: 220 * o.pitch, f1: 640, f2: 300, dur: 0.55, a: 0.02, gain: 0.09, filt: 'bandpass', ff0: 1800, q: 4, send: 0.2, pan: o.pan });
                          A._metalClang({ f: 480 * o.pitch, dur: 0.5, gain: 0.08, pan: o.pan, delay: 0.3 }); },
  clang:      (A, o) => A._metalClang({ f: 620 * o.pitch, dur: 0.7, gain: 0.14, pan: o.pan }),

  haki:       (A, o) => { A._v({ wave: 'sine', f0: 74, f2: 42, dur: 0.85, a: 0.006, gain: 0.38, send: 0.3, pan: 0 });
                          A._v({ wave: 'sawtooth', f0: 148, f2: 62, dur: 0.55, a: 0.01, gain: 0.11, filt: 'lowpass', ff0: 700, ff1: 240, drive: 0.5, send: 0.3, pan: o.pan });
                          A._noiseV({ dur: 0.6, gain: 0.11, filt: 'lowpass', ff0: 520, ff1: 160, a: 0.02, send: 0.4, pan: -o.pan * 0.5 }); A._duck(0.20, 0.5); },
  conqueror:  (A, o) => { A._v({ wave: 'sine', f0: 58, f2: 27, dur: 1.7, a: 0.01, gain: 0.46, send: 0.35, pan: 0 });
                          A._v({ wave: 'sawtooth', f0: 116, f1: 92, f2: 44, dur: 1.2, a: 0.02, gain: 0.16, filt: 'lowpass', ff0: 620, ff1: 180, drive: 0.6, send: 0.35, pan: o.pan * 0.4 });
                          A._noiseV({ dur: 1.3, gain: 0.16, filt: 'lowpass', ff0: 420, ff1: 90, a: 0.03, send: 0.55, pan: -o.pan * 0.4 });
                          A._v({ wave: 'square', f0: 233, f2: 116, dur: 0.55, a: 0.015, gain: 0.07, delay: 0.06, filt: 'bandpass', ff0: 900, q: 3, send: 0.4, pan: o.pan });
                          A._rumble({ dur: 2.2, gain: 0.20, f: 41, pan: 0, delay: 0.1 }); A._duck(0.44, 1.4); },

  /* ---- status / utility ---- */
  buff:    (A, o) => { const b = [0, 4, 7, 12]; b.forEach((s, i) => A._v({ wave: 'triangle', f0: mtof(69 + s) * o.pitch, dur: 0.22, a: 0.006, gain: 0.085, delay: i * 0.05, filt: 'lowpass', ff0: 3200, send: 0.22, pan: o.pan }));
                       A._v({ wave: 'sine', f0: 220, f2: 440, dur: 0.3, a: 0.05, gain: 0.07, send: 0.3, pan: o.pan }); },
  debuff:  (A, o) => { const b = [12, 7, 3, -1]; b.forEach((s, i) => A._v({ wave: 'triangle', f0: mtof(69 + s) * o.pitch, dur: 0.24, a: 0.006, gain: 0.085, delay: i * 0.055, filt: 'lowpass', ff0: 2200, send: 0.22, pan: o.pan }));
                       A._v({ wave: 'sine', f0: 330, f2: 120, dur: 0.36, a: 0.05, gain: 0.06, send: 0.3, pan: o.pan }); },
  heal:    (A, o) => { [0, 4, 7, 11, 14].forEach((s, i) => A._v({ wave: 'sine', f0: mtof(72 + s) * o.pitch, dur: 0.45, a: 0.02, gain: 0.065, delay: i * 0.055, send: 0.4, pan: o.pan * 0.6 }));
                       A._v({ wave: 'triangle', f0: mtof(60) * o.pitch, dur: 0.7, a: 0.1, gain: 0.05, send: 0.4, pan: -o.pan * 0.4 });
                       A._noiseV({ dur: 0.6, gain: 0.035, filt: 'highpass', ff0: 5000, a: 0.2, shape: 'lin', send: 0.5, pan: o.pan }); },
  shield:  (A, o) => { A._v({ wave: 'triangle', f0: 280 * o.pitch, f2: 700 * o.pitch, dur: 0.32, a: 0.004, gain: 0.15, filt: 'lowpass', ff0: 3000, send: 0.3, pan: o.pan });
                       A._metalClang({ f: 900 * o.pitch, dur: 0.45, gain: 0.07, pan: o.pan });
                       A._noiseV({ dur: 0.25, gain: 0.09, filt: 'highpass', ff0: 3400, a: 0.004, send: 0.35, pan: o.pan }); },
  warp:    (A, o) => { A._v({ wave: 'sine', f0: 180 * o.pitch, f2: 2400 * o.pitch, dur: 0.42, a: 0.008, gain: 0.14, filt: 'bandpass', ff0: 1200, ff1: 4000, q: 3, send: 0.4, pan: o.pan });
                       A._v({ wave: 'triangle', f0: 90, f2: 1200, dur: 0.4, a: 0.01, gain: 0.06, send: 0.3, pan: -o.pan }); },
  weather: (A, o) => { A._noiseV({ dur: 1.6, gain: 0.13, filt: 'lowpass', ff0: 1500, ff1: 420, q: 0.7, a: 0.35, shape: 'lin', send: 0.5, pan: o.pan });
                       A._v({ wave: 'sine', f0: 96, f2: 62, dur: 1.5, a: 0.4, gain: 0.10, send: 0.4, pan: 0 });
                       A._v({ wave: 'triangle', f0: 288, f2: 192, dur: 1.2, a: 0.45, gain: 0.045, send: 0.5, pan: -o.pan }); },
  scatter: (A, o) => { A._grains({ n: 9, dur: 0.45, f: 2600, gain: 0.055, pan: o.pan, hp: true });
                       A._noiseV({ dur: 0.28, gain: 0.10, filt: 'highpass', ff0: 2600, a: 0.004, send: 0.3, pan: o.pan }); },
  confuse: (A, o) => { for (let i = 0; i < 7; i++) A._v({ wave: 'sine', f0: (480 + Math.sin(i * 1.7) * 260) * o.pitch, f2: (480 + Math.sin(i * 1.7 + 1) * 260) * o.pitch, dur: 0.26, a: 0.02, gain: 0.055, delay: i * 0.062, send: 0.45, pan: (i % 2 ? 0.4 : -0.4) + o.pan * 0.3, ring: 61 }); },
  sleep:   (A, o) => { A._v({ wave: 'sine', f0: 420 * o.pitch, f2: 105, dur: 1.0, a: 0.04, gain: 0.13, filt: 'lowpass', ff0: 1600, ff1: 500, send: 0.4, pan: o.pan });
                       A._v({ wave: 'triangle', f0: 210 * o.pitch, f2: 70, dur: 1.1, a: 0.08, gain: 0.07, send: 0.4, pan: -o.pan * 0.5 }); },
  burn:    (A, o) => { A._crackle({ n: 8, dur: 0.5, gain: 0.08, pan: o.pan }); A._noiseV({ dur: 0.45, gain: 0.10, filt: 'bandpass', ff0: 1400, ff1: 600, q: 1, a: 0.02, send: 0.3, pan: o.pan }); },
  paralyze:(A, o) => { for (let i = 0; i < 5; i++) A._zap({ f: (1400 + i * 260) * o.pitch, dur: 0.07, gain: 0.10, pan: o.pan + (i % 2 ? 0.15 : -0.15), delay: i * 0.045 }); },
  drain:   (A, o) => { A._v({ wave: 'sawtooth', f0: 700 * o.pitch, f2: 170, dur: 0.6, a: 0.02, gain: 0.10, filt: 'bandpass', ff0: 1400, ff1: 400, q: 4, send: 0.4, pan: o.pan });
                       A._v({ wave: 'sine', f0: 120, f2: 300, dur: 0.5, a: 0.15, gain: 0.08, delay: 0.2, send: 0.3, pan: -o.pan }); },
  charge:  (A, o) => { A._v({ wave: 'sawtooth', f0: 110 * o.pitch, f2: 660 * o.pitch, dur: 0.85, a: 0.3, shape: 'lin', gain: 0.11, filt: 'lowpass', ff0: 500, ff1: 3600, q: 3, send: 0.35, pan: o.pan });
                       A._noiseV({ dur: 0.8, gain: 0.06, filt: 'highpass', ff0: 3000, a: 0.5, shape: 'lin', send: 0.4, pan: -o.pan }); },
  recharge:(A, o) => { A._v({ wave: 'triangle', f0: 320 * o.pitch, f2: 120, dur: 0.7, a: 0.02, gain: 0.09, filt: 'lowpass', ff0: 1400, send: 0.3, pan: o.pan }); },
  transform:(A, o) => { A._v({ wave: 'sawtooth', f0: 160 * o.pitch, f1: 900, f2: 420, dur: 0.9, a: 0.05, gain: 0.12, filt: 'bandpass', ff0: 1200, ff1: 3200, q: 4, send: 0.4, pan: o.pan });
                        A._bellCluster({ f: 880, n: 4, dur: 0.8, gain: 0.06, pan: o.pan, delay: 0.4 }); },
  item:    (A, o) => { A._v({ wave: 'triangle', f0: 880 * o.pitch, dur: 0.1, a: 0.003, gain: 0.10, send: 0.2, pan: o.pan });
                       A._v({ wave: 'triangle', f0: 1320 * o.pitch, dur: 0.16, a: 0.003, gain: 0.07, delay: 0.07, send: 0.25, pan: o.pan }); },

  /* ---- battle feedback ---- */
  faint:   (A, o) => { A._v({ wave: 'square', f0: 420 * o.pitch, f1: 210, f2: 58, dur: 0.85, a: 0.004, gain: 0.16, filt: 'lowpass', ff0: 2200, ff1: 400, send: 0.35, pan: o.pan });
                       A._v({ wave: 'sine', f0: 210 * o.pitch, f2: 40, dur: 0.9, a: 0.006, gain: 0.14, send: 0.3, pan: o.pan });
                       A._noiseV({ dur: 0.7, gain: 0.14, filt: 'lowpass', ff0: 1100, ff1: 150, a: 0.01, send: 0.5, pan: o.pan });
                       A._impact({ w: 0.55, tint: 'EARTH', gain: 0.7, pan: o.pan, pitch: 0.9, delay: 0.42 }); A._duck(0.28, 0.8); },
  // A critical used to be three rising pings and a hiss laid over the ordinary
  // impact — measured at 0.45 dB louder than a normal hit and a fingerprint
  // distance of 0.0269, which is less than the distance between two fighters'
  // cries. With your eyes shut you could not tell what had landed. It now has a
  // body of its own: a hard downward-swept thump underneath, so a crit reads as
  // a *different, heavier hit* first and a flourish second.
  crit:    (A, o) => { A._v({ wave: 'sawtooth', f0: 320, f2: 58, dur: 0.30, a: 0.001, gain: 0.26, filt: 'lowpass', ff0: 2600, ff1: 300, q: 1.6, drive: 0.5, send: 0.18, pan: o.pan, shape: 'exp' });
                       A._v({ wave: 'sine', f0: 150, f2: 42, dur: 0.42, a: 0.001, gain: 0.22, send: 0.2, pan: o.pan, shape: 'exp' });
                       A._noiseV({ dur: 0.09, gain: 0.20, filt: 'bandpass', ff0: 3200, ff1: 900, q: 0.8, a: 0.0005, send: 0.15, pan: o.pan });
                       A._v({ wave: 'square', f0: 1568, dur: 0.07, a: 0.001, gain: 0.11, filt: 'highpass', ff0: 900, send: 0.2, pan: o.pan });
                       A._v({ wave: 'square', f0: 2093, dur: 0.10, a: 0.001, gain: 0.09, delay: 0.048, send: 0.25, pan: o.pan });
                       A._v({ wave: 'square', f0: 3136, dur: 0.14, a: 0.001, gain: 0.06, delay: 0.096, send: 0.3, pan: o.pan });
                       A._noiseV({ dur: 0.2, gain: 0.07, filt: 'highpass', ff0: 6000, a: 0.001, send: 0.35, pan: o.pan }); },
  super:   (A, o) => { A._v({ wave: 'square', f0: 988, dur: 0.09, a: 0.001, gain: 0.09, send: 0.18, pan: o.pan });
                       A._v({ wave: 'square', f0: 1319, dur: 0.13, a: 0.001, gain: 0.075, delay: 0.055, send: 0.22, pan: o.pan });
                       A._v({ wave: 'sine', f0: 2637, dur: 0.09, a: 0.001, gain: 0.03, delay: 0.055, send: 0.2, pan: o.pan }); },
  weak:    (A, o) => { A._v({ wave: 'triangle', f0: 330 * o.pitch, f2: 208, dur: 0.2, a: 0.004, gain: 0.09, filt: 'lowpass', ff0: 1400, send: 0.15, pan: o.pan });
                       A._v({ wave: 'sine', f0: 165, dur: 0.22, a: 0.006, gain: 0.05, send: 0.15, pan: o.pan }); },
  immune:  (A, o) => { A._metalClang({ f: 340 * o.pitch, dur: 0.5, gain: 0.11, pan: o.pan });
                       A._v({ wave: 'sine', f0: 110, dur: 0.3, a: 0.002, gain: 0.10, send: 0.2, pan: o.pan }); },
  miss:    (A, o) => { A._noiseV({ dur: 0.26, gain: 0.14, filt: 'bandpass', ff0: 2600, ff1: 800, q: 2.6, a: 0.02, send: 0.3, pan: o.pan });
                       A._v({ wave: 'sine', f0: 400 * o.pitch, f2: 200, dur: 0.2, a: 0.02, gain: 0.04, send: 0.2, pan: o.pan }); },
  lowhp:   (A, o) => { A._v({ wave: 'square', f0: 1046, dur: 0.085, a: 0.001, gain: 0.085, filt: 'bandpass', ff0: 1400, q: 1.5, send: 0.05, pan: 0 });
                       A._v({ wave: 'square', f0: 1046, dur: 0.085, a: 0.001, gain: 0.075, delay: 0.13, filt: 'bandpass', ff0: 1400, q: 1.5, send: 0.05, pan: 0 }); },
  levelup: (A, o) => { [60, 64, 67, 72, 76, 79].forEach((m, i) => A._v({ wave: 'triangle', f0: mtof(m), dur: 0.3, a: 0.004, gain: 0.08, delay: i * 0.065, send: 0.3, pan: o.pan })); },

  victory: (A, o) => {
    // Rising major fanfare, brass-ish, then the score picks it up.
    const t = 0.115;
    [[67, 0], [67, 0.5], [67, 1], [72, 1.5], [76, 2.6], [79, 3.4], [84, 4.2]].forEach(([m, s]) => {
      A._v({ wave: 'sawtooth', f0: mtof(m), dur: 0.42, a: 0.012, gain: 0.10, delay: s * t, filt: 'lowpass', ff0: 2600, ff1: 1400, send: 0.35, pan: -0.18 });
      A._v({ wave: 'sawtooth', f0: mtof(m) * 1.005, dur: 0.42, a: 0.012, gain: 0.09, delay: s * t + 0.006, filt: 'lowpass', ff0: 2400, ff1: 1300, send: 0.35, pan: 0.18 });
      A._v({ wave: 'sine', f0: mtof(m - 24), dur: 0.4, a: 0.006, gain: 0.10, delay: s * t, send: 0.2, pan: 0 });
    });
    A._v({ wave: 'sine', f0: 96, f2: 48, dur: 0.6, a: 0.002, gain: 0.28, delay: 4.2 * t, send: 0.3, pan: 0 });
    A._noiseV({ dur: 1.6, gain: 0.10, filt: 'highpass', ff0: 4200, a: 0.004, delay: 4.2 * t, send: 0.6, pan: 0.1 });
    A._afterTrack('victory', 4.2 * t + 0.9);
  },
  defeat: (A, o) => {
    const t = 0.2;
    [[72, 0], [70, 1], [67, 2], [63, 3.2]].forEach(([m, s]) => {
      A._v({ wave: 'triangle', f0: mtof(m), dur: 0.8, a: 0.02, gain: 0.09, delay: s * t, filt: 'lowpass', ff0: 1800, ff1: 700, send: 0.45, pan: -0.12 });
      A._v({ wave: 'sine', f0: mtof(m - 12), dur: 0.9, a: 0.03, gain: 0.07, delay: s * t, send: 0.4, pan: 0.12 });
    });
    A._v({ wave: 'sine', f0: 82, f2: 41, dur: 2.0, a: 0.15, gain: 0.18, delay: 3.2 * t, send: 0.4, pan: 0 });
    A._afterTrack('defeat', 3.2 * t + 1.2);
  }
};

// Names the rest of the codebase (and older move data) may still use.
/**
 * What a cue is *for*, and therefore how loud it has to be.
 *
 * A critic measured this piece at 4/10 with one gap: the sound is well made and
 * reports nothing. Summed against the battle bed (RMS −28.1 dBFS) a critical hit
 * raised the mix by 0.11 dB, "not very effective" by 0.02, the low-HP warning by
 * 0.13, and `text_blip` — 84% of every audio call in a battle — by 0.00. Only
 * `faint`, `thunder` and `hit_flame` cleared 2 dB. Nothing clipped anywhere,
 * including eight heavy attacks at once, so this was never a harshness problem:
 * the informational half of the mix was simply 15–27 dB too quiet.
 *
 * The fix is not a slider — the defaults already ship sfx 0.8 against music 0.35
 * — and it is not a flat bus boost, which would just move the spectacle cues
 * into the ceiling too. Cues are lifted by what they have to tell the player,
 * and the ones that carry a verdict also duck the bed for a quarter-second.
 * `text_blip` is lifted hardest and never ducks: it fires ~960 times a battle
 * and ducking on each one would pump the music continuously.
 */
const SFX_ROLE = {
  // The verdict on a turn. These must be unmissable.
  crit:      { lift: 9.0, duck: 0.30, duckLen: 0.34 },
  super:     { lift: 9.0, duck: 0.24 },
  weak:      { lift: 22.0, duck: 0.20 },
  immune:    { lift: 10.0, duck: 0.24 },
  miss:      { lift: 22.0, duck: 0.18 },
  lowhp:     { lift: 7.0, duck: 0.30, duckLen: 0.5 },
  // State changes you are meant to notice and act on.
  heal:      { lift: 3.5, duck: 0.16 },
  buff:      { lift: 5.0, duck: 0.16 },
  debuff:    { lift: 5.0, duck: 0.16 },
  poison:    { lift: 5.0, duck: 0.16 },
  paralyze:  { lift: 5.0, duck: 0.16 },
  freeze:    { lift: 5.0, duck: 0.16 },
  sleep:     { lift: 4.0, duck: 0.16 },
  confuse:   { lift: 5.0, duck: 0.16 },
  shield:    { lift: 11.0, duck: 0.16 },
  item:      { lift: 10.0, duck: 0.16 },
  drain:     { lift: 4.0, duck: 0.14 },
  // Reading tempo. Loud enough to set the pace, never enough to duck.
  text_blip: { lift: 55.0, duck: 0 },
  ui_move:   { lift: 6.0, duck: 0 },
  ui_select: { lift: 4.0, duck: 0 },
  ui_back:   { lift: 4.0, duck: 0 },
  ui_error:  { lift: 5.0, duck: 0 },
  ui_open:   { lift: 4.0, duck: 0 },
  ui_close:  { lift: 4.0, duck: 0 }
  // Everything else — the impacts, the elements, faint — already cleared the
  // bed on measurement and is left exactly as it was.
};

/**
 * The combat layer, and the correction to the block above.
 *
 * "Everything else already cleared the bed on measurement" was true of what I
 * measured and false of the game. Stage 1 of the audio harness tests 41 of these
 * 103 keys and none of the ones a live battle actually fires — `clang`,
 * `slash_heavy`, `psychic`, `impact_light`, `water_hit`, `gale`. So the lift
 * above went entirely onto the stinger layer and the sound of a blow landing was
 * left where it was: a critic measured a stat buff as the loudest thing in the
 * battle and a punch as the quietest, with the 18 faintest keys in the registry
 * all being move sounds and 55-86% of hits carrying no stinger at all.
 *
 * These lifts are not chosen. Every key in the registry was rendered against the
 * battle bed's median 250 ms window peak (-14.9 dBFS at ship volumes) and the
 * lift closes **65% of its deficit** against +1 dB over that bed — deficits ran
 * from -0.1 to -34.4 dB. Deliberately not 100%: closing the whole gap put every
 * one of the 24 quietest keys within 0.7 dB of the others and flattened the
 * registry's own tap-to-world impact ladder, so a glancing blow and a
 * world-ender landed at the same loudness. 65% fixes the absolute level and
 * keeps a third of the original spread. Keys already over the bar are absent
 * rather than cut, so nothing that works today is disturbed. Regenerate the same
 * way after any change to the synthesis; do not hand-tune a number here.
 */
const SFX_COMBAT_LIFT = {
  beast_roar: 1.6, bubble: 2.2, burn: 4.6, cannon: 1.2, clang: 2.0, cursor: 1.6, fire_big: 1.1,
  fire_small: 3.6, flame_burst: 1.3, gale: 2.0, gunshot: 3.2, haki: 1.1, hit_beast: 1.2,
  hit_fist: 1.6, hit_flame: 1.1, hit_frost: 1.6, hit_light: 1.3, hit_mecha: 1.2, hit_mind: 1.5,
  hit_sea: 1.4, hit_slash: 3.0, hit_sound: 1.4, hit_spirit: 1.5, hit_storm: 1.2,
  hit_toxin: 1.5, hit_wind: 2.4, ice: 1.4, ice_shatter: 1.2, impact_fire: 1.1,
  impact_heavy: 1.3, impact_light: 2.1, impact_med: 1.7, impact_tap: 2.8, levelup: 1.6,
  light: 1.4, light_beam: 1.9, mecha_whirr: 1.1, page: 6.7, psychic: 2.0, recharge: 2.8,
  scatter: 2.9, screech: 2.3, slash_air: 2.6, slash_heavy: 2.2, slash_light: 5.0,
  slash_multi: 1.2, slash_soft: 7.3, sludge: 2.2, sonic: 4.0, soul: 1.4, spirit: 1.4,
  tornado: 1.4, transform: 1.8, warp: 4.7, water_hit: 1.5, weather: 1.2, whirlpool: 2.0,
  whoosh: 2.8, zap: 4.7
};
for (const [k, lift] of Object.entries(SFX_COMBAT_LIFT)) {
  if (!SFX_ROLE[k]) SFX_ROLE[k] = { lift, duck: 0 };
}

// The lift is applied to the registry entry itself rather than inside `sfx()`,
// so it is a property of the sound and not of one code path. Anything that
// reaches for SFX[key] directly — the critic's offline harness does exactly
// that — measures what a player actually hears.
for (const [k, r] of Object.entries(SFX_ROLE)) {
  const base = SFX[k];
  if (!base || r.lift === 1) continue;
  // Most registry entries write a literal `gain:` into each voice and never
  // read `o.gain`, so multiplying the dispatcher's argument did nothing at all —
  // measured: identical RMS before and after. The lift is set on the instance
  // for the duration of the call instead, where `_v` applies it to every voice
  // the cue creates and no entry can quietly ignore it.
  SFX[k] = (A, o) => {
    const prev = A._lift;
    A._lift = (prev ?? 1) * r.lift;
    try { base(A, o); } finally { A._lift = prev; }
  };
}

const SFX_ALIAS = {
  select: 'ui_select', back: 'ui_back', move_cursor: 'ui_move', error: 'ui_error',
  blip: 'text_blip', hit: 'impact_med', punch: 'impact_med', kick: 'impact_med',
  impact: 'impact_med', boom: 'impact_heavy', explosion: 'impact_world',
  slash: 'slash_light', cut: 'slash_light', blade: 'slash_light',
  fire: 'fire_big', flame: 'fire_big', ice_hit: 'ice', frost: 'ice',
  water: 'water_hit', splash: 'water_hit', elec: 'thunder', lightning: 'thunder',
  earth: 'quake', ground: 'quake', wind: 'gale', dark: 'shadow',
  ghost: 'soul', psy: 'psychic', mind: 'psychic', metal: 'clang',
  poison_hit: 'sludge', bug: 'scatter', sonic_boom: 'sonic',
  void: 'voidfx', abyss: 'voidfx', nothing: 'voidfx',
  guard: 'shield', protect: 'shield', barrier: 'shield', screen: 'shield',
  // Five moves shipped pointing at sounds that did not exist and played in
  // silence: moon_tiara_action and moon_princess_halation asked for `chime`,
  // and monster_point, kurama_cloak and demon_surge asked for `roar`. Nothing
  // surfaced it because the move audit's key list had rotted — a silent move
  // does not announce itself. Aliased here rather than rewritten in the move
  // data: these are the names a move author reaches for, and the next one to
  // reach for them should get a sound too.
  chime: 'light', bell: 'light', roar: 'beast_roar', growl: 'beast_roar',
  potion: 'heal', recover: 'heal', ko: 'faint', down: 'faint',
  win: 'victory', lose: 'defeat', fanfare: 'victory'
};

/* ==================================================================== */
/* 4. music                                                              */
/* ==================================================================== */

// The hook: an ascending call answered by a stepwise fall, restated a step
// higher. It shows up in every track — augmented on the title, in harmonic
// minor when someone is down to their last fighter, in major when you win.
const HOOK_A = [
  pat('a4 .  .  .  c5 .  e5 .  a5 .  -  .  g5 .  e5 .'),
  pat('f5 .  .  .  e5 .  .  .  c5 .  -  .  -  .  .  .'),
  pat('g4 .  .  .  c5 .  e5 .  g5 .  -  .  a5 .  b5 .'),
  pat('c6 .  .  .  b5 .  g5 .  e5 .  -  .  .  .  d5 e5')
];
const HOOK_A2 = [
  pat('a4 .  .  .  c5 .  e5 .  a5 .  -  .  b5 .  c6 .'),
  pat('f5 .  .  .  e5 .  .  .  c5 .  a4 .  .  .  .  .'),
  pat('g4 .  .  .  c5 .  e5 .  g5 .  -  .  e5 .  d5 .'),
  pat('e5 .  .  .  gs5 . b5 .  e6 .  -  .  -  .  .  .')
];
const HOOK_B = [
  pat('d5 .  .  .  f5 .  a5 .  d6 .  -  .  a5 .  f5 .'),
  pat('e5 .  .  .  a4 .  c5 .  e5 .  -  .  -  .  .  .'),
  pat('b4 .  .  .  d5 .  f5 .  b5 .  -  .  as5 . a5 .'),
  pat('gs5 . .  .  b5 .  d6 .  e6 .  -  .  -  .  .  .')
];
const HOOK_C = [
  pat('f4 .  .  .  a4 .  c5 .  f5 .  -  .  e5 .  c5 .'),
  pat('g4 .  .  .  b4 .  d5 .  g5 .  -  .  f5 .  d5 .'),
  pat('a4 .  .  .  c5 .  e5 .  a5 .  -  .  -  .  g5 e5'),
  pat('a5 .  -  .  e5 .  a4 .  .  .  .  .  .  .  .  .')
];

const DRUM = {
  none:  { kick: rhy('................'), snare: rhy('................'), hat: rhy('................') },
  soft:  { kick: rhy('x.......x.......'), snare: rhy('................'), hat: rhy('....5.......5...') },
  half:  { kick: rhy('x.......x...x...'), snare: rhy('........x.......'), hat: rhy('..5...5...5...5.') },
  main:  { kick: rhy('x..x..x...x.x...'), snare: rhy('....x.......x...'), hat: rhy('5.4.5.4.5.4.5.4.') },
  big:   { kick: rhy('x..x..x.x.x.x.x.'), snare: rhy('....x...x...x.xx'), hat: rhy('5646564656465646') },
  drive: { kick: rhy('x.x.x.x.x.x.x.x.'), snare: rhy('....x.......x..x'), hat: rhy('5444544454445444') }
};

const TRACKS = {
  title: {
    bpm: 92, swing: 0.10, key: 0, verb: 0.42, gain: 0.95,
    intro: ['pad'],
    loop: ['A', 'B', 'A', 'C'],
    sections: {
      pad: { chords: ['a2:min', 'f2:maj'], lead: [null, null], drums: 'none', bassRhy: 'whole', pad: 1.0, arp: 0 },
      A: { chords: ['a2:min', 'f2:maj', 'c3:maj', 'g2:maj'],
           lead: [pat('a4 . . . . . . . c5 . . . . . . .'), pat('e5 . . . . . . . - . . . . . . .'),
                  pat('f5 . . . . . . . e5 . . . . . . .'), pat('c5 . . . . . . . - . . . . . . .')],
           drums: 'soft', bassRhy: 'whole', pad: 1.0, arp: 0.5, leadVoice: 'bell' },
      B: { chords: ['d3:min', 'a2:min', 'f2:maj', 'g2:maj'],
           lead: [pat('d5 . . . . . . . f5 . . . . . . .'), pat('e5 . . . . . . . - . . . . . . .'),
                  pat('c5 . . . . . . . d5 . . . . . . .'), pat('b4 . . . . . . . - . . . . . . .')],
           drums: 'soft', bassRhy: 'half', pad: 0.9, arp: 0.7, leadVoice: 'bell' },
      C: { chords: ['f2:maj', 'g2:maj', 'a2:min', 'e2:dom7'],
           lead: [pat('a5 . . . g5 . . . f5 . . . e5 . . .'), pat('g5 . . . . . . . d5 . . . . . . .'),
                  pat('a4 . . . c5 . e5 . a5 . - . - . . .'), pat('gs5 . . . . . . . b4 . . . . . . .')],
           drums: 'half', bassRhy: 'half', pad: 0.8, arp: 0.9, leadVoice: 'bell' }
    }
  },

  battle: {
    bpm: 152, swing: 0.0, key: 0, verb: 0.24, gain: 1.0,
    intro: ['intro'],
    loop: ['A', 'A2', 'B', 'C'],
    sections: {
      intro: { chords: ['a2:min', 'e2:dom7'], lead: [null, null], drums: 'half', bassRhy: 'eighth', pad: 0.7, arp: 0.4 },
      A:  { chords: ['a2:min', 'f2:maj', 'c3:maj', 'g2:maj'], tense: ['a2:min', 'f2:maj', 'b2:dim', 'e2:b9'],
            lead: HOOK_A, drums: 'main', bassRhy: 'eighth', pad: 0.6, arp: 0.7, leadVoice: 'saw' },
      A2: { chords: ['a2:min', 'f2:maj', 'c3:maj', 'e2:dom7'], tense: ['a2:min', 'f2:dim', 'c3:aug', 'e2:b9'],
            lead: HOOK_A2, drums: 'main', bassRhy: 'eighth', pad: 0.6, arp: 0.8, leadVoice: 'saw' },
      B:  { chords: ['d3:min', 'a2:min', 'b2:dim', 'e2:dom7'], tense: ['d3:dim', 'a2:min', 'b2:dim7', 'e2:b9'],
            lead: HOOK_B, drums: 'big', bassRhy: 'drive', pad: 0.5, arp: 0.8, leadVoice: 'saw' },
      C:  { chords: ['f2:maj', 'g2:maj', 'a2:min', 'a2:min'], tense: ['f2:maj', 'g2:dim', 'a2:min', 'e2:b9'],
            lead: HOOK_C, drums: 'big', bassRhy: 'drive', pad: 0.4, arp: 1.0, leadVoice: 'saw', crash: true }
    }
  },

  laststand: {
    bpm: 170, swing: 0.0, key: 0, verb: 0.28, gain: 1.05,
    intro: [],
    loop: ['A', 'B', 'A', 'C'],
    sections: {
      A: { chords: ['a2:min', 'b2:dim', 'e2:dom7', 'a2:min'], tense: ['a2:min', 'b2:dim7', 'e2:b9', 'a2:min'],
           lead: [pat('a5 . . . c6 . b5 . a5 . - . gs5 . e5 .'), pat('f5 . . . d5 . f5 . b5 . - . . . . .'),
                  pat('gs5 . . . b5 . d6 . e6 . - . d6 . b5 .'), pat('a5 . - . e5 . c5 . a4 . - . . . gs4 .')],
           drums: 'drive', bassRhy: 'drive', pad: 0.55, arp: 1.0, leadVoice: 'saw', crash: true, choir: 1 },
      B: { chords: ['f2:maj', 'g2:maj', 'e2:dom7', 'e2:dom7'], tense: ['f2:maj', 'g2:dim', 'e2:b9', 'e2:b9'],
           lead: [pat('f5 . . . a5 . c6 . f6 . - . e6 . c6 .'), pat('g5 . . . b5 . d6 . g6 . - . f6 . d6 .'),
                  pat('e6 . . . d6 . b5 . gs5 . - . b5 . d6 .'), pat('e6 . - . - . . . . . . . b5 . d6 .')],
           drums: 'big', bassRhy: 'drive', pad: 0.5, arp: 1.0, leadVoice: 'saw', choir: 1 },
      C: { chords: ['d3:min', 'a2:min', 'f2:maj', 'e2:dom7'], tense: ['d3:dim', 'a2:min', 'f2:dim', 'e2:b9'],
           lead: [pat('d6 . . . a5 . f5 . d5 . - . e5 . f5 .'), pat('a5 . . . e5 . c5 . a4 . - . b4 . c5 .'),
                  pat('f5 . . . a5 . c6 . f6 . - . - . e6 .'), pat('e6 . . . b5 . gs5 . e5 . - . - . . .')],
           drums: 'drive', bassRhy: 'drive', pad: 0.45, arp: 1.0, leadVoice: 'saw', crash: true, choir: 1 }
    }
  },

  victory: {
    bpm: 138, swing: 0.0, key: 0, verb: 0.34, gain: 1.0,
    intro: ['fan'],
    loop: ['A', 'B'],
    sections: {
      fan: { chords: ['c3:maj', 'g2:dom7'],
             lead: [pat('g4 . g4 . g4 . . . c5 . . . - . . .'), pat('e5 . . . g5 . . . c6 . - . - . . .')],
             drums: 'half', bassRhy: 'half', pad: 0.8, arp: 0.4, leadVoice: 'brass', crash: true },
      A: { chords: ['c3:maj', 'f3:maj', 'g2:dom7', 'c3:maj'],
           lead: [pat('c5 . . . e5 . g5 . c6 . - . b5 . g5 .'), pat('a5 . . . g5 . . . e5 . - . - . . .'),
                  pat('d5 . . . g5 . b5 . d6 . - . e6 . d6 .'), pat('c6 . . . - . . . g5 . e5 . c5 . . .')],
           drums: 'main', bassRhy: 'eighth', pad: 0.7, arp: 0.8, leadVoice: 'brass' },
      B: { chords: ['a2:min', 'f3:maj', 'c3:maj', 'g2:dom7'],
           lead: [pat('a5 . . . c6 . e6 . a5 . - . g5 . e5 .'), pat('f5 . . . a5 . c6 . f6 . - . . . . .'),
                  pat('e6 . . . c6 . g5 . e5 . - . d5 . e5 .'), pat('g5 . . . b5 . d6 . g6 . - . - . . .')],
           drums: 'big', bassRhy: 'eighth', pad: 0.6, arp: 0.9, leadVoice: 'brass', crash: true }
    }
  },

  defeat: {
    bpm: 68, swing: 0.16, key: 0, verb: 0.55, gain: 0.9,
    intro: [],
    loop: ['A', 'B'],
    sections: {
      A: { chords: ['a2:min', 'g2:maj', 'f2:maj', 'e2:dom7'],
           lead: [pat('a4 . . . . . . . . . . . g4 . . .'), pat('e4 . . . . . . . . . . . d4 . . .'),
                  pat('c5 . . . . . . . . . . . b4 . . .'), pat('a4 . . . . . . . gs4 . . . - . . .')],
           drums: 'none', bassRhy: 'whole', pad: 1.0, arp: 0, leadVoice: 'bell' },
      B: { chords: ['f2:maj', 'c3:maj', 'd3:min', 'e2:dom7'],
           lead: [pat('f4 . . . . . . . a4 . . . . . . .'), pat('g4 . . . . . . . - . . . . . . .'),
                  pat('f4 . . . . . . . d4 . . . . . . .'), pat('e4 . . . . . . . - . . . . . . .')],
           drums: 'none', bassRhy: 'whole', pad: 1.0, arp: 0.25, leadVoice: 'bell' }
    }
  }
};

// Precompute the bar -> section map once per track definition.
function barMaps(T) {
  if (T._maps) return T._maps;
  const build = (names) => {
    const out = [];
    for (const n of names) {
      const s = T.sections[n];
      for (let i = 0; i < s.chords.length; i++) out.push({ s, i, name: n });
    }
    return out;
  };
  T._maps = { intro: build(T.intro), loop: build(T.loop) };
  return T._maps;
}

/* ==================================================================== */
/* 5. Audio                                                              */
/* ==================================================================== */

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterVol = 0.7;
    this.musicVol = 0.35;
    this.sfxVol = 0.8;
    this.started = false;
    this._offline = false;
    this._realtime = true;

    this._tracks = [];          // live music tracks (2 during a crossfade)
    this._pump = null;          // scheduler interval id
    this._intensity = 0.5;      // smoothed
    this._intensityTarget = 0.5;
    this._track = null;         // name of the incoming/current track
    this._afterTimer = null;

    this._live = new Set();     // voices that have not yet cleaned up
    this._liveSfx = 0;          // of those, how many are on the SFX bus
    this._created = 0;          // total nodes created since boot
    this._cryCache = new Map();
    this._cryIndex = null;      // cry-block object -> FighterDef
    this._recent = new Map();   // sfx key -> {t, n} for repeat variation
    this._rng = mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
    this._voiceBudget = 96;     // hard cap on simultaneous SFX voices
  }

  /* ---------------- setup ---------------- */

  /** `init()` makes a real context; `init(offlineCtx)` builds the same graph
   *  on a supplied context, which is how the measurement harness works. */
  init(existing) {
    if (this.ctx && !existing) return this.ctx;
    if (existing) { this.ctx = existing; this._offline = true; this._realtime = false; }
    else {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC({ latencyHint: 'interactive' });
    }
    const ctx = this.ctx;

    // ---- bus structure ----------------------------------------------
    //  voices -> (sfxSum | musicSum | cryBus) -> trims -> master
    //  master -> mute -> limiter -> destination
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -1.6; this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20; this.limiter.attack.value = 0.001; this.limiter.release.value = 0.09;
    this.limiter.connect(ctx.destination);

    this.muteGain = ctx.createGain();
    this.muteGain.gain.value = this.muted ? 0 : 1;
    this.muteGain.connect(this.limiter);

    this.master = ctx.createGain();
    this.master.gain.value = this.masterVol;
    this.master.connect(this.muteGain);

    // SFX bus with its own glue compressor so six hits on one frame stay level.
    this.sfxComp = ctx.createDynamicsCompressor();
    this.sfxComp.threshold.value = -17; this.sfxComp.knee.value = 8;
    this.sfxComp.ratio.value = 3.2; this.sfxComp.attack.value = 0.004; this.sfxComp.release.value = 0.16;
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = this.sfxVol;
    // 0.8, not 0.9. Lifting the combat layer put enough into the bus that a busy
    // turn was riding the master limiter constantly; a dB back here costs
    // nothing audible and means the limiter is catching peaks rather than
    // holding the whole passage down. (The peak level itself barely moves —
    // that is set by the limiter's -1.6 dB threshold, not by this gain.)
    this.sfxSum = ctx.createGain(); this.sfxSum.gain.value = 0.8;
    this.sfxSum.connect(this.sfxComp).connect(this.sfxBus).connect(this.master);

    // Music bus with a duck stage that big impacts pull down.
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = this.musicVol;
    this.musicDuck = ctx.createGain(); this.musicDuck.gain.value = 1;
    this.musicSum = ctx.createGain(); this.musicSum.gain.value = 0.85;
    this.musicSum.connect(this.musicDuck).connect(this.musicBus).connect(this.master);

    // Arena reverb, fed from both buses.
    this.verb = ctx.createConvolver();
    this.verb.buffer = this._impulse(1.9, 2.9);
    this.verbGain = ctx.createGain(); this.verbGain.gain.value = 0.30;
    this.verbTilt = ctx.createBiquadFilter();
    this.verbTilt.type = 'highpass'; this.verbTilt.frequency.value = 180;
    this.verb.connect(this.verbTilt).connect(this.verbGain).connect(this.master);

    // Tempo-agnostic echo for the lead line.
    this.mDelay = ctx.createDelay(1.2);
    this.mDelay.delayTime.value = 0.26;
    this.mFb = ctx.createGain(); this.mFb.gain.value = 0.30;
    this.mDelayLp = ctx.createBiquadFilter();
    this.mDelayLp.type = 'lowpass'; this.mDelayLp.frequency.value = 2600;
    this.mDelay.connect(this.mDelayLp).connect(this.mFb).connect(this.mDelay);
    this.mDelayLp.connect(this.musicSum);

    this.drive = ctx.createWaveShaper();
    this.drive.curve = makeDriveCurve(2.4);

    // Pre-rolled noise so voices never allocate a buffer at play time.
    this._noiseBufs = [this._noise(2.0, 'white'), this._noise(2.0, 'pink'), this._noise(2.0, 'brown')];
    return ctx;
  }

  resume() {
    this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
    this.started = true;
    if (this._tracks.length && !this._pump) this._startPump();
    return this.ctx;
  }

  setMuted(m) {
    this.muted = !!m;
    if (!this.ctx) return;
    const g = this.muteGain.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
  }
  setMaster(v) { this.masterVol = clamp(v, 0, 1); if (this.master) this._set(this.master.gain, this.masterVol); }
  setMusicVol(v) { this.musicVol = clamp(v, 0, 1); if (this.musicBus) this._set(this.musicBus.gain, this.musicVol); }
  setSfxVol(v) { this.sfxVol = clamp(v, 0, 1); if (this.sfxBus) this._set(this.sfxBus.gain, this.sfxVol); }
  /** Deterministic variation, for reproducible measurement. */
  setSeed(n) { this._rng = mulberry32(n >>> 0); }

  stats() {
    return {
      live: this._live.size, created: this._created,
      state: this.ctx?.state ?? 'none', track: this._track,
      intensity: this._intensity, tracks: this._tracks.map((t) => t.name)
    };
  }
  get liveVoices() { return this._live.size; }

  _set(param, v) {
    if (!this.ctx) { param.value = v; return; }
    const t = this.ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setTargetAtTime(v, t, 0.012);
  }
  // `_delayOff` is added here rather than threaded through every call because
  // registry entries write their own `_v({...})` argument lists and mostly do not
  // forward `o.delay` — measured: `sfx(k, {delay:1.0})`, `{at:1.0}` and
  // `{when:...}` all started the cue at 0.0120s. Both callers of `_now()` are
  // voice starts, and `_impact`/`_slash`/`_grains` all funnel through them, so
  // one offset here reaches everything.
  _now() { return this.ctx.currentTime + (this._offline ? 0 : 0.006) + (this._delayOff || 0); }
  _rand() { return this._rng(); }
  _rr(a, b) { return a + (b - a) * this._rng(); }

  /* ---------------- buffers ---------------- */

  _noise(seconds, kind) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    if (kind === 'brown') {
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
    } else if (kind === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.0990460;
        b1 = 0.96300 * b1 + w * 0.2965164;
        b2 = 0.57000 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.32;
      }
    } else {
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  /** Arena IR: a handful of early reflections plus a lowpassed exponential tail. */
  _impulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    const taps = [0.011, 0.019, 0.031, 0.047, 0.062, 0.083, 0.101];
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const u = i / len;
        const env = Math.pow(1 - u, decay);
        const w = (Math.random() * 2 - 1) * env;
        lp += (w - lp) * (0.55 - 0.4 * u);       // highs die first, as in a real hall
        d[i] = lp * 0.9;
      }
      // predelay + discrete early reflections give the arena a size
      for (let k = 0; k < taps.length; k++) {
        const idx = Math.floor((taps[k] + (ch ? 0.004 : 0)) * rate);
        if (idx < len) d[idx] += (k % 2 ? -1 : 1) * (0.55 / (k + 1));
      }
      for (let i = 0; i < Math.floor(0.008 * rate); i++) d[i] *= i / (0.008 * rate);
    }
    return buf;
  }

  _noiseSrc(t0, dur, kind = 0) {
    const buf = this._noiseBufs[kind % this._noiseBufs.length];
    const src = this.ctx.createBufferSource();
    src.buffer = buf; this._created++;
    const bl = buf.duration;
    if (dur + 0.03 >= bl) { src.loop = true; src.start(t0, this._rand() * bl); }
    else src.start(t0, this._rand() * (bl - dur - 0.03));
    src.stop(t0 + dur + 0.03);
    return src;
  }

  /* ---------------- the voice engine ---------------- */

  /**
   * One flexible voice: source -> [fm] -> [filter] -> [drive] -> env -> pan -> bus,
   * with an optional reverb send. Everything in the library is built from this.
   */
  _v(o = {}) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return null;
    // Only SFX compete for the polyphony budget; the score is bounded by design.
    const isSfx = !o.out;
    if (isSfx && this._liveSfx >= this._voiceBudget && !o.critical) return null;

    const t0 = o.at != null ? o.at : this._now() + (o.delay || 0);
    const dur = Math.max(0.008, o.dur ?? 0.2);
    const gain = (o.gain ?? 0.2) * (o.gainMul ?? 1) * (isSfx ? (this._lift ?? 1) : 1);
    if (gain <= 0.0002) return null;
    const nodes = [];
    const N = (n) => { this._created++; nodes.push(n); return n; };

    let src, head;
    if (o.wave === 'noise') {
      src = this._noiseSrc(t0, dur, o.nkind ?? 0);
      nodes.push(src);
      head = src;
    } else {
      src = N(ctx.createOscillator());
      src.type = o.wave || 'sine';
      const f = src.frequency;
      const f0 = Math.max(6, o.f0 ?? 220);
      f.setValueAtTime(f0, t0);
      const mid = o.fmid ?? 0.32;
      if (o.f1 != null) f.exponentialRampToValueAtTime(Math.max(6, o.f1), t0 + dur * mid);
      if (o.f2 != null) f.exponentialRampToValueAtTime(Math.max(6, o.f2), t0 + dur);
      if (o.detune) src.detune.setValueAtTime(o.detune, t0);
      src.start(t0); src.stop(t0 + dur + 0.05);
      head = src;

      if (o.fm) {                                   // metallic / bell timbres
        const m = N(ctx.createOscillator());
        m.type = 'sine'; m.frequency.setValueAtTime(f0 * o.fm.ratio, t0);
        const mg = N(ctx.createGain());
        mg.gain.setValueAtTime(f0 * o.fm.index, t0);
        mg.gain.exponentialRampToValueAtTime(Math.max(0.5, f0 * o.fm.index * 0.02), t0 + dur * (o.fm.decay ?? 0.5));
        m.connect(mg).connect(src.frequency);
        m.start(t0); m.stop(t0 + dur + 0.05);
      }
      if (o.ring) {                                 // ring modulation for MIND/warble
        const rg = N(ctx.createGain());
        rg.gain.value = 0;
        const r = N(ctx.createOscillator());
        r.type = 'sine'; r.frequency.setValueAtTime(o.ring, t0);
        r.connect(rg.gain);
        head.connect(rg);
        head = rg;
        r.start(t0); r.stop(t0 + dur + 0.05);
      }
    }

    if (o.filt) {
      const bq = N(ctx.createBiquadFilter());
      bq.type = o.filt;
      bq.Q.setValueAtTime(o.q ?? 1, t0);
      const a0 = Math.max(20, o.ff0 ?? 2000);
      bq.frequency.setValueAtTime(a0, t0);
      if (o.ff1 != null) bq.frequency.exponentialRampToValueAtTime(Math.max(20, o.ff1), t0 + dur * (o.ffmid ?? 1));
      head.connect(bq); head = bq;
    }

    if (o.drive) {
      const ws = N(ctx.createWaveShaper());
      ws.curve = makeDriveCurve(1 + o.drive * 8);
      const pre = N(ctx.createGain()); pre.gain.value = 1 + o.drive * 2;
      const post = N(ctx.createGain()); post.gain.value = 1 / (1 + o.drive * 1.4);
      head.connect(pre).connect(ws).connect(post); head = post;
    }

    const g = N(ctx.createGain());
    const a = Math.min(o.a ?? 0.004, dur * 0.8);
    const hEnd = Math.min(dur * 0.92, a + (o.hold || 0));
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + a);
    if (o.hold && hEnd > a) g.gain.setValueAtTime(gain, t0 + hEnd);
    if (o.shape === 'lin') g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    else g.gain.exponentialRampToValueAtTime(Math.max(0.00005, gain * 0.0006), t0 + dur);
    g.gain.setValueAtTime(0, t0 + dur + 0.004);
    head.connect(g);

    let tail = g;
    const pan = clamp(o.pan ?? 0, -1, 1);
    if (pan !== 0 && ctx.createStereoPanner) {
      const p = N(ctx.createStereoPanner());
      p.pan.setValueAtTime(pan, t0);
      g.connect(p); tail = p;
    }

    const out = o.out || this.sfxSum;
    tail.connect(out);
    const send = o.send ?? 0.18;
    if (send > 0 && this.verb) {
      const s = N(ctx.createGain()); s.gain.value = send;
      tail.connect(s).connect(this.verb);
    }
    if (o.echo && this.mDelay) {
      const e = N(ctx.createGain()); e.gain.value = o.echo;
      tail.connect(e).connect(this.mDelay);
    }

    this._reg(nodes, src, o.owner, isSfx);
    return g;
  }

  /** Convenience wrapper: noise-source voice. */
  _noiseV(o) { return this._v({ ...o, wave: 'noise' }); }

  _reg(nodes, src, owner, isSfx) {
    const rec = { nodes, dead: false };
    this._live.add(rec);
    if (isSfx) this._liveSfx++;
    if (owner) owner.add(src);
    const kill = () => {
      if (rec.dead) return; rec.dead = true;
      for (const n of nodes) { try { n.disconnect(); } catch { /* already gone */ } }
      nodes.length = 0;
      this._live.delete(rec);
      if (isSfx) this._liveSfx--;
      if (owner) owner.delete(src);
    };
    src.onended = kill;
    return rec;
  }

  /* ---------------- generators ---------------- */

  /**
   * The impact engine. transient + sub you feel + a mid band that names the
   * element + a tail that sits in the arena. `w` is 0..1 weight.
   */
  _impact(o = {}) {
    const w = clamp(o.w ?? 0.5, 0, 1.2);
    const T = TINT[o.tint] || TINT.NEUTRAL;
    const pan = o.pan ?? 0;
    const pitch = o.pitch ?? 1;
    const G = (o.gain ?? 1) * (0.55 + 0.55 * w);
    const d = o.delay || 0;
    const body = lerp(0.11, 0.42, w);

    // 1. transient — the snap that makes it read as a hit
    this._noiseV({
      dur: lerp(0.028, 0.055, w), gain: 0.30 * G * lerp(1.1, 0.85, T.bright),
      filt: 'highpass', ff0: lerp(1400, 4200, T.bright), a: 0.0004, delay: d,
      send: T.verb * 0.5, pan, nkind: 0, drive: 0.25 + w * 0.35, critical: true
    });
    this._v({
      wave: 'triangle', f0: lerp(900, 380, w) * pitch, f2: lerp(300, 110, w) * pitch,
      dur: lerp(0.03, 0.07, w), a: 0.0004, gain: 0.24 * G, delay: d, send: 0.08, pan, critical: true
    });

    // 2. sub — the weight
    const subF = lerp(150, 74, w) * T.subF * pitch;
    this._v({
      wave: 'sine', f0: subF * 2.1, f1: subF, f2: subF * 0.42,
      dur: lerp(0.16, 0.62, w) * T.tail, a: 0.0012, gain: 0.46 * G * T.sub, fmid: 0.10,
      delay: d, send: T.verb * 0.4, pan: pan * 0.35, critical: true
    });

    // 3. mid crack — the element's fingerprint
    this._noiseV({
      dur: body * T.tail, gain: 0.26 * G, filt: 'bandpass',
      ff0: T.band * pitch, ff1: T.band * T.sweep * pitch, q: T.bq,
      a: 0.0016, delay: d, send: T.verb, pan, nkind: T.bright > 0.6 ? 0 : 1
    });

    // 4. harmonic body — waveform carries the type as much as the filter does
    const tf = T.band * 0.28 * pitch;
    if (T.tone === 'fm') {
      this._v({ wave: 'sine', f0: tf, f2: tf * 0.7, dur: body * 1.5, a: 0.001, gain: 0.20 * G * T.toneMix,
                fm: { ratio: 2.76, index: 5.4, decay: 0.35 }, delay: d, send: T.verb, pan });
    } else if (T.tone === 'ring') {
      this._v({ wave: 'sine', f0: tf, f2: tf * 0.8, dur: body * 1.6, a: 0.004, gain: 0.22 * G * T.toneMix,
                ring: tf * 0.61, delay: d, send: T.verb, pan });
    } else {
      this._v({ wave: T.tone === 'saw' ? 'sawtooth' : T.tone === 'square' ? 'square' : T.tone === 'tri' ? 'triangle' : 'sine',
                f0: tf, f1: tf * 0.6, f2: tf * 0.3, dur: body * 1.3, a: 0.0018, gain: 0.24 * G * T.toneMix,
                filt: 'lowpass', ff0: T.band * 2.4, ff1: T.band * 0.6, drive: w * 0.4,
                delay: d, send: T.verb, pan });
    }

    // 5. element signature
    this._tintExtra(T.extra, { w, pan, pitch, G, delay: d, T });

    // 6. tail — debris and a distant slap for the big ones
    if (w > 0.55) {
      this._noiseV({ dur: lerp(0.35, 1.1, w), gain: 0.10 * G, filt: 'lowpass',
                     ff0: lerp(1200, 600, w), ff1: 140, q: 0.7, a: 0.02, delay: d + 0.05,
                     send: 0.55, pan: -pan * 0.5, nkind: 2 });
      this._duck(0.10 + 0.26 * w, 0.25 + 0.5 * w);
    }
  }

  _tintExtra(kind, c) {
    const { w, pan, pitch, G, delay: d } = c;
    switch (kind) {
      case 'crackle': this._crackle({ n: 5 + Math.round(w * 9), dur: 0.30 + w * 0.5, gain: 0.09 * G, pan, delay: d + 0.01 }); break;
      case 'shatter': this._shatter({ n: 4 + Math.round(w * 6), f: 2900 * pitch, dur: 0.35 + w * 0.35, gain: 0.075 * G, pan, delay: d }); break;
      case 'bubble':  this._bubbles({ n: 3 + Math.round(w * 4), dur: 0.3 + w * 0.3, gain: 0.055 * G, pan, delay: d + 0.02 }); break;
      case 'zap':     this._zap({ f: 2400 * pitch, dur: 0.10 + w * 0.08, gain: 0.13 * G, pan, delay: d }); break;
      case 'rubble':  this._grains({ n: 5 + Math.round(w * 8), dur: 0.5 + w * 0.7, f: 620, gain: 0.06 * G, pan, delay: d + 0.04 }); break;
      case 'gust':    this._noiseV({ dur: 0.28 + w * 0.3, gain: 0.12 * G, filt: 'bandpass', ff0: 3200 * pitch, ff1: 900, q: 2.6, a: 0.03, delay: d, send: 0.3, pan: -pan }); break;
      case 'swell':   this._v({ wave: 'sawtooth', f0: 150 * pitch, f2: 60, dur: 0.55 + w * 0.4, a: 0.22, gain: 0.12 * G, filt: 'lowpass', ff0: 900, ff1: 260, delay: d, send: 0.5, pan: -pan }); break;
      case 'shimmer': this._bellCluster({ f: 2400 * pitch, n: 4, dur: 0.5 + w * 0.4, gain: 0.045 * G, pan, delay: d + 0.01 }); break;
      case 'growl':   this._v({ wave: 'sawtooth', f0: 132 * pitch, f1: 108, f2: 76, dur: 0.28 + w * 0.35, a: 0.012, gain: 0.14 * G, filt: 'lowpass', ff0: 1400, ff1: 500, q: 2, ring: 34, drive: 0.4, delay: d, send: 0.28, pan }); break;
      case 'servo':   this._v({ wave: 'sawtooth', f0: 380 * pitch, f1: 900, f2: 420, dur: 0.3 + w * 0.25, a: 0.01, gain: 0.06 * G, filt: 'bandpass', ff0: 2400, q: 5, delay: d + 0.03, send: 0.2, pan: -pan }); break;
      case 'warble':  this._v({ wave: 'sine', f0: 760 * pitch, f1: 900, f2: 620, dur: 0.4 + w * 0.3, a: 0.02, gain: 0.08 * G, ring: 47, delay: d, send: 0.45, pan: -pan }); break;
      case 'splat':   this._v({ wave: 'sine', f0: 240 * pitch, f1: 140, f2: 70, dur: 0.22, a: 0.003, gain: 0.13 * G, delay: d, send: 0.2, pan });
                      this._bubbles({ n: 3, dur: 0.3, gain: 0.045 * G, pan, delay: d + 0.05, low: true }); break;
      case 'sweep':   this._v({ wave: 'square', f0: 520 * pitch, f1: 1500, f2: 380, dur: 0.35 + w * 0.3, a: 0.008, gain: 0.07 * G, filt: 'bandpass', ff0: 1600, ff1: 3200, q: 7, delay: d, send: 0.4, pan: -pan }); break;
      case 'airy':    this._noiseV({ dur: 0.6 + w * 0.5, gain: 0.05 * G, filt: 'bandpass', ff0: 3400, ff1: 1800, q: 1.4, a: 0.15, shape: 'lin', delay: d, send: 0.6, pan: -pan }); break;
      case 'collapse':this._v({ wave: 'sine', f0: 190 * pitch, f2: 21, dur: 0.9 + w * 0.6, a: 0.06, gain: 0.20 * G, delay: d, send: 0.35, pan: 0 }); break;
      case 'press':   this._v({ wave: 'sine', f0: 46, dur: 0.7 + w * 0.5, a: 0.05, gain: 0.22 * G, delay: d, send: 0.25, pan: 0 }); break;
      case 'slap':    this._noiseV({ dur: 0.07, gain: 0.16 * G, filt: 'bandpass', ff0: 1300 * pitch, ff1: 700, q: 1.6, a: 0.0008, delay: d, send: 0.18, pan }); break;
      case 'ring':    this._v({ wave: 'sine', f0: 3200 * pitch, f2: 2600 * pitch, dur: 0.25 + w * 0.3, a: 0.001, gain: 0.05 * G, delay: d, send: 0.45, pan }); break;
      default: break;
    }
  }

  /** Bladed sounds: a fast bandpass sweep with almost no body. */
  _slash(o = {}) {
    const w = clamp(o.w ?? 0.4, 0, 1.2);
    const pan = o.pan ?? 0, pitch = o.pitch ?? 1, d = o.delay || 0;
    const G = (o.gain ?? 1) * (0.6 + 0.5 * w);
    const air = o.air ?? 1;
    this._noiseV({
      dur: lerp(0.08, 0.26, w) * air, gain: 0.30 * G, filt: 'bandpass',
      ff0: lerp(4200, 7600, w) * pitch, ff1: lerp(1800, 700, w) * pitch,
      q: lerp(2.8, 1.5, w), a: 0.0015, delay: d, send: 0.30, pan, nkind: 0
    });
    this._v({
      wave: 'sawtooth', f0: lerp(1600, 2600, w) * pitch, f2: lerp(420, 180, w) * pitch,
      dur: lerp(0.07, 0.2, w), a: 0.0008, gain: 0.10 * G, filt: 'highpass', ff0: 700,
      delay: d, send: 0.28, pan
    });
    if (w > 0.3) this._v({ wave: 'sine', f0: 190 * pitch, f2: lerp(90, 44, w), dur: lerp(0.14, 0.4, w), a: 0.001, gain: 0.24 * G * w, delay: d, send: 0.2, pan: pan * 0.4 });
    if (w > 0.6) this._v({ wave: 'sine', f0: 4600 * pitch, f2: 3400 * pitch, dur: 0.3, a: 0.001, gain: 0.05 * G, delay: d, send: 0.5, pan });
  }

  _crackle(o) {
    const n = o.n ?? 8;
    for (let i = 0; i < n; i++) {
      this._noiseV({
        dur: this._rr(0.012, 0.035), gain: (o.gain ?? 0.08) * this._rr(0.5, 1.3),
        filt: 'bandpass', ff0: this._rr(1200, 4200), q: this._rr(3, 9), a: 0.0006,
        delay: (o.delay || 0) + Math.pow(this._rand(), 1.4) * (o.dur ?? 0.4),
        send: 0.3, pan: clamp((o.pan ?? 0) + this._rr(-0.3, 0.3), -1, 1)
      });
    }
  }
  _shatter(o) {
    const n = o.n ?? 6;
    for (let i = 0; i < n; i++) {
      const f = (o.f ?? 2800) * this._rr(0.7, 2.3);
      this._v({
        wave: 'triangle', f0: f, f2: f * this._rr(0.72, 0.94),
        dur: this._rr(0.09, 0.3) * (o.dur ? o.dur / 0.4 : 1), a: 0.0008,
        gain: (o.gain ?? 0.09) * this._rr(0.6, 1.2),
        delay: (o.delay || 0) + this._rand() * (o.dur ?? 0.4) * (o.spread ?? 0.55),
        send: 0.42, pan: clamp((o.pan ?? 0) + this._rr(-0.35, 0.35), -1, 1)
      });
    }
  }
  _bubbles(o) {
    const n = o.n ?? 5;
    for (let i = 0; i < n; i++) {
      const f = (o.low ? 90 : 260) * this._rr(0.8, 2.6);
      this._v({
        wave: 'sine', f0: f, f2: f * this._rr(1.8, 3.4), dur: this._rr(0.05, 0.13),
        a: 0.002, gain: (o.gain ?? 0.06) * this._rr(0.6, 1.3),
        delay: (o.delay || 0) + this._rand() * (o.dur ?? 0.4),
        send: 0.35, pan: clamp((o.pan ?? 0) + this._rr(-0.35, 0.35), -1, 1)
      });
    }
  }
  _grains(o) {
    const n = o.n ?? 8;
    for (let i = 0; i < n; i++) {
      this._noiseV({
        dur: this._rr(0.03, 0.09), gain: (o.gain ?? 0.07) * this._rr(0.5, 1.3),
        filt: o.hp ? 'highpass' : 'bandpass', ff0: (o.f ?? 700) * this._rr(0.6, 1.9),
        q: this._rr(1, 3), a: 0.001, nkind: 1,
        delay: (o.delay || 0) + Math.pow(this._rand(), 1.2) * (o.dur ?? 0.6),
        send: 0.35, pan: clamp((o.pan ?? 0) + this._rr(-0.45, 0.45), -1, 1)
      });
    }
  }
  _bellCluster(o) {
    const ratios = o.ratios || [1, 2.01, 3.02, 4.36, 5.43];
    for (let i = 0; i < (o.n ?? 4); i++) {
      const r = ratios[i % ratios.length];
      this._v({
        wave: 'sine', f0: (o.f ?? 900) * r, dur: (o.dur ?? 0.7) * (1 - i * 0.11),
        a: 0.002, gain: (o.gain ?? 0.06) / (1 + i * 0.4), detune: o.detune ? this._rr(-o.detune, o.detune) : 0,
        delay: (o.delay || 0) + i * 0.012, send: 0.45,
        pan: clamp((o.pan ?? 0) + (i % 2 ? 0.18 : -0.18), -1, 1)
      });
    }
  }
  _metalClang(o) {
    const f = o.f ?? 600;
    const ratios = [1, 2.76, 5.40, 8.93];
    ratios.forEach((r, i) => this._v({
      wave: 'sine', f0: f * r, f2: f * r * 0.985, dur: (o.dur ?? 0.6) * (1 - i * 0.16),
      a: 0.0008, gain: (o.gain ?? 0.10) / (1 + i * 0.7), delay: (o.delay || 0),
      send: 0.4, pan: clamp((o.pan ?? 0) + (i % 2 ? 0.12 : -0.12), -1, 1)
    }));
    this._noiseV({ dur: 0.03, gain: (o.gain ?? 0.10) * 1.1, filt: 'highpass', ff0: 3000, a: 0.0004, delay: o.delay || 0, send: 0.2, pan: o.pan ?? 0 });
  }
  _zap(o) {
    const f = o.f ?? 2200;
    this._v({ wave: 'square', f0: f, f1: f * 0.4, f2: f * 0.12, dur: o.dur ?? 0.14, a: 0.0004,
              gain: (o.gain ?? 0.14), filt: 'highpass', ff0: 900, drive: 0.5,
              delay: o.delay || 0, send: 0.3, pan: o.pan ?? 0 });
    this._noiseV({ dur: (o.dur ?? 0.14) * 0.6, gain: (o.gain ?? 0.14) * 0.7, filt: 'highpass',
                   ff0: 5000, a: 0.0004, delay: o.delay || 0, send: 0.25, pan: o.pan ?? 0 });
  }
  _rumble(o) {
    this._noiseV({ dur: o.dur ?? 1.5, gain: o.gain ?? 0.25, filt: 'lowpass',
                   ff0: (o.f ?? 60) * 3, ff1: (o.f ?? 60) * 0.8, q: 1.2, a: 0.08, shape: 'lin',
                   nkind: 2, delay: o.delay || 0, send: 0.3, pan: o.pan ?? 0, critical: true });
    this._v({ wave: 'sine', f0: (o.f ?? 60), f2: (o.f ?? 60) * 0.55, dur: o.dur ?? 1.5,
              a: 0.05, gain: (o.gain ?? 0.25) * 0.8, delay: o.delay || 0, send: 0.2, pan: 0, critical: true });
  }

  /** Push the music down under a big hit, then let it back up. */
  _duck(amount = 0.25, len = 0.4) {
    if (!this.ctx || !this.musicDuck || !this._tracks.length) return;
    const g = this.musicDuck.gain;
    // `_now()`, not `ctx.currentTime`. Offline, currentTime stays at 0 for the
    // whole scheduling pass, so every duck was being written at t=0 and had
    // recovered long before the cue it was supposed to be ducking for actually
    // played — which is why it measured as no ducking at all. Live it was merely
    // early by the cue's own delay; offline it was inert.
    const t = this._now();
    const target = clamp(1 - amount, 0.15, 1);
    if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
    g.setValueAtTime(Math.min(g.value, 1), t);
    g.linearRampToValueAtTime(target, t + 0.02);
    g.setValueAtTime(target, t + 0.02 + len * 0.25);
    g.setTargetAtTime(1, t + 0.02 + len * 0.25, len * 0.35);
  }

  
/** Legacy primitives, kept so nothing that used them breaks. */
  tone(o = {}) {
    return this._v({ wave: o.type || 'sine', f0: o.freq ?? 440, f2: o.slideTo ?? null,
                     dur: o.dur ?? 0.2, gain: o.gain ?? 0.3, a: o.attack ?? 0.005,
                     detune: o.detune ?? 0, send: o.send ?? 0.2, delay: o.delay ?? 0, pan: o.pan ?? 0 });
  }
  noise(o = {}) {
    return this._noiseV({ dur: o.dur ?? 0.2, gain: o.gain ?? 0.3, filt: o.type || 'lowpass',
                          ff0: o.freq ?? 1200, ff1: o.sweepTo ?? null, q: o.q ?? 1,
                          send: o.send ?? 0.25, delay: o.delay ?? 0, pan: o.pan ?? 0 });
  }

  /* ---------------- SFX front door ---------------- */

  /** Every key in the library, for tests and tooling. */
  sfxKeys() { return Object.keys(SFX); }
  aliasKeys() { return Object.keys(SFX_ALIAS); }

  /**
   * Turn any fx.sfx key into something audible.
   * Returns { key, how } where how is 'exact' | 'alias' | 'heuristic'.
   * Nothing ever resolves to silence — an unknown key is decomposed into
   * element + weight words so newly authored moves still land.
   */
  resolveSfx(name) {
    if (!name) return { key: 'impact_med', how: 'default' };
    const n = String(name).toLowerCase();
    if (SFX[n]) return { key: n, how: 'exact' };
    if (SFX_ALIAS[n]) return { key: SFX_ALIAS[n], how: 'alias' };
    let tint = null, weight = null;
    for (const [re, t] of TINT_WORDS) if (re.test(n)) { tint = t; break; }
    for (const [re, w] of WEIGHT_WORDS) if (re.test(n)) { weight = w; break; }
    if (tint === 'SLASH') return { key: (weight ?? 0.5) > 0.9 ? 'slash_world' : (weight ?? 0.5) > 0.65 ? 'slash_heavy' : 'slash_light', how: 'heuristic', tint, weight };
    if (tint) return { key: `hit_${tint.toLowerCase()}`, how: 'heuristic', tint, weight };
    if (weight != null) return { key: weight > 0.9 ? 'impact_world' : weight > 0.65 ? 'impact_heavy' : weight > 0.4 ? 'impact_med' : 'impact_light', how: 'heuristic', weight };
    return { key: 'impact_med', how: 'heuristic' };
  }

  /**
   * Play a sound.
   * opts: { pan, side (0|1 -> stage placement), pitch, gain, delay, w }
   */
  sfx(name, opts = {}) {
    if (!this.ctx) this.init();
    if (!this.ctx || this.muted) return;
    const r = this.resolveSfx(name);
    const fn = SFX[r.key];
    if (!fn) return;
    const role = SFX_ROLE[r.key] || null;

    // Repeat variation: the same key twice in a row is de-tuned and slightly
    // quieter so a multi-hit move reads as a flurry, not a machine gun.
    const key = r.key;
    const now = this.ctx.currentTime;
    const prev = this._recent.get(key);
    let rep = 0;
    if (prev && now - prev.t < 0.55) rep = Math.min(6, prev.n + 1);
    this._recent.set(key, { t: now, n: rep });
    if (this._recent.size > 64) { for (const k of this._recent.keys()) { if (now - this._recent.get(k).t > 3) this._recent.delete(k); } }

    const jitter = 1 + (this._rand() - 0.5) * 0.09;
    const repShift = rep ? Math.pow(1.0293, ((rep * 5) % 7) - 3) : 1;   // wanders, never repeats
    const pan = opts.pan != null ? clamp(opts.pan, -1, 1)
      : opts.side != null ? (opts.side === 0 ? -0.34 : 0.34) : 0;

    const o = {
      pan,
      pitch: (opts.pitch ?? 1) * jitter * repShift,
      gain: (opts.gain ?? 1) * (rep ? Math.pow(0.9, Math.min(rep, 4)) : 1),
      delay: opts.delay ?? 0
    };
    // Only set `w` when the caller means it — spreading `undefined` over a
    // registry entry's weight would flatten the whole impact ladder.
    if (opts.w != null) o.w = opts.w;
    if (rep) o.delay += this._rand() * 0.012;
    const prevOff = this._delayOff;
    this._delayOff = (prevOff || 0) + (o.delay || 0);
    try {
      fn(this, o);
      // A reporting cue pushes the bed down for a moment so it is heard as
      // information rather than as texture. Never for `text_blip`: it fires
      // ~960 times a battle and would pump the music continuously.
      //
      // This has to happen *inside* the delay window. It used to sit after the
      // restore below, so the duck was written at the current time while the
      // cue it was ducking for played up to a second later — measured at 0.13 dB
      // of ducking, which is none.
      if (role && role.duck) this._duck(role.duck, role.duckLen ?? 0.26);
    } catch (e) { if (this._realtime) console.warn('[audio] sfx', name, e); }
    finally { this._delayOff = prevOff; }
  }

  /* ---------------- cries ---------------- */

  /**
   * `cry(cryBlock)` — battleView passes `fighterDef.cry`. Because that is the
   * very object stored on the fighter, we can look the fighter back up and
   * derive the timbre from its id, stat shape, build and types, not just from
   * {root, shape, len}. Passing the whole FighterDef works too.
   */
  cry(what, opts = {}) {
    if (!this.ctx) this.init();
    if (!this.ctx || this.muted || !what) return;
    const fighter = what.cry ? what : (opts.fighter || this._fighterForCry(what));
    const block = what.cry || what;
    const prof = this._cryProfile(block, fighter);
    const buf = this._cryBuffer(prof);
    if (!buf) return;

    const ctx = this.ctx;
    const t0 = this._now() + (opts.delay || 0);
    const nodes = [];
    const N = (n) => { this._created++; nodes.push(n); return n; };
    const src = N(ctx.createBufferSource());
    src.buffer = buf;
    src.playbackRate.setValueAtTime((opts.pitch ?? 1) * this._rr(0.985, 1.015), t0);

    const tone = N(ctx.createBiquadFilter());
    tone.type = 'highpass'; tone.frequency.value = 42;
    const g = N(ctx.createGain());
    g.gain.value = 0.85 * (opts.gain ?? 1);
    const pan = opts.pan != null ? opts.pan : (opts.side != null ? (opts.side === 0 ? -0.3 : 0.3) : prof.pan);
    let tail = g;
    if (ctx.createStereoPanner) { const p = N(ctx.createStereoPanner()); p.pan.value = clamp(pan, -1, 1); g.connect(p); tail = p; }
    src.connect(tone).connect(g);
    tail.connect(this.sfxSum);
    const s = N(ctx.createGain()); s.gain.value = prof.verb;
    tail.connect(s).connect(this.verb);

    src.start(t0);
    this._reg(nodes, src, null, true);
    this._duck(0.14, 0.4);
  }

  _fighterForCry(block) {
    if (!this._cryIndex || this._cryIndexSize !== Object.keys(FIGHTER_BY_ID).length) {
      this._cryIndex = new Map();
      for (const id of Object.keys(FIGHTER_BY_ID)) {
        const f = FIGHTER_BY_ID[id];
        if (f?.cry) this._cryIndex.set(f.cry, f);
      }
      this._cryIndexSize = Object.keys(FIGHTER_BY_ID).length;
    }
    return this._cryIndex.get(block) || null;
  }

  /** Everything that makes one fighter sound unlike another. */
  _cryProfile(block, f) {
    const root = block?.root ?? 220;
    const shape = block?.shape ?? 'roar';
    const len = block?.len ?? 0.5;
    const id = f?.id || `${shape}:${root}:${len}`;
    const h = fnv1a('cry:' + id);
    const r = mulberry32(h);
    const b = f?.base || { hp: 90, atk: 90, def: 90, spa: 90, spd: 90, spe: 90 };
    const height = f?.model?.height ?? 1.8;
    const types = f?.types || [];

    const norm = (v, lo, hi) => clamp((v - lo) / (hi - lo), 0, 1);
    const bulk = norm(b.hp + b.def + b.spd, 190, 400);      // how much body it has
    const power = norm(b.atk + b.spa, 110, 280);
    const agility = norm(b.spe, 40, 145);
    const phys = clamp(b.atk / Math.max(1, b.atk + b.spa), 0.15, 0.9);
    const size = norm(height, 1.3, 7.5);
    const heavy = clamp(bulk * 0.5 + size * 0.5, 0, 1);

    // Pitch: the cry block sets the centre, mass pulls it down, hash detunes.
    // Ranges deliberately wide. Measured across the roster, spectral centroid was
    // confined to 366-1132 Hz and 27 of 32 fighters had another fighter's cry
    // nearer to them than a critical hit is to a normal hit — 32 slight
    // variations on one grunt. The synthesis was always capable of more; the
    // coefficients simply never asked it for more.
    const f0 = root * Math.pow(2, (-0.95 * (heavy - 0.45) + (r() - 0.5) * 0.42));
    const bright = clamp(0.20 + agility * 0.62 + (1 - phys) * 0.42 - heavy * 0.44 + (r() - 0.5) * 0.34, 0.02, 1);
    const dur = clamp(len * (0.82 + heavy * 0.55 + r() * 0.22), 0.22, 1.5);

    const P = {
      id, shape, f0, dur,
      tilt: lerp(2.70, 0.34, bright),                     // harmonic rolloff
      nPart: shape === 'chime' ? 9 : shape === 'clang' ? 8 : 14 + Math.round(r() * 6),
      grit: clamp(0.06 + phys * 0.34 + power * 0.12 + r() * 0.14, 0, 0.72),
      vibRate: 3.6 + agility * 9.5 + r() * 3.4,
      vibDepth: (0.004 + (1 - heavy) * 0.028 + r() * 0.012) * (shape === 'chime' ? 0.4 : 1),
      growlRate: 17 + agility * 52 + r() * 14,
      growlDepth: shape === 'growl' ? 0.42 + r() * 0.30 : shape === 'roar' ? 0.12 + phys * 0.22 : 0.03 + r() * 0.06,
      attack: clamp(0.003 + heavy * 0.055 * (1 - agility) + r() * 0.012, 0.002, 0.09),
      release: 0.16 + heavy * 0.34 + r() * 0.14,
      contour: Math.floor(r() * 6),
      contourAmt: 0.08 + r() * 0.92 + power * 0.28,
      formants: [
        lerp(760, 300, heavy) * (0.85 + r() * 0.34),
        lerp(2100, 900, heavy) * (0.85 + r() * 0.34),
        lerp(3200, 1900, heavy) * (0.8 + r() * 0.4)
      ],
      fq: [4 + r() * 5, 5 + r() * 6, 6 + r() * 7],
      fa: [1.0, 0.55 + r() * 0.4, 0.28 + r() * 0.3],
      inharm: shape === 'clang' ? 0.055 + r() * 0.05 : shape === 'chime' ? 0.012 + r() * 0.02 : 0.0008 + r() * 0.004,
      type: types[0] || 'NEUTRAL', type2: types[1] || null,
      level: clamp(0.42 + power * 0.20 + heavy * 0.16, 0.35, 0.86),
      verb: clamp(0.20 + size * 0.22 + (shape === 'chime' ? 0.14 : 0), 0.15, 0.55),
      pan: (r() - 0.5) * 0.22,
      heavy, bright, agility, phys, size
    };
    return P;
  }

  /**
   * Additive render into an AudioBuffer. Doing this in JS instead of with
   * oscillator nodes buys per-partial formant shaping, inharmonicity and a
   * growl AM that no amount of BiquadFilter stacking gets you.
   */
  _cryBuffer(P) {
    const sr = this.ctx.sampleRate;
    const ck = `${P.id}|${sr}`;
    const hit = this._cryCache.get(ck);
    if (hit) return hit;

    const total = P.dur + P.release;
    const n = Math.ceil(sr * total);
    const buf = this.ctx.createBuffer(1, n, sr);
    const out = buf.getChannelData(0);

    // ---- partial set -------------------------------------------------
    const K = P.nPart;
    const ratio = new Float32Array(K);
    const base = new Float32Array(K);
    const decay = new Float32Array(K);
    const CHIME = [1, 2, 3, 4.16, 5.43, 6.79, 8.21, 9.6, 11.2];
    const CLANG = [1, 2.76, 5.40, 8.93, 13.34, 18.64, 24.8, 31.9];
    for (let k = 0; k < K; k++) {
      let rt;
      if (P.shape === 'chime') rt = CHIME[k % CHIME.length];
      else if (P.shape === 'clang') rt = CLANG[k % CLANG.length];
      else rt = k + 1;
      rt *= 1 + P.inharm * k * k * 0.06;
      ratio[k] = rt;
      base[k] = 1 / Math.pow(rt, P.tilt);
      decay[k] = P.shape === 'chime' || P.shape === 'clang' ? 1.4 + rt * 0.55 : 0.25 + rt * 0.08;
    }
    if (P.shape === 'roar' || P.shape === 'growl') { ratio[0] = 0.5; base[0] = 0.9; decay[0] = 0.3; }

    // ---- per-fighter contour ----------------------------------------
    const A = P.contourAmt;
    const CONTOURS = [
      (u) => 1 + A * (1 - u) * 0.9 - A * u * 0.55,                       // fall
      (u) => 1 - A * 0.45 + A * Math.sin(u * Math.PI) * 0.9,              // arch
      (u) => 1 + A * 0.5 * Math.sin(u * Math.PI * 2.2) - A * u * 0.4,     // waver
      (u) => 1 + A * (u < 0.22 ? u * 3 : 0.66 - (u - 0.22) * 0.95),       // bark then drop
      (u) => 1 - A * 0.3 + A * 0.75 * u,                                  // rise
      (u) => 1 + A * 0.6 * (u < 0.5 ? 1 : 0.55) - A * 0.35 * u            // two-step
    ];
    const cf = CONTOURS[P.contour % CONTOURS.length];

    // ---- element tinting ---------------------------------------------
    const TT = P.type;
    const tintLp = { SEA: 1900, VOID: 780, EARTH: 1300, SHADOW: 2200, TOXIN: 1700, HAKI: 1500 }[TT] || 0;
    const tintHp = { FROST: 260, LIGHT: 220, SPIRIT: 200, WIND: 300, STORM: 180 }[TT] || 0;
    const shimmer = { FROST: 1, LIGHT: 1, SPIRIT: 0.7, MIND: 0.5 }[TT] || 0;
    const rasp = { FLAME: 1, BEAST: 0.9, MECHA: 0.6, TOXIN: 0.5, EARTH: 0.5 }[TT] || 0;
    const metal = { MECHA: 1, SLASH: 0.6 }[TT] || 0;

    const BLK = 64;
    const phase = new Float32Array(K);
    const gK = new Float32Array(K);
    const rnd = mulberry32(fnv1a('grain:' + P.id));
    let np0 = 0, np1 = 0, brown = 0;              // noise filter state
    let lp = 0, hp = 0, hpPrev = 0;
    const atk = P.attack, rel = P.release, dur = P.dur;

    for (let i0 = 0; i0 < n; i0 += BLK) {
      const t = i0 / sr;
      const u = clamp(t / dur, 0, 1);
      const pitchMul = cf(u) * (1 + P.vibDepth * Math.sin(TAU * P.vibRate * t + P.contour));
      // amplitude envelope
      let env;
      if (t < atk) env = t / atk;
      else if (t < dur) env = Math.pow(1 - (t - atk) / Math.max(0.001, dur - atk), 0.55) * 0.85 + 0.15;
      else env = Math.max(0, 1 - (t - dur) / rel);
      env *= env;                                  // perceptual taper
      // formant gains, recomputed per block
      for (let k = 0; k < K; k++) {
        const f = P.f0 * ratio[k] * pitchMul;
        if (f > sr * 0.45 || f < 12) { gK[k] = 0; continue; }
        let fg = 0.22;
        for (let j = 0; j < 3; j++) {
          const bw = P.formants[j] / P.fq[j];
          const x = (f - P.formants[j]) / (bw * 0.5);
          fg += P.fa[j] / (1 + x * x);
        }
        if (shimmer && f > 3000) fg *= 1 + shimmer * 0.9;
        if (tintLp && f > tintLp) fg *= tintLp / f;
        if (tintHp && f < tintHp) fg *= f / tintHp;
        if (metal && k > 2) fg *= 1 + metal * 0.5;
        gK[k] = base[k] * fg * Math.exp(-t * decay[k]);
      }

      const end = Math.min(n, i0 + BLK);
      for (let i = i0; i < end; i++) {
        const tt = i / sr;
        const growl = 1 - P.growlDepth * 0.5 * (1 - Math.cos(TAU * P.growlRate * tt));
        let s = 0;
        for (let k = 0; k < K; k++) {
          if (gK[k] === 0) continue;
          phase[k] += TAU * P.f0 * ratio[k] * pitchMul / sr;
          s += gK[k] * Math.sin(phase[k]);
        }
        s *= growl;
        // breath / grit layer
        if (P.grit > 0.001) {
          const w = rnd() * 2 - 1;
          np0 += (w - np0) * 0.35;
          np1 += (np0 - np1) * (0.10 + 0.5 * P.bright);
          brown = (brown + 0.03 * w) / 1.03;
          const nz = np1 * (1 + rasp * 1.6) + brown * (1.2 + rasp);
          s += nz * P.grit * (0.5 + 0.5 * (1 - u));
        }
        out[i] = s * env;
      }
    }

    // gentle tilt + DC block, then normalise so no cry ever clips
    for (let i = 0; i < n; i++) {
      const x = out[i];
      lp += (x - lp) * 0.55;
      hp = 0.995 * (hp + lp - hpPrev); hpPrev = lp;
      out[i] = hp;
    }
    let peak = 0;
    for (let i = 0; i < n; i++) { const a = Math.abs(out[i]); if (a > peak) peak = a; }
    const k = peak > 1e-6 ? P.level / peak : 0;
    const fadeIn = Math.floor(sr * 0.002), fadeOut = Math.floor(sr * 0.012);
    for (let i = 0; i < n; i++) {
      let g = k;
      if (i < fadeIn) g *= i / fadeIn;
      if (i > n - fadeOut) g *= (n - i) / fadeOut;
      out[i] *= g;
    }

    if (this._cryCache.size > 80) this._cryCache.clear();
    this._cryCache.set(ck, buf);
    return buf;
  }

  /* ---------------- music ---------------- */

  /** Start (or crossfade to) a track. Re-calling with the same name is a no-op. */
  startMusic(name = 'battle', opts = {}) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (!TRACKS[name]) name = 'battle';
    if (this._track === name && this._tracks.length) return;
    if (this._afterTimer) { clearTimeout(this._afterTimer); this._afterTimer = null; }

    const xfade = opts.xfade ?? (this._tracks.length ? 0.8 : 0.5);
    const t = this.ctx.currentTime;
    for (const tr of this._tracks) this._fadeOutTrack(tr, xfade);

    const def = TRACKS[name];
    const g = this.ctx.createGain(); this._created++;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(def.gain, t + xfade * 0.75);
    g.connect(this.musicSum);

    const stepDur = 60 / def.bpm / 4;   // 16th notes
    const tr = {
      name, def, gain: g, stepDur,
      absStep: 0, nextTime: t + 0.06,
      srcs: new Set(), dying: false, barI: this._intensity
    };
    this._tracks.push(tr);
    this._track = name;
    barMaps(def);
    this._startPump();
  }

  stopMusic(fade = 0.25) {
    if (this._afterTimer) { clearTimeout(this._afterTimer); this._afterTimer = null; }
    for (const tr of this._tracks) this._fadeOutTrack(tr, fade);
    this._track = null;
    if (this._tracks.length === 0 && this._pump) { clearInterval(this._pump); this._pump = null; }
  }

  _fadeOutTrack(tr, fade) {
    if (tr.dying) return;
    tr.dying = true;
    const t = this.ctx.currentTime;
    const g = tr.gain.gain;
    if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, fade));
    tr.killAt = t + fade + 0.05;
  }

  _startPump() {
    if (this._pump || this._offline) return;
    this._pump = setInterval(() => this._pumpOnce(), 25);
    this._pumpOnce();
  }

  _pumpOnce() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    // intensity glides so layer changes are decisions, not glitches
    this._intensity += (this._intensityTarget - this._intensity) * 0.06;

    for (let i = this._tracks.length - 1; i >= 0; i--) {
      const tr = this._tracks[i];
      if (tr.killAt != null && now > tr.killAt) {
        for (const s of tr.srcs) { try { s.stop(now); } catch { /* already stopped */ } }
        tr.srcs.clear();
        try { tr.gain.disconnect(); } catch { /* fine */ }
        this._tracks.splice(i, 1);
        continue;
      }
      if (tr.dying) continue;
      let guard = 0;
      while (tr.nextTime < now + 0.20 && guard++ < 64) {
        this._musicStep(tr, tr.absStep, tr.nextTime);
        tr.absStep++;
        tr.nextTime += tr.stepDur;
      }
    }
    if (!this._tracks.length && this._pump) { clearInterval(this._pump); this._pump = null; }
  }

  setIntensity(v) {
    const t = clamp(v, 0, 1);
    this._intensityTarget = t;
    if (!this._realtime) { this._intensity = t; return; }
    // Escalate to the last-fighter-standing arrangement on its own; drop back
    // when the board relaxes. Crossfades, never a hard cut.
    // The endgame track needed 0.78, which needs two fighters left of six — by
    // which point the battle is usually already over. A whole measured battle
    // peaked at 0.70 and never heard it. 0.66 fires when half the field is down,
    // which is what "last stand" is supposed to mean.
    if (this._track === 'battle' && t >= 0.66) this.startMusic('laststand', { xfade: 1.1 });
    else if (this._track === 'laststand' && t < 0.56) this.startMusic('battle', { xfade: 1.1 });
  }

  /** Queue a track to start after a stinger finishes (victory / defeat). */
  _afterTrack(name, delay) {
    if (!this._realtime) return;
    if (this._afterTimer) clearTimeout(this._afterTimer);
    this._afterTimer = setTimeout(() => { this._afterTimer = null; this.startMusic(name, { xfade: 0.6 }); }, delay * 1000);
  }

  /** Schedule an entire stretch of a track up front — used by the offline harness. */
  scheduleMusicOffline(name, seconds, intensity = 0.5) {
    if (!this.ctx) return;
    if (!TRACKS[name]) return;
    this._intensity = this._intensityTarget = clamp(intensity, 0, 1);
    const def = TRACKS[name];
    barMaps(def);
    const g = this.ctx.createGain();
    g.gain.value = def.gain;
    g.connect(this.musicSum);
    const stepDur = 60 / def.bpm / 4;
    const tr = { name, def, gain: g, stepDur, absStep: 0, nextTime: 0, srcs: new Set(), dying: false, barI: intensity };
    this._tracks.push(tr);
    this._track = name;
    const steps = Math.ceil(seconds / stepDur);
    for (let i = 0; i < steps; i++) this._musicStep(tr, i, i * stepDur);
  }

  _sectionAt(tr, bar) {
    const maps = barMaps(tr.def);
    if (bar < maps.intro.length) return maps.intro[bar];
    const loop = maps.loop;
    return loop[(bar - maps.intro.length) % loop.length];
  }

  _musicStep(tr, absStep, time) {
    const def = tr.def;
    const bar = Math.floor(absStep / 16);
    const st = absStep % 16;
    const cell = this._sectionAt(tr, bar);
    if (!cell) return;
    const S = cell.s;
    if (st === 0) tr.barI = this._intensity;       // arrangement decided per bar
    const I = tr.barI;
    const G = tr.gain;
    const swing = def.swing && st % 2 === 1 ? tr.stepDur * def.swing : 0;
    const t = time + swing;

    const tense = I > 0.68 && !!S.tense;
    const ch = chord((tense ? S.tense : S.chords)[cell.i]);
    const drums = DRUM[S.drums] || DRUM.none;

    // Intensity in play runs roughly 0.4 (opening) -> 0.8 (last fighter each
    // side). The gates are spaced across that window, not across 0..1.
    const L = {
      pad:   true,
      // Thresholds are spread across the range play actually occupies, which is
      // not the range they were written for. `battle.js` sets intensity to
      // 0.4 + (1 - alive/total) * 0.6, so a 3v3 traverses 0.40 (all six up) to
      // 0.70 (three down) and stops. Every body layer used to be on by 0.46, so
      // the whole arc happened before the first turn and the only thing that
      // moved afterwards was decoration: measured, the arrangement shifted 0.168
      // cosine between I=0 and I=0.25 and 0.0115 between 0.5 and 0.75.
      // Re-spread so the track genuinely thins and thickens while you play it.
      kick:  I > 0.30,
      snare: I > 0.44,
      hat:   I > 0.40,
      hat16: I > 0.66,
      chords: I > 0.50,
      lead:  I > 0.56,
      octave: I > 0.72,
      arp:   I > 0.62,
      drone: I > 0.70,
      crash: I > 0.52
    };
    // Victory and defeat are statements, not adaptive beds.
    if (tr.name === 'victory' || tr.name === 'defeat' || tr.name === 'title') {
      L.kick = L.snare = L.hat = true; L.chords = true; L.lead = true;
      L.arp = true; L.hat16 = false; L.octave = tr.name === 'victory';
      L.drone = false; L.crash = true;
    }

    /* --- drums --- */
    if (L.kick && drums.kick[st]) this._kick(t, G, 0.66 * drums.kick[st] * (0.8 + I * 0.35));
    if (L.snare && drums.snare[st]) this._snare(t, G, 0.34 * drums.snare[st] * (0.8 + I * 0.3));
    if (L.hat) {
      const v = drums.hat[st];
      if (v) this._hat(t, G, 0.14 * v * (0.7 + I * 0.4), st % 8 === 4);
      else if (L.hat16 && st % 2 === 1) this._hat(t, G, 0.06 * (0.6 + I * 0.4), false);
    }
    if (L.crash && S.crash && st === 0 && cell.i === 0) this._crash(t, G, 0.16);

    /* --- bass --- */
    const bassRhy = S.bassRhy || 'eighth';
    const hitBass =
      bassRhy === 'whole' ? st === 0 :
      bassRhy === 'half' ? st === 0 || st === 8 :
      bassRhy === 'eighth' ? st % 2 === 0 :
      /* drive */ (I > 0.6 ? true : st % 2 === 0);
    if (hitBass) {
      const deg = [0, 0, 0, 12, 0, 7, 0, 12, 0, 0, 5, 0, 0, 7, 0, -12][st] || 0;
      const nb = ch.root + (bassRhy === 'whole' ? 0 : deg);
      const dur = bassRhy === 'whole' ? tr.stepDur * 14 : bassRhy === 'half' ? tr.stepDur * 6 : tr.stepDur * 1.6;
      this._bass(t, G, mtof(nb), dur, 0.30 * (0.75 + I * 0.4), I);
    }

    /* --- chord stabs / pad --- */
    if (L.chords && (st === 0 || st === 6 || st === 10)) {
      const vel = st === 0 ? 0.11 : 0.07;
      ch.tones.slice(0, 4).forEach((m, i) =>
        this._stab(t + i * 0.004, G, mtof(m + 12), tr.stepDur * (st === 0 ? 3 : 1.8), vel * (0.8 + I * 0.4), (i % 2 ? 0.28 : -0.28)));
    }
    if (st === 0 && S.pad) {
      const padGain = 0.055 * S.pad * (1.25 - I * 0.5);
      if (padGain > 0.004) ch.tones.forEach((m, i) => this._pad(t, G, mtof(m + 12), tr.stepDur * 15.5, padGain / (1 + i * 0.35), (i - 1.5) * 0.3));
    }
    if (L.drone && st === 0) this._pad(t, G, mtof(ch.root - 12), tr.stepDur * 15.5, 0.09, 0);

    /* --- lead --- */
    if (L.lead && S.lead) {
      const barPat = S.lead[cell.i];
      if (barPat) {
        const v = barPat[st];
        if (v !== null && v !== '-' && v != null) {
          // Legato: a note runs until the next written note, capped.
          let j = st + 1;
          while (j < 16 && (barPat[j] === null || barPat[j] === '-')) j++;
          const span = Math.min(10, j - st);
          const dur = tr.stepDur * Math.max(0.8, span - 0.2);
          const note = v;
          const voice = S.leadVoice || 'saw';
          const gain = 0.09 * (0.7 + I * 0.5);
          if (voice === 'bell') this._bellNote(t, G, mtof(note), dur * 2.2, gain * 0.9);
          else if (voice === 'brass') this._brass(t, G, mtof(note), dur, gain * 1.15);
          else this._lead(t, G, mtof(note), dur, gain, I);
          if (L.octave) {
            if (voice === 'brass') this._brass(t, G, mtof(note - 12), dur, gain * 0.5);
            else this._lead(t, G, mtof(note + 12), dur * 0.8, gain * 0.42, I, 0.35);
          }
          if (tense && I > 0.86 && st % 8 === 0) this._lead(t + tr.stepDur, G, mtof(note + 1), tr.stepDur * 1.5, gain * 0.35, I, -0.4);
        }
      }
    }

    /* --- arpeggio --- */
    if (L.arp && S.arp > 0 && st % 2 === 1) {
      const tones = ch.tones;
      const m = tones[(Math.floor(absStep / 2) * 3) % tones.length] + 24;
      this._pluck(t, G, mtof(m), tr.stepDur * 1.4, 0.030 * S.arp * (0.5 + I * 0.6), ((st % 4) < 2 ? 0.45 : -0.45));
    }
  }

  /* --- music instruments --- */
  _kick(t, out, g) {
    this._v({ at: t, out, wave: 'sine', f0: 150, f1: 62, f2: 40, fmid: 0.06, dur: 0.30, a: 0.001, gain: g, send: 0.05, critical: true });
    this._noiseV({ at: t, out, dur: 0.02, gain: g * 0.35, filt: 'highpass', ff0: 1800, a: 0.0004, send: 0, critical: true });
  }
  _snare(t, out, g) {
    this._noiseV({ at: t, out, dur: 0.16, gain: g, filt: 'bandpass', ff0: 2400, ff1: 1300, q: 0.8, a: 0.0008, send: 0.22, pan: 0.05 });
    this._v({ at: t, out, wave: 'triangle', f0: 220, f2: 170, dur: 0.10, a: 0.0006, gain: g * 0.5, send: 0.12 });
    this._v({ at: t, out, wave: 'triangle', f0: 330, f2: 250, dur: 0.08, a: 0.0006, gain: g * 0.3, send: 0.12 });
  }
  _hat(t, out, g, open) {
    this._noiseV({ at: t, out, dur: open ? 0.14 : 0.045, gain: g, filt: 'highpass', ff0: 7200, a: 0.0004, send: 0.10, pan: -0.22 });
  }
  _crash(t, out, g) {
    this._noiseV({ at: t, out, dur: 1.5, gain: g, filt: 'highpass', ff0: 4200, a: 0.002, send: 0.5, pan: 0.3, nkind: 0 });
    this._noiseV({ at: t, out, dur: 0.9, gain: g * 0.5, filt: 'bandpass', ff0: 8000, q: 0.6, a: 0.002, send: 0.4, pan: -0.3 });
  }
  _bass(t, out, f, dur, g, I) {
    this._v({ at: t, out, wave: 'sawtooth', f0: f, dur, a: 0.004, gain: g * 0.55, hold: dur * 0.4,
              filt: 'lowpass', ff0: 260 + I * 900, ff1: 150 + I * 320, q: 3.5, drive: 0.2 + I * 0.35, send: 0.05, pan: -0.10 });
    this._v({ at: t, out, wave: 'sine', f0: f / 2, dur: dur * 1.05, a: 0.005, gain: g * 0.62, hold: dur * 0.4, send: 0.02, pan: 0 });
  }
  _stab(t, out, f, dur, g, pan) {
    this._v({ at: t, out, wave: 'square', f0: f, dur, a: 0.004, gain: g, filt: 'lowpass', ff0: 2600, ff1: 1100, q: 1.5, send: 0.28, pan });
  }
  _pad(t, out, f, dur, g, pan) {
    this._v({ at: t, out, wave: 'sawtooth', f0: f, dur, a: dur * 0.35, shape: 'lin', gain: g, detune: -7,
              filt: 'lowpass', ff0: 1400, ff1: 900, q: 0.8, send: 0.45, pan });
    this._v({ at: t, out, wave: 'sawtooth', f0: f * 1.004, dur, a: dur * 0.4, shape: 'lin', gain: g * 0.8, detune: 9,
              filt: 'lowpass', ff0: 1200, send: 0.45, pan: -pan });
  }
  _lead(t, out, f, dur, g, I, pan = 0.22) {
    this._v({ at: t, out, wave: 'sawtooth', f0: f, dur, a: 0.008, hold: dur * 0.35, gain: g,
              filt: 'lowpass', ff0: 2200 + I * 2600, ff1: 1400 + I * 1200, q: 2, detune: -6,
              send: 0.28, echo: 0.16, pan });
    this._v({ at: t, out, wave: 'sawtooth', f0: f * 1.006, dur: dur * 0.95, a: 0.010, hold: dur * 0.3, gain: g * 0.7,
              filt: 'lowpass', ff0: 2000 + I * 2200, q: 1.6, detune: 7, send: 0.28, pan: -pan * 0.6 });
  }
  _brass(t, out, f, dur, g) {
    this._v({ at: t, out, wave: 'sawtooth', f0: f * 0.985, f2: f, fmid: 0.05, dur, a: 0.014, hold: dur * 0.45, gain: g,
              filt: 'lowpass', ff0: 1200, ff1: 3000, ffmid: 0.25, q: 1.2, send: 0.3, pan: -0.14 });
    this._v({ at: t, out, wave: 'sawtooth', f0: f * 1.008, dur: dur * 0.96, a: 0.018, hold: dur * 0.4, gain: g * 0.75,
              filt: 'lowpass', ff0: 2400, q: 1, send: 0.3, pan: 0.14 });
  }
  _bellNote(t, out, f, dur, g) {
    [1, 2.01, 3.04, 4.31].forEach((r, i) => this._v({
      at: t, out, wave: 'sine', f0: f * r, dur: dur * (1 - i * 0.14), a: 0.003,
      gain: g / (1 + i * 1.1), send: 0.5, echo: i === 0 ? 0.2 : 0, pan: (i % 2 ? 0.2 : -0.2)
    }));
  }
  _pluck(t, out, f, dur, g, pan) {
    this._v({ at: t, out, wave: 'triangle', f0: f, dur, a: 0.002, gain: g,
              filt: 'lowpass', ff0: 5200, ff1: 1600, q: 1.5, send: 0.35, pan });
  }
}

/* ---- shared helpers -------------------------------------------------- */

const _driveCurves = new Map();
function makeDriveCurve(k) {
  const key = Math.round(k * 4) / 4;
  const hit = _driveCurves.get(key);
  if (hit) return hit;
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(x * key) / Math.tanh(key);
  }
  _driveCurves.set(key, c);
  return c;
}

/* ---- offline measurement harness ------------------------------------- */

/**
 * Render one sound (or a stretch of a track) to an AudioBuffer with an
 * OfflineAudioContext, through the exact same bus/limiter chain the game uses.
 * `tools/audiotest.mjs` drives this; keep the signature stable.
 */
Audio.renderOffline = async function renderOffline(spec = {}) {
  const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!OAC) throw new Error('no OfflineAudioContext');
  const sr = spec.sampleRate || 48000;
  const seconds = spec.seconds || 2;
  const ctx = new OAC(2, Math.ceil(sr * seconds), sr);
  const a = new Audio();
  a.masterVol = spec.masterVol ?? 0.7;
  a.musicVol = spec.musicVol ?? 0.35;
  a.sfxVol = spec.sfxVol ?? 0.8;
  a.init(ctx);
  a.setSeed(spec.seed ?? 12345);
  a._voiceBudget = spec.voiceBudget ?? 4096;

  switch (spec.kind) {
    case 'sfx':
      a.sfx(spec.name, spec.opts || {});
      break;
    case 'burst': {                                  // N sounds on one frame
      for (const n of spec.names) a.sfx(n, spec.opts || {});
      break;
    }
    case 'cry': {
      const f = FIGHTER_BY_ID[spec.fighterId];
      if (!f) throw new Error('unknown fighter ' + spec.fighterId);
      a.cry(f.cry, spec.opts || {});
      break;
    }
    case 'cryProfile': {                             // synthetic profile, for scale tests
      const buf = a._cryBuffer(a._cryProfile(spec.block, spec.fighter));
      const src = ctx.createBufferSource(); src.buffer = buf;
      src.connect(a.sfxSum); src.start(0);
      break;
    }
    case 'music':
      a.scheduleMusicOffline(spec.name, seconds, spec.intensity ?? 0.5);
      break;
    default:
      throw new Error('unknown render kind ' + spec.kind);
  }
  const buf = await ctx.startRendering();
  return buf;
};

Audio.TRACK_NAMES = Object.keys(TRACKS);
Audio.SFX_NAMES = Object.keys(SFX);
Audio.SFX_ALIASES = SFX_ALIAS;

export const audio = new Audio();
export { TRACKS, SFX, SFX_ALIAS };
