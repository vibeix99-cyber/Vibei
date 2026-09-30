/**
 * Round-6 MOCKUPS: proposed visual result for round 1 (Direction A, "the kettle is the timer").
 * NOT the app: a static page built from the app's own tokens, fonts, UI kit and art components, plus stills
 * rendered from the real 3D engine (../renders). Every frame is a pure function of the query string:
 *
 *   ?screen=hello|home|focus|summary|nook   &device=phone|desktop   &theme=light|dark
 *   focus:   &p=0..1  &whistle=1  &rm=1 (reduced motion / 3D off: still window, stepped steam, no shake)
 *   summary: &first=1 (first-ever brew: optional "make Kettle yours" row, no questionnaire)
 */
import '@/styles/global.css';
import { createRoot } from 'react-dom/client';
import type { CSSProperties, ReactNode } from 'react';
import { Badge, Icon, LevelBadge, Logo, Mascot, StreakMug, TeaTin, Leaf } from '@/art';
import { Button, Chip, IconButton, ProgressBar, Ring, TextField } from '@/ui';
import { ItemGlyph } from '@/screens/nook/ItemGlyph';
import { ITEMS } from '@/progress/items';
import { HeroKettle } from './HeroKettle';

const q = new URLSearchParams(location.search);
const screen = q.get('screen') ?? 'home';
const desktop = q.get('device') === 'desktop';
const dark = q.get('theme') === 'dark';
const rm = q.get('rm') === '1';
const R = '../renders';
const W = desktop ? 1440 : 390; // strip: fixed 1440×420
const H = desktop ? 900 : 844;

/* ------------------------------------------------------------------ shared bits */
const display: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink)', margin: 0 };
const body: CSSProperties = { fontFamily: 'var(--font-body)', color: 'var(--ink-2)', margin: 0 };
const noop = () => {};

function Frame({ children, bg = 'var(--bg)' }: { children: ReactNode; bg?: string }) {
  return <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: bg }}>{children}</div>;
}

function TabBar({ active }: { active: string }) {
  const tabs = [
    ['home', 'Today'],
    ['stats', 'Stats'],
    ['nook', 'Nook'],
    ['settings', 'Settings'],
  ];
  return (
    <nav style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 74, background: 'var(--surface)', borderTop: '2px solid var(--line)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 8 }}>
      {tabs.map(([k, l]) => (
        <div key={k} style={{ display: 'grid', justifyItems: 'center', gap: 2, font: '700 12px var(--font-body)', color: k === active ? 'var(--persimmon-ink)' : 'var(--ink-3)' }}>
          <span style={{ padding: '4px 14px', borderRadius: 999, background: k === active ? 'var(--persimmon-soft)' : 'transparent' }}>
            <Icon name={k as 'home'} size={24} tone={k === active ? 'color' : undefined} />
          </span>
          {l}
        </div>
      ))}
    </nav>
  );
}

function Rail({ active }: { active: string }) {
  const tabs = [
    ['home', 'Today'],
    ['stats', 'Stats'],
    ['nook', 'Nook'],
    ['settings', 'Settings'],
  ];
  return (
    <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, borderRight: '2px solid var(--line)', padding: '28px 14px', boxSizing: 'border-box' }}>
      <div style={{ padding: '0 10px 24px' }}>
        <Logo size={34} animate={false} />
      </div>
      {tabs.map(([k, l]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', marginBottom: 6, borderRadius: 14, font: '800 16px var(--font-body)', color: k === active ? 'var(--persimmon-ink)' : 'var(--ink-2)', background: k === active ? 'var(--persimmon-soft)' : 'transparent', border: k === active ? '2px solid var(--persimmon-soft-edge)' : '2px solid transparent' }}>
          <Icon name={k as 'home'} size={24} tone={k === active ? 'color' : undefined} />
          {l}
        </div>
      ))}
    </aside>
  );
}

