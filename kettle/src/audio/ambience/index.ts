/**
 * Ambience catalog + factory. OWNER: audio area.
 */
import type { AmbientKind } from '@/state/settings';
import type { IconName } from '@/art';
import { dbToGain } from '../dsp';
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
  fire: { level: 11.2, target: -16 },
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
