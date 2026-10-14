/**
 * Notices: `toast('Saved')` anywhere, `<Toaster/>` mounted once (App does it), `<NoticeStrip/>` once per screen.
 * Also shows every `ui:toast` event from the event bus. OWNER: design-system area.
 *
 * I10, notices without overlays (Vibei's decision, W2R3; review/product-excellence/contracts/W2R3/T2-READY-FOR-REVIEW.md):
 *  - Nothing floats. A notice is drawn only in its screen's **notice strip**: an ordinary block in the page flow that
 *    takes room and pushes what follows it down (the tab screens: the top of the page; the session screen: the head of
 *    its panel, or of the summary; the welcome: the top of the page). It can never lie over a control, text or a row.
 *  - **One notice at a time**, the rest queued: by kind (a timed notice with an action, then timed ones, then the
 *    persistent update prompt), then in arrival order. The persistent update prompt never blocks the others: while a
 *    timed notice waits it steps aside, and comes back after.
 *  - **A timed notice's clock runs only while it is shown**: in the active strip, mostly in view (60 %) and on top, the page
 *    visible, no sheet open, and not under the person's pointer or keyboard focus. Waiting never spends it.
 *  - **The strip changes only at a safe moment** (src/ui/moment.ts), so nothing is moved out from under a finger:
 *    a screen's first frame (or its first `ENTRY_MS`: nothing on it has been aimed at yet); the answer to the person's
 *    own tap (a notice their tap raised, or one they tapped away); the strip wholly above the view (it changes and the
 *    page is scrolled by as much in the same frame: nothing in view moves); or the page at rest (no pointer down, no
 *    input for `QUIET_MS`, none waiting to be handled, confirmed in a fresh frame). A notice whose time is up while the
 *    person is busy stays until then.
 *  - **A notice leaving never moves the page** (W3R1, F-T2-1): when a notice goes at rest, or as the answer to a tap,
 *    its face goes but the strip **keeps its room** (an empty band of the same height, `Ctl.room`), so nothing under a
 *    finger that is about to land, or has just landed, moves. The next notice is drawn in that room. The room is given
 *    back only when that moves nothing the person could be aiming at: a new screen (or its first `ENTRY_MS`), the strip
 *    wholly above the view (the page kept still in the same frame), or the page hidden.
 *  - **A route change drops nothing**: the shown notice and the queue move to the next screen's strip (its first
 *    frame), with the time each has left.
 *  - **Announced once**, on arrival, by a light-DOM polite announcer (`[data-notices-said]`); showing, waiting and
 *    leaving change no live region. Inline Undo rows (src/ui/InlineUndo.tsx) are announced through it too.
 * Undo is not a notice: it is drawn in the row or control the person acted on (`InlineUndo`).
 */
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { motion, useIsPresent } from 'motion/react';
import { on } from '@/lib/events';
import { audio } from '@/audio';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cx, renderIcon, type IconSlot } from './util';
import { aboveView, answeringInput, atRest, holdTop, holdView, keepStill, lastTapAt, RESPONSE_MS, scrollerOf, untilRest, viewOf, watchInput, type Still } from './moment';
import s from './Toast.module.css';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'info';

export interface ToastOptions {
  tone?: ToastTone;
  /** Override the tone icon (IconName or node). */
  icon?: IconSlot;
  /** ms it is shown before it goes. Default 3200 (5000 with an action). `Infinity` keeps it. */
  duration?: number;
  action?: { label: string; onClick: () => void };
  /** Replace an existing notice with the same id instead of queueing another. */
  id?: string;
  /** Called when the person dismisses it or its time is up (not on programmatic `toast.dismiss`). */
  onDismiss?: () => void;
}
export interface ToastItem extends ToastOptions {
  id: string;
  message: string;
  /** Arrival order (kept when a notice with the same id is replaced). */
  seq: number;
  /** Raised as the answer to the person's tap or key (within RESPONSE_MS of it). */
  answer: boolean;
}

