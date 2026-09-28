/**
 * Tiny shared pieces for the hand-built SVG charts: container width, roving
 * keyboard focus across marks, and the value tooltip (hover = focus).
 */
import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import s from './stats.module.css';

/** Observed content width of an element (0 until measured). */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.round(el.getBoundingClientRect().width));
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      setWidth((prev) => (prev === w ? prev : w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Roving focus over n marks: one tab stop, arrows/Home/End move between marks.
 * `active` is the mark showing its tooltip (hover or focus), or null.
 */
export function useMarks(n: number, initial = 0) {
  const [focusIndex, setFocusIndex] = useState(Math.min(initial, Math.max(0, n - 1)));
  const [active, setActive] = useState<number | null>(null);
  const refs = useRef<(SVGGElement | HTMLElement | null)[]>([]);
  const move = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(n - 1, i));
      setFocusIndex(next);
      setActive(next);
      (refs.current[next] as HTMLElement | null)?.focus();
    },
    [n],
  );
  const onKeyDown = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in map) {
      e.preventDefault();
      move(focusIndex + map[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      move(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      move(n - 1);
    } else if (e.key === 'Escape') {
      setActive(null);
    }
  };
  const markProps = (i: number) => ({
    ref: (el: SVGGElement | null) => {
      refs.current[i] = el;
    },
    tabIndex: i === focusIndex ? 0 : -1,
    onFocus: () => {
      setFocusIndex(i);
      setActive(i);
    },
    onBlur: () => setActive((a) => (a === i ? null : a)),
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setActive(i);
    },
    onPointerLeave: (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setActive((a) => (a === i ? null : a));
    },
    onClick: () => setActive((a) => (a === i ? null : i)),
  });
  return { active, setActive, markProps, onKeyDown, focusIndex };
}

/** Floating value readout anchored above a point (x, y in chart px). */
export function ChartTip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const tipW = 150;
  const left = Math.max(0, Math.min(width - tipW, x - tipW / 2));
  return (
    <div className={s.tip} style={{ left, top: y, width: tipW }} aria-hidden="true">
      {children}
    </div>
  );
}

/** Rounded-top bar path, square at the baseline. */
export function barPath(x: number, y: number, w: number, h: number, r = 6): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}
