/** Everything Home needs, derived once per render from the stores + clock. */
import { useMemo, useState } from 'react';
import { useProgress, useStreak, useLevel, useQuests, weekStrip, localeWeekStart, type Quest, type SessionRecord, type StreakTimeline } from '@/progress';
import { useSettings } from '@/state/settings';
import { useTimer } from '@/timer';
import { dayKey, dayPart, parseDayKey, type DayKey } from '@/lib/dates';
import { safeStorage, STORAGE_PREFIX } from '@/lib/storage';
import { chaiLine, greeting, hashSeed } from './chai';
import { useNow } from './shims/useNow';

const VISIT_KEY = `${STORAGE_PREFIX}home:lastVisit`;

/** Reads (once per mount) whether this is the first Home visit today, then records the visit. */
function useFirstVisitToday(day: DayKey): boolean {
  const [first] = useState(() => {
    const last = safeStorage.getItem(VISIT_KEY);
    safeStorage.setItem(VISIT_KEY, day);
    return last !== day;
  });
  return first;
}

function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86_400_000);
}

/** Stand-in recipes shown only until `useQuests()` returns real ones. */
function fallbackQuests(todays: SessionRecord[], goalMin: number): Quest[] {
  const done = todays.filter((s) => s.completed).length;
  const min = Math.floor(todays.reduce((a, s) => a + s.focusedMs, 0) / 60000);
  const named = todays.filter((s) => s.intention.trim()).length;
  const target = Math.max(10, Math.round(goalMin / 2));
  const mk = (id: string, title: string, progress: number, tgt: number, reward: number, icon: Quest['icon'], kind: Quest['kind']): Quest => ({
    id,
    title,
    target: tgt,
    progress: Math.min(progress, tgt),
    reward,
    done: progress >= tgt,
    icon,
    kind,
    difficulty: 'easy',
    completedAt: null,
  });
  return [
    mk('fb-brews', 'Brew 2 full cups', done, 2, 10, 'cup', 'fullBrews'),
    mk('fb-minutes', `Focus for ${target} minutes`, min, target, 10, 'clock', 'minutes'),
    mk('fb-intent', 'Name what you’re brewing', named, 1, 5, 'pencil', 'intention'),
  ];
}

export function useHomeData() {
  const now = useNow();
  const day = dayKey(now);
  const part = dayPart(now);
  const name = useSettings((s) => s.name);
  const focusMin = useSettings((s) => s.focusMin);
  const goalMin = useSettings((s) => s.dailyGoalMin);
  const sessions = useProgress((s) => s.sessions);
  const streak = useStreak();
  const level = useLevel();
  const quests = useQuests();
  const firstVisitToday = useFirstVisitToday(day);
  const live = useTimer((t) => (t.status === 'idle' ? null : t.phase === 'focus' ? 'focus' : 'break'));

  return useMemo(() => {
    const focus = sessions.filter((s) => s.phase === 'focus');
    const todays = focus.filter((s) => s.day === day).sort((a, b) => a.startedAt - b.startedAt);
    const todayMs = todays.reduce((a, s) => a + s.focusedMs, 0);
    const todayMin = Math.floor(todayMs / 60000);
    const completedToday = todays.filter((s) => s.completed).length;
    const todayDone = streak.todayDone ?? completedToday > 0;
    const prev = focus.filter((s) => s.day < day).reduce<DayKey | null>((m, s) => (m == null || s.day > m ? s.day : m), null);
    const lastDay = todays.length ? day : prev;
    const daysSinceLast = lastDay ? daysBetween(lastDay, day) : null;

    const week = weekStrip({ days: streak.days ?? {} } as StreakTimeline, day, localeWeekStart());

    const line = chaiLine({
      part,
      name,
      todayMin,
      goalMin,
      sessionsToday: completedToday,
      streak: streak.current,
      todayDone,
      cozies: streak.cozies,
      totalSessions: focus.length,
      daysSinceLast,
      firstVisitToday,
      focusMin,
      seed: hashSeed(day),
      live,
    });

    const recentIntentions: string[] = [];
    for (let i = focus.length - 1; i >= 0 && recentIntentions.length < 3; i--) {
      const t = focus[i].intention.trim();
      if (t && !recentIntentions.some((r) => r.toLowerCase() === t.toLowerCase())) recentIntentions.push(t);
    }

    return {
      now,
      day,
      part,
      title: greeting(part, name),
      line,
      goalMin,
      todayMin,
      todayMs,
      goalProgress: goalMin > 0 ? todayMs / 60000 / goalMin : 0,
      goalMet: todayMs / 60000 >= goalMin,
      todays,
      completedToday,
      streak: { ...streak, todayDone },
      week,
      level,
      quests: quests.length ? quests : fallbackQuests(todays, goalMin),
      questsAreFallback: quests.length === 0,
      recentIntentions,
      focusMin,
    };
  }, [sessions, streak, level, quests, day, part, name, goalMin, focusMin, firstVisitToday, now, live]);
}

export type HomeData = ReturnType<typeof useHomeData>;
