/** "Steam dots" loading indicator. OWNER: design-system area. Reduced motion: gentle pulse. */
import { cx } from './util';
import s from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label. Pass `null` when a parent already announces busy state. */
  label?: string | null;
  className?: string;
}

export function Spinner({ size = 'md', label = 'Loading', className }: SpinnerProps) {
  return (
    <span className={cx(s.spinner, s[size], className)} role={label ? 'status' : undefined} aria-label={label ?? undefined} aria-hidden={label ? undefined : true}>
      <span className={s.dot} />
      <span className={s.dot} />
      <span className={s.dot} />
    </span>
  );
}