/** One quiet line for all the progress systems (streak · leaves · level): same data, a third of the weight. */
function StatusLine() {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', font: '800 14px var(--font-body)', color: 'var(--ink-2)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <StreakMug state="warm" size={24} animate={false} /> 6 days warm
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Leaf size={18} /> 655
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <LevelBadge level={7} size={22} /> Level 7
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ first run: brew first, setup later */
function Hello() {
  return (
    <Frame>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 40% at 50% 32%, var(--persimmon-soft), transparent 70%)', opacity: dark ? 0.25 : 1 }} />
      <div style={{ position: 'absolute', left: 24, right: 24, top: 70, display: 'grid', justifyItems: 'center', textAlign: 'center' }}>
        <Mascot pose="wave" size={190} animate={false} />
        <h1 style={{ ...display, fontSize: 34, marginTop: 10 }}>Hi, I’m Chai.</h1>
        <p style={{ ...body, fontSize: 18, lineHeight: 1.45, marginTop: 10, maxWidth: 300 }}>Let’s start small: one 15-minute brew. I’ll keep you company.</p>
      </div>
      <div style={{ position: 'absolute', left: 24, right: 24, top: 452 }}>
        <TextField label="What’s the first thing? (optional)" value="" onChange={noop} placeholder="e.g. Chapter 3 notes" size="lg" />
      </div>
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 40, display: 'grid', gap: 10 }}>
        <Button variant="primary" size="lg" block icon="play" sfx={false}>
          Start a 15-min brew
        </Button>
        <Button variant="ghost" size="md" block sfx={false}>
          Set things up first
        </Button>
        <p style={{ ...body, fontSize: 14, textAlign: 'center', fontWeight: 700 }}>I have a backup</p>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ Home (distilled) */
function Composer({ wide = false }: { wide?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <TextField label="What are you brewing?" value="" onChange={noop} placeholder="e.g. Chapter 3 notes" size={wide ? 'lg' : 'md'} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip selected icon="pencil" sfx={false}>
          Study
        </Chip>
        <Chip icon="clock" sfx={false}>
          25 min · Classic
        </Chip>
      </div>
      <Button variant="primary" size="lg" block icon="play" sfx={false}>
        Put the kettle on · 25 min
      </Button>
      <p style={{ ...body, fontSize: 14, textAlign: 'center' }}>Then a 5 min tea break.</p>
    </div>
  );
}

