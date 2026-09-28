/**
 * Badge artwork: one emblem per badge id (src/progress/badges.ts) on a rounded
 * hex medal whose color encodes the tier (I oat → II sky → III matcha →
 * IV berry → V honey-gold). Locked = warm grey with a lock chip. OWNER: art area.
 */
import type { ReactNode } from 'react';
import { BADGE_BY_ID } from '@/progress/badges';
import { LOCKED, TIER } from './palette';
import { ArtSvg, useArtId } from './kit';

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

type Ink = { c: string; k: string; b: string };

/** Rounded regular polygon path. */
function roundedHex(cx: number, cy: number, R: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
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
    d += `${i === 0 ? 'M' : 'L'}${ax.toFixed(2)} ${ay.toFixed(2)} Q${x.toFixed(2)} ${y.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)} `;
  }
  return d + 'Z';
}

const R = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

/** Emblems drawn around (0,0) within ±20. c = cream main, k = tier ink detail, b = tier base (for cut-outs). */
const EMBLEMS: Record<string, (p: Ink) => ReactNode> = {
  'first-brew': ({ c, k }) => (
    <>
      <path d="M-9 -4 C-11 -19 11 -19 9 -4" stroke={c} strokeWidth="3.6" {...R} />
      <path d="M-10 8 C-14 6.5 -16.5 3 -18 -2" stroke={c} strokeWidth="4.6" {...R} />
      <path d="M-14 7 C-14 -3 -8 -8 0 -8 C8 -8 14 -3 14 7 C14 11.5 11 14 7 14 H-7 C-11 14 -14 11.5 -14 7 Z" fill={c} />
      <circle cx="0" cy="-9.5" r="3.4" fill={k} />
      <path d="M-4 9 C-4 3 0 0 5 0 C5 5 1 9 -4 9 Z" fill={k} />
    </>
  ),
  'warm-streak': ({ c, k }) => (
    <>
      <g stroke={c} strokeWidth="3" {...R}>
        <path d="M-9 -9 C-12 -12 -6 -14 -9 -18" />
        <path d="M-2 -9 C-5 -12 1 -15 -2 -19" />
        <path d="M5 -9 C2 -12 8 -14 5 -18" />
      </g>
      <path d="M10 -1 C18 -1 18 10 10 10" stroke={c} strokeWidth="3.6" {...R} />
      <path d="M-15 -5 H11 V6 C11 11 7 15 2 15 H-6 C-11 15 -15 11 -15 6 Z" fill={c} />
      <ellipse cx="-2" cy="-5" rx="13" ry="2.4" fill={k} />
      <path d="M-2 11 C-7 7.5 -9 5.5 -9 3.3 C-9 1.6 -7.6 0.6 -6.2 0.6 C-4.6 0.6 -3.2 1.6 -2 3 C-0.8 1.6 0.6 0.6 2.2 0.6 C3.6 0.6 5 1.6 5 3.3 C5 5.5 3 7.5 -2 11 Z" fill={k} />
    </>
  ),
  'leaf-collector': ({ c, k }) => {
    const leaf = 'M0 0 C-8 -8 -7 -20 0 -26 C7 -20 8 -8 0 0 Z';
    return (
      <g transform="translate(0 14)">
        {[-38, 38, 0].map((r) => (
          <g key={r} transform={`rotate(${r})`}>
            <path d={leaf} fill={c} />
            <path d="M0 -2 V-20" stroke={k} strokeWidth="1.8" {...R} />
          </g>
        ))}
      </g>
    );
  },
  'deep-steep': ({ c, k }) => (
    <>
      <path d="M6 -3 C8 -8 9 -11 11 -13" stroke={k} strokeWidth="1.6" {...R} />
      <rect x="7.5" y="-20" width="9" height="8" rx="1.8" fill={k} />
      <path d="M14 1 C20 1 20 9 13 9" stroke={c} strokeWidth="3.4" {...R} />
      <path d="M-17 -3 H15 V0 C15 9 8 15 -1 15 C-10 15 -17 9 -17 0 Z" fill={c} />
      <rect x="-20" y="15.5" width="38" height="4" rx="2" fill={c} />
      <path d="M-10 4 q3 -2.4 6 0 t6 0" stroke={k} strokeWidth="2" {...R} />
    </>
  ),
  'morning-dew': ({ c, k }) => (
    <>
      <g stroke={c} strokeWidth="3" {...R}>
        {[-150, -120, -90, -60, -30].map((a) => (
          <path key={a} d="M16 0 H20" transform={`translate(0 3) rotate(${a})`} />
        ))}
      </g>
      <path d="M-12 3 A12 12 0 0 1 12 3 Z" fill={c} />
      <rect x="-19" y="4" width="38" height="3.6" rx="1.8" fill={c} />
      <path d="M0 9 C3 12.5 4.5 14.5 4.5 16 A4.5 4.5 0 0 1 -4.5 16 C-4.5 14.5 -3 12.5 0 9 Z" fill={k} />
    </>
  ),
  moonlit: ({ c, k }) => (
    <>
      <path transform="translate(-21.5 -21) scale(1.72)" d="M20.3 14.6A8.7 8.7 0 1 1 9.4 3.7a7.1 7.1 0 0 0 10.9 10.9Z" fill={c} />
      <path d="M11 -17 Q11.9 -13.9 15 -13 Q11.9 -12.1 11 -9 Q10.1 -12.1 7 -13 Q10.1 -13.9 11 -17 Z" fill={c} />
      <circle cx="16" cy="-3" r="1.8" fill={c} />
      <circle cx="-4" cy="3" r="2.2" fill={k} opacity="0.5" />
      <circle cx="2" cy="10" r="1.6" fill={k} opacity="0.5" />
    </>
  ),
  marathon: ({ c, k }) => {
    const mug = (x: number, y: number) => (
      <g key={`${x}${y}`} transform={`translate(${x} ${y})`}>
        <path d="M5 -3 C9.5 -3 9.5 3 5 3" stroke={c} strokeWidth="2.4" {...R} />
        <path d="M-7 -6 H6 V2 C6 5 4 7 1 7 H-4 C-5.5 7 -7 5.5 -7 2 Z" fill={c} />
        <rect x="-7" y="-6.5" width="13" height="2.6" rx="1.3" fill={k} />
      </g>
    );
    return <>{[mug(-9, -8), mug(10, -8), mug(-9, 10), mug(10, 10)]}</>;
  },
  'tea-time': ({ c, k }) => (
    <>
      <path d="M-12 5 C-16 3 -18 -1 -19 -6" stroke={c} strokeWidth="4.2" {...R} />
      <path d="M13 -3 C21 -3 21 10 12 10" stroke={c} strokeWidth="3.6" {...R} />
      <path d="M0 -8 C9 -8 15 -2 15 5 C15 12 9 16 0 16 C-9 16 -15 12 -15 5 C-15 -2 -9 -8 0 -8 Z" fill={c} />
      <path d="M-8 -7 C-7 -11 -3.5 -12.5 0 -12.5 C3.5 -12.5 7 -11 8 -7 Z" fill={k} />
      <circle cx="0" cy="-15" r="2.8" fill={k} />
      <path d="M-5 9 C-5 3 -1 0 4 0 C4 5 0 9 -5 9 Z" fill={k} />
    </>
  ),
  'goal-getter': ({ c, k, b }) => (
    <>
      <circle cx="-2" cy="2" r="17" fill={c} />
      <circle cx="-2" cy="2" r="11" fill={b} />
      <circle cx="-2" cy="2" r="6" fill={c} />
      <path d="M-2 2 L14 -14" stroke={k} strokeWidth="3" {...R} />
      <path d="M13 -14 C13 -19 16 -21 20 -21 C20 -17 18 -14 13 -14 Z" fill={k} />
      <circle cx="-2" cy="2" r="2.6" fill={k} />
    </>
  ),
  intentional: ({ c, k }) => (
    <>
      <rect x="-16" y="-17" width="24" height="33" rx="4" fill={c} />
      <g stroke={k} strokeWidth="2.2" {...R} opacity="0.75">
        <path d="M-11 -9 H3" />
        <path d="M-11 -3 H3" />
        <path d="M-11 3 H-2" />
      </g>
      <g transform="translate(8 6) rotate(40)">
        <rect x="-3.6" y="-16" width="7.2" height="22" rx="2" fill={k} />
        <path d="M-3.6 6 L0 12.5 L3.6 6 Z" fill={k} />
        <rect x="-3.6" y="-16" width="7.2" height="4" rx="1.6" fill={c} opacity="0.55" />
      </g>
    </>
  ),
  'weekend-warmth': ({ c, k }) => (
    <>
      <rect x="-15" y="-15" width="30" height="22" rx="7" fill={c} />
      <rect x="-20" y="-3" width="9" height="18" rx="4.5" fill={c} />
      <rect x="11" y="-3" width="9" height="18" rx="4.5" fill={c} />
      <rect x="-12" y="5" width="24" height="10" rx="3.5" fill={c} />
      <path d="M-11 5.5 H11" stroke={k} strokeWidth="1.6" opacity="0.4" {...R} />
      <path d="M0 3 C-6 -1 -8 -3.5 -8 -6.2 C-8 -8.4 -6.3 -9.8 -4.4 -9.8 C-2.6 -9.8 -1.1 -8.8 0 -7.2 C1.1 -8.8 2.6 -9.8 4.4 -9.8 C6.3 -9.8 8 -8.4 8 -6.2 C8 -3.5 6 -1 0 3 Z" fill={k} />
      <rect x="-15" y="15" width="4" height="4" rx="1.5" fill={c} />
      <rect x="11" y="15" width="4" height="4" rx="1.5" fill={c} />
    </>
  ),
  'nook-builder': ({ c, k, b }) => (
    <>
      <path d="M-13 13 V-4 A13 13 0 0 1 13 -4 V13 Z" fill={c} />
      <path d="M0 -17 V13 M-13 0 H13" stroke={b} strokeWidth="2.6" />
      <circle cx="5" cy="-8" r="3" fill={k} opacity="0.55" />
      <rect x="-18" y="12.5" width="36" height="4.5" rx="2.25" fill={k} />
      <path d="M12 12 V6" stroke={k} strokeWidth="1.8" {...R} />
      <path d="M12 7 C12 2 15 -1 19 -1 C19 3 16 7 12 7 Z" fill={k} />
      <path d="M12 8 C12 4 9.5 1.5 6 1.5 C6 5 8.5 8 12 8 Z" fill={k} />
    </>
  ),
};

