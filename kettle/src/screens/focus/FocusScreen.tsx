/**
 * The session screen: Focus, the whistle, the summary and the tea break (#/focus and #/done). OWNER: core-loop area.
 *
 * One stage, one panel. The stage (./stage: the nook's window, the shared counter, the kettle that is the timer
 * and Chai) never moves between states, so nothing cross-fades or jumps and there is no empty hand-off; only
 * the kettle's state, Chai's pose and the panel beside/below it change.
 *
 * Views (derived, never stored):
 *   focus    — a brew running or paused          kettle run / paused   · reading Chai
 *   whistle  — the beat after a brew completes   kettle whistles       · cheering Chai (hops)
 *   summary  — #/done: the one summary           whistle, then rests   · cheering Chai
 *   break    — tea break (short or long)         kettle off the heat   · sipping Chai
 *   over     — a break ended, next brew not yet  kettle off the heat   · stretching Chai
 *   none     — nothing to show → home (or #/done when a summary is pending)
 *
 * Layouts: stacked (phone and tablet portrait: stage on top, panel below) and side by side (landscape phones,
 * tablets and desktop: stage left, panel right). Zen: chrome fades after 7 s idle.
 * Keys: Space pause/resume · Esc end sheet · + add 5 min · M mute.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TimerAnnouncer, elapsedActiveMs, useRemaining, useTimer } from '@/timer';
import { useShortcut } from '@/lib/shortcuts';
import { clock } from '@/lib/clock';
import { formatClock, spokenDuration } from '@/lib/format';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { ease } from '@/lib/motion';
import { audio } from '@/audio';
import { Icon } from '@/art';
import { Button, Digits, IconButton, Kbd } from '@/ui';
import { useProgress, useUnlockedItems } from '@/progress';
import { useSettings } from '@/state/settings';
import { getRoute, navigate, useRoute } from '@/app/router';
import { carriedFrom, setIntentionOutcome } from '@/app/intention';
import { endFocusEarly, leaveBreakOver, skipBreak, startNextBrew, useFlow } from '@/app/flow';
import { Summary } from '@/screens/done/Summary';
import { Stage } from './stage/Stage';
import type { KettleState } from './stage/Kettle';
import type { PaintedPose } from '@/art';
import { RoundButton } from './parts/RoundButton';
import { EndSheet } from './parts/EndSheet';
import { AmbienceSheet } from './parts/AmbienceSheet';
import { CycleDots } from './parts/bits';
import { TAG_BY_ID } from '@/state/tags';
import { ambientOption, weatherFor } from './parts/ambience';
import { useZen } from './parts/hooks';
import { BreakIdeas } from './break/BreakIdeas';
import { cycleInfo, focusMeta, focusStatus, wallClock, type View } from './cycle';
import s from './FocusScreen.module.css';

const FIVE_MIN = 5 * 60_000;
/** On the summary the kettle keeps whistling a moment, then comes off the heat. */
const SUMMARY_WHISTLE_MS = 1800;

const CHAI: Record<Exclude<View, 'none'>, PaintedPose> = {
  focus: 'reading',
  whistle: 'cheering',
  summary: 'cheering',
  break: 'sipping',
  over: 'stretch',
};