function Recipes() {
  const rows: [string, string, number, string][] = [
    ['Finish a full brew', '+10', 1, 'done'],
    ['Brew with 2 different tags', '+15', 1, 'done'],
    ['Brew for 30 minutes', '+20', 0.4, '12 / 30 min'],
  ];
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ ...display, fontSize: 19 }}>Today’s recipes</h2>
        <span style={{ ...body, fontSize: 14, fontWeight: 800 }}>2 of 3</span>
      </div>
      {rows.map(([t, l, v, s]) => (
        <div key={t} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 10px', alignItems: 'center' }}>
          <span style={{ font: '700 15px var(--font-body)', color: 'var(--ink)' }}>{t}</span>
          <span style={{ font: '800 13px var(--font-body)', color: 'var(--matcha-ink)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Leaf size={14} />
            {l}
          </span>
          <ProgressBar value={v} tone={v >= 1 ? 'matcha' : 'honey'} height={8} label={t} valueText={s} />
          <span style={{ ...body, fontSize: 12 }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

function TodayBrews() {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <h2 style={{ ...display, fontSize: 19 }}>Today’s brews</h2>
      {[
        ['9:05', 'Roadmap draft', 'Work'],
        ['1:20', 'Read brew', 'Read'],
      ].map(([t, n, g]) => (
        <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', font: '700 15px var(--font-body)', color: 'var(--ink)' }}>
          <span style={{ color: 'var(--ink-3)', width: 40 }}>{t}</span>
          <span style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--matcha)', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <Icon name="check" size={14} />
          </span>
          {n}
          <span style={{ ...body, fontSize: 13 }}>· {g} · 25 min</span>
        </div>
      ))}
    </div>
  );
}

function Home() {
  const hello = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Mascot pose="idle" size={desktop ? 110 : 84} animate={false} />
      <div style={{ display: 'grid', gap: 6 }}>
        <p style={{ ...body, fontSize: desktop ? 18 : 16, color: 'var(--ink)', fontWeight: 700, lineHeight: 1.35 }}>Nice going. One more brew makes today’s cup.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ring value={12 / 30} size={28} thickness={5} tone="persimmon" label="Daily goal" valueText="12 of 30 minutes" />
          <span style={{ ...body, fontSize: 14, fontWeight: 800 }}>12 of 30 min today</span>
        </div>
      </div>
    </div>
  );
  if (!desktop)
    return (
      <Frame>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 18 }}>
          <StatusLine />
          <h1 style={{ ...display, fontSize: 30, marginTop: 16 }}>Good afternoon, Mika</h1>
          <div style={{ marginTop: 12 }}>{hello}</div>
          <div style={{ marginTop: 20 }}>
            <Composer />
          </div>
          <div style={{ marginTop: 26 }}>
            <Recipes />
          </div>
        </div>
        <TabBar active="home" />
      </Frame>
    );
  return (
    <Frame>
      <Rail active="home" />
      <div style={{ position: 'absolute', left: 300, top: 56, width: 640 }}>
        <StatusLine />
        <h1 style={{ ...display, fontSize: 44, marginTop: 22 }}>Good afternoon, Mika</h1>
        <div style={{ marginTop: 22, display: 'flex', gap: 18, alignItems: 'center' }}>
          <Mascot pose="idle" size={150} animate={false} />
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ ...body, fontSize: 20, color: 'var(--ink)', fontWeight: 700, lineHeight: 1.35 }}>Nice going. One more brew makes today’s cup.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Ring value={12 / 30} size={34} thickness={6} tone="persimmon" label="Daily goal" valueText="12 of 30 minutes" />
              <span style={{ ...body, fontSize: 16, fontWeight: 800 }}>12 of 30 min today</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 30 }}>
          <Composer wide />
        </div>
        <div style={{ marginTop: 34 }}>
          <TodayBrews />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1000, top: 56, width: 380, display: 'grid', gap: 28 }}>
        <Recipes />
        <div style={{ display: 'grid', gap: 10 }}>
          <h2 style={{ ...display, fontSize: 19 }}>Your nook</h2>
          <div style={{ position: 'relative', height: 250, borderRadius: 22, overflow: 'hidden', border: '2px solid var(--line)', background: dark ? 'radial-gradient(80% 70% at 50% 45%, #3c2b4c, #221829)' : 'radial-gradient(80% 70% at 50% 45%, #fdf1e2, #f1e0cb)' }}>
            <img src={`${R}/room-${dark ? 'night' : 'day'}-phone.png`} style={{ width: 380, height: 351, marginTop: -40 }} alt="" />
          </div>
          <p style={{ ...body, fontSize: 14, fontWeight: 700 }}>Level 7 · 45 leaves to level 8 and a new thing for the nook</p>
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ Focus: the kettle is the timer */
function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function FocusCore({ p, whistle, size }: { p: number; whistle: boolean; size: number }) {
  const remaining = 25 * 60 * (1 - p);
  const line = whistle ? 'Tea’s ready.' : p < 0.1 ? 'Kettle’s on. Nice start.' : p < 0.8 ? 'Kettle’s warming up…' : 'Nearly singing.';
  return (
    <div style={{ display: 'grid', justifyItems: 'center' }}>
      <div style={{ position: 'relative', width: size * 1.28, height: size * 0.96 }}>
        <div style={{ position: 'absolute', left: 0, bottom: 0 }}>
          <HeroKettle progress={p} whistle={whistle} reduced={rm} dark={dark} size={size} />
        </div>
        <div style={{ position: 'absolute', right: 0, bottom: size * 0.05 }}>
          <Mascot pose={whistle ? 'cheer' : 'focus'} size={size * 0.46} animate={false} />
        </div>
      </div>
      <div
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: desktop ? 96 : 78, lineHeight: 1, letterSpacing: '-1px', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginTop: 10 }}
        aria-label={whistle ? 'Brew complete' : `${Math.round(remaining / 60)} minutes remaining`}
      >
        {whistle ? '0:00' : fmt(remaining)}
      </div>
      <p style={{ ...body, fontSize: desktop ? 18 : 16, fontWeight: 800, marginTop: 8 }}>{line}</p>
    </div>
  );
}

function Controls({ whistle }: { whistle: boolean }) {
  if (whistle) return null;
  const items: [string, string, boolean][] = [
    ['plus', 'Add 5', false],
    ['pause', 'Pause', true],
    ['stop', 'End', false],
  ];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 34, alignItems: 'flex-start' }}>
      {items.map(([ic, l, big]) => (
        <div key={l} style={{ display: 'grid', justifyItems: 'center', gap: 6, font: '800 14px var(--font-body)', color: 'var(--ink-2)' }}>
          <IconButton icon={ic as 'pause'} label={l} variant="secondary" size={big ? 'lg' : 'md'} sfx={false} />
          {l}
        </div>
      ))}
    </div>
  );
}

