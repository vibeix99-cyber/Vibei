/**
 * Round-6 MOCKUPS v2: the refined visual result for round 1 (Direction A, "the kettle is the timer").
 * NOT the app: a static page built from the app's own tokens, fonts, UI kit and art, plus stills rendered
 * from the real 3D engine (../renders). Every frame is a pure function of the query string:
 *
 *   ?screen=hello|home|focus|summary|nook|motion   &device=phone|desktop   &theme=light|dark
 *   focus:   &state=start|mid|paused|extended|whistle
 *   summary: &variant=routine|unlock|details|first
 *   motion:  the whistle → summary transition, normal and reduced motion side by side; time is set with
 *            window.__setT(seconds) (the recorder steps it at 30 fps)
 * v1 lives in git history (commit 3a161cf) and in ../frames-v1.
 * Rewards, streak, leaves, level, today's minutes, recipes and brews: ../fixtures/rewards.json (real engine).
 */
import '@/styles/global.css';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Badge, Icon, LevelBadge, Logo, Mascot, StreakMug, TeaTin, Leaf } from '@/art';
import { Button, Chip, IconButton, ProgressBar, Ring, TextField } from '@/ui';
import { ItemGlyph } from '@/screens/nook/ItemGlyph';
import { ITEMS } from '@/progress/items';
import { FocusScene, PHONE_SCENE, DESK_SCENE } from './FocusScene';
import { Kettle2, type KettleState } from './Kettle2';
import { ChaiArt, ChaiFace, chaiSize, type ChaiPose } from './ChaiArt';
// Every reward number below comes from the app's own progress engine and summary model
// (../fixtures/rewards.gen.ts writes this file); nothing is typed by hand.
import F from '../fixtures/rewards.json';

const q = new URLSearchParams(location.search);
const screen = q.get('screen') ?? 'home';
const desktop = q.get('device') === 'desktop';
const dark = q.get('theme') === 'dark';
const R = '../renders';
const W = desktop ? 1440 : 390;
const H = desktop ? 900 : 844;

/* ------------------------------------------------------------------ shared bits */
const display: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink)', margin: 0 };
const body: CSSProperties = { fontFamily: 'var(--font-body)', color: 'var(--ink-2)', margin: 0 };
const noop = () => {};
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

function Frame({ children, bg = 'var(--bg)', w = W, h = H }: { children: ReactNode; bg?: string; w?: number; h?: number }) {
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: bg }}>{children}</div>;
}

const TABS = [
  ['home', 'Today'],
  ['stats', 'Stats'],
  ['nook', 'Nook'],
  ['settings', 'Settings'],
];

