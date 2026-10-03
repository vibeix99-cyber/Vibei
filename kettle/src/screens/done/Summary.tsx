/**
 * The one summary after a brew (#/done). OWNER: core-loop area.
 *
 * Shown in the session screen's panel, next to (desktop) or under (phone) the same stage the brew ran on —
 * the scene never changes position, so there is no blank hand-off and no cross-fade of whole scenes.
 * Reads the report the progress engine computed once at completion (see ./summary.ts): it grants nothing.
 *
 * Order: minutes brewed + Tea time (the footer never scrolls away) → the task (only if there was one) →
 * a major room unlock, prominent (above the routine rewards, so a phone shows it without scrolling) → the
 * optional setup after a first brew → compact routine rewards → the arithmetic, on request.
 * Motion: the panel content rises in a short stagger; reduced motion: one simple fade, nothing moves.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Badge, Icon, Leaf, LevelBadge, StreakMug, TeaCozy, TeaTin } from '@/art';
import { Button, Chip, Ring } from '@/ui';
import { Nook } from '@/scene';
import { ITEM_BY_ID, itemsUnlockedAt, syncFromStorage, useProgress, type CompletionReport, type SessionRecord } from '@/progress';
import { nextBreakKind, useTimer } from '@/timer';
import { useSettings } from '@/state/settings';
import { audio } from '@/audio';
import { ease } from '@/lib/motion';
import { plural } from '@/lib/format';
import { getRoute, navigate } from '@/app/router';
import { setIntentionOutcome } from '@/app/intention';
import { beginBreak, openSetupFromSummary, skipBreakFromDone, useFlow } from '@/app/flow';
import { usePageVisible } from '../focus/parts/hooks';
import { TagChip } from '../focus/parts/bits';
import { LeafConfetti } from './LeafConfetti';
import { buildSummary, type RewardPill } from './summary';
import s from './Summary.module.css';

const AUTO_BREAK_S = 10;
/** How long the summary steps aside before handing off to the break / home. */
const LEAVE_MS = 180;

