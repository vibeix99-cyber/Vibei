/**
 * Ambience catalog for the picker. Prefers the audio area's `AMBIENTS` export
 * when it exists; falls back to a local list with the same ids.
 */
import * as audioModule from '@/audio';
import type { IconName } from '@/art';
import type { AmbientKind } from '@/state/settings';
import type { SceneWeather } from '@/scene';

export interface AmbientOption {
  id: AmbientKind;
  label: string;
  hint: string;
  icon: IconName;
}

const LOCAL: AmbientOption[] = [
  { id: 'rain', label: 'Rain', hint: 'Soft rain on the window', icon: 'rain' },
  { id: 'fire', label: 'Fireplace', hint: 'A slow, crackling fire', icon: 'fire' },
  { id: 'forest', label: 'Forest', hint: 'Wind moving through trees', icon: 'forest' },
  { id: 'brown', label: 'Brown noise', hint: 'A deep, steady hush', icon: 'wave' },
  { id: 'lofi', label: 'Lo-fi keys', hint: 'Gentle, sleepy chords', icon: 'music' },
  { id: 'none', label: 'Quiet', hint: 'Just the kettle', icon: 'mute' },
];

const ICON_FOR: Record<AmbientKind, IconName> = {
  rain: 'rain',
  fire: 'fire',
  forest: 'forest',
  brown: 'wave',
  lofi: 'music',
  none: 'mute',
};

type Loose = { id?: string; kind?: string; label?: string; name?: string; hint?: string; description?: string; icon?: string };

function fromAudio(): AmbientOption[] | null {
  const list = (audioModule as unknown as { AMBIENTS?: unknown }).AMBIENTS;
  if (!Array.isArray(list) || list.length === 0) return null;
  const out: AmbientOption[] = [];
  for (const raw of list as Loose[]) {
    const id = (raw.id ?? raw.kind) as AmbientKind | undefined;
    if (!id) continue;
    const local = LOCAL.find((l) => l.id === id);
    out.push({
      id,
      label: raw.label ?? raw.name ?? local?.label ?? id,
      hint: raw.hint ?? raw.description ?? local?.hint ?? '',
      icon: (raw.icon as IconName | undefined) ?? ICON_FOR[id] ?? 'sound',
    });
  }
  if (!out.some((o) => o.id === 'none')) out.push(LOCAL[LOCAL.length - 1]);
  return out;
}

export function ambientOptions(): AmbientOption[] {
  return fromAudio() ?? LOCAL;
}

export function ambientOption(id: AmbientKind): AmbientOption {
  return ambientOptions().find((o) => o.id === id) ?? LOCAL[0];
}

/** The nook's window matches what you hear. */
export function weatherFor(kind: AmbientKind): SceneWeather {
  if (kind === 'rain' || kind === 'lofi') return 'rain';
  if (kind === 'fire') return 'snow';
  return 'clear';
}
