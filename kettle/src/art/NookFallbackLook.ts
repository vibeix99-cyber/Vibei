/**
 * Geometry + time-of-day looks for the static nook (NookFallback.tsx).
 * OWNER: art area.
 *
 * The flat illustration is drawn as the same cutaway diorama as the 3D room
 * (src/scene/engine/layout.ts): a fixed orthographic view at the 3D camera's
 * resting angle (azimuth 0.56, elevation 0.4), 1 world unit = 40 SVG units.
 * Orthographic projection maps every plane to an affine transform, so wall and
 * floor decorations are drawn flat in plane-local coordinates under `matrix()`.
 * Everything here is computed once at module load — no per-frame work.
 */

export type NookTime = 'morning' | 'day' | 'dusk' | 'night';

/** SVG units per world unit. */
export const K = 40;

// Screen axes of the world axes (x → right-down, y → up, z → left-down).
const XX = 0.84726;
const XY = 0.20686;
const YY = -0.92106;
const ZX = -0.53119;
const ZY = 0.32994;

/** Room extents, matching src/scene/engine/layout.ts (ROOM / WIN / SPOTS). */
export const R = { x0: -3.2, x1: 3.2, zB: -2.5, zF: 2.5, h: 4, wall: 0.26, slab: 0.36 } as const;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** World point → screen [x, y]. */
export function px(x: number, y: number, z: number): [number, number] {
  return [r1(K * (XX * x + ZX * z)), r1(K * (XY * x + YY * y + ZY * z))];
}
export function pt(x: number, y: number, z: number): string {
  return px(x, y, z).join(' ');
}
export function poly(pts: readonly (readonly [number, number, number])[]): string {
  return 'M' + pts.map((p) => pt(p[0], p[1], p[2])).join('L') + 'Z';
}

/** The three camera-facing faces of an axis-aligned box. */
export function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  return {
    top: poly([
      [x0, y1, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x0, y1, z1],
    ]),
    /** The +x face. */
    side: poly([
      [x1, y1, z0],
      [x1, y1, z1],
      [x1, y0, z1],
      [x1, y0, z0],
    ]),
    /** The +z face. */
    front: poly([
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y0, z1],
      [x0, y0, z1],
    ]),
  };
}

const mat = (a: number, b: number, c: number, d: number, [e, f]: [number, number]) => `matrix(${a} ${b} ${c} ${d} ${e} ${f})`;

/** Plane z = const, seen from +z. Local (u, v) = (40·x, −40·y). */
export const planeZ = (z: number) => mat(XX, XY, 0, -YY, px(0, 0, z));
/** Plane x = const, seen from +x. Local (u, v) = (−40·z, −40·y). */
export const planeX = (x: number) => mat(-ZX, -ZY, 0, -YY, px(x, 0, 0));
/** Horizontal plane at height y, seen from above. Local (u, v) = (40·x, 40·z). */
export const planeY = (y: number) => mat(XX, XY, ZX, ZY, px(0, y, 0));

export const M_BACK = planeZ(R.zB);
export const M_LEFT = planeX(R.x0);
export const M_FLOOR = planeY(0);

/** Visible bounds of the diorama (slab corners, wall tops) plus a little air. */
export const VIEW = { x: -184, y: -224, w: 368, h: 312 } as const;

/** Everything that changes with the time of day. Mirrors MOODS in src/scene/engine/palette.ts. */
export interface NookLook {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  hillFar: string;
  hillNear: string;
  stars: number;
  moon: number;
  sun: number;
  clouds: number;
  /** Lamp, lantern and fairy-light strength 0..1. */
  lamp: number;
  /** Daylight patch on the floor (opacity). */
  win: number;
  winColor: string;
  houseLight: boolean;
  wallBack: string;
  wallLeft: string;
  wallTop: string;
  wallEdge: string;
  sage: string;
  sageDeep: string;
  trim: string;
  planks: readonly [string, string, string, string];
  seam: string;
  slab: string;
  slabSide: string;
  curtain: string;
  curtainShade: string;
  /** Window frame + sill (top, +x, +z faces). */
  frame: string;
  sill: readonly [string, string, string];
  /** Plum veil over the furniture (the room is lit by the lamp alone). */
  veil: number;
  rain: string;
  /** Backdrop (standalone use; the scene host paints its own). */
  bgInner: string;
  bgOuter: string;
}