function TopBar({ whistle }: { whistle: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'color-mix(in srgb, var(--surface) 82%, transparent)', font: '800 15px var(--font-body)', color: 'var(--ink)' }}>
        <Icon name="pencil" size={16} tone="color" /> Chapter 3 notes
        <span style={{ color: 'var(--ink-3)', fontWeight: 700 }}>· Study</span>
      </span>
      {!whistle && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: 'color-mix(in srgb, var(--surface) 82%, transparent)', font: '800 14px var(--font-body)', color: 'var(--ink-2)' }}>
          <Icon name="rain" size={16} /> Rain
        </span>
      )}
    </div>
  );
}

/** The 3D room's window corner (a live, calm backdrop in production; a still under reduced motion / 3D off). */
function Window({ panel = false }: { panel?: boolean }) {
  const src = `${R}/window-${dark ? 'night' : 'day'}-${panel ? 'panel' : 'phone'}.png`;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        filter: `blur(${panel ? 1.5 : 3}px) saturate(${dark ? 0.9 : 0.85})`,
        opacity: dark ? 0.55 : 0.6,
        transform: 'scale(1.04)',
      }}
    />
  );
}

function Focus() {
  const p = Number(q.get('p') ?? 0);
  const whistle = q.get('whistle') === '1';
  if (!desktop)
    return (
      <Frame>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 470, overflow: 'hidden' }}>
          <Window />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, color-mix(in srgb, var(--bg) 20%, transparent) 0%, transparent 40%, var(--bg) 100%)` }} />
        </div>
        <div style={{ position: 'absolute', left: 18, right: 18, top: 16 }}>
          <TopBar whistle={whistle} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 104 }}>
          <FocusCore p={p} whistle={whistle} size={292} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 44 }}>
          <Controls whistle={whistle} />
        </div>
        {rm && <RmTag />}
      </Frame>
    );
  return (
    <Frame>
      <div style={{ position: 'absolute', right: 40, top: 40, bottom: 40, width: 520, borderRadius: 28, overflow: 'hidden', border: '2px solid var(--line)' }}>
        <Window panel />
      </div>
      <div style={{ position: 'absolute', left: 60, top: 36, width: 760 }}>
        <TopBar whistle={whistle} />
      </div>
      <div style={{ position: 'absolute', left: 60, width: 760, top: 96 }}>
        <FocusCore p={p} whistle={whistle} size={420} />
      </div>
      <div style={{ position: 'absolute', left: 60, width: 760, bottom: 52 }}>
        <Controls whistle={whistle} />
      </div>
      {rm && <RmTag />}
    </Frame>
  );
}

function RmTag() {
  return (
    <div style={{ position: 'absolute', right: 12, bottom: 8, font: '700 11px var(--font-body)', color: 'var(--ink-3)' }}>
      Reduced motion: still window, stepped steam, no shake
    </div>
  );
}

/* ------------------------------------------------------------------ completion: one summary */
function Row({ art, title, sub, tone, trailing }: { art: ReactNode; title: ReactNode; sub?: ReactNode; tone?: string; trailing?: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 12, alignItems: 'center', padding: '7px 10px', borderRadius: 16, background: tone ?? 'transparent' }}>
      <div style={{ display: 'grid', placeItems: 'center' }}>{art}</div>
      <div>
        <div style={{ font: '800 16px var(--font-body)', color: 'var(--ink)' }}>{title}</div>
        {sub && <div style={{ ...body, fontSize: 14, marginTop: 2 }}>{sub}</div>}
      </div>
      {trailing}
    </div>
  );
}

function SummarySheet({ first }: { first: boolean }) {
  const stat = (label: string, value: ReactNode) => (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 2, padding: '10px 4px', borderRadius: 16, background: 'var(--surface-2)' }}>
      <span style={{ font: '800 12px var(--font-body)', color: 'var(--ink-3)', letterSpacing: '0.02em' }}>{label}</span>
      <span style={{ font: '600 22px var(--font-display)', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 4 }}>{value}</span>
    </div>
  );
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Mascot pose="cheer" size={70} animate={false} />
        <div>
          <h2 style={{ ...display, fontSize: 26 }}>The kettle’s whistling!</h2>
          <p style={{ ...body, fontSize: 15, fontWeight: 700 }}>{first ? 'Your first brew · 15 min' : 'Chapter 3 notes · 25 min brewed'}</p>
        </div>
      </div>
      {!first && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip selected icon="check" size="sm" sfx={false}>
            Done
          </Chip>
          <Chip size="sm" sfx={false}>
            Carry forward
          </Chip>
          <span style={{ ...body, fontSize: 13 }}>Carry forward keeps it for your next brew.</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {stat('Focus', first ? '15 min' : '25 min')}
        {stat(
          'Leaves',
          <>
            <Leaf size={18} />
            {first ? '+18' : '+43'}
          </>,
        )}
        {stat('Today', first ? '15 / 30' : '37 / 30')}
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        {first ? (
          <>
            <Row art={<StreakMug state="warm" count={1} size={40} animate={false} />} title="1 day warm" sub="Your warm streak starts today." />
            <Row art={<Badge id="first-brew" tier={1} size={40} />} title="New badge: First Brew" sub="Every badge started with one of these." />
            <Row
              art={<Mascot pose="think" size={46} animate={false} />}
              title="Make Kettle yours"
              sub="Name, daily goal, rhythm, sounds, nudges. About a minute."
              tone="var(--surface-2)"
              trailing={
                <div style={{ display: 'grid', gap: 4, justifyItems: 'end' }}>
                  <Button variant="soft" size="sm" sfx={false}>
                    Set up
                  </Button>
                  <span style={{ ...body, fontSize: 12, fontWeight: 700 }}>or later in Settings</span>
                </div>
              }
            />
          </>
        ) : (
          <>
            <Row art={<StreakMug state="warm" count={7} size={40} animate={false} />} title="7 days warm, your warmest yet" sub="New badge: Warm Streak II · Tea Cozy earned" trailing={<Badge id="warm-streak" tier={2} size={40} />} />
            <Row art={<TeaTin state="open" size={40} animate={false} />} title="2 of 3 recipes done" sub="+25 leaves · Brew for 30 minutes is next" />
            <Row
              art={<LevelBadge level={8} size={40} />}
              title="Cozy level 8"
              sub="New in your nook: Record player"
              tone="var(--honey-soft)"
              trailing={
                <span style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
                  <ItemGlyph id="recordPlayer" size={40} />
                </span>
              }
            />
            <div style={{ ...body, fontSize: 13, fontWeight: 700, padding: '4px 12px' }}>
              How you earned 43 leaves: 25 focused minutes · +5 full brew · +3 first brew today · +10 daily goal
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 2 }}>
        <Button variant="sky" size="lg" block icon="cup" sfx={false}>
          Tea time · 5 min
        </Button>
        <Button variant="ghost" size="md" block sfx={false}>
          Skip break
        </Button>
      </div>
    </div>
  );
}

function Summary() {
  const first = q.get('first') === '1';
  const sheetStyle: CSSProperties = {
    position: 'absolute',
    background: 'var(--surface)',
    border: '2px solid var(--line)',
    boxShadow: 'var(--shadow-3)',
    padding: desktop ? '26px 28px' : '20px 18px 26px',
    boxSizing: 'border-box',
  };
  if (!desktop)
    return (
      <Frame>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 250, overflow: 'hidden' }}>
          <Window />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, var(--bg) 100%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 14, display: 'grid', justifyItems: 'center' }}>
            <HeroKettle progress={1} whistle reduced={rm} dark={dark} size={170} />
          </div>
        </div>
        <div style={{ ...sheetStyle, left: 0, right: 0, bottom: 0, top: first ? 186 : 138, borderRadius: '28px 28px 0 0', borderBottom: 'none' }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--line)', margin: '-8px auto 12px' }} />
          <SummarySheet first={first} />
        </div>
      </Frame>
    );
  return (
    <Frame>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.3, filter: 'blur(3px)' }}>
        <div style={{ position: 'absolute', right: 40, top: 40, bottom: 40, width: 520, borderRadius: 28, overflow: 'hidden' }}>
          <Window panel />
        </div>
        <div style={{ position: 'absolute', left: 60, width: 760, top: 96 }}>
          <FocusCore p={1} whistle size={420} />
        </div>
      </div>
      <div style={{ ...sheetStyle, left: 470, top: 60, width: 500, borderRadius: 28 }}>
        <SummarySheet first={first} />
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ Nook: room and collection side by side */
function Items({ cols, tile }: { cols: number; tile: number }) {
  const owned = new Set(['pothos', 'books', 'cushion', 'fairyLights', 'shelf', 'teaSet', 'recordPlayer', 'blanket', 'painting', 'lantern']);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${tile}px)`, gap: 10 }}>
      {ITEMS.map((it) => {
        const have = owned.has(it.id);
        return (
          <div key={it.id} style={{ height: tile, borderRadius: 18, background: have ? 'var(--surface)' : 'var(--surface-2)', border: '2px solid var(--line)', display: 'grid', justifyItems: 'center', alignContent: 'center', gap: 6, padding: 6, boxSizing: 'border-box' }}>
            <ItemGlyph id={it.id} size={Math.round(tile * 0.5)} locked={!have} />
            <span style={{ font: '800 12px var(--font-body)', color: have ? 'var(--ink)' : 'var(--ink-3)', textAlign: 'center', lineHeight: 1.15 }}>{have ? it.name : `Level ${it.unlockLevel}`}</span>
          </div>
        );
      })}
    </div>
  );
}

