/**
 * The single source of "now" for the whole app.
 * Everything time-related MUST read time through `clock.now()` so that tests
 * and the debug API can fast-forward time deterministically.
 */
type Listener = () => void;

let offsetMs = 0;
const listeners = new Set<Listener>();

export const clock = {
  /** Wall-clock epoch ms (Date.now() + debug offset). */
  now(): number {
    return Date.now() + offsetMs;
  },
  /** Debug/testing only: jump the clock forward. Notifies listeners. */
  advance(ms: number): void {
    offsetMs += ms;
    listeners.forEach((l) => l());
  },
  /** Debug/testing only: reset the offset. */
  reset(): void {
    offsetMs = 0;
    listeners.forEach((l) => l());
  },
  get offset(): number {
    return offsetMs;
  },
  /** Called whenever the clock jumps (not on natural passage of time). */
  onJump(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
