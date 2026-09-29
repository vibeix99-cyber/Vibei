/**
 * Cross-tab merge for progress data.
 *
 * Tabs used to adopt another tab's write only when its `rev` was strictly
 * higher. Two tabs that each wrote the same `rev` ignored each other, and the
 * next write from either one silently overwrote the other's sessions.
 *
 * Now, within one data generation (`epoch`), stored and in-memory data are
 * merged, and caches are recomputed:
 *  - Each session id's latest event wins. A record's version is `v` (last edit or
 *    restore) or its `endedAt`; a deletion's is `deletedAt[id]` (Infinity for old
 *    tombstones without a time). Undo after delete therefore survives another tab,
 *    and edits made in two tabs keep the later one.
 *  - The ledger is a union by entry id; badges keep the highest tier.
 *  - A tab holding anything storage lacks writes the merge back, so nothing lives
 *    only in one tab's memory.
 * A deliberate reset or "replace" import starts a new epoch. Epoch ids begin with
 * their creation time, so the newest generation wins outright, whatever the revs.
 */
import { refreshCaches } from './engine';
import type { DayKey } from '@/lib/dates';
import type { BadgeState, LeafEntry, ProgressData, QuestDayState, SessionRecord } from './types';

const TOMBSTONE_CAP = 500;

const epochOf = (d: ProgressData) => d.epoch ?? '';

/** Creation time encoded in an epoch id (`uid('e_')`: prefix + base-36 ms + random); 0 for legacy data. */
function epochTime(e: string): number {
  const t = parseInt(e.slice(2, 10), 36);
  return e && Number.isFinite(t) ? t : 0;
}

/** True when generation `a` was started after generation `b`. */
export function newerEpoch(a: string, b: string): boolean {
  const ta = epochTime(a);
  const tb = epochTime(b);
  return ta !== tb ? ta > tb : a > b;
}

interface Ev {
  t: number;
  /** null = deleted. */
  rec: SessionRecord | null;
}

const versionOf = (s: SessionRecord) => s.v ?? s.endedAt;

function events(d: ProgressData): Map<string, Ev> {
  const m = new Map<string, Ev>();
  for (const s of d.sessions) m.set(s.id, { t: versionOf(s), rec: s });
  for (const id of d.tombstones) {
    const t = d.deletedAt?.[id] ?? Infinity;
    const cur = m.get(id);
    if (!cur || t >= cur.t) m.set(id, { t, rec: null });
  }
  return m;
}

/** True when `a` holds anything `b` doesn't (so adopting `b` would lose it). */
export function hasExtra(a: ProgressData, b: ProgressData): boolean {
  const eb = events(b);
  for (const [id, ea] of events(a)) {
    const other = eb.get(id);
    if (!other || ea.t > other.t) return true;
  }
  const bLedger = new Set(b.ledger.map((e) => e.id));
  if (a.ledger.some((e) => !bLedger.has(e.id))) return true;
  for (const [day, q] of Object.entries(a.quests)) {
    const other = b.quests[day];
    if (!other) return true;
    if (Object.keys(q.done).some((id) => !(id in other.done))) return true;
  }
  for (const [id, badge] of Object.entries(a.badges)) if ((b.badges[id]?.tier ?? 0) < badge.tier) return true;
  return false;
}

function mergeBadge(x: BadgeState | undefined, y: BadgeState | undefined): BadgeState {
  if (!x) return y!;
  if (!y) return x;
  const tier = Math.max(x.tier, y.tier);
  const unlockedAt: number[] = [];
  for (let i = 0; i < tier; i++) {
    const vals = [x.unlockedAt[i], y.unlockedAt[i]].filter((v): v is number => typeof v === 'number');
    unlockedAt.push(vals.length ? Math.min(...vals) : 0);
  }
  return { tier, unlockedAt };
}

