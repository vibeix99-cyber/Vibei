/** Tactile pressable button — INITIAL. OWNER: design-system area. Keep props stable. */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { audio, type SfxName } from '@/audio';
import { haptic } from '@/lib/haptics';
import s from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'matcha' | 'sky' | 'honey' | 'berry' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Sound on press. `false` for silent. Default 'tap'. */
  sfx?: SfxName | false;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, icon, iconRight, sfx = 'tap', className, children, onClick, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[s.btn, s[variant], s[size], block && s.block, className].filter(Boolean).join(' ')}
      onClick={(e) => {
        if (sfx) audio.play(sfx);
        haptic('light');
        onClick?.(e);
      }}
      {...rest}
    >
      <span className={s.face}>
        {icon && <span className={s.icon}>{icon}</span>}
        {children && <span className={s.label}>{children}</span>}
        {iconRight && <span className={s.icon}>{iconRight}</span>}
      </span>
    </button>
  );
});
