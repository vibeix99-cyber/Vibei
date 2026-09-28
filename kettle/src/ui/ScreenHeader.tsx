/**
 * Screen title row for tab screens. OWNER: design-system area.
 *   <ScreenHeader title="Stats" subtitle="Your brewing, week by week" actions={<IconButton …/>} />
 * The title is the page's <h1>.
 */
import type { ReactNode } from 'react';
import { IconButton } from './IconButton';
import { cx } from './util';
import s from './ScreenHeader.module.css';

export interface ScreenHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Tiny label above the title. */
  overline?: ReactNode;
  /** Shows a back button. */
  onBack?: () => void;
  backLabel?: string;
  /** Right-side actions (IconButtons, Pills…). */
  actions?: ReactNode;
  /** 'l' (display-l, default on tab screens) or 'm'. */
  size?: 'l' | 'm';
  className?: string;
}

export function ScreenHeader({ title, subtitle, overline, onBack, backLabel = 'Back', actions, size = 'l', className }: ScreenHeaderProps) {
  return (
    <header className={cx(s.header, s[size], className)}>
      {onBack && (
        <div className={s.back}>
          <IconButton icon="back" label={backLabel} onClick={onBack} sfx="tap" variant="ghost" tooltip="bottom" />
        </div>
      )}
      <div className={s.titles}>
        {overline && <p className={s.overline}>{overline}</p>}
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  );
}

/** Section heading inside a screen: title + optional action link on the right. */
export function SectionHeader({ title, action, id, className }: { title: ReactNode; action?: ReactNode; id?: string; className?: string }) {
  return (
    <div className={cx(s.section, className)}>
      <h2 id={id} className={s.sectionTitle}>
        {title}
      </h2>
      {action && <div className={s.sectionAction}>{action}</div>}
    </div>
  );
}
