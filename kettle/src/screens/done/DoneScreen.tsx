/**
 * Session-complete celebration (#/done). OWNER: core-loop area.
 *
 * A sequence of cards driven by `lastReport`, Duolingo-lesson-end rhythm:
 *   whistle (stats) → warm streak* → recipes* → level up* → badges*   (*only when earned)
 * then "Start tea break" / "Skip break". The user advances with Continue
 * (Enter/Space work too). The current card survives reload (flow store).
 * Choreography waits until the tab is visible, so a brew that finishes in a
 * background tab still celebrates when you come back.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button, useMediaQuery } from '@/ui';
import { useProgress } from '@/progress';
import { nextBreakKind, useTimer } from '@/timer';
import { useSettings } from '@/state/settings';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { ease } from '@/lib/motion';
import { audio } from '@/audio';
import { getRoute, navigate } from '@/app/router';
import type { CompletionReport } from '@/progress';
import { beginBreak, setCelebrationStep, skipBreakFromDone, useFlow } from '@/app/flow';
import { usePageVisible } from '../focus/parts/hooks';
import { buildSteps, summarize, type StepKind, type StepProps } from './steps/types';
import { WhistleStep } from './steps/WhistleStep';
import { StreakStep } from './steps/StreakStep';
import { RecipesStep } from './steps/RecipesStep';
import { LevelStep } from './steps/LevelStep';
import { BadgesStep } from './steps/BadgesStep';
import s from './Done.module.css';

const STEP: Record<StepKind, (p: StepProps) => ReactNode> = {
  whistle: WhistleStep,
  streak: StreakStep,
  recipes: RecipesStep,
  level: LevelStep,
  badges: BadgesStep,
};

const AUTO_BREAK_S = 10;
/** How long the content takes to step aside before handing off to the break / home. */
const LEAVE_MS = 200;

/** Art scale for the hero: small on short phones, roomier on tall phones, ~1.45× on desktop. */
function useHeroScale(): number {
  const desk = useMediaQuery('(min-width: 1024px) and (min-height: 700px)');
  const tall = useMediaQuery('(max-width: 1023px) and (min-height: 800px)');
  const short = useMediaQuery('(max-height: 700px)');
  return desk ? 1.45 : tall ? 1.15 : short ? 0.8 : 1;
}

