/**
 * Custom range slider (role="slider"), fully keyboard accessible. OWNER: design-system area.
 * Arrows ±step · PageUp/PageDown ±10% · Home/End min/max. Pointer drag anywhere on the track.
 */
import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { audio } from '@/audio';
import { clamp, cx, type Tone } from './util';
import s from './Slider.module.css';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  /** Fires once when a drag/keyboard interaction settles (e.g. to preview a sound). */
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Accessible (and visible unless `hideLabel`) label. */
  label: string;
  hideLabel?: boolean;
  /** Human-readable value, e.g. v => `${Math.round(v * 100)}%`. */
  format?: (value: number) => string;
  /** Show the formatted value to the right of the label. */
  showValue?: boolean;
  tone?: Tone;
  disabled?: boolean;
  /** Decorative nodes at the track ends (e.g. quiet/loud icons). */
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
  id?: string;
}

export function Slider({
  value,
  onChange,
  onCommit,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  hideLabel,
  format,
  showValue,
  tone = 'persimmon',
  disabled,
  start,
  end,
  className,
  id,
}: SliderProps) {
  const autoId = useId();
  const labelId = `${id ?? autoId}-label`;
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = max > min ? (clamp(value, min, max) - min) / (max - min) : 0;
  const text = format ? format(value) : String(Math.round(value * 100) / 100);

  const snap = useCallback(
    (v: number) => {
      const stepped = Math.round((v - min) / step) * step + min;
      const decimals = (String(step).split('.')[1] ?? '').length;
      return clamp(Number(stepped.toFixed(decimals)), min, max);
    },
    [min, max, step],
  );
  const set = (v: number) => {
    const next = snap(v);
    if (next !== value) onChange(next);
    return next;
  };
  const fromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return value;
    const r = el.getBoundingClientRect();
    const thumb = parseFloat(getComputedStyle(el).getPropertyValue('--thumb')) || 30;
    return min + clamp((clientX - r.left - thumb / 2) / Math.max(1, r.width - thumb), 0, 1) * (max - min);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    set(fromPointer(e.clientX));
    (e.currentTarget.querySelector('[role="slider"]') as HTMLElement | null)?.focus({ preventScroll: true });
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    set(fromPointer(e.clientX));
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    const v = snap(fromPointer(e.clientX));
    audio.play('toggle', { volume: 0.5 });
    onCommit?.(v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const big = Math.max(step, (max - min) / 10);
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = value + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = value - step;
        break;
      case 'PageUp':
        next = value + big;
        break;
      case 'PageDown':
        next = value - big;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
    }
    if (next == null) return;
    e.preventDefault();
    const v = set(next);
    onCommit?.(v);
  };

  return (
    <div className={cx(s.slider, disabled && s.disabled, dragging && s.dragging, className)} data-tone={tone}>
      {(!hideLabel || showValue) && (
        <div className={cx(s.head, hideLabel && s.headValueOnly)}>
          <span id={labelId} className={hideLabel ? 'sr-only' : s.label}>
            {label}
          </span>
          {showValue && (
            <span className={s.value} aria-hidden="true">
              {text}
            </span>
          )}
        </div>
      )}
      {hideLabel && !showValue && (
        <span id={labelId} className="sr-only">
          {label}
        </span>
      )}
      <div className={s.row}>
        {start && <span className={s.end} aria-hidden="true">{start}</span>}
        <div
          className={s.hit}
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDragging(false)}
        >
          <div className={s.track}>
            <div className={s.fill} style={{ width: `calc(${pct * 100}% + (0.5 - ${pct}) * var(--thumb))` }}>
              <span className={s.stripe} />
            </div>
          </div>
          <div
            className={s.thumb}
            style={{ left: `calc(${pct * 100}% + (0.5 - ${pct}) * var(--thumb))` }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            id={id}
            aria-labelledby={labelId}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={text}
            aria-orientation="horizontal"
            aria-disabled={disabled || undefined}
            onKeyDown={onKeyDown}
          />
        </div>
        {end && <span className={s.end} aria-hidden="true">{end}</span>}
      </div>
    </div>
  );
}
