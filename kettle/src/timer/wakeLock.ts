/**
 * Screen wake lock while a phase is running (settings.keepAwake). OWNER: timer area.
 * Re-acquired when the tab becomes visible again (the browser drops it when
 * hidden); released on pause, idle, or when the setting is turned off.
 */
import { useSettings } from '@/state/settings';
import { useTimer } from './store';

interface Sentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', fn: () => void): void;
}
interface WakeLockApi {
  request(type: 'screen'): Promise<Sentinel>;
}

/** Pure rule — unit tested. */
export function wantsWakeLock(status: string, keepAwake: boolean, visible: boolean): boolean {
  return status === 'running' && keepAwake && visible;
}

let sentinel: Sentinel | null = null;
let requesting = false;
let started = false;

function api(): WakeLockApi | null {
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { wakeLock?: WakeLockApi }) : null;
  return nav?.wakeLock ?? null;
}

function evaluate(): void {
  const wl = api();
  if (!wl) return;
  const want = wantsWakeLock(useTimer.getState().status, useSettings.getState().keepAwake, document.visibilityState === 'visible');
  if (want && !sentinel && !requesting) {
    requesting = true;
    wl.request('screen')
      .then((s) => {
        requesting = false;
        sentinel = s;
        s.addEventListener('release', () => {
          if (sentinel === s) sentinel = null;
        });
        // State may have changed while we waited.
        if (!wantsWakeLock(useTimer.getState().status, useSettings.getState().keepAwake, document.visibilityState === 'visible')) evaluate();
      })
      .catch(() => {
        requesting = false; // not allowed right now (hidden, battery saver…) — try again on the next change
      });
  } else if (!want && sentinel) {
    const s = sentinel;
    sentinel = null;
    void s.release().catch(() => {});
  }
}

export function isWakeLockHeld(): boolean {
  return !!sentinel && !sentinel.released;
}

export function initWakeLock(): void {
  if (started || typeof document === 'undefined') return;
  started = true;
  useTimer.subscribe((s, p) => {
    if (s.status !== p.status) evaluate();
  });
  useSettings.subscribe((s, p) => {
    if (s.keepAwake !== p.keepAwake) evaluate();
  });
  document.addEventListener('visibilitychange', evaluate);
  evaluate();
}
