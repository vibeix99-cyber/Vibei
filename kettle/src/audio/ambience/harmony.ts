/**
 * Pure harmony for the lo-fi ambience: chord vocabulary in F major (plus one
 * borrowed bVII colour), progression Markov chain, voicing variation and
 * comping patterns. No WebAudio here — unit-tested. OWNER: audio area.
 */
import { chance, pick, rint, weighted, type Rng } from '../dsp';

export interface Chord {
  name: string;
  /** Bass note (MIDI). */
  bass: number;
  /** Rootless voicing (MIDI), low → high. */
  notes: number[];
  /** Out-of-key colour chord (allowed accidental). */
  borrowed?: boolean;
}

export const CHORDS = {
  Fmaj9: { name: 'Fmaj9', bass: 41, notes: [57, 60, 64, 67] },
  Dm9: { name: 'Dm9', bass: 38, notes: [53, 57, 60, 64] },
  Gm9: { name: 'Gm9', bass: 43, notes: [58, 62, 65, 69] },
  C13: { name: 'C13', bass: 36, notes: [58, 62, 64, 69] },
  C9sus: { name: 'C9sus', bass: 36, notes: [58, 62, 65, 67] },
  Bbmaj9: { name: 'Bbmaj9', bass: 46, notes: [57, 60, 62, 65] },
  Am7: { name: 'Am7', bass: 45, notes: [55, 60, 64, 69] },
  Ebmaj9: { name: 'Ebmaj9', bass: 39, notes: [55, 58, 62, 65], borrowed: true },
} satisfies Record<string, Chord>;

export type ChordName = keyof typeof CHORDS;

export const PROGRESSIONS: ChordName[][] = [
  ['Fmaj9', 'Dm9', 'Gm9', 'C13'],
  ['Bbmaj9', 'Am7', 'Gm9', 'C9sus'],
  ['Fmaj9', 'Am7', 'Bbmaj9', 'C9sus'],
  ['Dm9', 'Gm9', 'Fmaj9', 'Bbmaj9'],
  ['Gm9', 'C13', 'Fmaj9', 'Dm9'],
  ['Bbmaj9', 'Ebmaj9', 'Fmaj9', 'Fmaj9'],
  ['Dm9', 'Bbmaj9', 'Fmaj9', 'C9sus'],
];

/** F major pitch classes. */
export const F_MAJOR_PCS = [5, 7, 9, 10, 0, 2, 4];

/** Picks the next progression index, never repeating the last two. */
export function nextProgression(rng: Rng, history: number[]): number {
  const recent = history.slice(-2);
  const options = PROGRESSIONS.map((_, i) => i).filter((i) => !recent.includes(i));
  // The borrowed-colour progression is a rarer treat.
  return weighted(
    rng,
    options.map((i) => [i, i === 5 ? 0.4 : 1] as const),
  );
}

/** Slightly different voicing each time: inversions, drops, an added top. */
export function voice(rng: Rng, c: Chord): number[] {
  let n = c.notes.slice();
  // Lean upward (lifts the keys out of the mud and onto small speakers).
  if (chance(rng, 0.45)) {
    const low = n[0]! + 12;
    if (low <= 76) n = [...n.slice(1), low].sort((a, b) => a - b);
  } else if (chance(rng, 0.25)) {
    // Or move the top voice down an octave (inversion) if it stays in range.
    const top = n[n.length - 1]! - 12;
    if (top >= 52) n = [top, ...n.slice(0, -1)].sort((a, b) => a - b);
  }
  if (chance(rng, 0.2) && n.length > 3) n.splice(rint(rng, 1, n.length - 2), 1);
  return n;
}

export interface Hit {
  /** Beat offset within the bar (0..4), before swing. */
  beat: number;
  /** Duration in beats. */
  dur: number;
  vel: number;
}

/** One-bar comping patterns (4/4). */
export const PATTERNS: Hit[][] = [
  [{ beat: 0, dur: 4, vel: 0.6 }],
  [
    { beat: 0, dur: 2.4, vel: 0.62 },
    { beat: 2.5, dur: 1.5, vel: 0.48 },
  ],
  [
    { beat: 0, dur: 1.4, vel: 0.6 },
    { beat: 1.5, dur: 2.5, vel: 0.5 },
  ],
  [
    { beat: 0, dur: 3, vel: 0.58 },
    { beat: 3.5, dur: 0.5, vel: 0.4 },
  ],
];

/** Swing an eighth-note position (0.5 → ~0.58) for a lazy lo-fi feel. */
export function swing(beat: number, amount = 0.58): number {
  const whole = Math.floor(beat);
  const frac = beat - whole;
  return Math.abs(frac - 0.5) < 1e-6 ? whole + amount : beat;
}

/** A short pentatonic melody fragment (MIDI) — C5..D6 range, stepwise-ish. */
export function melody(rng: Rng, len: number): { beat: number; midi: number; dur: number }[] {
  const scale = [72, 74, 77, 79, 81, 84, 86]; // C5 D5 F5 G5 A5 C6 D6
  let idx = rint(rng, 1, scale.length - 2);
  const positions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5];
  const start = pick(rng, [0, 1, 2]);
  const out: { beat: number; midi: number; dur: number }[] = [];
  for (let i = 0; i < len && start + i < positions.length; i++) {
    idx = Math.max(0, Math.min(scale.length - 1, idx + pick(rng, [-2, -1, -1, 1, 1, 0])));
    out.push({ beat: positions[start + i]!, midi: scale[idx]!, dur: i === len - 1 ? 1.5 : 0.5 });
  }
  return out;
}
