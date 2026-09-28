/**
 * Onboarding — one question per screen, Chai asks through a speech bubble.
 * hello → name → goal → rhythm → ambience → notifications → ready.
 * OWNER: home/onboarding/settings area.
 */
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Logo, Mascot, type MascotPose } from '@/art';
import { navigate } from '@/app/router';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { spring } from '@/lib/motion';
import { audio } from '@/audio';
import { useSettings, type AmbientKind, type RhythmId } from '@/state/settings';
import { useTimer } from '@/timer';
import { Button, IconButton, ProgressBar, SpeechBubble, useMediaQuery } from '@/ui';
import { notificationStatus, requestNotificationPermission, type NotificationStatus as NotifyStatus } from '@/timer/notify';
import { importData } from '@/progress';
import { useAmbientPreview } from '@/screens/home/shims/useAmbientPreview';
import { AmbienceStep, GoalStep, NameStep, NotifyStep, ReadyStep, RhythmStep } from './steps';
import s from './Welcome.module.css';

const STEPS = ['hello', 'name', 'goal', 'rhythm', 'ambience', 'notify', 'ready'] as const;
type Step = (typeof STEPS)[number];
const LAST = STEPS.length - 1;

export default function WelcomeScreen() {
  const settings = useSettings();
  const reduced = useReducedMotion();
  const wide = useMediaQuery('(min-width: 720px)');
  const compact = useMediaQuery('(max-width: 359px), (max-height: 680px)');
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState(settings.name);
  const [goal, setGoal] = useState<number | null>(null);
  const [rhythm, setRhythm] = useState<RhythmId | null>(null);
  const [ambient, setAmbient] = useState<AmbientKind | null>(null);
  const [notify, setNotify] = useState<NotifyStatus>(() => notificationStatus());
  const [asking, setAsking] = useState(false);
  const [hop, setHop] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const firstRender = useRef(true);
  const { playing, preview, stop } = useAmbientPreview();
  const step: Step = STEPS[i];
  const firstName = name.trim();

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to > LAST) return;
      setDir(to > i ? 1 : -1);
      setI(to);
      if (STEPS[to] !== 'ambience') stop();
      audio.play(to > i ? 'pop' : 'tap');
    },
    [i, stop],
  );

  // Move focus to the new question so screen readers announce it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = setTimeout(() => {
      if (step !== 'name') headingRef.current?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(id);
  }, [step]);

  const react = () => setHop((h) => h + 1);

  const pickGoal = (v: number) => {
    setGoal(v);
    settings.set({ dailyGoalMin: v });
    react();
  };
  const pickRhythm = (v: RhythmId) => {
    setRhythm(v);
    if (v !== 'custom') settings.applyRhythm(v);
    react();
  };
  const pickAmbient = (v: AmbientKind) => {
    setAmbient(v);
    settings.set({ ambient: v });
    preview(v);
    react();
  };

  const askNotifications = async () => {
    setAsking(true);
    const result = await requestNotificationPermission();
    setAsking(false);
    setNotify(result);
    // The Allow button is replaced by Continue: keep keyboard focus in the footer.
    setTimeout(() => primaryRef.current?.focus(), 30);
    if (result === 'granted') {
      react();
      setTimeout(() => go(STEPS.indexOf('ready')), 700);
    }
  };

  const finish = (startNow: boolean) => {
    stop();
    settings.set({ name: firstName, onboarded: true });
    if (startNow) useTimer.getState().startFocus();
    else navigate('/', { replace: true });
  };

  const canContinue = step === 'name' ? !!firstName : step === 'goal' ? goal != null : step === 'rhythm' ? rhythm != null : step === 'ambience' ? ambient != null : true;

  const next = () => {
    if (!canContinue) return;
    if (step === 'name') settings.set({ name: firstName });
    if (step === 'ready') return finish(true);
    go(i + 1);
  };

  // Enter advances (Duolingo-style) unless a button/link will handle it itself.
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'BUTTON' || t.tagName === 'A' || t.tagName === 'TEXTAREA' || t.closest('[role="dialog"]'))) return;
      e.preventDefault();
      nextRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const q = question(step, firstName, goal, notify);
  const variants = reduced
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: (d: number) => ({ opacity: 0, x: d * 48 }),
        center: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d * -32, transition: { duration: 0.12 } }),
      };

  if (step === 'hello') return <Hello onStart={() => go(1)} />;

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <div className={s.topInner}>
          <IconButton icon="back" label="Back" variant="secondary" tooltip={false} onClick={() => go(i - 1)} />
          <ProgressBar value={i / LAST} tone="persimmon" height={16} label={`Step ${i} of ${LAST}`} className={s.progress} />
          <div className={s.topRight}>
            {(step === 'name' || step === 'ambience') && (
              <button
                type="button"
                className={s.skip}
                onClick={() => {
                  if (step === 'ambience' && ambient == null) settings.set({ ambient: 'none' });
                  go(i + 1);
                }}
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={s.main}>
        <div className={s.prompt} data-step={step}>
          <motion.div
            key={`chai-${step}-${hop}`}
            className={s.chai}
            initial={reduced ? false : { scale: 0.92, y: 6 }}
            animate={{ scale: 1, y: 0 }}
            transition={spring.joyful}
          >
            <Mascot pose={q.pose} size={step === 'ready' ? (wide ? 200 : compact ? 120 : 168) : wide ? 148 : compact ? 84 : 108} animate />
          </motion.div>
          <div className={s.bubble}>
            <SpeechBubble key={`bubble-${step}`} tail={step === 'ready' ? 'top' : 'left'} tailAt={step === 'ready' ? '50%' : undefined} size="lg">
              {q.lead && <p className={s.questionLead}>{q.lead}</p>}
              <h1 ref={headingRef} tabIndex={-1} className={s.question}>
                {q.text}
              </h1>
              {q.sub && <p className={s.questionSub}>{q.sub}</p>}
            </SpeechBubble>
          </div>
        </div>

        <div className={s.stage}>
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduced ? { duration: 0.15 } : { x: { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 }, opacity: { duration: 0.14 } }}
              className={s.body}
            >
              {step === 'name' && <NameStep name={name} setName={setName} />}
              {step === 'goal' && <GoalStep value={goal} onChange={pickGoal} focusMin={settings.focusMin} />}
              {step === 'rhythm' && <RhythmStep value={rhythm} onChange={pickRhythm} />}
              {step === 'ambience' && <AmbienceStep value={ambient} onChange={pickAmbient} playing={playing} />}
              {step === 'notify' && <NotifyStep status={notify} focusMin={settings.focusMin} />}
              {step === 'ready' && (
                <ReadyStep goal={goal ?? settings.dailyGoalMin} rhythm={rhythm ?? settings.rhythm} ambient={ambient ?? settings.ambient} notify={notify === 'granted' && settings.notifications} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className={s.footer}>
        {step === 'notify' && notify === 'default' ? (
          <div className={s.footerInner} data-two>
            <Button size="lg" onClick={askNotifications} disabled={asking} className={s.footerPrimary}>
              {asking ? 'Asking…' : 'Allow nudges'}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => go(i + 1)} className={s.footerSecondary}>
              Not now
            </Button>
          </div>
        ) : step === 'ready' ? (
          <div className={s.footerInner} data-two>
            <Button size="lg" sfx="start" onClick={() => finish(true)} className={s.footerPrimary}>
              Put the kettle on
            </Button>
            <Button variant="ghost" size="lg" onClick={() => finish(false)} className={s.footerSecondary}>
              Maybe later
            </Button>
          </div>
        ) : (
          <div className={s.footerInner}>
            <Button ref={primaryRef} size="lg" onClick={next} disabled={!canContinue} className={s.footerPrimary}>
              Continue
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}

function question(step: Step, name: string, goal: number | null, notify: NotifyStatus): { text: string; lead?: string; sub?: string; pose: MascotPose } {
  switch (step) {
    case 'name':
      return { text: 'What should I call you?', pose: 'wave' };
    case 'goal':
      return {
        lead: name ? `Nice to meet you, ${name}.` : undefined,
        text: 'How much focus feels right each day?',
        pose: goal != null ? 'proud' : 'think',
      };
    case 'rhythm':
      return { text: 'Pick a brewing rhythm.', sub: 'Focus while the kettle heats, then a tea break.', pose: 'think' };
    case 'ambience':
      return { text: 'Want some sound while you brew?', pose: 'sip' };
    case 'notify':
      return notify === 'granted'
        ? { text: 'Lovely. I’ll nudge you when the kettle whistles.', pose: 'cheer' }
        : { text: 'Can I give you a nudge when the kettle whistles?', pose: 'idle' };
    case 'ready':
      return { text: name ? `You’re all set, ${name}.` : 'You’re all set.', sub: 'Let’s brew your first cup together.', pose: 'cheer' };
    default:
      return { text: '', pose: 'wave' };
  }
}

/* ---------- Hello (first screen) ---------- */
function Hello({ onStart }: { onStart: () => void }) {
  const reduced = useReducedMotion();
  const wideHello = useMediaQuery('(min-width: 720px)');
  const compactHello = useMediaQuery('(max-height: 680px)');
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const set = useSettings((st) => st.set);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const res = importData(await f.text());
    if (!res.ok) {
      setMsg({ tone: 'error', text: res.error });
      audio.play('error');
      return;
    }
    setMsg({ tone: 'ok', text: `Welcome back. ${res.summary.sessions} brews restored.` });
    audio.play('pop');
    setTimeout(() => set({ onboarded: true }), 900);
  };

  return (
    <div className={s.hello}>
      <main className={s.helloMain}>
        <motion.div
          className={s.helloBubble}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduced ? { duration: 0.2 } : { ...spring.cozy, delay: 0.35 }}
          style={{ transformOrigin: 'bottom center' }}
        >
          <SpeechBubble tail="bottom" tailAt="50%" size="lg" arrive={false}>
            <h1 className={s.helloTitle}>Hi, I’m Chai.</h1>
            <p className={s.helloLine}>I’ll keep you company while you focus.</p>
          </SpeechBubble>
        </motion.div>
        <motion.div
          className={s.helloChai}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduced ? { duration: 0.2 } : spring.joyful}
        >
          <Mascot pose="wave" size={wideHello ? 248 : compactHello ? 160 : 200} animate />
        </motion.div>
        <div className={s.brand}>
          <div className={s.wordmark}>
            <Logo variant="full" size={52} title="Kettle" />
          </div>
          <p className={s.tagline}>Put the kettle on. Get cozy. Get it done.</p>
        </div>
      </main>
      <footer className={s.helloFooter}>
        <div className={s.helloActions}>
          <Button size="lg" block onClick={onStart}>
            Get started
          </Button>
          <Button size="lg" block variant="ghost" onClick={() => fileRef.current?.click()}>
            I have a backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />
          {msg && (
            <p className={s.helloMsg} data-tone={msg.tone} role={msg.tone === 'error' ? 'alert' : 'status'}>
              {msg.text}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