/** A screen's first moments: what changes now is part of the screen arriving (nothing on it has been aimed at). */
export const ENTRY_MS = 350;
/** A loop guard only (no real event raises a tenth of this): past it the oldest timed notice goes. */
const MAX_NOTICES = 40;

let items: ToastItem[] = [];
const itemListeners = new Set<() => void>();
const emitItems = () => itemListeners.forEach((l) => l());
let seq = 0;
let arrival = 0;
/** ms of shown time each notice has left (kept while it waits, so waiting never spends it). */
const remaining = new Map<string, number>();
/** Notices under the person's pointer or keyboard focus (their clocks stand still). */
const held = new Set<string>();
/** The notice the person just tapped away (its going is their tap's answer). */
let tappedAway: string | null = null;

const durationOf = (t: ToastOptions) => t.duration ?? (t.action ? 5000 : 3200);
/** Waiting order: timed with an action, timed, then persistent (the update prompt). */
const rank = (t: ToastItem) => (!Number.isFinite(durationOf(t)) ? 2 : t.action ? 0 : 1);

export function toast(message: string, opts: ToastOptions = {}): string {
  const id = opts.id ?? `t${++seq}`;
  const prev = items.find((t) => t.id === id);
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  const item: ToastItem = { ...opts, id, message, seq: prev?.seq ?? ++arrival, answer: now - lastTapAt() < RESPONSE_MS };
  items = prev ? items.map((t) => (t.id === id ? item : t)) : [...items, item];
  if (!prev || prev.message !== message) remaining.delete(id);
  while (items.length > MAX_NOTICES) {
    const drop = items.find((t) => Number.isFinite(durationOf(t)) && t.id !== ctl.item?.id) ?? items[0];
    items = items.filter((t) => t !== drop);
    remaining.delete(drop.id);
  }
  if (!prev || prev.message !== message || prev.action?.label !== item.action?.label) say(spoken(item));
  emitItems();
  decide();
  return id;
}
toast.success = (message: string, opts: Omit<ToastOptions, 'tone'> = {}) => toast(message, { ...opts, tone: 'success' });
toast.warning = (message: string, opts: Omit<ToastOptions, 'tone'> = {}) => toast(message, { ...opts, tone: 'warning' });
toast.dismiss = (id?: string) => {
  for (const t of items) if (!id || t.id === id) remaining.delete(t.id);
  items = id ? items.filter((t) => t.id !== id) : [];
  emitItems();
  decide();
};
/** The announcer's live region (for tests and probes: what was said, and a node to observe). */
toast.said = () => saidEl;
/** For tests and probes: the queue, what is shown, and where. */
toast.state = () => ({
  queue: items.map((t) => ({ id: t.id, message: t.message, left: remaining.get(t.id) ?? durationOf(t) })),
  shown: ctl.item?.id ?? null,
  strip: ctl.strip,
  screen: ctl.screen,
  why: ctl.why,
  changed: ctl.changed,
  version: ctl.version,
});

function useItems() {
  return useSyncExternalStore(
    (cb) => {
      itemListeners.add(cb);
      return () => itemListeners.delete(cb);
    },
    () => items,
    () => items,
  );
}

/* ---------------- the announcer: once per notice, on arrival ---------------- */

/** An ordinary light-DOM, visually hidden `role="status" aria-live="polite"` element (`[data-notices-said]`), present
 *  from boot. Tests scope text queries away from it, or read `toast.said()`. */
let saidEl: HTMLElement | null = null;
let unsaid: string[] = [];
/** "Crossed off. Nice work. Undo": the message, then the action it offers. */
function spoken(t: { message: string; action?: { label: string } }) {
  return t.action ? `${/[.!?…]$/.test(t.message) ? t.message : `${t.message}.`} ${t.action.label}` : t.message;
}
/** Say `text` once, politely (one addition to the live region; nothing else in it changes). */
export function say(text: string): void {
  if (typeof document === 'undefined') return;
  if (!saidEl) {
    unsaid.push(text);
    return;
  }
  // Old lines are cleared only in the same task as a new one is added, never on their own.
  while (saidEl.childElementCount >= 6) saidEl.firstElementChild?.remove();
  const p = document.createElement('p');
  p.textContent = text;
  saidEl.appendChild(p);
}

