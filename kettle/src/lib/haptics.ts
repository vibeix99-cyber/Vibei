/**
 * Haptic feedback (Vibration API — Android Chrome & friends). OWNER: audio area.
 *
 * No-ops where unsupported, when disabled in settings, before the user has
 * interacted with the page (browsers block it and log an intervention), and
 * while the page is hidden. Rapid calls are throttled so count-ups never buzz.
 *
 * Kinds (patterns are ms on/off; kept short and soft — "cozy", not buzzy):
 *   light      every button press / chip
 *   soft       gentle dismiss / cancel
 *   medium     pause-resume, quest tin opening, break over
 *   tick       count-up ticks (heavily throttled)
 *   start      put the kettle on: click… then a warm rise
 *   success    session complete, streak, badge
 *   celebrate  level up
 *   warning    confirm-to-quit sheets
 *   error      something went wrong
 */
import { getSettings } from '@/state/settings';

export type HapticKind = 'light' | 'soft' | 'medium' | 'tick' | 'start' | 'success' | 'celebrate' | 'warning' | 'error';

export const HAPTIC_PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  soft: 6,
  medium: 14,
  tick: 5,
  start: [10, 70, 18],
  success: [14, 70, 26],
  celebrate: [16, 60, 16, 60, 34],
  warning: [18, 50, 18],
  error: [24, 60, 24],
};

/** Minimum ms between haptics of the same kind (ticks are the chatty ones). */
const MIN_GAP: Partial<Record<HapticKind, number>> = { tick: 90, light: 40, soft: 40 };
/** Bigger moments shouldn't be clobbered by a light tap right after them. */
const PRIORITY: Record<HapticKind, number> = {
  tick: 0,
  soft: 1,
  light: 1,
  medium: 2,
  warning: 3,
  error: 3,
  start: 3,
  success: 4,
  celebrate: 5,
};

let lastAt = 0;
let lastKind: HapticKind | null = null;
let lastUntil = 0;

function patternMs(p: number | number[]): number {
  return Array.isArray(p) ? p.reduce((a, b) => a + b, 0) : p;
}

/** Pure decision helper (exported for tests). */
export function shouldBuzz(kind: HapticKind, now: number, state = { lastAt, lastKind, lastUntil }): boolean {
  const gap = MIN_GAP[kind] ?? 0;
  if (state.lastKind === kind && now - state.lastAt < gap) return false;
  // Don't cut off a more important pattern that is still playing.
  if (state.lastKind && now < state.lastUntil && PRIORITY[kind] < PRIORITY[state.lastKind]) return false;
  return true;
}

export function haptic(kind: HapticKind = 'light'): void {
  try {
    if (!getSettings().haptics) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua && !ua.hasBeenActive) return;
    const now = performance.now();
    if (!shouldBuzz(kind, now)) return;
    const pattern = HAPTIC_PATTERNS[kind];
    navigator.vibrate(pattern);
    lastAt = now;
    lastKind = kind;
    lastUntil = now + patternMs(pattern);
  } catch {
    /* ignore */
  }
}
