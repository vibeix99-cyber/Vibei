/** "What are you brewing?" + tags + rhythm + the big start button (or a resume banner). */
import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { Icon } from '@/art';
import { navigate } from '@/app/router';
import { useSettings, type TagId, type RhythmId } from '@/state/settings';
import { useTimer, useRemaining, nextBreakKind } from '@/timer';
import { formatClock } from '@/lib/format';
import { useShortcut } from '@/lib/shortcuts';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { Button, Card, Chip, ChipGroup, InlineUndo, Ring, SegmentedControl, Sheet, NumberStepper, TextField } from '@/ui';
import { useDayKey, useProgress } from '@/progress';
import { carriedFrom, setIntentionOutcome } from '@/app/intention';
import type { SessionRecord } from '@/progress';
import { RHYTHM_OPTIONS, matchPreset } from './content';
import { TAGS } from '@/state/tags';
import s from './Home.module.css';

/**
 * Where the brew length sits. `dock`: portrait phones, inside the docked start, so the chosen length and the others are in
 * view from the first frame, never under the dock (Wave-1 follow-up #2). `top`: landscape phones, heading the composer
 * column (the dock there has no height to spare at 200 % text). `card`: tablets and desktop, in the composer card as before.
 */
export type LengthAt = 'card' | 'dock' | 'top';

