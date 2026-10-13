/**
 * Undo, drawn in the row or control the person acted on (I10: Today's "Mark done", History's delete, Settings › Your
 * data's import). OWNER: design-system area.
 *
 *  - It takes the place of what was acted on, at the person's scroll position: nothing floats, nothing is covered.
 *  - Announced once (one polite announcement through the notices' announcer, src/ui/Toast.tsx `say`). Its button is
 *    called "Undo" (the announcement carries the message, so a screen reader hears it once).
 *  - It lasts its normal duration (5 s; the import 10 s). The clock stands still while the page is hidden, a sheet is
 *    open, or the pointer or keyboard focus is on it.
 *  - When its time is up it goes only at a safe moment (src/ui/moment.ts): the page at rest, or the row wholly above
 *    the view (then the page is scrolled by as much: nothing in view moves). `onExpire` is the parent's cue to put the
 *    row back as it was; the parent renders it no more.
 */
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { cx, renderIcon, type IconSlot } from './util';
import { aboveView, atRest, holdTop, holdView, keepStill } from './moment';
import { say } from './Toast';
import s from './Toast.module.css';

export interface InlineUndoProps {
  /** What happened: "Crossed off. Nice work." */
  message: ReactNode;
  /** The same, as words (announced once). Defaults to `message` when it is a string. */
  spoken?: string;
  icon?: IconSlot;
  /** Tone of the icon (a tone name: matcha, honey…). */
  tone?: string;
  /** ms it lasts. Default 5000. */
  duration?: number;
  /** The person tapped Undo (without it: a plain inline note, e.g. what Undo did, with no button). */
  onUndo?: () => void;
  /** Its time is up (at a safe moment): the parent puts back what was there. */
  onExpire: () => void;
  /** Accessible name of the button (default "Undo"). */
  undoLabel?: string;
  /** Move keyboard focus to the Undo button (the control the person used is gone; it took its place). */
  focus?: boolean;
  className?: string;
  /** Element to render as (a list row: 'li'). */
  as?: 'div' | 'li' | 'p';
  /** Laid out like the line it replaces: words, then the button right after them (not pushed to the end). */
  compact?: boolean;
  /** Class for the button (e.g. the replaced control's own look, so the Undo takes its very box). */
  buttonClassName?: string;
  /** Extra attributes (tests and probes). */
  'data-undo-for'?: string;
}

export function InlineUndo({ message, spoken, icon = 'check', tone = 'matcha', duration = 5000, onUndo, onExpire, undoLabel, focus, compact, buttonClassName, className, as: As = 'div', ...rest }: InlineUndoProps) {
  const ref = useRef<HTMLElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const done = useRef(false);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  // Said once, when it appears (guarded: a development double run of effects must not say it twice).
  const said = useRef(false);
  useEffect(() => {
    if (said.current) return;
    said.current = true;
    const text = spoken ?? (typeof message === 'string' ? message : '');
    if (text) say(onUndo ? `${/[.!?…]$/.test(text) ? text : `${text}.`} Undo` : text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Keyboard focus to the Undo (it took the place of the control the person used), once no sheet is in the way (a
  // closing sheet makes the page inert, then puts focus back itself).
  useLayoutEffect(() => {
    if (!focus) return;
    let raf = 0;
    const until = performance.now() + 2000;
    const tryFocus = () => {
      const blocked = !!document.querySelector('[role="dialog"]') || !!document.getElementById('root')?.hasAttribute('inert');
      if (!blocked) btn.current?.focus({ preventScroll: true });
      else if (performance.now() < until) raf = requestAnimationFrame(tryFocus);
    };
    tryFocus();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The clock: runs while it can be seen and is not held; then it goes at a safe moment.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let left = duration;
    let last = performance.now();
    let pointer = false;
    let focused = false;
    const heldNow = () =>
      pointer || focused || document.visibilityState !== 'visible' || !!document.querySelector('[role="dialog"]') || !!document.getElementById('root')?.hasAttribute('inert');
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(250, now - last);
      last = now;
      if (done.current) return;
      if (left > 0) {
        if (!heldNow()) left -= dt;
        return;
      }
      // Time is up: go now only if nothing in view can move under the person.
      const out = aboveView(el);
      if (!out && !atRest(now)) return;
      const hold = out ? holdView(el) : holdTop(el);
      done.current = true;
      flushSync(() => expire.current());
      keepStill(hold);
    }, 100);
    const pe = () => (pointer = true);
    const pl = () => (pointer = false);
    const fi = () => (focused = true);
    const fo = () => (focused = false);
    el.addEventListener('pointerenter', pe);
    el.addEventListener('pointerleave', pl);
    el.addEventListener('focusin', fi);
    el.addEventListener('focusout', fo);
    return () => {
      window.clearInterval(id);
      el.removeEventListener('pointerenter', pe);
      el.removeEventListener('pointerleave', pl);
      el.removeEventListener('focusin', fi);
      el.removeEventListener('focusout', fo);
    };
  }, [duration]);

  return (
    <As ref={ref as never} className={cx(s.undo, className)} data-inline-undo="" data-compact={compact ? '' : undefined} data-undo-for={rest['data-undo-for']}>
      <span className={s.undoIcon} data-tone={tone} aria-hidden="true">
        {renderIcon(icon, 18)}
      </span>
      <span className={s.undoText}>{message}</span>
      {onUndo && (
        <button
          ref={btn}
          type="button"
          className={buttonClassName ?? s.undoBtn}
          aria-label={undoLabel}
          onClick={() => {
            if (done.current) return;
            done.current = true;
            onUndo();
          }}
        >
          Undo
        </button>
      )}
    </As>
  );
}
