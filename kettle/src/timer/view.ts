/**
 * Render-friendly timer snapshots. OWNER: timer area.
 *
 * The ticker publishes a new `TimerView` only when something a user can see
 * changes: the displayed second, status, phase, session or planned length.
 * `useRemaining()`, the tab title, favicon, media session and screen-reader
 * announcer all read from here, so nothing re-renders 5×/s.
 */
import { clock } from '@/lib/clock';
import { isDue, progressAt, remainingAt, useTimer } from './store';
import type { TimerState, TimerView } from './types';

export function computeView(s: TimerState, now: number): TimerView {
  const remainingMs = remainingAt(s, now);
  return {
    status: s.status,
    phase: s.phase,
    sessionId: s.sessionId,
    plannedMs: s.plannedMs,
    remainingMs,
    seconds: Math.ceil(remainingMs / 1000),
    progress: progressAt(s, now),
    due: isDue(s, now),
  };
}

export function sameView(a: TimerView, b: TimerView): boolean {
  return (
    a.status === b.status &&
    a.phase === b.phase &&
    a.sessionId === b.sessionId &&
    a.plannedMs === b.plannedMs &&
    a.seconds === b.seconds &&
    a.due === b.due
  );
}

let current: TimerView = computeView(useTimer.getState(), clock.now());
const listeners = new Set<(view: TimerView, prev: TimerView) => void>();

export function getTimerView(): TimerView {
  return current;
}

/** Called whenever the displayed timer changes (≤ once per second while running). */
export function subscribeTimerView(fn: (view: TimerView, prev: TimerView) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Recompute the view; notify only if something visible changed. Returns the current view. */
export function publishView(now: number = clock.now()): TimerView {
  const next = computeView(useTimer.getState(), now);
  if (sameView(current, next)) return current;
  const prev = current;
  current = next;
  listeners.forEach((fn) => {
    try {
      fn(next, prev);
    } catch (err) {
      console.error('[timer] view listener threw', err);
    }
  });
  return current;
}
