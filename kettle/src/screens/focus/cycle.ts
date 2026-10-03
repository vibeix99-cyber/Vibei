/** Pure helpers for the session screen (cycle dots, status and meta copy). */

export type View = 'focus' | 'whistle' | 'summary' | 'break' | 'over' | 'none';

/** Gentle status line under the countdown, by how far the brew has come. */
export function focusStatus(progress: number, remainingMs: number): string {
  if (remainingMs <= 60_000) return 'Almost whistling…';
  if (progress < 0.06) return 'Kettle’s on. Nice start.';
  if (progress < 0.34) return 'Kettle’s warming up…';
  if (progress < 0.8) return 'Deep in it. Nice.';
  return 'Nearly there…';
}

const clockFmt = typeof Intl !== 'undefined' ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }) : null;
/** "3:35 PM" (the user's locale): the exact moment the kettle will whistle. */
export function wallClock(ts: number): string {
  return clockFmt ? clockFmt.format(ts) : new Date(ts).toTimeString().slice(0, 5);
}

/**
 * The small line under the status: minutes brewed so far and when it whistles (the countdown stays the exact
 * reference; this just answers "how far am I, and when is it done?"). Added time says what the brew now is.
 */
export function focusMeta(o: { brewedMs: number; remainingMs: number; plannedMs: number; addedMs: number; paused: boolean; now: number }): string {
  const brewed = Math.floor(Math.max(0, o.brewedMs) / 60_000);
  const brewedText = `${brewed} min brewed`;
  if (o.paused) return brewed > 0 ? `${brewedText} so far` : 'Nothing lost: pick up where you left off';
  if (o.addedMs > 0) return `${brewedText} · now a ${Math.round(o.plannedMs / 60_000)} min brew`;
  const at = `whistles at ${wallClock(o.now + Math.max(0, o.remainingMs))}`;
  return brewed > 0 ? `${brewedText} · ${at}` : at.charAt(0).toUpperCase() + at.slice(1);
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
    case 'summary':
      return { filled, current: 0, label: done >= every ? 'Long tea break earned' : `Brew ${done} of ${every} done` };
    case 'break':
      return isLong ? { filled: every, current: 0, label: `${every} of ${every} brewed` } : { filled, current: 0, label: `${done} of ${every} brewed` };
    default:
      return done < every
        ? { filled, current: done + 1, label: `Next: brew ${done + 1} of ${every}` }
        : { filled, current: 0, label: 'Long tea break next' };
  }
}