export default function FocusScreen() {
  const route = useRoute();
  const t = useTimer();
  const tv = useRemaining();
  const whistle = useFlow((f) => f.whistle);
  const breakOver = useFlow((f) => f.breakOver);
  const hasReport = useProgress((p) => p.lastReport != null);
  const lastMs = useProgress((p) => p.lastReport?.record.focusedMs ?? null);
  const sessions = useProgress((p) => p.sessions);
  // Items this brew just unlocked stay out of the room until the summary reveals them.
  const unlocked = useUnlockedItems();
  const unrevealed = useProgress((p) => p.lastReport?.level?.unlocked);
  const reduced = useReducedMotion();
  const ambient = useSettings((st) => st.ambient);
  const muted = useSettings((st) => st.muted);
  const every = useSettings((st) => Math.max(1, st.longBreakEvery));
  const shortMin = useSettings((st) => st.shortBreakMin);
  const longMin = useSettings((st) => st.longBreakMin);
  const setSettings = useSettings((st) => st.set);

  const [endOpen, setEndOpen] = useState(false);
  const [ambOpen, setAmbOpen] = useState(false);
  const [added, setAdded] = useState<{ at: number; whistleAt: number } | null>(null);
  const mainRef = useRef<HTMLButtonElement>(null);
  const frozen = useRef<ReactNode>(null);

  const view: View =
    route === '/done'
      ? 'summary'
      : t.status !== 'idle'
        ? t.phase === 'focus'
          ? 'focus'
          : 'break'
        : whistle
          ? 'whistle'
          : breakOver
            ? 'over'
            : 'none';
  // Break's over: the words the next brew would reuse, if they're the last brew's (so they can be crossed off).
  const carriedRec = view === 'over' ? carriedFrom(sessions, t.intention) : null;
  const items = useMemo(
    () => (view === 'whistle' && unrevealed?.length ? unlocked.filter((id) => !unrevealed.includes(id)) : unlocked),
    [view, unlocked, unrevealed],
  );
  const paused = t.status === 'paused';
  const isLong = (view === 'break' && t.phase === 'longBreak') || (view === 'over' && breakOver?.phase === 'longBreak');
  const sheetOpen = endOpen || ambOpen;
  const zen = useZen(view === 'focus' && !paused && !sheetOpen);

  // Nothing to show here → the summary if one is pending, else home. Only while this is still the current
  // route: as the outgoing layer of a route change, the user has already chosen where to go.
  useEffect(() => {
    if (view === 'none' && getRoute() === '/focus') navigate(hasReport ? '/done' : '/', { replace: true });
  }, [view, hasReport]);

  // The summary: the kettle whistles on a moment, then comes off the heat.
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    if (view !== 'summary') {
      setCalm(false);
      return;
    }
    const id = setTimeout(() => setCalm(true), reduced ? 0 : SUMMARY_WHISTLE_MS);
    return () => clearTimeout(id);
  }, [view, reduced]);

  // Close the end sheet if the phase changes under it, and the ambience sheet on any change.
  useEffect(() => {
    if (view !== 'focus') setEndOpen(false);
    setAmbOpen(false);
  }, [view]);

  // "+5 min · whistles at …" shows for a moment after adding time.
  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(null), 3200);
    return () => clearTimeout(id);
  }, [added]);
  useEffect(() => {
    if (view !== 'focus') setAdded(null);
  }, [view]);

  // Ambience: during a brew the audio session owns it (fade in, pause dip, simmer, fade out) —
  // this screen only asks for it on tea breaks and for quiet around the whistle, the summary and break-over.
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
    const now = clock.now();
    const after = useTimer.getState();
    const left = Math.max(0, after.plannedMs - elapsedActiveMs(after, now));
    setAdded({ at: now, whistleAt: now + left });
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

  // While this screen is the *outgoing* layer of a route change the session has already ended (view 'none'):
  // keep showing the last frame instead of an empty page.
  if (view === 'none') return frozen.current ?? <div className={s.screen} data-view="none" data-focus-view="none" />;

  const amb = ambientOption(ambient);
  const cycle = cycleInfo(view, t.completedInCycle, every, isLong);
  const breakMin = isLong ? longMin : shortMin;
  const kettle: KettleState =
    view === 'focus' ? (paused ? 'paused' : 'run') : view === 'whistle' || (view === 'summary' && !calm) ? 'whistle' : 'rest';
  const addedFrom = t.plannedMs > 0 && view === 'focus' ? Math.min(1, Math.max(0, (t.plannedMs - (t.addedMs ?? 0)) / t.plannedMs)) : 1;
  const heading =
    view === 'break'
      ? isLong
        ? 'Long tea break'
        : 'Tea break'
      : view === 'over'
        ? 'Break’s over'
        : view === 'whistle'
          ? 'Tea’s ready'
          : t.intention
            ? `Brewing: ${t.intention}`
            : 'Focus session';
  const intention = view === 'focus' || view === 'whistle' ? t.intention : '';

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
      {view !== 'summary' && <h1 className="sr-only">{heading}</h1>}

      {/* ---------- the stage: never moves ---------- */}
      <div className={s.stageBox}>
        <Stage
          className={s.stage}
          state={kettle}
          progress={view === 'focus' ? tv.progress : 1}
          addedFrom={addedFrom}
          chai={CHAI[view]}
          items={items}
          weather={weatherFor(ambient)}
          reduced={reduced}
        />
      </div>

      {/* ---------- top bar ---------- */}
      {view !== 'summary' && (
        <header className={`${s.top} ${s.chrome}`}>
          <div className={s.topLeft} data-has-chip={intention || view === 'break' ? '' : undefined}>
            {view === 'break' ? (
              <span className={s.chip} data-tone="sky">
                <Icon name="mug" size={18} />
                <span className={s.chipText}>
                  {isLong ? 'Long tea break' : 'Tea break'} <span className={s.chipSub}>· {breakMin} min</span>
                </span>
              </span>
            ) : intention ? (
              <span className={s.chip}>
                <Icon name="edit" size={16} />
                <span className={s.chipText}>
                  {intention}
                  {t.tag && <span className={s.chipSub}> · {TAG_BY_ID[t.tag]?.label}</span>}
                </span>
              </span>
            ) : null}
            <span className={`${s.dots} ${s.dotsTop}`}>
              <CycleDots total={every} filled={cycle.filled} current={cycle.current} label={cycle.label} />
            </span>
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
                className={s.topBtn}
              >
                <span className={s.ambLabel}>{amb.label}</span>
              </Button>
            )}
            {view === 'over' ? (
              <IconButton variant="secondary" size="sm" label="Close" icon={<Icon name="close" size={20} />} onClick={leaveBreakOver} className={s.topBtn} />
            ) : (
              <IconButton
                variant="secondary"
                size="sm"
                sfx={false}
                label={muted ? 'Turn sound on' : 'Mute sounds'}
                aria-pressed={muted}
                icon={<Icon name={muted ? 'mute' : 'sound'} size={20} />}
                onClick={toggleMute}
                className={s.topBtn}
              />
            )}
          </div>
        </header>
      )}

      {/* ---------- panel ---------- */}
      <main className={s.panel}>
        <AnimatePresence mode="wait" initial={false}>
          {view === 'summary' ? (
            <motion.div
              key="summary"
              className={s.summaryBox}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={reduced ? { duration: 0.2 } : { duration: 0.42, ease: ease.out }}
            >
              <Summary reduced={reduced} />
            </motion.div>
          ) : view === 'over' ? (
            <motion.div
              key="over"
              className={s.over}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: reduced ? 0.2 : 0.35, ease: ease.out }}
            >
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
              {carriedRec && (
                <button type="button" className={s.overMark} onClick={() => setIntentionOutcome(carriedRec, 'done')}>
                  <Icon name="check" size={18} /> Mark it done, start fresh
                </button>
              )}
              <div className={s.overActions}>
                <Button block size="lg" sfx="start" icon={<Icon name="play" size={24} />} onClick={startNextBrew}>
                  Put the kettle on
                </Button>
                <Button block variant="ghost" onClick={leaveBreakOver}>
                  That’s all for now
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={view === 'break' ? 'break' : 'timer'}
              className={s.timer}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              // From the whistle the summary takes the panel at once: no fading-out beat in between.
              exit={{ opacity: 0, transition: { duration: view === 'whistle' ? 0 : 0.12 } }}
              transition={{ duration: reduced ? 0.2 : 0.35, ease: ease.out }}
            >
              <Readout
                view={view}
                paused={paused}
                isLong={isLong}
                tv={tv}
                plannedMs={t.plannedMs}
                addedMs={t.addedMs ?? 0}
                brewedMs={view === 'whistle' ? (lastMs ?? t.plannedMs) : view === 'focus' ? elapsedActiveMs(useTimer.getState(), clock.now()) : 0}
                added={added}
                reduced={reduced}
              />

              {view === 'break' ? (
                <>
                  <div className={s.controls}>
                    <RoundButton size={60} sfx="cancel" label="Skip break" icon={<Icon name="close" size={24} />} onClick={skipBreak} />
                    <RoundButton
                      ref={mainRef}
                      size={76}
                      sfx={false}
                      variant={paused ? 'sky' : 'secondary'}
                      label={paused ? 'Resume break' : 'Pause break'}
                      caption={paused ? 'Resume' : 'Pause'}
                      icon={<Icon name={paused ? 'play' : 'pause'} size={32} />}
                      onClick={toggle}
                      className={s.main}
                    />
                    <RoundButton size={60} sfx="start" label="Start next brew" caption="Next brew" icon={<Icon name="play" size={24} />} onClick={startNextBrew} />
                  </div>
                  <div className={s.ideas}>
                    <BreakIdeas long={isLong} reduced={reduced} seed={t.completedInCycle} />
                  </div>
                </>
              ) : (
                <div className={`${s.controls} ${view === 'whistle' ? s.controlsGone : ''}`} aria-hidden={view === 'whistle' || undefined}>
                  <RoundButton
                    size={60}
                    sfx="addTime"
                    label="Add 5 minutes"
                    caption={t.addedMs ? 'Add 5 more' : 'Add 5'}
                    icon={<Icon name="plus" size={26} />}
                    onClick={addFive}
                    disabled={view !== 'focus'}
                  />
                  <RoundButton
                    ref={mainRef}
                    size={76}
                    sfx={false}
                    variant={paused ? 'primary' : 'secondary'}
                    label={paused ? 'Resume' : 'Pause'}
                    icon={<Icon name={paused ? 'play' : 'pause'} size={32} />}
                    onClick={toggle}
                    disabled={view !== 'focus'}
                    className={s.main}
                  />
                  <RoundButton
                    size={60}
                    sfx="whoosh"
                    label="End session"
                    caption="End"
                    icon={<Icon name="stop" size={22} />}
                    onClick={() => setEndOpen(true)}
                    disabled={view !== 'focus'}
                    aria-haspopup="dialog"
                  />
                </div>
              )}
              <span className={`${s.dotsPanel} ${s.chrome}`}>
                <CycleDots total={every} filled={cycle.filled} current={cycle.current} label={cycle.label} />
              </span>
              <p className={`${s.keys} ${s.chrome}`} aria-hidden="true">
                {view === 'focus' && (
                  <>
                    <Kbd>Space</Kbd> pause <span className={s.sep}>·</span> <Kbd>+</Kbd> 5 min <span className={s.sep}>·</span> <Kbd>Esc</Kbd> end
                  </>
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
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
    </div>
  );
  frozen.current = out;
  return out;
}

