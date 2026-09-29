/** Settings — grouped, instant, persisted. OWNER: home/onboarding/settings area. */
import { useEffect, useState } from 'react';
import { GoalVessel, Icon, Mascot } from '@/art';
import { useSettings, type RhythmId, type AmbientKind, type ThemePref, type MotionPref, type ScenePref } from '@/state/settings';
import { useLevel, useStreak } from '@/progress';
import { SHORTCUTS } from '@/lib/shortcuts';
import { notificationStatus, requestNotificationPermission, showTimerNotification, type NotificationStatus } from '@/timer/notify';
import { plural } from '@/lib/format';
import { Button, Card, ChipGroup, Kbd, ListGroup, ListRow, NumberStepper, Pill, SegmentedControl, TextField } from '@/ui';
import { AMBIENT_OPTIONS, GOAL_OPTIONS, RHYTHM_OPTIONS, matchPreset } from '@/screens/home/content';
import { useAmbientPreview } from '@/screens/home/shims/useAmbientPreview';
import { PadRow, StackRow, VolumeRow } from './rows';
import { DataSection } from './DataSection';
import { version } from '../../../package.json';
import s from './Settings.module.css';

const fmt = new Intl.NumberFormat();

export default function SettingsScreen() {
  return (
    <div className={s.screen}>
      <h1 className={s.title}>Settings</h1>
      <Profile />
      <RhythmGroup />
      <GoalGroup />
      <SoundGroup />
      <DeviceGroup />
      <AppearanceGroup />
      <DataSection />
      <ShortcutsGroup />
      <AboutGroup />
    </div>
  );
}

function Profile() {
  const name = useSettings((st) => st.name);
  const set = useSettings((st) => st.set);
  const level = useLevel();
  const streak = useStreak();
  return (
    <Card as="section" className={s.profile} aria-label="Profile">
      <span className={s.avatar} aria-hidden>
        <Mascot pose="wave" size={72} />
      </span>
      <div className={s.profileBody}>
        <TextField label="Your name" value={name} placeholder="Add your name" maxLength={32} autoComplete="given-name" onChange={(v) => set({ name: v })} onBlur={(e) => set({ name: e.target.value.trim() })} />
        <div className={s.profileMeta}>
          <Pill tone="honey" size="sm" icon="star">
            Level {level.level}
          </Pill>
          <Pill tone="matcha" size="sm" icon="leaf">
            {fmt.format(level.leaves)} leaves
          </Pill>
          <Pill tone="persimmon" size="sm" icon="mug">
            {plural(streak.current, 'day')} warm
          </Pill>
        </div>
      </div>
    </Card>
  );
}

function RhythmGroup() {
  const st = useSettings();
  const update = (patch: Partial<Pick<typeof st, 'focusMin' | 'shortBreakMin' | 'longBreakMin' | 'longBreakEvery'>>) => {
    const next = { focusMin: st.focusMin, shortBreakMin: st.shortBreakMin, longBreakMin: st.longBreakMin, longBreakEvery: st.longBreakEvery, ...patch };
    st.set({ ...patch, rhythm: matchPreset(next) ?? 'custom' });
  };
  return (
    <>
      <ListGroup title="Rhythm" footer="Pick a preset, or tweak any number to make it your own.">
        <StackRow title="Preset">
          <SegmentedControl<RhythmId>
            label="Rhythm preset"
            value={st.rhythm}
            onChange={(v) => {
              if (v === 'custom') st.set({ rhythm: 'custom' });
              else st.applyRhythm(v);
            }}
            options={[...RHYTHM_OPTIONS.map((r) => ({ value: r.id as RhythmId, label: r.label })), { value: 'custom' as RhythmId, label: 'Custom' }]}
          />
        </StackRow>
        <ListRow label="Brew" trailing={<NumberStepper label="Brew length" hideLabel unit="min" value={st.focusMin} min={5} max={120} step={5} onChange={(v) => update({ focusMin: v })} />} />
        <ListRow label="Tea break" trailing={<NumberStepper label="Tea break length" hideLabel unit="min" value={st.shortBreakMin} min={1} max={30} onChange={(v) => update({ shortBreakMin: v })} />} />
        <ListRow label="Long tea break" trailing={<NumberStepper label="Long tea break length" hideLabel unit="min" value={st.longBreakMin} min={5} max={60} step={5} onChange={(v) => update({ longBreakMin: v })} />} />
        <ListRow
          label="Long break after"
          trailing={<NumberStepper label="Brews before a long break" hideLabel value={st.longBreakEvery} min={2} max={8} unit="brews" onChange={(v) => update({ longBreakEvery: v })} />}
        />
      </ListGroup>
      <ListGroup title="Auto-start">
        <ListRow icon="mug" iconTone="sky" label="Tea breaks" description="When the kettle whistles, tea time begins on its own." toggle={{ checked: st.autoStartBreaks, onChange: (v) => st.set({ autoStartBreaks: v }) }} />
        <ListRow icon="play" iconTone="persimmon" label="Next brew" description="After tea, the next brew starts without a tap." toggle={{ checked: st.autoStartFocus, onChange: (v) => st.set({ autoStartFocus: v }) }} />
      </ListGroup>
    </>
  );
}

