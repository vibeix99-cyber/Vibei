/**
 * (b) Warm streak extended — the mug steams up, the number rolls to the new
 * count, the week strip days pop in and today warms up last.
 */
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon, StreakMug, TeaCozy } from '@/art';
import { WeekStrip } from '@/ui';
import { audio } from '@/audio';
import { spring } from '@/lib/motion';
import { parseDayKey } from '@/lib/dates';
import { streakTimeline, useProgress, weekStrip } from '@/progress';
import { LeafConfetti } from '../LeafConfetti';
import { useBeat, useCues } from '../choreo';
import type { StepProps } from './types';
import s from '../Done.module.css';

/** Seconds after the strip arrives before today's dot lights. */
const LIGHT_DELAY = 0.55;

export function StreakStep({ report: r, reduced, active, headingRef, headingId }: StepProps) {
  const st = r.streak;
  // The last seven days ending today, so a long streak reads as a run that today extends.
  const sessions = useProgress((p) => p.sessions);
  const week = useMemo(() => {
    const today = r.record.day;
    try {
      const strip = weekStrip(streakTimeline(sessions, today), today, (parseDayKey(today).getDay() + 1) % 7);
      if (strip.length === 7) return strip;
    } catch {
      /* fall back to the report's calendar week */
    }
    return st.week ?? [];
  }, [sessions, r.record.day, st.week]);
  // beats: 1 mug · 2 number rolls · 3 week strip arrives · 4 today lights up (kit WeekStrip `celebrate`)
  const stripAt = 1150;
  const todayAt = stripAt + LIGHT_DELAY * 1000;
  const beat = useBeat(active, [0, 650, stripAt, todayAt]);

  useCues(active, [
    [650, () => audio.play('streak')],
    [stripAt + 60, () => audio.play('streakTick', { step: 2, volume: 0.45, haptic: false })],
    [todayAt, () => audio.play('pop', { step: 8 })],
    ...(st.milestone ? ([[todayAt + 350, () => audio.play('levelUp', { volume: 0.6 })]] as [number, () => void][]) : []),
  ]);

  const n = beat >= 2 ? st.after : st.before;
  const dayWord = st.after === 1 ? 'day' : 'days';
  const title = st.after === 1 ? 'Your warm streak begins' : `${st.after} days warm`;
  const sub =
    st.after === 1
      ? 'Brew again tomorrow to keep the kettle warm.'
      : st.newBest
        ? `Your warmest streak yet — ${st.after} ${dayWord} in a row.`
        : `You kept the kettle warm ${st.after} ${dayWord} in a row.`;

  return (
    <div className={s.step} data-step="streak">
      <div className={s.hero}>
        <div className={s.glow} data-tone="persimmon" aria-hidden="true" />
        {active && st.milestone != null && beat >= 4 && <LeafConfetti burstKey={`m${st.milestone}`} reduced={reduced} palette="gold" />}
        <motion.div
          className={`${s.heroArt} ${s.mugWrap}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -8 }}
          animate={active ? { opacity: 1, scale: 1, rotate: 0 } : undefined}
          transition={reduced ? { duration: 0.2 } : spring.joyful}
        >
          <StreakMug size={168} state={beat >= 2 || reduced ? 'warm' : 'atRisk'} animate={!reduced} />
          <div className={s.streakNum} aria-hidden="true">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={n}
                className={s.streakNumInner}
                initial={reduced ? { opacity: 0 } : { y: '70%', opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { y: '-70%', opacity: 0 }}
                transition={reduced ? { duration: 0.2 } : spring.joyful}
              >
                {n}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div className={s.copy}>
        <h1 id={headingId} ref={headingRef} tabIndex={-1} className={s.title}>
          {title}
        </h1>
        <p className={s.sub}>{sub}</p>
      </div>

      {week.length > 0 && (
        <motion.div
          className={s.weekWrap}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
          animate={beat >= 3 ? { opacity: 1, y: 0, scale: 1 } : undefined}
          transition={reduced ? { duration: 0.2 } : spring.cozy}
        >
          {beat >= 3 && <WeekStrip days={week} celebrate delay={LIGHT_DELAY} size="lg" label="The last seven days" />}
        </motion.div>
      )}

      {(st.cozyEarned || st.milestone) && (
        <motion.div
          className={s.note}
          data-tone={st.cozyEarned ? 'sky' : 'honey'}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={beat >= 4 ? { opacity: 1, y: 0 } : undefined}
          transition={reduced ? { duration: 0.2 } : { ...spring.cozy, delay: 0.35 }}
        >
          {st.cozyEarned ? <TeaCozy size={40} animate={!reduced} /> : <Icon name="sparkle" size={22} />}
          <span>
            {st.cozyEarned ? (
              <>
                <strong>You earned a Tea Cozy.</strong> It keeps your streak warm for one missed day.
              </>
            ) : (
              <>
                <strong>{st.milestone}-day milestone.</strong> Chai made a fresh pot to celebrate.
              </>
            )}
          </span>
        </motion.div>
      )}
    </div>
  );
}
