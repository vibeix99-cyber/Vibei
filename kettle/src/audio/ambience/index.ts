/**
 * Ambience catalog + factory. OWNER: audio area.
 */
import type { AmbientKind } from '@/state/settings';
import type { IconName } from '@/art';
import { dbToGain } from '../dsp';
import { noiseReady, prepareNoise, type NoiseSpec } from '../instruments';
import type { AmbientDest, AmbientVoice } from './common';
import { Brown, Fire, Forest, Rain } from './nature';
import { Lofi } from './lofi';
import { Simmer } from './simmer';

export type { AmbientVoice, AmbientDest } from './common';
export { Simmer };

export interface AmbientInfo {
  id: AmbientKind;
  label: string;
  icon: IconName;
  description: string;
}

/** For pickers (focus screen, settings). Order = display order. */
export const AMBIENTS: readonly AmbientInfo[] = [
  { id: 'rain', label: 'Rain', icon: 'rain', description: 'Soft rain on the window, drips on the sill.' },
  { id: 'fire', label: 'Fireside', icon: 'fire', description: 'A crackling fire and the odd gentle pop.' },
  { id: 'forest', label: 'Forest', icon: 'forest', description: 'Wind in the leaves, birds far off.' },
  { id: 'brown', label: 'Brown noise', icon: 'wave', description: 'A deep, smooth hush for tuning out.' },
  { id: 'lofi', label: 'Lo-fi keys', icon: 'music', description: 'Mellow piano chords that never quite repeat.' },
  { id: 'none', label: 'Quiet', icon: 'mute', description: 'Just you and the kettle.' },
];

/**
 * Per-ambience output trim (dB) so every bed sits at a similar, comfortable
 * loudness. Calibrated with scripts/audio-check.mjs — see docs/areas/audio.md.
 */
export const AMBIENT_LEVELS: Record<Exclude<AmbientKind, 'none'>, { level: number; target: number }> = {
  rain: { level: 4.4, target: -16 },
  fire: { level: 11.7, target: -16 },
  forest: { level: 9.7, target: -17 },
  brown: { level: -2.9, target: -17 },
  lofi: { level: 14.4, target: -16 },
};

export const SIMMER_LEVEL = { level: 1.1, target: -30 };

export function createAmbient(kind: Exclude<AmbientKind, 'none'>, d: AmbientDest): AmbientVoice {
  switch (kind) {
    case 'rain':
      return new Rain(d);
    case 'fire':
      return new Fire(d);
    case 'forest':
      return new Forest(d);
    case 'brown':
      return new Brown(d);
    case 'lofi':
      return new Lofi(d);
  }
}

/** Linear trim for an ambience. */
export function ambientTrim(kind: Exclude<AmbientKind, 'none'>): number {
  return dbToGain(AMBIENT_LEVELS[kind].level);
}

/**
 * The long noise beds each voice loops (must mirror the `loopNoise` calls in
 * its `start`; ambience.test.ts checks). They're generated ahead of time in
 * small slices so starting an ambience never blocks the main thread; a bed
 * missing here still works, it's just generated synchronously on start.
 */
const BEDS: Record<Exclude<AmbientKind, 'none'> | 'simmer', readonly NoiseSpec[]> = {
  rain: [
    { kind: 'pink', seconds: 9.7, seed: 21 },
    { kind: 'white', seconds: 7.3, seed: 22 },
    { kind: 'brown', seconds: 8.9, seed: 23 },
  ],
  fire: [
    { kind: 'brown', seconds: 8.9, seed: 31 },
    { kind: 'pink', seconds: 9.7, seed: 32 },
  ],
  forest: [
    { kind: 'pink', seconds: 9.7, seed: 41 },
    { kind: 'brown', seconds: 8.9, seed: 42 },
    { kind: 'white', seconds: 7.3, seed: 43 },
  ],
  brown: [
    { kind: 'brown', seconds: 11.3, seed: 51 },
    { kind: 'brown', seconds: 8.9, seed: 52 },
  ],
  lofi: [{ kind: 'pink', seconds: 9.7, seed: 61 }],
  simmer: [
    { kind: 'brown', seconds: 8.9, seed: 71 },
    { kind: 'pink', seconds: 9.7, seed: 72 },
  ],
};

/** True when `kind` can start without generating anything on the main thread. */
export function voiceReady(ctx: BaseAudioContext, kind: keyof typeof BEDS): boolean {
  return noiseReady(ctx, BEDS[kind]);
}

/** Generate `kind`'s noise beds in small slices (idempotent, deduped). */
export function prepareVoice(ctx: BaseAudioContext, kind: keyof typeof BEDS): Promise<void> {
  return prepareNoise(ctx, BEDS[kind]);
}
