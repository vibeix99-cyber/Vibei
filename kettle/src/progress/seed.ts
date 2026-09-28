/**
 * Demo profiles for screenshots / reviews / e2e. OWNER: progress area.
 * Used by `?seed=<name>` and `__kettle.seed(name)`.
 *
 * Deterministic: histories are hand-shaped + seeded PRNG, then replayed
 * through the real engine so ledger, recipes, badges and cozies are exactly
 * what a real user would have. Seeds (except `fresh`) pin the local time of
 * day via the debug clock so screenshots are stable:
 *   newbie / veteran / celebrate / blank → today 15:30 · atRisk → today 19:40
 *
 *   fresh     — brand new, not onboarded (welcome flow)
 *   blank     — onboarded, nothing brewed yet (empty states)
 *   newbie    — 3 days in, 3-day streak, level ~4, first badges
 *   veteran   — ~2 months: 23-day streak with a Tea Cozy day, level ~12,
 *               rich history across tags & hours, many badges, recipes partly done
 *   celebrate — finishing the next brew (25 min) extends the streak to 7
 *               (+Tea Cozy, milestone), meets the goal, completes 2 recipes,
 *               levels up 7 → 8 (unlocks the record player) and earns exactly
 *               one badge: Warm Streak II
 *   atRisk    — 5-day streak alive, nothing today, 7:40 pm
 */
import { clock } from '@/lib/clock';
import { addDays, dayKey, parseDayKey, type DayKey } from '@/lib/dates';
import { useSettings, type TagId } from '@/state/settings';
import { replay } from './engine';
import { leavesForLevel } from './levels';
import { prng } from './rand';
import { localeWeekStart, streakTimeline } from './streak';
import { badgeMetrics, evaluateBadges } from './badgeEngine';
import { useProgress } from './store';
import type { ProgressData, QuestSpec, SessionRecord } from './types';

export type SeedName = 'fresh' | 'blank' | 'newbie' | 'veteran' | 'celebrate' | 'atRisk';
export const SEED_NAMES: SeedName[] = ['fresh', 'blank', 'newbie', 'veteran', 'celebrate', 'atRisk'];

const MIN = 60_000;

interface Brew {
  /** Local start time. */
  h: number;
  m: number;
  /** Planned minutes. */
  min: number;
  /** Ended early after this many focused minutes (not completed). */
  stopAt?: number;
  tag?: TagId | null;
  intent?: string;
  /** Minutes spent paused. */
  pause?: number;
  /** Tea break after (minutes, completed). null = no break. */
  tea?: number | null;
}

/** Move the debug clock so local time today is hh:mm. */
export function pinTimeOfDay(h: number, m: number): void {
  const now = clock.now();
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  clock.advance(d.getTime() - now);
}