function TabBar({ active }: { active: string }) {
  return (
    <nav style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 74, background: 'var(--surface)', borderTop: '2px solid var(--line)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 8 }}>
      {TABS.map(([k, l]) => (
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
  return (
    <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, borderRight: '2px solid var(--line)', padding: '28px 14px', boxSizing: 'border-box' }}>
      <div style={{ padding: '0 10px 24px' }}>
        <Logo size={34} animate={false} />
      </div>
      {TABS.map(([k, l]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', marginBottom: 6, borderRadius: 14, font: '800 16px var(--font-body)', color: k === active ? 'var(--persimmon-ink)' : 'var(--ink-2)', background: k === active ? 'var(--persimmon-soft)' : 'transparent', border: k === active ? '2px solid var(--persimmon-soft-edge)' : '2px solid transparent' }}>
          <Icon name={k as 'home'} size={24} tone={k === active ? 'color' : undefined} />
          {l}
        </div>
      ))}
    </aside>
  );
}

/** One quiet line for the long-running systems (streak · leaves · level). */
function StatusLine({ big = false }: { big?: boolean }) {
  const f = big ? '800 16px var(--font-body)' : '800 14px var(--font-body)';
  return (
    <div style={{ display: 'flex', gap: big ? 20 : 14, alignItems: 'center', font: f, color: 'var(--ink-2)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StreakMug state="warm" size={big ? 28 : 24} animate={false} /> {F.routine.home.streak} days warm
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Leaf size={big ? 20 : 18} /> {F.routine.home.leaves}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <LevelBadge level={F.routine.home.level} size={big ? 26 : 22} /> Level {F.routine.home.level}
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

/* ------------------------------------------------------------------ Home: one action, today's minutes explicit */
const TODAY = F.routine.home.today;

/** Completed and remaining minutes, both in words; the bar is the goal. */
function TodayMinutes({ big = false }: { big?: boolean }) {
  const left = TODAY.goal - TODAY.done;
  return (
    <div style={{ display: 'grid', gap: big ? 12 : 8, padding: big ? '20px 22px' : '14px 16px', borderRadius: 20, background: 'var(--surface)', border: '2px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={{ font: `600 ${big ? 30 : 22}px var(--font-display)`, color: 'var(--ink)' }}>
          {TODAY.done} min <span style={{ font: `700 ${big ? 18 : 15}px var(--font-body)`, color: 'var(--ink-2)' }}>brewed</span>
        </span>
        <span style={{ font: `600 ${big ? 22 : 17}px var(--font-display)`, color: 'var(--persimmon-ink)' }}>
          {left} min <span style={{ font: `700 ${big ? 16 : 14}px var(--font-body)`, color: 'var(--ink-2)' }}>to go</span>
        </span>
      </div>
      <ProgressBar value={TODAY.done / TODAY.goal} tone="persimmon" height={big ? 14 : 10} label="Today’s goal" valueText={`${TODAY.done} of ${TODAY.goal} minutes`} />
      <span style={{ ...body, fontSize: big ? 15 : 13, fontWeight: 700 }}>Today’s goal · {TODAY.goal} min</span>
    </div>
  );
}

function Composer({ wide = false }: { wide?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: wide ? 14 : 12 }}>
      <TextField label="What are you brewing?" value="" onChange={noop} placeholder="e.g. Chapter 3 notes" size={wide ? 'lg' : 'md'} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip selected icon="pencil" size={wide ? 'md' : undefined} sfx={false}>
          Study
        </Chip>
        <Chip icon="clock" size={wide ? 'md' : undefined} sfx={false}>
          25 min · Classic
        </Chip>
      </div>
      <Button variant="primary" size="lg" block icon="play" sfx={false}>
        Put the kettle on · 25 min
      </Button>
      <p style={{ ...body, fontSize: wide ? 15 : 14, textAlign: 'center' }}>Then a 5 min tea break.</p>
    </div>
  );
}

function Recipes({ big = false }: { big?: boolean }) {
  const rows: [string, string, number, string][] = TODAY.recipes.map((q) => [
    q.title,
    `+${q.reward}`,
    q.target ? q.progress / q.target : 0,
    q.done ? 'Done' : `${q.progress} / ${q.target}`,
  ]);
  return (
    <div style={{ display: 'grid', gap: big ? 14 : 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ ...display, fontSize: big ? 22 : 19 }}>Today’s recipes</h2>
        <span style={{ ...body, fontSize: big ? 15 : 14, fontWeight: 800 }}>
          {TODAY.recipes.filter((q) => q.done).length} of {TODAY.recipes.length}
        </span>
      </div>
      {rows.map(([t, l, v, s]) => (
        <div key={t} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '5px 10px', alignItems: 'center' }}>
          <span style={{ font: `700 ${big ? 16 : 15}px var(--font-body)`, color: 'var(--ink)' }}>{t}</span>
          <span style={{ font: '800 13px var(--font-body)', color: 'var(--matcha-ink)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Leaf size={14} />
            {l}
          </span>
          <ProgressBar value={v} tone={v >= 1 ? 'matcha' : 'honey'} height={8} label={t} valueText={s} />
          <span style={{ ...body, fontSize: 12, fontWeight: 700 }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

function TodayBrews({ big = false }: { big?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ ...display, fontSize: big ? 22 : 19 }}>Today’s brews</h2>
      {TODAY.brews.map((b) => [
        new Date(b.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, ''),
        b.intention || 'Focus',
        b.tag ? b.tag[0].toUpperCase() + b.tag.slice(1) : '',
        `${b.min} min${b.completed ? '' : ' · ended early'}`,
      ]).map(([t, n, g, d]) => (
        <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', font: `700 ${big ? 16 : 15}px var(--font-body)`, color: 'var(--ink)' }}>
          <span style={{ color: 'var(--ink-3)', width: 40 }}>{t}</span>
          <span style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}>
            <Icon name="cup" size={15} />
          </span>
          {n}
          <span style={{ ...body, fontSize: 14 }}>
            · {g} · {d}
          </span>
        </div>
      ))}
    </div>
  );
}

function Home() {
  if (!desktop)
    return (
      <Frame>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 18 }}>
          <StatusLine />
          <h1 style={{ ...display, fontSize: 30, marginTop: 16 }}>Good afternoon, Mika</h1>
          <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
            <ChaiArt pose="happy" height={104} />
            <p style={{ ...body, fontSize: 16, color: 'var(--ink)', fontWeight: 700, lineHeight: 1.35 }}>One more brew and today’s cup is full.</p>
          </div>
          <div style={{ marginTop: 12 }}>
            <TodayMinutes />
          </div>
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
      {/* two real columns: start a brew (left), today (right). No filler panels. */}
      <div style={{ position: 'absolute', left: 312, top: 118, width: 600 }}>
        <StatusLine big />
        <h1 style={{ ...display, fontSize: 50, marginTop: 26, letterSpacing: '-0.5px' }}>Good afternoon, Mika</h1>
        <div style={{ marginTop: 18, display: 'flex', gap: 20, alignItems: 'center' }}>
          <ChaiArt pose="happy" height={196} />
          <p style={{ ...body, fontSize: 22, color: 'var(--ink)', fontWeight: 700, lineHeight: 1.35, maxWidth: 360 }}>One more brew and today’s cup is full.</p>
        </div>
        <div style={{ marginTop: 26 }}>
          <Composer wide />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 984, top: 118, width: 400, display: 'grid', gap: 36 }}>
        <TodayMinutes big />
        <TodayBrews big />
        <Recipes big />
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ Focus: the kettle is the timer */
type FocusModel = {
  state: KettleState;
  p: number;
  extended?: boolean;
  digits: string;
  line: string;
  meta: string;
  pill?: string;
  toast?: string;
};

const FOCUS: Record<string, FocusModel> = {
  start: { state: 'run', p: 0, digits: '25:00', line: 'Kettle’s on. Nice start.', meta: 'Whistles at 3:30' },
  mid: { state: 'run', p: 0.5, digits: '12:30', line: 'Kettle’s warming up.', meta: '12 min brewed · whistles at 3:30' },
  paused: { state: 'paused', p: 0.5, digits: '12:30', line: 'The kettle will wait.', meta: '12 min brewed so far', pill: 'Paused' },
  extended: { state: 'run', p: 20 / 30, extended: true, digits: '10:00', line: 'Kettle’s warming up.', meta: '20 min brewed · now a 30 min brew', toast: '+5 min · whistles at 3:35 now' },
  whistle: { state: 'whistle', p: 1, digits: '0:00', line: 'Tea’s ready!', meta: '25 min brewed' },
  break: { state: 'rest', p: 1, digits: '4:12', line: 'Tea time. Sip slowly.', meta: 'Next brew whenever you’re ready', pill: 'Tea break' },
};

function TopBar({ whistle, wide = false, rest = false }: { whistle: boolean; wide?: boolean; rest?: boolean }) {
  const pill: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: wide ? '10px 16px' : '8px 14px', borderRadius: 999, background: 'var(--surface)', boxShadow: '0 1px 0 var(--line)', font: `800 ${wide ? 16 : 15}px var(--font-body)`, color: 'var(--ink)' };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
      <span style={pill}>
        {rest ? (
          <>
            <Icon name="cup" size={16} tone="color" /> Tea break <span style={{ color: 'var(--ink-3)', fontWeight: 700 }}>· 5 min</span>
          </>
        ) : (
          <>
            <Icon name="pencil" size={16} tone="color" /> Chapter 3 notes
            <span style={{ color: 'var(--ink-3)', fontWeight: 700 }}>· Study</span>
          </>
        )}
      </span>
      {!whistle && (
        <span style={{ ...pill, color: 'var(--ink-2)', fontSize: wide ? 15 : 14 }}>
          <Icon name="rain" size={16} /> Rain
        </span>
      )}
    </div>
  );
}

function Controls({ m, wide = false }: { m: FocusModel; wide?: boolean }) {
  if (m.state === 'whistle') return null;
  const paused = m.state === 'paused';
  const items: [string, string, boolean][] =
    m.state === 'rest'
      ? [
          ['pause', 'Pause', true],
          ['chevronRight', 'Skip break', false],
        ]
      : [
          ['plus', m.extended ? 'Add 5 more' : 'Add 5', false],
          [paused ? 'play' : 'pause', paused ? 'Resume' : 'Pause', true],
          ['stop', 'End', false],
        ];
  return (
    <div style={{ display: 'flex', justifyContent: wide ? 'flex-start' : 'center', gap: wide ? 40 : 34, alignItems: 'flex-start' }}>
      {items.map(([ic, l, big]) => (
        <div key={l} style={{ display: 'grid', justifyItems: 'center', gap: 6, font: `800 ${wide ? 15 : 14}px var(--font-body)`, color: big && paused ? 'var(--persimmon-ink)' : 'var(--ink-2)' }}>
          <IconButton icon={ic as 'pause'} label={l} variant={big && paused ? 'primary' : 'secondary'} size={big ? 'lg' : 'md'} sfx={false} />
          {l}
        </div>
      ))}
    </div>
  );
}

function Readout({ m, wide = false, opacity = 1 }: { m: FocusModel; wide?: boolean; opacity?: number }) {
  const whistle = m.state === 'whistle';
  return (
    <div style={{ display: 'grid', justifyItems: wide ? 'start' : 'center', gap: wide ? 10 : 6, opacity }}>
      <div style={{ height: wide ? 34 : 30, display: 'flex', alignItems: 'center' }}>
        {m.pill && (
          <span style={{ padding: '5px 12px', borderRadius: 999, background: m.state === 'rest' ? 'var(--sky-soft)' : 'var(--surface-2)', font: '800 13px var(--font-body)', color: m.state === 'rest' ? 'var(--sky-ink)' : 'var(--ink-2)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Icon name={m.state === 'rest' ? 'cup' : 'pause'} size={13} /> {m.pill}
          </span>
        )}
        {m.toast && (
          <span style={{ padding: '6px 13px', borderRadius: 999, background: 'var(--honey-soft)', font: '800 13px var(--font-body)', color: 'var(--ink)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Icon name="plus" size={13} /> {m.toast}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: wide ? 148 : 84,
          lineHeight: 0.92,
          letterSpacing: wide ? '-3px' : '-1.5px',
          color: whistle ? 'var(--persimmon-ink)' : m.state === 'paused' ? 'var(--ink-2)' : m.state === 'rest' ? 'var(--sky-ink)' : 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
        }}
        aria-label={whistle ? 'Brew complete' : `${m.digits} remaining`}
      >
        {m.digits}
      </div>
      <p style={{ ...body, fontSize: wide ? 22 : 17, fontWeight: 800, color: 'var(--ink)', marginTop: wide ? 4 : 2 }}>{m.line}</p>
      <p style={{ ...body, fontSize: wide ? 16 : 14, fontWeight: 700 }}>{m.meta}</p>
    </div>
  );
}

/** Phone Focus. `shift` pans the scene up as the summary rises (motion); `t`/`reduced` drive the live bits. */
function FocusPhone({ m, t = 0, reduced = true, controlsOpacity = 1, readoutOpacity = 1 }: { m: FocusModel; t?: number; reduced?: boolean; controlsOpacity?: number; readoutOpacity?: number }) {
  return (
    <>
      <FocusScene L={PHONE_SCENE} night={dark} p={m.p} state={m.state} extended={m.extended} t={t} reduced={reduced} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 90, background: `linear-gradient(180deg, color-mix(in srgb, var(--bg) ${dark ? 40 : 30}%, transparent), transparent)` }} />
      <div style={{ position: 'absolute', left: 16, right: 16, top: 16 }}>
        <TopBar whistle={m.state === 'whistle'} rest={m.state === 'rest'} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: PHONE_SCENE.h + 8 }}>
        <Readout m={m} opacity={readoutOpacity} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 30, opacity: controlsOpacity }}>
        <Controls m={m} />
      </div>
    </>
  );
}

function FocusDesk({ m }: { m: FocusModel }) {
  return (
    <>
      <div style={{ position: 'absolute', left: 40, top: 50, width: DESK_SCENE.w, height: DESK_SCENE.h, borderRadius: 30, overflow: 'hidden', boxShadow: '0 0 0 2px var(--line)' }}>
        <FocusScene L={DESK_SCENE} night={dark} p={m.p} state={m.state} extended={m.extended} />
      </div>
      <div style={{ position: 'absolute', left: 960, top: 50, width: 440, height: DESK_SCENE.h, display: 'grid', alignContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: '800 17px var(--font-body)', color: 'var(--ink)' }}>
            {m.state === 'rest' ? (
              <>
                <Icon name="cup" size={18} tone="color" /> Tea break <span style={{ color: 'var(--ink-3)', fontWeight: 700 }}>· 5 min</span>
              </>
            ) : (
              <>
                <Icon name="pencil" size={18} tone="color" /> Chapter 3 notes <span style={{ color: 'var(--ink-3)', fontWeight: 700 }}>· Study</span>
              </>
            )}
          </span>
          {m.state !== 'whistle' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999, background: 'var(--surface)', boxShadow: '0 0 0 2px var(--line)', font: '800 15px var(--font-body)', color: 'var(--ink-2)' }}>
              <Icon name="rain" size={16} /> Rain
            </span>
          )}
        </div>
        <Readout m={m} wide />
        <div style={{ paddingBottom: 18, minHeight: 96 }}>
          <Controls m={m} wide />
        </div>
      </div>
    </>
  );
}

