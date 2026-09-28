/**
 * Chips: small selectable pills. OWNER: design-system area.
 * - `Chip` alone is a toggle button (aria-pressed when `selected` is defined).
 * - `ChipGroup` single-select = radiogroup (arrow keys, roving tabindex);
 *   `multiple` or `allowEmpty` = a group of toggle buttons.
 */
import { forwardRef, useId, useRef, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { audio } from '@/audio';
import { haptic } from '@/lib/haptics';
import { cx, renderIcon, type IconSlot, type Tone } from './util';
import s from './Chip.module.css';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  tone?: Tone;
  icon?: IconSlot;
  size?: 'sm' | 'md';
  /** Play the toggle sound on press. Default true. */
  sfx?: boolean;
  /** Shorthand for aria-describedby. */
  describedBy?: string;
  children?: ReactNode;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected, tone = 'persimmon', icon, size = 'md', sfx = true, describedBy, className, children, onClick, role, ...rest },
  ref,
) {
  const isRadio = role === 'radio';
  return (
    <button
      ref={ref}
      type="button"
      role={role}
      aria-pressed={!isRadio && selected !== undefined ? selected : undefined}
      aria-checked={isRadio ? !!selected : undefined}
      aria-describedby={describedBy}
      data-tone={tone}
      className={cx(s.chip, s[size], selected && s.selected, className)}
      onClick={(e) => {
        if (sfx) audio.play('toggle', { pitch: selected ? -2 : 2 });
        haptic('light');
        onClick?.(e);
      }}
      {...rest}
    >
      <span className={s.face}>
        {icon != null && <span className={s.icon}>{renderIcon(icon, size === 'sm' ? 18 : 20)}</span>}
        {children != null && <span className={s.label}>{children}</span>}
        <svg className={s.tick} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
});

export interface ChipOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: IconSlot;
  tone?: Tone;
  disabled?: boolean;
}

interface ChipGroupBase<T extends string> {
  /** Accessible group label (required). */
  label: string;
  options: ChipOption<T>[];
  tone?: Tone;
  size?: 'sm' | 'md';
  /** 'wrap' (default) or 'scroll' (single row, horizontal scroll with edge fade). */
  layout?: 'wrap' | 'scroll';
  className?: string;
}
export interface ChipGroupSingle<T extends string> extends ChipGroupBase<T> {
  multiple?: false;
  value: T | null;
  onChange: (value: T | null) => void;
  /** Allow tapping the selected chip to clear it (then it's toggle buttons, not radios). */
  allowEmpty?: boolean;
}
export interface ChipGroupMultiple<T extends string> extends ChipGroupBase<T> {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
}
export type ChipGroupProps<T extends string> = ChipGroupSingle<T> | ChipGroupMultiple<T>;

export function ChipGroup<T extends string>(props: ChipGroupProps<T>) {
  const { label, options, tone, size = 'md', layout = 'wrap', className } = props;
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const radio = !props.multiple && !props.allowEmpty;
  const isSelected = (v: T) => (props.multiple ? props.value.includes(v) : props.value === v);
  const selectedIndex = options.findIndex((o) => isSelected(o.value));

  const choose = (v: T) => {
    if (props.multiple) {
      props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    } else if (props.allowEmpty && props.value === v) {
      props.onChange(null);
    } else {
      props.onChange(v);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!radio) return;
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const cur = enabled.indexOf(Math.max(0, selectedIndex));
    let nextPos = cur;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPos = (cur + 1) % enabled.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextPos = (cur - 1 + enabled.length) % enabled.length;
    if (e.key === 'Home') nextPos = 0;
    if (e.key === 'End') nextPos = enabled.length - 1;
    const idx = enabled[nextPos];
    choose(options[idx].value);
    refs.current[idx]?.focus();
  };

  return (
    <div
      role={radio ? 'radiogroup' : 'group'}
      aria-label={label}
      className={cx(s.group, layout === 'scroll' && s.scroll, className)}
      onKeyDown={onKeyDown}
      id={id}
    >
      {options.map((o, i) => {
        const sel = isSelected(o.value);
        const tabbable = !radio || sel || (selectedIndex < 0 && i === 0);
        return (
          <Chip
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role={radio ? 'radio' : undefined}
            selected={sel}
            tone={o.tone ?? tone}
            icon={o.icon}
            size={size}
            disabled={o.disabled}
            tabIndex={tabbable ? 0 : -1}
            onClick={() => choose(o.value)}
          >
            {o.label}
          </Chip>
        );
      })}
    </div>
  );
}
