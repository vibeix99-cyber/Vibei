/**
 * Icon set. OWNER: art area.
 * Chunky duotone on a 24 grid: a solid primary layer + a translucent secondary
 * layer (both `currentColor` in the default `mono` tone). `tone="color"` swaps in
 * an illustrated palette (Duolingo-style colorful nav icons for the active tab).
 * Keep `IconName` values stable (screens use them); new names are additive.
 */
import type { ReactNode } from 'react';
import { PAL } from './palette';

export type IconName =
  | 'home'
  | 'stats'
  | 'nook'
  | 'settings'
  | 'play'
  | 'pause'
  | 'stop'
  | 'skip'
  | 'plus'
  | 'minus'
  | 'close'
  | 'back'
  | 'check'
  | 'chevronRight'
  | 'chevronDown'
  | 'sound'
  | 'mute'
  | 'leaf'
  | 'mug'
  | 'cozy'
  | 'bell'
  | 'moon'
  | 'sun'
  | 'rain'
  | 'fire'
  | 'forest'
  | 'wave'
  | 'music'
  | 'clock'
  | 'target'
  | 'trophy'
  | 'lock'
  | 'edit'
  | 'trash'
  | 'download'
  | 'upload'
  | 'keyboard'
  | 'info'
  | 'sparkle'
  | 'tin'
  // additive
  | 'kettle'
  | 'cup'
  | 'pencil'
  | 'break'
  | 'calendar'
  | 'star'
  | 'heart'
  | 'eye'
  | 'droplet'
  | 'refresh'
  | 'chevronLeft'
  | 'chevronUp'
  | 'snow'
  | 'more'
  | 'bellOff'
  | 'lightning'
  | 'book'
  | 'briefcase';

export type IconTone = 'mono' | 'color';

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Accessible label; decorative when omitted. */
  title?: string;
  /** `mono` (default): duotone in currentColor. `color`: illustrated palette (e.g. active nav tab). */
  tone?: IconTone;
}

/** Paint for one render: p = primary, s = secondary (drawn at `so` opacity), a/b = accents. */
interface Paint {
  p: string;
  s: string;
  so: number;
  a: string;
  b: string;
}

const MONO: Paint = { p: 'currentColor', s: 'currentColor', so: 0.34, a: 'currentColor', b: 'currentColor' };

