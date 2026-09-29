/**
 * (a) "The kettle's whistling!" — Chai cheers, leaves burst, three stat tiles
 * arrive and count up (focus time, leaves with a bonus receipt, daily goal ring).
 */
import { useMemo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Icon, Leaf, Mascot } from '@/art';
import { Chip, Counter, Ring } from '@/ui';
import { useProgress, type SessionRecord } from '@/progress';
import { setIntentionOutcome } from '@/app/intention';
import { audio } from '@/audio';
import { spring } from '@/lib/motion';
import { TagChip } from '../../focus/parts/bits';
import { LeafConfetti } from '../LeafConfetti';
import { makeTicker, useBeat, useCues } from '../choreo';
import type { StepProps } from './types';
import s from '../Done.module.css';

export function WhistleStep({ report: r, reduced, active, headingRef, headingId }: StepProps) {
  // beats: 1 hero · 2 focus tile · 3 leaves tile · 4 goal tile · 5 receipt
  const beat = useBeat(active, [0, 520, 700, 880, 1900]);
  const tick = useMemo(() => makeTicker('leaf', { steps: 8 }), []);
  const mins = Math.max(1, Math.round(r.record.focusedMs / 60_000));
  const g = r.goal;
  const goalBefore = g.goalMin > 0 ? Math.min(1, g.beforeMin / g.goalMin) : 1;
  const goalAfter = g.goalMin > 0 ? Math.min(1, g.afterMin / g.goalMin) : 1;
  const goalDone = g.afterMin >= g.goalMin;

  // The whistle itself ('complete') played when the brew ended (flow.ts) — replay it only if
  // that happened while you were away (hidden tab / closed app), so the moment still sounds right.
  useCues(active, [
    [0, () => r.whileAway && audio.play('complete')],
    [520, () => audio.play('pop', { volume: 0.6, haptic: false })],
    [880, () => audio.play('pop', { volume: 0.6, step: 2, haptic: false })],
    [1500, () => g.justMet && audio.play('quest', { volume: 0.7 })],
  ]);

  const title = r.whileAway ? 'The kettle whistled' : 'The kettle’s whistling!';
  const sub = r.whileAway
    ? 'Your brew finished while you were away — nice.'
    : r.firstEver
      ? 'Your very first brew. Chai is beaming.'
      : null;

  // Recipe rewards get their own moment (the tin), so this card counts the brew itself.
  const brewBonuses = r.leaves.bonuses.filter((b) => b.kind !== 'quest' && b.kind !== 'allQuests');
  const receipt = [{ label: 'Focused minutes', amount: r.leaves.base }, ...brewBonuses].filter((b) => b.amount > 0);
  const brewLeaves = receipt.reduce((a, b) => a + b.amount, 0);

  return (
    <div className={s.step} data-step="whistle" data-choice={r.record.intention ? '' : undefined}>
      <div className={s.hero}>
        <div className={s.glow} data-tone="honey" aria-hidden="true" />
        {active && <LeafConfetti burstKey={r.id} reduced={reduced} delay={0.12} />}
        <motion.div
          className={s.heroArt}
          // Chai carries over from the whistle ring: visible from the first frame, then springs up.
          initial={reduced ? { opacity: 1 } : { opacity: 1, y: 28, scale: 0.8 }}
          animate={active ? { opacity: 1, y: 0, scale: 1 } : undefined}
          transition={reduced ? { duration: 0.2 } : spring.joyful}
        >
          <Mascot pose="cheer" size={200} animate={!reduced} />
        </motion.div>
      </div>

      <motion.div
        className={s.copy}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={active ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.35, delay: reduced ? 0 : 0.18 }}
      >
        <h1 id={headingId} ref={headingRef} tabIndex={-1} className={s.title}>
          {title}
        </h1>
        {sub && <p className={s.sub}>{sub}</p>}
        {r.record.intention ? (
          <>
            <p className={s.sub}>
              <span className={s.intent}>{r.record.intention}</span>
              {r.record.tag && <TagChip tag={r.record.tag} />}
            </p>
            <IntentionChoice record={r.record} />
          </>
        ) : (
          !sub && <p className={s.sub}>Another cup, brewed.</p>
        )}
      </motion.div>

      <div className={s.tiles}>
        <Tile tone="persimmon" label="Focus" show={beat >= 2} reduced={reduced} sr={`${mins} minutes focused`}>
          <span className={s.tileIcon}>
            <Icon name="clock" size={24} />
          </span>
          <span className={s.tileValue}>
            <Counter value={beat >= 2 ? mins : 0} duration={700} />
            <span className={s.unit}>min</span>
          </span>
        </Tile>
        <Tile tone="honey" label="Leaves" show={beat >= 3} reduced={reduced} sr={`${brewLeaves} leaves earned`}>
          <span className={s.tileIcon}>
            <Leaf size={26} />
          </span>
          <span className={s.tileValue}>
            <Counter
              value={beat >= 3 ? brewLeaves : 0}
              duration={Math.min(1500, 500 + brewLeaves * 22)}
              format={(n) => `+${n}`}
              onTick={(n) => tick(brewLeaves > 0 ? n / brewLeaves : 1)}
            />
          </span>
        </Tile>
        <Tile
          tone="matcha"
          label="Today"
          show={beat >= 4}
          reduced={reduced}
          sr={goalDone ? `Daily goal met: ${Math.round(g.afterMin)} of ${g.goalMin} minutes` : `Daily goal: ${Math.round(g.afterMin)} of ${g.goalMin} minutes`}
        >
          <span className={s.goalRing} data-done={goalDone || undefined}>
            <Ring value={beat >= 4 ? goalAfter : goalBefore} size={34} thickness={6} tone="matcha">
              {goalDone && beat >= 4 && (
                <motion.span
                  className={s.goalCheck}
                  initial={reduced ? { opacity: 0 } : { scale: 0 }}
                  animate={reduced ? { opacity: 1 } : { scale: 1 }}
                  transition={reduced ? { duration: 0.2, delay: 0.3 } : { ...spring.joyful, delay: 1.0 }}
                >
                  <Icon name="check" size={16} />
                </motion.span>
              )}
            </Ring>
          </span>
          <span className={s.tileValue}>
            <Counter value={beat >= 4 ? Math.round(g.afterMin) : Math.round(g.beforeMin)} from={Math.round(g.beforeMin)} duration={1000} />
            {/* Always a fraction of the daily goal, so it can't be misread as this session's time. */}
            <span className={s.unit}>/{g.goalMin}</span>
          </span>
        </Tile>
      </div>

      {receipt.length > 0 && (
        <ul className={s.receipt} aria-label="Leaves breakdown">
          {receipt.map((b, i) => (
            <motion.li
              key={`${b.label}-${i}`}
              className={s.receiptItem}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
              animate={beat >= 5 ? { opacity: 1, y: 0, scale: 1 } : undefined}
              transition={reduced ? { duration: 0.2 } : { ...spring.cozy, delay: i * 0.09 }}
            >
              <span className={s.receiptAmt}>+{b.amount}</span> {b.label.toLowerCase()}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tile({
  tone,
  label,
  show,
  reduced,
  sr,
  children,
}: {
  tone: string;
  label: string;
  show: boolean;
  reduced: boolean;
  sr: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={s.tile}
      data-tone={tone}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.86 }}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={reduced ? { duration: 0.2 } : spring.joyful}
    >
      <div className={s.tileHead} aria-hidden="true">
        {label}
      </div>
      <div className={s.tileBody} aria-hidden="true">
        {children}
      </div>
      <span className="sr-only">{sr}</span>
    </motion.div>
  );
}

/** Done or Carry forward: optional, changeable, stored on the record (reloads and other tabs agree). */
function IntentionChoice({ record }: { record: SessionRecord }) {
  const outcome = useProgress((st) => st.sessions.find((x) => x.id === record.id)?.outcome);
  return (
    <div className={s.intentChoice} role="group" aria-label={`${record.intention}: done, or carry it forward to your next brew?`}>
      {/* The chip's own tick marks the choice, so the leading icon steps aside when selected. */}
      <Chip tone="matcha" icon={outcome === 'done' ? undefined : 'check'} selected={outcome === 'done'} onClick={() => setIntentionOutcome(record, 'done')}>
        Done
      </Chip>
      <Chip tone="honey" icon={outcome === 'carried' ? undefined : 'refresh'} selected={outcome === 'carried'} onClick={() => setIntentionOutcome(record, 'carried')}>
        Carry forward
      </Chip>
    </div>
  );
}
