/**
 * (b) Warm streak extended — the mug steams up, the number rolls to the new
 * count, the week strip days pop in and today warms up last.
 */
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon, StreakMug, TeaCozy } from '@/art';
import { audio } from '@/audio';
import { spring } from '@/lib/motion';
import { parseDayKey } from '@/lib/dates';
import { streakTimeline, useProgress, weekStrip } from '@/progress';
import { LeafConfetti } from '../LeafConfetti';
import { useBeat, useCues } from '../choreo';
import type { StepProps } from './types';
import s from '../Done.module.css';

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
  const todayIdx = Math.max(0, week.findIndex((d) => d.isToday));
  // beats: 1 mug · 2 number rolls · 3 week strip · 4 today warms
  const dayGap = 70;
  const todayAt = 1250 + todayIdx * dayGap + 250;
  const beat = useBeat(active, [0, 650, 1150, todayAt]);

  useCues(active, [
    [650, () => audio.play('streak')],
    ...week.map((_, i): [number, () => void] => [1150 + i * dayGap, () => i !== todayIdx && audio.play('streakTick', { step: i, volume: 0.45, haptic: false })]),
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
        <ol className={s.week} aria-label="The last seven days">
          {week.map((d, i) => {
            const isToday = i === todayIdx;
            const state = isToday ? (beat >= 4 ? 'done' : 'today') : d.state;
            return (
              <motion.li
                key={d.day}
                className={s.weekDay}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.7 }}
                animate={beat >= 3 ? { opacity: 1, y: 0, scale: 1 } : undefined}
                transition={reduced ? { duration: 0.2 } : { ...spring.joyful, delay: (i * dayGap) / 1000 }}
              >
                <span className={s.weekLabel} data-today={isToday || undefined}>
                  {d.label}
                </span>
                <motion.span
                  className={s.weekDot}
                  data-state={state}
                  animate={isToday && beat >= 4 && !reduced ? { scale: [1, 1.28, 1] } : undefined}
                  transition={{ duration: 0.5 }}
                >
                  {state === 'done' && <Icon name="check" size={16} />}
                  {state === 'cozy' && <Icon name="cozy" size={16} />}
                </motion.span>
                <span className="sr-only">
                  {d.state === 'done' || isToday ? 'warm' : d.state === 'cozy' ? 'kept warm by a Tea Cozy' : d.state === 'future' ? 'coming up' : 'missed'}
                </span>
              </motion.li>
            );
          })}
        </ol>
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