export default function DoneScreen() {
  const liveReport = useProgress((p) => p.lastReport);
  // Keep showing the celebration while we leave (the flow clears the report as it hands off).
  const kept = useRef<CompletionReport | null>(liveReport);
  if (liveReport) kept.current = liveReport;
  const report = liveReport ?? kept.current;
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const autoStart = useSettings((st) => st.autoStartBreaks);
  const headingId = useId();
  const hs = useHeroScale();

  // Latch: start the choreography the first time the page is actually visible.
  const [seen, setSeen] = useState(visible);
  useEffect(() => {
    if (visible) setSeen(true);
  }, [visible]);

  const steps = useMemo(() => (report ? buildSteps(report) : []), [report]);
  const [idx, setIdx] = useState(() => {
    const c = useFlow.getState().celebration;
    return report && c?.id === report.id ? c.step : 0;
  });
  const step = Math.min(idx, Math.max(0, steps.length - 1));
  const kind = steps[step];
  const last = step === steps.length - 1;

  // Arrived with nothing to celebrate → home. (Leaving via the CTAs navigates on its own.)
  useEffect(() => {
    if (!liveReport && !kept.current && getRoute() === '/done') navigate('/', { replace: true });
  }, [liveReport]);
  useEffect(() => {
    if (liveReport) setCelebrationStep(liveReport.id, step);
  }, [liveReport, step]);

  // Screen readers: land on each card's heading, then hear its summary.
  const headingRef = useCallback((el: HTMLHeadingElement | null) => {
    if (el) requestAnimationFrame(() => el.focus({ preventScroll: true }));
  }, []);
  const [said, setSaid] = useState('');
  useEffect(() => {
    if (!report || !kind || !seen) return;
    const t = setTimeout(() => setSaid(summarize(kind, report)), 700);
    return () => clearTimeout(t);
  }, [report, kind, seen]);

  const breakKind = nextBreakKind(useTimer.getState().completedInCycle);
  const breakLabel = breakKind === 'longBreak' ? 'Start long tea break' : 'Start tea break';

  // Hand-off (break / home): the card and buttons step aside first while the background shifts toward
  // the next screen's (sky for tea time), so the route dissolve never double-exposes two screens' text.
  const leaving = useRef(false);
  const [exit, setExit] = useState<'break' | 'home' | null>(null);
  const leave = useCallback(
    (to: 'break' | 'home') => {
      if (leaving.current) return;
      leaving.current = true;
      setExit(to);
      window.setTimeout(() => (to === 'break' ? beginBreak() : skipBreakFromDone()), reduced ? 90 : LEAVE_MS);
    },
    [reduced],
  );

  const advance = useCallback(() => {
    if (leaving.current) return;
    if (last) {
      leave('break');
      return;
    }
    audio.play('tap');
    setIdx(step + 1);
  }, [last, step, leave]);

  // Enter / Space continue from anywhere that isn't another control.
  const ctaRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('button, a, input, textarea, select, [role="button"], [role="dialog"]')) return;
      e.preventDefault();
      ctaRef.current?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Optional auto-start of the break once the last card is up.
  const [autoLeft, setAutoLeft] = useState<number | null>(null);
  const [autoCancelled, setAutoCancelled] = useState(false);
  const autoOn = !!liveReport && last && autoStart && !autoCancelled && seen;
  useEffect(() => {
    if (!autoOn) {
      setAutoLeft(null);
      return;
    }
    if (!visible) return; // pause while the tab is hidden
    setAutoLeft((n) => n ?? AUTO_BREAK_S);
    const id = setInterval(() => setAutoLeft((n) => (n == null ? n : n - 1)), 1000);
    return () => clearInterval(id);
  }, [autoOn, visible]);
  useEffect(() => {
    if (autoOn && autoLeft != null && autoLeft <= 0) leave('break');
  }, [autoOn, autoLeft, leave]);

  if (!report || !kind) return <div className={s.done} />;
  const Step = STEP[kind];

  return (
    <div
      className={s.done}
      data-step={kind}
      data-done-screen=""
      data-exit={exit ?? undefined}
      style={{ ['--hs' as string]: hs }}
    >
      <div className={s.bg} data-kind={kind} aria-hidden="true" />
      <div className={s.bgSky} aria-hidden="true" />
      <header className={s.top}>
        {steps.length > 1 && (
          <ol className={s.progress} aria-label={`Card ${step + 1} of ${steps.length}`}>
            {steps.map((k, i) => (
              <li key={k} className={s.progressDot} data-state={i < step ? 'done' : i === step ? 'now' : 'todo'} />
            ))}
          </ol>
        )}
      </header>

      <main className={s.stage}>
        {/* Cards slide past each other (overlapping) — the stage is never empty between cards. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.section
            key={kind}
            className={s.card}
            aria-labelledby={headingId}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 56 }}
            animate={{ opacity: 1, x: 0, transition: { duration: reduced ? 0.15 : 0.32, ease: ease.out, delay: reduced ? 0 : 0.04 } }}
            exit={reduced ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, x: -56, transition: { duration: 0.18, ease: ease.in } }}
          >
            <Step report={report} reduced={reduced} active={seen} scale={hs} headingRef={headingRef} headingId={headingId} />
          </motion.section>
        </AnimatePresence>
        <p className="sr-only" role="status" aria-live="polite">
          {said}
        </p>
      </main>

      <footer className={s.footer}>
        <div className={s.footInner} data-last={last || undefined}>
          {last ? (
            <>
              <Button variant="ghost" sfx="cancel" onClick={() => leave('home')} className={s.skip}>
                Skip break
              </Button>
              <Button ref={ctaRef} data-done-cta="" size="lg" variant="sky" sfx="start" onClick={advance} className={s.cta}>
                {breakLabel}
              </Button>
            </>
          ) : (
            <Button ref={ctaRef} data-done-cta="" size="lg" onClick={advance} className={s.cta} sfx={false}>
              Continue
            </Button>
          )}
        </div>
        {autoLeft != null && (
          <p className={s.auto}>
            <span aria-hidden="true" className={s.autoRing} style={{ ['--p' as string]: `${(autoLeft / AUTO_BREAK_S) * 100}%` }} />
            <span aria-live="off">Tea break starts on its own in {Math.max(0, autoLeft)}s</span>
            <button type="button" className={s.autoStop} onClick={() => setAutoCancelled(true)}>
              Wait
            </button>
          </p>
        )}
      </footer>
    </div>
  );
}
