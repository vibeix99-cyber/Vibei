/**
 * Choreography helpers for the celebration: timed beats and count-ups.
 * Everything cancels on unmount, so skipping ahead never leaves stray sounds.
 */
import { useEffect, useRef, useState } from 'react';
import { audio, type SfxName } from '@/audio';

/** Returns how many of `times` (ms after `active` turns true) have passed. */
export function useBeat(active: boolean, times: number[]): number {
  const [n, setN] = useState(0);
  const key = times.join(',');
  useEffect(() => {
    if (!active) return;
    setN(0);
    const ids = times.map((t, i) => window.setTimeout(() => setN((x) => Math.max(x, i + 1)), t));
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key]);
  return n;
}

/** Fire side effects (sounds, haptics) at times after `active`. */
export function useCues(active: boolean, cues: [number, () => void][]): void {
  const ref = useRef(cues);
  ref.current = cues;
  useEffect(() => {
    if (!active) return;
    const ids = ref.current.map(([t, fn]) => window.setTimeout(fn, t));
    return () => ids.forEach(clearTimeout);
  }, [active]);
}

/** Throttled rising tick player for count-ups (pentatonic steps, always in key; no haptic per tick). */
export function makeTicker(sfx: SfxName = 'leaf', { gapMs = 70, steps = 7, volume = 0.7 } = {}) {
  let last = 0;
  return (progress: number) => {
    const now = performance.now();
    if (now - last < gapMs) return;
    last = now;
    audio.play(sfx, { step: Math.round(progress * steps), volume, haptic: false });
  };
}
