/**
 * Tactile pressable button. OWNER: design-system area.
 * A solid face over a 4px darker edge; pressing pushes the face down into the edge.
 * Labels are Fredoka 700 at >= 19px (md/lg) so white-on-tone passes WCAG AA large text;
 * `sm` uses the deeper `--<tone>-strong` face so its 16px label passes 4.5:1.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { audio, type SfxName } from '@/audio';
import { haptic, type HapticKind } from '@/lib/haptics';
import { Spinner } from './Spinner';
import { cx, renderIcon, type IconSlot, type Tone } from './util';
import s from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'soft'
  | 'matcha'
  | 'sky'
  | 'honey'
  | 'berry'
  | 'plum'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width. */
  block?: boolean;
  /** Leading icon (IconName or node). With no children the button becomes a square icon button. */
  icon?: IconSlot;
  iconRight?: IconSlot;
  /** Tone for the `soft` and `ghost` variants. Default persimmon (soft) / none (ghost). */
  tone?: Tone;
  /** Shows a steam-dot spinner, keeps the width, blocks presses, sets aria-busy. */
  loading?: boolean;
  /** Sound on press. `false` for silent. Default 'tap'. */
  sfx?: SfxName | false;
  /** Haptic on press. `false` for none. Default 'light'. */
  haptics?: HapticKind | false;
  children?: ReactNode;
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 20, md: 24, lg: 28 };

const VARIANT_TONE: Partial<Record<ButtonVariant, Tone>> = {
  primary: 'persimmon',
  matcha: 'matcha',
  sky: 'sky',
  honey: 'honey',
  berry: 'berry',
  danger: 'berry',
  plum: 'plum',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    block,
    icon,
    iconRight,
    tone,
    loading,
    sfx = 'tap',
    haptics = 'light',
    className,
    children,
    onClick,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const iconOnly = children == null && icon != null && iconRight == null;
  const solidTone = VARIANT_TONE[variant];
  const dataTone = solidTone ?? tone ?? (variant === 'soft' ? 'persimmon' : undefined);
  return (
    <button
      ref={ref}
      type={type}
      className={cx(s.btn, solidTone ? s.solid : s[variant], s[size], block && s.block, iconOnly && s.iconOnly, className)}
      data-tone={dataTone}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      disabled={disabled}
      onClick={(e) => {
        if (loading) {
          e.preventDefault();
          return;
        }
        if (sfx) audio.play(sfx);
        if (haptics) haptic(haptics);
        onClick?.(e);
      }}
      {...rest}
    >
      <span className={s.face}>
        <span className={s.content}>
          {icon != null && <span className={s.icon}>{renderIcon(icon, ICON_SIZE[size])}</span>}
          {children != null && <span className={s.label}>{children}</span>}
          {iconRight != null && <span className={s.icon}>{renderIcon(iconRight, ICON_SIZE[size])}</span>}
        </span>
        {loading && (
          <span className={s.spinner}>
            <Spinner size={size === 'sm' ? 'sm' : 'md'} label="Loading" />
          </span>
        )}
      </span>
    </button>
  );
});
