/**
 * Shared copy + option metadata for Home, Welcome (onboarding) and Settings.
 * OWNER: home area. Kettle voice (BRIEF §3): warm, short, sentence case.
 */
import type { IconName } from '@/art';
import { AMBIENTS } from '@/audio';
import { DAILY_GOALS, RHYTHMS, type AmbientKind, type RhythmId, type TagId } from '@/state/settings';

export type GoalArt = 'sip' | 'cup' | 'pot' | 'kettle';

export interface GoalOption {
  min: number;
  label: string;
  blurb: string;
  art: GoalArt;
}

const GOAL_EXTRA: Record<number, { blurb: string; art: GoalArt }> = {
  15: { blurb: 'Easing in', art: 'sip' },
  30: { blurb: 'A steady habit', art: 'cup' },
  60: { blurb: 'Serious brewing', art: 'pot' },
  120: { blurb: 'Big focus days', art: 'kettle' },
};

export const GOAL_OPTIONS: GoalOption[] = DAILY_GOALS.map((g) => ({
  min: g.min,
  label: g.label,
  ...(GOAL_EXTRA[g.min] ?? { blurb: '', art: 'cup' as const }),
}));

/** "A cup" for 30, or "45 min" for a custom goal. */
export function goalName(min: number): string {
  return GOAL_OPTIONS.find((g) => g.min === min)?.label ?? `${min} min`;
}

export type PresetRhythmId = Exclude<RhythmId, 'custom'>;

export interface RhythmOption {
  id: PresetRhythmId;
  label: string;
  focusMin: number;
  breakMin: number;
  goodFor: string;
}

export const RHYTHM_OPTIONS: RhythmOption[] = [
  {
    id: 'classic',
    label: RHYTHMS.classic.label,
    focusMin: RHYTHMS.classic.focusMin,
    breakMin: RHYTHMS.classic.shortBreakMin,
    goodFor: 'Good for most days. The tried-and-true rhythm.',
  },
  {
    id: 'deep',
    label: RHYTHMS.deep.label,
    focusMin: RHYTHMS.deep.focusMin,
    breakMin: RHYTHMS.deep.shortBreakMin,
    goodFor: 'Good for big, absorbing work you’d rather not interrupt.',
  },
  {
    id: 'gentle',
    label: RHYTHMS.gentle.label,
    focusMin: RHYTHMS.gentle.focusMin,
    breakMin: RHYTHMS.gentle.shortBreakMin,
    goodFor: 'Good for easing in, low-energy days and tricky starts.',
  },
];

/** Which preset (if any) matches these durations exactly. */
export function matchPreset(v: { focusMin: number; shortBreakMin: number; longBreakMin: number; longBreakEvery: number }): PresetRhythmId | null {
  for (const id of Object.keys(RHYTHMS) as PresetRhythmId[]) {
    const r = RHYTHMS[id];
    if (r.focusMin === v.focusMin && r.shortBreakMin === v.shortBreakMin && r.longBreakMin === v.longBreakMin && r.longBreakEvery === v.longBreakEvery) return id;
  }
  return null;
}

export interface TagOption {
  id: TagId;
  label: string;
  icon: IconName;
}

export const TAG_OPTIONS: TagOption[] = [
  { id: 'work', label: 'Work', icon: 'target' },
  { id: 'study', label: 'Study', icon: 'edit' },
  { id: 'read', label: 'Read', icon: 'info' },
  { id: 'create', label: 'Create', icon: 'sparkle' },
  { id: 'life', label: 'Life', icon: 'home' },
];

export const TAG_LABEL: Record<TagId, string> = Object.fromEntries(TAG_OPTIONS.map((t) => [t.id, t.label])) as Record<TagId, string>;

export interface AmbientOption {
  id: AmbientKind;
  label: string;
  description: string;
  icon: IconName;
}

/** Ambience choices, straight from the audio area's catalog. */
export const AMBIENT_OPTIONS: AmbientOption[] = AMBIENTS.map((a) => ({ id: a.id, label: a.label, description: a.description, icon: a.icon }));

export function ambientName(id: AmbientKind): string {
  return AMBIENT_OPTIONS.find((a) => a.id === id)?.label ?? 'Quiet';
}
