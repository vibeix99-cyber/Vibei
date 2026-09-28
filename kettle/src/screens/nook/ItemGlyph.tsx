/**
 * Flat item art for the nook collection grid — one small illustration per
 * ITEMS id, drawn like the rest of the 2D art (rounded geometric shapes, one
 * highlight + one shade, light from the top-left). Locked items render as a
 * soft silhouette.
 */
import { useId, type ReactNode } from 'react';
import { PAL } from '@/art';

const P = {
  ...PAL,
  terracotta: '#D9774E',
  terracottaHi: '#EE9570',
  wood: '#C98B55',
  woodHi: '#E2AE74',
  woodShade: '#A86B3D',
  espresso: '#4A3226',
  sage: '#9DBE8C',
  sageShade: '#7FA570',
  sageHi: '#BCD6AE',
  lilac: '#8C7DB8',
  catFur: '#F6EBDD',
  catShade: '#E3D3C0',
};

function Leaf({ x, y, r = 0, s = 1, fill = P.leaf }: { x: number; y: number; r?: number; s?: number; fill?: string }) {
  return <path d="M0 -6 C4.5 -6 6 -1.5 0 6 C-6 -1.5 -4.5 -6 0 -6Z" fill={fill} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} />;
}

const GLYPHS: Record<string, () => ReactNode> = {
  pothos: () => (
    <>
      <path d="M33 29 Q41 33 39 44" stroke={P.leafShade} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M15 29 Q9 34 11 42" stroke={P.leafShade} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M15 30 H33 L30.5 43 Q30 45 28 45 H20 Q18 45 17.5 43 Z" fill={P.terracotta} />
      <path d="M26 30 H33 L30.5 43 Q30 45 28 45 H26 Z" fill="#C4623D" opacity="0.55" />
      <rect x="13" y="27" width="22" height="5" rx="2.5" fill={P.terracottaHi} />
      <Leaf x={18} y={20} r={-35} s={1.1} />
      <Leaf x={24} y={16} r={0} s={1.25} fill={P.leafHi} />
      <Leaf x={30} y={20} r={35} s={1.1} fill={P.leafShade} />
      <Leaf x={40} y={36} r={20} s={0.8} />
      <Leaf x={38} y={43} r={-15} s={0.75} fill={P.leafShade} />
      <Leaf x={10} y={37} r={-25} s={0.8} fill={P.leafShade} />
    </>
  ),
  books: () => (
    <>
      <rect x="7" y="34" width="34" height="9" rx="2.5" fill={P.skyShade} />
      <rect x="10" y="36.5" width="28" height="4" rx="1" fill={P.paper} />
      <rect x="11" y="25" width="29" height="9" rx="2.5" fill={P.persimmon} />
      <rect x="14" y="27.5" width="23" height="4" rx="1" fill={P.paper} />
      <rect x="9" y="16" width="27" height="9" rx="2.5" fill={P.sage} />
      <rect x="12" y="18.5" width="21" height="4" rx="1" fill={P.paper} />
      <rect x="9" y="16" width="5" height="9" rx="2" fill={P.sageShade} />
      <rect x="11" y="25" width="5" height="9" rx="2" fill={P.persimmonShade} />
      <rect x="7" y="34" width="5" height="9" rx="2" fill="#2F7AAE" />
      <rect x="27" y="7" width="6" height="10" rx="2" fill={P.berry} />
      <rect x="28.2" y="4" width="1.6" height="5" rx="0.8" fill={P.honey} />
      <rect x="30.2" y="3" width="1.6" height="6" rx="0.8" fill={P.sky} />
    </>
  ),
  cushion: () => (
    <>
      <ellipse cx="24" cy="33" rx="18" ry="9.5" fill={P.honeyShade} />
      <ellipse cx="24" cy="30" rx="18" ry="9.5" fill={P.honey} />
      <ellipse cx="17" cy="26.5" rx="6.5" ry="2.6" fill={P.honeyHi} />
      <path d="M8 31 Q24 38 40 31" stroke={P.honeyShade} strokeWidth="1.4" fill="none" opacity="0.7" />
      <circle cx="24" cy="30" r="2.4" fill={P.persimmon} />
    </>
  ),
  fairyLights: () => (
    <>
      <path d="M3 12 Q13.5 24 24 12 Q34.5 24 45 12" stroke={P.espresso} strokeWidth="1.6" fill="none" />
      {(
        [
          [8.5, 18, P.honey],
          [15, 21, P.berry],
          [24, 13.5, P.sky],
          [33, 21, P.honey],
          [39.5, 18, P.persimmon],
        ] as const
      ).map(([x, y, c]) => (
        <g key={x}>
          <circle cx={x} cy={y + 4} r="6" fill={c} opacity="0.25" />
          <rect x={x - 2.4} y={y} width="4.8" height="8" rx="2.4" fill={c} />
          <rect x={x - 1.6} y={y - 1.5} width="3.2" height="2.6" rx="0.8" fill={P.espresso} />
          <circle cx={x - 0.8} cy={y + 2.6} r="1" fill="#fff" opacity="0.7" />
        </g>
      ))}
      <path d="M3 30 Q13.5 42 24 30 Q34.5 42 45 30" stroke={P.espresso} strokeWidth="1.6" fill="none" opacity="0.35" />
    </>
  ),
  shelf: () => (
    <>
      <rect x="11" y="16" width="9" height="15" rx="2.5" fill={P.honey} />
      <rect x="11" y="16" width="3" height="15" rx="1.5" fill={P.honeyHi} />
      <rect x="10.5" y="13.5" width="10" height="4" rx="2" fill={P.persimmon} />
      <rect x="11" y="21.5" width="9" height="3.5" fill={P.paper} opacity="0.85" />
      <path d="M25 24 H33 L32 31 H26 Z" fill={P.paper} />
      <Leaf x={27} y={20} r={-25} s={0.7} />
      <Leaf x={31} y={19} r={25} s={0.75} fill={P.leafShade} />
      <rect x="35" y="18" width="6" height="13" rx="1.5" fill={P.wood} />
      <rect x="36.3" y="19.5" width="3.4" height="7" rx="1" fill={P.skyHi} />
      <rect x="5" y="31" width="38" height="5" rx="2.5" fill={P.wood} />
      <rect x="5" y="31" width="38" height="2" rx="1" fill={P.woodHi} />
      <path d="M9 36 H14 L9 42 Z" fill={P.woodShade} />
      <path d="M34 36 H39 L39 42 Z" fill={P.woodShade} />
    </>
  ),
  teaSet: () => (
    <>
      <ellipse cx="24" cy="41" rx="19" ry="3.5" fill={P.woodShade} opacity="0.35" />
      <path d="M31 27 Q38 22 40 16" stroke={P.sageShade} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M9 28 Q4 28 5 22 Q6 18 10 20" stroke={P.sageShade} strokeWidth="2.6" fill="none" />
      <ellipse cx="20" cy="29" rx="13" ry="10.5" fill={P.sageShade} />
      <ellipse cx="18.5" cy="27.5" rx="12" ry="9.5" fill={P.sage} />
      <ellipse cx="14" cy="24" rx="4" ry="2.2" fill={P.sageHi} />
      <rect x="13" y="16" width="14" height="4" rx="2" fill={P.paper} />
      <circle cx="20" cy="14.5" r="2.4" fill={P.persimmon} />
      <circle cx="22" cy="31" r="1.5" fill={P.paper} />
      <circle cx="16" cy="33" r="1.5" fill={P.paper} />
      <circle cx="27" cy="27" r="1.5" fill={P.paper} />
      <path d="M33 33 H43 L41.5 40 Q41 41.5 39.5 41.5 H36.5 Q35 41.5 34.5 40 Z" fill={P.paper} />
      <ellipse cx="38" cy="33" rx="5" ry="1.4" fill={P.tea} />
    </>
  ),
  recordPlayer: () => (
    <>
      <rect x="5" y="22" width="38" height="18" rx="4" fill={P.skyShade} />
      <rect x="5" y="19" width="38" height="16" rx="4" fill={P.sky} />
      <ellipse cx="20" cy="26.5" rx="12" ry="5.5" fill={P.ink} />
      <ellipse cx="20" cy="26.5" rx="7.5" ry="3.4" fill="#5A4636" />
      <ellipse cx="20" cy="26.5" rx="3.6" ry="1.7" fill={P.persimmon} />
      <path d="M38 22 L33 29 L28 29" stroke={P.paper} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="38" cy="22" r="2.2" fill={P.honey} />
      <circle cx="38" cy="31.5" r="1.8" fill={P.honey} />
      <path d="M34 10 V4 L40 3 V9" stroke={P.honeyShade} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <ellipse cx="32.5" cy="10.5" rx="2.2" ry="1.7" fill={P.honeyShade} />
      <ellipse cx="38.5" cy="9.5" rx="2.2" ry="1.7" fill={P.honeyShade} />
    </>
  ),
  blanket: () => (
    <>
      <path d="M9 22 H39 L36 41 Q35.5 44 32.5 44 H15.5 Q12.5 44 12 41 Z" fill={P.wood} />
      <path d="M11 28 H37 M12 34 H36 M13 40 H35" stroke={P.woodShade} strokeWidth="1.6" />
      <rect x="8" y="20" width="32" height="4.5" rx="2.25" fill={P.woodHi} />
      <g transform="rotate(-18 24 17)">
        <rect x="9" y="11" width="30" height="11" rx="5.5" fill={P.honey} />
        <rect x="15" y="11" width="4" height="11" fill={P.berry} />
        <rect x="23" y="11" width="4" height="11" fill={P.paper} />
        <rect x="31" y="11" width="4" height="11" fill={P.berry} />
        <ellipse cx="37" cy="16.5" rx="3" ry="5.5" fill={P.honeyShade} />
      </g>
      <path d="M31 24 Q34 30 30 35" stroke={P.honey} strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  painting: () => (
    <>
      <rect x="6" y="9" width="36" height="30" rx="3.5" fill={P.woodShade} />
      <rect x="6" y="8" width="36" height="29" rx="3.5" fill={P.woodHi} />
      <rect x="10" y="12" width="28" height="21" rx="1.5" fill="#FFE2C8" />
      <circle cx="30" cy="18" r="3.4" fill={P.persimmon} />
      <path d="M10 29 L17 18 L22 25 L27 19 L38 30 V33 H10 Z" fill={P.lilac} />
      <path d="M17 18 L15 21.5 L17 21 L19 22 Z" fill={P.paper} />
      <path d="M10 33 V29 Q18 25 26 29 T38 28 V33 Z" fill={P.sage} />
      <path d="M20 8 L24 3 L28 8" stroke={P.espresso} strokeWidth="1.2" fill="none" />
    </>
  ),
  lantern: () => (
    <>
      <line x1="24" y1="2" x2="24" y2="11" stroke={P.espresso} strokeWidth="1.4" />
      <circle cx="24" cy="26" r="17" fill={P.honey} opacity="0.22" />
      <ellipse cx="24" cy="26" rx="13" ry="12" fill={P.paper} />
      <ellipse cx="24" cy="26" rx="13" ry="12" fill={P.honeyHi} opacity="0.45" />
      <ellipse cx="19" cy="21" rx="4" ry="3" fill="#fff" opacity="0.8" />
      <path d="M11.5 22 Q24 26 36.5 22 M11 27 Q24 31 37 27 M12.5 32 Q24 36 35.5 32" stroke={P.persimmonHi} strokeWidth="1.3" fill="none" />
      <rect x="19" y="11" width="10" height="4" rx="1.5" fill={P.persimmon} />
      <rect x="19" y="37" width="10" height="4" rx="1.5" fill={P.persimmon} />
      <rect x="22.8" y="41" width="2.4" height="5" rx="1.2" fill={P.berry} />
    </>
  ),
  monstera: () => (
    <>
      <path d="M24 30 Q22 20 12 14" stroke={P.leafShade} strokeWidth="1.8" fill="none" />
      <path d="M24 30 Q27 18 36 12" stroke={P.leafShade} strokeWidth="1.8" fill="none" />
      <path
        d="M11 5 C3 7 2 17 7 22 L10 19 L9 24 C12 26 15 26 18 24 L15 21 L20 21 C22 17 22 12 20 9 L16 12 L17 7 C15 5 13 5 11 5Z"
        fill={P.leafShade}
      />
      <path
        d="M37 3 C45 5 47 15 42 21 L39 18 L40 23 C37 25 33 25 30 23 L33 20 L28 20 C26 16 26 11 28 8 L32 11 L31 6 C33 4 35 3 37 3Z"
        fill={P.leaf}
      />
      <path d="M13 29 H35 L32.5 43 Q32 45 30 45 H18 Q16 45 15.5 43 Z" fill={P.paper} />
      <path d="M26 29 H35 L32.5 43 Q32 45 30 45 H26 Z" fill={P.oatShade} opacity="0.5" />
      <rect x="14.2" y="33" width="19.6" height="3.4" fill={P.persimmon} />
      <rect x="12" y="27" width="24" height="4" rx="2" fill={P.oatHi} />
    </>
  ),
  catBed: () => (
    <>
      <ellipse cx="24" cy="35" rx="19" ry="9" fill={P.skyShade} />
      <ellipse cx="24" cy="32" rx="18" ry="8.5" fill={P.sky} />
      <ellipse cx="24" cy="32" rx="13" ry="5.5" fill={P.skyHi} />
      <ellipse cx="22" cy="28" rx="11" ry="6.5" fill={P.catFur} />
      <ellipse cx="18" cy="26" rx="5" ry="3" fill={P.persimmonHi} />
      <path d="M13 30 Q20 35 31 31" stroke={P.catShade} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="27.5" r="5.8" fill={P.catFur} />
      <path d="M28 24 L28.6 18.5 L31.8 22.5 Z" fill="#5A4A55" />
      <path d="M33 22 L36.6 18.8 L36.8 24 Z" fill={P.catFur} />
      <path d="M29.6 27.6 q1.2 1.2 2.4 0 M33.4 27.2 q1.2 1.2 2.4 0" stroke={P.eye} strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="32.8" cy="29.8" r="0.8" fill={P.berry} />
    </>
  ),
  telescope: () => (
    <>
      <path d="M22 26 L13 44 M24 26 L24 44 M26 26 L35 44" stroke={P.woodShade} strokeWidth="2.4" strokeLinecap="round" />
      <g transform="rotate(-32 24 22)">
        <rect x="8" y="17" width="30" height="9" rx="3" fill={P.sky} />
        <rect x="8" y="17" width="30" height="3" rx="1.5" fill={P.skyHi} />
        <rect x="36" y="15.5" width="7" height="12" rx="2.5" fill={P.skyShade} />
        <rect x="20" y="16.5" width="2.6" height="10" fill={P.honey} />
        <rect x="4" y="19" width="5" height="5" rx="1.5" fill={P.ink} />
      </g>
      <circle cx="24" cy="25" r="2.6" fill={P.honeyShade} />
      <path d="M40 2 Q41 6.5 45 7 Q41 7.5 40 12 Q39 7.5 35 7 Q39 6.5 40 2Z" fill={P.honey} />
    </>
  ),
  kotatsu: () => (
    <>
      <path d="M5 26 H43 Q44 26 44 28 L45 40 Q45 43 42 43 H6 Q3 43 3 40 L4 28 Q4 26 5 26Z" fill={P.sageShade} />
      <path d="M5 24 H43 Q45 24 45 27 L44.5 36 Q44 39 41 39 H7 Q4 39 3.5 36 L3 27 Q3 24 5 24Z" fill={P.sage} />
      <path d="M17 25 V38 M31 25 V38 M4 31 H44" stroke={P.sageShade} strokeWidth="1.1" strokeDasharray="2 2" />
      <rect x="7" y="19" width="34" height="6" rx="2.5" fill={P.woodHi} />
      <rect x="7" y="23" width="34" height="2.4" rx="1" fill={P.woodShade} />
      <ellipse cx="30" cy="18" rx="8" ry="2.5" fill={P.paper} />
      <circle cx="27" cy="14.5" r="3.6" fill={P.yuzu} />
      <circle cx="33" cy="15" r="3.4" fill={P.yuzuShade} />
      <circle cx="30" cy="11.5" r="3.4" fill={P.yuzu} />
      <path d="M30 8 q3 -3 6 -1 q-3 3 -6 1z" fill={P.leaf} />
    </>
  ),
};

export function ItemGlyph({ id, size = 48, locked = false }: { id: string; size?: number; locked?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const draw = GLYPHS[id];
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false" style={{ display: 'block', overflow: 'visible' }}>
      {locked && (
        <defs>
          <filter id={`sil${uid}`} x="-10%" y="-10%" width="120%" height="120%">
            <feFlood style={{ floodColor: 'var(--line-strong, #d9cbb8)' }} />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      )}
      <g filter={locked ? `url(#sil${uid})` : undefined}>{draw ? draw() : <circle cx="24" cy="24" r="14" fill={P.oat} />}</g>
    </svg>
  );
}