/** Illustrated palette per icon (tone="color"). */
const COLOR: Partial<Record<IconName, Omit<Paint, 'so'>>> = {
  home: { p: PAL.persimmon, s: '#FFD27A', a: '#B8683A', b: PAL.persimmonShade },
  stats: { p: PAL.sky, s: PAL.matcha, a: PAL.honey, b: PAL.skyShade },
  nook: { p: '#C98A59', s: '#4B3F7A', a: PAL.honey, b: PAL.matcha },
  settings: { p: '#8E9FB4', s: '#C3CEDB', a: PAL.honey, b: '#6E8098' },
  leaf: { p: PAL.matcha, s: PAL.matchaHi, a: PAL.matchaShade, b: PAL.matcha },
  mug: { p: PAL.persimmon, s: '#C7B8AA', a: PAL.persimmonShade, b: PAL.persimmon },
  cozy: { p: PAL.berry, s: PAL.berryHi, a: PAL.honey, b: PAL.berryShade },
  bell: { p: PAL.honey, s: PAL.persimmon, a: PAL.honeyShade, b: PAL.honey },
  moon: { p: PAL.honey, s: PAL.skyHi, a: PAL.honey, b: PAL.honey },
  sun: { p: PAL.honey, s: PAL.persimmon, a: PAL.honey, b: PAL.honey },
  rain: { p: '#9DB7CF', s: PAL.sky, a: PAL.sky, b: PAL.sky },
  snow: { p: '#9DB7CF', s: PAL.sky, a: PAL.sky, b: PAL.sky },
  fire: { p: PAL.persimmon, s: PAL.honey, a: PAL.honey, b: PAL.persimmon },
  forest: { p: PAL.matcha, s: PAL.matchaHi, a: '#9A6440', b: PAL.matcha },
  wave: { p: PAL.sky, s: PAL.skyHi, a: PAL.sky, b: PAL.sky },
  music: { p: PAL.berry, s: PAL.berryHi, a: PAL.berry, b: PAL.berry },
  clock: { p: PAL.ink, s: '#FFE7A6', a: PAL.persimmon, b: PAL.persimmon },
  target: { p: PAL.berry, s: PAL.berryHi, a: PAL.berry, b: PAL.berry },
  trophy: { p: PAL.honey, s: PAL.honeyShade, a: PAL.honeyShade, b: PAL.honey },
  lock: { p: '#A89A8C', s: '#C9BDB0', a: '#A89A8C', b: '#A89A8C' },
  sparkle: { p: PAL.honey, s: PAL.honeyHi, a: PAL.honey, b: PAL.honey },
  tin: { p: '#FFF3DF', s: PAL.persimmon, a: PAL.honey, b: PAL.persimmon },
  kettle: { p: PAL.persimmon, s: '#9E643D', a: PAL.honey, b: PAL.persimmonShade },
  cup: { p: PAL.sky, s: PAL.skyHi, a: '#C7B8AA', b: PAL.sky },
  pencil: { p: PAL.honey, s: PAL.berry, a: PAL.ink, b: PAL.honey },
  edit: { p: PAL.honey, s: PAL.berry, a: PAL.ink, b: PAL.honey },
  break: { p: PAL.matcha, s: PAL.matchaHi, a: PAL.matchaShade, b: PAL.matcha },
  calendar: { p: PAL.persimmon, s: PAL.oat, a: PAL.persimmon, b: PAL.persimmon },
  star: { p: PAL.honey, s: PAL.honeyHi, a: PAL.honey, b: PAL.honey },
  heart: { p: PAL.berry, s: PAL.berryHi, a: PAL.berry, b: PAL.berry },
  droplet: { p: PAL.sky, s: PAL.skyHi, a: PAL.sky, b: PAL.sky },
  lightning: { p: PAL.honey, s: PAL.honeyHi, a: PAL.honey, b: PAL.honey },
  book: { p: PAL.sky, s: '#F6E9D6', a: PAL.berry, b: PAL.skyShade },
  briefcase: { p: '#8E5634', s: '#C98A59', a: PAL.honey, b: '#8E5634' },
};

const R = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

function gear(c: Paint) {
  const teeth = Array.from({ length: 8 }, (_, i) => (
    <rect key={i} x="10.1" y="1.6" width="3.8" height="5" rx="1.5" transform={`rotate(${i * 45} 12 12)`} />
  ));
  return (
    <>
      <circle cx="12" cy="12" r="3.1" fill={c.s} opacity={c.so} />
      <g fill={c.p}>{teeth}</g>
      <circle cx="12" cy="12" r="6.3" stroke={c.p} strokeWidth="4.4" fill="none" />
    </>
  );
}