function GoalGroup() {
  const goal = useSettings((st) => st.dailyGoalMin);
  const set = useSettings((st) => st.set);
  const known = GOAL_OPTIONS.some((g) => g.min === goal);
  return (
    <ListGroup title="Daily goal" footer={known ? 'Your warm streak only needs one brew a day. The goal is just for you.' : `Custom goal: ${goal} min a day.`}>
      <PadRow>
        <ChipGroup<string>
          label="Daily goal"
          className={s.goalGrid}
          value={String(goal)}
          onChange={(v) => v && set({ dailyGoalMin: Number(v) })}
          options={GOAL_OPTIONS.map((g) => ({
            value: String(g.min),
            icon: <GoalVessel kind={g.art} size={36} backdrop={false} />,
            label: (
              <span className={s.goalChip}>
                <span>{g.label}</span>
                <span className={s.goalMin}>{g.min} min</span>
              </span>
            ),
          }))}
        />
      </PadRow>
    </ListGroup>
  );
}

function SoundGroup() {
  const st = useSettings();
  const { playing, preview } = useAmbientPreview();
  const current = AMBIENT_OPTIONS.find((a) => a.id === st.ambient);
  return (
    <ListGroup title="Sound">
      <ListRow icon={st.muted ? 'mute' : 'sound'} iconTone="honey" label="Sounds" description={st.muted ? 'Everything’s quiet.' : 'Effects, the kettle’s whistle and ambience.'} toggle={{ checked: !st.muted, onChange: (v) => st.set({ muted: !v }) }} />
      <VolumeRow title="Master volume" value={st.masterVolume} onChange={(v) => st.set({ masterVolume: v })} disabled={st.muted} />
      <VolumeRow title="Effects" value={st.sfxVolume} onChange={(v) => st.set({ sfxVolume: v })} disabled={st.muted} tone="honey" />
      <VolumeRow title="Ambience" value={st.ambientVolume} onChange={(v) => st.set({ ambientVolume: v })} disabled={st.muted} tone="sky" />
      <StackRow title="Brewing ambience" description={st.muted ? 'Turn sounds on to hear a preview.' : 'Tap one to hear a preview.'}>
        <ChipGroup<AmbientKind>
          label="Brewing ambience"
          value={st.ambient}
          onChange={(v) => {
            if (!v) return;
            st.set({ ambient: v });
            if (!st.muted) preview(v);
          }}
          options={AMBIENT_OPTIONS.map((a) => ({
            value: a.id,
            icon: playing === a.id ? <span className={s.eq} aria-hidden><i /><i /><i /></span> : a.icon,
            label: a.label,
          }))}
        />
        {current && <p className={s.ambDesc}>{current.description}</p>}
      </StackRow>
    </ListGroup>
  );
}

