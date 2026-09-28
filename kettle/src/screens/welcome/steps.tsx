/** Onboarding step bodies (options only — Chai's question lives in WelcomeScreen). */
import { useId, type ReactNode } from 'react';
import { Icon, GoalVessel, Logo, NotifySpot, RhythmSpot } from '@/art';
import type { AmbientKind, RhythmId } from '@/state/settings';
import { TextField } from '@/ui';
import { RhythmArt } from '@/screens/home/art';
import { AMBIENT_OPTIONS, GOAL_OPTIONS, RHYTHM_OPTIONS, goalName } from '@/screens/home/content';
import { notificationCopy, type NotificationStatus as NotifyStatus } from '@/timer/notify';
import s from './Welcome.module.css';

/* ---------- Radio card list (native radios: arrow keys + SR semantics for free) ---------- */
function RadioCards<T extends string | number>({
  label,
  name,
  value,
  onChange,
  options,
  layout = 'list',
}: {
  label: string;
  name: string;
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; content: ReactNode }[];
  layout?: 'list' | 'grid';
}) {
  return (
    <fieldset className={s.fieldset}>
      <legend className="sr-only">{label}</legend>
      <div className={layout === 'grid' ? s.optGrid : s.optList}>
        {options.map((o) => (
          <label key={String(o.value)} className={s.opt} data-checked={o.value === value || undefined}>
            <input
              type="radio"
              className={s.optInput}
              name={name}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {o.content}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function NameStep({ name, setName }: { name: string; setName: (v: string) => void }) {
  return (
    <div className={s.nameWrap}>
      <TextField
        label="Your name"
        hideLabel
        placeholder="Your name"
        value={name}
        maxLength={32}
        autoComplete="given-name"
        autoCapitalize="words"
        enterKeyHint="next"
        autoFocus
        onChange={setName}
        size="lg"
        hint="Optional. It’s only for saying hello, and it never leaves this device."
      />
    </div>
  );
}

const GOAL_REACTION: Record<number, string> = {
  15: 'A sip a day. Small and steady wins.',
  30: 'A cup a day. Lovely and steady.',
  60: 'A pot a day. Proper brewing.',
  120: 'A whole kettle. Big days ahead, and I’ll be right here.',
};

export function GoalStep({ value, onChange, focusMin }: { value: number | null; onChange: (v: number) => void; focusMin: number }) {
  const brews = value ? Math.max(1, Math.round(value / Math.max(1, focusMin))) : 0;
  return (
    <>
    <RadioCards
      label="Daily goal"
      name="goal"
      value={value}
      onChange={onChange}
      options={GOAL_OPTIONS.map((g) => ({
        value: g.min,
        content: (
          <span className={s.goalOpt}>
            <GoalVessel kind={g.art} size={60} className={s.optArt} />
            <span className={s.optText}>
              <span className={s.optTitle}>{g.label}</span>
              <span className={s.optSub}>{g.blurb}</span>
            </span>
            <span className={s.optRight}>{g.min} min</span>
          </span>
        ),
      }))}
    />
      <p className={s.reaction} aria-live="polite">
        {value != null ? (
          <>
            <strong>{GOAL_REACTION[value] ?? `${goalName(value)} it is.`}</strong> That’s about {brews === 1 ? 'one brew' : `${brews} brews`} a day. Change it anytime.
          </>
        ) : (
          'You can change this anytime in Settings.'
        )}
      </p>
    </>
  );
}

export function RhythmStep({ value, onChange }: { value: RhythmId | null; onChange: (v: RhythmId) => void }) {
  return (
    <RadioCards
      label="Rhythm"
      name="rhythm"
      value={value}
      onChange={onChange}
      options={RHYTHM_OPTIONS.map((r) => ({
        value: r.id,
        content: (
          <span className={s.rhythmOpt}>
            <RhythmSpot rhythm={r.id} size={64} className={s.rhythmSpot} />
            <span className={s.rhythmTop}>
              <span className={s.optTitle}>{r.label}</span>
              <span className={s.optRight}>
                {r.focusMin}
                <span className={s.slash}>/</span>
                {r.breakMin} min
              </span>
            </span>
            <RhythmArt focusMin={r.focusMin} breakMin={r.breakMin} scaleMin={60} className={s.rhythmBar} />
            <span className={s.rhythmLegend} aria-hidden>
              <span>
                <i className={s.dotFocus} /> {r.focusMin} min brew
              </span>
              <span>
                <i className={s.dotBreak} /> {r.breakMin} min tea break
              </span>
            </span>
            <span className={s.optSub}>{r.goodFor}</span>
          </span>
        ),
      }))}
    />
  );
}

export function AmbienceStep({
  value,
  onChange,
  playing,
}: {
  value: AmbientKind | null;
  onChange: (v: AmbientKind) => void;
  playing: AmbientKind | null;
}) {
  return (
    <>
      <RadioCards
        label="Background sound"
        name="ambience"
        layout="grid"
        value={value}
        onChange={onChange}
        options={AMBIENT_OPTIONS.map((a) => ({
          value: a.id,
          content: (
            <span className={s.ambOpt}>
              <span className={s.ambIcon} data-kind={a.id}>
                <Icon name={a.icon} size={30} />
              </span>
              <span className={s.ambLabel}>{a.label}</span>
              {playing === a.id && (
                <span className={s.eq} aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </span>
          ),
        }))}
      />
      <p className={s.note} aria-live="polite">
        <Icon name={value ? (AMBIENT_OPTIONS.find((a) => a.id === value)?.icon ?? 'sound') : 'sound'} size={20} />
        <span>{value ? AMBIENT_OPTIONS.find((a) => a.id === value)?.description : 'Tap a sound to hear a little preview. You can change it anytime.'}</span>
      </p>
    </>
  );
}

export function NotifyStep({ status, focusMin }: { status: NotifyStatus; focusMin: number }) {
  const id = useId();
  const copy = notificationCopy('focusDone', { focusedMs: focusMin * 60_000 });
  return (
    <div className={s.notify}>
      <NotifySpot size={132} className={s.notifySpot} />
      <div className={s.mockNote} aria-labelledby={id} role="img">
        <span id={id} className="sr-only">
          Example notification: {copy.title} {copy.body}
        </span>
        <span className={s.mockIcon}>
          <Logo variant="mark" size={30} animate={false} title="" />
        </span>
        <span className={s.mockText} aria-hidden>
          <span className={s.mockApp}>
            Kettle <span className={s.mockWhen}>now</span>
          </span>
          <span className={s.mockTitle}>{copy.title}</span>
          <span className={s.mockBody}>{copy.body}</span>
        </span>
      </div>
      <ul className={s.reasons}>
        <li>
          <span className={s.reasonIcon} data-tone="persimmon">
            <Icon name="bell" size={20} />
          </span>
          A gentle nudge when a brew or tea break ends, even in another tab.
        </li>
        <li>
          <span className={s.reasonIcon} data-tone="matcha">
            <Icon name="check" size={20} />
          </span>
          Only about your timer. Never spam, never guilt.
        </li>
      </ul>
      {status === 'denied' && (
        <p className={s.callout} role="status">
          Notifications are blocked in this browser. No problem: Kettle will still chime. You can allow them later in your browser’s site settings.
        </p>
      )}
      {status === 'unsupported' && (
        <p className={s.callout} role="status">
          This browser can’t show notifications, so Kettle will chime instead.
        </p>
      )}
      {status === 'granted' && (
        <p className={s.callout} data-tone="good" role="status">
          <Icon name="check" size={18} /> Nudges are on.
        </p>
      )}
    </div>
  );
}

export function ReadyStep({ goal, rhythm, ambient, notify }: { goal: number; rhythm: RhythmId; ambient: AmbientKind; notify: boolean }) {
  const r = RHYTHM_OPTIONS.find((x) => x.id === rhythm);
  const a = AMBIENT_OPTIONS.find((x) => x.id === ambient);
  return (
    <ul className={s.summary} aria-label="Your setup">
      <li>
        <span className={s.sumIcon} data-tone="persimmon">
          <Icon name="target" size={22} />
        </span>
        <span className={s.sumText}>
          <span className={s.sumLabel}>Daily goal</span>
          <span className={s.sumValue}>
            {goalName(goal)} · {goal} min
          </span>
        </span>
      </li>
      <li>
        <span className={s.sumIcon} data-tone="sky">
          <Icon name="clock" size={22} />
        </span>
        <span className={s.sumText}>
          <span className={s.sumLabel}>Rhythm</span>
          <span className={s.sumValue}>{r ? `${r.label} · ${r.focusMin}/${r.breakMin} min` : 'Custom'}</span>
        </span>
      </li>
      <li>
        <span className={s.sumIcon} data-tone="matcha">
          <Icon name={a?.icon ?? 'sound'} size={22} />
        </span>
        <span className={s.sumText}>
          <span className={s.sumLabel}>Sound</span>
          <span className={s.sumValue}>{a?.label ?? 'Just quiet'}</span>
        </span>
      </li>
      <li>
        <span className={s.sumIcon} data-tone="honey">
          <Icon name="bell" size={22} />
        </span>
        <span className={s.sumText}>
          <span className={s.sumLabel}>Nudges</span>
          <span className={s.sumValue}>{notify ? 'On' : 'Off for now'}</span>
        </span>
      </li>
    </ul>
  );
}
