/**
 * Object illustrations: streak mug, leaf currency, tea cozy, quest tin, level
 * badge, logo, quest icons. OWNER: art area.
 */
import type { CSSProperties } from 'react';
import { PAL } from './palette';
import { ArtSvg, Shaded, Sparkles, Steam, artStyles as s, useArtId, useLive } from './kit';
import { Icon, type IconName } from './Icon';

const FONT = "var(--font-display, 'Fredoka Variable', 'Fredoka', ui-rounded, system-ui, sans-serif)";

/* ------------------------------------------------------------------ */
/* Streak mug                                                          */
/* ------------------------------------------------------------------ */

export type StreakState = 'warm' | 'atRisk' | 'cold';

export interface StreakMugProps {
  /** warm = streak alive today · atRisk = not yet brewed today · cold = streak lost / zero. */
  state?: StreakState;
  /** Optional streak count printed on the mug. */
  count?: number;
  size?: number;
  animate?: boolean;
  className?: string;
  title?: string;
}

const MUG_BODY = 'M22 50 H90 V82 C90 97 80 106 65 106 H47 C32 106 22 97 22 82 Z';

export function StreakMug({ state = 'warm', count, size = 96, animate = true, className, title }: StreakMugProps) {
  const id = useArtId();
  const live = useLive(animate);
  const cold = state === 'cold';
  const c = cold
    ? { base: PAL.steel, shade: PAL.steelShade, hi: PAL.steelHi, tea: '#8A7A70' }
    : { base: PAL.persimmon, shade: PAL.persimmonShade, hi: PAL.persimmonHi, tea: PAL.tea };
  const digits = count !== undefined ? String(count) : '';
  const fs = digits.length >= 4 ? 19 : digits.length === 3 ? 24 : 30;
  return (
    <ArtSvg viewBox="0 0 120 120" width={size} height={size} live={live} className={className} title={title} data-art="streak-mug">
      {state === 'warm' && <circle className={s.glow} cx="56" cy="66" r="50" fill="var(--art-glow)" />}
      <ellipse cx="56" cy="110" rx="36" ry="5" fill="var(--art-shadow)" />
      {/* handle */}
      <path d="M88 60 C106 58 107 90 88 91" stroke={c.shade} strokeWidth="10" fill="none" strokeLinecap="round" />
      <Shaded d={MUG_BODY} id={`${id}-mb`} base={c.base} shade={c.shade} dx={-8} dy={-4}>
        <rect x="29" y="58" width="7" height="30" rx="3.5" fill={c.hi} opacity="0.8" />
      </Shaded>
      <ellipse cx="56" cy="50" rx="34" ry="7.5" fill={c.shade} />
      <ellipse cx="56" cy="50.8" rx="29" ry="4.8" fill={c.tea} />
      {!cold && <ellipse cx="46" cy="50" rx="7" ry="1.3" fill={PAL.teaHi} opacity="0.8" />}
      {digits ? (
        <text x="56" y="80" textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight="600" fontSize={fs} fill={PAL.white}>
          {digits}
        </text>
      ) : (
        <path d="M47 88 C47 74 57 67 67 67 C67 80 59 88 47 88 Z" fill={PAL.white} opacity="0.92" />
      )}
      {state === 'warm' && <Steam x={56} y={40} scale={1.15} width={6} />}
      {state === 'atRisk' && (
        <>
          <g opacity="0.7">
            <Steam x={56} y={42} scale={0.8} width={6} count={1} />
          </g>
          <g transform="translate(95 30)">
            <circle r="14" fill={PAL.honeyShade} />
            <circle r="12" cx="-1" cy="-1" fill={PAL.honey} />
            <path d="M-1 -8 V-1 L4 2" stroke={PAL.ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        </>
      )}
      {cold && <Sparkles pts={[[98, 30, 8], [84, 16, 5], [18, 34, 5]]} color={PAL.skyHi} />}
    </ArtSvg>
  );
}

/* ------------------------------------------------------------------ */
/* Leaf (currency)                                                     */
/* ------------------------------------------------------------------ */

export interface LeafProps {
  size?: number;
  /** green (default, currency) or gold (bonus / reward). */
  tone?: 'green' | 'gold';
  className?: string;
  title?: string;
  style?: CSSProperties;
}

export function Leaf({ size = 24, tone = 'green', className, title, style }: LeafProps) {
  const c =
    tone === 'gold'
      ? { base: PAL.honey, shade: PAL.honeyShade, hi: PAL.honeyHi, stem: '#C7870E' }
      : { base: PAL.leaf, shade: PAL.leafShade, hi: PAL.leafHi, stem: PAL.leafShade };
  return (
    <ArtSvg viewBox="0 0 48 48" width={size} height={size} className={className} title={title} style={style} data-art="leaf">
      <path d="M11 38 L5 44" stroke={c.stem} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M42 6 C22 6 7 16 7 31 C7 34.5 8.3 37.4 10.4 39.6 C12.6 41.7 15.5 43 19 43 C34 43 42 28 42 6 Z" fill={c.base} />
      <path d="M42 6 C42 28 34 43 19 43 C15.5 43 12.6 41.7 10.4 39.6 Z" fill={c.shade} />
      <path d="M11.5 38.5 C18 30 27 20 37 11" stroke={c.hi} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.9" />
      <ellipse cx="17" cy="22" rx="5.5" ry="2.6" fill={c.hi} opacity="0.75" transform="rotate(-40 17 22)" />
    </ArtSvg>
  );
}

/* ------------------------------------------------------------------ */
/* Tea cozy (streak freeze)                                            */
/* ------------------------------------------------------------------ */

export interface TeaCozyProps {
  size?: number;
  /** Greyed out (none left / used). */
  muted?: boolean;
  animate?: boolean;
  className?: string;
  title?: string;
}

const DOME = 'M18 97 C18 57 36 33 60 33 C84 33 102 57 102 97 Z';

export function TeaCozy({ size = 96, muted, animate = true, className, title }: TeaCozyProps) {
  const id = useArtId();
  const live = useLive(animate);
  const cream = '#F4E7D6';
  const creamShade = '#DCC8B0';
  return (
    <ArtSvg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      live={live}
      className={className}
      title={title}
      style={muted ? { filter: 'grayscale(1)', opacity: 0.55 } : undefined}
      data-art="tea-cozy"
    >
      <ellipse cx="60" cy="110" rx="44" ry="5" fill="var(--art-shadow)" />
      {/* teapot peeking out: spout, handle, foot */}
      <path d="M24 86 L9 67" stroke={creamShade} strokeWidth="11" strokeLinecap="round" />
      <path d="M24 86 L10 68" stroke={cream} strokeWidth="7" strokeLinecap="round" />
      <path d="M98 66 C114 66 114 92 98 92" stroke={creamShade} strokeWidth="8" fill="none" strokeLinecap="round" />
      <rect x="30" y="98" width="60" height="9" rx="4.5" fill={creamShade} />
      {/* knitted dome */}
      <Shaded d={DOME} id={`${id}-dome`} base={PAL.berry} shade={PAL.berryShade} dx={-8} dy={-5}>
        <g stroke={PAL.berryShade} strokeWidth="3" strokeLinecap="round" opacity="0.55" fill="none">
          <path d="M40 92 C38 72 42 56 50 44" />
          <path d="M60 92 V38" />
          <path d="M80 92 C82 72 78 56 70 44" />
        </g>
        <path d="M28 76 C28 58 38 46 50 40" stroke={PAL.berryHi} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />
      </Shaded>
      {/* heart patch */}
      <path d="M60 81 C52 75 48 71 48 66.5 C48 63 51 61 54 61 C56.5 61 58.5 62.5 60 64.5 C61.5 62.5 63.5 61 66 61 C69 61 72 63 72 66.5 C72 71 68 75 60 81 Z" fill={cream} />
      {/* ribbed band */}
      <rect x="13" y="90" width="94" height="15" rx="7.5" fill={PAL.berryShade} />
      <g stroke={PAL.berry} strokeWidth="3" strokeLinecap="round">
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${21 + i * 7.8} 94 v7`} />
        ))}
      </g>
      {/* pompom */}
      <g className={s.float}>
        <circle cx="60" cy="28" r="12" fill={PAL.honeyShade} />
        <circle cx="58.5" cy="26.5" r="10" fill={PAL.honey} />
        <g fill={PAL.honeyShade}>
          <circle cx="62" cy="24" r="1.4" />
          <circle cx="56" cy="30" r="1.4" />
          <circle cx="64" cy="31" r="1.4" />
        </g>
        <circle cx="54.5" cy="22.5" r="2.6" fill={PAL.honeyHi} />
      </g>
    </ArtSvg>
  );
}

/* ------------------------------------------------------------------ */
/* Tea tin (quest reward)                                              */
/* ------------------------------------------------------------------ */

export type TinState = 'closed' | 'opening' | 'open';

export interface TeaTinProps {
  state?: TinState;
  size?: number;
  animate?: boolean;
  className?: string;
  title?: string;
}

const TIN_BODY = 'M33 44 V100 A27 7 0 0 0 87 100 V44 Z';
const TIN_BAND = 'M33 60 A27 7 0 0 0 87 60 V86 A27 7 0 0 1 33 86 Z';
const LID = 'M29 29 V43 A31 7.5 0 0 0 91 43 V29 Z';

/** The lid as a short cylinder cap: side + elliptical top. Drawn around its own geometry. */
function Lid({ id }: { id: string }) {
  return (
    <g>
      <Shaded d={LID} id={id} base={PAL.honey} shade={PAL.honeyShade} dx={-5} dy={-2}>
        <rect x="34" y="31" width="5" height="11" rx="2.5" fill={PAL.honeyHi} opacity="0.9" />
      </Shaded>
      <ellipse cx="60" cy="29" rx="31" ry="7.5" fill={PAL.honeyHi} />
      <ellipse cx="57" cy="28" rx="20" ry="3.4" fill={PAL.white} opacity="0.45" />
    </g>
  );
}

function TinLeaf({ x, y, r = 0, k = 1 }: { x: number; y: number; r?: number; k?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${k})`}>
      <path d="M0 10 C0 -2 8 -9 16 -10 C16 2 9 9 0 10 Z" fill={PAL.leaf} />
      <path d="M0 10 C9 9 16 2 16 -10 Z" fill={PAL.leafShade} />
    </g>
  );
}

