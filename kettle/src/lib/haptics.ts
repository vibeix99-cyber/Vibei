/** Haptic feedback (Android/Chrome vibrate). OWNER: audio area. No-ops where unsupported or disabled. */
import { getSettings } from '@/state/settings';

export type HapticKind = 'light' | 'medium' | 'success' | 'warning';

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 16,
  success: [12, 60, 24],
  warning: [20, 40, 20],
};

export function haptic(kind: HapticKind = 'light'): void {
  if (!getSettings().haptics) return;
  try {
    navigator.vibrate?.(PATTERNS[kind]);
  } catch {
    /* ignore */
  }
}
