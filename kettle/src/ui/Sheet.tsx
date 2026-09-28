/** Modal dialog / bottom sheet — INITIAL. OWNER: design-system area (focus trap, animation, a11y). */
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import s from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the title (still labels the dialog). */
  hideTitle?: boolean;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, hideTitle, children }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className={s.backdrop} onClick={onClose}>
      <div
        ref={ref}
        className={s.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={hideTitle ? 'sr-only' : s.title}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