/* ---------------- strips: one per screen, the active one shows the notice ---------------- */

interface Strip {
  id: number;
  prio: number;
  order: number;
  leaving: boolean;
  screen: string;
  el: HTMLElement | null;
}
const strips = new Map<number, Strip>();
let stripSeq = 0;
let stripOrder = 0;

/** The strip notices go to now: the most specific (prio), then the newest, of the strips not leaving. */
function activeStrip(): Strip | null {
  let best: Strip | null = null;
  for (const st of strips.values()) {
    if (st.leaving || !st.el?.isConnected) continue;
    if (!best || st.prio > best.prio || (st.prio === best.prio && st.order > best.order)) best = st;
  }
  return best;
}

interface Ctl {
  version: number;
  /** The strip showing `item` (null: no strip on screen). */
  strip: number | null;
  /** That strip's screen when it took the notice (a new screen is a first frame). */
  screen: string | null;
  /** The notice shown (a snapshot: it stays drawn, if the person is busy, after its time is up or it is dismissed). */
  item: ToastItem | null;
  /** When the strip's screen arrived. */
  at: number;
  /** What to keep still when this version is laid out (src/ui/moment.ts). */
  hold: Still | null;
  /** Why it last changed (tests and probes): a new screen, its first moments, above the view, the answer to a tap, at rest,
   *  the page hidden. */
  why: 'screen' | 'entry' | 'above' | 'answer' | 'rest' | 'update' | 'hidden' | 'none';
  /** The room the strip keeps on this screen after a notice has gone (px; 0: none), so its going moves nothing. */
  room: number;
  /** When (performance.now()). */
  changed: number;
}
let ctl: Ctl = { version: 0, strip: null, screen: null, item: null, at: -Infinity, hold: null, why: 'none', changed: -Infinity, room: 0 };
const ctlListeners = new Set<() => void>();
function commit(patch: Partial<Ctl>) {
  ctl = { ...ctl, hold: null, ...patch, version: ctl.version + 1, changed: performance.now() };
  ctlListeners.forEach((l) => l());
}
function useCtl() {
  return useSyncExternalStore(
    (cb) => {
      ctlListeners.add(cb);
      return () => ctlListeners.delete(cb);
    },
    () => ctl,
    () => ctl,
  );
}

/** What the strip should show: the notice shown while it lasts (unless it is the update prompt and a timed one
 *  waits), else the first in waiting order. */
function wanted(): ToastItem | null {
  const cur = ctl.item ? items.find((t) => t.id === ctl.item!.id) : undefined;
  if (cur && !(rank(cur) === 2 && items.some((t) => rank(t) < 2))) return cur;
  return [...items].sort((a, b) => rank(a) - rank(b) || a.seq - b.seq)[0] ?? null;
}

let retry = 0;
/** Input the browser has received but not handed to the page yet (a tap or wheel on its way): not at rest. */
function inputPending(): boolean {
  try {
    const sched = (navigator as unknown as { scheduling?: { isInputPending?: (o?: { includeContinuous?: boolean }) => boolean } }).scheduling;
    return !!sched?.isInputPending?.({ includeContinuous: true });
  } catch {
    return false;
  }
}
/** A change at rest is made only in a fresh frame, after the input that reached the browser before it has been handed
 *  to the page (pointer moves, wheel and scroll are delivered with the frame): `atRest` is then checked again. */
