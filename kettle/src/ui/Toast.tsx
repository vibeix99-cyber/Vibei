/**
 * Toasts: `toast('Saved')` anywhere, `<Toaster/>` mounted once (App does it).
 * Also shows every `ui:toast` event from the event bus. OWNER: design-system area.
 * Polite live region, auto-dismiss (paused on hover/focus), tap to dismiss, max 3.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { on } from '@/lib/events';
import { audio } from '@/audio';
import { spring } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cx, renderIcon, type IconSlot } from './util';
import s from './Toast.module.css';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'info';

export interface ToastOptions {
  tone?: ToastTone;
  /** Override the tone icon (IconName or node). */
  icon?: IconSlot;
  /** ms before auto-dismiss. Default 3200 (5000 with an action). `Infinity` keeps it. */
  duration?: number;
  action?: { label: string; onClick: () => void };
  /** Replace an existing toast with the same id instead of stacking. */
  id?: string;
  /** Called when the user dismisses it or it times out (not on programmatic `toast.dismiss`). */
  onDismiss?: () => void;
}
interface ToastItem extends ToastOptions {
  id: string;
  message: string;
}

let items: ToastItem[] = [];
const listeners = new Set<() => void>();
const emitChange = () => listeners.forEach((l) => l());
let seq = 0;

export function toast(message: string, opts: ToastOptions = {}): string {
  const id = opts.id ?? `t${++seq}`;
  const item: ToastItem = { ...opts, id, message };
  items = [...items.filter((t) => t.id !== id), item].slice(-3);
  emitChange();
  return id;
}
toast.success = (message: string, opts: Omit<ToastOptions, 'tone'> = {}) => toast(message, { ...opts, tone: 'success' });
toast.warning = (message: string, opts: Omit<ToastOptions, 'tone'> = {}) => toast(message, { ...opts, tone: 'warning' });
toast.dismiss = (id?: string) => {
  items = id ? items.filter((t) => t.id !== id) : [];
  emitChange();
};

function useToasts() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items,
    () => items,
  );
}

const TONE_ICON: Record<ToastTone, { glyph: 'check' | 'info' | 'sparkle' | 'bell'; tone: string }> = {
  neutral: { glyph: 'sparkle', tone: 'honey' },
  success: { glyph: 'check', tone: 'matcha' },
  warning: { glyph: 'bell', tone: 'berry' },
  info: { glyph: 'info', tone: 'sky' },
};

export function Toaster() {
  const list = useToasts();
  const reduced = useReducedMotion();
  useEffect(
    () =>
      on('ui:toast', ({ message, tone }) => {
        toast(message, { tone });
      }),
    [],
  );
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className={s.region}>
      <div role="status" aria-live="polite" aria-relevant="additions text" aria-label="Notifications" className={s.live}>
        <ol className={s.list}>
          <AnimatePresence initial={false}>
            {list.map((t) => (
              <ToastView key={t.id} item={t} reduced={reduced} />
            ))}
          </AnimatePresence>
        </ol>
      </div>
    </div>,
    document.body,
  );
}

function ToastView({ item, reduced }: { item: ToastItem; reduced: boolean }) {
  const tone = item.tone ?? 'neutral';
  const meta = TONE_ICON[tone];
  const duration = item.duration ?? (item.action ? 5000 : 3200);
  const paused = useRef(false);
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (tone === 'success') audio.play('pop', { volume: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!Number.isFinite(duration)) return;
    const start = () => {
      startedAt.current = performance.now();
      timer.current = window.setTimeout(() => {
        toast.dismiss(item.id);
        item.onDismiss?.();
      }, remaining.current);
    };
    start();
    const el = document.getElementById(`toast-${item.id}`);
    const pause = () => {
      if (paused.current) return;
      paused.current = true;
      window.clearTimeout(timer.current);
      remaining.current -= performance.now() - startedAt.current;
    };
    const resume = () => {
      if (!paused.current) return;
      paused.current = false;
      start();
    };
    el?.addEventListener('pointerenter', pause);
    el?.addEventListener('pointerleave', resume);
    el?.addEventListener('focusin', pause);
    el?.addEventListener('focusout', resume);
    return () => {
      window.clearTimeout(timer.current);
      el?.removeEventListener('pointerenter', pause);
      el?.removeEventListener('pointerleave', resume);
      el?.removeEventListener('focusin', pause);
      el?.removeEventListener('focusout', resume);
    };
  }, [duration, item.id]);

  return (
    <motion.li
      id={`toast-${item.id}`}
      layout={!reduced}
      className={s.toast}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.94 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: spring.cozy }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.16 } }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        toast.dismiss(item.id);
        item.onDismiss?.();
      }}
    >
      <span className={cx(s.icon)} data-tone={meta.tone} aria-hidden="true">
        {renderIcon(item.icon ?? meta.glyph, 18)}
      </span>
      <span className={s.message}>{item.message}</span>
      {item.action && (
        <button
          type="button"
          className={s.action}
          onClick={() => {
            item.action?.onClick();
            toast.dismiss(item.id);
          }}
        >
          {item.action.label}
        </button>
      )}
    </motion.li>
  );
}