export function Summary({ reduced }: { reduced: boolean }) {
  const liveReport = useProgress((p) => p.lastReport);
  // Keep showing the summary while we leave (the flow clears the report as it hands off).
  const kept = useRef<CompletionReport | null>(liveReport);
  if (liveReport) kept.current = liveReport;
  const report = liveReport ?? kept.current;
  const visible = usePageVisible();
  const autoStart = useSettings((st) => st.autoStartBreaks);
  const setupPending = useSettings((st) => st.setupPending);
  const shortMin = useSettings((st) => st.shortBreakMin);
  const longMin = useSettings((st) => st.longBreakMin);
  const every = useSettings((st) => Math.max(1, st.longBreakEvery));
  const headingId = useId();

  // Arrived with nothing to summarise → home. When another tab finished the brew, its timer write reaches us
  // a moment before its progress write: re-read storage, and if a summary is expected give it a moment.
  useEffect(() => {
    if (liveReport || kept.current || getRoute() !== '/done') return;
    syncFromStorage();
    if (useProgress.getState().lastReport) return;
    const ended = useTimer.getState().lastEnded;
    const unrecorded = !!ended && ended.phase === 'focus' && ended.reason === 'complete' && !useProgress.getState().sessions.some((x) => x.id === ended.sessionId);
    const expecting = unrecorded || useFlow.getState().celebration != null;
    const t = setTimeout(() => {
      if (!useProgress.getState().lastReport && getRoute() === '/done') navigate('/', { replace: true });
    }, expecting ? 2000 : 0);
    return () => clearTimeout(t);
  }, [liveReport]);

  const model = useMemo(() => (report ? buildSummary(report) : null), [report]);
  const breakKind = nextBreakKind(useTimer.getState().completedInCycle);
  const isLong = breakKind === 'longBreak';
  const breakMin = isLong ? longMin : shortMin;

  // Screen readers land on the headline and hear the whole summary once.
  const headingRef = useCallback((el: HTMLHeadingElement | null) => {
    if (el) requestAnimationFrame(() => el.focus({ preventScroll: true }));
  }, []);
  const [said, setSaid] = useState('');
  useEffect(() => {
    if (!model || !visible) return;
    const t = setTimeout(() => setSaid(model.announce), 600);
    return () => clearTimeout(t);
  }, [model, visible]);

  // A major room unlock gets its moment: the level-up sound once, when the summary is first seen.
  const cued = useRef(false);
  useEffect(() => {
    if (!model?.unlock || !visible || cued.current) return;
    cued.current = true;
    const t = setTimeout(() => audio.play('levelUp'), 700);
    return () => clearTimeout(t);
  }, [model, visible]);

  const leaving = useRef(false);
  const [exit, setExit] = useState(false);
  const leave = useCallback(
    (to: 'break' | 'home' | 'setup') => {
      if (leaving.current) return;
      leaving.current = true;
      setExit(true);
      window.setTimeout(() => (to === 'break' ? beginBreak() : to === 'home' ? skipBreakFromDone() : openSetupFromSummary()), reduced ? 60 : LEAVE_MS);
    },
    [reduced],
  );

  // Enter / Space from anywhere that isn't another control starts tea time.
  const ctaRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('button, a, input, textarea, select, summary, [role="button"], [role="dialog"]')) return;
      e.preventDefault();
      ctaRef.current?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Optional auto-start of the break (settings), paused while the tab is hidden; "Wait" stops it.
  const [autoLeft, setAutoLeft] = useState<number | null>(null);
  const [autoCancelled, setAutoCancelled] = useState(false);
  const autoOn = !!liveReport && autoStart && !autoCancelled && visible;
  useEffect(() => {
    if (!autoOn) {
      if (autoCancelled || !autoStart) setAutoLeft(null);
      return;
    }
    setAutoLeft((n) => n ?? AUTO_BREAK_S);
    const id = setInterval(() => setAutoLeft((n) => (n == null ? n : n - 1)), 1000);
    return () => clearInterval(id);
  }, [autoOn, autoCancelled, autoStart]);
  useEffect(() => {
    if (autoOn && autoLeft != null && autoLeft <= 0) leave('break');
  }, [autoOn, autoLeft, leave]);

  if (!report || !model) return <div className={s.summary} />;
  const r = report;
  const sub = r.whileAway
    ? `The kettle whistled while you were away. Tea’s ready${isLong ? '' : ' when you are'}.`
    : isLong
      ? `${plural(every, 'brew')} done. Put your feet up: a long tea break, ${breakMin} min.`
      : `Tea’s ready. Take ${breakMin === 5 ? 'five' : `${breakMin} minutes`} before the next one.`;

  const enter = (i: number) =>
    reduced
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.22 } }
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.42, ease: ease.out, delay: 0.06 + i * 0.06 } };

  return (
    <div className={s.summary} data-exit={exit || undefined} aria-labelledby={headingId} role="region">
      <div className={s.scroll}>
        <motion.header className={s.head} {...enter(0)}>
          <h1 id={headingId} ref={headingRef} tabIndex={-1} className={s.title}>
            {model.headline}
          </h1>
          <p className={s.sub}>{sub}</p>
        </motion.header>

        {r.record.intention.trim() && (
          <motion.section className={s.task} aria-label="Your task" {...enter(1)}>
            <p className={s.taskName}>
              <Icon name="edit" size={16} />
              <span className={s.taskText}>{r.record.intention}</span>
              {r.record.tag && <TagChip tag={r.record.tag} />}
            </p>
            <TaskChoice record={r.record} />
          </motion.section>
        )}

        {model.unlock && <Unlock ids={model.unlock.ids} level={model.unlock.level} reduced={reduced} visible={visible} enter={enter(2)} />}

        {setupPending && r.firstEver && (
          <motion.section className={s.setup} aria-labelledby={`${headingId}-setup`} {...enter(3)}>
            <div>
              <h2 id={`${headingId}-setup`} className={s.setupTitle}>
                Make Kettle yours
              </h2>
              <p className={s.setupSub}>Your name, daily goal, rhythm and sounds. About a minute, now or later in Settings.</p>
            </div>
            <Button variant="soft" size="sm" onClick={() => leave('setup')}>
              Set up
            </Button>
          </motion.section>
        )}

        <motion.ul className={s.pills} aria-label="Rewards" {...enter(4)}>
          {model.pills.map((p, i) => (
            <li key={`${p.kind}-${i}`} className={s.pill} data-kind={p.kind}>
              <span className={s.pillArt} aria-hidden="true">
                <PillArt pill={p} report={r} />
              </span>
              <span aria-hidden={p.sr ? true : undefined}>{p.text}</span>
              {p.sr && <span className="sr-only">{p.sr}</span>}
            </li>
          ))}
        </motion.ul>

        <motion.div {...enter(5)}>
          <Details model={model} streakDays={r.streak.after} />
        </motion.div>
      </div>

      <motion.footer className={s.footer} {...enter(3)}>
        <Button ref={ctaRef} size="lg" variant="sky" sfx="start" icon={<Icon name="cup" size={22} />} onClick={() => leave('break')} className={s.cta} data-done-cta="">
          {isLong ? `Long tea break · ${breakMin} min` : `Tea time · ${breakMin} min`}
        </Button>
        <div className={s.second} data-auto={autoLeft != null || undefined}>
          {autoLeft != null && (
            <p className={s.auto}>
              <span aria-hidden="true" className={s.autoRing} style={{ ['--p' as string]: `${(autoLeft / AUTO_BREAK_S) * 100}%` }} />
              <span aria-live="off">Starts in {Math.max(0, autoLeft)}s</span>
              <button type="button" className={s.autoStop} onClick={() => setAutoCancelled(true)}>
                Wait
              </button>
            </p>
          )}
          <Button variant="ghost" sfx="cancel" onClick={() => leave('home')} className={s.skip}>
            Skip break
          </Button>
        </div>
      </motion.footer>
      <p className="sr-only" role="status" aria-live="polite">
        {said}
      </p>
    </div>
  );
}

