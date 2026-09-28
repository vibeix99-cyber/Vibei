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

// ---------------------------------------------------------------------------
// Leaves ledger (auditable: every leaf ever earned has exactly one entry)
// ---------------------------------------------------------------------------

export type LeafKind =
  /** 1 leaf per focused minute (completed or ended early). */
  | 'focus'
  /** The brew ran to the whistle. */
  | 'fullBrew'
  /** First completed brew of the local day. */
  | 'firstBrew'
  /** A completed brew of 50+ minutes. */
  | 'deepSteep'
  /** The daily goal was met (once per day). */
  | 'goal'
  /** A recipe (daily quest) reward. `ref` = quest id. */
  | 'quest'
  /** All three of the day's recipes done (once per day). */
  | 'allQuests'
  /** Leaves carried over from an older data format. */
  | 'carryOver'
  /** Manual / demo grant (seeds). */
  | 'gift';

export interface LeafEntry {
  /** Deterministic id (`focus:<sessionId>`, `goal:<day>`, `quest:<day>:<questId>` …) — makes grants idempotent. */
  id: string;
  at: number;
  day: DayKey;
  kind: LeafKind;
  amount: number;
  /** Session id (focus bonuses) or quest id (quest rewards). */
  ref?: string;
  /** Free-text label for `gift` / `carryOver`. Other kinds derive their label. */
  note?: string;
}

// ---------------------------------------------------------------------------
// Today's recipes (daily quests)
// ---------------------------------------------------------------------------

export type QuestIcon = 'clock' | 'cup' | 'sun' | 'moon' | 'leaf' | 'pencil' | 'break';

export type QuestKind =
  | 'minutes'
  | 'fullBrews'
  | 'teaBreak'
  | 'morning'
  | 'evening'
  | 'intention'
  | 'deepSteep'
  | 'noPause'
  | 'twoTags'
  | 'leaves';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';

/** A recipe as generated for a day (snapshotted so it never changes under the user). */
export interface QuestSpec {
  /** Unique within the day, stable (`minutes-30`). */
  id: string;
  kind: QuestKind;
  title: string;
  target: number;
  reward: number;
  icon: QuestIcon;
  difficulty: QuestDifficulty;
}

export interface QuestDayState {
  /** Daily goal the recipes were scaled to. */
  goalMin: number;
  list: QuestSpec[];
  /** questId → completion timestamp. */
  done: Record<string, number>;
}

