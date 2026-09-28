/**
 * Badge evaluation. Metrics are derived from the whole history; tiers, once
 * reached, are kept forever (with the timestamp they were reached).
 */
import { parseDayKey } from '@/lib/dates';
import { BADGES, type BadgeDef } from './badges';
import { itemsUnlockedAt } from './items';
import { levelFromLeaves } from './levels';
import { DEEP_STEEP_MS } from './quests';
import type { BadgeProgress, BadgeState, LeafEntry, SessionRecord } from './types';

export interface BadgeInputs {
  sessions: SessionRecord[];
  ledger: LeafEntry[];
  leaves: number;
  bestStreak: number;
}

const hourOf = (ts: number) => new Date(ts).getHours();

export function badgeMetrics(inp: BadgeInputs): Record<string, number> {
  let completed = 0;
  let deep = 0;
  let morning = 0;
  let moon = 0;
  let breaks = 0;
  let intentional = 0;
  const perDay = new Map<string, number>();
  const weekendDays = new Set<string>();
  const dowCache = new Map<string, number>();
  for (const s of inp.sessions) {
    if (s.phase !== 'focus') {
      if (s.completed) breaks++;
      continue;
    }
    if (s.intention.trim()) intentional++;
    if (!s.completed) continue;
    completed++;
    if (s.plannedMs >= DEEP_STEEP_MS) deep++;
    const h = hourOf(s.startedAt);
    if (h >= 4 && h < 9) morning++;
    if (h >= 22 || h < 4) moon++;
    perDay.set(s.day, (perDay.get(s.day) ?? 0) + 1);
    let dow = dowCache.get(s.day);
    if (dow === undefined) dowCache.set(s.day, (dow = parseDayKey(s.day).getDay()));
    if (dow === 0 || dow === 6) weekendDays.add(s.day);
  }
  let marathon = 0;
  for (const n of perDay.values()) if (n >= 4) marathon++;
  const goals = inp.ledger.filter((e) => e.kind === 'goal').length;
  return {
    'first-brew': completed,
    'warm-streak': inp.bestStreak,
    'leaf-collector': inp.leaves,
    'deep-steep': deep,
    'morning-dew': morning,
    moonlit: moon,
    marathon,
    'tea-time': breaks,
    'goal-getter': goals,
    intentional,
    'weekend-warmth': weekendDays.size,
    'nook-builder': itemsUnlockedAt(levelFromLeaves(inp.leaves).level).length,
  };
}

export function tierFor(def: BadgeDef, value: number): number {
  let t = 0;
  for (const threshold of def.tiers) if (value >= threshold) t++;
  return t;
}

export interface BadgeAward {
  id: string;
  tier: number;
  title: string;
  description: string;
}

/** Evaluate all badges; returns the new badge state and newly reached tiers (highest per badge). */
export function evaluateBadges(
  prev: Record<string, BadgeState>,
  metrics: Record<string, number>,
  at: number,
): { badges: Record<string, BadgeState>; awards: BadgeAward[] } {
  const badges: Record<string, BadgeState> = { ...prev };
  const awards: BadgeAward[] = [];
  for (const def of BADGES) {
    const cur = prev[def.id] ?? { tier: 0, unlockedAt: [] };
    const tier = tierFor(def, metrics[def.id] ?? 0);
    if (tier > cur.tier) {
      const unlockedAt = cur.unlockedAt.slice(0, cur.tier);
      for (let t = cur.tier; t < tier; t++) unlockedAt.push(at);
      badges[def.id] = { tier, unlockedAt };
      awards.push({ id: def.id, tier, title: def.title, description: describeTier(def, tier) });
    }
  }
  return { badges, awards };
}

/** Description with {n} filled for a tier (1-based). */
export function describeTier(def: BadgeDef, tier: number): string {
  const n = def.tiers[Math.max(0, Math.min(def.tiers.length - 1, tier - 1))];
  return def.description.replace('{n}', n.toLocaleString());
}

export function badgeProgress(state: Record<string, BadgeState>, metrics: Record<string, number>): BadgeProgress[] {
  return BADGES.map((def) => {
    const st = state[def.id] ?? { tier: 0, unlockedAt: [] };
    const value = metrics[def.id] ?? 0;
    const maxTier = def.tiers.length;
    const tier = Math.max(st.tier, tierFor(def, value));
    const next = tier < maxTier ? def.tiers[tier] : null;
    const current = tier > 0 ? def.tiers[tier - 1] : 0;
    const toNext = next == null ? 1 : Math.max(0, Math.min(1, (value - current) / (next - current)));
    return {
      id: def.id,
      title: def.title,
      description: describeTier(def, next == null ? maxTier : tier + 1),
      tier,
      maxTier,
      value,
      next,
      current,
      toNext,
      unlockedAt: st.unlockedAt,
      tiers: def.tiers,
    };
  });
}

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
