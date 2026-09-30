/**
 * Round-6 MOCKUP v2: the Focus "still life". One scene, one light:
 *   back   the nook's own window (a still render of the 3D room, ~1px depth blur instead of the v1 3px + 55% fade)
 *   middle a wooden counter spanning the frame (the room's wood palette) that the kettle's stove and Chai share
 *   front  contact shadows drawn once, in one style, for both; then one lighting layer over everything
 * Light follows the window: by day, window light spills forward across the counter (the pane shape, with the
 * mullion), and shadows fall toward the viewer; at night the window is dim moonlight and the stove is the key
 * light, a warm pool on the counter that also warms Chai's near side. Paused = the stove's light goes out.
 */
import type { CSSProperties } from 'react';
import { Mascot, type MascotPose } from '@/art';
import { Kettle2, type KettleState } from './Kettle2';

const R = '../renders';

export type SceneLayout = {
  w: number;
  h: number;
  /** backdrop image, its displayed size and vertical offset */
  bg: { file: 'phone' | 'wide'; w: number; h: number; top: number; blur: number };
  counter: { back: number; front: number; bottom: number };
  kettle: { size: number; x: number; base: number };
  chai: { size: number; x: number; base: number };
  /** the window's horizontal span where it meets the counter (for the light spill) */
  win: { l: number; r: number };
};

export const PHONE_SCENE: SceneLayout = {
  w: 390,
  h: 516,
  bg: { file: 'phone', w: 390, h: 844, top: -112, blur: 1 },
  counter: { back: 382, front: 482, bottom: 516 },
  kettle: { size: 290, x: 146, base: 456 },
  chai: { size: 158, x: 298, base: 468 },
  win: { l: 40, r: 350 },
};

export const DESK_SCENE: SceneLayout = {
  w: 860,
  h: 800,
  bg: { file: 'wide', w: 860, h: 820, top: -6, blur: 0.8 },
  counter: { back: 476, front: 748, bottom: 800 },
  kettle: { size: 530, x: 318, base: 694 },
  chai: { size: 292, x: 646, base: 706 },
  win: { l: 236, r: 630 },
};

// Kettle2's viewBox is (-70 -40 370 340); its stove is centred at x=166 and its bottom edge is y=282.
const K_CX = (166 + 70) / 370;
const K_BASE = (282 + 40) / 340;
const K_HALF = 76 / 370; // half-width of the burner plate

