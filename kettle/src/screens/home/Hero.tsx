/** Greeting + Chai's contextual line, and the daily goal ring. */
import { motion } from 'motion/react';
import { Mascot, Icon } from '@/art';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { spring } from '@/lib/motion';
import { useSettings, RHYTHMS } from '@/state/settings';
import { Card, Ring, SpeechBubble, Chip, useMediaQuery } from '@/ui';
import type { ReactNode } from 'react';
import { goalName, RHYTHM_OPTIONS } from './content';
import { brewsToGo } from './chai';
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

export function GoalCard({ data }: { data: HomeData }) {
  const { goalMin, todayMin, goalMet, goalProgress } = data;
  const narrow = useMediaQuery('(max-width: 359px), (max-width: 899px) and (orientation: landscape) and (max-height: 520px)');
  const left = Math.max(0, goalMin - todayMin);
  const rhythm = useSettings((st) => st.rhythm);
  const rhythmLabel = RHYTHM_OPTIONS.find((r) => r.id === rhythm)?.label ?? 'your';
  const n = brewsToGo(left, data.focusMin);
  const sub = goalMet
    ? data.completedToday > 1
      ? `${data.completedToday} brews today. Anything more is a bonus.`
      : 'Anything more is a bonus.'
    : todayMin === 0
      ? `That’s ${n === 1 ? 'one' : n} ${rhythmLabel} ${n === 1 ? 'brew' : 'brews'}.`
      : `About ${n === 1 ? 'one more' : `${n} more`} ${rhythmLabel} ${n === 1 ? 'brew' : 'brews'}.`;
  return (
    <Card as="section" className={`${s.goalCard} ${s.hideWithRail}`} aria-labelledby="home-goal" data-met={goalMet || undefined}>
      <div className={s.ringWrap}>
        <Ring value={goalProgress} size={narrow ? 76 : 92} thickness={narrow ? 9 : 11} tone={goalMet ? 'matcha' : 'persimmon'} label={`Daily goal: ${todayMin} of ${goalMin} minutes brewed today${goalMet ? ', goal met' : ''}`}>
          <span className={s.ringNum} data-met={goalMet || undefined}>
            {todayMin}
            <span className={s.ringOf}>/{goalMin}</span>
          </span>
        </Ring>
        {goalMet && (
          <span className={s.ringCheck} aria-hidden>
            <Icon name="check" size={16} />
          </span>
        )}
      </div>
      <div className={s.goalText}>
        <h2 id="home-goal" className={s.overline}>
          Daily goal · {goalName(goalMin)}
        </h2>
        <p className={s.goalBig}>{goalMet ? 'Goal met. Lovely.' : todayMin === 0 ? `${goalMin} min to brew` : `${left} min to go`}</p>
        <p className={s.goalSub}>{sub}</p>
      </div>
    </Card>
  );
}
