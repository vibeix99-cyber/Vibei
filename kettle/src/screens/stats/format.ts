/** Formatting helpers for the Stats screen. */
import { addDays, parseDayKey, type DayKey } from '@/lib/dates';
import type { IconName } from '@/art';
import type { Tone } from '@/ui';
import type { TagId } from '@/state/settings';

const MIN = 60_000;

/** "38h 20m", "3h", "45 min", "0 min". */
export function hm(ms: number): string {
  const total = Math.round(ms / MIN);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Spoken/long: "3 hours 20 minutes". */
export function hmLong(ms: number): string {
  const total = Math.round(ms / MIN);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m || !h) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  return parts.join(' ');
}

export function minLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const dayDate = (day: DayKey) => parseDayKey(day);

/** "Mon, Sep 28" */
export function shortDay(day: DayKey): string {
  return dayDate(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "Monday, September 28" */
export function longDay(day: DayKey): string {
  return dayDate(day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "Today", "Yesterday", "Mon, Sep 28" (+ year if not this year). */
export function relDay(day: DayKey, today: DayKey): string {
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  const d = dayDate(day);
  const sameYear = d.getFullYear() === dayDate(today).getFullYear();
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

/** "Aug 3" or "Aug 3, 2025" */
export function monthDay(day: DayKey, today: DayKey): string {
  const d = dayDate(day);
  const sameYear = d.getFullYear() === dayDate(today).getFullYear();
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

/** "Sep 13–19", "Sep 28 – Oct 4" (+ year when not this year). */
export function dayRange(a: DayKey, b: DayKey, today: DayKey): string {
  const da = dayDate(a);
  const db = dayDate(b);
  if (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()) return `${monthDay(a, today)}–${db.getDate()}`;
  return `${monthDay(a, today)} – ${monthDay(b, today)}`;
}

export function timeOf(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "9 am" style hour label. */
export function hourLabel(h: number, compact = false): string {
  const d = new Date(2026, 0, 1, h % 24);
  const s = d.toLocaleTimeString(undefined, { hour: 'numeric' });
  return compact ? s.replace(/\s?([AaPp])\.?\s?[Mm]\.?/, (_, x: string) => x.toLowerCase()) : s.replace(/AM|PM/, (x) => x.toLowerCase());
}

export function weekdayShort(day: DayKey): string {
  return dayDate(day).toLocaleDateString(undefined, { weekday: 'short' });
}

export function weekdayNarrow(day: DayKey): string {
  return dayDate(day).toLocaleDateString(undefined, { weekday: 'narrow' });
}

export function monthTitle(year: number, month0: number): string {
  return new Date(year, month0, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function weekdayNames(weekStartsOn: number): { short: string; long: string; narrow: string }[] {
  // 2026-01-04 is a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2026, 0, 4 + ((weekStartsOn + i) % 7));
    return {
      short: d.toLocaleDateString(undefined, { weekday: 'short' }),
      long: d.toLocaleDateString(undefined, { weekday: 'long' }),
      narrow: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
    };
  });
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

export interface TagMeta {
  label: string;
  icon: IconName;
  tone: Tone;
}

/** Same labels/icons as Home's tag chips, same colors as the Focus screen's tag dot. */
export const TAG_META: Record<TagId, TagMeta> = {
  work: { label: 'Work', icon: 'target', tone: 'persimmon' },
  study: { label: 'Study', icon: 'edit', tone: 'sky' },
  read: { label: 'Read', icon: 'info', tone: 'berry' },
  create: { label: 'Create', icon: 'sparkle', tone: 'honey' },
  life: { label: 'Life', icon: 'home', tone: 'matcha' },
};
export const TAG_IDS: TagId[] = ['work', 'study', 'read', 'create', 'life'];

/** Nice round axis ceiling. */
export function niceMax(v: number): { max: number; step: number } {
  const steps = [5, 10, 15, 30, 60, 90, 120, 180, 240, 360, 480, 600, 900, 1200];
  for (const step of steps) {
    const max = Math.ceil(v / step) * step;
    if (max / step <= 4) return { max: Math.max(step, max), step };
  }
  const step = Math.ceil(v / 4 / 60) * 60;
  return { max: step * 4, step };
}