function at(day: DayKey, h: number, m: number): number {
  const d = parseDayKey(day);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function recordsFor(day: DayKey, brews: Brew[], idPrefix: string): SessionRecord[] {
  const out: SessionRecord[] = [];
  brews.forEach((b, i) => {
    const start = at(day, b.h, b.m);
    const planned = b.min * MIN;
    const focused = b.stopAt != null ? b.stopAt * MIN : planned;
    const end = start + focused + (b.pause ?? 0) * MIN;
    out.push({
      id: `${idPrefix}_${day}_${i}`,
      phase: 'focus',
      startedAt: start,
      endedAt: end,
      plannedMs: planned,
      focusedMs: focused,
      completed: b.stopAt == null,
      intention: b.intent ?? '',
      tag: b.tag ?? null,
      day: dayKey(end),
    });
    if (b.stopAt == null && b.tea != null) {
      const bs = end + 30_000;
      const be = bs + b.tea * MIN;
      out.push({
        id: `${idPrefix}_${day}_${i}_tea`,
        phase: b.tea >= 15 ? 'longBreak' : 'shortBreak',
        startedAt: bs,
        endedAt: be,
        plannedMs: b.tea * MIN,
        focusedMs: b.tea * MIN,
        completed: true,
        intention: '',
        tag: null,
        day: dayKey(be),
      });
    }
  });
  return out;
}

const INTENTS: Record<TagId, string[]> = {
  work: ['Quarterly report', 'Inbox zero', 'Design review notes', 'Budget spreadsheet', 'Client proposal', 'Roadmap draft'],
  study: ['Spanish practice', 'Statistics problem set', 'Thesis chapter 3', 'Flashcards', 'Lecture notes'],
  read: ['Read: The Hobbit', 'Read: Braiding Sweetgrass', 'Long-read article', 'Poetry, slowly'],
  create: ['Sketch ideas', 'Watercolour study', 'Write a short story', 'Record a demo', 'Knitting pattern'],
  life: ['Tidy the desk', 'Plan the week', 'Taxes (ugh)', 'Meal plan', 'Letters to friends'],
};
const TAG_WEIGHTS: [TagId, number][] = [
  ['work', 0.4],
  ['study', 0.2],
  ['read', 0.15],
  ['create', 0.15],
  ['life', 0.1],
];

function pickTag(r: () => number): TagId {
  let x = r();
  for (const [t, w] of TAG_WEIGHTS) {
    if (x < w) return t;
    x -= w;
  }
  return 'work';
}

/** A realistic day for the veteran: mostly mornings, some afternoons, the odd evening/late night. */
function veteranDay(r: () => number, n: number, opts: { allowPartial?: boolean } = {}): Brew[] {
  const brews: Brew[] = [];
  const slotRoll = r();
  // Start hour distribution: 55% morning, 30% afternoon, 12% evening, 3% late night.
  let h = slotRoll < 0.55 ? 7 + Math.floor(r() * 3) : slotRoll < 0.85 ? 13 + Math.floor(r() * 3) : slotRoll < 0.97 ? 19 + Math.floor(r() * 2) : 22;
  let m = Math.floor(r() * 4) * 15;
  for (let i = 0; i < n; i++) {
    const deep = r() < 0.16;
    const min = deep ? 50 : r() < 0.12 ? 15 : 25;
    const tag = r() < 0.08 ? null : pickTag(r);
    const named = r() < 0.72;
    const partial = opts.allowPartial && i > 0 && r() < 0.1;
    brews.push({
      h,
      m,
      min,
      tag,
      intent: named && tag ? INTENTS[tag][Math.floor(r() * INTENTS[tag].length)] : '',
      stopAt: partial ? Math.max(5, Math.floor(min * (0.3 + r() * 0.4))) : undefined,
      pause: !partial && r() < 0.2 ? 1 + Math.floor(r() * 4) : 0,
      tea: partial ? null : r() < 0.75 ? (min >= 50 ? 10 : 5) : null,
    });
    const gap = min + 10 + Math.floor(r() * 50);
    const t = h * 60 + m + gap;
    h = Math.floor(t / 60);
    m = t % 60;
    if (h >= 23) break;
  }
  return brews;
}

function build(records: SessionRecord[], goalMin: number, quests?: Record<DayKey, QuestSpec[]>): ProgressData {
  return replay(records, { goalMin, weekStartsOn: localeWeekStart(), quests });
}

function finish(data: ProgressData): void {
  useProgress.getState().load({ ...data, lastReport: null });
}

// ---------------------------------------------------------------------------

function seedNewbie(today: DayKey): ProgressData {
  const d = (o: number) => addDays(today, o);
  const records = [
    ...recordsFor(d(-2), [{ h: 19, m: 5, min: 25, tag: 'study', intent: 'Spanish practice', tea: 5 }], 'nb'),
    ...recordsFor(
      d(-1),
      [
        { h: 8, m: 30, min: 25, tag: 'study', intent: 'Spanish practice', tea: 5 },
        { h: 20, m: 10, min: 25, stopAt: 14, tag: 'read', intent: 'Read: The Hobbit' },
      ],
      'nb',
    ),
    ...recordsFor(d(0), [{ h: 10, m: 15, min: 25, tag: 'work', intent: '', tea: null }], 'nb'),
  ];
  return build(records, 30);
}

function seedVeteran(today: DayKey): ProgressData {
  const r = prng(42);
  const d = (o: number) => addDays(today, o);
  const records: SessionRecord[] = [];
  let k = 0;
  const add = (o: number, brews: Brew[]) => records.push(...recordsFor(d(o), brews, `vt${k++}`));
  // Early days: a 6-day run, then scattered days (the streak broke).
  for (let o = -52; o <= -47; o++) add(o, veteranDay(r, 1 + Math.floor(r() * 2)));
  for (const o of [-43, -36, -33, -29, -27]) add(o, veteranDay(r, 1));
  // Current run: -23 … today, with a Tea Cozy on -9 (a brew ended early that day).
  for (let o = -23; o <= -1; o++) {
    if (o === -9) {
      add(o, [{ h: 21, m: 30, min: 25, stopAt: 11, tag: 'life', intent: 'Plan the week' }]);
      continue;
    }
    add(o, veteranDay(r, 1 + Math.floor(r() * 2), { allowPartial: true }));
  }
  // A couple of late-night brews for Moonlit Sipper, a marathon day.
  add(-16, [{ h: 22, m: 40, min: 25, tag: 'create', intent: 'Write a short story', tea: null }]);
  add(-12, [
    { h: 16, m: 0, min: 25, tag: 'work', intent: 'Client proposal', tea: 5 },
    { h: 16, m: 35, min: 25, tag: 'work', intent: 'Client proposal', tea: 5 },
    { h: 17, m: 10, min: 25, tag: 'work', intent: 'Client proposal', tea: 5 },
    { h: 17, m: 45, min: 25, tag: 'study', intent: 'Flashcards', tea: 15 },
  ]);
  // Today: two brews so far (50 of 60 min), recipes partly done.
  add(0, [
    { h: 9, m: 5, min: 25, tag: 'work', intent: 'Roadmap draft', tea: 5 },
    { h: 13, m: 20, min: 25, tag: 'read', intent: '', pause: 3, tea: null },
  ]);
  return build(records, 60);
}

function seedCelebrate(today: DayKey): ProgressData {
  const d = (o: number) => addDays(today, o);
  const records: SessionRecord[] = [];
  let k = 0;
  const add = (o: number, brews: Brew[]) => records.push(...recordsFor(d(o), brews, `cb${k++}`));
  add(-11, [{ h: 18, m: 0, min: 25, tag: 'create', intent: 'Sketch ideas', tea: 5 }]);
  add(-10, [{ h: 9, m: 0, min: 25, tag: 'create', intent: 'Sketch ideas', tea: null }]);
  for (let o = -6; o <= -1; o++)
    add(o, [
      { h: 9, m: 30, min: 25, tag: o % 2 ? 'work' : 'study', intent: o % 2 ? 'Inbox zero' : 'Statistics problem set', tea: 5 },
      ...(o % 3 === 0 ? [{ h: 14, m: 0, min: 25, tag: 'read' as TagId, intent: 'Read: The Hobbit', tea: 5 }] : []),
    ]);
  // Earlier today: a brew ended early (12 min) — counts toward the goal, not the streak.
  add(0, [{ h: 10, m: 0, min: 25, stopAt: 12, tag: 'work', intent: 'Inbox zero' }]);
  const quests: Record<DayKey, QuestSpec[]> = {
    [today]: [
      { id: 'fullBrews-1', kind: 'fullBrews', title: 'Finish a full brew', target: 1, reward: 10, icon: 'cup', difficulty: 'easy' },
      { id: 'minutes-30', kind: 'minutes', title: 'Brew for 30 minutes', target: 30, reward: 15, icon: 'clock', difficulty: 'medium' },
      { id: 'leaves-85', kind: 'leaves', title: 'Earn 85 leaves', target: 85, reward: 20, icon: 'leaf', difficulty: 'hard' },
    ],
  };
  let data = build(records, 30, quests);
  // Park leaves 30 below level 8 so the next brew (≈68 leaves) levels up to 8 and unlocks
  // the record player — without also tipping Leaf Collector or Nook Builder into a new
  // tier, so the celebration shows exactly one badge (Warm Streak II).
  const target = leavesForLevel(8) - 30;
  if (target > data.leaves) {
    const now = clock.now();
    const gift = target - data.leaves;
    const at = now - 3 * 3600_000;
    const ledger = [...data.ledger, { id: 'gift:celebrate', at, day: dayKey(at), kind: 'gift' as const, amount: gift, note: 'Welcome gift' }];
    const leaves = data.leaves + gift;
    const best = streakTimeline(data.sessions, dayKey(now)).best;
    const { badges } = evaluateBadges(data.badges, badgeMetrics({ sessions: data.sessions, ledger, leaves, bestStreak: best }), at);
    data = { ...data, ledger, leaves, badges };
  }
  return data;
}

function seedAtRisk(today: DayKey): ProgressData {
  const d = (o: number) => addDays(today, o);
  const records: SessionRecord[] = [];
  for (let o = -5; o <= -1; o++)
    records.push(...recordsFor(d(o), [{ h: 8 + (o % 2 ? 0 : 1), m: 15, min: 25, tag: 'study', intent: 'Thesis chapter 3', tea: 5 }], 'ar'));
  records.push(...recordsFor(d(-8), [{ h: 20, m: 0, min: 25, tag: 'read', intent: 'Read: The Hobbit', tea: null }], 'ar'));
  return build(records, 30);
}

export function seedProfile(name: SeedName): void {
  const settings = useSettings.getState();
  useProgress.getState().resetAll();
  switch (name) {
    case 'fresh':
      settings.set({ onboarded: false, name: '' });
      return;
    case 'blank':
      pinTimeOfDay(15, 30);
      settings.set({ onboarded: true, name: 'Alex', dailyGoalMin: 30 });
      return;
    case 'newbie':
      pinTimeOfDay(15, 30);
      settings.set({ onboarded: true, name: 'Sam', dailyGoalMin: 30, lastTag: 'study' });
      finish(seedNewbie(dayKey(clock.now())));
      return;
    case 'celebrate':
      pinTimeOfDay(15, 30);
      settings.set({ onboarded: true, name: 'Mika', dailyGoalMin: 30, lastTag: 'work' });
      finish(seedCelebrate(dayKey(clock.now())));
      return;
    case 'atRisk':
      pinTimeOfDay(19, 40);
      settings.set({ onboarded: true, name: 'Jo', dailyGoalMin: 30, lastTag: 'study' });
      finish(seedAtRisk(dayKey(clock.now())));
      return;
    case 'veteran':
    default:
      pinTimeOfDay(15, 30);
      settings.set({ onboarded: true, name: 'Robin', dailyGoalMin: 60, lastTag: 'work' });
      finish(seedVeteran(dayKey(clock.now())));
  }
}