function Focus() {
  const m = FOCUS[q.get('state') ?? 'mid'] ?? FOCUS.mid;
  return <Frame>{desktop ? <FocusDesk m={m} /> : <FocusPhone m={m} />}</Frame>;
}

/* ------------------------------------------------------------------ completion: one summary, clear hierarchy */
type Variant = 'routine' | 'unlock' | 'details' | 'first';

function RewardPill({ art, children, tone }: { art: ReactNode; children: ReactNode; tone?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px 6px 7px', borderRadius: 999, background: tone ?? 'var(--surface-2)', font: '800 14px var(--font-body)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
      <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center' }}>{art}</span>
      {children}
    </span>
  );
}

function Details({ open, first }: { open: boolean; first: boolean }) {
  const d = (first ? F.first : F.routine).summary.details;
  const rows: [string, string][] = d.rows.map((r) => [r.label, `+${r.amount}`]);
  const total = d.total;
  return (
    <div style={{ borderRadius: 16, border: '2px solid var(--line)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', font: '800 15px var(--font-body)', color: 'var(--ink-2)' }}>
        How your leaves added up
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={18} />
      </div>
      {open && (
        <div style={{ padding: '2px 14px 14px', display: 'grid', gap: 7 }}>
          {rows.map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', font: '700 14px var(--font-body)', color: 'var(--ink-2)' }}>
              <span>{l}</span>
              <span style={{ color: 'var(--matcha-ink)', fontWeight: 800 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', font: '800 15px var(--font-body)', color: 'var(--ink)', borderTop: '2px solid var(--line)', paddingTop: 8 }}>
            <span>This brew</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Leaf size={15} />+{total}
            </span>
          </div>
          {!first && (
            <>
              <div style={{ display: 'grid', gap: 5, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: '700 13px var(--font-body)', color: 'var(--ink-2)' }}>
                  <span>
                    Level {d.level} → {d.level + 1}
                  </span>
                  <span>{d.toNext} leaves to go</span>
                </div>
                <ProgressBar value={d.into / d.size} tone="honey" height={8} label="Level progress" valueText={`${d.into} of ${d.size}`} />
              </div>
              <p style={{ ...body, fontSize: 13, fontWeight: 700 }}>Your streak stays warm with one full brew a day.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Unlock({ wide }: { wide: boolean }) {
  const u = F.unlock.summary.unlock!;
  const item = u.items[0];
  return (
    <div style={{ display: 'grid', gap: 10, padding: wide ? 16 : 12, borderRadius: 22, background: 'var(--honey-soft)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: '800 13px var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>New in your nook</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: '800 14px var(--font-body)', color: 'var(--ink)' }}>
          <LevelBadge level={u.level} size={24} /> Cozy level {u.level}
        </span>
      </div>
      <div style={{ height: wide ? 212 : 124, borderRadius: 16, overflow: 'hidden', background: dark ? '#2a1f33' : '#f4e6d4' }}>
        <img src={`${R}/unlock-record-${dark ? 'night' : 'day'}.png`} alt="The record player in the nook" style={{ width: '118%', height: '100%', objectFit: 'cover', objectPosition: '0% 50%' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ font: `600 ${wide ? 24 : 21}px var(--font-display)`, color: 'var(--ink)' }}>{item.name}</div>
          <div style={{ ...body, fontSize: 14, fontWeight: 700 }}>{item.story}</div>
        </div>
        <Button variant="secondary" size="sm" sfx={false}>
          See it
        </Button>
      </div>
    </div>
  );
}

/** The same art per reward kind as the app's summary (src/screens/done/Summary.tsx). */
function PillArt({ kind, value, id, tier, streak }: { kind: string; value: number | null; id: string | null; tier: number | null; streak: number }) {
  switch (kind) {
    case 'leaves':
      return <Leaf size={20} />;
    case 'goal':
      return <Ring value={value ?? 0} size={20} thickness={4} tone={(value ?? 0) >= 1 ? 'matcha' : 'persimmon'} label="Daily goal" />;
    case 'streak':
      return <StreakMug state="warm" count={streak} size={26} animate={false} />;
    case 'recipes':
      return <TeaTin state="open" size={24} animate={false} />;
    case 'level':
      return <LevelBadge level={value ?? 1} size={22} />;
    case 'badge':
      return <Badge id={id ?? ''} tier={tier ?? 1} size={26} />;
    default:
      return null;
  }
}

function SummarySheet({ v, wide = false, stagger, chai = false }: { v: Variant; wide?: boolean; stagger?: (i: number) => CSSProperties; chai?: boolean }) {
  const first = v === 'first';
  const S = stagger ?? (() => ({}));
  const model = (first ? F.first : v === 'unlock' ? F.unlock : F.routine).summary;
  return (
    <div style={{ display: 'grid', gap: wide ? 18 : 14 }}>
      {/* 1 · the message: time brewed + tea time */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', ...S(0) }}>
        <div>
          <p style={{ ...body, fontSize: wide ? 15 : 14, fontWeight: 800, color: 'var(--ink-3)' }}>{first ? 'Your first brew' : 'Chapter 3 notes · Study'}</p>
          <h2 style={{ ...display, fontSize: wide ? 44 : 36, lineHeight: 1.05, marginTop: 4, letterSpacing: '-0.5px' }}>{model.headline}</h2>
          <p style={{ ...body, fontSize: wide ? 18 : 16, fontWeight: 700, marginTop: 6, color: 'var(--ink)' }}>Tea’s ready. Take five before the next one.</p>
        </div>
        {/* cheering Chai joins the headline only when the sheet covers the scene's Chai (one Chai on screen, always) */}
        {chai && <ChaiArt pose="cheering" height={wide ? 150 : 104} style={{ flex: 'none', marginRight: wide ? 0 : -6 }} />}
      </div>
      {!first && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', ...S(1) }}>
          <Chip selected icon="check" size="sm" sfx={false}>
            Done
          </Chip>
          <Chip size="sm" sfx={false}>
            Carry forward
          </Chip>
        </div>
      )}
      {/* 2 · routine rewards, compact */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, ...S(2) }}>
        {model.pills.map((p, i) => (
          <RewardPill key={`${p.kind}-${i}`} art={<PillArt kind={p.kind} value={p.value} id={p.id} tier={p.tier} streak={model.streakDays} />}>
            {p.text}
          </RewardPill>
        ))}
      </div>
      {/* 3 · a major unlock gets room */}
      {v === 'unlock' && (
        <div style={S(3)}>
          <Unlock wide={wide} />
        </div>
      )}
      {first && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 18, background: 'var(--surface-2)', ...S(3) }}>
          <div>
            <div style={{ font: '800 16px var(--font-body)', color: 'var(--ink)' }}>Make Kettle yours</div>
            <div style={{ ...body, fontSize: 14, marginTop: 2 }}>Name, daily goal, rhythm, sounds. About a minute, whenever you like.</div>
          </div>
          <Button variant="soft" size="sm" sfx={false}>
            Set up
          </Button>
        </div>
      )}
      {/* 4 · the arithmetic, on request */}
      <div style={S(4)}>
        <Details open={v === 'details'} first={first} />
      </div>
    </div>
  );
}

function SummaryFooter({ wide = false, style }: { wide?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr auto' : '1fr', gap: 8, ...style }}>
      <Button variant="sky" size="lg" block icon="cup" sfx={false}>
        Tea time · 5 min
      </Button>
      <Button variant="ghost" size={wide ? 'lg' : 'md'} block={!wide} sfx={false}>
        Skip break
      </Button>
    </div>
  );
}

const SHEET_TOP: Record<Variant, number> = { routine: 288, details: 104, unlock: 66, first: 300 };
const SCENE_PAN = 176; // how far the Focus scene pans up under the sheet (phone)

function SummaryPhone({ v, rise = 1, t = 0, reduced = true, stagger }: { v: Variant; rise?: number; t?: number; reduced?: boolean; stagger?: (i: number) => CSSProperties }) {
  const top = SHEET_TOP[v];
  const pan = SCENE_PAN * rise;
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: -pan, height: H + SCENE_PAN }}>
        <FocusPhone m={FOCUS.whistle} t={t} reduced={reduced} readoutOpacity={1 - rise} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: dark ? '#0b0710' : '#3b2a20', opacity: 0.18 * rise }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top,
          bottom: 0,
          transform: `translateY(${(1 - rise) * (H - top)}px)`,
          background: 'var(--surface)',
          borderRadius: '28px 28px 0 0',
          boxShadow: 'var(--shadow-3)',
          border: '2px solid var(--line)',
          borderBottom: 'none',
          display: 'grid',
          gridTemplateRows: '1fr auto',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '10px 20px 0', overflow: 'hidden' }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--line)', margin: '0 auto 14px' }} />
          <SummarySheet v={v} stagger={stagger} />
        </div>
        <SummaryFooter style={{ padding: '12px 20px 26px', borderTop: '2px solid var(--line)', background: 'var(--surface)', ...(stagger ? stagger(5) : {}) }} />
      </div>
      {/* when the sheet covers the scene's Chai, cheering Chai sits on the sheet's edge instead (one Chai on screen) */}
      {top < 200 && (
        <div style={{ position: 'absolute', right: 20, top: top - chaiSize('cheering', 110).h * 0.64, transform: `translateY(${(1 - rise) * (H - top)}px)` }}>
          <ChaiArt pose="cheering" height={110} />
        </div>
      )}
    </>
  );
}

