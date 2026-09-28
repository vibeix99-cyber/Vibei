/**
 * Big round session control (pause/resume, +5, end) with a caption underneath.
 * Built on the kit Button (same tactile face + edge, sounds, haptics, focus ring);
 * this only makes it circular at a larger size and adds the caption.
 * Request logged for the kit: an `xl` round IconButton with a caption slot.
 */
import { forwardRef, type ReactNode } from 'react';
import { Button, type ButtonProps } from '@/ui';
import s from './RoundButton.module.css';

export interface RoundButtonProps extends Omit<ButtonProps, 'children' | 'icon' | 'size' | 'block'> {
  /** Accessible name. */
  label: string;
  icon: ReactNode;
  /** Face diameter in px. */
  size?: number;
  /** Visible text under the face (defaults to `label`; `false` for none). */
  caption?: string | false;
}

export const RoundButton = forwardRef<HTMLButtonElement, RoundButtonProps>(function RoundButton(
  { label, icon, size = 64, caption, className, variant = 'secondary', style, ...rest },
  ref,
) {
  const text = caption === false ? null : (caption ?? label);
  return (
    <span className={[s.wrap, className].filter(Boolean).join(' ')} style={{ ['--size' as string]: `${size}px`, ...style }}>
      <Button ref={ref} variant={variant} size="lg" icon={icon} aria-label={label} className={s.round} {...rest} />
      {text && (
        <span className={s.caption} aria-hidden="true" data-caption="">
          {text}
        </span>
      )}
    </span>
  );
});