/** Tin body (cylinder + label) in the 120 box; `open` shows the dark opening instead of a lid. */
export function TinBody({ id, open }: { id: string; open?: boolean }) {
  return (
    <g>
      <Shaded d={TIN_BODY} id={`${id}-tb`} base={PAL.persimmon} shade={PAL.persimmonShade} dx={-7} dy={-2}>
        <path d={TIN_BAND} fill="#FFEBCB" />
        <path d={TIN_BAND} fill="#EBCB9C" transform="translate(47 0)" />
        <rect x="39" y="50" width="5" height="50" rx="2.5" fill={PAL.persimmonHi} opacity="0.75" />
      </Shaded>
      <path d="M51 82 C51 72 58.5 66 68 66 C68 76 61 82 51 82 Z" fill={PAL.leaf} />
      <path d="M51 82 C61 82 68 76 68 66 Z" fill={PAL.leafShade} />
      {open ? (
        <>
          <ellipse cx="60" cy="44" rx="27" ry="7" fill={PAL.persimmonShade} />
          <ellipse cx="60" cy="44.6" rx="23.5" ry="5" fill="#5E3219" />
        </>
      ) : (
        <ellipse cx="60" cy="44" rx="27" ry="7" fill={PAL.persimmonShade} />
      )}
    </g>
  );
}

