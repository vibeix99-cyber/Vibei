/**
 * Demo profiles for screenshots / reviews / e2e. OWNER: progress area (extend freely).
 * Deterministic (seeded PRNG) so screenshots are stable.
 */
import { clock } from '@/lib/clock';
import { dayKey } from '@/lib/dates';
import { useSettings, type TagId } from '@/state/settings';
import { useProgress } from './store';
import type { SessionRecord } from './types';

export type SeedName = 'fresh' | 'newbie' | 'veteran';

function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAGS: TagId[] = ['work', 'study', 'read', 'create', 'life'];
const INTENTIONS = ['Thesis chapter 3', 'Inbox zero', 'Sketch ideas', 'Read: The Hobbit', 'Spanish practice', 'Budget spreadsheet', 'Design review'];

function makeHistory(days: number, rand: () => number, streakDays: number): SessionRecord[] {
  const out: SessionRecord[] = [];
  const now = clock.now();
  for (let d = days; d >= 1; d--) {
    const inStreak = d <= streakDays;
    if (!inStreak && rand() < 0.35) continue;
    const n = 1 + Math.floor(rand() * 4);
    const base = new Date(now - d * 86400000);
    base.setHours(8 + Math.floor(rand() * 4), Math.floor(rand() * 60), 0, 0);
    let t = base.getTime();
    for (let i = 0; i < n; i++) {
      const planned = (rand() < 0.7 ? 25 : 50) * 60000;
      const completed = rand() > 0.12;
      const focused = completed ? planned : Math.floor(planned * (0.3 + rand() * 0.5));
      const tag = TAGS[Math.floor(rand() * TAGS.length)];
      out.push({
        id: `seed_${d}_${i}`,
        phase: 'focus',
        startedAt: t,
        endedAt: t + focused,
        plannedMs: planned,
        focusedMs: focused,
        completed,
        intention: INTENTIONS[Math.floor(rand() * INTENTIONS.length)],
        tag,
        day: dayKey(t + focused),
      });
      t += focused + (5 + Math.floor(rand() * 40)) * 60000;
    }
  }
  return out;
}

export function seedProfile(name: SeedName): void {
  const settings = useSettings.getState();
  const progress = useProgress.getState();
  progress.resetAll();
  if (name === 'fresh') {
    settings.set({ onboarded: false, name: '' });
    return;
  }
  if (name === 'newbie') {
    const rand = prng(7);
    const sessions = makeHistory(3, rand, 2);
    const leaves = sessions.reduce((a, s) => a + Math.floor(s.focusedMs / 60000) + (s.completed ? 5 : 0), 0);
    useProgress.setState({ sessions, leaves, cozies: 0, lastReport: null });
    settings.set({ onboarded: true, name: 'Sam' });
    return;
  }
  const rand = prng(42);
  const sessions = makeHistory(75, rand, 23);
  const leaves = sessions.reduce((a, s) => a + Math.floor(s.focusedMs / 60000) + (s.completed ? 5 : 0), 0);
  useProgress.setState({ sessions, leaves, cozies: 2, lastReport: null });
  settings.set({ onboarded: true, name: 'Robin', dailyGoalMin: 60 });
}
