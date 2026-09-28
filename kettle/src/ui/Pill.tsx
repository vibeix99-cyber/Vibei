/** Small non-interactive label ("Level 5", "New", "+12 🍃"). OWNER: design-system area. */
import type { ReactNode } from 'react';
import { cx, renderIcon, type IconSlot, type Tone } from './util';
import s from './Pill.module.css';

export interface PillProps {
  children: ReactNode;
  tone?: Tone | 'neutral';
  icon?: IconSlot;
  /** Solid face (white/espresso text) instead of the soft tint. */
  solid?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

export function Pill({ children, tone = 'neutral', icon, solid, size = 'md', className, title }: PillProps) {
  return (
    <span className={cx(s.pill, s[size], solid && s.solid, className)} data-tone={tone} title={title}>
      {icon != null && <span className={s.icon}>{renderIcon(icon, size === 'sm' ? 14 : 16)}</span>}
      {children}
    </span>
  );
}
/** Alias — same component, for tag-like usage. */
export const Tag = Pill;