let restFrame = 0;
let inRestFrame = false;
function confirmRestInFrame(): void {
  if (restFrame) return;
  restFrame = requestAnimationFrame(() => {
    restFrame = 0;
    inRestFrame = true;
    try {
      decide();
    } finally {
      inRestFrame = false;
    }
  });
}
function waitForRest(now: number): void {
  window.clearTimeout(retry);
  const wait = untilRest(now);
  retry = window.setTimeout(decide, Number.isFinite(wait) ? wait + 20 : 200);
}
/** The strip's height now (what it keeps as its room when its notice goes). */
const heightOf = (el: HTMLElement) => el.getBoundingClientRect().height;

/** Decide what the active strip shows, and change it only at a safe moment (see the file's head). */
function decide(): void {
  if (typeof document === 'undefined') return;
  const strip = activeStrip();
  if (!strip) {
    // No strip on screen (between two views): nothing is shown, the notice waits with its time.
    if (ctl.strip !== null) commit({ strip: null, screen: null, why: 'screen', room: 0 });
    return;
  }
  const next = wanted();
  const now = performance.now();
  if (strip.id !== ctl.strip || strip.screen !== ctl.screen) {
    // A screen's first frame: what it shows is part of its arrival (and it starts with no room kept).
    commit({ strip: strip.id, screen: strip.screen, item: next, at: now, why: 'screen', room: 0 });
    return;
  }
  const el = strip.el!;
  const hidden = document.visibilityState === 'hidden';
  if ((next?.id ?? null) === (ctl.item?.id ?? null)) {
    if (next && next !== ctl.item) commit({ item: next, why: 'update' }); // the same notice, updated (same id)
    else if (ctl.room > 0 && !ctl.item) {
      // The room a gone notice left: given back only when that moves nothing in view.
      if (now - ctl.at < ENTRY_MS) commit({ room: 0, hold: holdTop(el), why: 'entry' });
      else if (hidden) commit({ room: 0, hold: null, why: 'hidden' });
      else if (aboveView(el)) commit({ room: 0, hold: holdView(el), why: 'above' });
    }
    return;
  }
  let hold: Still | null;
  let why: Ctl['why'];
  // Moments when the strip may change height (nothing in view moves, or nothing on it has been aimed at yet)...
  let free = true;
  if (now - ctl.at < ENTRY_MS) [hold, why] = [holdTop(el), 'entry'];
  else if (hidden) [hold, why] = [null, 'hidden'];
  else if (aboveView(el)) [hold, why] = [holdView(el), 'above'];
  else {
    // ... and moments when it changes in view: a notice going keeps its room (F-T2-1), so its going moves nothing.
    free = false;
    if (answeringInput(now) && ((next?.answer && now - lastTapAt() < RESPONSE_MS) || (ctl.item && ctl.item.id === tappedAway))) [hold, why] = [holdTop(el), 'answer'];
    else if (atRest(now) && !inputPending()) {
      if (!inRestFrame) {
        confirmRestInFrame();
        return;
      }
      [hold, why] = [holdTop(el), 'rest'];
    } else {
      // The person is busy: the strip stays as it is (a notice whose time is up stays drawn) until they are not.
      waitForRest(now);
      return;
    }
  }
  if (ctl.item?.id === tappedAway) tappedAway = null;
  const room = free ? 0 : Math.max(ctl.room, ctl.item ? heightOf(el) : 0);
  commit({ item: next, hold, why, room });
}

/* ---------------- the clock: runs only while the notice is shown ---------------- */

/** The shown notice is in view (at least 60 % of it) and on top, the page is visible and no sheet is open. */
function seenNow(id: string): boolean {
  if (document.visibilityState !== 'visible') return false;
  if (document.querySelector('[role="dialog"]') || document.getElementById('root')?.hasAttribute('inert')) return false;
  if (held.has(id)) return false;
  const li = document.getElementById(`notice-${id}`);
  if (!li) return false;
  const r = li.getBoundingClientRect();
  if (r.height <= 0) return false;
  // Most of it in view (a page scrolled by a few px still shows it), and on top at the middle of what is in view.
  const v = viewOf(scrollerOf(li));
  const top = Math.max(r.top, v.top, 0);
  const bottom = Math.min(r.bottom, v.bottom, innerHeight);
  if (bottom - top < r.height * 0.6) return false;
  const hit = document.elementFromPoint((r.left + r.right) / 2, (top + bottom) / 2);
  return !!hit && li.contains(hit);
}

