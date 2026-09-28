/**
 * Badge catalog — shared contract between progress (evaluation) and art
 * (badge artwork per id × tier). Ids are stable. Thresholds may be tuned by
 * the progress area; tiers are always 1..tiers.length (I–V).
 */
export interface BadgeDef {
  id: string;
  title: string;
  /** Template with {n} for the tier threshold. */
  description: string;
  /** Thresholds per tier, ascending. */
  tiers: number[];
}

export const BADGES: BadgeDef[] = [
  { id: 'first-brew', title: 'First Brew', description: 'Finish your first focus session', tiers: [1] },
  { id: 'warm-streak', title: 'Warm Streak', description: 'Keep a {n}-day warm streak', tiers: [3, 7, 14, 30, 100] },
  { id: 'leaf-collector', title: 'Leaf Collector', description: 'Collect {n} leaves', tiers: [100, 500, 1500, 5000, 15000] },
  { id: 'deep-steep', title: 'Deep Steep', description: 'Finish {n} sessions of 50+ minutes', tiers: [1, 5, 20, 50, 100] },
  { id: 'morning-dew', title: 'Morning Dew', description: 'Finish {n} sessions before 9 am', tiers: [1, 5, 15, 40, 100] },
  { id: 'moonlit', title: 'Moonlit Sipper', description: 'Finish {n} sessions after 10 pm', tiers: [1, 5, 15, 40, 100] },
  { id: 'marathon', title: 'Marathon', description: 'Finish 4+ sessions in a day, {n} times', tiers: [1, 3, 10, 25, 50] },
  { id: 'tea-time', title: 'Tea Time', description: 'Take {n} full tea breaks', tiers: [5, 25, 100, 250, 500] },
  { id: 'goal-getter', title: 'Goal Getter', description: 'Meet your daily goal {n} times', tiers: [1, 7, 30, 100, 365] },
  { id: 'intentional', title: 'Intentional', description: 'Name what you’re brewing {n} times', tiers: [5, 25, 100, 250, 500] },
  { id: 'weekend-warmth', title: 'Weekend Warmth', description: 'Focus on {n} weekend days', tiers: [2, 8, 20, 50, 100] },
  { id: 'nook-builder', title: 'Nook Builder', description: 'Unlock {n} nook items', tiers: [1, 3, 6, 10, 14] },
];

export const BADGE_BY_ID: Record<string, BadgeDef> = Object.fromEntries(BADGES.map((b) => [b.id, b]));
