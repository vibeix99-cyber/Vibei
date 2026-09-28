/**
 * Pure analytics over session history for the Stats screen (and anyone else:
 * the rail, share cards…). No React, no store — easy to test.
 */
import { addDays, parseDayKey, type DayKey } from '@/lib/dates';
import type { TagId } from '@/state/settings';
import { weekStart } from './streak';
import type { LeafEntry, SessionRecord } from './types';

const MIN = 60_000;

export interface Totals {
  /** Focused ms over all focus sessions (full + ended early). */
  focusMs: number;
  /** Completed focus sessions. */
  brews: number;
  /** All recorded focus sessions. */
  sessions: number;
  /** Distinct local days with any focus. */
  days: number;
  breaks: number;
  firstDay: DayKey | null;
  longestMs: number;
}

export function totals(sessions: SessionRecord[]): Totals {
  let focusMs = 0;
  let brews = 0;
  let count = 0;
  let breaks = 0;
  let longestMs = 0;
  let firstDay: DayKey | null = null;
  const days = new Set<DayKey>();
  for (const s of sessions) {
    if (s.phase !== 'focus') {
      if (s.completed) breaks++;
      continue;
    }
    count++;
    focusMs += s.focusedMs;
    longestMs = Math.max(longestMs, s.focusedMs);
    if (s.completed) brews++;
    days.add(s.day);
    if (firstDay === null || s.day < firstDay) firstDay = s.day;
  }
  return { focusMs, brews, sessions: count, days: days.size, breaks, firstDay, longestMs };
}

export interface DayTotal {
  focusMs: number;
  brews: number;
  partial: number;
}

export function dayTotals(sessions: SessionRecord[]): Map<DayKey, DayTotal> {
  const out = new Map<DayKey, DayTotal>();
  for (const s of sessions) {
    if (s.phase !== 'focus') continue;
    const t = out.get(s.day) ?? { focusMs: 0, brews: 0, partial: 0 };
    t.focusMs += s.focusedMs;
    if (s.completed) t.brews++;
    else t.partial++;
    out.set(s.day, t);
  }
  return out;
}

export interface WeekBar {
  day: DayKey;
  minutes: number;
  brews: number;
  /** Goal met that day (ledger truth for past days). */
  met: boolean;
  isToday: boolean;
  future: boolean;
}

/**
 * Seven days of bars. `weekStartsOn` null = rolling window ending today
 * (offset 0 = the last 7 days); a number = calendar weeks.
 */
export function weekSeries(
  byDay: Map<DayKey, DayTotal>,
  metDays: Set<DayKey>,
  today: DayKey,
  weekStartsOn: number | null,
  offset = 0,
): WeekBar[] {
  const start = addDays(weekStartsOn == null ? addDays(today, -6) : weekStart(today, weekStartsOn), offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    const t = byDay.get(day);
    return {
      day,
      minutes: t ? Math.floor(t.focusMs / MIN) : 0,
      brews: t?.brews ?? 0,
      met: metDays.has(day),
      isToday: day === today,
      future: day > today,
    };
  });
}

/** Days the daily goal was met (one ledger entry per day). */
export function goalMetDays(ledger: LeafEntry[]): Set<DayKey> {
  const out = new Set<DayKey>();
  for (const e of ledger) if (e.kind === 'goal') out.add(e.day);
  return out;
}

