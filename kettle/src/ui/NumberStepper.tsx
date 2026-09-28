/**
 * Number stepper for minutes etc. OWNER: design-system area.
 * The value is a focusable spinbutton (↑/↓, PageUp/PageDown ±5 steps, Home/End);
 * the − / + buttons repeat when held.
 */
import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { Button } from './Button';
import { Digits } from './Digits';
import { clamp, cx } from './util';
import s from './NumberStepper.module.css';

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  hideLabel?: boolean;
  /** Unit after the number ("min"). */
  unit?: string;
  /** Screen reader text, default `${value} ${unit}`. */
  format?: (value: number) => string;
  size?: 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  hideLabel,
  unit,
  format,
  size = 'md',
  disabled,
  className,
}: NumberStepperProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const valueRef = useRef(value);
  valueRef.current = value;
  const hold = useRef<{ t?: number; i?: number }>({});

  const bump = (dir: 1 | -1, times = 1) => {
    const next = clamp(valueRef.current + dir * step * times, min, max);
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChange(next);
    }
  };
  const stopHold = () => {
    window.clearTimeout(hold.current.t);
    window.clearInterval(hold.current.i);
    hold.current = {};
  };
  useEffect(() => stopHold, []);
  const startHold = (dir: 1 | -1) => (e: PointerEvent) => {
    if (e.button !== 0) return;
    stopHold();
    hold.current.t = window.setTimeout(() => {
      hold.current.i = window.setInterval(() => bump(dir), 90);
    }, 420);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const map: Record<string, () => void> = {
      ArrowUp: () => bump(1),
      ArrowRight: () => bump(1),
      ArrowDown: () => bump(-1),
      ArrowLeft: () => bump(-1),
      PageUp: () => bump(1, 5),
      PageDown: () => bump(-1, 5),
      Home: () => onChange(min),
      End: () => onChange(max),
    };
    const fn = map[e.key];
    if (!fn) return;
    e.preventDefault();
    fn();
  };

  const text = format ? format(value) : unit ? `${value} ${unit}` : String(value);
  const btnSize = size === 'lg' ? 'md' : 'sm';
  return (
    <div className={cx(s.stepper, s[size], disabled && s.disabled, className)}>
      <span id={labelId} className={hideLabel ? 'sr-only' : s.label}>
        {label}
      </span>
      <div className={s.row}>
        <Button
          variant="secondary"
          size={btnSize}
          icon="minus"
          aria-label={`Decrease ${label.toLowerCase()}`}
          tabIndex={-1}
          disabled={disabled || value <= min}
          sfx="toggle"
          onClick={() => bump(-1)}
          onPointerDown={startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        />
        <div
          className={s.value}
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={labelId}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={text}
          aria-disabled={disabled || undefined}
          onKeyDown={onKeyDown}
        >
          <Digits value={value} roll="up" label={null} className={s.num} />
          {unit && <span className={s.unit}>{unit}</span>}
        </div>
        <Button
          variant="secondary"
          size={btnSize}
          icon="plus"
          aria-label={`Increase ${label.toLowerCase()}`}
          tabIndex={-1}
          disabled={disabled || value >= max}
          sfx="toggle"
          onClick={() => bump(1)}
          onPointerDown={startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        />
      </div>
    </div>
  );
}
