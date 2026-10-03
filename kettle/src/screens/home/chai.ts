/**
 * What Chai says on Home — pure, deterministic, unit-tested.
 * Chai never guilt-trips (BRIEF §2): risk lines are invitations, not warnings.
 */
import type { MascotPose } from '@/art';
import type { DayPart } from '@/lib/dates';

export interface ChaiContext {
  part: DayPart;
  name: string;
  /** Focused minutes today (completed + partial). */
  todayMin: number;
  goalMin: number;
  /** Completed brews today. */
  sessionsToday: number;
  streak: number;
  todayDone: boolean;
  cozies: number;
  /** Focus sessions ever recorded. */
  totalSessions: number;
  /** Whole days since the last focus session's day (0 = today), null if never. */
  daysSinceLast: number | null;
  /** First time Home is opened today. */
  firstVisitToday: boolean;
  /** Configured focus length, for "about N brews" math. */
  focusMin: number;
  /** Stable per-day seed so copy doesn't flicker between renders. */
  seed: number;
  /** A brew or break is running/paused right now. */
  live?: 'focus' | 'break' | null;
}

export type ChaiMood = 'live' | 'first' | 'met' | 'night' | 'back' | 'risk' | 'progress' | 'hello' | 'idle';

export interface ChaiLine {
  mood: ChaiMood;
  pose: MascotPose;
  text: string;
  /** Offer the Gentle rhythm as a one-tap suggestion. */
  suggestGentle?: boolean;
}

export function greeting(part: DayPart, name: string): string {
  const n = name.trim();
  if (part === 'night') return n ? `Still up, ${n}?` : 'Hello, night owl';
  const base = part === 'morning' ? 'Good morning' : part === 'afternoon' ? 'Good afternoon' : 'Good evening';
  return n ? `${base}, ${n}` : base;
}

/** Non-breaking hyphen so "5-day" / "15-minute" never split across lines. */
const nb = (s: string) => s.replace(/(\d)-(\w)/g, '$1\u2011$2');

function pick<T>(seed: number, options: T[]): T {
  return options[Math.abs(Math.floor(seed)) % options.length];
}

export function brewsToGo(minLeft: number, focusMin: number): number {
  if (minLeft <= 0) return 0;
  return Math.max(1, Math.ceil(minLeft / Math.max(1, focusMin)));
}

/**
 * The daily goal's own vessel ("A cup" is 30 min, "A pot" 60, "A whole kettle" 120), so Chai never calls a
 * 30-minute goal a pot. A sip or a custom goal is just "today's goal".
 */
export function goalFull(goalMin: number): { full: string; short: string } {
  if (goalMin === 30) return { full: 'today’s cup is full', short: 'The cup’s full' };
  if (goalMin === 60) return { full: 'today’s pot is full', short: 'The pot’s full' };
  if (goalMin === 120) return { full: 'today’s kettle is full', short: 'The kettle’s full' };
  return { full: 'today’s goal is met', short: 'That’s today brewed' };
}

