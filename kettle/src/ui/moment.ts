/**
 * When may something in the page change size? OWNER: design-system area (I10, notices without overlays).
 *
 * The notice strip and the inline Undo rows are in the page flow: when they come or go, what lies below them moves.
 * So they change only at a moment when nothing can be moved out from under the person's finger:
 *
 *  - **at rest**: no pointer is down, and no input at all (pointer down / up / move, wheel, touch, key, scroll) for
 *    `QUIET_MS`;
 *  - **as the answer to the person's own tap or key** (within `RESPONSE_MS` of it): the change is part of what their
 *    action did (a sheet closing, a row turning into its Undo), like any other response;
 *  - **out of view**: the changing box lies wholly above what the person sees of its scroller; then the scroller is
 *    scrolled by the same amount in the same frame (`keepStill`), so nothing in view moves at all.
 *
 * (A screen's first frame is the fourth moment; the strip decides that itself: src/ui/Toast.tsx.)
 */

/** No input for this long (and no pointer down): the person is not touching or about to touch what they last used. */
export const QUIET_MS = 1200;
/** A change within this long after a tap or key is that action's own answer. */
export const RESPONSE_MS = 600;

let started = false;
let down = 0;
let lastInput = -Infinity;
let lastDiscrete = -Infinity;
/** Scrolls this module makes itself are not the person's input. */
let selfScroll = 0;
const waiters = new Set<() => void>();

function stamp(discrete = false) {
  lastInput = performance.now();
  if (discrete) lastDiscrete = lastInput;
}

/** Follow the person's input (idempotent; the Toaster calls it at boot). */
export function watchInput(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  const opts = { capture: true, passive: true } as const;
  addEventListener(
    'pointerdown',
    () => {
      down++;
      stamp();
    },
    opts,
  );
  const up = (e: Event) => {
    down = Math.max(0, down - 1);
    stamp(e.type === 'pointerup');
  };
  addEventListener('pointerup', up, opts);
  addEventListener('pointercancel', up, opts);
  // A mouse resting over the page is a finger hovering over it; a touch "move" is part of a drag (counted above).
  addEventListener('pointermove', (e) => e.pointerType === 'mouse' && stamp(), opts);
  addEventListener('click', () => stamp(true), opts);
  addEventListener('wheel', () => stamp(), opts);
  addEventListener('touchstart', () => stamp(), opts);
  addEventListener('touchmove', () => stamp(), opts);
  addEventListener('touchend', () => stamp(), opts);
  addEventListener('keydown', () => stamp(true), opts);
  addEventListener('scroll', () => (selfScroll > 0 ? undefined : stamp()), opts);
  // A pointer lost to another window, or the page hidden: nobody is touching it now.
  addEventListener('blur', () => (down = 0));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') down = 0;
  });
}

/** Nobody is touching the page and nothing has happened for QUIET_MS. */
export function atRest(now = performance.now()): boolean {
  return down === 0 && now - lastInput >= QUIET_MS;
}
/** ms until `atRest` can be true (0 if it is; Infinity while a pointer is down). */
export function untilRest(now = performance.now()): number {
  if (down > 0) return Infinity;
  return Math.max(0, QUIET_MS - (now - lastInput));
}
/** The last tap or key was less than RESPONSE_MS ago (what changes now is its answer). */
export function answeringInput(now = performance.now()): boolean {
  return down === 0 && now - lastDiscrete < RESPONSE_MS;
}
/** When the last tap or key happened (performance.now()). */
export function lastTapAt(): number {
  return lastDiscrete;
}

/** Call `fn` once the page is at rest (or now, if it is). Returns a cancel function. */
export function whenAtRest(fn: () => void): () => void {
  let id = 0;
  const run = () => {
    const wait = untilRest();
    if (wait === 0) {
      waiters.delete(cancel);
      fn();
      return;
    }
    id = window.setTimeout(run, Number.isFinite(wait) ? wait + 16 : 250);
  };
  const cancel = () => {
    window.clearTimeout(id);
    waiters.delete(cancel);
  };
  waiters.add(cancel);
  run();
  return cancel;
}

/** The element that scrolls `el` (the nearest scrolling ancestor, or the page). */
export function scrollerOf(el: Element): Element {
  for (let e = el.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
    const oy = getComputedStyle(e).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight) return e;
  }
  return document.scrollingElement ?? document.documentElement;
}

/** What the person sees of `scroller`: its box within the viewport. */
export function viewOf(scroller: Element): { top: number; bottom: number; left: number; right: number } {
  if (scroller === document.scrollingElement || scroller === document.documentElement) return { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
  const r = scroller.getBoundingClientRect();
  return { top: Math.max(0, r.top), bottom: Math.min(innerHeight, r.bottom), left: Math.max(0, r.left), right: Math.min(innerWidth, r.right) };
}

/** `el` lies wholly above what the person sees of its scroller (a change in its height moves nothing in view once kept still). */
export function aboveView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const top = viewOf(scrollerOf(el)).top;
  // Wholly above: its bottom at or above the view's top edge, and its top above it (an empty strip lying right at the
  // top edge is in view: what it shows would be seen).
  return r.bottom <= top + 0.5 && r.top < top - 0.5;
}

export interface Still {
  scroller: Element;
  ref: Element;
  top: number;
}
/**
 * Remember what sits in the middle of `el`'s scroller view, before `el` changes height, so `keepStill` can scroll the
 * scroller by however far it moved: nothing in view moves (what changed was above it).
 */
export function holdView(el: Element): Still | null {
  const scroller = scrollerOf(el);
  const v = viewOf(scroller);
  const x = Math.round((v.left + v.right) / 2);
  const y = Math.round(v.top + (v.bottom - v.top) * 0.5);
  let ref = document.elementFromPoint(x, y);
  if (!ref || !scroller.contains(ref) || el.contains(ref)) ref = el.nextElementSibling ?? el.parentElement;
  if (!ref) return null;
  return { scroller, ref, top: ref.getBoundingClientRect().top };
}
/** Remember where `el` itself starts (an in-view change: what is above it stays, what is below it moves). */
export function holdTop(el: Element): Still {
  return { scroller: scrollerOf(el), ref: el, top: el.getBoundingClientRect().top };
}
/** Scroll so that the remembered element is where it was (undoing a move the browser's own anchoring made, too). */
export function keepStill(h: Still | null): void {
  if (!h || !h.ref.isConnected) return;
  const delta = h.ref.getBoundingClientRect().top - h.top;
  if (Math.abs(delta) < 0.5) return;
  selfScroll++;
  try {
    if (h.scroller === document.scrollingElement || h.scroller === document.documentElement) window.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
    else h.scroller.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
  } finally {
    // The scroll event fires asynchronously: keep ignoring it for that frame.
    requestAnimationFrame(() => requestAnimationFrame(() => selfScroll--));
  }
}

/** For tests and probes: the moment rules' state. */
export function momentState() {
  const now = performance.now();
  return { down, sinceInput: now - lastInput, sinceTap: now - lastDiscrete, atRest: atRest(now) };
}