export function Composer({ recent, lengthAt = 'card' }: { recent: string[]; lengthAt?: LengthAt }) {
  const intention = useTimer((t) => t.intention);
  const timerTag = useTimer((t) => t.tag);
  const setIntention = useTimer((t) => t.setIntention);
  const startFocus = useTimer((t) => t.startFocus);
  const lastTag = useSettings((st) => st.lastTag);
  const focusMin = useSettings((st) => st.focusMin);
  const shortBreakMin = useSettings((st) => st.shortBreakMin);
  const longBreakMin = useSettings((st) => st.longBreakMin);
  const completedInCycle = useTimer((t) => t.completedInCycle);
  const set = useSettings((st) => st.set);
  const longNext = nextBreakKind(completedInCycle + 1) === 'longBreak';
  const [text, setText] = useState(intention);
  const [tag, setTag] = useState<TagId | null>(timerTag ?? lastTag);
  const [inputFocus, setInputFocus] = useState(false);
  const typing = useRef(false);
  typing.current = inputFocus;

  // Follow changes made elsewhere (another tab, Done on the celebration) unless you're typing here.
  useEffect(() => {
    if (!typing.current) setText((cur) => (cur.trim() === intention.trim() ? cur : intention));
  }, [intention]);

  // Is the field holding the intention your last brew ended with? Then offer to cross it off.
  const sessions = useProgress((st) => st.sessions);
  const carried = carriedFrom(sessions, text);
  const inputRef = useRef<HTMLInputElement>(null);
  // Crossed off: the "Mark done" line turns into its Undo, in place (I10: Undo is inline, where the person acted).
  const [crossed, setCrossed] = useState<{ rec: SessionRecord; key: boolean } | null>(null);
  const markDone = (e: { currentTarget: HTMLElement }) => {
    if (!carried) return;
    // From the keyboard, focus moves to the Undo that takes the button's place; a tap leaves focus alone (a focused
    // field would open the phone's keyboard and its Recent list under the finger).
    const key = e.currentTarget.matches(':focus-visible');
    setIntentionOutcome(carried, 'done');
    setText('');
    setCrossed({ rec: carried, key });
  };
  const undoCrossed = () => {
    if (!crossed) return;
    setIntentionOutcome(crossed.rec, 'carried');
    setText(crossed.rec.intention);
    setCrossed(null);
    if (crossed.key) inputRef.current?.focus();
  };

  // Skipping is effortless across days too: yesterday's words only come back prefilled if you chose
  // Carry forward (they're still one tap away under Recent).
  const today = useDayKey();
  useEffect(() => {
    if (carried && carried.outcome !== 'carried' && carried.day !== today && useTimer.getState().status === 'idle') {
      setText('');
      setIntention('', tag);
    }
    // Only when Today opens (or the day turns), not while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  // Keep the timer's intention in sync (it's what Focus shows and records).
  useEffect(() => {
    const id = setTimeout(() => setIntention(text, tag), 150);
    return () => clearTimeout(id);
  }, [text, tag, setIntention]);

  const start = () => {
    const trimmed = text.trim();
    setIntention(trimmed, tag);
    set({ lastTag: tag });
    startFocus({ intention: trimmed, tag });
  };

  // Enter anywhere on Today (not while typing in another field / on a button) puts the kettle on.
  useShortcut('Enter', () => start());

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      start();
    }
  };

  const fieldRef = useRef<HTMLDivElement>(null);
  const showRecent = inputFocus && !text.trim() && recent.length > 0;
  const onFieldBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!fieldRef.current?.contains(e.relatedTarget as Node | null)) setInputFocus(false);
  };

  const reduced = useReducedMotion();
  /** Put focus on the chosen length; outside the dock, bring the brew length into view (clear of the dock) first. */
  const showLength = () => {
    const box = document.getElementById('home-brew-length');
    if (!box) return;
    if (lengthAt !== 'dock') box.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    (box.querySelector<HTMLElement>('[role=radio][aria-checked=true]') ?? box.querySelector<HTMLElement>('[role=radio]'))?.focus({ preventScroll: true });
  };

  // The page scrolls a focused control clear of the dock (scroll-padding in Home.module.css): tell it the dock's height,
  // which grows with the text size (and, on phones, carries the brew length).
  const dockRef = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);
  useLayoutEffect(() => {
    const el = dockRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const put = () => {
      const h = el.getBoundingClientRect().height;
      root.style.setProperty('--home-dock-h', `${Math.ceil(h)}px`);
      // A landscape phone at large text: the start and its note wrap into a dock taller than most of the screen, which
      // would sit over the brew length at the column's head (667×375 @200 %: 339 of 375 px). Then the dock stays in the
      // page flow, right under the composer, instead of over it (W2H-D1: every length in view from the first frame).
      setTall(lengthAt === 'top' && h > innerHeight * 0.6);
    };
    put();
    const ro = new ResizeObserver(put);
    ro.observe(el);
    addEventListener('resize', put);
    return () => {
      ro.disconnect();
      removeEventListener('resize', put);
      root.style.removeProperty('--home-dock-h');
    };
  }, [lengthAt]);

  const length = <RhythmPicker at={lengthAt} />;
  return (
    <>
    {lengthAt === 'top' && length}
    <section className={s.composer} aria-labelledby="home-brew">
      <Card className={s.composerCard}>
        <div className={s.composerHead}>
          <h2 id="home-brew" className={s.cardTitle}>
            What are you brewing? <span className={s.optional}>(optional)</span>
          </h2>
        </div>
        <div
          ref={fieldRef}
          className={s.field}
          // The field itself taking focus opens Recent (not "Mark done" or its Undo taking it: that would slide Recent
          // in above the Undo, under the finger).
          onFocus={(e) => e.target === inputRef.current && setInputFocus(true)}
          onBlur={onFieldBlur}
        >
          <TextField
            ref={inputRef}
            label="What are you brewing? (optional)"
            hideLabel
            placeholder="e.g. Chapter 3 notes, or leave it blank"
            value={text}
            maxLength={80}
            autoComplete="off"
            enterKeyHint="go"
            onChange={setText}
            clearable
            onKeyDown={onKey}
          />
          {showRecent && (
            <div className={s.recent} role="group" aria-label="Recent intentions">
              <span className={s.recentLabel} aria-hidden>
                Recent
              </span>
              {recent.map((r) => (
                <Chip
                  key={r}
                  size="sm"
                  icon="refresh"
                  className={s.recentChip}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setText(r);
                    setInputFocus(false);
                  }}
                >
                  {r}
                </Chip>
              ))}
            </div>
          )}
          {crossed ? (
            <InlineUndo
              as="p"
              className={s.carried}
              message="Crossed off. Nice work."
              icon="check"
              tone="matcha"
              focus={crossed.key}
              undoLabel={`Undo: put “${crossed.rec.intention}” back`}
              compact
              buttonClassName={s.linkBtn}
              onUndo={undoCrossed}
              onExpire={() => setCrossed(null)}
              data-undo-for="mark-done"
            />
          ) : carried && !showRecent && (
            <p className={s.carried}>
              <Icon name="refresh" size={16} />
              <span>Carried from your last brew</span>
              <button type="button" className={s.linkBtn} onClick={markDone} aria-label={`Mark “${carried.intention}” done`}>
                Mark done
              </button>
            </p>
          )}
        </div>
        <ChipGroup<TagId>
          label="Tag"
          allowEmpty
          value={tag}
          onChange={setTag}
          className={s.tagGroup}
          options={TAGS.map((o) => ({ value: o.id, label: o.label, icon: o.icon, tone: o.tone }))}
        />
        {lengthAt === 'card' && length}
      </Card>
    </section>
    {/* Docked: on short or landscape screens it sticks above the tab bar so the main action is never below the fold.
        On portrait phones the brew length rides in it, right above the start it sets. */}
    <div ref={dockRef} className={s.ctaDock} data-length={lengthAt === 'dock' ? '' : undefined} data-tall={tall ? '' : undefined}>
      {lengthAt === 'dock' && length}
      <Button size="lg" block sfx="start" className={s.cta} onClick={start} icon={<Icon name="play" size={22} />}>
        Put the kettle on · {focusMin} min
      </Button>
      <p className={s.ctaNote}>
        {longNext ? `Then a long tea break, ${longBreakMin} min. You’ve earned it.` : `Then a ${shortBreakMin} min tea break.`}{' '}
        {/* Phones: moves focus to the chosen length (in this dock on portrait phones; at the column's head in landscape). */}
        <button type="button" className={`${s.linkBtn} ${s.lengthLink}`} onClick={showLength}>
          Change brew length
        </button>
      </p>
    </div>
    </>
  );
}

