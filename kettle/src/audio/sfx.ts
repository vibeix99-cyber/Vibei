/**
 * SFX recipes. Every sound is built from the shared tonal palette
 * (F major pentatonic, see dsp.ts) and the instrument vocabulary in
 * instruments.ts so the whole app sounds like one cozy instrument set.
 *
 * Levels: `level` is a dB trim per sound, calibrated with
 * `node scripts/audio-check.mjs` against `target` (max momentary loudness,
 * LUFS-ish, at unity volume). See docs/areas/audio.md for the table.
 * OWNER: audio area.
 */
import type { HapticKind } from '@/lib/haptics';
import { pentaFreq, rrange, semitoneRatio, snapToPentatonic, type Rng, type VoiceRule } from './dsp';
import {
  KALIMBA,
  MARIMBA,
  SOFT_BELL,
  TIN,
  breath,
  feltPiano,
  noiseBurst,
  pad,
  strike,
  tone,
  voiceOut,
  mark,
  type Out,
} from './instruments';

export type SfxName =
  | 'tap' // generic button press
  | 'toggle' // switch / chip select
  | 'start' // put the kettle on
  | 'pause'
  | 'resume'
  | 'complete' // focus done — kettle whistle → chime
  | 'breakOver' // break finished
  | 'addTime'
  | 'cancel' // end early / dismiss
  | 'levelUp'
  | 'badge'
  | 'quest' // recipe complete / tin open
  | 'streak' // streak extended
  | 'streakTick' // number count-up tick
  | 'leaf' // leaf counter tick
  | 'pop' // small appear
  | 'whoosh' // sheet / screen transition
  | 'error';

export interface PlayOptions {
  /** 0..1 multiplier on top of SFX volume */
  volume?: number;
  /** Semitone offset (e.g. rising ticks). Tonal sounds snap it into the pentatonic key. */
  pitch?: number;
  /** Pentatonic scale steps (preferred for count-ups: 0,1,2… always in key). Overrides `pitch`. */
  step?: number;
  /** Set false to skip the paired haptic. */
  haptic?: boolean;
}

export interface SfxArgs extends Out {
  t: number;
  /** Resolved frequency ratio from pitch/step (1 = unshifted). */
  ratio: number;
}

export interface SfxDef {
  /** Builds the sound starting at `a.t`; returns the time it has fully ended. */
  build: (a: SfxArgs) => number;
  /** dB trim applied to the whole voice. */
  level: number;
  /** Target max-momentary loudness at unity volume (LUFS-ish) — used by the check script. */
  target: number;
  rule: VoiceRule;
  haptic?: HapticKind;
  /** Whether pitch/step apply to this sound. */
  tonal?: boolean;
}

/** Pentatonic step → Hz (0 = F4, 3 = C5, 5 = F5, 8 = C6, 10 = F6, -5 = F3). */
const P = (step: number) => pentaFreq(step);

/** Resolve pitch/step options into a frequency ratio that stays in key. */
export function pitchRatio(opts: Pick<PlayOptions, 'pitch' | 'step'>, maxSteps = 12): number {
  if (opts.step != null && Number.isFinite(opts.step)) {
    const s = Math.max(-5, Math.min(maxSteps, Math.round(opts.step)));
    return P(s) / P(0);
  }
  if (opts.pitch != null && Number.isFinite(opts.pitch) && opts.pitch !== 0) {
    const semis = Math.max(-12, Math.min(24, snapToPentatonic(opts.pitch)));
    return semitoneRatio(semis);
  }
  return 1;
}

const human = (rng: Rng, cents = 6) => rrange(rng, -cents, cents);

// ---------------------------------------------------------------------------
// Kettle whistle — breathy sine with vibrato, a beating twin and steam.
// ---------------------------------------------------------------------------

