/**
 * (c) Today's recipes — progress bars fill from before → after; a finished
 * recipe pops the tea tin open with a little burst of leaves.
 */
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Leaf, QuestIcon, TeaTin } from '@/art';
import { audio } from '@/audio';
import { spring } from '@/lib/motion';
import { LeafConfetti } from '../LeafConfetti';
import { useBeat, useCues } from '../choreo';
import type { StepProps } from './types';
import s from '../Done.module.css';

export function RecipesStep({ report: r, reduced, active, headingRef, headingId }: StepProps) {
  const quests = r.quests;
  const completed = useMemo(() => quests.filter((q) => q.justCompleted), [quests]);
  const reward = completed.reduce((a, q) => a + q.reward, 0);
  const openAt = 1500;
  // beats: 1 tin · 2 bars fill · 3 tin opens (if any completed) · 4 rewards
  const beat = useBeat(active, [0, 450, openAt, openAt + 350]);

  useCues(active, [
    [450, () => audio.play('pop', { volume: 0.5, haptic: false })],
    ...(completed.length
      ? ([
          [openAt, () => audio.play('quest')],
          [openAt + 380, () => audio.play('leaf', { step: 4, haptic: false })],
          [openAt + 480, () => audio.play('leaf', { step: 6, haptic: false })],
          [openAt + 580, () => audio.play('leaf', { step: 8, haptic: false })],
        ] as [number, () => void][])
      : []),
  ]);

  const title = r.allQuestsJustDone
    ? 'All of today’s recipes, done'
    : completed.length > 1
      ? 'Recipes complete'
      : completed.length === 1
        ? 'Recipe complete'
        : 'Today’s recipes';
  const sub = completed.length
    ? `The tin’s open: +${reward} leaves${r.allQuestsJustDone ? ', plus a bonus for finishing all three' : ''}.`
    : 'Every brew stirs today’s recipes along.';

  return (
    <div className={s.step} data-step="recipes">
      <div className={s.hero}>
        <div className={s.glow} data-tone="matcha" aria-hidden="true" />
        {active && completed.length > 0 && beat >= 3 && <LeafConfetti burstKey={`tin${r.id}`} reduced={reduced} count={18} spread={0.8} />}
        <motion.div
          className={s.heroArt}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.8 }}
          animate={
            active
              ? beat >= 3 && completed.length && !reduced
                ? { opacity: 1, y: 0, scale: [1, 1.12, 1], rotate: [0, -4, 3, 0] }
                : { opacity: 1, y: 0, scale: 1 }
              : undefined
          }
          transition={reduced ? { duration: 0.2 } : beat >= 3 ? { duration: 0.5 } : spring.joyful}
        >
          <TeaTin size={150} state={completed.length > 0 && beat >= 3 ? 'open' : 'closed'} animate={!reduced} />
        </motion.div>
      </div>

      <div className={s.copy}>
        <h1 id={headingId} ref={headingRef} tabIndex={-1} className={s.title}>
          {title}
        </h1>
        <p className={s.sub}>{sub}</p>
      </div>

      <ul className={s.quests}>
        {quests.map((q, i) => {
          const moved = q.after > q.before;
          const v = (beat >= 2 ? q.after : q.before) / Math.max(1, q.target);
          const done = beat >= 2 ? q.done || q.after >= q.target : q.before >= q.target;
          return (
            <motion.li
              key={q.id}
              className={s.quest}
              data-moved={moved || undefined}
              data-done={done || undefined}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: -14 }}
              animate={active ? { opacity: 1, x: 0 } : undefined}
              transition={reduced ? { duration: 0.2 } : { ...spring.cozy, delay: 0.12 + i * 0.08 }}
            >
              <span className={s.questIcon} aria-hidden="true">
                <QuestIcon icon={q.icon} size={44} done={done} />
              </span>
              <span className={s.questMain}>
                <span className={s.questTitle}>{q.title}</span>
                <span className={s.bar} aria-hidden="true">
                  <span
                    className={s.barFill}
                    data-done={done || undefined}
                    style={{ width: `${Math.min(1, v) * 100}%`, transitionDelay: moved ? `${i * 120}ms` : '0ms' }}
                  />
                </span>
              </span>
              <span className={s.questCount} aria-hidden="true">
                {q.justCompleted && beat >= 4 ? (
                  <motion.span
                    className={s.reward}
                    initial={reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={reduced ? { duration: 0.2 } : spring.joyful}
                  >
                    <Leaf size={16} />+{q.reward}
                  </motion.span>
                ) : (
                  `${Math.min(q.target, beat >= 2 ? q.after : q.before)}/${q.target}`
                )}
              </span>
              <span className="sr-only">
                {q.title}: {q.done || q.after >= q.target ? `done${q.justCompleted ? `, plus ${q.reward} leaves` : ''}` : `${q.after} of ${q.target}`}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
