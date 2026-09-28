/**
 * On/off switch (role="switch"). OWNER: design-system area.
 * Off: a small espresso thumb on an oat track. On: a big cream thumb with a check on matcha.
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { audio } from '@/audio';
import { haptic } from '@/lib/haptics';
import { cx, type Tone } from './util';
import s from './Toggle.module.css';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name when there is no visible label to point `aria-labelledby` at. */
  label?: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  /** Shorthand for aria-describedby. */
  describedBy?: string;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, onChange, label, tone = 'matcha', size = 'md', describedBy, className, disabled, onClick, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest['aria-labelledby'] ? undefined : label}
      aria-describedby={describedBy}
      disabled={disabled}
      data-tone={tone}
      className={cx(s.toggle, s[size], checked && s.on, className)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        audio.play('toggle', { pitch: checked ? -2 : 2 });
        haptic('light');
        onChange(!checked);
      }}
      {...rest}
    >
      <span className={s.track}>
        <span className={s.thumb}>
          <svg viewBox="0 0 16 16" className={s.check} aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </button>
  );
});
