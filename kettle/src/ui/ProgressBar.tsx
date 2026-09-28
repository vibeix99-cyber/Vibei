/**
 * Chunky progress bar: rounded, inner highlight stripe, springy fill with a sheen
 * that sweeps across whenever progress grows. OWNER: design-system area.
 * Reduced motion: no sheen, near-instant fill.
 */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cx, type Tone } from './util';
import s from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number; // 0..1
  tone?: Tone;
  /** Bar height in px. Default 16. */
  height?: number;
  /** Accessible label. */
  label?: string;
  /** Human text for screen readers, e.g. "12 of 30 minutes". */
  valueText?: string;
  className?: string;
  /** Grow from 0 on first mount. Default true. */
  animateIn?: boolean;
  /** Continuous gentle shimmer (e.g. an active goal). Default false. */
  shimmer?: boolean;
  /** Track color: 'default' (oat) or 'surface' (for use on tinted cards). */
  track?: 'default' | 'surface';
}

export function ProgressBar({
  value,
  tone = 'matcha',
  height = 16,
  label,
  valueText,
  className,
  animateIn = true,
  shimmer,
  track = 'default',
}: ProgressBarProps) {
  const reduced = useReducedMotion();
  const v = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const [shown, setShown] = useState(animateIn && !reduced ? 0 : v);
  const [sheenKey, setSheenKey] = useState(0);
  const prev = useRef(shown);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(v));
    return () => cancelAnimationFrame(id);
  }, [v]);
  useEffect(() => {
    if (shown > prev.current + 0.001 && !reduced) setSheenKey((k) => k + 1);
    prev.current = shown;
  }, [shown, reduced]);

  return (
    <div
      className={cx(s.track, track === 'surface' && s.onTint, reduced && s.reduced, className)}
      style={{ height, ['--h' as string]: `${height}px` }}
      data-tone={tone}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-valuetext={valueText}
    >
      <div className={cx(s.fill, shown <= 0 && s.empty)} style={{ width: `${shown * 100}%` }}>
        <span className={s.stripe} />
        {sheenKey > 0 && <span key={sheenKey} className={s.sheen} />}
        {shimmer && !reduced && <span className={s.shimmer} />}
      </div>
    </div>
  );
}
