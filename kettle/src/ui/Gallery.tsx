/**
 * UI kit gallery for the dev-only #/kit route. OWNER: design-system area.
 * `#/kit?part=ui` — every component in every state.
 * Extra params for screenshots: `&open=sheet|dialog|toast`, `&section=<id>`.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon, Mascot } from '@/art';
import { useSettings, type ThemePref } from '@/state/settings';
import { TAGS } from '@/state/tags';
import {
  Button,
  Card,
  ChipGroup,
  Chip,
  Counter,
  Digits,
  Dialog,
  Divider,
  EmptyState,
  IconButton,
  Kbd,
  ListGroup,
  ListRow,
  NumberStepper,
  Pill,
  PressableCard,
  ProgressBar,
  Ring,
  ScreenHeader,
  SectionHeader,
  SegmentedControl,
  Sheet,
  Skeleton,
  Slider,
  SpeechBubble,
  Spinner,
  Stat,
  TextField,
  Toggle,
  Tooltip,
  WeekStrip,
  toast,
  TONES,
  type Tone,
} from '@/ui';
import s from './Gallery.module.css';

const hashParams = () => new URLSearchParams(location.hash.split('?')[1] ?? '');

function Section({ id, title, note, children, wide }: { id: string; title: string; note?: string; children: ReactNode; wide?: boolean }) {
  return (
    <section id={`kit-${id}`} className={wide ? s.sectionWide : s.section} aria-labelledby={`kit-${id}-t`}>
      <header className={s.sectionHead}>
        <h2 id={`kit-${id}-t`} className="t-title">
          {title}
        </h2>
        {note && <p className="t-caption">{note}</p>}
      </header>
      {children}
    </section>
  );
}

function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className={s.rowWrap}>
      {label && <p className={`t-overline ${s.rowLabel}`}>{label}</p>}
      <div className={s.row}>{children}</div>
    </div>
  );
}

function Swatch({ name, bg, fg, edge }: { name: string; bg: string; fg?: string; edge?: string }) {
  return (
    <div className={s.swatch}>
      <span className={s.chipColor} style={{ background: `var(${bg})`, boxShadow: edge ? `inset 0 -5px 0 var(${edge})` : undefined, color: fg ? `var(${fg})` : undefined }}>
        {fg ? 'Aa' : ''}
      </span>
      <span className={s.swatchName}>{name}</span>
    </div>
  );
}

export default function UiGallery() {
  const params = hashParams();
  const openParam = params.get('open');
  const theme = useSettings((st) => st.theme);
  const motionPref = useSettings((st) => st.motion);
  const set = useSettings((st) => st.set);

  const [sheet, setSheet] = useState(openParam === 'sheet');
  const [dialog, setDialog] = useState(openParam === 'dialog');
  const [formSheet, setFormSheet] = useState(false);
  const [toggles, setToggles] = useState({ a: true, b: false, c: true });
  const [vol, setVol] = useState(0.7);
  const [amb, setAmb] = useState(0.35);
  const [mins, setMins] = useState(25);
  const [tag, setTag] = useState<string | null>('work');
  const [ambience, setAmbience] = useState<string[]>(['rain']);
  const [rhythm, setRhythm] = useState<'classic' | 'deep' | 'gentle'>('classic');
  const [size, setSize] = useState<'sip' | 'cup' | 'pot'>('cup');
  const [text, setText] = useState('Chapter 3 notes');
  const [empty, setEmpty] = useState('');
  const [progress, setProgress] = useState(0.42);
  const [count, setCount] = useState(128);
  const [secs, setSecs] = useState(25 * 60);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState('cup');
  const [replay, setReplay] = useState(0);
  const sheetInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (openParam === 'toast') {
      toast.success('Saved. Your kettle remembers.');
      toast('Tea Cozy used — your streak stayed warm.', { icon: 'cozy' });
      toast.warning('Notifications are blocked in this browser.', { action: { label: 'How to fix', onClick: () => {} } });
    }
    const section = params.get('section');
    if (section) document.getElementById(`kit-${section}`)?.scrollIntoView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown demo for the rolling digits.
  useEffect(() => {
    const id = window.setInterval(() => setSecs((v) => (v <= 0 ? 25 * 60 : v - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);
  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <div className={s.gallery}>
      <header className={s.top}>
        <div>
          <p className="t-overline">Kettle design system</p>
          <h1 className="t-display-l">UI kit</h1>
          <p className="t-body t-ink-2">Every component, every state. Import from <code className={s.code}>@/ui</code>.</p>
        </div>
        <div className={s.controls}>
          <SegmentedControl<ThemePref>
            label="Theme"
            value={theme}
            onChange={(v) => set({ theme: v })}
            options={[
              { value: 'light', label: 'Paper', icon: 'sun' },
              { value: 'dark', label: 'Plum', icon: 'moon' },
              { value: 'auto', label: 'Auto' },
            ]}
          />
          <ListRow
            label="Reduce motion"
            toggle={{ checked: motionPref === 'reduce', onChange: (v) => set({ motion: v ? 'reduce' : 'system' }) }}
          />
        </div>
      </header>

      <div className={s.grid}>
        {/* ---------------- Foundations ---------------- */}
        <Section id="color" title="Color" note="Tone recipe: face · edge · soft · ink. All text pairings pass AA (scripts/contrast.mjs)." wide>
          <div className={s.swatches}>
            {TONES.map((t) => (
              <div key={t} className={s.toneCol} data-tone={t}>
                <div className={s.toneFace}>
                  <span>{t}</span>
                </div>
                <div className={s.toneSoft}>
                  <span>soft · ink</span>
                </div>
              </div>
            ))}
          </div>
          <Row label="Surfaces & text">
            <Swatch name="bg" bg="--bg" fg="--ink" />
            <Swatch name="bg-sunken" bg="--bg-sunken" fg="--ink" />
            <Swatch name="surface" bg="--surface" fg="--ink" edge="--line" />
            <Swatch name="surface-2" bg="--surface-2" fg="--ink-2" />
            <Swatch name="surface-3" bg="--surface-3" fg="--ink-3" />
            <Swatch name="line" bg="--line" />
            <Swatch name="line-strong" bg="--line-strong" />
            <Swatch name="inverse" bg="--inverse" fg="--ink-inverse" />
          </Row>
        </Section>

        <Section id="type" title="Type" note="Fredoka 600 display · Nunito body. Utility classes t-*.">
          <div className={s.typeStack}>
            <p className="t-display-xl">The kettle’s whistling</p>
            <p className="t-display-l">Good morning, Robin</p>
            <p className="t-display-m">Your nook</p>
            <p className="t-title">Today’s recipes</p>
            <p className="t-headline">Focus for 25 minutes</p>
            <p className="t-body">Tea time. Stretch, sip, look out the window. Your minutes still count.</p>
            <p className="t-body-s t-ink-2">Keeps your streak warm for one missed day.</p>
            <p className="t-caption">Last brewed 2 hours ago</p>
            <p className="t-overline">Warm streak</p>
          </div>
        </Section>

        <Section id="digits" title="Digits & counters" note="Fixed-width cells: no jitter. Roll is off under reduced motion.">
          <div className={s.digitsDemo}>
            <Digits value={clock} roll="down" className={s.timer} label={`${clock} remaining`} />
            <Digits value="11:11" className={s.timerSmall} />
            <Digits value="10:00" className={s.timerSmall} />
          </div>
          <Row>
            <span className={s.counterBig}>
              <Counter value={count} />
            </span>
            <Pill tone="matcha" icon="leaf">
              <Counter value={count} format={(n) => `+${n}`} font="body" />
            </Pill>
            <Button size="sm" variant="secondary" onClick={() => setCount((c) => c + 37)}>
              Add 37
            </Button>
          </Row>
        </Section>

        {/* ---------------- Buttons ---------------- */}
        <Section id="buttons" title="Buttons" note="Face + 4px edge; press sinks into the edge. Labels 19px/700 (sm uses the deeper face)." wide>
          <Row label="Variants · md">
            <Button>Put the kettle on</Button>
            <Button variant="secondary">Skip break</Button>
            <Button variant="soft">+5 min</Button>
            <Button variant="ghost">Not now</Button>
          </Row>
          <Row label="Tones">
            <Button variant="matcha" icon="check">
              Done
            </Button>
            <Button variant="sky" icon="mug">
              Tea time
            </Button>
            <Button variant="honey" icon="leaf">
              Claim
            </Button>
            <Button variant="berry">Leave early</Button>
            <Button variant="plum" icon="moon">
              Night
            </Button>
            <Button variant="soft" tone="sky">
              Soft sky
            </Button>
            <Button variant="ghost" tone="berry">
              Reset data
            </Button>
          </Row>
          <Row label="Sizes">
            <Button size="lg" icon="play">
              Start brewing
            </Button>
            <Button size="md">Continue</Button>
            <Button size="sm">Small</Button>
            <Button size="sm" variant="secondary" icon="plus">
              Add
            </Button>
            <Button size="sm" variant="matcha">
              Small matcha
            </Button>
          </Row>
          <Row label="States">
            <Button loading={loading} onClick={() => setLoading(true)} onBlur={() => setLoading(false)}>
              {loading ? 'Saving' : 'Tap to load'}
            </Button>
            <Button loading variant="secondary">
              Loading
            </Button>
            <Button disabled>Disabled</Button>
            <Button disabled variant="secondary">
              Disabled
            </Button>
            <Button iconRight="chevronRight" variant="secondary">
              Next
            </Button>
          </Row>
          <Row label="Icon only">
            <Button icon="pause" aria-label="Pause" size="lg" />
            <Button icon="plus" aria-label="Add" variant="secondary" />
            <Button icon="sound" aria-label="Sound" variant="soft" tone="sky" />
            <IconButton icon="close" label="Close" />
            <IconButton icon="back" label="Back" />
            <IconButton icon="settings" label="Settings" variant="secondary" size="sm" />
            <IconButton icon="edit" label="Edit" variant="soft" size="sm" tone="honey" />
          </Row>
          <Row label="Block">
            <div className={s.blockDemo}>
              <Button block size="lg" sfx="start">
                Put the kettle on
              </Button>
              <Button block variant="ghost">
                Maybe later
              </Button>
            </div>
          </Row>
        </Section>

        {/* ---------------- Cards ---------------- */}
        <Section id="cards" title="Cards" note="2px warm border + 4px bottom edge.">
          <div className={s.stack}>
            <Card>
              <p className="t-headline">Plain card</p>
              <p className="t-body-s t-ink-2">Surfaces hold content, never compete with it.</p>
            </Card>
            <div className={s.twoCol}>
              {(['persimmon', 'matcha', 'honey', 'sky', 'berry', 'plum'] as Tone[]).map((t) => (
                <Card key={t} tone={t} padding="sm">
                  <p className="t-headline" style={{ color: `var(--${t}-ink)` }}>
                    {t}
                  </p>
                  <p className="t-caption">Tinted card</p>
                </Card>
              ))}
            </div>
            <div className={s.twoCol}>
              <Card variant="flat" padding="sm">
                <p className="t-body-s">Flat (no edge)</p>
              </Card>
              <Card variant="sunken" padding="sm">
                <p className="t-body-s">Sunken well</p>
              </Card>
            </div>
          </div>
        </Section>

        <Section id="pressable" title="Pressable cards" note="Options in onboarding / pickers. Selected = tone border + tint.">
          <div className={s.stack} role="radiogroup" aria-label="Daily goal">
            {[
              { id: 'sip', t: 'A sip', m: '15 min a day' },
              { id: 'cup', t: 'A cup', m: '30 min a day' },
              { id: 'pot', t: 'A pot', m: '60 min a day' },
            ].map((o) => (
              <PressableCard
                key={o.id}
                role="radio"
                aria-checked={selectedCard === o.id}
                selected={selectedCard === o.id}
                onClick={() => setSelectedCard(o.id)}
              >
                <span className={s.optRow}>
                  <Icon name="cup" tone="color" size={32} />
                  <span className={s.optText}>
                    <span className="t-headline">{o.t}</span>
                    <span className="t-body-s t-ink-2">{o.m}</span>
                  </span>
                </span>
              </PressableCard>
            ))}
          </div>
        </Section>

        {/* ---------------- Progress ---------------- */}
        <Section id="progress" title="Progress" note="Springy fill, inner highlight, sheen on growth.">
          <div className={s.stack}>
            <ProgressBar value={progress} tone="matcha" label="Daily goal" valueText={`${Math.round(progress * 100)}%`} />
            <ProgressBar value={progress * 0.7} tone="persimmon" height={20} label="Brew" />
            <ProgressBar value={0.66} tone="honey" height={14} label="Level" shimmer />
            <ProgressBar value={0.03} tone="sky" height={12} label="Tiny" />
            <ProgressBar value={1} tone="berry" height={12} label="Full" />
            <ProgressBar value={0} tone="plum" height={12} label="Empty" />
            <Row>
              <Button size="sm" variant="secondary" onClick={() => setProgress((p) => Math.max(0, p - 0.15))}>
                Less
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setProgress((p) => Math.min(1, p + 0.15))}>
                More
              </Button>
            </Row>
          </div>
          <Row label="Rings">
            <Ring value={progress} size={120} tone="persimmon" label="Focus" valueText="42%">
              <Digits value="14:32" className={s.ringDigits} />
            </Ring>
            <Ring value={0.8} size={84} tone="matcha" label="Goal">
              <span className="t-headline">80%</span>
            </Ring>
            <Ring value={1} size={64} tone="sky" label="Done">
              <Icon name="check" size={24} />
            </Ring>
            <Ring value={0} size={48} tone="honey" />
          </Row>
        </Section>

        {/* ---------------- Controls ---------------- */}
        <Section id="controls" title="Toggles, sliders, steppers">
          <Row label="Toggle">
            <Toggle checked={toggles.a} onChange={(v) => setToggles((t) => ({ ...t, a: v }))} label="Sound" />
            <Toggle checked={toggles.b} onChange={(v) => setToggles((t) => ({ ...t, b: v }))} label="Haptics" />
            <Toggle checked={toggles.c} onChange={(v) => setToggles((t) => ({ ...t, c: v }))} label="Small" size="sm" tone="sky" />
            <Toggle checked={false} onChange={() => {}} label="Disabled off" disabled />
            <Toggle checked onChange={() => {}} label="Disabled on" disabled />
          </Row>
          <div className={s.stack}>
            <Slider label="Master volume" value={vol} onChange={setVol} format={(v) => `${Math.round(v * 100)}%`} showValue start={<Icon name="mute" size={20} />} end={<Icon name="sound" size={20} />} />
            <Slider label="Ambience" value={amb} onChange={setAmb} tone="sky" format={(v) => `${Math.round(v * 100)}%`} showValue />
            <Slider label="Disabled" value={0.3} onChange={() => {}} disabled tone="matcha" />
          </div>
          <Row label="Stepper">
            <NumberStepper label="Focus length" value={mins} onChange={setMins} min={5} max={120} step={5} unit="min" />
            <NumberStepper label="Big" hideLabel size="lg" value={mins} onChange={setMins} min={5} max={120} step={5} unit="min" />
          </Row>
        </Section>

        <Section id="choice" title="Chips & segmented">
          <Row label="Tag chips (shared TAGS · single, can clear)">
            <ChipGroup
              label="Tag"
              allowEmpty
              value={tag}
              onChange={setTag}
              options={TAGS.map((t) => ({ value: t.id, label: t.label, icon: t.icon, tone: t.tone }))}
            />
          </Row>
          <Row label="Multiple · sky">
            <ChipGroup
              label="Ambience"
              multiple
              tone="sky"
              value={ambience}
              onChange={setAmbience}
              size="sm"
              options={[
                { value: 'rain', label: 'Rain', icon: 'rain' },
                { value: 'fire', label: 'Fire', icon: 'fire' },
                { value: 'forest', label: 'Forest', icon: 'forest' },
                { value: 'lofi', label: 'Lo-fi', icon: 'music' },
              ]}
            />
          </Row>
          <Row label="Standalone">
            <Chip selected>Selected</Chip>
            <Chip>Idle</Chip>
            <Chip disabled>Disabled</Chip>
          </Row>
          <div className={s.stack}>
            <SegmentedControl
              label="Rhythm"
              size="lg"
              value={rhythm}
              onChange={setRhythm}
              options={[
                { value: 'classic', label: 'Classic', sublabel: '25 · 5' },
                { value: 'deep', label: 'Deep', sublabel: '50 · 10' },
                { value: 'gentle', label: 'Gentle', sublabel: '15 · 3' },
              ]}
            />
            <SegmentedControl
              label="Goal"
              tone="persimmon"
              value={size}
              onChange={setSize}
              options={[
                { value: 'sip', label: 'Sip' },
                { value: 'cup', label: 'Cup' },
                { value: 'pot', label: 'Pot' },
              ]}
            />
          </div>
        </Section>

        <Section id="fields" title="Text fields">
          <div className={s.stack}>
            <TextField label="What are you brewing?" hideLabel placeholder="What are you brewing?" value={text} onChange={setText} clearable maxLength={60} showCount icon="edit" size="lg" />
            <TextField label="Your name" value={empty} onChange={setEmpty} placeholder="Optional" hint="Chai will use it to say hi." />
            <TextField label="Import code" value="kettle-1234" onChange={() => {}} error="That doesn’t look like a Kettle backup." />
            <TextField label="Disabled" value="Can’t touch this" onChange={() => {}} disabled />
          </div>
        </Section>

        {/* ---------------- Chai ---------------- */}
        <Section id="bubbles" title="Speech bubbles" note="Tail points at Chai.">
          <div className={s.chaiRow}>
            <Mascot pose="wave" size={96} />
            <SpeechBubble tail="left">Hi, I’m Chai. Shall we put the kettle on?</SpeechBubble>
          </div>
          <div className={s.chaiCol}>
            <Mascot pose="think" size={88} />
            <SpeechBubble tail="top" tailAt="50%" size="lg">
              How much tea a day feels right?
            </SpeechBubble>
          </div>
          <Row>
            <SpeechBubble tail="bottom" tone="sky">
              Tea time.
            </SpeechBubble>
            <SpeechBubble tail="right" tone="honey">
              +12 leaves
            </SpeechBubble>
            <SpeechBubble tail="none" tone="matcha">
              Nice work.
            </SpeechBubble>
          </Row>
        </Section>

        {/* ---------------- Data display ---------------- */}
        <Section id="stats" title="Stat tiles">
          <div className={s.twoCol}>
            <Stat icon={<Icon name="mug" tone="color" size={26} />} tone="persimmon" value={<Counter value={12} />} label="Day streak" />
            <Stat icon={<Icon name="leaf" tone="color" size={26} />} tone="matcha" value={<Counter value={4921} />} label="Leaves" />
            <Stat icon={<Icon name="clock" tone="color" size={26} />} tone="honey" value="41h 20m" label="Total focus" />
            <Stat icon={<Icon name="trophy" tone="color" size={26} />} tone="sky" value={37} label="Best streak" hint="Set in March" />
          </div>
          <Card>
            <div className={s.twoCol}>
              <Stat variant="bare" icon="cup" value="3" label="Brews today" />
              <Stat variant="bare" icon="target" tone="berry" value="80%" label="Goal" />
            </div>
          </Card>
        </Section>

        <Section id="week" title="Warm week" note="Takes progress's WeekStripDay[] as-is. celebrate lights today up (tap Replay).">
          <WeekStrip
            days={[
              { day: '2026-09-22', label: 'M', state: 'done' },
              { day: '2026-09-23', label: 'T', state: 'done' },
              { day: '2026-09-24', label: 'W', state: 'cozy' },
              { day: '2026-09-25', label: 'T', state: 'done' },
              { day: '2026-09-26', label: 'F', state: 'missed' },
              { day: '2026-09-27', label: 'S', state: 'today', isToday: true },
              { day: '2026-09-28', label: 'S', state: 'future' },
            ]}
          />
          <WeekStrip
            key={replay}
            size="lg"
            celebrate
            delay={0.5}
            label="Streak extended"
            days={[
              { day: '2026-09-22', label: 'M', state: 'done' },
              { day: '2026-09-23', label: 'T', state: 'done' },
              { day: '2026-09-24', label: 'W', state: 'done' },
              { day: '2026-09-25', label: 'T', state: 'done' },
              { day: '2026-09-26', label: 'F', state: 'done', isToday: true },
              { day: '2026-09-27', label: 'S', state: 'future' },
              { day: '2026-09-28', label: 'S', state: 'future' },
            ]}
          />
          <Row>
            <Button size="sm" variant="secondary" icon="refresh" onClick={() => setReplay((r) => r + 1)}>
              Replay
            </Button>
            <WeekStrip
              size="sm"
              tray={false}
              days={['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => ({ day: `2026-09-${22 + i}`, label: l, state: i < 3 ? 'done' : i === 3 ? 'today' : 'future', isToday: i === 3 }))}
            />
          </Row>
        </Section>

        <Section id="list" title="List rows" note="Settings-style groups.">
          <ListGroup title="Sounds" footer="Everything is synthesized on your device.">
            <ListRow icon="sound" iconTone="sky" label="Sound effects" toggle={{ checked: toggles.a, onChange: (v) => setToggles((t) => ({ ...t, a: v })) }} />
            <ListRow icon="bell" iconTone="honey" label="Whistle when done" description="A soft kettle whistle, never shrill." toggle={{ checked: toggles.b, onChange: (v) => setToggles((t) => ({ ...t, b: v })) }} />
            <ListRow icon="rain" iconTone="sky" label="Ambience" value="Rain" onClick={() => toast('Pick an ambience')} />
            <ListRow icon="music" iconTone="berry" label="Ambience volume" stacked trailing={<Slider label="Ambience volume" hideLabel value={amb} onChange={setAmb} tone="sky" />} />
          </ListGroup>
          <ListGroup title="Data">
            <ListRow icon="download" label="Export data" onClick={() => toast.success('Exported')} />
            <ListRow icon="keyboard" label="Keyboard shortcuts" trailing={<Kbd>?</Kbd>} />
            <ListRow icon="trash" label="Reset everything" danger onClick={() => setDialog(true)} chevron={false} />
          </ListGroup>
        </Section>

        <Section id="misc" title="Pills, dividers & bits">
          <Row label="Pills">
            <Pill tone="matcha" icon="leaf">
              +12
            </Pill>
            <Pill tone="honey">Level 25</Pill>
            <Pill tone="persimmon" solid>
              New
            </Pill>
            <Pill tone="sky" size="sm">
              Break
            </Pill>
            <Pill tone="berry" icon="cozy">
              2 Tea Cozies
            </Pill>
            <Pill>Neutral</Pill>
            <Pill tone="plum" solid size="sm">
              Night owl
            </Pill>
          </Row>
          <Divider label="or" />
          <Row label="Keys · spinner · tooltip">
            <span className="t-body-s">
              <Kbd>Space</Kbd> pause · <Kbd>Esc</Kbd> end · <Kbd>+</Kbd> 5 min
            </span>
            <Spinner />
            <Tooltip content="Streak freeze for one missed day">
              <Button variant="secondary" size="sm" icon="info">
                Hover me
              </Button>
            </Tooltip>
          </Row>
          <Row label="Skeleton">
            <div className={s.stack} style={{ width: '100%' }}>
              <Skeleton height={20} width="60%" />
              <Skeleton height={14} />
              <Skeleton height={64} radius={22} />
            </div>
          </Row>
        </Section>

        <Section id="headers" title="Headers & empty states">
          <Card variant="sunken">
            <ScreenHeader title="Stats" subtitle="Your brewing, week by week" actions={<IconButton icon="calendar" label="Pick month" variant="secondary" size="sm" />} />
          </Card>
          <Card variant="sunken">
            <ScreenHeader size="m" overline="Settings" title="Sounds" onBack={() => {}} />
          </Card>
          <SectionHeader title="Today’s recipes" action={<Button variant="ghost" size="sm" tone="sky">See all</Button>} />
          <Card>
            <EmptyState art={<Mascot pose="peek" size={96} />} title="Nothing brewed yet" action={<Button icon="play">Put the kettle on</Button>}>
              Your first cup is one tap away.
            </EmptyState>
          </Card>
        </Section>

        {/* ---------------- Overlays ---------------- */}
        <Section id="overlays" title="Sheets, dialogs & toasts" note="Bottom sheet on phones, dialog ≥ 720px. Focus trapped + restored; Esc closes.">
          <Row>
            <Button variant="secondary" onClick={() => setSheet(true)}>
              Quit sheet
            </Button>
            <Button variant="secondary" onClick={() => setFormSheet(true)}>
              Form sheet
            </Button>
            <Button variant="secondary" onClick={() => setDialog(true)}>
              Dialog
            </Button>
          </Row>
          <Row>
            <Button size="sm" variant="soft" tone="matcha" onClick={() => toast.success('Saved. Your kettle remembers.')}>
              Success toast
            </Button>
            <Button size="sm" variant="soft" onClick={() => toast('Tea Cozy used — your streak stayed warm.', { icon: 'cozy' })}>
              Neutral toast
            </Button>
            <Button size="sm" variant="soft" tone="berry" onClick={() => toast.warning('Notifications are blocked.', { action: { label: 'Fix', onClick: () => {} } })}>
              Warning toast
            </Button>
          </Row>
        </Section>
      </div>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Leave the kettle early?"
        description="That’s okay — your minutes still count."
        hero={<Mascot pose="concerned" size={120} />}
        footer={
          <>
            <Button block size="lg" onClick={() => setSheet(false)}>
              Keep brewing
            </Button>
            <Button block variant="ghost" tone="berry" sfx="cancel" onClick={() => setSheet(false)}>
              Leave early
            </Button>
          </>
        }
      />
      <Sheet
        open={formSheet}
        onClose={() => setFormSheet(false)}
        title="Edit brew"
        initialFocus={sheetInput}
        footer={
          <Button block onClick={() => setFormSheet(false)}>
            Save
          </Button>
        }
      >
        <div className={s.stack}>
          <TextField ref={sheetInput} label="Intention" value={text} onChange={setText} clearable maxLength={60} showCount />
          <ChipGroup
            label="Tag"
            allowEmpty
            value={tag}
            onChange={setTag}
            options={TAGS.slice(0, 3).map((t) => ({ value: t.id, label: t.label, tone: t.tone }))}
          />
          <NumberStepper label="Minutes" value={mins} onChange={setMins} min={5} max={120} step={5} unit="min" />
        </div>
      </Sheet>
      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Reset everything?"
        description="This clears your brews, streak and nook. Export first if you’d like a copy."
        size="sm"
        footer={
          <>
            <Button block variant="secondary" onClick={() => setDialog(false)}>
              Keep my data
            </Button>
            <Button block variant="ghost" tone="berry" onClick={() => setDialog(false)}>
              Reset
            </Button>
          </>
        }
      />
    </div>
  );
}
