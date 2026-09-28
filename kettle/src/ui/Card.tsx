/**
 * Cards: 2px warm border + 4px bottom edge. OWNER: design-system area.
 * `Card` is static; `PressableCard` is a tactile button (press pushes it into its edge).
 */
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { audio, type SfxName } from '@/audio';
import { haptic } from '@/lib/haptics';
import { cx, type Tone } from './util';
import s from './Card.module.css';

export type CardTone = 'plain' | Tone;
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  as?: 'div' | 'section' | 'article' | 'li' | 'aside' | 'header' | 'footer';
  /** Inner padding. Default 'md' (16px; 20px on wider screens). */
  padding?: CardPadding;
  /** raised (default) = border + bottom edge · flat = border only · sunken = oat well, no border. */
  variant?: 'raised' | 'flat' | 'sunken';
}

export function Card({ tone = 'plain', as = 'div', padding = 'md', variant = 'raised', className, ...rest }: CardProps) {
  const Tag = as as 'div';
  return (
    <Tag
      className={cx(s.card, s[`pad-${padding}`], s[variant], className)}
      data-tone={tone === 'plain' ? undefined : tone}
      data-card-tone={tone}
      {...rest}
    />
  );
}

export interface PressableCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: CardTone;
  padding?: CardPadding;
  /** Selected look (tone border). Pair with aria-pressed / role="radio" as appropriate. */
  selected?: boolean;
  sfx?: SfxName | false;
}

export const PressableCard = forwardRef<HTMLButtonElement, PressableCardProps>(function PressableCard(
  { tone = 'plain', padding = 'md', selected, sfx = 'tap', className, onClick, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(s.card, s.raised, s.pressable, s[`pad-${padding}`], selected && s.selected, className)}
      data-tone={tone === 'plain' ? (selected ? 'sky' : undefined) : tone}
      data-card-tone={tone}
      onClick={(e) => {
        if (sfx) audio.play(sfx);
        haptic('light');
        onClick?.(e);
      }}
      {...rest}
    />
  );
});
