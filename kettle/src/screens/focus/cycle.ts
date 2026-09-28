/** Pure helpers for the focus screen (cycle dots, status copy). */

export type View = 'focus' | 'whistle' | 'break' | 'over' | 'none';

/** Gentle status line under the timer, by how far the brew has come. */
export function focusStatus(progress: number, remainingMs: number): string {
  if (remainingMs <= 60_000) return 'Almost whistling…';
  if (progress < 0.34) return 'Kettle’s warming up…';
  if (progress < 0.8) return 'Deep in it. Nice.';
  return 'Nearly there…';
}

export interface CycleInfo {
  /** Filled dots. */
  filled: number;
  /** 1-based dot shown as "in progress" (0 = none). */
  current: number;
  label: string;
}

/**
 * Cycle dots + label ("Brew 2 of 4"). `done` = completed brews since the last long break
 * (a skipped long break stays owed, so it can exceed `every`).
 */
export function cycleInfo(view: View, done: number, every: number, isLong: boolean): CycleInfo {
  const filled = Math.min(every, done);
  switch (view) {
    case 'focus':
      return done < every
        ? { filled, current: done + 1, label: `Brew ${done + 1} of ${every}` }
        : { filled, current: 0, label: 'Long tea break next' };
    case 'whistle':
      return { filled, current: 0, label: done >= every ? 'Long tea break earned' : `Brew ${done} of ${every} done` };
    case 'break':
      return isLong ? { filled: every, current: 0, label: `${every} of ${every} brewed` } : { filled, current: 0, label: `${done} of ${every} brewed` };
    default:
      return done < every
        ? { filled, current: done + 1, label: `Next: brew ${done + 1} of ${every}` }
        : { filled, current: 0, label: 'Long tea break next' };
  }
}