function Summary() {
  const v = (q.get('variant') ?? (q.get('first') === '1' ? 'first' : 'routine')) as Variant;
  if (!desktop)
    return (
      <Frame>
        <SummaryPhone v={v} />
      </Frame>
    );
  const wideCard = v === 'unlock';
  return (
    <Frame>
      <div style={{ position: 'absolute', inset: 0, filter: 'saturate(0.9)' }}>
        <FocusDesk m={FOCUS.whistle} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: dark ? '#0b0710' : '#3b2a20', opacity: 0.32 }} />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: wideCard ? 640 : 580,
          background: 'var(--surface)',
          borderRadius: 30,
          border: '2px solid var(--line)',
          boxShadow: 'var(--shadow-3)',
          padding: '30px 32px 28px',
          boxSizing: 'border-box',
          display: 'grid',
          gap: 22,
        }}
      >
        <SummarySheet v={v} wide chai />
        <SummaryFooter wide />
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ Nook (unchanged from v1) */
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

/* ------------------------------------------------------------------ motion: whistle → summary, normal vs reduced */
export const MOTION = { whistleAt: 3, sheetAt: 5.4, rise: 0.7, end: 8.6 };

function MotionPhone({ t, reduced }: { t: number; reduced: boolean }) {
  const { whistleAt, sheetAt, rise: riseDur } = MOTION;
  const whistle = t >= whistleAt;
  const left = Math.max(0, whistleAt - t);
  const tw = t - whistleAt; // seconds since the whistle
  const m: FocusModel = whistle
    ? FOCUS.whistle
    : { state: 'run', p: 1 - left / 1500, digits: `0:0${Math.ceil(left)}`, line: 'Nearly singing.', meta: '24 min brewed · whistles at 3:30' };
  const ts = t - sheetAt;
  if (ts < 0) {
    const controlsOpacity = whistle ? (reduced ? 0 : 1 - clamp(tw / 0.25)) : 1;
    return <FocusPhone m={whistle ? m : { ...m }} t={whistle ? tw : t} reduced={reduced} controlsOpacity={controlsOpacity} />;
  }
  if (reduced) {
    // reduced motion: no pan, no slide, no stagger; the finished summary cross-fades in over 0.3 s
    const f = clamp(ts / 0.3);
    return (
      <>
        <FocusPhone m={m} t={tw} reduced controlsOpacity={0} />
        <div style={{ position: 'absolute', inset: 0, opacity: f }}>
          <SummaryPhone v="routine" rise={1} t={tw} reduced />
        </div>
      </>
    );
  }
  const r = easeOut(ts / riseDur);
  const stagger = (i: number): CSSProperties => {
    const k = easeOut((ts - 0.25 - i * 0.07) / 0.35);
    return { opacity: k, transform: `translateY(${(1 - k) * 12}px)` };
  };
  return <SummaryPhone v="routine" rise={r} t={tw} reduced={false} stagger={stagger} />;
}

