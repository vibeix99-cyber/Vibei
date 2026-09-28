/**
 * The focus dial: a chunky ring with a tactile darker edge under the arc and a
 * little bead at the head. Driven every animation frame by the timer
 * (`useProgressFrame`) without re-rendering React; `value` overrides it
 * (e.g. 1 while the kettle whistles). Colors come from CSS vars on an
 * ancestor (--ring-arc / --ring-edge / --ring-track / --ring-head) so phase
 * changes (focus → paused → whistle → break) crossfade.
 *
 * Specialised on purpose (edge + bead + phase crossfade); the kit `Ring` is
 * used for the small rings elsewhere.
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useProgressFrame } from '@/timer';
import s from './TimerRing.module.css';

export interface TimerRingProps {
  /** Fixed value 0..1 instead of following the timer. */
  value?: number;
  /** Stroke thickness in viewBox units (viewBox is 100). */
  thickness?: number;
  className?: string;
  children?: ReactNode;
}

export function TimerRing({ value, thickness = 7, className, children }: TimerRingProps) {
  const r = 50 - thickness / 2 - 1.5;
  const c = 2 * Math.PI * r;
  const arc = useRef<SVGCircleElement>(null);
  const edge = useRef<SVGCircleElement>(null);
  const head = useRef<SVGCircleElement>(null);
  const group = useRef<SVGGElement>(null);
  const fixed = useRef(value);
  fixed.current = value;

  const paint = (p: number) => {
    const v = Math.max(0, Math.min(1, p));
    const off = String(c * (1 - v));
    arc.current?.setAttribute('stroke-dashoffset', off);
    edge.current?.setAttribute('stroke-dashoffset', off);
    const visible = v > 0.003;
    if (group.current) group.current.style.opacity = visible ? '1' : '0';
    if (head.current) {
      const a = v * 2 * Math.PI - Math.PI / 2;
      head.current.setAttribute('cx', String(50 + r * Math.cos(a)));
      head.current.setAttribute('cy', String(50 + r * Math.sin(a)));
      head.current.style.opacity = visible ? '1' : '0';
    }
  };

  useProgressFrame((p) => {
    if (fixed.current == null) paint(p);
  });
  useLayoutEffect(() => {
    if (value != null) paint(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, c]);

  return (
    <div className={[s.ring, className].filter(Boolean).join(' ')}>
      <svg viewBox="0 0 100 100" className={s.svg} aria-hidden="true" focusable="false">
        <circle className={s.track} cx="50" cy="50" r={r} strokeWidth={thickness} fill="none" />
        <g ref={group} transform="rotate(-90 50 50)" style={{ opacity: 0 }}>
          <circle
            ref={edge}
            className={s.edge}
            cx="50"
            cy="50"
            r={r}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c}
            transform="translate(-1.3 0)"
          />
          <circle ref={arc} className={s.arc} cx="50" cy="50" r={r} strokeWidth={thickness} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c} />
        </g>
        <circle ref={head} className={s.head} cx="50" cy={50 - r} r={thickness * 0.24} style={{ opacity: 0 }} />
      </svg>
      {children && <div className={s.inner}>{children}</div>}
    </div>
  );
}
