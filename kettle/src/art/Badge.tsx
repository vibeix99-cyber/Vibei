/**
 * Badge artwork: one illustrated medal per badge id (src/progress/badges.ts).
 * OWNER: art area.
 *
 * Anatomy (every badge, so they read as one family):
 *   tier rim  →  cream ring  →  scene field  →  hero illustration  →  numeral chip
 * - The RIM colour encodes the tier (I oat → II sky → III matcha → IV berry →
 *   V honey-gold); III+ grow ribbon tails, IV+ sparkles, V a gold star crest.
 * - The SILHOUETTE encodes the family: hexagon = brewing, circle = time of day,
 *   shield = stamina / goals, scalloped seal = collecting & making.
 * - The FIELD + HERO are unique per badge (own background hue and a full-colour
 *   illustration), so badges separate at a glance even at 56–72 px.
 * Locked = the whole medal drained to warm grey (the picture stays faintly
 * legible as a teaser) with a lock chip in place of the numeral.
 * Flat style: geometric forms, one highlight + one shade per form, no outlines.
 */
import type { ReactNode } from 'react';
import { BADGE_BY_ID } from '@/progress/badges';
import { LOCKED, PAL, TIER } from './palette';
import { ArtSvg, Shaded, star, useArtId } from './kit';
import { KettleMark } from './Objects';

export interface BadgeProps {
  /** Badge id from BADGES (unknown ids get a generic sparkle emblem). */
  id: string;
  /** 1..5 (clamped). */
  tier?: number;
  locked?: boolean;
  size?: number;
  className?: string;
  title?: string;
  /** Show the roman-numeral tier chip (default: when the badge has >1 tier). */
  showTier?: boolean;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
/** Nunito 900 (not Fredoka) so roman numerals stay unambiguous — Fredoka's "IV" reads as "N". */
const NUMERAL_FONT = "var(--font-body, 'Nunito Variable', 'Nunito', ui-rounded, system-ui, sans-serif)";
const DISPLAY_FONT = "var(--font-display, 'Fredoka Variable', 'Fredoka', ui-rounded, system-ui, sans-serif)";

/* ------------------------------------------------------------------ */
/* Frames                                                              */
/* ------------------------------------------------------------------ */

type Shape = 'hex' | 'circle' | 'shield' | 'seal';
const CX = 50;
const CY = 46;
const f = (n: number) => n.toFixed(2);

/** Rounded regular hexagon (point up). */
function roundedHex(R: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
  });
  let d = '';
  for (let i = 0; i < 6; i++) {
    const [px, py] = pts[(i + 5) % 6];
    const [x, y] = pts[i];
    const [nx, ny] = pts[(i + 1) % 6];
    const l1 = Math.hypot(x - px, y - py);
    const l2 = Math.hypot(nx - x, ny - y);
    const ax = x + ((px - x) / l1) * r;
    const ay = y + ((py - y) / l1) * r;
    const bx = x + ((nx - x) / l2) * r;
    const by = y + ((ny - y) / l2) * r;
    d += `${i === 0 ? 'M' : 'L'}${f(ax)} ${f(ay)} Q${f(x)} ${f(y)} ${f(bx)} ${f(by)} `;
  }
  return d + 'Z';
}

function circle(r: number, cy = CY): string {
  return `M${f(CX - r)} ${cy} A${r} ${r} 0 1 0 ${f(CX + r)} ${cy} A${r} ${r} 0 1 0 ${f(CX - r)} ${cy} Z`;
}

/** Scalloped seal: `n` outward arcs between valley points on radius `Rv`. */
function seal(Rv: number, n = 14, bulge = 11.5): string {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    const x = CX + Rv * Math.cos(a);
    const y = CY + Rv * Math.sin(a);
    d += i === 0 ? `M${f(x)} ${f(y)} ` : `A${bulge} ${bulge} 0 0 1 ${f(x)} ${f(y)} `;
  }
  return d + 'Z';
}

/** Heater shield scaled by k about (CX, SY). */
const SY = 45;
function shield(k: number): string {
  const p = (x: number, y: number) => `${f(CX + x * k)} ${f(SY + y * k)}`;
  return (
    `M${p(-30, -40)} Q${p(0, -44.5)} ${p(30, -40)} C${p(36, -40)} ${p(40, -36)} ${p(40, -30)} V${f(SY + 2 * k)} ` +
    `C${p(40, 24)} ${p(22, 38)} ${p(0, 46)} C${p(-22, 38)} ${p(-40, 24)} ${p(-40, 2)} V${f(SY - 30 * k)} C${p(-40, -36)} ${p(-36, -40)} ${p(-30, -40)} Z`
  );
}

interface Frame {
  outer: string;
  ring: string;
  field: string;
  /** Where the hero's local (0,0) sits. */
  ox: number;
  oy: number;
}

