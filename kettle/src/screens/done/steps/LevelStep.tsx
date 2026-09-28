/**
 * (d) Cozy level up — the badge lands with slow rays, the number flips to the
 * new level, and any newly unlocked nook item gets a spotlight preview.
 */
import { AnimatePresence, motion } from 'motion/react';
import { audio } from '@/audio';
import { spring } from '@/lib/motion';
import { Nook } from '@/scene';
import { ITEM_BY_ID, itemsUnlockedAt } from '@/progress';
import { LeafConfetti } from '../LeafConfetti';
import { LevelBadge } from '@/art';
import { useBeat, useCues } from '../choreo';
import type { StepProps } from './types';
import s from '../Done.module.css';

export function LevelStep({ report: r, reduced, active, headingRef, headingId }: StepProps) {
  const lv = r.level;
  const unlocked = (lv.unlocked ?? []).map((id) => ITEM_BY_ID[id]).filter(Boolean);
  const first = unlocked[0];
  // beats: 1 badge · 2 level flips · 3 item card
  const beat = useBeat(active, [0, 700, 1300]);

  useCues(active, [
    [650, () => audio.play('levelUp')],
    ...(first ? ([[1350, () => audio.play('pop', { step: 5, haptic: false })]] as [number, () => void][]) : []),
  ]);

  const level = beat >= 2 ? lv.after : lv.before;
  const intoPct = lv.sizeAfter > 0 ? Math.min(1, lv.intoAfter / lv.sizeAfter) : 0;

  return (
    <div className={s.step} data-step="level">
      <div className={s.hero}>
        <div className={s.rays} data-still={reduced || undefined} aria-hidden="true" />
        {active && beat >= 2 && <LeafConfetti burstKey={`lv${lv.after}`} reduced={reduced} palette="gold" count={22} />}
        <motion.div
          className={s.heroArt}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.3, rotate: -25 }}
          animate={active ? { opacity: 1, scale: 1, rotate: 0 } : undefined}
          transition={reduced ? { duration: 0.2 } : spring.joyful}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={level}
              initial={reduced ? { opacity: 0 } : { rotateY: 90, opacity: 0.4 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { rotateY: -90, opacity: 0.4 }}
              transition={{ duration: reduced ? 0.2 : 0.32 }}
            >
              <LevelBadge level={level} size={156} title="" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <div className={s.copy}>
        <p className={s.overline} data-tone="honey">
          Cozy level up
        </p>
        <h1 id={headingId} ref={headingRef} tabIndex={-1} className={s.title}>
          Level {lv.after}
        </h1>
        <p className={s.sub}>{first ? 'Your nook just got a little cozier.' : 'Your nook is getting cozier.'}</p>
      </div>

      {first ? (
        <motion.figure
          className={s.itemCard}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.94 }}
          animate={beat >= 3 ? { opacity: 1, y: 0, scale: 1 } : undefined}
          transition={reduced ? { duration: 0.2 } : spring.cozy}
        >
          <div className={s.itemScene}>
            {beat >= 3 && (
              <Nook mode="showcase" items={itemsUnlockedAt(lv.after)} highlightItem={first.id} timeOfDay="auto" weather="clear" className={s.itemNook} />
            )}
            <span className={s.newPill}>New</span>
          </div>
          <figcaption className={s.itemCaption}>
            <span className={s.itemTitle}>New in your nook: {unlocked.map((i) => i.name).join(', ')}</span>
            <span className={s.itemStory}>{first.story}</span>
          </figcaption>
        </motion.figure>
      ) : (
        <motion.div
          className={s.levelBar}
          initial={{ opacity: 0 }}
          animate={beat >= 3 ? { opacity: 1 } : undefined}
          transition={{ duration: 0.3 }}
        >
          <span className={s.bar} aria-hidden="true">
            <span className={s.barFill} data-tone="honey" style={{ width: `${beat >= 3 ? intoPct * 100 : 0}%` }} />
          </span>
          <span className={s.levelBarText}>
            {Math.max(0, lv.sizeAfter - lv.intoAfter)} leaves to level {lv.after + 1}
          </span>
        </motion.div>
      )}
    </div>
  );
}
