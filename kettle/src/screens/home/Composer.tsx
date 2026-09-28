/** "What are you brewing?" + tags + rhythm + the big start button (or a resume banner). */
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { Icon } from '@/art';
import { navigate } from '@/app/router';
import { useSettings, type TagId, type RhythmId } from '@/state/settings';
import { useTimer, useRemaining, nextBreakKind } from '@/timer';
import { formatClock } from '@/lib/format';
import { useShortcut } from '@/lib/shortcuts';
import { Button, Card, Chip, ChipGroup, Ring, SegmentedControl, Sheet, NumberStepper, TextField } from '@/ui';
import { RHYTHM_OPTIONS, TAG_OPTIONS, matchPreset } from './content';
import s from './Home.module.css';

export function Composer({ recent }: { recent: string[] }) {
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

  const [inputFocus, setInputFocus] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const showRecent = inputFocus && !text.trim() && recent.length > 0;
  const onFieldBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!fieldRef.current?.contains(e.relatedTarget as Node | null)) setInputFocus(false);
  };

  return (
    <section className={s.composer} aria-labelledby="home-brew">
      <Card className={s.composerCard}>
        <h2 id="home-brew" className={s.cardTitle}>
          What are you brewing?
        </h2>
        <div ref={fieldRef} className={s.field} onFocus={() => setInputFocus(true)} onBlur={onFieldBlur}>
          <TextField
            label="What are you brewing?"
            hideLabel
            placeholder="e.g. Chapter 3 notes"
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
        </div>
        <ChipGroup<TagId>
          label="Tag"
          layout="scroll"
          allowEmpty
          value={tag}
          onChange={setTag}
          className={s.tagGroup}
          options={TAG_OPTIONS.map((o) => ({ value: o.id, label: o.label, icon: o.icon }))}
        />
        <RhythmPicker />
      </Card>
      <Button size="lg" block sfx="start" className={s.cta} onClick={start} icon={<Icon name="play" size={22} />}>
        Put the kettle on · {focusMin} min
      </Button>
      <p className={s.ctaNote}>{longNext ? `Then a long tea break, ${longBreakMin} min. You’ve earned it.` : `Then a ${shortBreakMin} min tea break.`}</p>
    </section>
  );
}

function RhythmPicker() {
  const rhythm = useSettings((st) => st.rhythm);
  const focusMin = useSettings((st) => st.focusMin);
  const shortBreakMin = useSettings((st) => st.shortBreakMin);
  const applyRhythm = useSettings((st) => st.applyRhythm);
  const [customOpen, setCustomOpen] = useState(false);
  const customMin = rhythm === 'custom' ? focusMin : null;
  const options = [
    ...RHYTHM_OPTIONS.map((r) => ({ value: r.id as RhythmId, label: r.label, sublabel: `${r.focusMin} min` })),
    { value: 'custom' as RhythmId, label: 'Custom', sublabel: customMin ? `${customMin} min` : 'Set it' },
  ];
  return (
    <div className={s.rhythm}>
      <SegmentedControl<RhythmId>
        label="Rhythm"
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
