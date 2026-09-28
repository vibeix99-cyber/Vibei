/**
 * Jitter-free numerals: every digit sits in a fixed-width cell (Fredoka's figures are
 * proportional). Optional odometer roll per digit; reduced motion just swaps.
 * Screen readers get the whole value once (or `label`), never digit-by-digit.
 * OWNER: design-system area.
 *
 *   <Digits value="25:00" roll="down" className="t-display-xl" />
 */
import { useState, type CSSProperties, type HTMLAttributes } from 'react';
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

export function Digits({ value, roll = false, label, font = 'display', className, style, ...rest }: DigitsProps) {
  const text = String(value);
  const chars = [...text];
  const dir: 1 | -1 = roll === 'down' ? -1 : 1;
  const animate = !!roll; // reduced motion: RollCell cross-fades (CSS)
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
          return <RollCell key={`d${pos}`} ch={ch} dir={dir} />;
        })}
      </span>
    </span>
  );
}

/**
 * One odometer cell. The change is a 160ms nudge-and-fade CSS animation (compositor-driven, so a busy
 * main thread can't strand a glyph mid-translate; `fill-mode: both` guarantees the end state).
 * The cell clips its own glyphs, so any in-between frame reads as a crisp mechanical counter.
 */
function RollCell({ ch, dir }: { ch: string; dir: 1 | -1 }) {
  const [st, setSt] = useState({ cur: ch, old: null as string | null, n: 0 });
  if (st.cur !== ch) setSt({ cur: ch, old: st.cur, n: st.n + 1 }); // derived state, set during render
  return (
    <span className={cx(s.cell, s.rolling)} data-dir={dir > 0 ? 'up' : 'down'}>
      {st.old !== null && (
        <span key={`o${st.n}`} className={cx(s.glyph, s.out)}>
          {st.old}
        </span>
      )}
      <span key={`i${st.n}`} className={cx(s.glyph, st.n > 0 && s.in)}>
        {st.cur}
      </span>
    </span>
  );
}
