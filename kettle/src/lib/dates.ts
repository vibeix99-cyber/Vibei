/**
 * Local-calendar day helpers. A "day key" is 'YYYY-MM-DD' in the user's local
 * timezone — use it for streaks, goals, quests. DST-safe (uses calendar math).
 */
import { clock } from './clock';

export type DayKey = string; // 'YYYY-MM-DD'

export function dayKey(ts: number = clock.now()): DayKey {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DayKey, n: number): DayKey {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d.getTime());
}

export function todayKey(): DayKey {
  return dayKey(clock.now());
}

export function startOfDay(ts: number = clock.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';
export function dayPart(ts: number = clock.now()): DayPart {
  const h = new Date(ts).getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}
