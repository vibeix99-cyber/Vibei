/** (e) New badges — the medal spins in with a shine sweep; extra badges line up below. */
import { motion } from 'motion/react';
import { audio } from '@/audio';
import { spring } from '@/lib/motion';
import { BADGE_BY_ID } from '@/progress';
import { LeafConfetti } from '../LeafConfetti';
import { Badge } from '@/art';
import { useBeat, useCues } from '../choreo';
import { roman, type StepProps } from './types';
import s from '../Done.module.css';

export function BadgesStep({ report: r, reduced, active, headingRef, headingId }: StepProps) {
  const [first, ...rest] = r.badges;
  const beat = useBeat(active, [0, 500, 1000]);
  useCues(active, [
    [450, () => audio.play('badge')],
    ...rest.map((_, i): [number, () => void] => [1000 + i * 160, () => audio.play('pop', { step: 3 + i * 2, volume: 0.6, haptic: false })]),
  ]);
  if (!first) return null;
  const tiers = BADGE_BY_ID[first.id]?.tiers.length ?? 1;
  const name = tiers > 1 ? `${first.title} ${roman(first.tier)}` : first.title;

  return (
    <div className={s.step} data-step="badges">
      <div className={s.hero}>
        <div className={s.glow} data-tone="plum" aria-hidden="true" />
        {active && beat >= 2 && <LeafConfetti burstKey={`b${first.id}${first.tier}`} reduced={reduced} count={20} />}
        <motion.div
          className={`${s.heroArt} ${s.medal}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotateY: 180 }}
          animate={active ? { opacity: 1, scale: 1, rotateY: 0 } : undefined}
          transition={reduced ? { duration: 0.2 } : { ...spring.joyful, stiffness: 300 }}
        >
          <Badge id={first.id} tier={first.tier} size={156} title="" />
          <span className={s.glint} data-go={(beat >= 2 && !reduced) || undefined} aria-hidden="true" />
        </motion.div>
      </div>

      <div className={s.copy}>
        <p className={s.overline} data-tone="plum">
          {r.badges.length > 1 ? `${r.badges.length} new badges` : 'New badge'}
        </p>
        <h1 id={headingId} ref={headingRef} tabIndex={-1} className={s.title}>
          {name}
        </h1>
        <p className={s.sub}>{first.description}</p>
      </div>

      {rest.length > 0 && (
        <ul className={s.moreBadges}>
          {rest.map((b, i) => {
            const t = BADGE_BY_ID[b.id]?.tiers.length ?? 1;
            return (
              <motion.li
                key={`${b.id}-${b.tier}`}
                className={s.moreBadge}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.8 }}
                animate={beat >= 3 ? { opacity: 1, y: 0, scale: 1 } : undefined}
                transition={reduced ? { duration: 0.2 } : { ...spring.joyful, delay: i * 0.16 }}
              >
                <Badge id={b.id} tier={b.tier} size={60} title="" />
                <span>{t > 1 ? `${b.title} ${roman(b.tier)}` : b.title}</span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
