/**
 * Warm days, in Kettle's words (W3R1 warm-days glossary, I13 supportive return). Pure and unit-tested. OWNER: home area.
 *
 * Where a person stands with their warm days today, read only from the progress engine's own numbers (no rule,
 * eligibility or arithmetic here), and the short lines Today and the rail say about it:
 *  - a day with at least one finished brew is a **warm day**; the current run is "N days warm" (or "N warm days in a
 *    row" in a sentence), the best is the "warmest run";
 *  - a Tea Cozy is explained only where it is true for this person (they hold one, or one was just used for them);
 *  - the lines invite, never threaten: no "streak", no "lose", "break" or "don't miss", no urgency.
 */
import { addDays, type DayKey } from '@/lib/dates';
import { COZY_EVERY } from '@/progress/streak';

export type WarmKind =
  /** Never had a warm day. */
  | 'fresh'
  /** Had warm days before; the last run has ended (a day went by unwarmed with no Tea Cozy to cover it). */
  | 'returning'
  /** Today is already warm. */
  | 'warmToday'
  /** A run is going and a Tea Cozy covered the day(s) just before today; today not warm yet. */
  | 'cozyKept'
  /** A run is going; today not warm yet. */
  | 'pending';

export interface WarmState {
  kind: WarmKind;
  /** Warm days in a row now (the engine's `current`). */
  n: number;
  /** The warmest run (the engine's `best`). */
  best: number;
  /** Tea Cozies held now. */
  cozies: number;
  /** Days a Tea Cozy covered, in a row, ending yesterday (0 if yesterday was not covered). */
  cozyDays: number;
}

export interface WarmInput {
  current: number;
  best: number;
  todayDone: boolean;
  cozies: number;
  days?: Record<string, string>;
}

export function warmState(st: WarmInput, today: DayKey): WarmState {
  let cozyDays = 0;
  for (let d = addDays(today, -1); st.days?.[d] === 'cozy' && cozyDays < 30; d = addDays(d, -1)) cozyDays++;
  const kind: WarmKind =
    st.todayDone ? 'warmToday' : st.current > 0 ? (cozyDays > 0 ? 'cozyKept' : 'pending') : st.best > 0 ? 'returning' : 'fresh';
  return { kind, n: st.current, best: st.best, cozies: st.cozies, cozyDays };
}

const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;
const warmDays = (n: number) => `${n} warm ${n === 1 ? 'day' : 'days'}`;
const warmDaysInARow = (n: number) => `${warmDays(n)} in a row`;
const moreWarmDays = (n: number) => `${n} more warm ${n === 1 ? 'day' : 'days'}`;

/** What a Tea Cozy covered, for this person: "yesterday" or "while you were away". */
export function cozyWhen(w: WarmState): string {
  return w.cozyDays === 1 ? 'yesterday' : 'while you were away';
}

/** The rail's heading: "N days warm", or an invitation before the first warm day of a run. */
export function warmTitle(w: WarmState): string {
  return w.n > 0 ? `${days(w.n)} warm` : w.kind === 'returning' ? 'Welcome back' : 'Warm the kettle';
}

/** The rail's caption under it (short). `evening`: the engine's evening hours (its `atRisk`). */
export function warmCaption(w: WarmState, evening = false): string {
  switch (w.kind) {
    case 'fresh':
      return 'One brew today makes it a warm day.';
    case 'returning':
      return 'One brew warms the kettle today.';
    case 'warmToday':
      return 'Warm today. Lovely.';
    case 'cozyKept':
      return `A Tea Cozy kept it warm ${cozyWhen(w)}.`;
    case 'pending':
      return evening ? 'One brew tonight adds another day.' : 'One brew today adds another day.';
  }
}

/** The Today status bar sheet's line under "N days warm". */
export function warmSheetLine(w: WarmState): string {
  switch (w.kind) {
    case 'fresh':
      return 'One brew warms the kettle today. Each day with a finished brew is a warm day.';
    case 'returning':
      return `Welcome back. One brew warms the kettle today. Your warmest run so far: ${days(w.best)}.`;
    case 'warmToday':
      return `${warmDaysInARow(w.n)}, today included.`;
    case 'cozyKept':
      return `A Tea Cozy kept the kettle warm ${cozyWhen(w)}, so your ${warmDaysInARow(w.n)} carry on. One brew today adds another.`;
    case 'pending':
      return `${warmDaysInARow(w.n)}. One brew today adds another.`;
  }
}

/**
 * The Tea Cozy note in that sheet, true for this person: what one does only when they hold one (or one was just used
 * for them); otherwise how one is earned.
 */
export function cozyNote(w: WarmState, toNextCozy: number): string {
  const what = 'A Tea Cozy keeps the kettle warm through one missed day. It’s used for you, so there’s nothing to remember.';
  if (w.cozies > 0) return `${what}${w.cozies > 1 ? ` You have ${w.cozies}.` : ' You have one.'}`;
  if (w.kind === 'cozyKept') return `${what} Yours was used ${cozyWhen(w)}.${toNextCozy > 0 ? ` You’ll earn the next after ${moreWarmDays(toNextCozy)} in a row.` : ''}`;
  if (w.n > 0 && toNextCozy > 0) return `No Tea Cozy yet. You’ll earn one after ${moreWarmDays(toNextCozy)} in a row: it keeps the kettle warm through one missed day.`;
  return `Every ${COZY_EVERY} warm days in a row earn a Tea Cozy: it keeps the kettle warm through one missed day.`;
}