function kettleWhistle(o: Out, t: number, dur: number, gain: number): number {
  const { ctx } = o;
  const f0 = P(7); // A5 — starts below…
  const f1 = P(8); // …and rises to C6 as it comes to the boil (never shrill)
  const out = voiceOut(o, { gain, wet: 0.22 });
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.18, t + 0.14);
  env.gain.linearRampToValueAtTime(1, t + 0.42);
  env.gain.setValueAtTime(1, t + dur - 0.42);
  env.gain.linearRampToValueAtTime(0.3, t + dur - 0.14);
  env.gain.linearRampToValueAtTime(0, t + dur);
  // Air turbulence: a little fast, irregular flutter so it breathes like steam, not a test tone.
  const flutter = ctx.createGain();
  flutter.gain.value = 1;
  for (const [f, d] of [
    [13.3, 0.06],
    [21.7, 0.04],
  ] as const) {
    const am = ctx.createOscillator();
    am.frequency.value = f * (0.95 + o.rng() * 0.1);
    const ad = ctx.createGain();
    ad.gain.value = d;
    am.connect(ad).connect(flutter.gain);
    am.start(t);
    am.stop(t + dur + 0.02);
  }
  env.connect(flutter).connect(out);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.2;
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(16, t + 0.5); // cents
  lfo.connect(depth);

  const partials: [number, number, number][] = [
    [1, 0.5, 0],
    [1, 0.12, 5], // twin whistle: a slow, gentle warble (~3 Hz, ±4 dB)
    [2, 0.018, 0],
  ];
  for (const [r, g, c] of partials) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(f0 * r, t);
    osc.frequency.exponentialRampToValueAtTime(f1 * r, t + 0.45);
    osc.detune.value = c;
    depth.connect(osc.detune);
    const pg = ctx.createGain();
    pg.gain.value = g;
    osc.connect(pg).connect(env);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
  lfo.start(t);
  lfo.stop(t + dur + 0.02);

  // Breath riding on the whistle pitch.
  breath({ ...o, out: env }, t, {
    sweep: [
      [0, f0],
      [0.45, f1],
      [dur, f1],
    ],
    q: 7,
    gain: 0.5,
    attack: 0.05,
    hold: dur - 0.2,
    release: 0.12,
    lowpass: 3000,
  });
  // Soft steam hiss underneath (kept low + lowpassed so it never gets harsh).
  breath({ ...o, out: env }, t, {
    sweep: [
      [0, 1600],
      [dur, 2100],
    ],
    q: 0.7,
    gain: 0.06,
    attack: 0.1,
    hold: dur - 0.3,
    release: 0.18,
    lowpass: 3800,
  });
  return mark(o, t + dur + 0.05);
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

const UI_RULE: VoiceRule = { max: 1, minGapMs: 150 };
const BIG_RULE: VoiceRule = { max: 1, minGapMs: 400 };

