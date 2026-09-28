/**
 * Circular progress ring with rounded caps and a smooth spring fill. OWNER: design-system area.
 * Put anything in the middle via children (e.g. <Digits/> or an icon).
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { spring } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cx, type Tone } from './util';
import s from './Ring.module.css';

export interface RingProps {
  /** 0..1 (values above 1 render full). */
  value: number;
  /** Diameter in px. Default 120. */
  size?: number;
  /** Stroke width in px. Default size/10 (min 6). */
  thickness?: number;
  /** Alias of `thickness`. */
  stroke?: number;
  tone?: Tone;
  /** Accessible label; when omitted the ring is decorative. */
  label?: string;
  valueText?: string;
  /** Track color: oat (default) or a translucent white (for use on tinted/dark scenes). */
  track?: 'default' | 'glass';
  /** Draw a soft highlight line along the fill (best on big, thick rings). Default false. */
  highlight?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Ring({
  value,
  size = 120,
  thickness,
  stroke,
  tone = 'persimmon',
  label,
  valueText,
  track = 'default',
  highlight = false,
  children,
  className,
}: RingProps) {
  const reduced = useReducedMotion();
  const v = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const t = thickness ?? stroke ?? Math.max(6, Math.round(size / 10));
  const r = (size - t) / 2;
  const c = size / 2;
  const hlR = r + t * 0.14;
  const transition = reduced ? { duration: 0 } : spring.fill;
  return (
    <div
      className={cx(s.ring, track === 'glass' && s.glass, className)}
      style={{ width: size, height: size }}
      data-tone={tone}
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? Math.round(v * 100) : undefined}
      aria-valuetext={label ? valueText : undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={s.svg} aria-hidden="true">
        <circle cx={c} cy={c} r={r} className={s.track} strokeWidth={t} fill="none" />
        <motion.circle
          cx={c}
          cy={c}
          r={r}
          className={s.fill}
          strokeWidth={t}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: reduced ? v : 0 }}
          animate={{ pathLength: v, opacity: v > 0 ? 1 : 0 }}
          transition={transition}
        />
        {highlight && t >= 8 && (
          <motion.circle
            cx={c}
            cy={c}
            r={hlR}
            className={s.hl}
            strokeWidth={Math.max(2, t * 0.2)}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.max(0, v - (t * 1.1) / (2 * Math.PI * r)), opacity: v > 0.04 ? 1 : 0 }}
            transition={transition}
            style={{ rotate: (t * 0.55 * 180) / (Math.PI * r) }}
          />
        )}
      </svg>
      {children != null && <div className={s.center}>{children}</div>}
    </div>
  );
}
