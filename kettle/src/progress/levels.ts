/**
 * Cozy level curve.
 *
 * Tuned so that:
 *  - the very first brew (25 min + bonuses ≈ 33 leaves) levels you up to 2,
 *  - a second brew usually reaches 3 (instant, repeated delight early on),
 *  - a daily user (~90 leaves/day: a cup goal, two brews, a recipe or two)
 *    reaches level 10 after ~2 weeks and level 20 after ~2½–3 months.
 *
 * Step to go from level l → l+1 = 25 + 12·(l−1)^1.5, rounded to 5.
 *   L2 25 · L3 60 · L4 120 · L5 205 · L10 1,225 · L12 1,980 · L15 3,560 · L20 7,535
 */
import type { LevelInfo } from './types';

const cache: number[] = [0, 0]; // cache[level] = cumulative leaves to reach it

function stepSize(level: number): number {
  return Math.round((25 + 12 * Math.pow(level - 1, 1.5)) / 5) * 5;
}

/** Cumulative leaves needed to reach `level` (level 1 = 0). */
export function leavesForLevel(level: number): number {
  if (level <= 1) return 0;
  const l = Math.floor(level);
  while (cache.length <= l) {
    const next = cache.length;
    cache.push(cache[next - 1] + stepSize(next - 1));
  }
  return cache[l];
}

export function levelFromLeaves(leaves: number): LevelInfo {
  const safe = Math.max(0, Math.floor(Number.isFinite(leaves) ? leaves : 0));
  let level = 1;
  while (safe >= leavesForLevel(level + 1)) level++;
  const base = leavesForLevel(level);
  return { level, leaves: safe, into: safe - base, size: leavesForLevel(level + 1) - base };
}