const DAY_ROOM = {
  wallBack: '#EBDBC6',
  wallLeft: '#DCC6AC',
  wallTop: '#FAF0E2',
  wallEdge: '#E9CDA8',
  sage: '#9DBE8C',
  sageDeep: '#86AA76',
  trim: '#FFF4E4',
  planks: ['#C98B55', '#E2AE74', '#C98B55', '#B07443'],
  seam: '#9A6238',
  slab: '#8A5534',
  slabSide: '#6B3F26',
  curtain: '#FFC6A6',
  curtainShade: '#F2A382',
  frame: '#FFF1DE',
  sill: ['#FFF6EA', '#E9D6BD', '#F2E2CC'],
  veil: 0,
} as const;

export const LOOKS: Record<NookTime, NookLook> = {
  morning: {
    skyTop: '#9CCFF0',
    skyMid: '#FFD2BE',
    skyBottom: '#FFE9C9',
    hillFar: '#B9C9A6',
    hillNear: '#94B784',
    stars: 0,
    moon: 0,
    sun: 1,
    clouds: 0.8,
    lamp: 0.25,
    win: 0.34,
    winColor: '#FFD9A8',
    houseLight: false,
    ...DAY_ROOM,
    wallBack: '#F0DBC5',
    wallLeft: '#E2C6AC',
    rain: '#CFE3F5',
    bgInner: '#FFE7CF',
    bgOuter: '#F6CDB0',
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
    clouds: 1,
    lamp: 0.1,
    win: 0.38,
    winColor: '#FFF3D6',
    houseLight: false,
    ...DAY_ROOM,
    rain: '#CFE3F5',
    bgInner: '#E4F2FA',
    bgOuter: '#BFDDEF',
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
    clouds: 0,
    lamp: 1,
    win: 0.14,
    winColor: '#FF9E72',
    houseLight: true,
    wallBack: '#8C6C8E',
    wallLeft: '#74587C',
    wallTop: '#A88BA6',
    wallEdge: '#977690',
    sage: '#5E7162',
    sageDeep: '#4D5E52',
    trim: '#B59CB0',
    planks: ['#A8653F', '#BE7C4E', '#A8653F', '#8F5234'],
    seam: '#6E3D28',
    slab: '#5E3A2E',
    slabSide: '#482A24',
    curtain: '#E79A8E',
    curtainShade: '#C97A78',
    frame: '#EBD2CC',
    sill: ['#F0DAD2', '#C9ABB4', '#DCC0C0'],
    veil: 0.1,
    rain: '#C9B8E8',
    bgInner: '#5A4677',
    bgOuter: '#2E2545',
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
    clouds: 0,
    lamp: 1,
    win: 0.08,
    winColor: '#B7C4FF',
    houseLight: true,
    wallBack: '#634D7A',
    wallLeft: '#523F69',
    wallTop: '#7C6694',
    wallEdge: '#6B5683',
    sage: '#44524F',
    sageDeep: '#374340',
    trim: '#85729A',
    planks: ['#9C5E3C', '#B2704A', '#9C5E3C', '#854E33'],
    seam: '#5A3325',
    slab: '#4A2E2A',
    slabSide: '#3A2322',
    curtain: '#C98A8C',
    curtainShade: '#A96E76',
    frame: '#D4C0D2',
    sill: ['#DCC9D8', '#A993B4', '#BFA9C4'],
    veil: 0.16,
    rain: '#9FC3E8',
    bgInner: '#3E335E',
    bgOuter: '#1F1A2E',
  },
};