let clock = 0;
let lastTick = 0;
function tick() {
  const now = performance.now();
  const dt = Math.min(250, now - lastTick);
  lastTick = now;
  const it = ctl.item;
  const cur = it && items.find((t) => t.id === it.id);
  if (cur && Number.isFinite(durationOf(cur)) && seenNow(cur.id)) {
    const left = (remaining.get(cur.id) ?? durationOf(cur)) - dt;
    if (left > 0) remaining.set(cur.id, left);
    else {
      // Its time is up: out of the queue. It stays drawn until the strip may change (decide).
      remaining.delete(cur.id);
      items = items.filter((t) => t.id !== cur.id);
      emitItems();
      cur.onDismiss?.();
    }
  }
  decide();
  // (While the strip keeps a room, the clock keeps looking for the moment to give it back.)
  if (!items.length && !ctl.item && !ctl.room) stopClock();
}
function startClock() {
  if (clock || typeof window === 'undefined') return;
  lastTick = performance.now();
  clock = window.setInterval(tick, 100);
}
function stopClock() {
  window.clearInterval(clock);
  clock = 0;
}

/* ---------------- components ---------------- */

/** The announcer, the `ui:toast` bus, input following and the clock. Mounted once. */
export function Toaster() {
  const list = useItems();
  const c = useCtl();
  const saidRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    watchInput();
    // The page hidden: a kept room can be given back (nobody is aiming at it).
    const vis = () => decide();
    document.addEventListener('visibilitychange', vis);
    const off = on('ui:toast', ({ message, tone }) => {
      toast(message, { tone });
    });
    return () => {
      document.removeEventListener('visibilitychange', vis);
      off();
    };
  }, []);
  // The announcer; notices raised before it was mounted (at boot) are said now, once.
  useLayoutEffect(() => {
    const el = saidRef.current;
    if (!el || saidEl === el) return;
    saidEl = el;
    for (const text of unsaid) say(text);
    unsaid = [];
  }, []);
  useEffect(() => {
    if (list.length || c.item || c.room) startClock();
  }, [list, c.item, c.room]);
  return <div ref={saidRef} className="sr-only" role="status" aria-live="polite" aria-atomic="false" aria-relevant="additions" data-notices-said="" />;
}

/** True inside a route layer (or session view) that is on its way out: its strip shows nothing. */
const Leaving = createContext(false);
/** Marks a route layer as leaving (src/app/App.tsx): no notice is drawn in a screen that is going. */
export function NoticeLayer({ leaving, children }: { leaving: boolean; children: ReactNode }) {
  const parent = useContext(Leaving);
  return <Leaving.Provider value={parent || leaving}>{children}</Leaving.Provider>;
}

/**
 * A screen's notice strip, in its page flow. `prio`: a screen's own strip (1) wins over the shell's (0) while both are
 * mounted. `screen`: a new value is a new screen (its first frame). `off`: not in use now (e.g. covered by another
 * part of its screen). Empty, it takes no room.
 */