export function TeaTin({ state = 'closed', size = 120, animate = true, className, title }: TeaTinProps) {
  const id = useArtId();
  const live = useLive(animate);
  const open = state === 'open';
  const opening = state === 'opening';
  return (
    <ArtSvg viewBox="0 0 120 120" width={size} height={size} live={live} className={className} title={title} data-art="tea-tin">
      {(open || opening) && <circle className={s.glow} cx="60" cy="40" r={open ? 50 : 38} fill="var(--art-glow)" />}
      <ellipse cx="60" cy="111" rx="36" ry="5" fill="var(--art-shadow)" />
      {open && (
        <g className={s.float}>
          <TinLeaf x={34} y={30} r={-38} />
          <TinLeaf x={54} y={14} r={-4} k={1.2} />
          <TinLeaf x={72} y={28} r={34} k={0.95} />
        </g>
      )}
      <TinBody id={id} open={open || opening} />
      {state === 'closed' && <Lid id={`${id}-lid`} />}
      {opening && (
        <>
          <TinLeaf x={44} y={36} r={-24} k={0.75} />
          <g transform="rotate(-16 91 44) translate(0 -10)">
            <Lid id={`${id}-lid`} />
          </g>
        </>
      )}
      {open && (
        <g transform="translate(90 20) rotate(24) scale(0.6) translate(-60 -36)">
          <Lid id={`${id}-lid`} />
        </g>
      )}
      {open && <Sparkles pts={[[16, 34, 7], [106, 56, 6], [22, 70, 4], [98, 80, 4]]} color={PAL.honey} />}
      {opening && <Sparkles pts={[[24, 26, 5], [102, 60, 4]]} color={PAL.honey} />}
      {state === 'closed' && <Sparkles pts={[[102, 20, 5]]} color={PAL.honey} />}
    </ArtSvg>
  );
}