/** The countdown — the exact time reference — with one line of status and one of context. */
function Readout({
  view,
  paused,
  isLong,
  tv,
  plannedMs,
  addedMs,
  brewedMs,
  added,
  reduced,
}: {
  view: View;
  paused: boolean;
  isLong: boolean;
  tv: ReturnType<typeof useRemaining>;
  plannedMs: number;
  addedMs: number;
  brewedMs: number;
  added: { at: number; whistleAt: number } | null;
  reduced: boolean;
}) {
  const whistle = view === 'whistle';
  const brk = view === 'break';
  // "4:59", not "04:59": the countdown reads the same way in a brew and on a break.
  const clockText = whistle ? '0:00' : formatClock(tv.seconds * 1000).replace(/^0(?=\d:)/, '');
  const status = whistle
    ? 'Tea’s ready!'
    : brk
      ? paused
        ? 'Paused. The tea will keep.'
        : isLong
          ? 'Long tea break. Put your feet up.'
          : 'Tea time. Sip slowly.'
      : paused
        ? 'The kettle will wait.'
        : focusStatus(tv.progress, tv.remainingMs);
  const meta = whistle
    ? `${Math.max(1, Math.round(brewedMs / 60_000))} min brewed`
    : brk
      ? 'Next brew whenever you’re ready'
      : focusMeta({ brewedMs, remainingMs: tv.remainingMs, plannedMs, addedMs, paused, now: clock.now() });
  const flag = brk ? (
    paused ? (
      <span className={s.flag} data-tone="paused" key="paused">
        <Icon name="pause" size={14} /> Paused
      </span>
    ) : null
  ) : paused ? (
    <span className={s.flag} data-tone="paused" key="paused">
      <Icon name="pause" size={14} /> Paused
    </span>
  ) : added ? (
    <span className={s.flag} data-tone="honey" key={`add-${added.at}`}>
      <Icon name="plus" size={14} /> 5 min · whistles at {wallClock(added.whistleAt)} now
    </span>
  ) : null;
  return (
    <div className={s.readout}>
      <div className={s.flagSlot}>
        <AnimatePresence mode="popLayout" initial={false}>
          {flag && (
            <motion.span
              key={flag.key}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: ease.out }}
              style={{ display: 'inline-flex' }}
              role={added && !paused && !brk ? 'status' : undefined}
            >
              {flag}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className={s.clock}>
        <Digits value={clockText} roll={false} label={null} className={clockText.length > 5 ? s.digitsLong : s.digits} />
      </span>
      <span className={s.status} role="timer" aria-label={whistle ? 'Done. Tea’s ready' : `${spokenDuration(tv.remainingMs)} left`}>
        {status}
      </span>
      <span className={s.meta}>{meta}</span>
    </div>
  );
}
