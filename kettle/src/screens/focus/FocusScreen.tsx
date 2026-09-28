/**
 * Focus + tea-break session screen (#/focus). OWNER: core-loop area.
 *
 * Views (derived, never stored):
 *   focus    — timer running/paused in a brew
 *   whistle  — the ~2 s beat right after a brew completes (kettle whistles) → /done
 *   break    — tea break (short or long), sky-toned
 *   over     — a break ended and the next brew wasn't auto-started
 *   none     — nothing to show → home (or /done when a celebration is pending)
 *
 * Layouts: phone portrait (scene card → timer → thumb-reach controls),
 * phone landscape + desktop (scene | panel). Zen: chrome fades after 7 s idle.
 * Keys: Space pause/resume · Esc end sheet · + add 5 min · M mute.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TimerAnnouncer, elapsedActiveMs, useRemaining, useTimer } from '@/timer';
import { useShortcut } from '@/lib/shortcuts';
import { clock } from '@/lib/clock';
import { formatClock, spokenDuration } from '@/lib/format';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { ease, spring } from '@/lib/motion';
import { audio } from '@/audio';
import { Icon, Mascot } from '@/art';
import { Button, Digits, IconButton, Kbd } from '@/ui';
import { Nook } from '@/scene';
import { useProgress, useUnlockedItems } from '@/progress';
import { useSettings } from '@/state/settings';
import { navigate } from '@/app/router';
import { WHISTLE_MS, endFocusEarly, leaveBreakOver, skipBreak, startNextBrew, useFlow } from '@/app/flow';
import { TimerRing } from './parts/TimerRing';
import { RoundButton } from './parts/RoundButton';
import { EndSheet } from './parts/EndSheet';
import { AmbienceSheet } from './parts/AmbienceSheet';
import { CycleDots, TagChip } from './parts/bits';
import { ambientOption, weatherFor } from './parts/ambience';
import { useZen } from './parts/hooks';
import { BreakIdeas } from './break/BreakIdeas';
import { cycleInfo, focusStatus, type View } from './cycle';
import s from './FocusScreen.module.css';

const FIVE_MIN = 5 * 60_000;

export default function FocusScreen() {
  const t = useTimer();
  const tv = useRemaining();
  const whistle = useFlow((f) => f.whistle);
  const breakOver = useFlow((f) => f.breakOver);
  const hasReport = useProgress((p) => p.lastReport != null);
  const items = useUnlockedItems();
  const reduced = useReducedMotion();
  const ambient = useSettings((st) => st.ambient);
  const muted = useSettings((st) => st.muted);
  const every = useSettings((st) => Math.max(1, st.longBreakEvery));
  const setSettings = useSettings((st) => st.set);

  const [endOpen, setEndOpen] = useState(false);
  const [ambOpen, setAmbOpen] = useState(false);
  const [bumps, setBumps] = useState<number[]>([]);
  const mainRef = useRef<HTMLButtonElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const frozen = useRef<ReactNode>(null);
  const [bloom, setBloom] = useState<{ x: number; y: number; r: number; R: number } | null>(null);

  const view: View =
    t.status !== 'idle' ? (t.phase === 'focus' ? 'focus' : 'break') : whistle ? 'whistle' : breakOver ? 'over' : 'none';
  const paused = t.status === 'paused';
  const isLong = (view === 'break' && t.phase === 'longBreak') || (view === 'over' && breakOver?.phase === 'longBreak');
  const sheetOpen = endOpen || ambOpen;
  const zen = useZen(view === 'focus' && !paused && !sheetOpen);

  // Nothing to show here → celebration if one is pending, else home.
  useEffect(() => {
    if (view === 'none') navigate(hasReport ? '/done' : '/', { replace: true });
  }, [view, hasReport]);

  // Whistle → celebration: the ring's warm inside swells to fill the screen, in the celebration's own
  // colors, so the route dissolve reveals content over a matching background (no blank / double frames).
  useEffect(() => {
    if (view !== 'whistle' || reduced) {
      setBloom(null);
      return;
    }
    const t = setTimeout(() => {
      const el = dialRef.current;
      if (!el) return;
      const b = el.getBoundingClientRect();
      const x = b.left + b.width / 2;
      const y = b.top + b.height / 2;
      const R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 20;
      setBloom({ x, y, r: b.width * 0.42, R });
    }, WHISTLE_MS - 420);
    return () => clearTimeout(t);
  }, [view, reduced]);

  // Close the end sheet if the phase changes under it.
  useEffect(() => {
    if (view !== 'focus') setEndOpen(false);
  }, [view]);

  // Ambience: during a brew the audio session owns it (fade in, pause dip, simmer, fade out) —
  // this screen only asks for it on tea breaks and for quiet around the whistle / break-over card.
  useEffect(() => {
    if (view === 'break') audio.setAmbient(ambient, { fadeMs: 1500 });
    else if (view !== 'focus') audio.setAmbient('none', { fadeMs: view === 'whistle' ? 900 : 1500 });
  }, [view, ambient]);
  useEffect(() => () => audio.setAmbient('none', { fadeMs: 1200 }), []);

  const toggle = useCallback(() => {
    const st = useTimer.getState();
    if (st.status === 'idle') return;
    audio.play(st.status === 'running' ? 'pause' : 'resume');
    st.toggle();
  }, []);

  const addFive = useCallback(() => {
    const st = useTimer.getState();
    if (st.status === 'idle' || st.phase !== 'focus') return;
    st.addTime(FIVE_MIN);
    setBumps((b) => [...b.slice(-2), clock.now()]);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !useSettings.getState().muted;
    setSettings({ muted: next });
    audio.sync();
    if (!next) audio.play('toggle');
  }, [setSettings]);

  const active = view === 'focus' || view === 'break';
  useShortcut('Space', toggle, { enabled: active });
  useShortcut(
    'Escape',
    () => {
      audio.play('whoosh');
      // Give the sheet a real opener to hand focus back to (not <body>).
      if (!document.activeElement || document.activeElement === document.body) mainRef.current?.focus({ preventScroll: true });
      setEndOpen(true);
    },
    { enabled: view === 'focus' },
  );
  useShortcut(
    ['+', '='],
    () => {
      audio.play('addTime');
      addFive();
    },
    { enabled: view === 'focus' },
  );
  useShortcut('m', toggleMute, { enabled: view !== 'none' });

  // Focused time so far (for the end sheet copy).
  const focusedMs = useMemo(() => (endOpen ? elapsedActiveMs(useTimer.getState(), clock.now()) : 0), [endOpen]);

  // While this screen is the *outgoing* layer of a route dissolve the session has already
  // ended (view 'none'): keep showing the last frame instead of an empty page.
  if (view === 'none') return frozen.current ?? <div className={s.screen} data-view="none" data-focus-view="none" />;

  const amb = ambientOption(ambient);
  const cycle = cycleInfo(view, t.completedInCycle, every, isLong);
  const clockText = formatClock(tv.seconds * 1000);
  const heading =
    view === 'break' ? (isLong ? 'Long tea break' : 'Tea break') : view === 'over' ? 'Break’s over' : t.intention ? `Brewing: ${t.intention}` : 'Focus session';
  const nookMode = view === 'break' ? 'break' : view === 'over' ? 'idle' : 'focus';
  const status =
    view === 'whistle' ? 'Tea’s ready' : paused ? 'Paused · the kettle will wait' : view === 'break' ? 'left to sip' : focusStatus(tv.progress, tv.remainingMs);

  const out = (
    <div
      className={s.screen}
      data-view={view}
      data-focus-view={view}
      data-paused={paused || undefined}
      data-long={isLong || undefined}
      data-zen={zen || undefined}
      data-reduced={reduced || undefined}
    >
      <div className={s.wash} aria-hidden="true" />
      <h1 className="sr-only">{heading}</h1>

      {/* ---------- top bar ---------- */}
      <header className={`${s.top} ${s.chrome}`}>
        <div className={s.topLeft}>
          {view === 'break' && <span className={s.phasePill}>{isLong ? 'Long tea break' : 'Tea break'}</span>}
          <CycleDots total={every} filled={cycle.filled} current={cycle.current} label={cycle.label} />
        </div>
        <div className={s.topRight}>
          {view !== 'over' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name={amb.icon} size={20} />}
              onClick={() => setAmbOpen(true)}
              aria-label={`Ambience: ${amb.label}. Change`}
              aria-haspopup="dialog"
              sfx="whoosh"
            >
              <span className={s.ambLabel}>{amb.label}</span>
            </Button>
          )}
          {view === 'over' ? (
            <IconButton variant="secondary" size="sm" label="Close" icon={<Icon name="close" size={20} />} onClick={leaveBreakOver} />
          ) : (
            <IconButton
              variant="secondary"
              size="sm"
              sfx={false}
              label={muted ? 'Turn sound on' : 'Mute sounds'}
              aria-pressed={muted}
              icon={<Icon name={muted ? 'mute' : 'sound'} size={20} />}
              onClick={toggleMute}
            />
          )}
        </div>
      </header>

      {/* ---------- the nook ---------- */}
      <motion.div
        className={s.scene}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduced ? { duration: 0.2 } : spring.gentle}
      >
        <div className={s.nookBox}>
          <Nook
            mode={nookMode}
            progress={view === 'whistle' ? 1 : tv.progress}
            whistling={view === 'whistle'}
            weather={weatherFor(ambient)}
            timeOfDay="auto"
            items={items}
            paused={paused}
            className={s.nook}
          />
        </div>
        <AnimatePresence>
          {paused && (
            <motion.div key="veil" className={s.veil} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <span className={s.veilPill}>
                <Icon name="pause" size={18} /> Paused
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ---------- panel ---------- */}
      <main className={s.panel}>
        <AnimatePresence mode="wait" initial={false}>
          {view === 'over' ? (
            <motion.div
              key="over"
              className={s.over}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={reduced ? { duration: 0.2 } : spring.cozy}
            >
              <div className={s.overChai}>
                <Mascot pose="wave" size={132} animate={!reduced} />
              </div>
              <h2 className={s.overTitle}>Break’s over</h2>
              <p className={s.overSub}>
                {breakOver?.whileAway ? 'Your tea break ended while you were away. ' : ''}
                {t.intention ? (
                  <>
                    Ready for another brew of <strong>{t.intention}</strong>?
                  </>
                ) : (
                  'Ready for another brew?'
                )}
              </p>
              <div className={s.overActions}>
                <Button block size="lg" sfx="start" icon={<Icon name="play" size={24} />} onClick={startNextBrew}>
                  Put the kettle on
                </Button>
                <Button block variant="ghost" onClick={leaveBreakOver}>
                  Done for now
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={view === 'break' ? 'break' : 'focus'}
              className={s.panelInner}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: reduced ? 0.2 : 0.35, ease: ease.out }}
            >
              {view === 'break' ? (
                <div className={s.breakHead}>
                  <div className={s.breakChai}>
                    <Mascot pose="sip" size={84} animate={!reduced} />
                  </div>
                  <div className={s.breakText}>
                    <h2 className={s.breakTitle}>{isLong ? 'Long tea break' : 'Tea time'}</h2>
                    <p className={s.breakSub}>{isLong ? `${every} brews done. Put your feet up.` : 'Stretch, sip, look out the window.'}</p>
                  </div>
                  <IconButton
                    variant={paused ? 'sky' : 'secondary'}
                    size="sm"
                    sfx={false}
                    label={paused ? 'Resume break' : 'Pause break'}
                    icon={<Icon name={paused ? 'play' : 'pause'} size={20} />}
                    onClick={toggle}
                  />
                </div>
              ) : (
                <div className={`${s.intention} ${s.chrome}`}>
                  <span className={s.intentionText}>{t.intention || 'Focus time'}</span>
                  {t.tag && <TagChip tag={t.tag} />}
                </div>
              )}

              {/* dial */}
              <div className={s.dialWrap} ref={dialRef}>
                <TimerRing value={view === 'whistle' ? 1 : undefined} thickness={view === 'break' ? 6 : 7} className={s.dial}>
                  <div className={s.dialInner}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {view === 'whistle' ? (
                        <motion.span
                          key="done"
                          className={s.whistleChai}
                          initial={reduced ? { opacity: 0 } : { opacity: 0, y: '45%', scale: 0.55 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={reduced ? { duration: 0.2 } : { ...spring.joyful, stiffness: 520 }}
                        >
                          <Mascot pose="cheer" size={200} animate={!reduced} />
                        </motion.span>
                      ) : (
                        <motion.span key="clock" className={s.clock} exit={{ opacity: 0, scale: 0.8 }}>
                          <Digits value={clockText} roll={false} label={null} className={clockText.length > 5 ? s.digitsLong : s.digits} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span
                      className={view === 'whistle' ? `${s.status} ${s.statusDone}` : s.status}
                      role="timer"
                      aria-label={view === 'whistle' ? 'Done' : `${spokenDuration(tv.remainingMs)} left`}
                    >
                      {status}
                    </span>
                  </div>
                </TimerRing>
                <AnimatePresence>
                  {bumps.map((b) => (
                    <motion.span
                      key={b}
                      className={s.bump}
                      aria-hidden="true"
                      initial={{ opacity: 0, y: 8, scale: 0.8 }}
                      animate={{ opacity: [0, 1, 1, 0], y: reduced ? 0 : -36, scale: 1 }}
                      transition={{ duration: 1.3, ease: ease.out }}
                      onAnimationComplete={() => setBumps((x) => x.filter((v) => v !== b))}
                    >
                      +5 min
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              {view === 'break' && <BreakIdeas long={isLong} reduced={reduced} seed={t.completedInCycle} />}

              {/* controls */}
              {view === 'break' ? (
                <div className={s.breakActions}>
                  <Button variant="secondary" sfx="cancel" onClick={skipBreak} className={s.skipBtn}>
                    Skip break
                  </Button>
                  <Button sfx="start" onClick={startNextBrew} className={s.nextBtn}>
                    <span className={s.labelLong}>Start next brew</span>
                    <span className={s.labelShort}>Next brew</span>
                  </Button>
                </div>
              ) : (
                <div className={`${s.controls} ${view === 'whistle' ? s.controlsGone : ''}`}>
                  <RoundButton
                    size={60}
                    sfx="addTime"
                    label="Add 5 minutes"
                    caption="Add time"
                    icon={<span className={s.plusFive}>+5</span>}
                    onClick={addFive}
                    disabled={view !== 'focus'}
                  />
                  <RoundButton
                    ref={mainRef}
                    size={88}
                    sfx={false}
                    variant={paused ? 'primary' : 'secondary'}
                    label={paused ? 'Resume' : 'Pause'}
                    icon={<Icon name={paused ? 'play' : 'pause'} size={38} />}
                    onClick={toggle}
                    disabled={view !== 'focus'}
                    className={s.main}
                  />
                  <RoundButton
                    size={60}
                    sfx="whoosh"
                    label="End session"
                    caption="End"
                    icon={<Icon name="stop" size={24} />}
                    onClick={() => setEndOpen(true)}
                    disabled={view !== 'focus'}
                    aria-haspopup="dialog"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <p className={`${s.keys} ${s.chrome}`} aria-hidden="true">
          {view === 'focus' && (
            <>
              <Kbd>Space</Kbd> pause <span className={s.sep}>·</span> <Kbd>+</Kbd> 5 min <span className={s.sep}>·</span> <Kbd>Esc</Kbd> end
            </>
          )}
        </p>
      </main>

      {active && <TimerAnnouncer />}

      <EndSheet
        open={endOpen}
        focusedMs={focusedMs}
        onKeep={() => setEndOpen(false)}
        onEnd={() => {
          setEndOpen(false);
          endFocusEarly();
        }}
      />
      <AmbienceSheet open={ambOpen} onClose={() => setAmbOpen(false)} />
      {bloom && (
        <motion.div
          className={s.bloom}
          aria-hidden="true"
          initial={{ clipPath: `circle(${bloom.r}px at ${bloom.x}px ${bloom.y}px)`, opacity: 0.6 }}
          animate={{ clipPath: `circle(${bloom.R}px at ${bloom.x}px ${bloom.y}px)`, opacity: 1 }}
          transition={{ duration: 0.4, ease: ease.inOut }}
        />
      )}
    </div>
  );
  frozen.current = out;
  return out;
}

