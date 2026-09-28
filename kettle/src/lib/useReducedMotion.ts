import { useSyncExternalStore } from 'react';
import { useSettings } from '@/state/settings';

const query = '(prefers-reduced-motion: reduce)';

function subscribe(cb: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(query);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}
const getSnapshot = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;

/** True when motion should be reduced (system preference or user setting). */
export function useReducedMotion(): boolean {
  const system = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const pref = useSettings((s) => s.motion);
  if (pref === 'reduce') return true;
  if (pref === 'full') return false;
  return system;
}