/** Month grid rows (weeks) of day keys; null = padding outside the month. */
export function monthGrid(year: number, month0: number, weekStartsOn: number): (DayKey | null)[][] {
  const first = new Date(year, month0, 1);
  const daysIn = new Date(year, month0 + 1, 0).getDate();
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const cells: (DayKey | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysIn; d++) {
    cells.push(`${year}-${String(month0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7) cells.push(null);
  const rows: (DayKey | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/**
 * Focused minutes per local hour of day (0–23). A session's focused time is
 * spread over the wall-clock hours it spanned (pauses shrink it evenly).
 */
export function hourHistogram(sessions: SessionRecord[], fromDay?: DayKey): number[] {
  const out = new Array(24).fill(0);
  for (const s of sessions) {
    if (s.phase !== 'focus' || s.focusedMs <= 0) continue;
    if (fromDay && s.day < fromDay) continue;
    const span = Math.max(1, s.endedAt - s.startedAt);
    const scale = s.focusedMs / span;
    let t = s.startedAt;
    while (t < s.endedAt) {
      const d = new Date(t);
      const next = new Date(d);
      next.setMinutes(0, 0, 0);
      next.setHours(d.getHours() + 1);
      const end = Math.min(s.endedAt, next.getTime());
      out[d.getHours()] += ((end - t) * scale) / MIN;
      if (end <= t) break;
      t = end;
    }
  }
  return out.map((m) => Math.round(m));
}

export type Chronotype = 'early' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface Rhythm {
  /** Start hour of the busiest 2-hour window. */
  peakStart: number;
  peakMinutes: number;
  type: Chronotype;
  /** Share of minutes by part of day. */
  parts: { morning: number; afternoon: number; evening: number; night: number };
}

const PART_HOURS: Record<'morning' | 'afternoon' | 'evening' | 'night', number[]> = {
  morning: [5, 6, 7, 8, 9, 10, 11],
  afternoon: [12, 13, 14, 15, 16],
  evening: [17, 18, 19, 20, 21],
  night: [22, 23, 0, 1, 2, 3, 4],
};

/**
 * Chronotype = the part of day holding most focus; the sweet spot is the
 * busiest 2-hour window whose first hour lies in that part (so the two
 * statements never contradict each other).
 */
export function rhythmOf(hist: number[]): Rhythm | null {
  const total = hist.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  const share = (hours: number[]) => hours.reduce((a, h) => a + hist[h], 0) / total;
  const parts = {
    morning: share(PART_HOURS.morning),
    afternoon: share(PART_HOURS.afternoon),
    evening: share(PART_HOURS.evening),
    night: share(PART_HOURS.night),
  };
  const dominant = (Object.keys(parts) as (keyof typeof parts)[]).reduce((a, b) => (parts[b] > parts[a] ? b : a));
  let peakStart = PART_HOURS[dominant][0];
  let peakMinutes = -1;
  let best = -1;
  for (const h of PART_HOURS[dominant]) {
    const v = hist[h] + hist[(h + 1) % 24];
    // Prefer windows that start on a busy hour when totals tie.
    const score = v * 1000 + hist[h];
    if (score > best) {
      best = score;
      peakMinutes = v;
      peakStart = h;
    }
  }
  const type: Chronotype = dominant === 'morning' && peakStart < 7 ? 'early' : dominant;
  return { peakStart, peakMinutes, type, parts };
}

export interface TagSlice {
  tag: TagId | null;
  focusMs: number;
  sessions: number;
  share: number;
}

export function tagBreakdown(sessions: SessionRecord[], fromDay?: DayKey): TagSlice[] {
  const map = new Map<TagId | null, { focusMs: number; sessions: number }>();
  let total = 0;
  for (const s of sessions) {
    if (s.phase !== 'focus') continue;
    if (fromDay && s.day < fromDay) continue;
    const t = map.get(s.tag) ?? { focusMs: 0, sessions: 0 };
    t.focusMs += s.focusedMs;
    t.sessions++;
    map.set(s.tag, t);
    total += s.focusedMs;
  }
  return [...map.entries()]
    .map(([tag, v]) => ({ tag, ...v, share: total ? v.focusMs / total : 0 }))
    .sort((a, b) => (a.tag === null ? 1 : b.tag === null ? -1 : b.focusMs - a.focusMs));
}

export interface HistoryDay {
  day: DayKey;
  focusMs: number;
  /** Focus sessions, newest first. */
  sessions: SessionRecord[];
}

/** Focus sessions grouped by day, newest day first. */
export function historyByDay(sessions: SessionRecord[]): HistoryDay[] {
  const map = new Map<DayKey, SessionRecord[]>();
  for (const s of sessions) {
    if (s.phase !== 'focus') continue;
    const list = map.get(s.day) ?? [];
    list.push(s);
    map.set(s.day, list);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, list]) => ({
      day,
      focusMs: list.reduce((a, s) => a + s.focusedMs, 0),
      sessions: list.sort((a, b) => b.startedAt - a.startedAt),
    }));
}

/** Leaves earned per session id (focus + its bonuses, incl. first-brew). */
export function leavesBySession(ledger: LeafEntry[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of ledger) {
    if (!e.ref || e.kind === 'quest' || e.kind === 'allQuests') continue;
    out.set(e.ref, (out.get(e.ref) ?? 0) + e.amount);
  }
  return out;
}

/** Month (year, month0) of a day key. */
export function monthOf(day: DayKey): { year: number; month0: number } {
  const d = parseDayKey(day);
  return { year: d.getFullYear(), month0: d.getMonth() };
}


export interface PersonalBests {
  bestDay: { day: DayKey; focusMs: number } | null;
  longestBrew: { day: DayKey; focusMs: number } | null;
  mostBrews: { day: DayKey; brews: number } | null;
  /** Best calendar week by focus (week start day). */
  bestWeek: { start: DayKey; focusMs: number } | null;
}

export function personalBests(sessions: SessionRecord[], weekStartsOn: number): PersonalBests {
  const byDay = dayTotals(sessions);
  let bestDay: PersonalBests['bestDay'] = null;
  let mostBrews: PersonalBests['mostBrews'] = null;
  const weeks = new Map<DayKey, number>();
  for (const [day, t] of byDay) {
    if (!bestDay || t.focusMs > bestDay.focusMs) bestDay = { day, focusMs: t.focusMs };
    if (t.brews > 0 && (!mostBrews || t.brews > mostBrews.brews)) mostBrews = { day, brews: t.brews };
    const ws = weekStart(day, weekStartsOn);
    weeks.set(ws, (weeks.get(ws) ?? 0) + t.focusMs);
  }
  let longestBrew: PersonalBests['longestBrew'] = null;
  for (const s of sessions) {
    if (s.phase === 'focus' && s.completed && (!longestBrew || s.focusedMs > longestBrew.focusMs)) longestBrew = { day: s.day, focusMs: s.focusedMs };
  }
  let bestWeek: PersonalBests['bestWeek'] = null;
  for (const [start, focusMs] of weeks) if (!bestWeek || focusMs > bestWeek.focusMs) bestWeek = { start, focusMs };
  return { bestDay, longestBrew, mostBrews, bestWeek };
}
