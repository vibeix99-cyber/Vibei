/**
 * Reactive "today" and "hour" for progress hooks: re-render at local
 * midnight / on the hour and whenever the debug clock jumps, so streaks,
 * goals and recipes roll over without a reload. DST-safe (uses local Date).
 */
import { useSyncExternalStore } from 'react';
import { clock } from '@/lib/clock';
import { todayKey, type DayKey } from '@/lib/dates';

type Cb = () => void;

function msToNextHour(now: number): number {
  const d = new Date(now);
  d.setMinutes(60, 0, 0); // local next hour boundary (handles DST shifts)
  return Math.max(250, d.getTime() - now + 50);
}

const listeners = new Set<Cb>();
let timer: ReturnType<typeof setTimeout> | null = null;
let offJump: (() => void) | null = null;

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    listeners.forEach((l) => l());
    schedule();
  }, msToNextHour(clock.now()));
}

function subscribe(cb: Cb): () => void {
  listeners.add(cb);
  if (listeners.size === 1) {
    schedule();
    offJump = clock.onJump(() => {
      listeners.forEach((l) => l());
      schedule();
    });
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer);
      timer = null;
      offJump?.();
      offJump = null;
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

function onVisible() {
  // Timers are throttled in background tabs; catch up when shown again.
  if (document.visibilityState === 'visible') {
    listeners.forEach((l) => l());
    schedule();
  }
}

/** Today's local day key; updates at midnight. */
export function useDayKey(): DayKey {
  return useSyncExternalStore(subscribe, todayKey, todayKey);
}

const hourNow = () => new Date(clock.now()).getHours();

/** Current local hour (0–23); updates on the hour. */
export function useHour(): number {
  return useSyncExternalStore(subscribe, hourNow, hourNow);
}
