/**
 * Defensive coercion of untrusted data (localStorage from older builds,
 * other tabs, imported backups) into a well-formed ProgressData.
 */
import { dayKey, type DayKey } from '@/lib/dates';
import type { TagId } from '@/state/settings';
import { emptyData } from './engine';
import type { BadgeState, LeafEntry, LeafKind, ProgressData, QuestDayState, QuestDifficulty, QuestIcon, QuestKind, QuestSpec, SessionRecord } from './types';

const PHASES = ['focus', 'shortBreak', 'longBreak'] as const;
const TAGS: TagId[] = ['work', 'study', 'read', 'create', 'life'];
const LEAF_KINDS: LeafKind[] = ['focus', 'fullBrew', 'firstBrew', 'deepSteep', 'goal', 'quest', 'allQuests', 'carryOver', 'gift'];
const QUEST_KINDS: QuestKind[] = ['minutes', 'fullBrews', 'teaBreak', 'morning', 'evening', 'intention', 'deepSteep', 'noPause', 'twoTags', 'leaves'];
const QUEST_ICONS: QuestIcon[] = ['clock', 'cup', 'sun', 'moon', 'leaf', 'pencil', 'break'];
const DIFFS: QuestDifficulty[] = ['easy', 'medium', 'hard'];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** 2000-01-01 — anything earlier is corrupt. */
const MIN_TS = 946_684_800_000;
const DAY_MS = 86_400_000;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const isDayKey = (v: unknown): v is DayKey => typeof v === 'string' && DAY_RE.test(v);

export function coerceSession(v: unknown, now = Date.now()): SessionRecord | null {
  if (!isObj(v)) return null;
  const { id, phase, startedAt, endedAt, plannedMs, focusedMs, completed } = v;
  if (typeof id !== 'string' || !id || id.length > 120) return null;
  if (!PHASES.includes(phase as (typeof PHASES)[number])) return null;
  if (!num(startedAt) || !num(endedAt) || endedAt < startedAt || startedAt < MIN_TS || endedAt > now + DAY_MS) return null;
  if (!num(plannedMs) || plannedMs < 0 || plannedMs > DAY_MS) return null;
  if (!num(focusedMs) || focusedMs < 0 || focusedMs > DAY_MS) return null;
  const tag = TAGS.includes(v.tag as TagId) ? (v.tag as TagId) : null;
  return {
    id,
    phase: phase as SessionRecord['phase'],
    startedAt,
    endedAt,
    plannedMs,
    focusedMs,
    completed: completed === true,
    intention: typeof v.intention === 'string' ? v.intention.slice(0, 140) : '',
    tag,
    day: isDayKey(v.day) ? v.day : dayKey(endedAt),
    ...(v.outcome === 'done' || v.outcome === 'carried' ? { outcome: v.outcome } : {}),
    ...(num(v.v) && v.v > 0 ? { v: v.v } : {}),
  };
}

export function coerceLeaf(v: unknown): LeafEntry | null {
  if (!isObj(v)) return null;
  const { id, at, day, kind, amount } = v;
  if (typeof id !== 'string' || !id || id.length > 200) return null;
  if (!num(at) || !isDayKey(day) || !LEAF_KINDS.includes(kind as LeafKind)) return null;
  if (!num(amount) || amount < 0 || amount > 100_000) return null;
  const out: LeafEntry = { id, at, day, kind: kind as LeafKind, amount: Math.round(amount) };
  if (typeof v.ref === 'string') out.ref = v.ref.slice(0, 120);
  if (typeof v.note === 'string') out.note = v.note.slice(0, 80);
  return out;
}

function coerceQuestSpec(v: unknown): QuestSpec | null {
  if (!isObj(v)) return null;
  const { id, kind, title, target, reward, icon, difficulty } = v;
  if (typeof id !== 'string' || typeof title !== 'string' || !QUEST_KINDS.includes(kind as QuestKind)) return null;
  if (!num(target) || target <= 0 || !num(reward) || reward < 0) return null;
  return {
    id,
    kind: kind as QuestKind,
    title: title.slice(0, 80),
    target,
    reward,
    icon: QUEST_ICONS.includes(icon as QuestIcon) ? (icon as QuestIcon) : 'leaf',
    difficulty: DIFFS.includes(difficulty as QuestDifficulty) ? (difficulty as QuestDifficulty) : 'medium',
  };
}

