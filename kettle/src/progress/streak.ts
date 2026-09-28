/**
 * Warm streak engine — a pure replay of history, so it is always consistent
 * with the sessions on record (import, delete, multi-tab) and DST-safe (it
 * only walks local calendar day keys, never adds 24h to timestamps).
 *
 * Rules
 *  - A day is *warm* when ≥1 completed focus session ended that local day.
 *  - The streak counts warm days in a row. Today is "pending" until you brew:
 *    yesterday's streak stays alive all day today.
 *  - Tea Cozy (streak freeze): +1 each time the streak reaches a multiple of
 *    7 warm days, max 2 held. A missed day while the streak is alive and a
 *    cozy is held consumes the cozy and marks the day 'cozy'; the streak
 *    survives but the cozy day doesn't add to the count (no look-ahead: a
 *    cozy is used as soon as a day is missed, exactly as the user saw it).
 */
import { addDays, dayKey, parseDayKey, type DayKey } from '@/lib/dates';
import type { DayStreakState, SessionRecord, StreakRun, StreakTimeline, WeekDayState, WeekStripDay } from './types';

export const COZY_EVERY = 7;
export const MAX_COZIES = 2;
/** Round-number streaks that deserve an extra cheer. */
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365, 500, 730, 1000];

/** Local days with ≥1 completed focus session. */
export function warmDays(sessions: SessionRecord[]): Set<DayKey> {
  const out = new Set<DayKey>();
  for (const s of sessions) if (s.phase === 'focus' && s.completed) out.add(s.day);
  return out;
}

export function streakTimeline(sessions: SessionRecord[] | Set<DayKey>, today: DayKey): StreakTimeline {
  const warm = sessions instanceof Set ? sessions : warmDays(sessions);
  const days: Record<DayKey, DayStreakState> = {};
  const runs: StreakRun[] = [];
  const cozyEarnedOn: DayKey[] = [];
  const cozyDays: DayKey[] = [];
  let first: DayKey | null = null;
  for (const d of warm) if (d <= today && (first === null || d < first)) first = d;
  const todayDone = warm.has(today);
  if (first === null) {
    return { days, current: 0, best: 0, cozies: 0, runs, todayDone, cozyEarnedOn, cozyDays };
  }

  let cozies = 0;
  let run: StreakRun | null = null;
  let best = 0;
  // Walk local calendar days with one Date cursor (DST-safe: setDate, never +24h).
  const cursor = parseDayKey(first);
  // Guard against absurd spans (corrupt data): at most ~30 years of days.
  let guard = 0;
  for (let day = first; day <= today && guard < 11000; cursor.setDate(cursor.getDate() + 1), day = dayKey(cursor.getTime()), guard++) {
    if (warm.has(day)) {
      if (!run) {
        run = { start: day, end: day, days: 0, cozyDays: [], active: false };
        runs.push(run);
      }
      run.days++;
      run.end = day;
      days[day] = 'done';
      best = Math.max(best, run.days);
      if (run.days % COZY_EVERY === 0 && cozies < MAX_COZIES) {
        cozies++;
        cozyEarnedOn.push(day);
      }
    } else if (day === today) {
      break; // today is still pending
    } else if (run && cozies > 0) {
      cozies--;
      days[day] = 'cozy';
      run.cozyDays.push(day);
      cozyDays.push(day);
    } else {
      days[day] = 'missed';
      run = null;
    }
  }
  if (run) run.active = true;
  return { days, current: run ? run.days : 0, best, cozies, runs, todayDone, cozyEarnedOn, cozyDays };
}

/** Whole days until the next Tea Cozy milestone, counting a brew today. */
export function daysToNextCozy(current: number): number {
  const next = (Math.floor(current / COZY_EVERY) + 1) * COZY_EVERY;
  return next - current;
}

export function milestoneFor(streak: number): number | null {
  return STREAK_MILESTONES.includes(streak) || (streak > 1000 && streak % 365 === 0) ? streak : null;
}

/** First day (local) of the week containing `day`. */
export function weekStart(day: DayKey, weekStartsOn: number): DayKey {
  const dow = parseDayKey(day).getDay();
  const back = (dow - weekStartsOn + 7) % 7;
  return addDays(day, -back);
}

/** Locale-aware first day of the week (0 = Sunday). Falls back to Monday. */
export function localeWeekStart(): number {
  const candidates: string[] = [];
  try {
    if (typeof navigator !== 'undefined') candidates.push(...(navigator.languages ?? []), navigator.language);
    candidates.push(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    /* ignore */
  }
  for (const lang of candidates) {
    if (!lang) continue;
    try {
      const loc = new Intl.Locale(lang) as Intl.Locale & {
        getWeekInfo?: () => { firstDay: number };
        weekInfo?: { firstDay: number };
      };
      const info = loc.getWeekInfo?.() ?? loc.weekInfo;
      if (info && typeof info.firstDay === 'number') return info.firstDay % 7;
    } catch {
      /* try the next candidate */
    }
  }
  return 1;
}

export function narrowWeekday(day: DayKey): string {
  return parseDayKey(day).toLocaleDateString(undefined, { weekday: 'narrow' });
}

/** The calendar week containing `today`, for streak strips. */
export function weekStrip(timeline: StreakTimeline, today: DayKey, weekStartsOn: number): WeekStripDay[] {
  const start = weekStart(today, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    const known = timeline.days[day];
    let state: WeekDayState;
    if (day > today) state = 'future';
    else if (known === 'done') state = 'done';
    else if (known === 'cozy') state = 'cozy';
    else if (day === today) state = 'today';
    else state = 'missed';
    return { day, label: narrowWeekday(day), state, isToday: day === today };
  });
}