export const SFX: Record<SfxName, SfxDef> = {
  tap: {
    level: 3.6,
    target: -30,
    rule: { max: 3, minGapMs: 30, yieldMs: 60 },
    build: (a) => {
      const f = 760 * a.ratio;
      const c = human(a.rng, 10);
      let end = tone(a, a.t, f, { gain: 0.5, attack: 0.0015, t60: 0.065, glide: 0.86, glideTime: 0.03, cents: c });
      end = Math.max(end, tone(a, a.t, f * 2.4, { gain: 0.05, attack: 0.001, t60: 0.02, cents: c }));
      noiseBurst(a, a.t, { type: 'bandpass', freq: 1500, q: 1.2, gain: 0.04, attack: 0.001, t60: 0.012 });
      return end;
    },
  },

  toggle: {
    level: -0.5,
    target: -28,
    tonal: true,
    rule: { max: 2, minGapMs: 40 },
    build: (a) => {
      const end = strike(a, a.t, P(7) * a.ratio, MARIMBA, { gain: 0.5, decay: 0.3, bright: 0.6, cents: human(a.rng) });
      noiseBurst(a, a.t, { type: 'lowpass', freq: 1200, q: 0.7, gain: 0.05, attack: 0.001, t60: 0.01 });
      return end;
    },
  },

  pop: {
    level: 4.1,
    target: -28,
    tonal: true,
    rule: { max: 4, minGapMs: 25 },
    build: (a) => {
      const f = 520 * a.ratio;
      const end = tone(a, a.t, f, { gain: 0.5, attack: 0.002, t60: 0.09, glide: 1.9, glideTime: 0.045, cents: human(a.rng, 15) });
      tone(a, a.t, f * 2, { gain: 0.06, attack: 0.002, t60: 0.04, glide: 1.9, glideTime: 0.045 });
      return end;
    },
  },

  whoosh: {
    level: 4.8,
    target: -29,
    rule: { max: 2, minGapMs: 120 },
    build: (a) =>
      breath(a, a.t, {
        sweep: [
          [0, 350],
          [0.12, 1300],
          [0.36, 600],
        ],
        q: 0.9,
        gain: 0.5,
        attack: 0.1,
        hold: 0.02,
        release: 0.24,
        panFrom: -0.35,
        panTo: 0.35,
        lowpass: 3000,
      }),
  },

  start: {
    level: -6.2,
    target: -20,
    rule: BIG_RULE,
    haptic: 'start',
    build: (a) => {
      const t = a.t;
      // Kettle switch: click… clack.
      noiseBurst(a, t, { type: 'bandpass', freq: 1800, q: 2.4, gain: 0.3, attack: 0.0015, t60: 0.014 });
      tone(a, t, 190, { gain: 0.35, attack: 0.001, t60: 0.05, glide: 0.7, glideTime: 0.04 });
      noiseBurst(a, t + 0.075, { type: 'bandpass', freq: 1500, q: 2.4, gain: 0.18, attack: 0.0015, t60: 0.012 });
      tone(a, t + 0.075, 150, { gain: 0.22, attack: 0.001, t60: 0.045, glide: 0.75, glideTime: 0.04 });
      // Burner catches: a soft "fwoomp".
      breath(a, t + 0.1, {
        sweep: [
          [0, 180],
          [0.2, 700],
          [0.6, 380],
        ],
        q: 0.7,
        gain: 0.35,
        attack: 0.16,
        hold: 0.05,
        release: 0.45,
        lowpass: 1600,
      });
      // Warm rise.
      pad(a, t + 0.12, [P(-2), P(0), P(2)], { gain: 0.17, attack: 0.36, hold: 0.1, release: 0.6, cutoff: 400, cutoffTo: 1700, glideFrom: semitoneRatio(-2), wet: 0.2 });
      strike(a, t + 0.26, P(3), KALIMBA, { gain: 0.4, pan: -0.12, wet: 0.2, cents: human(a.rng) });
      return strike(a, t + 0.4, P(5), KALIMBA, { gain: 0.5, pan: 0.12, wet: 0.2, cents: human(a.rng) });
    },
  },

  pause: {
    level: -6.8,
    target: -25,
    rule: UI_RULE,
    haptic: 'light',
    build: (a) => {
      strike(a, a.t, P(3), MARIMBA, { gain: 0.5, decay: 0.5, bright: 0.6 });
      return strike(a, a.t + 0.085, P(2), MARIMBA, { gain: 0.42, decay: 0.6, bright: 0.5 });
    },
  },

  resume: {
    level: -7.5,
    target: -25,
    rule: UI_RULE,
    haptic: 'light',
    build: (a) => {
      strike(a, a.t, P(2), MARIMBA, { gain: 0.45, decay: 0.5, bright: 0.6 });
      return strike(a, a.t + 0.08, P(3), MARIMBA, { gain: 0.5, decay: 0.6, bright: 0.65 });
    },
  },

  addTime: {
    level: -5.5,
    target: -25,
    rule: UI_RULE,
    build: (a) => {
      tone(a, a.t, 520, { gain: 0.25, attack: 0.002, t60: 0.07, glide: 1.8, glideTime: 0.04 });
      strike(a, a.t + 0.02, P(4), KALIMBA, { gain: 0.4, decay: 0.45, pan: -0.1 });
      return strike(a, a.t + 0.09, P(5), KALIMBA, { gain: 0.45, decay: 0.55, pan: 0.1 });
    },
  },

  cancel: {
    level: -11.6,
    target: -26,
    rule: UI_RULE,
    haptic: 'soft',
    build: (a) => {
      feltPiano(a, a.t, P(2), { gain: 0.45, decay: 0.45, bright: 0.45 });
      return feltPiano(a, a.t + 0.13, P(0), { gain: 0.4, decay: 0.5, bright: 0.4 });
    },
  },

  error: {
    level: -7.2,
    target: -26,
    rule: UI_RULE,
    haptic: 'error',
    build: (a) => {
      strike(a, a.t, P(2), MARIMBA, { gain: 0.55, decay: 0.3, bright: 0.3 });
      noiseBurst(a, a.t, { type: 'lowpass', freq: 700, q: 0.7, gain: 0.1, attack: 0.002, t60: 0.04 });
      return strike(a, a.t + 0.12, P(1), MARIMBA, { gain: 0.5, decay: 0.35, bright: 0.3 });
    },
  },

  breakOver: {
    level: -9.4,
    target: -21,
    rule: BIG_RULE,
    haptic: 'medium',
    build: (a) => {
      strike(a, a.t, P(3), SOFT_BELL, { gain: 0.45, pan: -0.15, wet: 0.3 });
      strike(a, a.t + 0.16, P(5), SOFT_BELL, { gain: 0.45, pan: 0.15, wet: 0.3 });
      return strike(a, a.t + 0.32, P(7), KALIMBA, { gain: 0.22, wet: 0.3 });
    },
  },

  streakTick: {
    level: -4.6,
    target: -27,
    tonal: true,
    rule: { max: 5, minGapMs: 35 },
    haptic: 'tick',
    build: (a) => strike(a, a.t, P(3) * a.ratio, KALIMBA, { gain: 0.5, decay: 0.35, wet: 0.1, cents: human(a.rng, 4) }),
  },

  leaf: {
    level: -0.9,
    target: -28,
    tonal: true,
    rule: { max: 5, minGapMs: 35 },
    build: (a) => {
      const end = strike(a, a.t, P(5) * a.ratio, MARIMBA, { gain: 0.5, decay: 0.3, bright: 0.5, cents: human(a.rng, 4) });
      noiseBurst(a, a.t, { type: 'bandpass', freq: 3000, q: 0.9, gain: 0.05, attack: 0.003, t60: 0.035, pan: rrange(a.rng, -0.3, 0.3) });
      return end;
    },
  },

  streak: {
    level: -7.8,
    target: -18,
    rule: BIG_RULE,
    haptic: 'success',
    build: (a) => {
      const t = a.t;
      breath(a, t, {
        sweep: [
          [0, 300],
          [0.3, 900],
          [0.9, 500],
        ],
        q: 0.6,
        gain: 0.16,
        attack: 0.25,
        release: 0.6,
        lowpass: 1800,
      });
      pad(a, t + 0.05, [P(-2), P(0), P(2)], { gain: 0.18, attack: 0.3, hold: 0.2, release: 0.9, cutoff: 500, cutoffTo: 1500, wet: 0.25 });
      [0, 2, 3, 5].forEach((s, i) => strike(a, t + i * 0.075, P(s), KALIMBA, { gain: 0.4 + i * 0.03, pan: -0.2 + i * 0.13, wet: 0.25 }));
      return strike(a, t + 0.32, P(7), SOFT_BELL, { gain: 0.3, wet: 0.3 });
    },
  },

  badge: {
    level: -5.0,
    target: -18,
    rule: BIG_RULE,
    haptic: 'success',
    build: (a) => {
      const t = a.t;
      feltPiano(a, t, P(-5), { gain: 0.1, decay: 0.5, wet: 0.2 });
      feltPiano(a, t, P(3), { gain: 0.25, wet: 0.2 });
      feltPiano(a, t, P(5), { gain: 0.25, wet: 0.2 });
      strike(a, t + 0.12, P(7), SOFT_BELL, { gain: 0.38, wet: 0.3, pan: -0.1 });
      strike(a, t + 0.22, P(10), KALIMBA, { gain: 0.24, wet: 0.3, pan: 0.15 });
      return strike(a, t + 0.3, P(12), KALIMBA, { gain: 0.2, wet: 0.35, pan: 0.3 });
    },
  },

  quest: {
    level: -4.9,
    target: -19,
    rule: BIG_RULE,
    haptic: 'medium',
    build: (a) => {
      const t = a.t;
      // The tin lid pops off…
      tone(a, t, 420, { gain: 0.5, attack: 0.002, t60: 0.07, glide: 0.45, glideTime: 0.035 });
      noiseBurst(a, t, { type: 'lowpass', freq: 1400, q: 0.7, gain: 0.22, attack: 0.001, t60: 0.04 });
      strike(a, t + 0.004, 1180, TIN, { gain: 0.1, attack: 0.001 });
      // …and something lovely sparkles inside.
      strike(a, t + 0.12, P(8), KALIMBA, { gain: 0.3, pan: -0.2, wet: 0.3 });
      strike(a, t + 0.18, P(9), KALIMBA, { gain: 0.3, pan: 0, wet: 0.3 });
      strike(a, t + 0.24, P(10), KALIMBA, { gain: 0.3, pan: 0.2, wet: 0.3 });
      return strike(a, t + 0.33, P(12), SOFT_BELL, { gain: 0.16, wet: 0.35 });
    },
  },

  levelUp: {
    level: -5.1,
    target: -15,
    rule: BIG_RULE,
    haptic: 'celebrate',
    build: (a) => {
      const t = a.t;
      const notes: [number, number][] = [
        [0, 3],
        [0.11, 5],
        [0.22, 7],
        [0.36, 8],
      ];
      let end = t;
      notes.forEach(([dt, s], i) => {
        const last = i === notes.length - 1;
        end = Math.max(end, strike(a, t + dt, P(s), MARIMBA, { gain: last ? 0.5 : 0.42, decay: last ? 1.6 : 0.8, pan: -0.15 + i * 0.1, wet: 0.2 }));
        feltPiano(a, t + dt, P(s), { gain: 0.22, decay: last ? 1 : 0.5, wet: 0.2 });
      });
      feltPiano(a, t + 0.36, P(-5), { gain: 0.16, decay: 0.5, wet: 0.2 });
      feltPiano(a, t + 0.36, P(0), { gain: 0.16, wet: 0.2 });
      pad(a, t + 0.3, [P(0), P(2), P(3)], { gain: 0.17, attack: 0.25, hold: 0.3, release: 1.0, cutoff: 700, cutoffTo: 1800, wet: 0.3 });
      strike(a, t + 0.5, P(10), KALIMBA, { gain: 0.2, wet: 0.35, pan: 0.25 });
      strike(a, t + 0.58, P(12), KALIMBA, { gain: 0.16, wet: 0.35, pan: -0.25 });
      return end;
    },
  },

  complete: {
    level: -6.8,
    target: -15,
    rule: BIG_RULE,
    haptic: 'success',
    build: (a) => {
      const t = a.t;
      kettleWhistle(a, t, 1.25, 0.28);
      const t0 = t + 0.78;
      feltPiano(a, t0, P(-5), { gain: 0.14, decay: 0.5, wet: 0.25 });
      feltPiano(a, t0, P(0), { gain: 0.16, wet: 0.25 });
      pad(a, t0, [P(0), P(2), P(3)], { gain: 0.15, attack: 0.3, hold: 0.4, release: 1.2, cutoff: 600, cutoffTo: 1700, wet: 0.3 });
      const arp: [number, number][] = [
        [0, 5],
        [0.11, 7],
        [0.22, 8],
        [0.36, 10],
      ];
      let end = t0;
      arp.forEach(([dt, s], i) => {
        const last = i === arp.length - 1;
        end = Math.max(end, strike(a, t0 + dt, P(s), last ? SOFT_BELL : KALIMBA, { gain: last ? 0.75 : 0.62, pan: -0.2 + i * 0.13, wet: 0.3 }));
      });
      return end;
    },
  },
};

export const SFX_NAMES = Object.keys(SFX) as SfxName[];