function RhythmPicker({ at = 'card' }: { at?: LengthAt }) {
  const rhythm = useSettings((st) => st.rhythm);
  const focusMin = useSettings((st) => st.focusMin);
  const shortBreakMin = useSettings((st) => st.shortBreakMin);
  const applyRhythm = useSettings((st) => st.applyRhythm);
  const [customOpen, setCustomOpen] = useState(false);
  const customMin = rhythm === 'custom' ? focusMin : null;
  // Minutes first: this row chooses how long the brew is (the rhythm's name is the small print, left out on phones: there
  // the options are 44 px tall, so the row fits the dock, or the column's head, at 200 % text too).
  const named = at === 'card';
  const options = [
    ...[...RHYTHM_OPTIONS].sort((a, b) => a.focusMin - b.focusMin).map((r) => ({ value: r.id as RhythmId, label: `${r.focusMin} min`, sublabel: named ? r.label : undefined })),
    { value: 'custom' as RhythmId, label: customMin ? `${customMin} min` : 'Custom', sublabel: customMin ? 'Custom' : named ? 'Set it' : undefined },
  ];
  return (
    <div className={s.rhythm} id="home-brew-length" data-at={at}>
      {/* In the dock the options sit on the start they set ("Put the kettle on · 25 min"); the group keeps its name. */}
      {at !== 'dock' && (
        <p className={s.rhythmLabel} aria-hidden="true">
          Brew length
        </p>
      )}
      <SegmentedControl<RhythmId>
        label="Brew length"
        options={options}
        value={rhythm}
        className={s.rhythmSeg}
        onChange={(v) => {
          if (v === 'custom') setCustomOpen(true);
          else applyRhythm(v);
        }}
      />
      {rhythm === 'custom' && (
        <p className={s.customNote}>
          {focusMin} min brew · {shortBreakMin} min tea break
          <button type="button" className={s.linkBtn} onClick={() => setCustomOpen(true)}>
            Edit
          </button>
        </p>
      )}
      <CustomRhythmSheet open={customOpen} onClose={() => setCustomOpen(false)} />
    </div>
  );
}

function CustomRhythmSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const st = useSettings();
  const [focus, setFocus] = useState(st.focusMin);
  const [brk, setBrk] = useState(st.shortBreakMin);
  useEffect(() => {
    if (open) {
      setFocus(st.focusMin);
      setBrk(st.shortBreakMin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const save = () => {
    const patch = { focusMin: focus, shortBreakMin: brk };
    const preset = matchPreset({ ...st, ...patch });
    st.set({ ...patch, rhythm: preset ?? 'custom' });
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Your own rhythm"
      description="Brew and rest for as long as suits you."
      footer={
        <div className={s.sheetActions}>
          <Button block variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button block onClick={save}>
            Use {focus}/{brk} min
          </Button>
        </div>
      }
    >
      <div className={s.sheetBody}>
        <div className={s.customRows}>
          <div className={s.customRow}>
            <span className={s.customLabel}>Brew</span>
            <NumberStepper label="Brew length" hideLabel unit="min" value={focus} min={5} max={120} step={5} onChange={setFocus} />
          </div>
          <div className={s.customRow}>
            <span className={s.customLabel}>Tea break</span>
            <NumberStepper label="Tea break length" hideLabel unit="min" value={brk} min={1} max={30} step={1} onChange={setBrk} />
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** Shown instead of the composer while a brew or break is running or paused. */
export function ResumeBanner() {
  const status = useTimer((t) => t.status);
  const phase = useTimer((t) => t.phase);
  const intention = useTimer((t) => t.intention);
  const { remainingMs, progress } = useRemaining(1000);
  const onBreak = phase !== 'focus';
  const paused = status === 'paused';
  const title = onBreak ? (paused ? 'Tea break, paused' : 'Tea time') : paused ? 'Your kettle’s paused' : 'Your kettle’s on';
  return (
    <Card as="section" tone={onBreak ? 'sky' : 'persimmon'} className={s.resume} aria-labelledby="home-resume">
      <div className={s.resumeTop}>
        <Ring value={progress} size={64} thickness={7} tone={onBreak ? 'sky' : 'persimmon'} label={`${Math.round(progress * 100)}% ${onBreak ? 'of your tea break' : 'brewed'}`}>
          <Icon name={onBreak ? 'cup' : paused ? 'pause' : 'kettle'} size={28} />
        </Ring>
        <div className={s.resumeText}>
          <h2 id="home-resume" className={s.resumeTitle}>
            {title}
          </h2>
          <p className={s.resumeMeta}>
            <span className={s.resumeTime}>{formatClock(remainingMs)}</span> left{!onBreak && intention ? ` · ${intention}` : ''}
          </p>
        </div>
      </div>
      <Button block size="lg" variant={onBreak ? 'sky' : 'primary'} icon={onBreak ? 'mug' : 'play'} onClick={() => navigate('/focus')}>
        {onBreak ? 'Back to tea' : 'Back to your brew'}
      </Button>
    </Card>
  );
}
