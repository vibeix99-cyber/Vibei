/**
 * Stat tile: icon + big number + label (Duolingo-profile style). OWNER: design-system area.
 *   <Stat icon="mug" value={<Counter value={5}/>} label="Day streak" tone="persimmon" />
 */
import type { ReactNode } from 'react';
import { cx, renderIcon, type IconSlot, type Tone } from './util';
import s from './Stat.module.css';

export interface StatProps {
  icon?: IconSlot;
  value: ReactNode;
  label: ReactNode;
  /** Small line under the label ("best 12"). */
  hint?: ReactNode;
  /** Tints the icon chip and the value. Default neutral. */
  tone?: Tone;
  /** 'tile' (bordered card, default) or 'bare' (for use inside another card). */
  variant?: 'tile' | 'bare';
  size?: 'md' | 'lg';
  className?: string;
}

export function Stat({ icon, value, label, hint, tone, variant = 'tile', size = 'md', className }: StatProps) {
  return (
    <div className={cx(s.stat, s[variant], s[size], className)} data-tone={tone}>
      {icon != null && <span className={s.icon}>{renderIcon(icon, size === 'lg' ? 32 : 26)}</span>}
      <div className={s.text}>
        <div className={s.value}>{value}</div>
        <div className={s.label}>{label}</div>
        {hint != null && <div className={s.hint}>{hint}</div>}
      </div>
    </div>
  );
}
