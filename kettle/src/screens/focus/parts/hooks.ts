import { useEffect, useState } from 'react';

/** True while the page is visible (tab in front). */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return visible;
}

/**
 * Zen: after `delayMs` without pointer/keyboard activity, returns true so the
 * screen can fade secondary chrome. Any activity (or focus moving) wakes it.
 */
export function useZen(enabled: boolean, delayMs = 7000): boolean {
  const [zen, setZen] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setZen(false);
      return;
    }
    let t: ReturnType<typeof setTimeout> | undefined;
    const wake = () => {
      setZen(false);
      if (t) clearTimeout(t);
      t = setTimeout(() => setZen(true), delayMs);
    };
    wake();
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'focusin'] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    document.addEventListener('visibilitychange', wake);
    return () => {
      if (t) clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, wake));
      document.removeEventListener('visibilitychange', wake);
    };
  }, [enabled, delayMs]);
  return zen;
}
