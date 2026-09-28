/**
 * Scene palette + time-of-day moods. Colors are sRGB hex from the brand
 * tokens (src/styles/tokens.css) and the art palette (src/art/palette.ts) so
 * the 3D nook reads as the same product as the flat 2D UI.
 */
import type { SceneTime, SceneWeather } from '../types';

export const C = {
  paper: '#FFF9F0',
  cream: '#FFF1DE',
  oat: '#F3E6D3',
  oatDeep: '#E3D2B9',
  ink: '#3B2A20',
  espresso: '#4A3226',

  persimmon: '#F2733A',
  persimmonDeep: '#D4592A',
  persimmonHi: '#FF9D6B',
  honey: '#FFC23D',
  honeyDeep: '#E3A11C',
  honeyHi: '#FFE08A',
  matcha: '#6FB25C',
  matchaDeep: '#55953F',
  leaf: '#6DB85A',
  leafDeep: '#4E9A43',
  leafHi: '#9AD67F',
  sage: '#9DBE8C',
  sageDeep: '#86AA76',
  sky: '#5AAEE0',
  skyDeep: '#3F92C7',
  skyHi: '#9AD2F2',
  berry: '#EC6F86',
  berryDeep: '#CF5169',
  berryHi: '#F7A1B0',
  rose: '#F4B3A8',
  plum: '#2A2340',
  plumMid: '#3C3260',
  plumSoft: '#5A4A7A',
  lilac: '#8C7DB8',

  woodHi: '#E2AE74',
  wood: '#C98B55',
  woodMid: '#B07443',
  woodDeep: '#8A5534',
  woodDark: '#6B3F26',
  terracotta: '#D9774E',
  terracottaDeep: '#B85C38',
  iron: '#4A3F52',
  ironDeep: '#382F40',
  brass: '#E0A83E',

  // Chai (matches src/art/palette.ts)
  fur: '#C98A59',
  furShade: '#A96C42',
  furHi: '#E0AA79',
  muzzle: '#F8E4C8',
  ear: '#9E643D',
  nose: '#3A251B',
  eye: '#2B1C14',
  blush: '#F28B84',
  yuzu: '#FFC83D',
  tea: '#A8622E',
} as const;

export type ResolvedTime = Exclude<SceneTime, 'auto'>;

/** Everything that changes with the time of day. Numbers are linear intensities. */
export interface Mood {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  hillFar: string;
  hillNear: string;
  /** 0..1 star visibility. */
  stars: number;
  /** 0 = no moon, 1 = moon. */
  moon: number;
  /** 0..1 sun disc (morning/day). */
  sun: number;
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  /** 0..1 how much the lamp (and fairy lights, lantern) are on. */
  lamp: number;
  winColor: string;
  /** Window light strength (dir fill + floor patch). */
  win: number;
  /** Canvas backdrop (CSS radial gradient). */
  bgInner: string;
  bgOuter: string;
  exposure: number;
  /** Tint for steam puffs. */
  steam: string;
  /** Outside lit-window glow of the neighbour house. */
  houseLight: number;
}

export const MOODS: Record<ResolvedTime, Mood> = {
  morning: {
    skyTop: '#9CCFF0',
    skyMid: '#FFD2BE',
    skyBottom: '#FFE9C9',
    hillFar: '#B9C9A6',
    hillNear: '#94B784',
    stars: 0,
    moon: 0,
    sun: 1,
    hemiSky: '#FFF4E6',
    hemiGround: '#C9A27E',
    hemi: 2.1,
    lamp: 0.25,
    winColor: '#FFD9A8',
    win: 1.6,
    bgInner: '#FFE7CF',
    bgOuter: '#F6CDB0',
    exposure: 1.0,
    steam: '#FFFFFF',
    houseLight: 0,
  },
  day: {
    skyTop: '#6FBDEB',
    skyMid: '#A9DBF5',
    skyBottom: '#E3F4FB',
    hillFar: '#A5C99A',
    hillNear: '#7FB26E',
    stars: 0,
    moon: 0,
    sun: 0.6,
    hemiSky: '#F6F8FF',
    hemiGround: '#C9A27E',
    hemi: 2.4,
    lamp: 0.1,
    winColor: '#FFF3D6',
    win: 1.8,
    bgInner: '#E4F2FA',
    bgOuter: '#BFDDEF',
    exposure: 1.0,
    steam: '#FFFFFF',
    houseLight: 0,
  },
  dusk: {
    skyTop: '#4E3F7E',
    skyMid: '#D8667A',
    skyBottom: '#FFB36B',
    hillFar: '#7B4E78',
    hillNear: '#553A62',
    stars: 0.35,
    moon: 0.6,
    sun: 0,
    hemiSky: '#A792CF',
    hemiGround: '#6A4436',
    hemi: 1.7,
    lamp: 1,
    winColor: '#FF9E72',
    win: 0.9,
    bgInner: '#5A4677',
    bgOuter: '#2E2545',
    exposure: 1.0,
    steam: '#FFF2EA',
    houseLight: 0.7,
  },
  night: {
    skyTop: '#16122B',
    skyMid: '#2B2450',
    skyBottom: '#4A3C73',
    hillFar: '#2E2750',
    hillNear: '#221C3C',
    stars: 1,
    moon: 1,
    sun: 0,
    hemiSky: '#8C7EC4',
    hemiGround: '#5E3E3A',
    hemi: 1.55,
    lamp: 1,
    winColor: '#B7C4FF',
    win: 0.55,
    bgInner: '#3E335E',
    bgOuter: '#1F1A2E',
    exposure: 1.0,
    steam: '#F6ECF2',
    houseLight: 1,
  },
};

/** Local-clock time of day for `timeOfDay: 'auto'`. */
export function timeFromClock(date: Date): ResolvedTime {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5.5 && h < 9.5) return 'morning';
  if (h >= 9.5 && h < 17) return 'day';
  if (h >= 17 && h < 20.5) return 'dusk';
  return 'night';
}

/** Weather follows the chosen ambience when the consumer doesn't set it. */
export function weatherFromAmbient(ambient: string): SceneWeather {
  if (ambient === 'rain' || ambient === 'lofi') return 'rain';
  if (ambient === 'fire') return 'snow';
  return 'clear';
}