export function FocusScene({
  L,
  night,
  p,
  state,
  extended = false,
  chaiPose,
  t = 0,
  reduced = true,
  style,
}: {
  L: SceneLayout;
  night: boolean;
  p: number;
  state: KettleState;
  extended?: boolean;
  chaiPose?: MascotPose;
  t?: number;
  reduced?: boolean;
  style?: CSSProperties;
}) {
  const whistle = state === 'whistle';
  const paused = state === 'paused';
  const heat = paused ? 0 : whistle ? 1 : 0.25 + 0.75 * p;
  const pose: MascotPose = chaiPose ?? (whistle ? 'cheer' : paused ? 'idle' : 'focus');
  const { counter: C, kettle: K, chai: M, win } = L;
  const kH = (K.size * 340) / 370;
  const kLeft = K.x - K_CX * K.size;
  const kTop = K.base - K_BASE * kH;
  const plateHalf = K_HALF * K.size;
  const mLeft = M.x - M.size / 2;
  const mTop = M.base - (189 / 200) * M.size;
  const depth = C.front - C.back;
  const id = `fs${L.w}${night ? 'n' : 'd'}`;
  // wood, graded for the time of day (room palette: wood #C98B55, hi #E2AE74, mid #B07443, deep #8A5534, dark #6B3F26)
  const wood = night
    ? { back: '#5C3B3A', front: '#7A4B35', face: '#3A2426', faceLo: '#2A1A1E', edge: '#9A6444', grain: '#4A2E2C' }
    : { back: '#E6B47C', front: '#C98B55', face: '#94592F', faceLo: '#7A4726', edge: '#EDC08A', grain: '#B07443' };
  const planks = [0.16, 0.38, 0.66];
  const shadowInk = night ? '14,8,16' : '74,44,26';
  const kx = K.x;
  const hop = !reduced && whistle ? Math.abs(Math.sin(t * 7)) * M.size * 0.05 * Math.max(0, 1 - t / 2.4) : 0;

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: L.w, height: L.h, overflow: 'hidden', ...style }}>
      {/* back: the nook's window */}
      <img
        src={`${R}/win2-${night ? 'night' : 'day'}-${L.bg.file}.png`}
        alt=""
        style={{ position: 'absolute', left: 0, top: L.bg.top, width: L.bg.w, height: L.bg.h, filter: `blur(${L.bg.blur}px) saturate(${night ? 0.95 : 0.9}) brightness(${night ? 0.92 : 1.02})` }}
      />

      {/* middle: the shared counter, light spill, stove pool and contact shadows */}
      <svg width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`} style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden>
        <defs>
          <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={wood.back} />
            <stop offset="1" stopColor={wood.front} />
          </linearGradient>
          <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={wood.face} />
            <stop offset="1" stopColor={wood.faceLo} />
          </linearGradient>
          <radialGradient id={`${id}-pool`}>
            <stop offset="0" stopColor="#FFB85C" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#F2894E" stopOpacity="0.35" />
            <stop offset="1" stopColor="#F2894E" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-soft`} x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation={L.w > 500 ? 7 : 4} />
          </filter>
          <filter id={`${id}-contact`} x="-30%" y="-150%" width="160%" height="400%">
            <feGaussianBlur stdDeviation={L.w > 500 ? 2.4 : 1.6} />
          </filter>
          <clipPath id={`${id}-topclip`}>
            <rect x="0" y={C.back} width={L.w} height={depth} />
          </clipPath>
        </defs>
        {/* wall-to-counter junction */}
        <rect x="0" y={C.back - 10} width={L.w} height="12" fill={`rgba(${shadowInk},${night ? 0.35 : 0.14})`} filter={`url(#${id}-soft)`} />
        {/* counter top + planks */}
        <rect x="0" y={C.back} width={L.w} height={depth} fill={`url(#${id}-top)`} />
        {planks.map((f) => (
          <rect key={f} x="0" y={C.back + depth * f} width={L.w} height={L.w > 500 ? 2 : 1.3} fill={wood.grain} opacity={night ? 0.55 : 0.32} />
        ))}
        <g clipPath={`url(#${id}-topclip)`}>
          {/* window light spilling forward over the counter: the pane shape, split by the mullion */}
          <g filter={`url(#${id}-soft)`} opacity={night ? 0.16 : 0.5}>
            <path
              d={`M${win.l + 14} ${C.back} L${(win.l + win.r) / 2 - 5} ${C.back} L${(win.l + win.r) / 2 - 14} ${C.front} L${win.l - 46} ${C.front} Z`}
              fill={night ? '#A99CFF' : '#FFF6DE'}
            />
            <path
              d={`M${(win.l + win.r) / 2 + 5} ${C.back} L${win.r - 14} ${C.back} L${win.r + 46} ${C.front} L${(win.l + win.r) / 2 + 14} ${C.front} Z`}
              fill={night ? '#A99CFF' : '#FFF6DE'}
            />
          </g>
          {/* the stove's warm pool (the key light at night; goes out when paused) */}
          {heat > 0 && (
            <ellipse cx={kx} cy={K.base - depth * 0.08} rx={plateHalf * 3.1} ry={depth * 0.62} fill={`url(#${id}-pool)`} opacity={(night ? 0.62 : 0.26) * heat} />
          )}
        </g>
        {/* front edge + face */}
        <rect x="0" y={C.front - 1} width={L.w} height={L.w > 500 ? 4 : 3} fill={wood.edge} opacity={night ? 0.5 : 0.9} />
        <rect x="0" y={C.front + (L.w > 500 ? 3 : 2)} width={L.w} height={C.bottom - C.front} fill={`url(#${id}-face)`} />

        {/* contact shadows: one style for both objects; cast toward the viewer (light is the window behind them) */}
        <g>
          <ellipse cx={kx + plateHalf * 0.04} cy={K.base + depth * 0.07} rx={plateHalf * 1.18} ry={depth * 0.1} fill={`rgb(${shadowInk})`} opacity={night ? 0.34 : 0.16} filter={`url(#${id}-soft)`} />
          <ellipse cx={kx} cy={K.base + 1} rx={plateHalf * 1.02} ry={depth * 0.035} fill={`rgb(${shadowInk})`} opacity={night ? 0.7 : 0.42} filter={`url(#${id}-contact)`} />
          <ellipse cx={M.x + M.size * 0.01} cy={M.base + depth * 0.07} rx={M.size * 0.38} ry={depth * 0.1} fill={`rgb(${shadowInk})`} opacity={(night ? 0.34 : 0.16) * (1 - hop / (M.size * 0.08))} filter={`url(#${id}-soft)`} />
          <ellipse cx={M.x} cy={M.base + 1} rx={M.size * 0.3 - hop * 0.6} ry={depth * 0.035} fill={`rgb(${shadowInk})`} opacity={(night ? 0.7 : 0.42) * (1 - hop / (M.size * 0.08))} filter={`url(#${id}-contact)`} />
        </g>
      </svg>

      {/* the kettle (its own ground shadow off: the scene draws it) */}
      <div style={{ position: 'absolute', left: kLeft, top: kTop }}>
        <Kettle2 progress={p} state={state} extended={extended} night={night} size={K.size} t={t} reduced={reduced} ground={false} />
      </div>
      {/* Chai, on the same counter, same scale and shadow */}
      <div style={{ position: 'absolute', left: mLeft, top: mTop - hop, ['--art-shadow' as string]: 'transparent' }}>
        <Mascot pose={pose} size={M.size} animate={false} />
      </div>

      {/* one light over everything: window light from the top (day) / stove warmth + moonlight (night) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          mixBlendMode: 'soft-light',
          background: night
            ? `radial-gradient(${plateHalf * 3.4}px ${plateHalf * 2.6}px at ${kx}px ${K.base - kH * 0.3}px, rgba(255,160,70,${0.75 * heat}), transparent 100%), radial-gradient(70% 45% at 50% 18%, rgba(150,140,255,0.35), transparent 70%)`
            : `radial-gradient(75% 50% at 50% 22%, rgba(255,250,236,0.55), transparent 75%), linear-gradient(180deg, transparent 70%, rgba(90,50,30,0.25))`,
        }}
      />
    </div>
  );
}