const FRAMES: Record<Shape, Frame> = {
  hex: { outer: roundedHex(45, 10), ring: roundedHex(37.5, 7.5), field: roundedHex(34.5, 6.5), ox: CX, oy: CY },
  circle: { outer: circle(42), ring: circle(34.5), field: circle(31.5), ox: CX, oy: CY },
  shield: { outer: shield(1), ring: shield(0.83), field: shield(0.77), ox: CX, oy: 44 },
  seal: { outer: seal(40.5), ring: circle(33.5), field: circle(30.5), ox: CX, oy: CY },
};

/** Short gloss stroke riding the lit (top-left) part of each rim. */
function arcAt(r: number, a0: number, a1: number): string {
  const pt = (a: number) => `${f(CX + r * Math.cos((a * Math.PI) / 180))} ${f(CY + r * Math.sin((a * Math.PI) / 180))}`;
  return `M${pt(a0)} A${r} ${r} 0 0 1 ${pt(a1)}`;
}
const GLOSS: Record<Shape, string> = {
  hex: `M${f(CX - 41 * 0.866 * 0.72)} ${f(CY - 41 * (0.5 + 0.5 * 0.28))} L${f(CX - 41 * 0.866 * 0.35)} ${f(CY - 41 * (0.5 + 0.5 * 0.65))}`,
  circle: arcAt(38.2, 200, 238),
  shield: `M${CX - 36.3} ${SY - 10} V${SY - 27} Q${CX - 36.3} ${SY - 36.3} ${CX - 27} ${SY - 36.6}`,
  seal: arcAt(37, 200, 238),
};

/* ------------------------------------------------------------------ */
/* Illustrations                                                       */
/* ------------------------------------------------------------------ */

/** Hero context: `u` = unique id prefix, `n` = this tier's threshold (for numbers), `locked`. */
type Ctx = { u: string; n?: number; locked: boolean };

interface Art {
  shape: Shape;
  /** Scene background inside the cream ring. */
  field: string;
  /** Clipped to the field (hills, water, ground). */
  scene?: (c: Ctx) => ReactNode;
  hero: (c: Ctx) => ReactNode;
}

const CREAM = '#FFF4E2';
const CREAM_SHADE = '#EBD3B2';
const CREAM_HI = '#FFFFFF';
const R = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

/** A small flat teacup (saucer optional), sitting on y=0, centred on x=0. */
function Teacup({ id, base, shade, hi, w = 20, saucer = true, tea = true }: { id: string; base: string; shade: string; hi?: string; w?: number; saucer?: boolean; tea?: boolean }) {
  const h = w * 0.55;
  const x = w / 2;
  const body = `M${-x} ${-h} H${x} V${-h * 0.55} C${x} ${-h * 0.1} ${x * 0.55} 0 ${x * 0.2} 0 H${-x * 0.2} C${-x * 0.55} 0 ${-x} ${-h * 0.1} ${-x} ${-h * 0.55} Z`;
  return (
    <g>
      <path d={`M${x - 1} ${-h * 0.82} C${x + w * 0.32} ${-h * 0.82} ${x + w * 0.3} ${-h * 0.18} ${x - 2} ${-h * 0.2}`} stroke={shade} strokeWidth={w * 0.13} {...R} />
      <Shaded d={body} id={id} base={base} shade={shade} dx={-w * 0.12} dy={-w * 0.04}>
        {hi && <rect x={-x + w * 0.12} y={-h * 0.75} width={w * 0.12} height={h * 0.45} rx={w * 0.06} fill={hi} />}
      </Shaded>
      <ellipse cx="0" cy={-h} rx={x} ry={w * 0.1} fill={shade} />
      {tea && <ellipse cx="0" cy={-h + w * 0.02} rx={x - w * 0.09} ry={w * 0.055} fill={PAL.tea} />}
      {saucer && <rect x={-x - w * 0.18} y={-w * 0.06} width={w * 1.36} height={w * 0.14} rx={w * 0.07} fill={shade} />}
    </g>
  );
}

