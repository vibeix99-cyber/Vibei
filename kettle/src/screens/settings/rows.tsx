/** Settings row helpers composed from kit controls. OWNER: home/settings area. */
import type { ReactNode } from 'react';
import { Slider } from '@/ui';
import s from './Settings.module.css';

/** A row whose control sits underneath the title (segmented controls, chip groups). */
export function StackRow({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className={s.stackRow}>
      <div className={s.stackHead}>
        <span className={s.stackTitle}>{title}</span>
        {description && <span className={s.stackDesc}>{description}</span>}
      </div>
      {children}
    </div>
  );
}

export function VolumeRow({ title, value, onChange, disabled, tone }: { title: string; value: number; onChange: (v: number) => void; disabled?: boolean; tone?: 'persimmon' | 'matcha' | 'honey' | 'sky' | 'berry' }) {
  return (
    <div className={s.sliderRow}>
      <Slider label={title} value={value} onChange={onChange} disabled={disabled} min={0} max={1} step={0.05} tone={tone} showValue format={(v) => `${Math.round(v * 100)}%`} />
    </div>
  );
}

export function PadRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[s.padRow, className].filter(Boolean).join(' ')}>{children}</div>;
}