export function chaiLine(c: ChaiContext): ChaiLine {
  const left = Math.max(0, Math.ceil(c.goalMin - c.todayMin));
  const met = c.todayMin >= c.goalMin && c.goalMin > 0;
  const goal = goalFull(c.goalMin);
  // The brew on offer is the one selected on Home: its length is the one Chai names.
  const brew = nb(`${c.focusMin}-minute brew`);

  if (c.live === 'focus') {
    return { mood: 'live', pose: 'focus', text: pick(c.seed, ['Kettle’s warming up. I’m keeping your seat warm.', 'Deep in it. Nice. Hop back whenever you’re ready.']) };
  }
  if (c.live === 'break') {
    return { mood: 'live', pose: 'sip', text: 'Tea time. Stretch, sip, look out the window.' };
  }

  if (c.totalSessions === 0) {
    return {
      mood: 'first',
      pose: 'wave',
      text: pick(c.seed, ['Your first brew is one tap away. I’ll keep you company.', 'Let’s brew your very first one. No rush.']),
    };
  }

  if (met) {
    if (c.part === 'night') return { mood: 'met', pose: 'sleep', text: 'Goal met, and it’s late. I vote for a cozy bedtime.' };
    if (c.part === 'evening') return { mood: 'met', pose: 'sip', text: 'Goal met. Lamps low, feet up. You earned a slow evening.' };
    return {
      mood: 'met',
      pose: 'proud',
      text: pick(c.seed, [`Goal met. ${goal.short}. Anything more is a bonus.`, 'You did it. Today’s goal is brewed. Extra brews are just for fun.']),
    };
  }

  if (c.part === 'night') {
    // Names the selected length; the Gentle chip (shown when it's longer than 15) offers the shorter brew.
    const gentle = c.focusMin > 15;
    if (c.streak > 0 && !c.todayDone) {
      return { mood: 'night', pose: 'sleep', text: nb(`It’s late. One ${brew} keeps your ${c.streak}-day streak warm.`), suggestGentle: gentle };
    }
    return { mood: 'night', pose: 'sleep', text: pick(c.seed, ['It’s getting late. A gentle one, then rest?', 'Late-night brew? Let’s keep it short and sweet.']), suggestGentle: gentle };
  }

  if (c.daysSinceLast != null && c.daysSinceLast >= 3 && c.sessionsToday === 0 && c.todayMin === 0) {
    return { mood: 'back', pose: 'wave', text: pick(c.seed, ['Welcome back. No catching up needed. One cup is plenty.', 'Oh, hello again. I kept the kettle warm for you.']) };
  }

  if (c.part === 'evening' && c.streak > 0 && !c.todayDone) {
    const cozy = c.cozies > 0 ? ' Your Tea Cozy is on standby, too.' : '';
    return { mood: 'risk', pose: 'think', text: nb(`Your ${c.streak}-day streak is still warm. One ${brew} keeps it going.${cozy}`) };
  }

  if (c.todayMin > 0) {
    // "One more brew" only when the selected brew really covers what's left.
    const n = brewsToGo(left, c.focusMin);
    const togo = n === 1 ? `One more brew and ${goal.full}.` : `${left} min to go, about ${n} more ${nb(`${c.focusMin}-minute`)} brews.`;
    if (c.part === 'morning') return { mood: 'progress', pose: 'stretch', text: `Early start, nice. ${togo}` };
    if (c.part === 'evening') return { mood: 'progress', pose: 'sip', text: `Lamps on. ${togo}` };
    return {
      mood: 'progress',
      pose: 'sip',
      text: pick(c.seed, [`Nice going. ${togo}`, `Lovely work so far. ${togo}`]),
    };
  }

  if (c.firstVisitToday) {
    const byPart: Record<Exclude<DayPart, 'night'>, ChaiLine> = {
      morning: { mood: 'hello', pose: 'stretch', text: pick(c.seed, ['Morning. Big stretch, then a fresh brew?', 'Fresh day. What shall we brew first?']) },
      afternoon: { mood: 'hello', pose: 'wave', text: pick(c.seed, ['Afternoon slump? A warm brew of focus helps.', 'Hello. Perfect time for a brew, don’t you think?']) },
      evening: { mood: 'hello', pose: 'sip', text: pick(c.seed, ['Evening brew? Let’s keep it cozy.', 'Lamps on, kettle on. Ready when you are.']) },
    };
    return byPart[c.part];
  }

  if (c.part === 'morning') return { mood: 'idle', pose: 'stretch', text: 'Stretched and ready. What are we brewing this morning?' };
  if (c.part === 'evening') return { mood: 'idle', pose: 'sip', text: 'Lamps on. I’ll sit right here while you focus.' };
  return { mood: 'idle', pose: 'idle', text: pick(c.seed, ['Ready when you are. What are we brewing?', 'I’ll sit right here while you focus.']) };
}

/** Simple string hash for day seeds. */
export function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