const ICONS: Record<IconName, (c: Paint) => ReactNode> = {
  home: (c) => (
    <>
      <rect x="4.6" y="9.5" width="14.8" height="11.5" rx="2.6" fill={c.s} opacity={c.so} />
      <path d="M10.4 3.4a2.5 2.5 0 0 1 3.2 0l7.6 6.3c.95.8.4 2.3-.84 2.3H3.64c-1.24 0-1.8-1.5-.84-2.3Z" fill={c.p} />
      <path d="M9.6 21v-3.8a2.4 2.4 0 0 1 4.8 0V21Z" fill={c.a} />
    </>
  ),
  stats: (c) => (
    <>
      <rect x="3" y="11" width="5" height="10" rx="2.2" fill={c.s} opacity={c.so} />
      <rect x="9.5" y="3.5" width="5" height="17.5" rx="2.2" fill={c.p} />
      <rect x="16" y="7.5" width="5" height="13.5" rx="2.2" fill={c.a} opacity={c.so === 1 ? 1 : 0.62} />
    </>
  ),
  nook: (c) => (
    <>
      <path d="M5.4 20.2V10.6a6.6 6.6 0 0 1 13.2 0v9.6Z" fill={c.s} opacity={c.so} />
      <circle cx="14.6" cy="9.3" r="2.1" fill={c.a} />
      <path d="M5.4 20.2V10.6a6.6 6.6 0 0 1 13.2 0v9.6M12 4.3v15.9M5.4 13h13.2" stroke={c.p} strokeWidth="2.4" {...R} />
      <rect x="2.6" y="18.6" width="18.8" height="3" rx="1.5" fill={c.p} />
    </>
  ),
  settings: gear,
  play: (c) => <path d="M7.2 5.3c0-1.66 1.84-2.65 3.22-1.73l9.18 6.1a2.1 2.1 0 0 1 0 3.5l-9.18 6.1c-1.38.92-3.22-.07-3.22-1.73Z" fill={c.p} />,
  pause: (c) => (
    <g fill={c.p}>
      <rect x="5.4" y="4" width="4.8" height="16" rx="2.1" />
      <rect x="13.8" y="4" width="4.8" height="16" rx="2.1" />
    </g>
  ),
  stop: (c) => <rect x="5" y="5" width="14" height="14" rx="3.6" fill={c.p} />,
  skip: (c) => (
    <>
      <path d="M4.6 6.2c0-1.5 1.66-2.4 2.92-1.58l7.5 4.9a1.9 1.9 0 0 1 0 3.18l-7.5 4.9C6.26 18.4 4.6 17.5 4.6 16Z" fill={c.p} transform="translate(0 0.6)" />
      <rect x="16.4" y="4.6" width="3.6" height="14.8" rx="1.8" fill={c.p} />
    </>
  ),
  plus: (c) => <path d="M12 5v14M5 12h14" stroke={c.p} strokeWidth="3.2" {...R} />,
  minus: (c) => <path d="M5 12h14" stroke={c.p} strokeWidth="3.2" {...R} />,
  close: (c) => <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke={c.p} strokeWidth="3.2" {...R} />,
  back: (c) => <path d="M10.5 5.5 4.5 12l6 6.5M5.5 12h13.5" stroke={c.p} strokeWidth="3.1" {...R} />,
  check: (c) => <path d="M5 12.6l4.6 4.6L19 7.6" stroke={c.p} strokeWidth="3.3" {...R} />,
  chevronRight: (c) => <path d="M9.5 5.5 16 12l-6.5 6.5" stroke={c.p} strokeWidth="3.2" {...R} />,
  chevronLeft: (c) => <path d="M14.5 5.5 8 12l6.5 6.5" stroke={c.p} strokeWidth="3.2" {...R} />,
  chevronDown: (c) => <path d="M5.5 9.5 12 16l6.5-6.5" stroke={c.p} strokeWidth="3.2" {...R} />,
  chevronUp: (c) => <path d="M5.5 14.5 12 8l6.5 6.5" stroke={c.p} strokeWidth="3.2" {...R} />,
  sound: (c) => (
    <>
      <path d="M16.8 8.8a4.4 4.4 0 0 1 0 6.4M19.4 6a8.4 8.4 0 0 1 0 12" stroke={c.s} strokeWidth="2.4" opacity={c.so === 1 ? 1 : 0.5} {...R} />
      <path d="M2.8 10a1.8 1.8 0 0 1 1.8-1.8h2.6l4.7-3.9c1-.83 2.5-.12 2.5 1.18v13.04c0 1.3-1.5 2-2.5 1.18l-4.7-3.9H4.6A1.8 1.8 0 0 1 2.8 14Z" fill={c.p} />
    </>
  ),
  mute: (c) => (
    <>
      <path d="M17 9.2l4.4 5.6M21.4 9.2 17 14.8" stroke={c.s} strokeWidth="2.6" opacity={c.so === 1 ? 1 : 0.55} {...R} />
      <path d="M2.8 10a1.8 1.8 0 0 1 1.8-1.8h2.6l4.7-3.9c1-.83 2.5-.12 2.5 1.18v13.04c0 1.3-1.5 2-2.5 1.18l-4.7-3.9H4.6A1.8 1.8 0 0 1 2.8 14Z" fill={c.p} />
    </>
  ),
  leaf: (c) => (
    <>
      <path d="M20.6 3.4C11 3.4 4.7 8.6 4.7 15.3c0 1.25.3 2.4.84 3.44 1.04.54 2.2.84 3.46.84 6.7 0 11.6-6.4 11.6-16.2Z" fill={c.s} opacity={c.so === 1 ? 1 : c.so} />
      <path d="M20.6 3.4C11 3.4 4.7 8.6 4.7 15.3c0 1.25.3 2.4.84 3.44Z" fill={c.p} />
      <path d="M5.6 18.4 3.2 20.8" stroke={c.a} strokeWidth="2.6" {...R} />
    </>
  ),
  mug: (c) => (
    <>
      <path d="M8.6 5.6c-.9-1 .9-1.7 0-2.9M12.6 5.6c-.9-1 .9-1.7 0-2.9" stroke={c.s} strokeWidth="1.9" opacity={c.so === 1 ? 1 : 0.55} {...R} />
      <path d="M17.6 10.2h1.1a2.7 2.7 0 0 1 0 5.4h-1.5" stroke={c.a} strokeWidth="2.5" {...R} />
      <path d="M3.8 9.3c0-.8.7-1.5 1.5-1.5h11.3c.8 0 1.5.7 1.5 1.5v6.2a5.3 5.3 0 0 1-5.3 5.3H9.1a5.3 5.3 0 0 1-5.3-5.3Z" fill={c.p} />
    </>
  ),
  cozy: (c) => (
    <>
      <path d="M3.6 18.5C3.6 11.3 7.3 6.8 12 6.8s8.4 4.5 8.4 11.7Z" fill={c.s} opacity={c.so} />
      <path d="M8.8 9.2v8.6M12 7.6v10.2M15.2 9.2v8.6" stroke={c.p} strokeWidth="1.7" opacity={c.so === 1 ? 0.55 : 1} {...R} />
      <rect x="2.4" y="17.2" width="19.2" height="4" rx="2" fill={c.p} />
      <circle cx="12" cy="5" r="2.6" fill={c.a} />
    </>
  ),
  bell: (c) => (
    <>
      <circle cx="12" cy="19.2" r="2.7" fill={c.s} opacity={c.so} />
      <path d="M12 2.8a6.2 6.2 0 0 1 6.2 6.2v3.5l1.7 2.7c.66 1.05-.1 2.4-1.34 2.4H5.44c-1.24 0-2-1.35-1.34-2.4l1.7-2.7V9A6.2 6.2 0 0 1 12 2.8Z" fill={c.p} />
    </>
  ),
  bellOff: (c) => (
    <>
      <circle cx="12" cy="19.2" r="2.7" fill={c.s} opacity={c.so} />
      <path d="M12 2.8a6.2 6.2 0 0 1 6.2 6.2v3.5l1.7 2.7c.66 1.05-.1 2.4-1.34 2.4H5.44c-1.24 0-2-1.35-1.34-2.4l1.7-2.7V9A6.2 6.2 0 0 1 12 2.8Z" fill={c.p} opacity={c.so === 1 ? 1 : 0.5} />
      <path d="M3.5 3.5l17 17" stroke={c.p} strokeWidth="2.8" {...R} />
    </>
  ),
  moon: (c) => (
    <>
      <path d="M18.4 2.6l.62 1.5 1.5.62-1.5.62-.62 1.5-.62-1.5-1.5-.62 1.5-.62Z" fill={c.s} stroke={c.s} strokeWidth="1.2" strokeLinejoin="round" opacity={c.so === 1 ? 1 : 0.6} />
      <path d="M20.3 14.6A8.7 8.7 0 1 1 9.4 3.7a7.1 7.1 0 0 0 10.9 10.9Z" fill={c.p} />
    </>
  ),
  sun: (c) => (
    <>
      <g stroke={c.s} strokeWidth="2.5" opacity={c.so === 1 ? 1 : 0.5} {...R}>
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M12 2.6v2" transform={`rotate(${i * 45} 12 12)`} />
        ))}
      </g>
      <circle cx="12" cy="12" r="5.2" fill={c.p} />
    </>
  ),
  rain: (c) => (
    <>
      <path d="M8 17.6l-1 2.4M12.2 17.6l-1 2.4M16.4 17.6l-1 2.4" stroke={c.s} strokeWidth="2.4" opacity={c.so === 1 ? 1 : 0.6} {...R} />
      <path d="M7.2 15.4a4.3 4.3 0 0 1-.7-8.54 5.7 5.7 0 0 1 10.96 1.7 3.45 3.45 0 0 1-.26 6.84Z" fill={c.p} />
    </>
  ),
  snow: (c) => (
    <>
      <g fill={c.s} opacity={c.so === 1 ? 1 : 0.6}>
        <circle cx="8" cy="19" r="1.4" />
        <circle cx="12.2" cy="20.4" r="1.4" />
        <circle cx="16.4" cy="19" r="1.4" />
      </g>
      <path d="M7.2 15.4a4.3 4.3 0 0 1-.7-8.54 5.7 5.7 0 0 1 10.96 1.7 3.45 3.45 0 0 1-.26 6.84Z" fill={c.p} />
    </>
  ),
  fire: (c) => (
    <>
      <path d="M12 2.4c.9 3.4 6 5.6 6 11.4a6 6 0 0 1-12 0c0-2.5 1.1-4.3 2.4-5.3.2 1.7 1 2.8 2 3.2-.1-3.9.3-7 1.6-9.3Z" fill={c.p} />
      <path d="M12 12.6c1.3 1.5 2.8 2.6 2.8 4.6a2.8 2.8 0 0 1-5.6 0c0-2 1.5-3.1 2.8-4.6Z" fill={c.s} opacity={c.so === 1 ? 1 : 0.4} />
    </>
  ),
  forest: (c) => (
    <>
      <path d="M6.6 4.8 2.7 12.4c-.4.8.2 1.7 1.1 1.7h5.6c.9 0 1.5-.9 1.1-1.7Z" fill={c.s} opacity={c.so} />
      <rect x="5.5" y="13" width="2.2" height="7" rx="1.1" fill={c.s} opacity={c.so} />
      <path d="M15 2.6a5.6 5.6 0 0 1 5.2 7.7 4.4 4.4 0 0 1-2.9 6.6h-4.6a4.4 4.4 0 0 1-2.9-6.6A5.6 5.6 0 0 1 15 2.6Z" fill={c.p} />
      <rect x="13.8" y="13" width="2.4" height="8.4" rx="1.2" fill={c.a} />
    </>
  ),
  wave: (c) => (
    <>
      <path d="M3 6.6c3-2.4 6 2.4 9 0s6-2.4 9 0M3 17.4c3-2.4 6 2.4 9 0s6-2.4 9 0" stroke={c.s} strokeWidth="2.6" opacity={c.so === 1 ? 1 : 0.5} {...R} />
      <path d="M3 12c3-2.4 6 2.4 9 0s6-2.4 9 0" stroke={c.p} strokeWidth="2.8" {...R} />
    </>
  ),
  music: (c) => (
    <>
      <path d="M9.4 7.4 19.6 5v3.4L9.4 10.8Z" fill={c.s} opacity={c.so === 1 ? 1 : 0.5} />
      <path d="M9.4 18V6.6l10.2-2.4v11.4" stroke={c.p} strokeWidth="2.4" {...R} />
      <ellipse cx="6.8" cy="18" rx="3.4" ry="2.9" fill={c.p} />
      <ellipse cx="17" cy="15.8" rx="3.4" ry="2.9" fill={c.p} />
    </>
  ),
  clock: (c) => (
    <>
      <circle cx="12" cy="12.4" r="9.4" fill={c.s} opacity={c.so} />
      <circle cx="12" cy="12.4" r="9.4" stroke={c.a} strokeWidth="2.3" fill="none" />
      <path d="M12 7.4v5.2l3.4 2.1" stroke={c.p} strokeWidth="2.7" {...R} />
    </>
  ),
  target: (c) => (
    <>
      <circle cx="12" cy="12" r="9.6" fill={c.s} opacity={c.so} />
      <circle cx="12" cy="12" r="5.6" stroke={c.p} strokeWidth="2.6" fill="none" />
      <circle cx="12" cy="12" r="2" fill={c.p} />
    </>
  ),
  trophy: (c) => (
    <>
      <path d="M6.8 5.6H5a1.9 1.9 0 0 0-1.9 1.9c0 2.4 1.7 4 4 4.3M17.2 5.6H19a1.9 1.9 0 0 1 1.9 1.9c0 2.4-1.7 4-4 4.3" stroke={c.s} strokeWidth="2.3" opacity={c.so === 1 ? 1 : 0.55} {...R} />
      <path d="M6.6 3.2h10.8v5.9a5.4 5.4 0 0 1-10.8 0Z" fill={c.p} />
      <rect x="10.8" y="13.2" width="2.4" height="5" fill={c.p} />
      <rect x="7" y="17.6" width="10" height="3.6" rx="1.6" fill={c.a} />
    </>
  ),
  lock: (c) => (
    <>
      <path d="M8 10.6V8.2a4 4 0 0 1 8 0v2.4" stroke={c.s} strokeWidth="2.6" opacity={c.so === 1 ? 1 : 0.55} {...R} />
      <path
        fillRule="evenodd"
        d="M8 10h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Zm4 3.6a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z"
        fill={c.p}
      />
    </>
  ),
  edit: (c) => pencil(c),
  pencil: (c) => pencil(c),
  trash: (c) => (
    <>
      <path d="M5.8 8.2h12.4l-.9 11a2 2 0 0 1-2 1.8H8.7a2 2 0 0 1-2-1.8Z" fill={c.s} opacity={c.so} />
      <path d="M10 11.6v5.6M14 11.6v5.6" stroke={c.p} strokeWidth="2.2" {...R} />
      <path d="M9.4 5V4.2c0-.66.54-1.2 1.2-1.2h2.8c.66 0 1.2.54 1.2 1.2V5" stroke={c.p} strokeWidth="2" {...R} />
      <rect x="3.6" y="4.6" width="16.8" height="3.2" rx="1.6" fill={c.p} />
    </>
  ),
  download: (c) => (
    <>
      <path d="M4 15.2v2.6A2.7 2.7 0 0 0 6.7 20.5h10.6a2.7 2.7 0 0 0 2.7-2.7v-2.6" stroke={c.s} strokeWidth="2.7" opacity={c.so === 1 ? 1 : 0.5} {...R} />
      <path d="M12 3.6v10.6M7.6 10l4.4 4.4 4.4-4.4" stroke={c.p} strokeWidth="2.9" {...R} />
    </>
  ),
  upload: (c) => (
    <>
      <path d="M4 15.2v2.6A2.7 2.7 0 0 0 6.7 20.5h10.6a2.7 2.7 0 0 0 2.7-2.7v-2.6" stroke={c.s} strokeWidth="2.7" opacity={c.so === 1 ? 1 : 0.5} {...R} />
      <path d="M12 14.4V3.8M7.6 8.2 12 3.8l4.4 4.4" stroke={c.p} strokeWidth="2.9" {...R} />
    </>
  ),
  keyboard: (c) => (
    <>
      <rect x="2.2" y="5.6" width="19.6" height="12.8" rx="3.2" fill={c.s} opacity={c.so} />
      <g fill={c.p}>
        <rect x="5" y="8.4" width="2.4" height="2.4" rx="0.9" />
        <rect x="8.9" y="8.4" width="2.4" height="2.4" rx="0.9" />
        <rect x="12.7" y="8.4" width="2.4" height="2.4" rx="0.9" />
        <rect x="16.6" y="8.4" width="2.4" height="2.4" rx="0.9" />
        <rect x="7.6" y="13.4" width="8.8" height="2.4" rx="1.2" />
      </g>
    </>
  ),
  info: (c) => (
    <>
      <circle cx="12" cy="12" r="9.6" fill={c.s} opacity={c.so} />
      <circle cx="12" cy="7.7" r="1.7" fill={c.p} />
      <rect x="10.7" y="10.6" width="2.6" height="7.4" rx="1.3" fill={c.p} />
    </>
  ),
  sparkle: (c) => (
    <>
      <path d="M18.4 14.2c.3 1.6.9 2.2 2.4 2.5-1.5.3-2.1.9-2.4 2.5-.3-1.6-.9-2.2-2.4-2.5 1.5-.3 2.1-.9 2.4-2.5Z" fill={c.s} stroke={c.s} strokeWidth="1.4" strokeLinejoin="round" opacity={c.so === 1 ? 1 : 0.55} />
      <path d="M10.4 3.2c.7 3.9 2.4 5.6 6.3 6.3-3.9.7-5.6 2.4-6.3 6.3-.7-3.9-2.4-5.6-6.3-6.3 3.9-.7 5.6-2.4 6.3-6.3Z" fill={c.p} stroke={c.p} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  tin: (c) => (
    <>
      <rect x="5" y="8" width="14" height="13.2" rx="2.8" fill={c.s} opacity={c.so} />
      <path d="M8.6 17.8c0-3.2 2.5-5.2 6.2-5.2 0 3.3-2.3 5.4-6.2 5.2Z" fill={c.p} />
      <rect x="3.8" y="3.2" width="16.4" height="5.6" rx="2.2" fill={c.a} />
    </>
  ),
  kettle: (c) => (
    <>
      <path d="M8.2 7.4a4.2 3 0 0 1 7.6 0" stroke={c.s} strokeWidth="2.4" opacity={c.so === 1 ? 1 : 0.55} {...R} />
      <path d="M5 13.4 2.6 10.6" stroke={c.p} strokeWidth="2.8" {...R} />
      <path d="M12 8.6c4.3 0 7.6 3.6 7.6 7.8v.7c0 2-1.6 3.7-3.7 3.7H8.1c-2 0-3.7-1.6-3.7-3.7v-.7c0-4.2 3.3-7.8 7.6-7.8Z" fill={c.p} />
      <circle cx="12" cy="7.3" r="1.9" fill={c.a} />
    </>
  ),
  cup: (c) => (
    <>
      <rect x="2.6" y="18.6" width="18.8" height="2.8" rx="1.4" fill={c.s} opacity={c.so} />
      <path d="M17.8 10.2h.8a2.5 2.5 0 0 1 0 5h-1.4" stroke={c.p} strokeWidth="2.4" {...R} />
      <path d="M3.8 9.4h14.4v1.4a7.2 7.2 0 0 1-14.4 0Z" fill={c.p} />
      <path d="M9 6.6c-.8-.9.8-1.5 0-2.6M13 6.6c-.8-.9.8-1.5 0-2.6" stroke={c.a} strokeWidth="1.8" opacity={c.so === 1 ? 1 : 0.5} {...R} />
    </>
  ),
  break: (c) => (
    <>
      <path d="M5.4 13.4 2.6 10.4M18.6 11.2a2.9 2.9 0 0 1 0 5.4" stroke={c.s} strokeWidth="2.6" opacity={c.so === 1 ? 1 : 0.55} {...R} />
      <path d="M12 7.8c4 0 7 2.9 7 6.9s-3 6.3-7 6.3-7-2.3-7-6.3 3-6.9 7-6.9Z" fill={c.p} />
      <path d="M8 8.6a4 2.4 0 0 1 8 0Z" fill={c.a} />
      <circle cx="12" cy="5.2" r="1.6" fill={c.a} />
    </>
  ),
  calendar: (c) => (
    <>
      <rect x="3.2" y="4.8" width="17.6" height="16" rx="3.2" fill={c.s} opacity={c.so} />
      <path d="M3.2 8a3.2 3.2 0 0 1 3.2-3.2h11.2A3.2 3.2 0 0 1 20.8 8v2H3.2Z" fill={c.p} />
      <path d="M8 2.8v3.6M16 2.8v3.6" stroke={c.p} strokeWidth="2.4" {...R} />
      <rect x="6.6" y="13" width="3.2" height="3.2" rx="1" fill={c.p} />
    </>
  ),
  star: (c) => (
    <path
      d="M12 3.2l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8Z"
      fill={c.p}
      stroke={c.p}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  heart: (c) => (
    <path d="M12 20.4s-8.4-4.9-8.4-11a4.7 4.7 0 0 1 8.4-2.9 4.7 4.7 0 0 1 8.4 2.9c0 6.1-8.4 11-8.4 11Z" fill={c.p} />
  ),
  eye: (c) => (
    <>
      <path d="M12 5.2c5.2 0 8.6 4.4 9.6 6.1a1.4 1.4 0 0 1 0 1.4c-1 1.7-4.4 6.1-9.6 6.1s-8.6-4.4-9.6-6.1a1.4 1.4 0 0 1 0-1.4c1-1.7 4.4-6.1 9.6-6.1Z" fill={c.s} opacity={c.so} />
      <circle cx="12" cy="12" r="3.8" fill={c.p} />
    </>
  ),
  droplet: (c) => (
    <path d="M12 2.8c.5 0 6.6 6.6 6.6 11.4a6.6 6.6 0 0 1-13.2 0C5.4 9.4 11.5 2.8 12 2.8Z" fill={c.p} />
  ),
  refresh: (c) => (
    <>
      <path d="M19.4 12a7.4 7.4 0 1 1-2.2-5.3" stroke={c.p} strokeWidth="2.9" {...R} />
      <path d="M19.6 3.6v4.6H15" stroke={c.p} strokeWidth="2.9" {...R} />
    </>
  ),
  more: (c) => (
    <g fill={c.p}>
      <circle cx="5.2" cy="12" r="2.3" />
      <circle cx="12" cy="12" r="2.3" />
      <circle cx="18.8" cy="12" r="2.3" />
    </g>
  ),
  book: (c) => (
    <>
      <path d="M7.2 16.2h12.6v4.1c0 .7-.5 1.2-1.2 1.2H7.2a2.65 2.65 0 0 1 0-5.3Z" fill={c.s} opacity={c.so} />
      <path d="M7.2 2.6h11c.9 0 1.6.7 1.6 1.6v12H7.2a2.65 2.65 0 0 0-2.65 2.65V5.25A2.65 2.65 0 0 1 7.2 2.6Z" fill={c.p} />
      <path d="M13.6 2.6v6.2l1.9-1.4 1.9 1.4V2.6Z" fill={c.a} />
    </>
  ),
  briefcase: (c) => (
    <>
      <path d="M8.8 7.2V5.6c0-.9.7-1.6 1.6-1.6h3.2c.9 0 1.6.7 1.6 1.6v1.6" stroke={c.p} strokeWidth="2.4" {...R} />
      <rect x="2.6" y="7" width="18.8" height="13.6" rx="3.2" fill={c.s} opacity={c.so} />
      <path d="M2.6 11.4h18.8v1.4c0 .6-.5 1.1-1.1 1.1H3.7c-.6 0-1.1-.5-1.1-1.1Z" fill={c.p} />
      <rect x="10" y="10.2" width="4" height="5.2" rx="1.3" fill={c.a} />
    </>
  ),
  lightning: (c) => (
    <path d="M13.6 2.6 5.2 13.2h6l-1 8.2 8.6-10.8h-6.2Z" fill={c.p} stroke={c.p} strokeWidth="1.6" strokeLinejoin="round" />
  ),
};

function pencil(c: Paint) {
  return (
    <>
      <path d="M13 20.6h7.4" stroke={c.s} strokeWidth="2.6" opacity={c.so === 1 ? 1 : 0.5} {...R} />
      <path d="M15.3 4.1a2.5 2.5 0 0 1 3.5 0l1.1 1.1a2.5 2.5 0 0 1 0 3.5L9.4 19.2l-5.2 1.2 1.2-5.2Z" fill={c.p} />
      <path d="M13.4 6 18 10.6" stroke={c.b === c.p && c.so !== 1 ? 'none' : c.s} strokeWidth="2.2" />
    </>
  );
}

export function Icon({ name, size = 24, className, title, tone = 'mono' }: IconProps) {
  const col = tone === 'color' ? COLOR[name] : undefined;
  const paint: Paint = col ? { ...col, so: 1 } : MONO;
  const draw = ICONS[name] ?? ICONS.sparkle;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-icon={name}
      style={{ flex: 'none', display: 'inline-block', verticalAlign: 'middle' }}
    >
      {draw(paint)}
    </svg>
  );
}

/** Every icon name (for galleries / tests). */
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
