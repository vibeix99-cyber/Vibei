/**
 * Drives `tick()` and exposes a `useRemaining` hook.
 * OWNER: timer area — upgrade to a Worker-backed ticker, multi-tab leader
 * election, notifications, wake lock, title/favicon, media session, etc.
 */
import { useEffect, useState } from 'react';
import { clock } from '@/lib/clock';
import { useTimer, remainingAt, progressAt } from './store';

let started = false;

export function initTimer(): void {
  if (started) return;
  started = true;
  const tick = () => useTimer.getState().tick();
  // Complete anything that finished while the app was closed.
  tick();
  setInterval(tick, 250);
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('focus', tick);
  clock.onJump(tick);
}

/** Re-renders roughly every `intervalMs` while the timer runs; returns remaining ms. */
export function useRemaining(intervalMs = 200): { remainingMs: number; progress: number } {
  const state = useTimer();
  const [, force] = useState(0);
  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => force((n) => n + 1), intervalMs);
    const off = clock.onJump(() => force((n) => n + 1));
    return () => {
      clearInterval(id);
      off();
    };
  }, [state.status, intervalMs]);
  const now = clock.now();
  return { remainingMs: remainingAt(state, now), progress: progressAt(state, now) };
}
