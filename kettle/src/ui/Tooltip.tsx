/**
 * Lightweight tooltip for pointer + keyboard users. OWNER: design-system area.
 * Shows on hover (after a short delay) and on keyboard focus; hides on Escape.
 * Not shown for touch (labels must never live only in a tooltip).
 */
import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { cx } from './util';
import s from './Tooltip.module.css';

export interface TooltipProps {
  content: string;
  children: ReactElement;
  side?: 'top' | 'bottom';
  /** Wire aria-describedby to the trigger. Off when the content duplicates the accessible name. */
  describe?: boolean;
  delay?: number;
}

export function Tooltip({ content, children, side = 'top', describe = true, delay = 450 }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const show = (d: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), d);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, describe ? { 'aria-describedby': id } : {})
    : children;
  return (
    <span
      className={s.wrap}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(delay)}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(e) => (e.target as HTMLElement).matches(':focus-visible') && show(0)}
      onBlur={hide}
    >
      {trigger}
      <span id={id} role="tooltip" className={cx(s.tip, s[side], open && s.open)} aria-hidden={describe ? undefined : true}>
        {content}
      </span>
    </span>
  );
}