export function NoticeStrip({ prio = 0, screen = '', off = false, className }: { prio?: number; screen?: string; off?: boolean; className?: string }) {
  const leaving = useContext(Leaving) || !useIsPresent() || off;
  const idRef = useRef(0);
  if (!idRef.current) idRef.current = ++stripSeq;
  const id = idRef.current;
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    const prev = strips.get(id);
    strips.set(id, { id, prio, order: prev?.order ?? ++stripOrder, leaving, screen, el: ref.current });
    decide();
  }, [id, prio, leaving, screen]);
  useLayoutEffect(
    () => () => {
      strips.delete(id);
      decide();
    },
    [id],
  );
  const c = useCtl();
  const item = c.strip === id && !leaving ? c.item : null;
  // The room a gone notice left (F-T2-1): the strip keeps at least that height (empty, or with the next notice in it)
  // until giving it back moves nothing in view.
  const room = c.strip === id && !leaving ? c.room : 0;
  // Laid out: keep still what the change must not move (moment.ts), before this frame is painted.
  useLayoutEffect(() => {
    if (c.strip !== id || !c.hold) return;
    const h = c.hold;
    ctl.hold = null;
    keepStill(h);
  }, [c, id]);
  return (
    <div
      ref={ref}
      className={cx(s.strip, className)}
      data-notice-strip=""
      data-has={item || room ? '' : undefined}
      data-room={room && !item ? '' : undefined}
      style={room ? { minHeight: room } : undefined}
      role={item ? 'group' : undefined}
      aria-label={item ? 'Notifications' : undefined}
    >
      {item && (
        <ol className={s.list}>
          <NoticeView key={item.id} item={item} reduced={reduced} />
        </ol>
      )}
    </div>
  );
}

const TONE_ICON: Record<ToastTone, { glyph: 'check' | 'info' | 'sparkle' | 'bell'; tone: string }> = {
  neutral: { glyph: 'sparkle', tone: 'honey' },
  success: { glyph: 'check', tone: 'matcha' },
  warning: { glyph: 'bell', tone: 'berry' },
  info: { glyph: 'info', tone: 'sky' },
};

/** Notices whose sound has played (once, when first shown; not again on the next screen). */
const played = new Set<string>();

function NoticeView({ item, reduced }: { item: ToastItem; reduced: boolean }) {
  const tone = item.tone ?? 'neutral';
  const meta = TONE_ICON[tone];
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const key = `${item.id}\u0000${item.message}`;
    if (tone === 'success' && !played.has(key)) audio.play('pop', { volume: 0.6 });
    played.add(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Under the pointer or holding keyboard focus: its clock stands still.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let pointer = false;
    let focus = false;
    const sync = () => (pointer || focus ? held.add(item.id) : held.delete(item.id));
    const set = (k: 'p' | 'f', v: boolean) => () => {
      if (k === 'p') pointer = v;
      else focus = v;
      sync();
    };
    const pe = set('p', true);
    const pl = set('p', false);
    const fi = set('f', true);
    const fo = set('f', false);
    el.addEventListener('pointerenter', pe);
    el.addEventListener('pointerleave', pl);
    el.addEventListener('focusin', fi);
    el.addEventListener('focusout', fo);
    return () => {
      held.delete(item.id);
      el.removeEventListener('pointerenter', pe);
      el.removeEventListener('pointerleave', pl);
      el.removeEventListener('focusin', fi);
      el.removeEventListener('focusout', fo);
    };
  }, [item.id]);
  const away = () => {
    tappedAway = item.id;
    toast.dismiss(item.id);
    item.onDismiss?.();
  };
  return (
    <motion.li
      ref={ref}
      id={`notice-${item.id}`}
      data-id={item.id}
      className={s.toast}
      // The box is laid out whole from its first frame (it pushed the page once, at once); only its face fades in (and,
      // with motion, settles from 98 % about its own centre: it never reaches outside its own box).
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      animate={reduced ? { opacity: 1, transition: { duration: 0.12 } } : { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        away();
      }}
    >
      <span className={s.icon} data-tone={meta.tone} aria-hidden="true">
        {renderIcon(item.icon ?? meta.glyph, 18)}
      </span>
      <span className={s.message}>{item.message}</span>
      {item.action && (
        <button
          type="button"
          className={s.action}
          onClick={() => {
            item.action?.onClick();
            tappedAway = item.id;
            toast.dismiss(item.id);
          }}
        >
          {item.action.label}
        </button>
      )}
    </motion.li>
  );
}
