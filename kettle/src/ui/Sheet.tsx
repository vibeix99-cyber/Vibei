/**
 * Modal bottom sheet (phones) / centered dialog (≥ 720px). OWNER: design-system area.
 *
 * - role="dialog" + aria-modal, labelled by its title, described by `description`
 * - focus moves in (initialFocus → first control → close), Tab is trapped, focus is
 *   restored to the opener on close
 * - the app root (#root) and any sheet underneath become `inert`; page scroll locks
 * - Esc / backdrop tap / drag-down (sheet handle) close it unless `dismissible={false}`
 * - spring slide-up (sheet) or scale-in (dialog); fade-only under reduced motion;
 *   exit animations via AnimatePresence
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useIsPresent, type PanInfo } from 'motion/react';
import { audio } from '@/audio';
import { spring, ease } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { IconButton } from './IconButton';
import { cx, useMediaQuery } from './util';
import s from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the title (still labels the dialog). */
  hideTitle?: boolean;
  description?: ReactNode;
  children?: ReactNode;
  /** Actions pinned to the bottom (stays visible while the body scrolls). */
  footer?: ReactNode;
  /** Art above the title, e.g. <Mascot pose="concerned" />. */
  hero?: ReactNode;
  /** 'auto' (default): bottom sheet below 720px, dialog above. */
  variant?: 'auto' | 'sheet' | 'dialog';
  size?: 'sm' | 'md' | 'lg';
  /** Text alignment of the header. Default 'start' ('center' when a hero is given). */
  align?: 'start' | 'center';
  /** Esc / backdrop / drag close it. Default true. */
  dismissible?: boolean;
  /** Show the close (×) button. Default true when dismissible. */
  showClose?: boolean;
  /** Element to focus when opening. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Called after the exit animation finishes. */
  onExited?: () => void;
  className?: string;
}

export function Sheet(props: SheetProps) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence onExitComplete={props.onExited}>{props.open && <SheetPanel key="sheet" {...props} />}</AnimatePresence>,
    document.body,
  );
}

/** Always-centered variant (confirmations, small forms). */
export function Dialog(props: Omit<SheetProps, 'variant'>) {
  return <Sheet {...props} variant="dialog" />;
}

/* ---------------- stack: inert background + scroll lock + Esc routing ---------------- */
const stack: { id: string; el: HTMLElement }[] = [];
function syncStack() {
  const root = document.getElementById('root');
  const any = stack.length > 0;
  if (root) {
    if (any) root.setAttribute('inert', '');
    else root.removeAttribute('inert');
  }
  stack.forEach((entry, i) => {
    if (i < stack.length - 1) entry.el.setAttribute('inert', '');
    else entry.el.removeAttribute('inert');
  });
  document.documentElement.classList.toggle('kettle-modal-open', any);
  document.documentElement.style.overflow = any ? 'hidden' : '';
}
const isTop = (id: string) => stack.length > 0 && stack[stack.length - 1].id === id;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest('[inert]') && el.getClientRects().length > 0,
  );
}

