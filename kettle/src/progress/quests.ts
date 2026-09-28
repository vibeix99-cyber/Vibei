/**
 * Today's recipes (daily quests).
 *
 * Three a day — one easy, one medium, one hard — drawn from a template pool,
 * deterministically from the day key (seeded PRNG) and scaled to the daily
 * goal. Variety rules: no two recipes of the same kind or icon on one day, and
 * yesterday's kinds are avoided when the pool allows. The generated list is
 * snapshotted per day (see QuestDayState) so it never shifts under the user.
 */
import { addDays, type DayKey } from '@/lib/dates';
import { hashString, prng } from './rand';
import type { LeafEntry, Quest, QuestDayState, QuestDifficulty, QuestIcon, QuestKind, QuestSpec, SessionRecord } from './types';

const MIN = 60_000;
export const DEEP_STEEP_MS = 50 * MIN;
/** Leaves for finishing a recipe, by difficulty. */
export const QUEST_REWARD: Record<QuestDifficulty, number> = { easy: 10, medium: 15, hard: 20 };
export const ALL_QUESTS_BONUS = 10;

const r5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

interface Template {
  kind: QuestKind;
  icon: QuestIcon;
  weight: number;
  target: (d: QuestDifficulty, goal: number) => number | null;
  title: (n: number) => string;
  /** Only makes sense before this local hour (time-window recipes). */
  closesAtHour?: number;
}

const TEMPLATES: Template[] = [
  {
    kind: 'minutes',
    icon: 'clock',
    weight: 3,
    target: (d, g) => (d === 'easy' ? r5(Math.max(10, g / 2)) : d === 'medium' ? r5(Math.max(15, g)) : r5(Math.max(25, g * 1.5))),
    title: (n) => `Brew for ${n} minutes`,
  },
  {
    kind: 'fullBrews',
    icon: 'cup',
    weight: 3,
    target: (d, g) => (d === 'easy' ? 1 : d === 'medium' ? (g >= 30 ? 2 : null) : g <= 15 ? 2 : Math.min(6, Math.round(g / 25) + 2)),
    title: (n) => (n === 1 ? 'Finish a full brew' : `Finish ${n} full brews`),
  },
  {
    kind: 'teaBreak',
    icon: 'break',
    weight: 2,
    target: (d, g) => (d === 'easy' ? 1 : d === 'medium' && g >= 60 ? 2 : null),
    title: (n) => (n === 1 ? 'Take a full tea break' : `Take ${n} full tea breaks`),
  },
  {
    kind: 'morning',
    icon: 'sun',
    weight: 1.5,
    target: (d) => (d === 'medium' ? 1 : null),
    title: () => 'Start a brew before 10 am',
    closesAtHour: 10,
  },
  {
    kind: 'evening',
    icon: 'moon',
    weight: 1.5,
    target: (d) => (d === 'medium' ? 1 : null),
    title: () => 'Finish a brew after 6 pm',
    closesAtHour: 24,
  },
  {
    kind: 'intention',
    icon: 'pencil',
    weight: 2,
    target: (d, g) => (d === 'easy' ? 1 : d === 'medium' ? (g >= 30 ? 2 : null) : g <= 15 ? 2 : null),
    title: (n) => (n === 1 ? 'Name what you’re brewing' : n === 2 ? 'Name what you’re brewing twice' : `Name what you’re brewing ${n} times`),
  },
  {
    kind: 'deepSteep',
    icon: 'cup',
    weight: 1,
    target: (d, g) => (d === 'hard' && g >= 60 ? 1 : null),
    title: () => 'Finish a deep steep (50 min)',
  },
  {
    kind: 'noPause',
    icon: 'clock',
    weight: 1.5,
    target: (d) => (d === 'medium' ? 1 : null),
    title: () => 'Finish a brew without pausing',
  },
  {
    kind: 'twoTags',
    icon: 'pencil',
    weight: 1,
    target: (d, g) => ((d === 'medium' && g >= 30) || (d === 'hard' && g < 30) ? 2 : null),
    title: () => 'Brew with 2 different tags',
  },
  {
    kind: 'leaves',
    icon: 'leaf',
    weight: 1.5,
    target: (d, g) => (d === 'medium' ? r5(g + 20) : d === 'hard' ? r5(g * 1.5 + 40) : null),
    title: (n) => `Earn ${n} leaves`,
  },
];

const TEMPLATE_BY_KIND = Object.fromEntries(TEMPLATES.map((t) => [t.kind, t])) as Record<QuestKind, Template>;

export interface GenerateOptions {
  /** Kinds to leave out (e.g. 'morning' when the day's recipes are first opened after 10 am). */
  exclude?: QuestKind[];
}