/** Closed tin (body + lid) as a bare group, for embedding in other spots. */
export function TinArt({ id }: { id: string }) {
  return (
    <g>
      <TinBody id={id} />
      <Lid id={`${id}-lid`} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Level badge                                                         */
/* ------------------------------------------------------------------ */

export interface LevelBadgeProps {
  level: number;
  size?: number;
  className?: string;
  title?: string;
}

export function LevelBadge({ level, size = 48, className, title }: LevelBadgeProps) {
  const id = useArtId();
  const txt = String(level);
  const fs = txt.length >= 3 ? 19 : txt.length === 2 ? 25 : 29;
  const scallops = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return <circle key={i} cx={32 + Math.cos(a) * 24} cy={32 + Math.sin(a) * 24} r="7.4" />;
  });
  return (
    <ArtSvg viewBox="0 0 64 64" width={size} height={size} className={className} title={title ?? `Cozy level ${level}`} data-art="level-badge">
      <g fill={PAL.honeyShade}>
        {scallops}
        <circle cx="32" cy="32" r="25" />
      </g>
      <Shaded d="M32 10 A22 22 0 1 1 31.99 10 Z" id={`${id}-lv`} base={PAL.honey} shade="#F2B226" dx={-3} dy={-3}>
        <path d="M14 26 A19 19 0 0 1 30 13" stroke={PAL.honeyHi} strokeWidth="4" strokeLinecap="round" fill="none" />
      </Shaded>
      <text x="32" y="33.5" textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight="700" fontSize={fs} fill="#7A4C06">
        {txt}
      </text>
    </ArtSvg>
  );
}

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */

export interface LogoProps {
  /** full = mark + "Kettle" wordmark; mark = kettle only. */
  variant?: 'full' | 'mark';
  /** Height in px (width follows). */
  size?: number;
  className?: string;
  title?: string;
  animate?: boolean;
}

