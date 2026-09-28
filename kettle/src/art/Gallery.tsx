/**
 * Art gallery for the dev-only #/kit?part=art route. OWNER: art area.
 * Query (after the hash): view=all|chai|small|icons|objects|badges|spots|nook|appicon|pose
 *   size=<px>  pose=<pose>  animate=0
 */
import type { CSSProperties, ReactNode } from 'react';
import { BADGES } from '@/progress/badges';
import { ITEMS } from '@/progress/items';
import { Mascot, type MascotPose } from './Mascot';
import { Icon, ICON_NAMES, type IconName } from './Icon';
import { StreakMug, Leaf, TeaCozy, TeaTin, LevelBadge, Logo, QuestIcon } from './Objects';
import { Badge } from './Badge';
import { GoalVessel, RhythmSpot, NotifySpot, BreakSpot, EmptySpot } from './Spots';
import { NookFallback } from './NookFallback';
import { AppIconArt } from './AppIcon';

const POSES: MascotPose[] = ['idle', 'wave', 'focus', 'sleep', 'sip', 'cheer', 'proud', 'concerned', 'think', 'peek', 'stretch'];
const NAV: IconName[] = ['home', 'stats', 'nook', 'settings'];

function params() {
  return new URLSearchParams(location.hash.split('?')[1] ?? '');
}

const grid: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' };
const cell: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  gap: 6,
  padding: 12,
  borderRadius: 16,
  background: 'var(--surface)',
  border: '2px solid var(--surface-edge)',
  borderBottomWidth: 4,
  fontSize: 12,
  color: 'var(--ink-2)',
};

