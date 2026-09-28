/** 2px warm rule, optionally with a centered label ("or"). OWNER: design-system area. */
import { cx } from './util';
import s from './Divider.module.css';

export interface DividerProps {
  label?: string;
  /** Vertical space around it. Default 'md'. */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Divider({ label, spacing = 'md', className }: DividerProps) {
  if (!label) return <hr className={cx(s.rule, s[spacing], className)} />;
  return (
    <div className={cx(s.labelled, s[spacing], className)} role="separator" aria-label={label}>
      <span aria-hidden="true">{label}</span>
    </div>
  );
}