/** The kettle mark in a 64×64 box (reused by favicon / app icons). */
export function KettleMark({ id }: { id: string }) {
  const body = 'M12.5 46 C12.5 33 20.5 25 32 25 C43.5 25 51.5 33 51.5 46 C51.5 52 47.5 56 41.5 56 H22.5 C16.5 56 12.5 52 12.5 46 Z';
  return (
    <g>
      {/* arched handle */}
      <path d="M19.5 31 C17.5 9 46.5 9 44.5 31" stroke="#9E643D" strokeWidth="5.6" fill="none" strokeLinecap="round" />
      {/* spout rising from the lower left */}
      <path d="M17 47 C12 45 8.5 40 6.5 33.5" stroke={PAL.persimmonShade} strokeWidth="7" fill="none" strokeLinecap="round" />
      <Shaded d={body} id={`${id}-kb`} base={PAL.persimmon} shade={PAL.persimmonShade} dx={-5} dy={-3}>
        <path d="M18.5 43 C18.5 37 21 33 25.5 30.5" stroke={PAL.persimmonHi} strokeWidth="4" strokeLinecap="round" fill="none" />
      </Shaded>
      <rect x="16" y="52.5" width="32" height="5" rx="2.5" fill={PAL.persimmonShade} />
      {/* lid + yuzu knob */}
      <rect x="20" y="25.6" width="24" height="4" rx="2" fill={PAL.persimmonShade} />
      <path d="M22 27 C23.3 23.2 27 21.8 32 21.8 C37 21.8 40.7 23.2 42 27 Z" fill={PAL.persimmon} />
      <path d="M25 25.4 C26.5 23.9 28.5 23.3 30.5 23.2" stroke={PAL.persimmonHi} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M33.2 14.6 C35.4 11 40 10.4 42.6 12.1 C40.3 15.1 36.4 15.9 33.2 14.6 Z" fill={PAL.leaf} />
      <circle cx="32" cy="19" r="5.4" fill={PAL.yuzuShade} />
      <circle cx="31.3" cy="18.3" r="4.5" fill={PAL.yuzu} />
      <circle cx="29.9" cy="16.7" r="1.35" fill={PAL.yuzuHi} />
    </g>
  );
}

export function Logo({ variant = 'full', size = 40, className, title = 'Kettle', animate = true }: LogoProps) {
  const id = useArtId();
  const live = useLive(animate);
  if (variant === 'mark') {
    return (
      <ArtSvg viewBox="0 0 64 64" width={size} height={size} className={className} title={title} live={live} data-art="logo-mark">
        <KettleMark id={id} />
      </ArtSvg>
    );
  }
  return (
    <ArtSvg viewBox="0 0 208 64" width={(size * 208) / 64} height={size} className={className} title={title} live={live} data-art="logo">
      <KettleMark id={id} />
      <text x="66" y="48" fontFamily={FONT} fontWeight="600" fontSize="41" letterSpacing="-0.6" fill="var(--ink, #3B2A20)">
        Kettle
      </text>
    </ArtSvg>
  );
}

/* ------------------------------------------------------------------ */
/* Quest icons                                                         */
/* ------------------------------------------------------------------ */

const QUEST: Record<string, { icon: IconName; bg: string }> = {
  clock: { icon: 'clock', bg: 'var(--persimmon-soft)' },
  cup: { icon: 'cup', bg: 'var(--sky-soft)' },
  sun: { icon: 'sun', bg: 'var(--honey-soft)' },
  moon: { icon: 'moon', bg: '#3C3260' },
  leaf: { icon: 'leaf', bg: 'var(--matcha-soft)' },
  pencil: { icon: 'pencil', bg: 'var(--berry-soft)' },
  break: { icon: 'break', bg: 'var(--matcha-soft)' },
};

export interface QuestIconProps {
  /** Quest.icon value: clock | cup | sun | moon | leaf | pencil | break (unknown → sparkle). */
  icon: string;
  size?: number;
  done?: boolean;
  className?: string;
  title?: string;
}

/** Rounded tile with an illustrated glyph; a matcha check chip when done. */
export function QuestIcon({ icon, size = 48, done, className, title }: QuestIconProps) {
  const q = QUEST[icon] ?? { icon: 'sparkle' as IconName, bg: 'var(--honey-soft)' };
  return (
    <span
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{
        position: 'relative',
        display: 'inline-grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: q.bg,
        flex: 'none',
      }}
    >
      <Icon name={q.icon} size={Math.round(size * 0.62)} tone="color" />
      {done && (
        <svg
          viewBox="0 0 20 20"
          width={size * 0.42}
          height={size * 0.42}
          style={{ position: 'absolute', right: -size * 0.08, bottom: -size * 0.08 }}
          aria-hidden
        >
          <circle cx="10" cy="10" r="10" fill="var(--paper, #fff9f0)" />
          <circle cx="10" cy="10" r="8" fill={PAL.matcha} />
          <path d="M6 10.3l2.6 2.6L14 7.6" stroke={PAL.white} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )}
    </span>
  );
}

