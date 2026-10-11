/**
 * Toasts: `toast('Saved')` anywhere, `<Toaster/>` mounted once (App does it).
 * Also shows every `ui:toast` event from the event bus. OWNER: design-system area.
 * Polite live region, auto-dismiss (paused on hover/focus), tap to dismiss, max 3.
 */
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
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
  // The lift is kept until the last toast has finished leaving: the list empties the moment that toast is dismissed or
  // times out, but it is still drawn (fading out) until its exit ends, and the region dropping back under it then
  // would draw it over the docked start for that moment.
  const [drawn, setDrawn] = useState(false);
  if (list.length > 0 && !drawn) setDrawn(true);
  const regionRef = useRef<HTMLDivElement>(null);
  const { bottom: above, top: below } = useToastRoom(list.length > 0 || drawn, regionRef);
  if (typeof document === 'undefined') return null;
  const room = above != null || below != null ? { ...(above != null && { bottom: above }), ...(below != null && { top: below }) } : undefined;
  return createPortal(
    <div ref={regionRef} className={s.region} style={room}>
      <div role="status" aria-live="polite" aria-relevant="additions text" aria-label="Notifications" className={s.live}>
        <ol className={s.list}>
          <AnimatePresence initial={false} onExitComplete={() => setDrawn(false)}>
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

/**
 * Where toasts float right now: a CSS bottom in px that clears every on-screen `[data-toast-above]` element (Today's
 * docked start, the session's Pause/+5/End row, the summary's Tea time/Skip footer), measured from where the highest
 * one starts — or null to keep the stylesheet's position (nothing marked low enough on screen).
 */
function toastLiftBottom(): number | null {
  if (typeof document === 'undefined') return null;
  let top = Infinity;
  for (const el of document.querySelectorAll<HTMLElement>('[data-toast-above]')) {
    if (el.closest('[aria-hidden="true"], [inert]')) continue;
    const r = el.getBoundingClientRect();
    // Only what sits low enough for a bottom toast to cover (desktop's mid-screen controls are clear anyway).
    if (r.height > 0 && r.top < innerHeight && r.bottom > innerHeight * 0.6) top = Math.min(top, r.top);
  }
  return top === Infinity ? null : Math.round(innerHeight - top + 10);
}

/**
 * Where the toasts' room starts: a CSS top in px just below the screen's top bar — a visible top-level `<header>` (the
 * page's banner landmark, e.g. the session screen's bar with Close, Ambience and Mute) near the top of the screen — or
 * null to keep the stylesheet's top (the safe top edge). A stack taller than its room scrolls inside it, so it can
 * never reach up over that bar's controls. 24 px clears the list's 20 px shadow padding above the room (the list's
 * scrollport reaches that far) with 4 px to spare. Screens without such a bar (Today, Stats, Nook, Settings) keep the
 * room exactly as before.
 */
function toastRoomTop(): number | null {
  if (typeof document === 'undefined') return null;
  let bottom = -Infinity;
  for (const h of document.querySelectorAll<HTMLElement>('header')) {
    // Only a page-level bar: a header inside main / a section / an article is a heading block within the content.
    if (h.closest('main, section, article, aside, nav, [aria-hidden="true"], [inert]')) continue;
    const r = h.getBoundingClientRect();
    if (r.height <= 0 || r.bottom <= 0 || r.top > innerHeight * 0.4) continue;
    const cs = getComputedStyle(h);
    if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
    bottom = Math.max(bottom, r.bottom);
  }
  return bottom === -Infinity ? null : Math.round(bottom + 24);
}

/**
 * While toasts are up, keep their room between the screen's top bar (`toastRoomTop()`) and the controls they float
 * above (`toastLiftBottom()`), re-measured as the layout under them changes.
 */
/** The least room a stack keeps under the top bar (a 200 % toast line plus its padding), so it never folds away. */
const MIN_ROOM_PX = 56;

function useToastRoom(active: boolean, regionRef: RefObject<HTMLDivElement | null>): { bottom: number | null; top: number | null } {
  const [bottom, setBottom] = useState<number | null>(null);
  const [top, setTop] = useState<number | null>(null);
  // Measured before the first toast is painted (a layout effect), so a new stack is never drawn for a frame in a room
  // that still reaches the top bar.
  useLayoutEffect(() => {
    if (!active) return;
    const measure = () => {
      const next = toastLiftBottom();
      setBottom((b) => (b === next ? b : next));
      // Below the top bar, but never so low that the room folds up (a landscape phone at 200 % text, where the lift
      // leaves only a strip): then it starts MIN_ROOM_PX above its bottom, as low as it can, still under the bar where
      // there is room for that, or not moved at all where even that is above the stylesheet's own top.
      let nextTop = toastRoomTop();
      if (nextTop != null) {
        const el = regionRef.current;
        const roomBottom = next ?? (el ? parseFloat(getComputedStyle(el).bottom) || 0 : 0);
        const lowest = innerHeight - roomBottom - MIN_ROOM_PX;
        if (nextTop > lowest) nextTop = lowest > 8 ? Math.round(lowest) : null; // 8: the stylesheet's own top
      }
      setTop((t) => (t === nextTop ? t : nextTop));
    };
    measure();
    // Layout under the toast can change while it shows (a route change, the summary rising): re-check briefly.
    const id = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('resize', measure);
    };
  }, [active]);
  return active ? { bottom, top } : { bottom: null, top: null };
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
