/**
 * User settings — persisted. Shared contract: add fields, never rename without
 * a migration (bump `version` and handle it in `migrate`).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage, STORAGE_PREFIX } from '@/lib/storage';

export type AmbientKind = 'none' | 'rain' | 'fire' | 'forest' | 'brown' | 'lofi';
export type ThemePref = 'auto' | 'light' | 'dark';
export type MotionPref = 'system' | 'reduce' | 'full';
export type ScenePref = 'auto' | 'high' | 'low' | 'off';
export type RhythmId = 'classic' | 'deep' | 'gentle' | 'custom';
export type TagId = 'work' | 'study' | 'read' | 'create' | 'life';

export interface Rhythm {
  id: RhythmId;
  label: string;
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakEvery: number;
}

export const RHYTHMS: Record<Exclude<RhythmId, 'custom'>, Rhythm> = {
  classic: { id: 'classic', label: 'Classic', focusMin: 25, shortBreakMin: 5, longBreakMin: 15, longBreakEvery: 4 },
  deep: { id: 'deep', label: 'Deep', focusMin: 50, shortBreakMin: 10, longBreakMin: 20, longBreakEvery: 3 },
  gentle: { id: 'gentle', label: 'Gentle', focusMin: 15, shortBreakMin: 3, longBreakMin: 10, longBreakEvery: 4 },
};

export const DAILY_GOALS = [
  { min: 15, label: 'A sip' },
  { min: 30, label: 'A cup' },
  { min: 60, label: 'A pot' },
  { min: 120, label: 'A whole kettle' },
] as const;

export interface Settings {
  // identity / onboarding
  name: string;
  onboarded: boolean;
  /** Started with a first brew straight from the welcome: the optional setup is still on offer. */
  setupPending: boolean;
  // rhythm
  rhythm: RhythmId;
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakEvery: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  // goal
  dailyGoalMin: number;
  // sound
  muted: boolean;
  masterVolume: number; // 0..1
  sfxVolume: number; // 0..1
  ambientVolume: number; // 0..1
  ambient: AmbientKind;
  // device
  notifications: boolean;
  keepAwake: boolean;
  haptics: boolean;
  // look & feel
  theme: ThemePref;
  motion: MotionPref;
  scene: ScenePref;
  // last used intention/tag (prefill)
  lastTag: TagId | null;
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  onboarded: false,
  setupPending: false,
  rhythm: 'classic',
  ...pickRhythm('classic'),
  autoStartBreaks: true,
  autoStartFocus: false,
  dailyGoalMin: 30,
  muted: false,
  masterVolume: 0.8,
  sfxVolume: 0.7,
  ambientVolume: 0.6,
  ambient: 'rain',
  notifications: false,
  keepAwake: true,
  haptics: true,
  theme: 'auto',
  motion: 'system',
  scene: 'auto',
  lastTag: null,
};

function pickRhythm(id: Exclude<RhythmId, 'custom'>) {
  const { focusMin, shortBreakMin, longBreakMin, longBreakEvery } = RHYTHMS[id];
  return { focusMin, shortBreakMin, longBreakMin, longBreakEvery };
}

interface SettingsActions {
  set: (patch: Partial<Settings>) => void;
  applyRhythm: (id: Exclude<RhythmId, 'custom'>) => void;
  reset: () => void;
}

export const useSettings = create<Settings & SettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (patch) => set(patch),
      applyRhythm: (id) => set({ rhythm: id, ...pickRhythm(id) }),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: `${STORAGE_PREFIX}settings`,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { set: _s, applyRhythm: _a, reset: _r, ...rest } = s;
        return rest;
      },
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<Settings>) }),
    },
  ),
);

/** Non-hook accessor for modules outside React. */
export const getSettings = (): Settings => useSettings.getState();