function SheetPanel({
  onClose,
  title,
  hideTitle,
  description,
  children,
  footer,
  hero,
  variant = 'auto',
  size = 'md',
  align,
  dismissible = true,
  showClose,
  initialFocus,
  className,
}: SheetProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const wide = useMediaQuery('(min-width: 720px)');
  const reduced = useReducedMotion();
  const isPresent = useIsPresent();
  const mode: 'sheet' | 'dialog' = variant === 'auto' ? (wide ? 'dialog' : 'sheet') : variant;
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const requestClose = useCallback(() => {
    if (!dismissible) return;
    audio.play('whoosh', { volume: 0.5 });
    onCloseRef.current();
  }, [dismissible]);

  // Register on the modal stack while present; release immediately when exiting.
  useLayoutEffect(() => {
    if (!isPresent || !layerRef.current) return;
    const current = document.activeElement as HTMLElement | null;
    if (current && current !== document.body && !layerRef.current.contains(current)) opener.current = current;
    stack.push({ id, el: layerRef.current });
    syncStack();
    // Initial focus
    const panel = panelRef.current;
    const target =
      initialFocus?.current ??
      (bodyRef.current && focusables(bodyRef.current)[0]) ??
      (panel && focusables(panel).find((el) => el !== closeRef.current)) ??
      closeRef.current ??
      panel;
    target?.focus({ preventScroll: true });
    return () => {
      const i = stack.findIndex((e) => e.id === id);
      if (i >= 0) stack.splice(i, 1);
      syncStack();
      const back = opener.current;
      // After the commit: React restores the pre-commit focus at the end of a commit, so a
      // synchronous focus() here would be undone. Skip if we were re-registered (StrictMode).
      queueMicrotask(() => {
        if (stack.some((e) => e.id === id)) return;
        if (back && document.contains(back) && !back.closest('[inert]')) {
          back.focus({ preventScroll: true });
          if (document.activeElement === back) return;
        }
        // Opener gone (or it was a keyboard shortcut): land somewhere sensible, never <body>.
        const top = stack[stack.length - 1]?.el;
        const scope = top ?? document.getElementById('main') ?? document.getElementById('root');
        const target = scope && (scope.matches('[tabindex]') ? scope : focusables(scope)[0]);
        target?.focus({ preventScroll: true });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  // Esc closes the top-most sheet only, and never leaks to app shortcuts.
  useEffect(() => {
    if (!isPresent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isTop(id)) return;
      e.stopPropagation();
      e.preventDefault();
      requestClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [id, isPresent, requestClose]);

  // Keep focus inside while on top.
  useEffect(() => {
    if (!isPresent) return;
    const onFocusIn = (e: FocusEvent) => {
      const panel = panelRef.current;
      if (!panel || !isTop(id)) return;
      if (e.target instanceof Node && !panel.contains(e.target)) (focusables(panel)[0] ?? panel).focus({ preventScroll: true });
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [id, isPresent]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const list = focusables(panelRef.current);
    if (list.length === 0) {
      e.preventDefault();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) requestClose();
  };

  const panelMotion = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.16 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : mode === 'sheet'
      ? {
          initial: { y: '100%' },
          animate: { y: 0, transition: spring.gentle },
          exit: { y: '100%', transition: { duration: 0.24, ease: ease.in } },
        }
      : {
          initial: { opacity: 0, scale: 0.9, y: 16 },
          animate: { opacity: 1, scale: 1, y: 0, transition: spring.cozy },
          exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.14, ease: ease.in } },
        };

  const closable = showClose ?? dismissible;
  const headerAlign = align ?? (hero ? 'center' : 'start');

  return (
    <div ref={layerRef} className={cx(s.layer, s[mode])}>
      <motion.div
        className={s.backdrop}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: reduced ? 0.12 : 0.24 } }}
        exit={{ opacity: 0, transition: { duration: 0.18 } }}
        onClick={requestClose}
      />
      <motion.div
        ref={panelRef}
        className={cx(s.panel, s[size], className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        drag={mode === 'sheet' && dismissible && !reduced ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.75 }}
        onDragEnd={onDragEnd}
        {...panelMotion}
      >
        {mode === 'sheet' && (
          <div className={s.grab} onPointerDown={(e) => dismissible && dragControls.start(e)} aria-hidden="true">
            <span className={s.handle} />
          </div>
        )}
        {closable && (
          <div className={s.close}>
            <IconButton ref={closeRef} icon="close" label="Close" size="sm" onClick={requestClose} sfx={false} tooltip={false} />
          </div>
        )}
        <div
          className={cx(s.header, headerAlign === 'center' && s.center, closable && s.hasClose, hideTitle && !hero && !description && s.headerHidden)}
          onPointerDown={(e) => mode === 'sheet' && dismissible && e.pointerType !== 'mouse' && dragControls.start(e)}
        >
          {hero && <div className={s.hero}>{hero}</div>}
          <h2 id={titleId} className={hideTitle ? 'sr-only' : s.title}>
            {title}
          </h2>
          {description && (
            <div id={descId} className={s.description}>
              {description}
            </div>
          )}
        </div>
        {children != null && (
          <div ref={bodyRef} className={s.body}>
            {children}
          </div>
        )}
        {footer && <div className={s.footer}>{footer}</div>}
      </motion.div>
    </div>
  );
}
