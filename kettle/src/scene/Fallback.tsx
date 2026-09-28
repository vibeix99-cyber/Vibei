/**
 * Static nook — shown while three.js loads, when 3D is off, or without WebGL.
 * A flat illustration of the same room (window weather + time of day, stove
 * and kettle with steam, lamp glow, rug, table, Chai on the cushion).
 */
import { useId } from 'react';
import * as Art from '@/art';
import type { ComponentType } from 'react';
import { C, MOODS, type ResolvedTime } from './engine/palette';
import type { SceneMode, SceneWeather } from './types';

interface Props {
  time: ResolvedTime;
  weather: SceneWeather;
  mode: SceneMode;
  progress?: number;
  items?: string[];
}

/** The art area may provide a richer illustration; use it when it exists. */
const ArtFallback = (Art as unknown as Record<string, ComponentType<Record<string, unknown>> | undefined>).NookFallback;

export function NookStatic(props: Props) {
  if (ArtFallback) return <ArtFallback {...props} timeOfDay={props.time} />;
  return <NookSvg {...props} />;
}

function NookSvg({ time, weather, mode, progress = 0, items = [] }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const m = MOODS[time];
  const lampOn = m.lamp > 0.5;
  const sky = `sky${uid}`;
  const glow = `glow${uid}`;
  const rain = weather === 'rain';
  const snow = weather === 'snow';
  const steam = mode === 'focus' ? 0.25 + progress * 0.75 : mode === 'break' ? 0.4 : 0.35;
  const cushion = items.includes('cushion');
  const chaiY = cushion ? 0 : 8;
  return (
    <svg viewBox="0 0 400 300" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden focusable="false" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rain ? '#5E5A7A' : m.skyTop} />
          <stop offset="0.55" stopColor={rain ? '#77728F' : m.skyMid} />
          <stop offset="1" stopColor={rain ? '#8D87A3' : m.skyBottom} />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#FFD08A" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFD08A" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* walls */}
      <rect x="20" y="22" width="360" height="200" rx="16" fill={C.oat} />
      <rect x="20" y="152" width="360" height="70" fill={C.sage} />
      <rect x="20" y="148" width="360" height="8" rx="4" fill={C.cream} />
      {/* floor */}
      <path d="M8 222 H392 Q396 222 396 230 V270 Q396 282 384 282 H16 Q4 282 4 270 V230 Q4 222 8 222Z" fill={C.wood} />
      <path d="M4 262 H396 V270 Q396 282 384 282 H16 Q4 282 4 270Z" fill={C.woodDeep} />
      {[60, 120, 180, 240, 300, 360].map((x) => (
        <path key={x} d={`M${x} 222 L${x - 10} 262`} stroke={C.woodMid} strokeWidth="2" opacity="0.6" />
      ))}
      {/* window */}
      <path d="M205 150 V88 A45 45 0 0 1 295 88 V150 Z" fill={`url(#${sky})`} />
      <path d="M205 150 C230 128 262 136 295 128 V150Z" fill={snow ? '#E9E6F6' : m.hillNear} />
      {m.moon > 0.5 && !rain && <path d="M272 64 a14 14 0 1 0 12 22 a11 11 0 1 1 -12 -22Z" fill="#FFF3D1" />}
      {m.stars > 0.5 && !rain && [[222, 70], [240, 100], [258, 58], [283, 104], [230, 118]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#FFF3D1" />)}
      {rain && [0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M${214 + i * 12} ${66 + (i % 3) * 18} l-4 12`} stroke="#DCE8FF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />)}
      {snow && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={i} cx={214 + i * 10} cy={62 + ((i * 23) % 70)} r="2.2" fill="#fff" />)}
      <path d="M205 150 V88 A45 45 0 0 1 295 88 V150 Z" fill="none" stroke={C.cream} strokeWidth="8" strokeLinejoin="round" />
      <path d="M250 44 V150 M205 104 H295" stroke={C.cream} strokeWidth="5" />
      <rect x="190" y="148" width="120" height="10" rx="5" fill={C.cream} />
      {/* curtains */}
      <path d="M180 36 q14 0 18 10 q-2 50 -6 64 q10 20 10 50 h-24 q2 -60 2 -124z" fill={C.persimmonHi} />
      <path d="M320 36 q-14 0 -18 10 q2 50 6 64 q-10 20 -10 50 h24 q-2 -60 -2 -124z" fill={C.persimmonHi} />
      <rect x="170" y="32" width="160" height="6" rx="3" fill={C.woodDeep} />
      {/* lamp */}
      {lampOn && <circle cx="52" cy="84" r="70" fill={`url(#${glow})`} />}
      <rect x="49" y="96" width="5" height="120" rx="2.5" fill={C.brass} />
      <ellipse cx="52" cy="218" rx="20" ry="5" fill={C.espresso} />
      <path d="M34 98 L42 62 H62 L70 98 Z" fill={lampOn ? '#FFE6B8' : C.cream} />
      <rect x="32" y="96" width="40" height="5" rx="2.5" fill={C.persimmon} />
      {/* stove + kettle */}
      <rect x="138" y="36" width="10" height="120" fill={C.ironDeep} />
      <rect x="92" y="150" width="70" height="62" rx="14" fill={C.iron} />
      <rect x="88" y="146" width="78" height="9" rx="4.5" fill={C.ironDeep} />
      <circle cx="127" cy="182" r="13" fill="#FF8A3C" stroke={C.brass} strokeWidth="4" />
      <rect x="98" y="210" width="8" height="10" rx="3" fill={C.ironDeep} />
      <rect x="148" y="210" width="8" height="10" rx="3" fill={C.ironDeep} />
      <path d="M104 146 Q104 118 127 116 Q150 118 150 146 Z" fill={C.persimmon} />
      <rect x="104" y="134" width="46" height="5" fill={C.cream} />
      <path d="M148 132 L166 114" stroke={C.persimmon} strokeWidth="8" strokeLinecap="round" />
      <path d="M110 118 Q127 96 144 118" stroke={C.woodDark} strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="127" cy="113" r="4" fill={C.honey} />
      <g fill="#FFF7F0" opacity={0.35 + 0.5 * steam}>
        <circle cx="172" cy="104" r={5 + 3 * steam} />
        <circle cx="180" cy={88 - 6 * steam} r={6 + 5 * steam} />
        {steam > 0.5 && <circle cx="176" cy={64 - 6 * steam} r={7 + 6 * steam} />}
      </g>
      {/* rug, table, mug */}
      <ellipse cx="236" cy="252" rx="130" ry="22" fill={C.berryDeep} />
      <ellipse cx="236" cy="250" rx="118" ry="18" fill={C.cream} />
      <ellipse cx="236" cy="250" rx="104" ry="15" fill={C.berry} />
      <rect x="266" y="232" width="6" height="18" rx="3" fill={C.woodMid} />
      <rect x="318" y="232" width="6" height="18" rx="3" fill={C.woodMid} />
      <ellipse cx="295" cy="230" rx="46" ry="9" fill={C.woodHi} />
      <rect x="298" y="210" width="16" height="18" rx="4" fill={C.sky} />
      {/* Chai */}
      {cushion && <ellipse cx="176" cy="250" rx="36" ry="10" fill={C.honey} />}
      <g transform={`translate(0 ${chaiY})`}>
        <rect x="146" y="206" width="62" height="42" rx="20" fill={C.fur} />
        <circle cx="160" cy="206" r="5" fill={C.ear} />
        <circle cx="194" cy="206" r="5" fill={C.ear} />
        <rect x="160" y="226" width="34" height="18" rx="9" fill={C.muzzle} />
        <ellipse cx="177" cy="229" rx="9" ry="5" fill={C.nose} />
        {mode === 'focus' ? (
          <>
            <path d="M160 218 q4 4 8 0 M186 218 q4 4 8 0" stroke={C.eye} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="164" cy="218" r="2.6" fill={C.eye} />
            <circle cx="190" cy="218" r="2.6" fill={C.eye} />
          </>
        )}
        <circle cx="158" cy="232" r="3.4" fill={C.blush} opacity="0.8" />
        <circle cx="196" cy="232" r="3.4" fill={C.blush} opacity="0.8" />
        <circle cx="178" cy="199" r="7" fill={C.yuzu} />
        <path d="M178 192 q6 -6 11 -2 q-5 5 -11 2z" fill={C.leaf} />
      </g>
    </svg>
  );
}