function Motion() {
  const [t, setT] = useState(Number(q.get('t') ?? 0));
  (window as unknown as { __setT: (x: number) => void }).__setT = (x: number) => flushSync(() => setT(x));
  const label: CSSProperties = { font: '800 17px var(--font-body)', color: 'var(--ink)', textAlign: 'center', height: 44, display: 'grid', placeItems: 'center' };
  const phase = t < MOTION.whistleAt ? 'Last seconds of a brew' : t < MOTION.sheetAt ? 'The whistle (about 2.4 s, with the sound)' : 'One summary rises';
  return (
    <div style={{ width: 880, height: 980, background: dark ? '#17111c' : '#efe3d3', display: 'grid', gridTemplateColumns: '390px 390px', gap: '0 36px', justifyContent: 'center', alignContent: 'start', paddingTop: 22, boxSizing: 'border-box' }}>
      <div style={label}>Normal motion</div>
      <div style={label}>Reduced motion</div>
      {[false, true].map((reduced) => (
        <div key={String(reduced)} style={{ borderRadius: 30, overflow: 'hidden', boxShadow: '0 0 0 2px var(--line), 0 18px 40px rgba(0,0,0,0.18)' }}>
          <Frame w={390} h={844}>
            <MotionPhone t={t} reduced={reduced} />
          </Frame>
        </div>
      ))}
      <div style={{ gridColumn: '1 / span 2', marginTop: 16, display: 'flex', justifyContent: 'space-between', font: '800 15px var(--font-body)', color: 'var(--ink-2)' }}>
        <span>{phase}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t.toFixed(1)} s</span>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ kettle sheet (art review) */
function KettleSheet() {
  const S: [string, number, KettleState, boolean][] = [
    ['Start · 25:00', 0, 'run', false],
    ['Early · 20:00', 0.2, 'run', false],
    ['Midpoint · 12:30', 0.5, 'run', false],
    ['Late · 5:00', 0.8, 'run', false],
    ['Paused', 0.5, 'paused', false],
    ['+5 added · 10:00', 20 / 30, 'run', true],
    ['Whistle', 1, 'whistle', false],
    ['Tea break (resting)', 1, 'rest', false],
  ];
  return (
    <div style={{ width: 1400, padding: '18px 20px', background: 'var(--bg)', boxSizing: 'border-box' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
        {S.map(([l, p, s, x]) => (
          <div key={l} style={{ display: 'grid', justifyItems: 'center' }}>
            <Kettle2 progress={p} state={s} extended={x} night={dark} size={172} />
            <span style={{ font: '800 14px var(--font-body)', color: 'var(--ink-2)' }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 18 }}>
        <Kettle2 progress={0.5} state="run" night={dark} size={520} />
        <Kettle2 progress={1} state="whistle" night={dark} size={520} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Chai size check (approved art, actual CSS sizes) */
function Clip({ w, h, top, left = 0, children, label }: { w: number; h: number; top: number; left?: number; children: ReactNode; label: string }) {
  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ font: '800 14px var(--font-body)', color: 'var(--ink-2)', marginBottom: 6 }}>{label}</figcaption>
      <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', borderRadius: 16, boxShadow: '0 0 0 2px var(--line)' }}>
        <div style={{ position: 'absolute', left: -left, top: -top }}>{children}</div>
      </div>
    </figure>
  );
}

function ChaiSizes() {
  const cap: CSSProperties = { font: '800 13px var(--font-body)', color: 'var(--ink-3)', textAlign: 'center', marginTop: 6 };
  const head: CSSProperties = { ...display, fontSize: 20, margin: '26px 0 12px' };
  const phone = (m: FocusModel) => (
    <div style={{ position: 'relative', width: PHONE_SCENE.w, height: PHONE_SCENE.h }}>
      <FocusScene L={PHONE_SCENE} night={dark} p={m.p} state={m.state} extended={m.extended} />
    </div>
  );
  const small = [72, 56, 40, 32, 24];
  return (
    <div style={{ width: 1300, padding: '12px 28px 30px', background: 'var(--bg)', boxSizing: 'border-box' }}>
      <h2 style={{ ...head, marginTop: 8 }}>In the Focus scene · phone (390 px wide, Chai {Math.round(PHONE_SCENE.chai.h)} px tall)</h2>
      <div style={{ display: 'flex', gap: 24 }}>
        <Clip w={390} h={286} top={230} label="Focus · reading">{phone(FOCUS.mid)}</Clip>
        <Clip w={390} h={286} top={230} label="Tea break · sipping">{phone(FOCUS.break)}</Clip>
        <Clip w={390} h={286} top={230} label="Whistle · cheering">{phone(FOCUS.whistle)}</Clip>
      </div>
      <h2 style={head}>In the Focus scene · desktop (1440 × 900 layout, Chai {DESK_SCENE.chai.h} px tall)</h2>
      <Clip w={860} h={420} top={380} label="Focus · reading, next to the kettle">
        <div style={{ position: 'relative', width: DESK_SCENE.w, height: DESK_SCENE.h }}>
          <FocusScene L={DESK_SCENE} night={dark} p={0.5} state="run" />
        </div>
      </Clip>
      <h2 style={head}>Home and gentle support</h2>
      <div style={{ display: 'flex', gap: 44, alignItems: 'flex-end' }}>
        {(
          [
            ['happy', 104, 'Home greeting · phone'],
            ['happy', 196, 'Home greeting · desktop'],
            ['concerned', 104, 'Gentle support (e.g. streak at risk) · phone'],
          ] as [ChaiPose, number, string][]
        ).map(([p, h, l]) => (
          <div key={l} style={{ display: 'grid', justifyItems: 'center' }}>
            <ChaiArt pose={p} height={h} />
            <div style={cap}>{l} · {h} px</div>
          </div>
        ))}
      </div>
      <h2 style={head}>Small sizes: full pose vs face crop</h2>
      <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${small.length}, 110px)`, alignItems: 'end', rowGap: 14 }}>
        <span />
        {small.map((h) => (
          <span key={h} style={cap}>
            {h} px
          </span>
        ))}
        {(
          [
            ['Full pose · reading', (h: number) => <ChaiArt pose="reading" height={h} />],
            ['Full pose · cheering', (h: number) => <ChaiArt pose="cheering" height={h * (CHAI_RH / CHAI_CH)} />],
            ['Face avatar · happy', (h: number) => <ChaiFace size={h} />],
          ] as [string, (h: number) => ReactNode][]
        ).map(([l, r]) => (
          <div key={l} style={{ display: 'contents' }}>
            <span style={{ font: '800 14px var(--font-body)', color: 'var(--ink)', alignSelf: 'center' }}>{l}</span>
            {small.map((h) => (
              <div key={h} style={{ display: 'grid', placeItems: 'end center', height: 80 }}>
                {r(h)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
const CHAI_CH = chaiSize('cheering', 100).h;
const CHAI_RH = chaiSize('reading', 100).h;

const SCREENS: Record<string, () => ReactNode> = { hello: Hello, home: Home, focus: Focus, summary: Summary, nook: Nook, motion: () => <Motion />, kettle: KettleSheet, chaisize: ChaiSizes };
createRoot(document.getElementById('root')!).render(<>{(SCREENS[screen] ?? Home)()}</>);
setTimeout(() => ((window as unknown as { __ready: boolean }).__ready = true), 500);