/** Done or Carry forward — clearly about the task; changeable; stored on the record (reloads/tabs agree). */
function TaskChoice({ record }: { record: SessionRecord }) {
  const outcome = useProgress((st) => st.sessions.find((x) => x.id === record.id)?.outcome);
  return (
    <div className={s.choice}>
      <div className={s.choiceChips} role="group" aria-label={`“${record.intention}”: done, or carry it forward to your next brew?`}>
        <Chip tone="matcha" icon={outcome === 'done' ? undefined : 'check'} selected={outcome === 'done'} onClick={() => setIntentionOutcome(record, outcome === 'done' ? null : 'done')}>
          Done
        </Chip>
        <Chip tone="honey" icon={outcome === 'carried' ? undefined : 'refresh'} selected={outcome === 'carried'} onClick={() => setIntentionOutcome(record, outcome === 'carried' ? null : 'carried')}>
          Carry forward
        </Chip>
      </div>
      <p className={s.choiceHint} aria-live="polite">
        {outcome === 'done' ? 'Crossed off. Your next brew starts fresh.' : outcome === 'carried' ? 'It’ll be waiting for your next brew.' : 'Finished this task, or carry it to your next brew?'}
      </p>
    </div>
  );
}

function PillArt({ pill, report }: { pill: RewardPill; report: CompletionReport }): ReactNode {
  switch (pill.kind) {
    case 'leaves':
      return <Leaf size={20} />;
    case 'goal':
      return (
        <Ring value={pill.value ?? 0} size={20} thickness={4} tone={(pill.value ?? 0) >= 1 ? 'matcha' : 'persimmon'} label="">
          {null}
        </Ring>
      );
    case 'streak':
      return <StreakMug state="warm" count={report.streak.after} size={26} animate={false} />;
    case 'cozy':
      return <TeaCozy size={24} animate={false} />;
    case 'recipes':
      return <TeaTin state="open" size={24} animate={false} />;
    case 'level':
      return <LevelBadge level={pill.value ?? report.level.after} size={22} />;
    case 'badge':
      return <Badge id={pill.id ?? ''} tier={pill.tier ?? 1} size={26} />;
  }
}

function Unlock({ ids, level, reduced, visible, enter }: { ids: string[]; level: number; reduced: boolean; visible: boolean; enter: object }) {
  const items = ids.map((id) => ITEM_BY_ID[id]).filter(Boolean);
  const first = items[0];
  if (!first) return null;
  const names = items.map((i) => i.name);
  const title = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)} are in your nook` : `${names[0]} is in your nook`;
  return (
    <motion.section className={s.unlock} aria-label={`Cozy level ${level}: ${title}`} {...enter}>
      <div className={s.unlockScene}>
        {visible && <Nook mode="showcase" items={itemsUnlockedAt(level)} highlightItem={first.id} timeOfDay="auto" weather="clear" className={s.unlockNook} />}
        {visible && <LeafConfetti burstKey={`unlock-${level}`} reduced={reduced} palette="gold" count={18} delay={0.5} spread={0.8} />}
      </div>
      <div className={s.unlockText}>
        <h2 className={s.unlockTitle}>{title}</h2>
        <p className={s.unlockSub}>
          <LevelBadge level={level} size={22} /> Cozy level {level} · {first.story}
        </p>
      </div>
    </motion.section>
  );
}

function Details({ model, streakDays }: { model: ReturnType<typeof buildSummary>; streakDays: number }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const d = model.details;
  const pct = d.size > 0 ? Math.min(100, (d.into / d.size) * 100) : 0;
  return (
    <section className={s.details} data-open={open || undefined}>
      <button type="button" className={s.detailsToggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        How your leaves added up
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={18} />
      </button>
      <div id={id} className={s.detailsBody} hidden={!open}>
        <ul className={s.rows}>
          {d.rows.map((row, i) => (
            <li key={`${row.label}-${i}`} className={s.row}>
              <span>{row.label}</span>
              <span className={s.amount}>+{row.amount}</span>
            </li>
          ))}
          <li className={`${s.row} ${s.total}`}>
            <span>This brew</span>
            <span className={s.amount}>
              <Leaf size={15} /> +{d.total}
            </span>
          </li>
        </ul>
        <div className={s.levelRow}>
          <span>
            Cozy level {d.level} → {d.level + 1}
          </span>
          <span>{plural(d.toNext, 'leaf', 'leaves')} to go</span>
        </div>
        <span className={s.bar} aria-hidden="true">
          <span className={s.barFill} style={{ width: `${pct}%` }} />
        </span>
        <p className={s.note}>
          {streakDays > 0 ? `Your ${streakDays}-day streak stays warm with one full brew a day.` : 'One full brew a day keeps your streak warm.'}
        </p>
      </div>
    </section>
  );
}
