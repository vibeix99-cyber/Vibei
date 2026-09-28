/** Test helpers for progress unit tests (not used by the app). */
import { clock } from '@/lib/clock';
import { dayKey, parseDayKey, type DayKey } from '@/lib/dates';
import type { SessionRecord } from './types';

const MIN = 60_000;
let n = 0;

/** Pin the app clock to a local wall time. */
export function setNow(y: number, mo: number, d: number, h = 12, mi = 0): number {
  const target = new Date(y, mo - 1, d, h, mi, 0, 0).getTime();
  clock.reset();
  clock.advance(target - Date.now());
  return target;
}

export function atLocal(day: DayKey, h: number, m = 0): number {
  const d = parseDayKey(day);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** A focus session starting at local day/h:m. */
export function brew(day: DayKey, h = 9, m = 0, opts: Partial<SessionRecord> & { min?: number; stopAt?: number; pauseMin?: number } = {}): SessionRecord {
  const { min = 25, stopAt, pauseMin = 0, ...rest } = opts;
  const startedAt = atLocal(day, h, m);
  const focusedMs = (stopAt ?? min) * MIN;
  const endedAt = startedAt + focusedMs + pauseMin * MIN;
  return {
    id: `t${++n}`,
    phase: 'focus',
    startedAt,
    endedAt,
    plannedMs: min * MIN,
    focusedMs,
    completed: stopAt == null,
    intention: '',
    tag: null,
    day: dayKey(endedAt),
    ...rest,
  };
}

export function teaBreak(day: DayKey, h = 10, m = 0, min = 5): SessionRecord {
  const startedAt = atLocal(day, h, m);
  const endedAt = startedAt + min * MIN;
  return {
    id: `b${++n}`,
    phase: 'shortBreak',
    startedAt,
    endedAt,
    plannedMs: min * MIN,
    focusedMs: min * MIN,
    completed: true,
    intention: '',
    tag: null,
    day: dayKey(endedAt),
  };
}
