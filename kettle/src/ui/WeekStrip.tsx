/**
 * Warm-streak week row: 7 day dots with labels. OWNER: design-system area.
 * Accepts progress's `WeekStripDay[]` directly (`weekStrip(...)` / `report.streak.week`).
 * `celebrate` makes today's dot light up (empty ring → persimmon check with a pop) —
 * for the "streak extended" moment. Reduced motion: it simply appears lit.
 *
 *   <WeekStrip days={report.streak.week} celebrate delay={0.6} size="lg" />
 */
import { motion } from 'motion/react';
import { Icon } from '@/art';
import { spring } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cx } from './util';
import s from './WeekStrip.module.css';

export type WeekDotState = 'done' | 'cozy' | 'missed' | 'today' | 'future';

export interface WeekStripDayLike {
  day: string;
  /** Narrow weekday label ("M"). */
  label: string;
  state: WeekDotState;
  isToday?: boolean;
}

export interface WeekStripProps {
  days: WeekStripDayLike[];
  size?: 'sm' | 'md' | 'lg';
  /** Animate today's dot lighting up (use when the streak was just extended). */
  celebrate?: boolean;
  /** Seconds before today's dot lights up. */
  delay?: number;
  /** Sunken tray behind the row. Default true. */
  tray?: boolean;
  label?: string;
  className?: string;
}

const STATE_TEXT: Record<WeekDotState, string> = {
  done: 'brewed',
  cozy: 'kept warm by a Tea Cozy',
  missed: 'no brew',
  today: 'today, not brewed yet',
  future: 'coming up',
};

function longDay(day: string) {
  const d = new Date(`${day}T12:00:00`);
  return Number.isNaN(d.getTime()) ? day : d.toLocaleDateString(undefined, { weekday: 'long' });
}

export function WeekStrip({ days, size = 'md', celebrate, delay = 0.4, tray = true, label = 'This week', className }: WeekStripProps) {
  const reduced = useReducedMotion();
  return (
    <ol className={cx(s.strip, s[size], tray && s.tray, className)} aria-label={label}>
      {days.map((d) => {
        const today = d.isToday ?? d.state === 'today';
        const lighting = celebrate && today && d.state === 'done' && !reduced;
        return (
          <li key={d.day} className={s.day} data-state={d.state} data-today={today || undefined} aria-current={today ? 'date' : undefined}>
            <span className={s.label} aria-hidden="true">
              {d.label}
            </span>
            <span className={s.slot}>
              {lighting && <span className={cx(s.dot, s.ghost)} aria-hidden="true" />}
              <motion.span
                className={s.dot}
                initial={lighting ? { scale: 0.2, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={lighting ? { ...spring.joyful, delay } : undefined}
              >
                {d.state === 'done' && (
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <motion.path
                      d="M3.5 8.5l3 3 6-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={lighting ? { pathLength: 0 } : false}
                      animate={{ pathLength: 1 }}
                      transition={lighting ? { duration: 0.3, delay: delay + 0.18 } : undefined}
                    />
                  </svg>
                )}
                {d.state === 'cozy' && <Icon name="cozy" size={size === 'lg' ? 20 : 16} />}
              </motion.span>
            </span>
            <span className="sr-only">
              {longDay(d.day)}: {STATE_TEXT[d.state]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