function coerceQuestDay(v: unknown): QuestDayState | null {
  if (!isObj(v) || !Array.isArray(v.list)) return null;
  const list = v.list.map(coerceQuestSpec).filter((q): q is QuestSpec => !!q);
  const done: Record<string, number> = {};
  if (isObj(v.done)) for (const [k, t] of Object.entries(v.done)) if (num(t)) done[k] = t;
  return { goalMin: num(v.goalMin) ? v.goalMin : 30, list, done };
}

function coerceBadge(v: unknown): BadgeState | null {
  if (!isObj(v) || !num(v.tier)) return null;
  const tier = Math.max(0, Math.min(10, Math.floor(v.tier)));
  const unlockedAt = Array.isArray(v.unlockedAt) ? v.unlockedAt.filter(num).slice(0, tier) : [];
  while (unlockedAt.length < tier) unlockedAt.push(unlockedAt[unlockedAt.length - 1] ?? 0);
  return { tier, unlockedAt };
}

export interface CoerceStats {
  sessionsIn: number;
  sessionsKept: number;
  ledgerIn: number;
  ledgerKept: number;
  hadLedger: boolean;
}

/** Coerce anything into ProgressData. Never throws. */
export function coerceData(v: unknown, now = Date.now()): { data: ProgressData; stats: CoerceStats } {
  const data = emptyData();
  const stats: CoerceStats = { sessionsIn: 0, sessionsKept: 0, ledgerIn: 0, ledgerKept: 0, hadLedger: false };
  if (!isObj(v)) return { data, stats };
  if (Array.isArray(v.sessions)) {
    stats.sessionsIn = v.sessions.length;
    const seen = new Set<string>();
    for (const raw of v.sessions) {
      const s = coerceSession(raw, now);
      if (s && !seen.has(s.id)) {
        seen.add(s.id);
        data.sessions.push(s);
      }
    }
    data.sessions.sort((a, b) => a.endedAt - b.endedAt);
    stats.sessionsKept = data.sessions.length;
  }
  if (Array.isArray(v.ledger)) {
    stats.hadLedger = true;
    stats.ledgerIn = v.ledger.length;
    const seen = new Set<string>();
    for (const raw of v.ledger) {
      const e = coerceLeaf(raw);
      if (e && !seen.has(e.id)) {
        seen.add(e.id);
        data.ledger.push(e);
      }
    }
    stats.ledgerKept = data.ledger.length;
  }
  data.leaves = data.ledger.reduce((a, e) => a + e.amount, 0);
  if (num(v.cozies)) data.cozies = Math.max(0, Math.min(2, Math.floor(v.cozies)));
  if (isObj(v.dayGoals)) for (const [k, g] of Object.entries(v.dayGoals)) if (isDayKey(k) && num(g) && g > 0) data.dayGoals[k] = g;
  if (isObj(v.quests))
    for (const [k, q] of Object.entries(v.quests)) {
      const qd = isDayKey(k) ? coerceQuestDay(q) : null;
      if (qd) data.quests[k] = qd;
    }
  if (isObj(v.badges))
    for (const [k, b] of Object.entries(v.badges)) {
      const bs = coerceBadge(b);
      if (bs) data.badges[k] = bs;
    }
  if (Array.isArray(v.tombstones)) data.tombstones = v.tombstones.filter((t): t is string => typeof t === 'string').slice(-500);
  if (isObj(v.deletedAt)) {
    const at: Record<string, number> = {};
    for (const id of data.tombstones) {
      const t = (v.deletedAt as Record<string, unknown>)[id];
      if (num(t) && t > 0) at[id] = t;
    }
    if (Object.keys(at).length) data.deletedAt = at;
  }
  if (num(v.rev)) data.rev = Math.max(0, Math.floor(v.rev));
  if (typeof v.epoch === 'string' && v.epoch.length <= 64) data.epoch = v.epoch;
  // lastReport is transient UI state; keep it only if it looks like a report for a known session.
  if (isObj(v.lastReport) && isObj(v.lastReport.record) && data.sessions.some((s) => s.id === (v.lastReport as Obj).id)) {
    data.lastReport = v.lastReport as unknown as ProgressData['lastReport'];
  }
  return { data, stats };
}
