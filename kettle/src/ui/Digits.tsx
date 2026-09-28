/**
 * Jitter-free numerals: every digit sits in a fixed-width cell (Fredoka's figures are
 * proportional). Optional odometer roll per digit; reduced motion just swaps.
 * Screen readers get the whole value once (or `label`), never digit-by-digit.
 * OWNER: design-system area.
 *
 *   <Digits value="25:00" roll="down" className="t-display-xl" />
 */
import type { CSSProperties, HTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cx } from './util';
import s from './Digits.module.css';

export interface DigitsProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: string | number;
  /** Animate changed digits: 'up' = new digit rises in (count-up), 'down' = drops in (countdown). */
  roll?: boolean | 'up' | 'down';
  /** Text for assistive tech (default: the value). Pass `null` to hide from AT entirely. */
  label?: string | null;
  /** Font family: display (Fredoka, default) or body (Nunito). */
  font?: 'display' | 'body';
}

const DIGIT = /[0-9]/;
const rollSpring = { type: 'spring', stiffness: 520, damping: 38, mass: 0.8 } as const;

export function Digits({ value, roll = false, label, font = 'display', className, style, ...rest }: DigitsProps) {
  const reduced = useReducedMotion();
  const text = String(value);
  const chars = [...text];
  const dir = roll === 'down' ? -1 : 1;
  const animate = !!roll && !reduced;
  return (
    <span className={cx(s.digits, font === 'body' && s.body, className)} style={style as CSSProperties} {...rest}>
      {label !== null && <span className="sr-only">{label ?? text}</span>}
      <span className={s.row} aria-hidden="true">
        {chars.map((ch, i) => {
          const pos = chars.length - i; // key from the right so units stay aligned
          if (!DIGIT.test(ch)) {
            return (
              <span key={`s${pos}`} className={ch === ':' ? s.colon : s.sep}>
                {ch}
              </span>
            );
          }
          if (!animate) {
            return (
              <span key={`d${pos}`} className={s.cell}>
                {ch}
              </span>
            );
          }
          return (
            <span key={`d${pos}`} className={cx(s.cell, s.rolling)}>
              <AnimatePresence initial={false}>
                <motion.span
                  key={ch}
                  className={s.glyph}
                  initial={{ y: `${55 * dir}%`, opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: `${-55 * dir}%`, opacity: 0 }}
                  transition={rollSpring}
                >
                  {ch}
                </motion.span>
              </AnimatePresence>
            </span>
          );
        })}
      </span>
    </span>
  );
}
