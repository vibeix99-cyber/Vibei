/** Small kit pieces: Kbd, Skeleton, EmptyState, VisuallyHidden. OWNER: design-system area. */
import type { CSSProperties, ReactNode } from 'react';
import { cx } from './util';
import s from './Misc.module.css';

/** Keyboard key cap: <Kbd>Space</Kbd>. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cx(s.kbd, className)}>{children}</kbd>;
}

/** Loading placeholder with a warm shimmer (static under reduced motion). */
export function Skeleton({ width = '100%', height = 16, radius, className, style }: { width?: number | string; height?: number | string; radius?: number | string; className?: string; style?: CSSProperties }) {
  return <span className={cx(s.skeleton, className)} style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

/** Empty state: art (e.g. <Mascot pose="peek"/>) + title + text + optional action. */
export function EmptyState({ art, title, children, action, className }: { art?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx(s.empty, className)}>
      {art && <div className={s.art}>{art}</div>}
      <p className={s.emptyTitle}>{title}</p>
      {children && <div className={s.emptyText}>{children}</div>}
      {action && <div className={s.emptyAction}>{action}</div>}
    </div>
  );
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