function mergeQuestDay(older: QuestDayState | undefined, newer: QuestDayState | undefined): QuestDayState {
  if (!older) return newer!;
  if (!newer) return older;
  const ids = new Set(newer.list.map((q) => q.id));
  const done: Record<string, number> = {};
  for (const src of [older.done, newer.done])
    for (const [id, at] of Object.entries(src)) if (ids.has(id)) done[id] = done[id] === undefined ? at : Math.min(done[id], at);
  return { ...newer, done };
}

/**
 * Merge two snapshots of the same generation. Per session the latest event wins
 * (ties go to the newer document); nothing else is dropped.
 */
export function mergeProgress(local: ProgressData, stored: ProgressData, today: DayKey): ProgressData {
  const newer = stored.rev >= local.rev ? stored : local;
  const older = newer === stored ? local : stored;

  const winners = events(older);
  for (const [id, e] of events(newer)) {
    const cur = winners.get(id);
    if (!cur || e.t >= cur.t) winners.set(id, e);
  }
  const sessions: SessionRecord[] = [];
  const dead: [string, number][] = [];
  for (const [id, e] of winners) {
    if (e.rec) sessions.push(e.rec);
    else dead.push([id, e.t]);
  }
  // Keep the most recent deletions (legacy ones without a time sort first and go first).
  dead.sort((a, b) => (a[1] === b[1] ? 0 : a[1] === Infinity ? -1 : b[1] === Infinity ? 1 : a[1] - b[1]));
  const kept = dead.slice(-TOMBSTONE_CAP);
  const tombstones = kept.map(([id]) => id);
  const deletedAt: Record<string, number> = {};
  for (const [id, t] of kept) if (t !== Infinity) deletedAt[id] = t;

  const ledger = new Map<string, LeafEntry>();
  for (const e of older.ledger) ledger.set(e.id, e);
  for (const e of newer.ledger) ledger.set(e.id, e);

  const quests: Record<DayKey, QuestDayState> = {};
  for (const day of new Set([...Object.keys(older.quests), ...Object.keys(newer.quests)]))
    quests[day] = mergeQuestDay(older.quests[day], newer.quests[day]);

  const badges: Record<string, BadgeState> = {};
  for (const id of new Set([...Object.keys(older.badges), ...Object.keys(newer.badges)]))
    badges[id] = mergeBadge(older.badges[id], newer.badges[id]);

  const alive = new Set(sessions.map((s) => s.id));
  const merged: ProgressData = {
    ...newer,
    sessions: sessions.sort((a, b) => a.endedAt - b.endedAt),
    ledger: [...ledger.values()].sort((a, b) => a.at - b.at),
    dayGoals: { ...older.dayGoals, ...newer.dayGoals },
    quests,
    badges,
    tombstones,
    deletedAt,
    lastReport: newer.lastReport && alive.has(newer.lastReport.id) ? newer.lastReport : null,
    rev: Math.max(local.rev, stored.rev) + 1,
    epoch: newer.epoch,
  };
  // Leaves are the ledger sum; always recompute (refreshCaches skips when unchanged).
  return refreshCaches({ ...merged, leaves: -1 }, today);
}

export type SyncDecision =
  | { kind: 'keep' }
  | { kind: 'adopt'; data: ProgressData }
  /** Take `data` and write it back (a merge, or our newer generation over a stale one). */
  | { kind: 'merge'; data: ProgressData };

/** What an in-memory tab should do with what another tab wrote to storage. */
export function reconcile(local: ProgressData, stored: ProgressData | null, today: DayKey): SyncDecision {
  if (!stored) return { kind: 'keep' };
  const le = epochOf(local);
  const se = epochOf(stored);
  if (le !== se) {
    // A reset / replace-import happened somewhere: the newer generation wins outright.
    if (newerEpoch(se, le)) return { kind: 'adopt', data: stored };
    return { kind: 'merge', data: { ...local, rev: Math.max(local.rev, stored.rev) + 1 } };
  }
  const localExtra = hasExtra(local, stored);
  if (!localExtra) {
    if (stored.rev > local.rev) return { kind: 'adopt', data: stored };
    if (!hasExtra(stored, local)) return { kind: 'keep' };
  }
  return { kind: 'merge', data: mergeProgress(local, stored, today) };
}
