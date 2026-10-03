/** Greeting + Chai's contextual line, and today's minutes against the daily goal. */
import { motion } from 'motion/react';
import { Mascot, Icon } from '@/art';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { spring } from '@/lib/motion';
import { useSettings, RHYTHMS } from '@/state/settings';
import { Card, ProgressBar, SpeechBubble, Chip, useMediaQuery } from '@/ui';
import type { ReactNode } from 'react';
import { goalName } from './content';
import type { HomeData } from './useHomeData';
import s from './Home.module.css';

export function Hero({ data, status }: { data: HomeData; status?: ReactNode }) {
  const reduced = useReducedMotion();
  const wide = useMediaQuery('(min-width: 900px)');
  const narrow = useMediaQuery('(max-width: 359px)');
  const landscape = useMediaQuery('(max-width: 899px) and (orientation: landscape) and (max-height: 520px)');
  const rhythm = useSettings((st) => st.rhythm);
  const applyRhythm = useSettings((st) => st.applyRhythm);
  const { line } = data;
  return (
    <section className={s.hero} aria-labelledby="home-greeting">
      <div className={s.heroTop}>
        {status}
        <h1 id="home-greeting" className={s.greeting}>
          {data.title}
        </h1>
      </div>
      <div className={s.chaiRow}>
        <motion.div
          className={s.chai}
          data-part={data.part}
          key={line.pose}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduced ? { duration: 0.2 } : spring.cozy}
        >
          <Mascot pose={line.pose} size={landscape ? 76 : wide ? 152 : narrow ? 88 : 112} animate />
        </motion.div>
        <div className={s.bubbleWrap}>
          <SpeechBubble tail="left" key={line.text} live>
            <p className={s.bubbleText}>{line.text}</p>
            {line.suggestGentle && rhythm !== 'gentle' && (
              <div className={s.bubbleAction}>
                <Chip icon="moon" size="sm" onClick={() => applyRhythm('gentle')}>
                  Try Gentle · {RHYTHMS.gentle.focusMin} min
                </Chip>
              </div>
            )}
          </SpeechBubble>
        </div>
      </div>
    </section>
  );
}

/**
 * Today's minutes, in words: "12 min brewed · 18 min to go" over the goal bar. The numbers are the message;
 * the bar only shows how far along the goal they are.
 */
export function GoalCard({ data }: { data: HomeData }) {
  const { goalMin, todayMin, goalMet, goalProgress } = data;
  const left = Math.max(0, goalMin - todayMin);
  const vessel = goalName(goalMin);
  const named = vessel !== `${goalMin} min` ? ` (${vessel.toLowerCase()})` : '';
  return (
    <Card as="section" className={s.goalCard} aria-labelledby="home-goal" data-met={goalMet || undefined}>
      <h2 id="home-goal" className="sr-only">
        Today’s goal
      </h2>
      <div className={s.minutes}>
        <p className={s.brewed}>
          <strong className={s.minNum}>{todayMin} min</strong> brewed
        </p>
        {goalMet ? (
          <p className={s.toGo} data-met="">
            <Icon name="check" size={18} /> Goal met
          </p>
        ) : (
          <p className={s.toGo}>
            <strong className={s.minNum}>{left} min</strong> to go
          </p>
        )}
      </div>
      <ProgressBar
        value={Math.min(1, goalProgress)}
        tone={goalMet ? 'matcha' : 'persimmon'}
        height={12}
        label="Today’s goal"
        valueText={`${todayMin} of ${goalMin} minutes brewed today${goalMet ? ', goal met' : ''}`}
      />
      <p className={s.goalSub}>
        Today’s goal · {goalMin} min{named}
        {goalMet ? ' · anything more is a bonus' : ''}
      </p>
    </Card>
  );
}
