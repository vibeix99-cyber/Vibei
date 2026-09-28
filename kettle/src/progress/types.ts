import type { Phase } from '@/timer/types';
import type { TagId } from '@/state/settings';
import type { DayKey } from '@/lib/dates';

/** One timed phase. Focus sessions drive all stats; breaks are kept for quests/insights. */
export interface SessionRecord {
  id: string;
  phase: Phase;
  startedAt: number;
  endedAt: number;
  plannedMs: number;
  /** Active (unpaused) time. For completed sessions this equals plannedMs. */
  focusedMs: number;
  /** True if the phase ran to zero. */
  completed: boolean;
  intention: string;
  tag: TagId | null;
  /** Local day the session ended on. */
  day: DayKey;
}

export type WeekDayState = 'done' | 'cozy' | 'missed' | 'today' | 'future';

/** Everything the "session complete" celebration sequence needs, computed once. */
export interface CompletionReport {
  record: SessionRecord;
  whileAway: boolean;
  leaves: { base: number; bonuses: { label: string; amount: number }[]; total: number };
  goal: { beforeMin: number; afterMin: number; goalMin: number; justMet: boolean };
  streak: {
    before: number;
    after: number;
    extended: boolean;
    /** Last 7 days ending today, for the streak week strip. */
    week: { day: DayKey; label: string; state: WeekDayState }[];
  };
  level: {
    before: number;
    after: number;
    leavesBefore: number;
    leavesAfter: number;
    /** Item ids from ITEMS newly unlocked by this session. */
    unlocked: string[];
  };
  quests: {
    id: string;
    title: string;
    before: number;
    after: number;
    target: number;
    justCompleted: boolean;
    reward: number;
  }[];
  badges: { id: string; tier: number; title: string }[];
}

export interface LevelInfo {
  level: number;
  leaves: number;
  /** Leaves earned inside the current level. */
  into: number;
  /** Leaves needed to go from this level to the next. */
  size: number;
}

export interface StreakInfo {
  current: number;
  best: number;
  /** A completed focus session exists today. */
  todayDone: boolean;
  /** Tea Cozies (streak freezes) available. */
  cozies: number;
}

export interface TodaySummary {
  day: DayKey;
  focusMs: number;
  sessions: number;
  goalMin: number;
  goalProgress: number; // 0..1+
}

export interface Quest {
  id: string;
  title: string;
  target: number;
  progress: number;
  reward: number;
  done: boolean;
  /** Short icon hint for art: 'clock' | 'cup' | 'sun' | 'moon' | 'leaf' | 'pencil' | 'break' */
  icon: string;
}