function Fallback({ c }: Ink) {
  return <path d="M0 -16 Q2.5 -2.5 16 0 Q2.5 2.5 0 16 Q-2.5 2.5 -16 0 Q-2.5 -2.5 0 -16 Z" fill={c} />;
}

export function Badge({ id, tier = 1, locked, size = 88, className, title, showTier }: BadgeProps) {
  const uid = useArtId();
  const t = Math.max(1, Math.min(5, Math.round(tier)));
  const pal = locked ? LOCKED : TIER[t - 1];
  const def = BADGE_BY_ID[id];
  const withTier = showTier ?? (def ? def.tiers.length > 1 : true);
  const cream = locked ? '#F4EFE9' : '#FFF8EC';
  const draw = EMBLEMS[id];
  const ink: Ink = { c: cream, k: pal.ink, b: pal.base };
  const label = title ?? (def ? `${def.title}${withTier && !locked ? ` ${ROMAN[t - 1]}` : ''}${locked ? ' (locked)' : ''}` : undefined);
  const outer = roundedHex(50, 46, 42, 9);
  const inner = roundedHex(50, 46, 33.5, 7);
  return (
    <ArtSvg viewBox="0 0 100 100" width={size} height={size} className={className} title={label} data-art="badge">
      {/* pressable bottom edge */}
      <path d={outer} fill={pal.ribbon} transform="translate(0 4)" />
      <path d={outer} fill={pal.shade} />
      {/* rim highlight on the lit (top-left) side */}
      <clipPath id={`${uid}-o`}>
        <path d={outer} />
      </clipPath>
      <g clipPath={`url(#${uid}-o)`}>
        <path d={outer} fill={pal.hi} transform="translate(-3 -3)" opacity="0.55" />
        <path d={outer} fill={pal.shade} transform="translate(2 2)" />
      </g>
      <path d={inner} fill={pal.base} />
      <path d="M29 35 Q31 28 38 24" stroke={pal.hi} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9" />
      <g transform={`translate(50 47)${id === 'first-brew' ? ' scale(1.14)' : ''}`} opacity={locked ? 0.75 : 1}>
        {draw ? draw(ink) : <Fallback {...ink} />}
      </g>
      {locked ? (
        <g transform="translate(50 86)">
          <circle r="11" fill={pal.ribbon} />
          <path d="M-3.6 -1.5 V-4 a3.6 3.6 0 0 1 7.2 0 V-1.5" stroke={cream} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <rect x="-5.5" y="-2" width="11" height="8.5" rx="2.4" fill={cream} />
        </g>
      ) : (
        withTier && (
          <g transform="translate(50 86)">
            <rect x={-(8 + ROMAN[t - 1].length * 4)} y="-8.5" width={16 + ROMAN[t - 1].length * 8} height="17" rx="8.5" fill={pal.ink} />
            <text textAnchor="middle" dominantBaseline="central" y="0.8" x="0.9" fontFamily={NUMERAL_FONT} fontWeight="900" fontSize="11.5" fill={cream} letterSpacing="1.8">
              {ROMAN[t - 1]}
            </text>
          </g>
        )
      )}
    </ArtSvg>
  );
}

/** Ids that have bespoke emblems (for galleries / tests). */
export const BADGE_ART_IDS = Object.keys(EMBLEMS);