function LevelCard() {
  return (
    <div style={{ display: 'grid', gap: 10, padding: 16, borderRadius: 20, background: 'var(--surface)', border: '2px solid var(--line)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <LevelBadge level={12} size={44} />
        <div>
          <div style={{ font: '600 20px var(--font-display)', color: 'var(--ink)' }}>Cozy level 12</div>
          <div style={{ ...body, fontSize: 14, fontWeight: 700 }}>159 leaves to level 13 · a surprise at level 14</div>
        </div>
      </div>
      <ProgressBar value={306 / 465} tone="honey" height={10} label="Level progress" valueText="306 of 465" />
    </div>
  );
}

function Nook() {
  const room = (w: string) => `${R}/room-${dark ? 'night' : 'day'}-${w}.png`;
  const stageBg = dark ? 'radial-gradient(80% 70% at 50% 45%, #3c2b4c, #221829)' : 'radial-gradient(80% 70% at 50% 45%, #fdf1e2, #f1e0cb)';
  if (!desktop)
    return (
      <Frame>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 18 }}>
          <h1 style={{ ...display, fontSize: 30 }}>Your nook</h1>
          <p style={{ ...body, fontSize: 15, fontWeight: 700 }}>10 of 14 cozy things · tap one to hear its story</p>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 96, height: 330, background: stageBg }}>
          <img src={room('phone')} style={{ width: 390, height: 360, marginTop: -16 }} alt="" />
        </div>
        <div style={{ position: 'absolute', left: 16, right: 16, top: 440, display: 'grid', gap: 14 }}>
          <LevelCard />
          <Items cols={3} tile={112} />
        </div>
        <TabBar active="nook" />
      </Frame>
    );
  return (
    <Frame>
      <Rail active="nook" />
      <div style={{ position: 'absolute', left: 290, top: 36 }}>
        <h1 style={{ ...display, fontSize: 36 }}>Your nook</h1>
        <p style={{ ...body, fontSize: 16, fontWeight: 700 }}>10 of 14 cozy things · tap one to hear its story</p>
      </div>
      <div style={{ position: 'absolute', left: 290, top: 120, width: 640, height: 740, borderRadius: 28, overflow: 'hidden', border: '2px solid var(--line)', background: stageBg }}>
        <img src={room('desk')} style={{ width: 760, height: 700, marginLeft: -60, marginTop: 30 }} alt="" />
      </div>
      <div style={{ position: 'absolute', left: 960, top: 120, width: 440, display: 'grid', gap: 16 }}>
        <LevelCard />
        <Items cols={3} tile={138} />
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ progress strip (for review) */
function Strip() {
  const steps: [number, boolean, string, string][] = [
    [0, false, '25:00', 'Kettle’s on. Nice start.'],
    [0.25, false, '18:45', 'Kettle’s warming up…'],
    [0.5, false, '12:30', 'Kettle’s warming up…'],
    [0.75, false, '6:15', 'Kettle’s warming up…'],
    [0.95, false, '1:15', 'Nearly singing.'],
    [1, true, '0:00', 'Tea’s ready.'],
  ];
  return (
    <div style={{ width: 1440, height: 420, background: 'var(--bg)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      {steps.map(([p, w, t, l]) => (
        <div key={t} style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
          <HeroKettle progress={p} whistle={w} reduced={rm} dark={dark} size={210} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 48, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{t}</div>
          <div style={{ ...body, fontSize: 14, fontWeight: 800 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

const SCREENS: Record<string, () => ReactNode> = { hello: Hello, home: Home, focus: Focus, summary: Summary, nook: Nook, strip: Strip };
createRoot(document.getElementById('root')!).render(<>{(SCREENS[screen] ?? Home)()}</>);
setTimeout(() => ((window as unknown as { __ready: boolean }).__ready = true), 400);
