import { useEffect, useState } from 'react';
import { clock } from '@/lib/clock';

/** `clock.now()` that re-renders every `intervalMs` and whenever the debug clock jumps. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => {
    const update = () => setNow(clock.now());
    const id = setInterval(update, intervalMs);
    const off = clock.onJump(update);
    return () => {
      clearInterval(id);
      off();
    };
  }, [intervalMs]);
  return now;
}
