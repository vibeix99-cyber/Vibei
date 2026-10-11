/**
 * Toasts: `toast('Saved')` anywhere, `<Toaster/>` mounted once (App does it).
 * Also shows every `ui:toast` event from the event bus. OWNER: design-system area.
 * Polite live region, auto-dismiss (paused on hover/focus), tap to dismiss, max 3.
 */
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { createPortal, flushSync } from 'react-dom';
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
  const { bottom: above, top: below, dock } = useToastRoom(list.length > 0 || drawn, regionRef, list);
  if (typeof document === 'undefined') return null;
  const room = dock
    ? dock
    : above != null || below != null
      ? { ...(above != null && { bottom: above }), ...(below != null && { top: below }) }
      : undefined;
  return createPortal(
    <div ref={regionRef} className={s.region} style={room} data-docked={dock ? '' : undefined}>
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
 * Where the toasts' room starts: a CSS top in px just below the controls of the screen's top bar — a visible top-level
 * `<header>` (the page's banner landmark, e.g. the session screen's bar with Close, Ambience and Mute) near the top of
 * the screen — that sit above the toasts' column; or null to keep the stylesheet's top (the safe top edge). A stack taller than its room scrolls inside it, so it can
 * never reach up over that bar's controls. 24 px clears the list's 20 px shadow padding above the room (the list's
 * scrollport reaches that far) with 4 px to spare. Screens without such a bar (Today, Stats, Nook, Settings) keep the
 * room exactly as before.
 */
function toastRoomTop(): number | null {
  if (typeof document === 'undefined') return null;
  // The column the toasts are drawn in: only a bar control above that column can be covered.
  const live = document.querySelector<HTMLElement>('[aria-label="Notifications"]');
  let col: { left: number; right: number; width: number } | undefined = live?.getBoundingClientRect();
  if (!live || !col || col.width <= 0) return null;
  // While the stack is in a dock (useToastRoom), the column it goes back to: the region's own, centred on the screen.
  const region = live.parentElement;
  if (region?.hasAttribute('data-docked')) {
    const vw = document.documentElement.clientWidth;
    const pad = parseFloat(getComputedStyle(region).paddingLeft) || 0;
    const width = Math.min(parseFloat(getComputedStyle(live).maxWidth) || Infinity, vw - 2 * pad);
    col = { left: (vw - width) / 2, right: (vw + width) / 2, width };
  }
  let bottom = -Infinity;
  for (const h of document.querySelectorAll<HTMLElement>('header')) {
    // Only a page-level bar: a header inside main / a section / an article is a heading block within the content.
    if (h.closest('main, section, article, aside, nav, [aria-hidden="true"], [inert]')) continue;
    const r = h.getBoundingClientRect();
    if (r.height <= 0 || r.bottom <= 0 || r.top > innerHeight * 0.4) continue;
    const cs = getComputedStyle(h);
    if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
    for (const c of h.querySelectorAll('button, a[href], [role="button"], input, select')) {
      const q = c.getBoundingClientRect();
      if (q.width > 0 && q.height > 0 && q.right > col.left && q.left < col.right) bottom = Math.max(bottom, q.bottom);
    }
  }
  return bottom === -Infinity ? null : Math.round(bottom + 24);
}

/** What a toast could cover: anything a person taps or types into. */
const CONTROLS = 'button, a[href], input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';

/**
 * The bottom of the words of the screen's top bar (a page-level `<header>` near the top, as in `toastRoomTop()`) that
 * sit above the toasts' column (e.g. "Next: brew 2 of 4" on a landscape phone), plus the same 24 px: what a stack must
 * stay under to cover none of them. Its controls are `toastRoomTop()`'s. Null where no words sit above the column.
 */
function topBarBottom(): number | null {
  const col = document.querySelector('[aria-label="Notifications"]')?.getBoundingClientRect();
  if (!col || col.width <= 0) return null;
  let bottom = -Infinity;
  for (const h of document.querySelectorAll<HTMLElement>('header')) {
    if (h.closest('main, section, article, aside, nav, [aria-hidden="true"], [inert]')) continue;
    const r = h.getBoundingClientRect();
    if (r.height <= 0 || r.bottom <= 0 || r.top > innerHeight * 0.4) continue;
    const cs = getComputedStyle(h);
    if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
    for (const w of h.querySelectorAll('*')) {
      if (w.childElementCount > 0 || !w.textContent?.trim()) continue;
      const q = w.getBoundingClientRect();
      if (q.width > 0 && q.height > 0 && q.right > col.left && q.left < col.right) bottom = Math.max(bottom, q.bottom);
    }
  }
  return bottom === -Infinity ? null : Math.round(bottom + 24);
}

/**
 * A docked stack taller than its dock (three toasts at 200 % text on a landscape phone) folds its toasts, oldest
 * first, to their first line (`data-folded`, Toast.module.css: the icon, the message's opening and an ellipsis, the
 * action as always), only as many as it takes to fit, so every toast is in view, named, and its action can be tapped.
 * Measured unfolded each time (all in one task: nothing is painted in between). `height` Infinity unfolds them all.
 */
function foldToFit(region: HTMLElement, height: number) {
  const items = [...(region.querySelector('ol')?.children ?? [])] as HTMLElement[];
  for (const li of items) li.removeAttribute('data-folded');
  for (let k = 0; k < items.length && height !== Infinity && stackHeight(region) > height; k++) items[k].setAttribute('data-folded', '');
}

/** The least room a stack keeps under the top bar (a 200 % toast line plus its padding), so it never folds away. */
const MIN_ROOM_PX = 56;

interface DockRoom {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Where toasts may float when there is no room for them above the controls (I04 R7-D1): a `[data-toast-dock]` box
 * that the stylesheet opts in for the current layout (`--toast-dock: on`, e.g. the session's stage, only where it is a
 * column of its own beside the panel and the top bar), on screen, at least MIN_ROOM_PX each way, and with no control
 * anywhere over it, whatever draws it. Returned as the region's inset (CSS top / bottom / left / right), or null.
 */
function toastDock(region: HTMLElement | null): DockRoom | null {
  if (typeof document === 'undefined') return null;
  const vw = document.documentElement.clientWidth;
  for (const el of document.querySelectorAll<HTMLElement>('[data-toast-dock]')) {
    if (el.closest('[aria-hidden="true"], [inert]')) continue;
    if (getComputedStyle(el).getPropertyValue('--toast-dock').trim() !== 'on') continue;
    const r = el.getBoundingClientRect();
    const t = Math.max(r.top, 0);
    const b = Math.min(r.bottom, innerHeight);
    const l = Math.max(r.left, 0);
    const rt = Math.min(r.right, vw);
    if (b - t < MIN_ROOM_PX || rt - l < MIN_ROOM_PX) continue;
    let clear = true;
    for (const c of document.querySelectorAll<HTMLElement>(CONTROLS)) {
      if (region?.contains(c) || c.closest('[aria-hidden="true"], [inert]')) continue;
      const q = c.getBoundingClientRect();
      if (q.width > 0 && q.height > 0 && q.right > l && q.left < rt && q.bottom > t && q.top < b) {
        clear = false;
        break;
      }
    }
    if (clear) return { top: Math.round(t), bottom: Math.round(innerHeight - b), left: Math.round(l), right: Math.round(vw - rt) };
  }
  return null;
}

/**
 * The height the stack needs to show every toast whole, as laid out in the region now: each toast's own content
 * height (`scrollHeight`: a toast squeezed by a short room still reports all of it), the gaps between them and the
 * list's end padding.
 */
function stackHeight(region: HTMLElement): number {
  const list = region.querySelector('ol');
  const items = list ? ([...list.children] as HTMLElement[]) : [];
  if (!list || items.length === 0) return 0;
  const cs = getComputedStyle(list);
  const gap = parseFloat(cs.rowGap) || 0;
  let h = (parseFloat(cs.paddingBottom) || 0) + gap * (items.length - 1);
  for (const li of items) h += li.scrollHeight + (parseFloat(getComputedStyle(li).marginBottom) || 0);
  return h;
}

/**
 * While toasts are up, keep their room between the screen's top bar (`toastRoomTop()`) and the controls they float
 * above (`toastLiftBottom()`), re-measured as the layout under them changes (a timer, every scroll, a resize, a toast
 * arriving or leaving).
 *
 * When that room cannot hold the stack whole, and the screen has a dock (`toastDock()`), the stack moves into the dock
 * instead (I04 R7-D1: Break's over scrolled to its end at 200 % text brings its whole action group to the top of a
 * landscape phone, and the room above it was a strip). The dock holds no control, so nothing can be covered there at
 * any scroll offset, and it is at least MIN_ROOM_PX each way. The stack stays docked while toasts are up (it never
 * jumps back and forth as the panel scrolls) and leaves the dock when the dock goes (another screen, a stacked layout,
 * a control over it). A screen without a dock keeps the room exactly as before.
 */
function useToastRoom(
  active: boolean,
  regionRef: RefObject<HTMLDivElement | null>,
  stack: unknown,
): { bottom: number | null; top: number | null; dock: DockRoom | null } {
  const [bottom, setBottom] = useState<number | null>(null);
  const [top, setTop] = useState<number | null>(null);
  const [dock, setDock] = useState<DockRoom | null>(null);
  const docked = useRef(false);
  const measureRef = useRef<(() => void) | null>(null);
  // Measured before the first toast is painted (a layout effect), so a new stack is never drawn for a frame in a room
  // that still reaches the top bar.
  useLayoutEffect(() => {
    if (!active) return;
    let raf = 0;
    const later = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          flushSync(measure);
        });
    };
    // A panel scrolled under the toasts moves the controls they float above: the room follows at once, in the scroll
    // event (the frame's scroll steps, before its animation-frame callbacks and its paint), never a frame later.
    const onScroll = () => flushSync(measure);
    const measure = () => {
      const el = regionRef.current;
      const next = toastLiftBottom();
      setBottom((b) => (b === next ? b : next));
      // Below the top bar, but never so low that the room folds up (a landscape phone at 200 % text, where the lift
      // leaves only a strip): then it starts MIN_ROOM_PX above its bottom, as low as it can, still under the bar where
      // there is room for that, or not moved at all where even that is above the stylesheet's own top.
      let nextTop = toastRoomTop();
      const roomBottom = next ?? (el ? parseFloat(getComputedStyle(el).bottom) || 0 : 0);
      if (nextTop != null) {
        const lowest = innerHeight - roomBottom - MIN_ROOM_PX;
        if (nextTop > lowest) nextTop = lowest > 8 ? Math.round(lowest) : null; // 8: the stylesheet's own top
      }
      setTop((t) => (t === nextTop ? t : nextTop));
      const where = toastDock(el);
      const dockH = where ? innerHeight - where.top - where.bottom : 0;
      if (!where) {
        // Leaving the dock: measured again once the region is back in its own place.
        if (docked.current) later();
        docked.current = false;
      } else if (!docked.current && el) {
        // The room above the controls, below the top bar (where the bar reaches over the toasts' column, its words too),
        // is too short for the stack whole: shorter than the stack's own height, or than the least room, or short
        // enough for the squeezed one-line layout (`@container toast-room (max-height: 4em)`, Toast.module.css).
        const room = innerHeight - roomBottom - Math.max(nextTop ?? 8, topBarBottom() ?? -Infinity);
        const em = parseFloat(getComputedStyle(el).fontSize) || 16;
        if ((room < MIN_ROOM_PX || room <= 4 * em || stackHeight(el) > room) && dockH > room) {
          docked.current = true;
          later(); // folded to fit once it is drawn in the dock
        }
      }
      if (el) foldToFit(el, docked.current && where && el.hasAttribute('data-docked') ? dockH : Infinity);
      const nextDock = docked.current ? where : null;
      setDock((d) =>
        d === nextDock || (d && nextDock && d.top === nextDock.top && d.bottom === nextDock.bottom && d.left === nextDock.left && d.right === nextDock.right)
          ? d
          : nextDock,
      );
    };
    measureRef.current = measure;
    measure();
    // Layout under the toast can change while it shows (a route change, the summary rising): re-check briefly, and on
    // every scroll (a panel scrolled under the toasts moves the controls they float above), in the frame it is drawn.
    const id = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll, { capture: true });
      measureRef.current = null;
      docked.current = false;
    };
  }, [active]);
  // A toast arriving or leaving changes what the stack needs: measured again before it is painted.
  useLayoutEffect(() => {
    measureRef.current?.();
  }, [stack]);
  return active ? { bottom, top, dock } : { bottom: null, top: null, dock: null };
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