/** Public, render-ready quest (what `useQuests()` returns). */
export interface Quest {
  id: string;
  title: string;
  target: number;
  /** Clamped to `target`. */
  progress: number;
  reward: number;
  done: boolean;
  /** Short icon hint for art: 'clock' | 'cup' | 'sun' | 'moon' | 'leaf' | 'pencil' | 'break' */
  icon: QuestIcon;
  kind: QuestKind;
  difficulty: QuestDifficulty;
  /** Epoch ms the recipe was completed, if done. */
  completedAt: number | null;
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export interface BadgeState {
  /** Highest tier reached (0 = locked). */
  tier: number;
  /** unlockedAt[i] = epoch ms tier i+1 was reached. */
  unlockedAt: number[];
}

export interface BadgeProgress {
  id: string;
  title: string;
  /** Description for the next tier to earn (or the top tier once maxed). */
  description: string;
  tier: number;
  maxTier: number;
  /** Current metric value (e.g. sessions before 9 am). */
  value: number;
  /** Threshold of the next tier, or null when maxed. */
  next: number | null;
  /** Threshold of the current tier (0 when locked). */
  current: number;
  /** 0..1 toward the next tier (1 when maxed). */
  toNext: number;
  unlockedAt: number[];
  tiers: number[];
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

export type DayStreakState = 'done' | 'cozy' | 'missed';

export interface StreakRun {
  start: DayKey;
  /** Last done day of the run (cozy days never end a run). */
  end: DayKey;
  /** Done days in the run (cozy days don't count, like Duolingo freezes). */
  days: number;
  cozyDays: DayKey[];
  /** The run is the current, still-warm streak. */
  active: boolean;
}

export interface StreakTimeline {
  /** State of every day from the first warm day up to today (today only when done). */
  days: Record<DayKey, DayStreakState>;
  current: number;
  best: number;
  /** Tea Cozies held right now. */
  cozies: number;
  runs: StreakRun[];
  todayDone: boolean;
  /** Days on which a Tea Cozy was earned (streak milestones). */
  cozyEarnedOn: DayKey[];
  /** Days a Tea Cozy kept the streak warm. */
  cozyDays: DayKey[];
}

export type WeekDayState = 'done' | 'cozy' | 'missed' | 'today' | 'future';

export interface WeekStripDay {
  day: DayKey;
  /** Narrow weekday label ("M"). */
  label: string;
  state: WeekDayState;
  isToday: boolean;
}

// ---------------------------------------------------------------------------
// Completion report — drives the session-complete celebration sequence
// ---------------------------------------------------------------------------

export interface ReportBonus {
  kind: LeafKind;
  label: string;
  amount: number;
}

/** Everything the "session complete" celebration sequence needs, computed once. */
export interface CompletionReport {
  /** = record.id */
  id: string;
  /** When the report was computed. */
  at: number;
  record: SessionRecord;
  whileAway: boolean;
  /** This was the user's very first completed brew. */
  firstEver: boolean;
  leaves: {
    /** Focus-minute leaves. */
    base: number;
    /** Every other grant from this session, in celebration order (incl. recipe rewards). */
    bonuses: ReportBonus[];
    /** base + all bonuses. */
    total: number;
    before: number;
    after: number;
  };
  goal: {
    beforeMin: number;
    afterMin: number;
    goalMin: number;
    justMet: boolean;
    /** Goal was already met before this session. */
    alreadyMet: boolean;
    /** Days the goal has been met, including today if met. */
    metDays: number;
  };
  streak: {
    before: number;
    after: number;
    /** This brew warmed a new day of the streak. */
    extended: boolean;
    best: number;
    /** `after` beat the previous best. */
    newBest: boolean;
    /** Tea Cozies held after this brew. */
    cozies: number;
    /** This brew hit a milestone that earned a Tea Cozy. */
    cozyEarned: boolean;
    /** A round-number milestone worth an extra cheer (3, 7, 14, 30, 50, 100, 365 …), else null. */
    milestone: number | null;
    /** The current calendar week (locale week start), for the streak week strip. */
    week: WeekStripDay[];
  };
  level: {
    before: number;
    after: number;
    leavesBefore: number;
    leavesAfter: number;
    /** Leaves into the level / size of the level, before and after (for the fill animation). */
    intoBefore: number;
    sizeBefore: number;
    intoAfter: number;
    sizeAfter: number;
    /** Item ids from ITEMS newly unlocked by this session. */
    unlocked: string[];
  };
  quests: {
    id: string;
    title: string;
    icon: QuestIcon;
    before: number;
    after: number;
    target: number;
    justCompleted: boolean;
    done: boolean;
    reward: number;
  }[];
  /** All three recipes are now done and this session finished the set. */
  allQuestsJustDone: boolean;
  badges: { id: string; tier: number; title: string; description: string }[];
}

// ---------------------------------------------------------------------------
// Selector outputs
// ---------------------------------------------------------------------------

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
  maxCozies: number;
  /** Streak alive, nothing brewed today, and it's evening (≥ 6 pm). */
  atRisk: boolean;
  /** Days until the next Tea Cozy milestone (counting today's brew). */
  toNextCozy: number;
  /** Most recent day a Tea Cozy kept the streak warm (null if never). */
  lastCozyDay: DayKey | null;
  /** Warm-streak runs for the calendar (oldest first). */
  runs: StreakRun[];
  /** Per-day state for calendars. */
  days: Record<DayKey, DayStreakState>;
}

export interface TodaySummary {
  day: DayKey;
  focusMs: number;
  /** Completed brews today. */
  sessions: number;
  goalMin: number;
  goalProgress: number; // 0..1+
  goalMet: boolean;
  /** Leaves earned today (all sources). */
  leaves: number;
  /** Completed tea breaks today. */
  breaks: number;
}

/** The persisted progress document (schema v2). */
export interface ProgressData {
  /** Every recorded phase (focus + breaks), sorted by endedAt. */
  sessions: SessionRecord[];
  ledger: LeafEntry[];
  /** Cached sum of the ledger. */
  leaves: number;
  /** Cached Tea Cozies held (refreshed on write — `useStreak().cozies` is live). */
  cozies: number;
  /** Daily goal in effect per day (last value used that day). */
  dayGoals: Record<DayKey, number>;
  quests: Record<DayKey, QuestDayState>;
  badges: Record<string, BadgeState>;
  /** Ids of sessions the user deleted (so a stale tab can't re-add them). */
  tombstones: string[];
  lastReport: CompletionReport | null;
  /** Monotonic revision, bumped on every write (cross-tab sync). */
  rev: number;
}
