import s from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number; // 0..1
  tone?: 'persimmon' | 'matcha' | 'honey' | 'sky' | 'berry';
  height?: number;
  label?: string; // accessible label
  className?: string;
}

export function ProgressBar({ value, tone = 'matcha', height = 16, label, className }: ProgressBarProps) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className={[s.track, className].filter(Boolean).join(' ')}
      style={{ height }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <div className={s.fill} data-tone={tone} style={{ width: `${v * 100}%` }} />
    </div>
  );
}
