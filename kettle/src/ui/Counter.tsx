/**
 * Animated count-up number (fixed-width digits, so no jitter). OWNER: design-system area.
 * `onTick` fires on each whole-number step — hook a sound to it (throttle in the caller
 * if you like). Reduced motion: shows the final value at once.
 *
 *   <Counter value={42} format={(n) => `+${n}`} onTick={() => audio.play('leaf')} />
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { Digits } from './Digits';

export interface CounterProps {
  value: number;
  /** Starting value on mount. Default 0. Later changes animate from the current display. */
  from?: number;
  /** ms. Default scales with the distance (450–1400). */
  duration?: number;
  /** ms before counting starts. */
  delay?: number;
  format?: (n: number) => string;
  onTick?: (n: number) => void;
  onDone?: () => void;
  className?: string;
  style?: CSSProperties;
  font?: 'display' | 'body';
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const defaultFormat = (n: number) => n.toLocaleString();

export function Counter({ value, from = 0, duration, delay = 0, format = defaultFormat, onTick, onDone, className, style, font }: CounterProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : from);
  const shown = useRef(reduced ? value : from);
  const cbs = useRef({ onTick, onDone });
  cbs.current = { onTick, onDone };

  useEffect(() => {
    const start = shown.current;
    if (reduced || start === value) {
      shown.current = value;
      setDisplay(value);
      cbs.current.onDone?.();
      return;
    }
    const dist = Math.abs(value - start);
    const dur = duration ?? Math.min(1400, 450 + dist * 18);
    let raf = 0;
    let t0 = 0;
    let last = Math.round(start);
    const timeout = window.setTimeout(() => {
      const step = (now: number) => {
        if (!t0) t0 = now;
        const p = Math.min(1, (now - t0) / dur);
        const n = Math.round(start + (value - start) * easeOut(p));
        shown.current = n;
        if (n !== last) {
          last = n;
          setDisplay(n);
          cbs.current.onTick?.(n);
        }
        if (p < 1) raf = requestAnimationFrame(step);
        else cbs.current.onDone?.();
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [value, reduced, duration, delay]);

  return <Digits value={format(display)} label={format(value)} className={className} style={style} font={font} />;
}