/** Kettle's leaf-currency shape (see Objects `Leaf`), centred on (x, y). */
type LeafTone = 'green' | 'light' | 'dark' | 'gold';
const LEAF_TONES: Record<LeafTone, { base: string; shade: string; hi: string; stem: string }> = {
  green: { base: PAL.leaf, shade: PAL.leafShade, hi: PAL.leafHi, stem: PAL.leafShade },
  light: { base: PAL.leafHi, shade: PAL.matcha, hi: '#C4EBA9', stem: PAL.matchaShade },
  dark: { base: PAL.leafShade, shade: '#3D8034', hi: PAL.leaf, stem: '#3D8034' },
  gold: { base: PAL.honey, shade: PAL.honeyShade, hi: PAL.honeyHi, stem: '#C7870E' },
};
function CoinLeaf({ x, y, r, s, tone }: { x: number; y: number; r: number; s: number; tone: LeafTone }) {
  const c = LEAF_TONES[tone];
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-24 -25)`}>
      <path d="M11 38 L5 44" stroke={c.stem} strokeWidth="4.6" strokeLinecap="round" />
      <path d="M42 6 C22 6 7 16 7 31 C7 34.5 8.3 37.4 10.4 39.6 C12.6 41.7 15.5 43 19 43 C34 43 42 28 42 6 Z" fill={c.base} />
      <path d="M42 6 C42 28 34 43 19 43 C15.5 43 12.6 41.7 10.4 39.6 Z" fill={c.shade} />
      <path d="M11.5 38.5 C18 30 27 20 37 11" stroke={c.hi} strokeWidth="2.8" strokeLinecap="round" fill="none" />
    </g>
  );
}

function puff(x: number, y: number, s: number, color: string) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <circle cx="-4" cy="1" r="4" />
      <circle cx="1.5" cy="-2" r="5" />
      <circle cx="6" cy="1.5" r="3.4" />
      <rect x="-8" y="1" width="17" height="4" rx="2" />
    </g>
  );
}

const ART: Record<string, Art> = {
  /* Brewing — hexagons */
  'first-brew': {
    shape: 'hex',
    field: '#A9DBF5',
    hero: ({ u }) => (
      <>
        <ellipse cx="2" cy="25" rx="18" ry="3.2" fill="#7FBFE4" />
        <g transform="translate(-29.5 -31) scale(1.03)">
          <KettleMark id={`${u}-k`} />
        </g>
        {puff(-14, -19, 0.9, CREAM_HI)}
        <path d={star(19, -18, 5.5)} fill={CREAM_HI} />
        <path d={star(24, -6, 3)} fill={CREAM_HI} />
      </>
    ),
  },
  'deep-steep': {
    shape: 'hex',
    field: '#4C82BD',
    scene: () => (
      <g>
        <path d="M-40 14 q6 -4 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 V60 H-40 Z" fill="#3F71AB" />
        <path d="M-40 24 q6 -4 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 V60 H-40 Z" fill="#35639A" />
      </g>
    ),
    hero: ({ u }) => {
      const body = 'M-12 -13 H12 C15.5 -13 17 -11 17 -7.5 V13 C17 19 13 22 7 22 H-7 C-13 22 -17 19 -17 13 V-7.5 C-17 -11 -15.5 -13 -12 -13 Z';
      return (
        <>
          {/* spout + handle */}
          <path d="M-15 6 C-21 5 -24 0 -26 -7" stroke={CREAM_SHADE} strokeWidth="5.5" {...R} />
          <path d="M16 -6 C26 -7 26 14 16 13" stroke={CREAM_SHADE} strokeWidth="4.4" {...R} />
          <Shaded d={body} id={`${u}-dp`} base={CREAM} shade={CREAM_SHADE} dx={-3.5} dy={-1.5} />
          {/* deep tea window with depth ticks */}
          <rect x="-11.5" y="-6" width="21" height="23.5" rx="5" fill={PAL.tea} />
          <path d="M-11.5 -2 q2.6 -2.2 5.25 0 t5.25 0 t5.25 0 t5.25 0 V-6 H-11.5 Z" fill={PAL.teaHi} />
          <g stroke={CREAM} strokeWidth="1.8" {...R} opacity="0.85">
            <path d="M5.5 3.5 H8" />
            <path d="M5.5 8.5 H8" />
            <path d="M5.5 13.5 H8" />
          </g>
          {/* lid */}
          <rect x="-14.5" y="-16.5" width="29" height="5" rx="2.5" fill={CREAM_SHADE} />
          <path d="M-9 -15.5 C-8 -20 -4.5 -21.5 0 -21.5 C4.5 -21.5 8 -20 9 -15.5 Z" fill={CREAM} />
          <circle cx="0" cy="-23" r="2.8" fill={CREAM_SHADE} />
          {/* bubbles */}
          <g fill={CREAM_HI} opacity="0.85">
            <circle cx="22" cy="-17" r="3" />
            <circle cx="26" cy="-25" r="1.8" />
            <circle cx="-23" cy="-19" r="2.2" />
          </g>
        </>
      );
    },
  },
  'tea-time': {
    shape: 'hex',
    field: '#F7B6C3',
    hero: ({ u }) => {
      const pot = 'M0 -11 C9 -11 14 -5 14 2 C14 9 8 13 0 13 C-8 13 -14 9 -14 2 C-14 -5 -9 -11 0 -11 Z';
      return (
        <>
          <ellipse cx="-11" cy="25" rx="13" ry="2.6" fill="#E893A6" />
          {/* pour stream */}
          <path d="M-18.5 -1.5 C-22 4 -15 7 -13 14" stroke={PAL.tea} strokeWidth="3" {...R} />
          <g transform="translate(-11 24)">
            <Teacup id={`${u}-tc`} base={CREAM} shade={CREAM_SHADE} hi={CREAM_HI} w={19} />
          </g>
          <g transform="translate(7 -7) rotate(-28)">
            <path d="M-12 4 C-18 3 -21 -1 -24 -8" stroke={PAL.matchaShade} strokeWidth="5" {...R} />
            <path d="M13 -5 C22 -5 22 9 12 9" stroke={PAL.matchaShade} strokeWidth="3.6" {...R} />
            <Shaded d={pot} id={`${u}-tp`} base={PAL.matcha} shade={PAL.matchaShade} dx={-3} dy={-3}>
              <path d="M-9 -1 C-9 -5 -6.5 -7.5 -3 -8.5" stroke={PAL.matchaHi} strokeWidth="3" {...R} />
            </Shaded>
            <path d="M-8 -10 C-7 -14 -3.5 -15.5 0 -15.5 C3.5 -15.5 7 -14 8 -10 Z" fill={PAL.matchaShade} />
            <circle cx="0" cy="-17.5" r="2.8" fill={PAL.matchaShade} />
            <path d="M-3 7 C-3 2 0 -0.5 4 -0.5 C4 3.5 1 7 -3 7 Z" fill={CREAM} opacity="0.9" />
          </g>
        </>
      );
    },
  },

  /* Time of day — circles */
  'morning-dew': {
    shape: 'circle',
    field: '#F9B99D',
    scene: () => (
      <g>
        <circle cx="0" cy="6" r="15" fill="#FFD84F" />
        <g stroke="#FFE68A" strokeWidth="3.2" {...R}>
          {[-160, -130, -100, -80, -50, -20].map((a) => (
            <path key={a} d="M19 0 H24" transform={`translate(0 6) rotate(${a})`} />
          ))}
        </g>
        <ellipse cx="-16" cy="30" rx="30" ry="16" fill="#8CCB6E" />
        <ellipse cx="20" cy="32" rx="28" ry="15" fill="#6FB25C" />
      </g>
    ),
    hero: ({ u }) => (
      <>
        <g transform="translate(1 22)">
          <Teacup id={`${u}-md`} base={PAL.sky} shade={PAL.skyShade} hi={PAL.skyHi} w={24} />
        </g>
        {/* dew drop */}
        <g transform="translate(-19 -3)">
          <path d="M0 -8 C3.5 -3.5 5.5 -1 5.5 1.8 A5.5 5.5 0 0 1 -5.5 1.8 C-5.5 -1 -3.5 -3.5 0 -8 Z" fill={PAL.skyHi} />
          <ellipse cx="-2" cy="1" rx="1.4" ry="2" fill={CREAM_HI} />
        </g>
      </>
    ),
  },
  moonlit: {
    shape: 'circle',
    field: '#3C3260',
    hero: ({ u }) => (
      <>
        <g fill={CREAM_HI}>
          <path d={star(-17, -17, 4.5)} />
          <path d={star(18, -20, 3.2)} />
          <circle cx="-4" cy="-24" r="1.4" />
          <circle cx="23" cy="-6" r="1.3" />
          <circle cx="-24" cy="-4" r="1.2" />
        </g>
        {/* crescent cradle (opening upward) */}
        <g transform="translate(0 -3)">
          <Shaded d="M-22 -3.6 A24 24 0 1 0 22 -3.6 A22 22 0 1 1 -22 -3.6 Z" id={`${u}-mn`} base="#FFD25A" shade="#EFB23A" dx={-2.5} dy={-2.5}>
            <path d="M-19 4 C-16 11 -11 15 -5 17" stroke="#FFE68A" strokeWidth="2.4" {...R} />
          </Shaded>
        </g>
        <g transform="translate(1 12.5)">
          <Teacup id={`${u}-ml`} base={CREAM} shade={CREAM_SHADE} hi={CREAM_HI} w={17} saucer={false} />
        </g>
        <path d="M0 -2 C-3 -5 3 -8 0 -12" stroke={CREAM_HI} strokeWidth="2.4" opacity="0.8" {...R} />
      </>
    ),
  },
  'weekend-warmth': {
    shape: 'circle',
    field: '#D3C2F2',
    hero: ({ u }) => {
      const head = 'M0 -20.5 C10.5 -20.5 14.5 -18 14.5 -10 V1 C14.5 8.5 8.5 12 0 12 C-8.5 12 -14.5 8.5 -14.5 1 V-10 C-14.5 -18 -10.5 -20.5 0 -20.5 Z';
      const blanket = 'M-26 26 C-27 12 -20 2 -8 1 H8 C20 2 27 12 26 26 Z';
      return (
        <>
          {/* Chai */}
          <circle cx="-11" cy="-17.5" r="3.4" fill="#9A6440" />
          <circle cx="-11.4" cy="-17.9" r="1.5" fill="#6E4329" />
          <circle cx="11" cy="-17.5" r="3.4" fill="#9A6440" />
          <circle cx="11.4" cy="-17.9" r="1.5" fill="#6E4329" />
          <Shaded d={head} id={`${u}-ch`} base="#C98B5B" shade="#A96F47" dx={-4} dy={-2}>
            <path d="M-20 -3 C-10 -8.5 10 -8.5 20 -3 V20 H-20 Z" fill="#B0764D" />
          </Shaded>
          <g stroke="#2A1B13" strokeWidth="2.1" {...R}>
            <path d="M-9.5 -10 Q-6.8 -7.2 -4.1 -10" />
            <path d="M4.1 -10 Q6.8 -7.2 9.5 -10" />
          </g>
          <ellipse cx="-9.6" cy="-4.8" rx="2.5" ry="1.5" fill="#F0877F" opacity="0.85" />
          <ellipse cx="9.6" cy="-4.8" rx="2.5" ry="1.5" fill="#F0877F" opacity="0.85" />
          <path d="M-5.5 -4.6 C-5.5 -6.3 -3 -6.8 0 -6.8 C3 -6.8 5.5 -6.3 5.5 -4.6 C5.5 -2.6 3 -1.8 0 -1.8 C-3 -1.8 -5.5 -2.6 -5.5 -4.6 Z" fill="#352219" />
          <ellipse cx="-2" cy="-5.2" rx="1.6" ry="0.7" fill="#6B4A3A" />
          <path d="M-2.4 0.4 q1.2 1.3 2.4 0 q1.2 1.3 2.4 0" stroke="#4A2B1D" strokeWidth="1.2" {...R} />
          {/* yuzu */}
          <path d="M1 -26 C3.5 -30.5 8.5 -31 11 -29 C8.5 -25.5 4.5 -24.6 1 -26 Z" fill={PAL.leaf} />
          <circle cx="0" cy="-24" r="5.6" fill={PAL.yuzuShade} />
          <circle cx="-0.8" cy="-24.8" r="4.7" fill={PAL.yuzu} />
          <circle cx="-2.4" cy="-26.4" r="1.4" fill={PAL.yuzuHi} />
          {/* blanket */}
          <Shaded d={blanket} id={`${u}-bl`} base={PAL.berry} shade={PAL.berryShade} dx={-3} dy={-2}>
            <g stroke={PAL.berryHi} strokeWidth="3" opacity="0.7">
              <path d="M-9 0 V30" />
              <path d="M9 0 V30" />
              <path d="M-30 15 H30" />
            </g>
          </Shaded>
          <path d="M-14 3 C-6 7 6 7 14 3" stroke={PAL.berryShade} strokeWidth="5" {...R} />
          <path d="M-14 2 C-6 6 6 6 14 2" stroke={PAL.berryHi} strokeWidth="2.2" {...R} />
          <g transform="translate(0 20)">
            <Teacup id={`${u}-wm`} base={PAL.honey} shade={PAL.honeyShade} hi={PAL.honeyHi} w={13} saucer={false} />
          </g>
          <circle cx="-7.5" cy="16" r="2.6" fill="#8A5536" />
          <circle cx="7.5" cy="16" r="2.6" fill="#8A5536" />
        </>
      );
    },
  },

  /* Stamina & goals — shields */
  'warm-streak': {
    shape: 'shield',
    field: '#F7A064',
    hero: ({ u, n, locked }) => {
      const body = 'M-15 -7 H13 V8 C13 16 8 20 0 20 H-2 C-10 20 -15 16 -15 8 Z';
      const digits = !locked && n != null ? String(n) : '';
      return (
        <g transform="translate(1 1) scale(1.1)">
          <ellipse cx="-1" cy="21.5" rx="17" ry="2.8" fill="#E0834A" />
          <g stroke={CREAM_HI} strokeWidth="3.4" {...R}>
            <path d="M-8 -11 C-11 -14 -5 -17 -8 -22" />
            <path d="M-1 -11 C-4 -15 2 -18 -1 -24" />
            <path d="M6 -11 C3 -14 9 -17 6 -22" />
          </g>
          <path d="M12 -2 C21 -2 21 12 12 12" stroke={CREAM_SHADE} strokeWidth="4.4" {...R} />
          <Shaded d={body} id={`${u}-ws`} base={CREAM} shade={CREAM_SHADE} dx={-3.5} dy={-1.5} />
          <ellipse cx="-1" cy="-7" rx="14" ry="3.2" fill={CREAM_SHADE} />
          <ellipse cx="-1" cy="-6.6" rx="11.5" ry="2" fill={PAL.tea} />
          {digits ? (
            <text x="-1.5" y="7" textAnchor="middle" dominantBaseline="central" fontFamily={DISPLAY_FONT} fontWeight="700" fontSize={digits.length >= 3 ? 11 : 14} fill={PAL.persimmonShade}>
              {digits}
            </text>
          ) : (
            <path d="M-1.5 12 C-6.5 8.5 -8.5 6.5 -8.5 4.3 C-8.5 2.6 -7.1 1.6 -5.7 1.6 C-4.1 1.6 -2.7 2.6 -1.5 4 C-0.3 2.6 1.1 1.6 2.7 1.6 C4.1 1.6 5.5 2.6 5.5 4.3 C5.5 6.5 3.5 8.5 -1.5 12 Z" fill={PAL.persimmon} />
          )}
        </g>
      );
    },
  },
  marathon: {
    shape: 'shield',
    field: '#BCE0A3',
    hero: ({ u }) => {
      const cups: [number, string, string, string][] = [
        [0, PAL.persimmon, PAL.persimmonShade, PAL.persimmonHi],
        [2.5, PAL.sky, PAL.skyShade, PAL.skyHi],
        [-1.5, PAL.berry, PAL.berryShade, PAL.berryHi],
        [1.5, PAL.honey, PAL.honeyShade, PAL.honeyHi],
      ];
      return (
        <>
          <ellipse cx="0" cy="27" rx="17" ry="2.8" fill="#9CCB80" />
          {cups.map(([dx, b, s, h], i) => (
            <g key={i} transform={`translate(${dx - 2} ${26 - i * 12})`}>
              <Teacup id={`${u}-mr${i}`} base={b} shade={s} hi={h} w={21} tea={i === 3} />
            </g>
          ))}
          <path d="M-2 -25 C-5 -28 1 -31 -2 -35" stroke={CREAM_HI} strokeWidth="2.6" {...R} />
          <path d="M19 -14 l3 -2 M20 -6 h4 M-22 -14 l-3 -2 M-23 -6 h-4" stroke="#6FA85A" strokeWidth="2.4" {...R} />
        </>
      );
    },
  },
  'goal-getter': {
    shape: 'shield',
    field: '#FFD466',
    hero: ({ u }) => {
      const pot = 'M-17 -4 H17 V4 C17 15 10 21 0 21 C-10 21 -17 15 -17 4 Z';
      return (
        <>
          <ellipse cx="0" cy="24" rx="19" ry="3" fill="#EDB63F" />
          {/* ear handles */}
          <path d="M-16 1 C-24 0 -24 10 -16 10" stroke={PAL.skyShade} strokeWidth="4" {...R} />
          <path d="M16 1 C24 0 24 10 16 10" stroke={PAL.skyShade} strokeWidth="4" {...R} />
          {/* brimming tea dome + drip */}
          <path d="M-16 -6 C-15 -14 15 -14 16 -6 Z" fill={PAL.tea} />
          <path d="M-8 -10.5 C-4 -12 2 -12.2 6 -11" stroke={PAL.teaHi} strokeWidth="2.2" {...R} />
          <path d="M12 -5 C14 -1 13.5 3 12.2 5 C11 3 10.8 -1 12 -5 Z" fill={PAL.tea} />
          <Shaded d={pot} id={`${u}-gg`} base={PAL.sky} shade={PAL.skyShade} dx={-3.5} dy={-2}>
            <rect x="-13" y="-1" width="4" height="12" rx="2" fill={PAL.skyHi} />
          </Shaded>
          <rect x="-19" y="-7" width="38" height="5" rx="2.5" fill={PAL.skyShade} />
          <path d="M-7 7.5 L-2 12 L8 2" stroke={CREAM_HI} strokeWidth="4" {...R} />
          <path d={star(-19, -19, 5)} fill={CREAM_HI} />
          <path d={star(18, -20, 3.6)} fill={CREAM_HI} />
        </>
      );
    },
  },

  /* Collecting & making — scalloped seals */
  'leaf-collector': {
    shape: 'seal',
    field: '#EFD2A2',
    hero: () => {
      // A heap of Kettle's leaf currency, the newest one gold on top. [x, y, rotation, gold]
      const heap: [number, number, number, LeafTone][] = [
        [-13, 13, -28, 'dark'],
        [13, 14, 62, 'light'],
        [0, 15, 14, 'green'],
        [-7, 3, 40, 'light'],
        [8, 3, -14, 'dark'],
        [0, -8, 8, 'gold'],
      ];
      return (
        <>
          <ellipse cx="0" cy="23" rx="23" ry="3.4" fill="#D8B784" />
          {heap.map(([x, y, r, tone], i) => (
            <CoinLeaf key={i} x={x} y={y} r={r} s={0.5} tone={tone} />
          ))}
          <path d={star(-17, -14, 4)} fill={CREAM_HI} />
          <path d={star(17, -19, 2.8)} fill={CREAM_HI} />
        </>
      );
    },
  },
  intentional: {
    shape: 'seal',
    field: '#A5DCCB',
    hero: ({ u }) => (
      <>
        <g transform="rotate(-8)">
          <Shaded d="M-16 -19 H7 C9 -19 10 -18 10 -16 V16 C10 18 9 19 7 19 H-16 C-18 19 -19 18 -19 16 V-16 C-19 -18 -18 -19 -16 -19 Z" id={`${u}-nt`} base={CREAM} shade={CREAM_SHADE} dx={-2.5} dy={-2} />
          <g stroke="#C8B08F" strokeWidth="2.4" {...R}>
            <path d="M-14 -11 H4" />
            <path d="M-14 -4 H4" />
            <path d="M-14 3 H-3" />
          </g>
          <path d="M-14 10.5 q2 -3 4 0 t4 0 t4 0" stroke={PAL.persimmon} strokeWidth="2.4" {...R} />
        </g>
        <g transform="translate(9 3) rotate(35)">
          <rect x="-4.5" y="-20" width="9" height="6" rx="2.5" fill={PAL.berry} />
          <rect x="-4.5" y="-15" width="9" height="3.5" fill={PAL.steelHi} />
          <rect x="-4.5" y="-11.5" width="9" height="22" fill={PAL.honey} />
          <rect x="1.5" y="-11.5" width="3" height="22" fill={PAL.honeyShade} />
          <rect x="-3.5" y="-11.5" width="2" height="22" fill={PAL.honeyHi} />
          <path d="M-4.5 10.5 L0 19.5 L4.5 10.5 Z" fill="#F2C99A" />
          <path d="M-1.6 16.2 L0 19.5 L1.6 16.2 Z" fill={PAL.ink} />
        </g>
      </>
    ),
  },
  'nook-builder': {
    shape: 'seal',
    field: '#A9B4EE',
    hero: ({ u }) => (
      <>
        <ellipse cx="0" cy="21" rx="22" ry="3.2" fill="#8C98DB" />
        {puff(11, -23, 0.62, CREAM_HI)}
        <rect x="7" y="-19" width="6" height="10" rx="1.5" fill={PAL.persimmonShade} />
        <Shaded d="M-14 -2 H14 V17 C14 19 13 20 11 20 H-11 C-13 20 -14 19 -14 17 Z" id={`${u}-nh`} base={CREAM} shade={CREAM_SHADE} dx={-3} dy={-1} />
        <path d="M-18 0 L0 -16 L18 0 Z" fill={PAL.persimmon} stroke={PAL.persimmon} strokeWidth="4" strokeLinejoin="round" />
        <path d="M-18 0 L0 -16 L2 -14.2 L-15 1 Z" fill={PAL.persimmonHi} stroke={PAL.persimmonHi} strokeWidth="1" strokeLinejoin="round" opacity="0.8" />
        {/* glowing round window + arched door */}
        <circle cx="-5" cy="7" r="6" fill={PAL.yuzuHi} opacity="0.55" />
        <circle cx="-5" cy="7" r="4.4" fill={PAL.yuzu} />
        <path d="M-5 2.6 V11.4 M-9.4 7 H-0.6" stroke={PAL.yuzuShade} strokeWidth="1.3" />
        <path d="M4 20 V10 A4 4 0 0 1 12 10 V20 Z" fill={PAL.tea} />
        <circle cx="10" cy="15" r="0.9" fill={PAL.honey} />
        {/* potted sprout */}
        <rect x="-22" y="13" width="7" height="7" rx="1.8" fill={PAL.persimmonShade} />
        <path d="M-18.5 13 C-18.5 8 -16 6 -13 6 C-13 9.5 -15 12 -18.5 13 Z" fill={PAL.leaf} />
        <path d="M-18.5 13 C-18.5 9 -21 7 -24 7 C-24 10 -22 12.5 -18.5 13 Z" fill={PAL.leafShade} />
      </>
    ),
  },
};

const FALLBACK: Art = {
  shape: 'hex',
  field: '#F2D9B6',
  hero: () => <path d={star(0, 0, 18)} fill={CREAM_HI} />,
};

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

/** Warm-grey "drained" look for locked badges (keeps the picture faintly legible). */
const LOCK_MATRIX = [0.1, 0.33, 0.04, 0, 0.42, 0.1, 0.33, 0.04, 0, 0.38, 0.1, 0.33, 0.04, 0, 0.33, 0, 0, 0, 1, 0].join(' ');

/** Tier IV+ rim sparkles [x, y, r]; the third is tier V only. */
const SPARKS: [number, number, number][] = [
  [81, 15, 6],
  [91, 29, 3.2],
  [11, 64, 4.2],
];

function darken(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * (1 - t));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

export function Badge({ id, tier = 1, locked, size = 88, className, title, showTier }: BadgeProps) {
  const uid = useArtId();
  const t = Math.max(1, Math.min(5, Math.round(tier)));
  const pal = locked ? LOCKED : TIER[t - 1];
  const def = BADGE_BY_ID[id];
  const art = ART[id] ?? FALLBACK;
  const fr = FRAMES[art.shape];
  const withTier = showTier ?? (def ? def.tiers.length > 1 : true);
  const cream = locked ? '#F4EFE9' : '#FFF8EC';
  const label = title ?? (def ? `${def.title}${withTier && !locked ? ` ${ROMAN[t - 1]}` : ''}${locked ? ' (locked)' : ''}` : undefined);
  const ctx: Ctx = { u: uid, n: def?.tiers[Math.min(t, def.tiers.length) - 1], locked: !!locked };
  const flourish = !locked && withTier ? t : 0;
  const numeral = ROMAN[t - 1];
  const chipHalf = 8 + numeral.length * 4;
  return (
    <ArtSvg viewBox="0 0 100 100" width={size} height={size} className={className} title={label} data-art="badge">
      <defs>
        <clipPath id={`${uid}-o`}>
          <path d={fr.outer} />
        </clipPath>
        <clipPath id={`${uid}-ol`}>
          <path d={fr.outer} transform="translate(-1.8 -2.4)" />
        </clipPath>
        <clipPath id={`${uid}-f`}>
          <path d={fr.field} />
        </clipPath>
        {locked && (
          <filter id={`${uid}-lk`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={LOCK_MATRIX} />
          </filter>
        )}
      </defs>

      {/* Tier V crest star (behind the rim so it reads as part of the medal) */}
      {flourish >= 5 && (
        <g transform={`translate(50 ${art.shape === 'hex' ? 4 : 6})`}>
          <path d={star(0, 0.8, 9.5)} fill={pal.ribbon} />
          <path d={star(0, 0, 9)} fill={PAL.yuzuHi} />
        </g>
      )}

      {/* pressable bottom edge */}
      <path d={fr.outer} fill={pal.ribbon} transform="translate(0 3.5)" />
      {/* tier rim: base with a highlight crescent (top-left) and a shade crescent (bottom-right) */}
      <g clipPath={`url(#${uid}-o)`}>
        <path d={fr.outer} fill={pal.shade} />
        <g clipPath={`url(#${uid}-ol)`}>
          <path d={fr.outer} fill={pal.hi} />
          <path d={fr.outer} fill={pal.base} transform="translate(1.4 1.8)" />
        </g>
      </g>
      <path d={fr.ring} fill={cream} />

      <g filter={locked ? `url(#${uid}-lk)` : undefined}>
        {/* scene field with a soft inset shade along the top */}
        <path d={fr.field} fill={darken(art.field, 0.14)} />
        <g clipPath={`url(#${uid}-f)`}>
          <path d={fr.field} fill={art.field} transform="translate(0 2.4)" />
          {art.scene && <g transform={`translate(${fr.ox} ${fr.oy})`}>{art.scene(ctx)}</g>}
        </g>
        <g transform={`translate(${fr.ox} ${fr.oy})`}>{art.hero(ctx)}</g>
      </g>
      {locked && <path d={fr.field} fill="#EFE8DF" opacity="0.28" />}

      {/* rim gloss */}
      <path d={GLOSS[art.shape]} stroke={pal.hi} strokeWidth="2.6" strokeLinecap="round" fill="none" opacity={locked ? 0.6 : 0.95} />

      {/* Tier IV+: sparkles on the rim */}
      {flourish >= 4 && (
        <g>
          {(flourish >= 5 ? SPARKS : SPARKS.slice(0, 2)).map(([x, y, r]) => (
            <g key={x}>
              <path d={star(x + 0.6, y + 1, r + 1.4)} fill={pal.ribbon} />
              <path d={star(x, y, r)} fill="#FFFFFF" />
            </g>
          ))}
        </g>
      )}

      {locked ? (
        <g transform="translate(50 86)">
          <circle r="11.5" fill={pal.ink} />
          <path d="M-3.6 -1.5 V-4 a3.6 3.6 0 0 1 7.2 0 V-1.5" stroke={cream} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <rect x="-5.5" y="-2" width="11" height="8.5" rx="2.4" fill={cream} />
        </g>
      ) : (
        withTier && (
          <g transform="translate(50 86)">
            {/* Tier III+: ribbon tails */}
            {flourish >= 3 && (
              <g fill={pal.ribbon}>
                <path d={`M${-chipHalf + 6} -6 H${-chipHalf - 9} L${-chipHalf - 5} 0 L${-chipHalf - 9} 6 H${-chipHalf + 6} Z`} />
                <path d={`M${chipHalf - 6} -6 H${chipHalf + 9} L${chipHalf + 5} 0 L${chipHalf + 9} 6 H${chipHalf - 6} Z`} />
              </g>
            )}
            <rect x={-chipHalf} y="-8.5" width={chipHalf * 2} height="17" rx="8.5" fill={pal.ink} />
            <text textAnchor="middle" dominantBaseline="central" y="0.8" x="0.9" fontFamily={NUMERAL_FONT} fontWeight="900" fontSize="11.5" fill={cream} letterSpacing="1.8">
              {numeral}
            </text>
          </g>
        )
      )}
    </ArtSvg>
  );
}

/** Ids that have bespoke artwork (for galleries / tests). */
export const BADGE_ART_IDS = Object.keys(ART);