/** Days since 1970-01-01 for a calendar day key (timezone-free). */
function dayIndex(day: DayKey): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function shuffled(len: number, seed: string): number[] {
  const r = prng(hashString(seed));
  const a = Array.from({ length: len }, (_, i) => i);
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Walk a pool in seeded cycles: every item once per cycle, a fresh order each
 * cycle, and never the same item two days in a row (also across cycles).
 */
function cyclePick<T>(pool: T[], n: number, salt: string): T {
  const len = pool.length;
  if (len <= 2) return pool[((n % len) + len) % len];
  const c = Math.floor(n / len);
  const cur = shuffled(len, `${salt}:${c}`);
  const prevLast = shuffled(len, `${salt}:${c - 1}`)[len - 1];
  if (cur[0] === prevLast) [cur[0], cur[1]] = [cur[1], cur[0]];
  return pool[cur[n - c * len]];
}

type Cand = { t: Template; target: number };

function candidates(difficulty: QuestDifficulty, goal: number): Cand[] {
  return TEMPLATES.map((t) => ({ t, target: t.target(difficulty, goal) })).filter((c): c is Cand => c.target != null);
}

function toSpec(pick: Cand, difficulty: QuestDifficulty): QuestSpec {
  return {
    id: `${pick.t.kind}-${pick.target}`,
    kind: pick.t.kind,
    title: pick.t.title(pick.target),
    target: pick.target,
    reward: pick.t.kind === 'deepSteep' ? 25 : QUEST_REWARD[difficulty],
    icon: pick.t.icon,
    difficulty,
  };
}

/**
 * The hard recipe cycles through its pool (so two days in a row are never
 * identical); easy and medium are weighted picks that avoid yesterday's kinds.
 */
function pickFor(day: DayKey, goalMin: number, exclude: QuestKind[], avoid: QuestKind[]): QuestSpec[] {
  const rand = prng(hashString(`kettle-recipes:${day}`));
  const goal = Math.max(5, goalMin || 30);
  const hardPool = candidates('hard', goal).filter((c) => !exclude.includes(c.t.kind));
  const hard = hardPool.length ? toSpec(cyclePick(hardPool, dayIndex(day), `kettle-hard:${goal}`), 'hard') : null;
  const chosen: QuestSpec[] = hard ? [hard] : [];
  const picked: QuestSpec[] = [];
  for (const difficulty of ['easy', 'medium'] as const) {
    let cands = candidates(difficulty, goal).filter(
      (c) => !exclude.includes(c.t.kind) && ![...chosen, ...picked].some((q) => q.kind === c.t.kind || q.icon === c.t.icon),
    );
    const fresh = cands.filter((c) => !avoid.includes(c.t.kind));
    if (fresh.length) cands = fresh;
    const roll = rand();
    if (!cands.length) continue;
    const total = cands.reduce((a, c) => a + c.t.weight, 0);
    let acc = 0;
    let pick = cands[cands.length - 1];
    for (const c of cands) {
      acc += c.t.weight / total;
      if (roll < acc) {
        pick = c;
        break;
      }
    }
    picked.push(toSpec(pick, difficulty));
  }
  return hard ? [...picked, hard] : picked;
}

/** Deterministic recipes for a day. Same inputs → same recipes. */
export function generateQuests(day: DayKey, goalMin: number, opts: GenerateOptions = {}): QuestSpec[] {
  const yesterday = pickFor(addDays(day, -1), goalMin, [], []).filter((q) => q.difficulty !== 'hard').map((q) => q.kind);
  return pickFor(day, goalMin, opts.exclude ?? [], yesterday);
}

/** Time-window recipes that can no longer be done if first opened at `hour`. */
export function closedKinds(hour: number): QuestKind[] {
  return TEMPLATES.filter((t) => t.closesAtHour != null && hour >= t.closesAtHour).map((t) => t.kind);
}

export function newQuestDay(day: DayKey, goalMin: number, openedAtHour?: number): QuestDayState {
  const exclude = openedAtHour == null ? [] : closedKinds(openedAtHour);
  return { goalMin, list: generateQuests(day, goalMin, { exclude }), done: {} };
}

// ---------------------------------------------------------------------------
// Measuring progress (derived from the day's records, so it is idempotent)
// ---------------------------------------------------------------------------

const hourOf = (ts: number) => new Date(ts).getHours();
const BREW_KINDS = new Set<LeafEntry['kind']>(['focus', 'fullBrew', 'firstBrew', 'deepSteep', 'goal']);

export interface QuestDayInput {
  /** All records (focus + breaks) whose `day` is the quest day. */
  records: SessionRecord[];
  /** Ledger entries of the day (quest rewards are ignored for 'leaves'). */
  ledger: LeafEntry[];
}

export function measureQuest(kind: QuestKind, input: QuestDayInput): number {
  const focus = input.records.filter((r) => r.phase === 'focus');
  const done = focus.filter((r) => r.completed);
  switch (kind) {
    case 'minutes':
      return Math.floor(focus.reduce((a, r) => a + r.focusedMs, 0) / MIN);
    case 'fullBrews':
      return done.length;
    case 'teaBreak':
      return input.records.filter((r) => r.phase !== 'focus' && r.completed).length;
    case 'morning':
      return focus.filter((r) => {
        const h = hourOf(r.startedAt);
        return h >= 4 && h < 10;
      }).length;
    case 'evening':
      return done.filter((r) => hourOf(r.endedAt) >= 18).length;
    case 'intention':
      return focus.filter((r) => r.intention.trim().length > 0).length;
    case 'deepSteep':
      return done.filter((r) => r.plannedMs >= DEEP_STEEP_MS).length;
    case 'noPause':
      return done.filter((r) => r.endedAt - r.startedAt <= r.plannedMs + 15_000).length;
    case 'twoTags':
      return new Set(focus.map((r) => r.tag).filter(Boolean)).size;
    case 'leaves':
      // Leaves earned by brewing today (recipe rewards, gifts and carry-overs don't count).
      return input.ledger.filter((e) => BREW_KINDS.has(e.kind)).reduce((a, e) => a + e.amount, 0);
  }
}

/** Render-ready quests for a day. */
export function questsView(state: QuestDayState, input: QuestDayInput): Quest[] {
  return state.list.map((q) => {
    const completedAt = state.done[q.id] ?? null;
    const measured = measureQuest(q.kind, input);
    return {
      id: q.id,
      title: q.title,
      target: q.target,
      progress: completedAt != null ? q.target : Math.min(q.target, measured),
      reward: q.reward,
      done: completedAt != null,
      icon: q.icon,
      kind: q.kind,
      difficulty: q.difficulty,
      completedAt,
    };
  });
}

export function questTemplateTitle(kind: QuestKind, target: number): string {
  return TEMPLATE_BY_KIND[kind]?.title(target) ?? kind;
}
