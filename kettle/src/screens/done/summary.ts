/**
 * The one summary after a brew — pure model, unit-tested. OWNER: core-loop area.
 *
 * Built only from the CompletionReport the progress engine computed (and granted) once when the brew
 * completed: this file never grants anything, so showing, reloading or re-opening the summary can't
 * change a reward. Hierarchy:
 *   1. the message — minutes brewed, and Tea time (the next step);
 *   2. the task (only when there was one) — Done / Carry forward;
 *   3. a major room unlock, prominent;
 *   4. routine rewards, compact — leaves, today's goal, streak, recipes, level, badges;
 *   5. the arithmetic, on request.
 */
import type { CompletionReport } from '@/progress';
import { plural } from '@/lib/format';

export type PillKind = 'leaves' | 'goal' | 'streak' | 'cozy' | 'recipes' | 'level' | 'badge';

export interface RewardPill {
  kind: PillKind;
  text: string;
  /** Screen-reader wording when it differs from the text. */
  sr?: string;
  /** Extra data for the pill's art. */
  value?: number;
  id?: string;
  tier?: number;
}

export interface DetailRow {
  label: string;
  amount: number;
}

export interface SummaryModel {
  minutes: number;
  headline: string;
  pills: RewardPill[];
  unlock: { ids: string[]; level: number } | null;
  details: {
    rows: DetailRow[];
    total: number;
    level: number;
    into: number;
    size: number;
    toNext: number;
  };
  /** Everything a screen reader needs, in one sentence or three. */
  announce: string;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
export const roman = (n: number) => ROMAN[n] ?? String(n);

export function buildSummary(r: CompletionReport): SummaryModel {
  const minutes = Math.max(1, Math.round(r.record.focusedMs / 60_000));
  const headline = `${plural(minutes, 'minute')} brewed`;

  const pills: RewardPill[] = [];
  pills.push({ kind: 'leaves', text: `+${r.leaves.total} leaves`, value: r.leaves.total });

  const g = r.goal;
  const after = Math.round(g.afterMin);
  if (g.justMet) pills.push({ kind: 'goal', text: `Goal met · ${after}/${g.goalMin} min`, sr: `Daily goal met: ${after} of ${g.goalMin} minutes today`, value: 1 });
  else if (g.alreadyMet) pills.push({ kind: 'goal', text: `${after} min today`, sr: `${after} minutes today; goal already met`, value: 1 });
  else pills.push({ kind: 'goal', text: `${after}/${g.goalMin} min today`, sr: `Daily goal: ${after} of ${g.goalMin} minutes`, value: g.goalMin > 0 ? Math.min(1, after / g.goalMin) : 0 });

  const st = r.streak;
  if (st.after > 0) {
    const best = st.extended && st.newBest && st.after > 1 ? ', your best yet' : '';
    pills.push({ kind: 'streak', text: `${plural(st.after, 'day')} warm${best}`, value: st.after });
  }
  if (st.cozyEarned) pills.push({ kind: 'cozy', text: 'Tea Cozy earned', sr: 'You earned a Tea Cozy: it keeps your streak warm for one missed day' });

  // Recipes earn a pill once one is done (progress alone — "Recipes 0/3" — would read as nothing happened).
  const moved = r.quests.filter((q) => q.after > q.before);
  const doneAll = r.quests.filter((q) => q.done).length;
  if (moved.length && doneAll > 0) {
    const doneNow = r.quests.filter((q) => q.justCompleted);
    const text = doneNow.length === 1 ? `Recipe done · ${doneNow[0].title}` : doneNow.length > 1 ? `${doneNow.length} recipes done` : `Recipes ${doneAll}/${r.quests.length}`;
    pills.push({ kind: 'recipes', text, value: doneAll });
  }

  const lv = r.level;
  const leveled = lv.after > lv.before;
  const unlocked = leveled ? lv.unlocked ?? [] : [];
  const toNext = Math.max(0, lv.sizeAfter - lv.intoAfter);
  if (leveled && !unlocked.length) pills.push({ kind: 'level', text: `Cozy level ${lv.after}`, sr: `You reached cozy level ${lv.after}`, value: lv.after });
  else if (!leveled) pills.push({ kind: 'level', text: `${plural(toNext, 'leaf', 'leaves')} to level ${lv.after + 1}`, sr: `${plural(toNext, 'leaf', 'leaves')} to cozy level ${lv.after + 1}`, value: lv.after });

  for (const b of r.badges) pills.push({ kind: 'badge', text: `Badge: ${b.title}${b.tier > 1 ? ` ${roman(b.tier)}` : ''}`, id: b.id, tier: b.tier });

  const rows: DetailRow[] = [];
  if (r.leaves.base > 0) rows.push({ label: `${plural(minutes, 'focused minute')}`, amount: r.leaves.base });
  for (const b of r.leaves.bonuses) rows.push({ label: b.label, amount: b.amount });

  const parts = [`${headline}.`, `${r.leaves.total} leaves earned.`];
  parts.push(g.justMet ? 'Daily goal met.' : `Today: ${after} of ${g.goalMin} minutes.`);
  if (st.extended) parts.push(`Warm streak: ${plural(st.after, 'day')}.`);
  if (unlocked.length) parts.push(`Cozy level ${lv.after}: something new in your nook.`);
  else if (leveled) parts.push(`Cozy level ${lv.after}.`);
  if (r.badges.length) parts.push(r.badges.map((b) => `New badge: ${b.title}.`).join(' '));

  return {
    minutes,
    headline,
    pills,
    unlock: unlocked.length ? { ids: unlocked, level: lv.after } : null,
    details: { rows, total: r.leaves.total, level: lv.after, into: lv.intoAfter, size: lv.sizeAfter, toNext },
    announce: parts.join(' '),
  };
}
