/**
 * Text input ("What are you brewing?"). OWNER: design-system area.
 * Optional leading icon, clear button, and character counter.
 */
import { forwardRef, useId, useImperativeHandle, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '@/art';
import { audio } from '@/audio';
import { cx, renderIcon, type IconSlot } from './util';
import s from './TextField.module.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size' | 'value'> {
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  icon?: IconSlot;
  /** Show a clear (×) button when there is text. */
  clearable?: boolean;
  onClear?: () => void;
  /** Show "12/60" (requires maxLength). */
  showCount?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  size?: 'md' | 'lg';
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hideLabel, value, onChange, icon, clearable, onClear, showCount, hint, error, size = 'md', maxLength, className, id, disabled, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? `${auto}-input`;
  const hintId = `${auto}-hint`;
  const countId = `${auto}-count`;
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inner.current as HTMLInputElement);
  const describedBy = [hint || error ? hintId : null, showCount && maxLength ? countId : null].filter(Boolean).join(' ') || undefined;
  const near = maxLength ? value.length >= maxLength * 0.9 : false;
  return (
    <div className={cx(s.field, s[size], error != null && s.invalid, disabled && s.disabled, className)}>
      <label htmlFor={inputId} className={hideLabel ? 'sr-only' : s.label}>
        {label}
      </label>
      <div className={s.box}>
        {icon != null && <span className={s.icon}>{renderIcon(icon, 22)}</span>}
        <input
          ref={inner}
          id={inputId}
          className={s.input}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={error != null || undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
        {clearable && value.length > 0 && !disabled && (
          <button
            type="button"
            className={s.clear}
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              audio.play('tap', { volume: 0.6 });
              onChange('');
              onClear?.();
              inner.current?.focus();
            }}
          >
            <span className={s.clearDot}>
              <Icon name="close" size={16} />
            </span>
          </button>
        )}
      </div>
      {(hint != null || error != null || (showCount && maxLength)) && (
        <div className={s.meta}>
          {(hint != null || error != null) && (
            <span id={hintId} className={error != null ? s.error : s.hint}>
              {error ?? hint}
            </span>
          )}
          {showCount && maxLength != null && (
            <span id={countId} className={cx(s.count, near && s.near)} aria-live={near ? 'polite' : undefined}>
              <span className="sr-only">Characters used: </span>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