function Cell({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ ...cell, ...style }}>
      {children}
      <span>{label}</span>
    </div>
  );
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section data-shot={id} style={{ display: 'grid', gap: 12, padding: 8, minWidth: 0 }}>
      <div>
        <h2 style={{ fontSize: 22 }}>{title}</h2>
        {note && <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default function ArtGallery() {
  const p = params();
  const view = p.get('view') ?? 'all';
  const phone = typeof window !== 'undefined' && window.innerWidth < 480;
  const size = Number(p.get('size') ?? (phone ? 118 : 140));
  const spot = phone ? 118 : 140;
  const animate = p.get('animate') !== '0';
  const show = (v: string) => view === 'all' || view === v;

  return (
    <section aria-label="Art" style={{ display: 'grid', gap: 36, maxWidth: 1400, minWidth: 0, overflowWrap: 'anywhere' }}>
      {view === 'pose' && (
        <Section id="pose" title={p.get('pose') ?? 'idle'}>
          <Mascot pose={(p.get('pose') as MascotPose) ?? 'idle'} size={size} animate={animate} />
        </Section>
      )}

      {show('chai') && (
        <Section id="chai" title="Chai the capybara" note="All poses. Idle life (breathing, blink, ear twitch, yuzu wobble) + pose motion; static under reduced motion.">
          <div style={grid}>
            {POSES.map((pose) => (
              <Cell key={pose} label={pose}>
                <Mascot pose={pose} size={size} animate={animate} title={`Chai, ${pose}`} />
              </Cell>
            ))}
          </div>
        </Section>
      )}

      {show('small') && (
        <Section id="small" title="Chai at small sizes" note="24 · 32 · 48 · 64 px (bigger eyes/nose below 72px).">
          {[24, 32, 48, 64].map((sz) => (
            <div key={sz} style={{ ...grid, gap: 10 }}>
              {POSES.map((pose) => (
                <Mascot key={pose} pose={pose} size={sz} animate={animate} />
              ))}
            </div>
          ))}
        </Section>
      )}

      {show('icons') && (
        <Section id="icons" title="Icons" note="Chunky duotone on a 24 grid. Left: mono (currentColor). Right: tone=&quot;color&quot;. Row 2: 24 / 20 / 16 px.">
          <div style={{ ...grid, gap: 10, alignItems: 'stretch' }}>
            {NAV.map((n) => (
              <Cell key={`nav-${n}`} label={`nav ${n}: muted → active`}>
                <div style={{ display: 'flex', gap: 10, color: 'var(--ink-3)' }}>
                  <Icon name={n} size={32} />
                  <Icon name={n} size={32} tone="color" />
                </div>
              </Cell>
            ))}
          </div>
          <div style={{ ...grid, gap: 10 }}>
            {ICON_NAMES.map((n) => (
              <div key={n} style={{ ...cell, width: 104 }}>
                <div style={{ display: 'flex', gap: 8, color: 'var(--ink)' }}>
                  <Icon name={n} size={36} />
                  <Icon name={n} size={36} tone="color" />
                </div>
                <div style={{ display: 'flex', gap: 6, color: 'var(--ink-2)', alignItems: 'center' }}>
                  <Icon name={n} size={24} />
                  <Icon name={n} size={20} />
                  <Icon name={n} size={16} />
                </div>
                <span>{n}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {show('objects') && (
        <Section id="objects" title="Objects">
          <div style={grid}>
            <Cell label="streak warm 12"><StreakMug state="warm" count={12} size={120} animate={animate} /></Cell>
            <Cell label="streak atRisk 12"><StreakMug state="atRisk" count={12} size={120} animate={animate} /></Cell>
            <Cell label="streak cold 0"><StreakMug state="cold" count={0} size={120} animate={animate} /></Cell>
            <Cell label="streak warm (no n)"><StreakMug state="warm" size={120} animate={animate} /></Cell>
            <Cell label="streak 365 · 32px">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StreakMug state="warm" count={365} size={120} animate={animate} />
                <StreakMug state="warm" count={5} size={32} animate={animate} />
              </div>
            </Cell>
            <Cell label="leaf · gold">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Leaf size={64} /> <Leaf size={32} /> <Leaf size={20} /> <Leaf size={64} tone="gold" />
              </div>
            </Cell>
            <Cell label="tea cozy · muted">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <TeaCozy size={120} animate={animate} /> <TeaCozy size={64} muted animate={animate} />
              </div>
            </Cell>
            <Cell label="tin closed"><TeaTin state="closed" size={120} animate={animate} /></Cell>
            <Cell label="tin opening"><TeaTin state="opening" size={120} animate={animate} /></Cell>
            <Cell label="tin open"><TeaTin state="open" size={120} animate={animate} /></Cell>
            <Cell label="level badge">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <LevelBadge level={3} size={72} /> <LevelBadge level={12} size={56} /> <LevelBadge level={120} size={40} /> <LevelBadge level={7} size={28} />
              </div>
            </Cell>
            <Cell label="logo · mark">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Logo size={52} /> <Logo variant="mark" size={52} />
              </div>
            </Cell>
            <Cell label="quest icons (clock cup sun moon leaf pencil break)">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['clock', 'cup', 'sun', 'moon', 'leaf', 'pencil', 'break'].map((q, i) => (
                  <QuestIcon key={q} icon={q} size={48} done={i === 1} />
                ))}
              </div>
            </Cell>
          </div>
        </Section>
      )}

      {show('badges') && (
        <Section id="badges" title="Badges" note="Every badge id × tiers I–V (oat → sky → matcha → berry → honey), locked, and 40 / 28 px.">
          <div style={{ display: 'grid', gap: 8 }}>
            {BADGES.map((b) => (
              <div key={b.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ width: 120, fontSize: 12, color: 'var(--ink-2)' }}>{b.title}</span>
                {b.tiers.map((_, i) => (
                  <Badge key={i} id={b.id} tier={i + 1} size={72} />
                ))}
                <Badge id={b.id} tier={1} locked size={72} />
                <Badge id={b.id} tier={3} size={40} />
                <Badge id={b.id} tier={5} size={28} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {show('spots') && (
        <Section id="spots" title="Spots" note="Onboarding (daily goal, rhythm, notifications) · break suggestions · empty states.">
          <div style={grid}>
            {(['sip', 'cup', 'pot', 'kettle'] as const).map((k) => (
              <Cell key={k} label={`goal ${k}`}><GoalVessel kind={k} size={spot} animate={animate} /></Cell>
            ))}
            {(['classic', 'deep', 'gentle'] as const).map((k) => (
              <Cell key={k} label={`rhythm ${k}`}><RhythmSpot rhythm={k} size={spot} animate={animate} /></Cell>
            ))}
            <Cell label="notify"><NotifySpot size={spot} animate={animate} /></Cell>
            {(['stretch', 'water', 'eyes', 'breathe'] as const).map((k) => (
              <Cell key={k} label={`break ${k}`}><BreakSpot kind={k} size={spot} animate={animate} /></Cell>
            ))}
            {(['stats', 'history', 'badges', 'quests'] as const).map((k) => (
              <Cell key={k} label={`empty ${k}`}><EmptySpot kind={k} size={spot} animate={animate} /></Cell>
            ))}
          </div>
        </Section>
      )}

      {show('nook') && (
        <Section id="nook" title="Nook fallback" note="Static room for no-WebGL / 3D off: base room · everything unlocked in rain · snow with a few items.">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))' }}>
            {[
              <NookFallback key="a" steam={0.3} animate={animate} />,
              <NookFallback key="b" weather="rain" steam={1} items={ITEMS.map((i) => i.id)} animate={animate} />,
              <NookFallback key="c" weather="snow" steam={0.7} items={['pothos', 'books', 'cushion', 'fairyLights', 'shelf', 'teaSet', 'kotatsu']} chai="sip" animate={animate} />,
            ].map((el) => (
              <div key={el.key} style={{ aspectRatio: '3 / 2', borderRadius: 22, overflow: 'hidden' }}>
                {el}
              </div>
            ))}
          </div>
        </Section>
      )}

      {view === 'nookbig' && (
        <Section id="nookbig" title="Nook fallback (large)">
          <div style={{ aspectRatio: '3 / 2', borderRadius: 22, overflow: 'hidden', width: '100%' }}>
            <NookFallback weather={(p.get('weather') as 'clear' | 'rain' | 'snow') ?? 'rain'} steam={0.8} items={p.get('items') === 'none' ? [] : ITEMS.map((i) => i.id)} animate={animate} />
          </div>
        </Section>
      )}

      {view === 'appicon' && (
        <Section id="appicon" title="App icons">
          <div style={grid}>
            {(['any', 'maskable', 'kettle', 'favicon', 'faviconChai'] as const).map((v) => (
              <Cell key={v} label={v}>
                <div data-appicon-wrap={v} style={{ width: size, height: size, lineHeight: 0 }}>
                  <AppIconArt variant={v} size={size} />
                </div>
              </Cell>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {[16, 24, 32, 48].map((sz) => (
              <div key={sz} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: 6, background: sz % 16 ? '#2b2440' : '#e9e3dc', borderRadius: 8 }}>
                <AppIconArt variant="favicon" size={sz} />
                <AppIconArt variant="faviconChai" size={sz} />
                <div style={{ width: sz, height: sz, borderRadius: sz * 0.22, overflow: 'hidden', lineHeight: 0 }}>
                  <AppIconArt variant="any" size={sz} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </section>
  );
}