function useNotificationStatus(): [NotificationStatus, (s: NotificationStatus) => void] {
  const [status, setStatus] = useState<NotificationStatus>(() => notificationStatus());
  useEffect(() => {
    const refresh = () => setStatus(notificationStatus());
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return [status, setStatus];
}

function DeviceGroup() {
  const st = useSettings();
  const [status, setStatus] = useNotificationStatus();
  const [tested, setTested] = useState(false);
  const wakeSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const vibrateSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const notifOn = st.notifications && status === 'granted';
  const notifDesc =
    status === 'unsupported'
      ? 'This browser can’t show notifications. Kettle will chime instead.'
      : status === 'denied'
        ? 'Blocked in your browser settings.'
        : status === 'granted'
          ? notifOn
            ? 'On. I’ll nudge you when a brew or tea break ends.'
            : 'Off. Turn on for a nudge when the kettle whistles.'
          : 'A nudge when the kettle whistles. Your browser will ask first.';
  return (
    <ListGroup title="Notifications & device">
      <ListRow
        icon={status === 'denied' ? 'bellOff' : 'bell'}
        iconTone="persimmon"
        label="Nudges"
        description={notifDesc}
        toggle={{
          checked: notifOn,
          disabled: status === 'unsupported' || status === 'denied',
          onChange: async (v) => {
            if (!v) return st.set({ notifications: false });
            if (status === 'granted') return st.set({ notifications: true });
            const res = await requestNotificationPermission();
            setStatus(res);
            if (res === 'granted') st.set({ notifications: true });
          },
        }}
      />
      {status === 'denied' && (
        <p className={s.helpRow}>
          <strong>To turn nudges on:</strong> {deniedHelp()}
        </p>
      )}
      {notifOn && (
        <PadRow>
          <Button
            size="sm"
            variant="secondary"
            icon={<Icon name="bell" size={18} />}
            onClick={async () => {
              await showTimerNotification('focusDone', { focusedMs: st.focusMin * 60_000 });
              setTested(true);
            }}
          >
            {tested ? 'Sent. Check your notifications' : 'Send a test nudge'}
          </Button>
        </PadRow>
      )}
      <ListRow
        icon="eye"
        iconTone="honey"
        label="Keep screen awake"
        description={wakeSupported ? 'Stops your screen dimming during a brew.' : 'Not supported in this browser.'}
        toggle={{ checked: st.keepAwake && wakeSupported, disabled: !wakeSupported, onChange: (v) => st.set({ keepAwake: v }) }}
      />
      <ListRow
        icon="lightning"
        iconTone="berry"
        label="Haptics"
        description={vibrateSupported ? 'Little buzzes for key moments.' : 'This device can’t vibrate.'}
        toggle={{ checked: st.haptics && vibrateSupported, disabled: !vibrateSupported, onChange: (v) => st.set({ haptics: v }) }}
      />
    </ListGroup>
  );
}

function AppearanceGroup() {
  const st = useSettings();
  return (
    <ListGroup title="Appearance">
      <StackRow title="Theme" description={st.theme === 'auto' ? 'Follows your device: cream by day, plum by night.' : undefined}>
        <SegmentedControl<ThemePref>
          label="Theme"
          value={st.theme}
          onChange={(v) => st.set({ theme: v })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Night' },
          ]}
        />
      </StackRow>
      <StackRow title="Motion" description="Reduced swaps bounces and slides for gentle fades.">
        <SegmentedControl<MotionPref>
          label="Motion"
          value={st.motion}
          onChange={(v) => st.set({ motion: v })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'reduce', label: 'Reduced' },
            { value: 'full', label: 'Full' },
          ]}
        />
      </StackRow>
      <StackRow title="3D nook" description={st.scene === 'off' ? 'Off shows a cozy illustration instead.' : 'Lower it if your device runs warm.'}>
        <SegmentedControl<ScenePref>
          label="3D nook quality"
          value={st.scene}
          onChange={(v) => st.set({ scene: v })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'high', label: 'High' },
            { value: 'low', label: 'Low' },
            { value: 'off', label: 'Off' },
          ]}
        />
      </StackRow>
    </ListGroup>
  );
}

function ShortcutsGroup() {
  const groups = SHORTCUTS.reduce<Record<string, typeof SHORTCUTS>>((acc, sc) => {
    const k = sc.where ?? 'Anywhere';
    (acc[k] ??= []).push(sc);
    return acc;
  }, {});
  return (
    <ListGroup title="Keyboard shortcuts">
      {Object.entries(groups).map(([where, list]) => (
        <div key={where} className={s.kbdGroup}>
          <span className={s.kbdWhere}>{where}</span>
          <dl className={s.kbdList}>
            {list.map((sc) => (
              <div key={sc.id} className={s.kbdRow}>
                <dt>{sc.label}</dt>
                <dd>
                  {sc.keys.map((k, i) => (
                    <span key={k}>
                      {i > 0 && <span className={s.kbdOr}> or </span>}
                      <Kbd>{k}</Kbd>
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </ListGroup>
  );
}

function AboutGroup() {
  return (
    <ListGroup title="About">
      <div className={s.story}>
        <div className={s.storyHead}>
          <Mascot pose="sip" size={72} />
          <h3 className={s.storyTitle}>Chai’s story</h3>
        </div>
        <p>
            Chai is a small, round, thoroughly unbothered capybara who lives in a cozy nook with a kettle that’s always just about to boil. Chai believes big things get done one warm cup at a time, never rushes you,
          and has never once guilt-tripped anyone. The yuzu? Nobody knows how it stays up there.
        </p>
      </div>
      <ListRow icon="info" iconTone="sky" label="Version" value={`Kettle ${version}`} />
      <ListRow icon="lock" iconTone="matcha" label="Privacy" description="No accounts, no tracking. Your data never leaves this device unless you export it." />
      <ListRow icon="heart" iconTone="berry" label="Credits" description="Type set in Fredoka and Nunito (SIL Open Font License). Every sound is synthesized live in your browser. The nook is built with three.js." />
    </ListGroup>
  );
}

/** Where notification permission lives depends on how Kettle is open. */
function deniedHelp() {
  const installed = typeof matchMedia !== 'undefined' && (matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  if (installed)
    return (
      <>
        open your phone’s <em>Settings</em>, find <em>Kettle</em> under <em>Notifications</em> (or <em>Apps</em>), allow notifications, then come back here.
      </>
    );
  if (touch)
    return (
      <>
        open your browser’s menu, find <em>Site settings</em> (or the page’s settings) for this site, set <em>Notifications</em> to <em>Allow</em>, then reload.
      </>
    );
  return (
    <>
      click the lock or tune icon next to the web address, open <em>Site settings</em>, set <em>Notifications</em> to <em>Allow</em>, then come back here.
    </>
  );
}
