import type { CompletionReport } from '@/progress';

export type StepKind = 'whistle' | 'streak' | 'recipes' | 'level' | 'badges';

export interface StepProps {
  report: CompletionReport;
  reduced: boolean;
  /** True once the step is on screen and the page is visible — start the choreography. */
  active: boolean;
  /** Hero art scale (0.8 short phone … 1.45 desktop). */
  scale: number;
  /** Callback ref for the step heading: focuses it on mount (screen readers land on it). */
  headingRef: (el: HTMLHeadingElement | null) => void;
  headingId: string;
}

/** Which celebration cards this report earns, in order. */
export function buildSteps(r: CompletionReport): StepKind[] {
  const steps: StepKind[] = ['whistle'];
  if (r.streak?.extended) steps.push('streak');
  if (r.quests?.some((q) => q.after > q.before)) steps.push('recipes');
  if (r.level && r.level.after > r.level.before) steps.push('level');
  if (r.badges?.length) steps.push('badges');
  return steps;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
export const roman = (n: number) => ROMAN[n] ?? String(n);

/** Plain-language summary for screen readers (announced when a card appears). */
export function summarize(kind: StepKind, r: CompletionReport): string {
  switch (kind) {
    case 'whistle': {
      const mins = Math.round(r.record.focusedMs / 60_000);
      const g = r.goal;
      const goal = g.justMet
        ? 'Daily goal met.'
        : `Daily goal: ${Math.round(g.afterMin)} of ${g.goalMin} minutes.`;
      const leaves = r.leaves.base + r.leaves.bonuses.filter((b) => b.kind !== 'quest' && b.kind !== 'allQuests').reduce((a, b) => a + b.amount, 0);
      return `${mins} minutes of focus. ${leaves} leaves earned. ${goal}`;
    }
    case 'streak':
      return `Warm streak: ${r.streak.after} ${r.streak.after === 1 ? 'day' : 'days'}.${r.streak.newBest && r.streak.after > 1 ? ' Your best yet.' : ''}${r.streak.cozyEarned ? ' You earned a Tea Cozy.' : ''}`;
    case 'recipes':
      return r.quests
        .filter((q) => q.after > q.before)
        .map((q) => `${q.title}: ${q.justCompleted ? `done, plus ${q.reward} leaves` : `${q.after} of ${q.target}`}.`)
        .join(' ');
    case 'level':
      return `You reached cozy level ${r.level.after}.`;
    case 'badges':
      return r.badges.map((b) => `New badge: ${b.title}${b.tier > 1 ? `, tier ${b.tier}` : ''}.`).join(' ');
  }
}
