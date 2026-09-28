/**
 * Segmented control with radiogroup semantics (arrow keys, roving tabindex).
 * A raised thumb glides between options on a sunken track. OWNER: design-system area.
 */
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { audio } from '@/audio';
import { haptic } from '@/lib/haptics';
import { spring } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cx, renderIcon, type IconSlot, type Tone } from './util';
import s from './SegmentedControl.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Second line, e.g. "25 · 5 min". */
  sublabel?: ReactNode;
  icon?: IconSlot;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible group label (required). */
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'md' | 'lg';
  /** Selected label color. Default neutral ink. */
  tone?: Tone;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
  tone,
  className,
}: SegmentedControlProps<T>) {
  const layoutId = useId();
  const reduced = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);

  const choose = (v: T) => {
    if (v === value) return;
    audio.play('toggle');
    haptic('light');
    onChange(v);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const cur = Math.max(0, enabled.indexOf(selectedIndex));
    let pos = cur;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') pos = (cur + 1) % enabled.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') pos = (cur - 1 + enabled.length) % enabled.length;
    if (e.key === 'Home') pos = 0;
    if (e.key === 'End') pos = enabled.length - 1;
    const idx = enabled[pos];
    choose(options[idx].value);
    refs.current[idx]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(s.control, s[size], className)}
      data-tone={tone}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      onKeyDown={onKeyDown}
    >
      {options.map((o, i) => {
        const sel = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={sel}
            tabIndex={sel || (selectedIndex < 0 && i === 0) ? 0 : -1}
            disabled={o.disabled}
            className={cx(s.option, sel && s.selected)}
            onClick={() => choose(o.value)}
          >
            {sel && (
              <motion.span
                layoutId={layoutId}
                className={s.thumb}
                transition={reduced ? { duration: 0 } : spring.snappy}
                aria-hidden="true"
              />
            )}
            <span className={s.inner}>
              {o.icon != null && <span className={s.icon}>{renderIcon(o.icon, 20)}</span>}
              <span className={s.text}>
                <span className={s.label}>{o.label}</span>
                {o.sublabel != null && <span className={s.sub}>{o.sublabel}</span>}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
