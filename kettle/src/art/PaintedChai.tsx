/**
 * Chai, painted. OWNER: art area.
 *
 * The approved art direction (art-src/chai/chai-sheet-approved.webp) used as painted raster poses —
 * never redrawn as vector, so the soft shading, proportions, muzzle and yuzu stay exactly as approved.
 * Masters (PNG) live in art-src/chai; the app ships transparent WebP (≈15–21 KB each).
 *
 * All poses come from one sheet at one scale, so a single scale factor keeps them the same size
 * relative to each other (cheering is shorter because the pose sits lower). Below ~44 px a full pose
 * stops reading, so `PaintedChai` switches to the round face avatar (`ChaiFace`).
 */
import type { CSSProperties } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import reading from './chai/chai-reading.webp';
import sipping from './chai/chai-sipping.webp';
import cheering from './chai/chai-cheering.webp';
import concerned from './chai/chai-concerned.webp';
import happy from './chai/chai-happy.webp';
import stretch from './chai/chai-stretch.webp';
import look from './chai/chai-look.webp';
import sleep from './chai/chai-sleep.webp';
import face from './chai/chai-happy-face.webp';
import s from './painted.module.css';

export type PaintedPose = 'reading' | 'sipping' | 'cheering' | 'concerned' | 'happy' | 'stretch' | 'look' | 'sleep';

/** Native pixel size of each pose (each has a 4 px transparent margin). */
export const PAINTED: Record<PaintedPose, { src: string; w: number; h: number }> = {
  reading: { src: reading, w: 311, h: 487 },
  sipping: { src: sipping, w: 302, h: 491 },
  cheering: { src: cheering, w: 312, h: 428 },
  concerned: { src: concerned, w: 298, h: 474 },
  happy: { src: happy, w: 303, h: 496 },
  stretch: { src: stretch, w: 288, h: 433 },
  look: { src: look, w: 310, h: 431 },
  sleep: { src: sleep, w: 323, h: 300 },
};
/** The sheet's reference height: `size` px means "a pose as tall as the tallest one is `size`". */
export const SHEET_REF_H = 500;
/** Native margin around every pose, in sheet px. */
export const SHEET_MARGIN = 4;

/** CSS size of a pose for a given `size` (same scale for every pose). */
export function paintedBox(pose: PaintedPose, size: number) {
  const k = size / SHEET_REF_H;
  return { w: PAINTED[pose].w * k, h: PAINTED[pose].h * k, margin: SHEET_MARGIN * k };
}

export interface PaintedChaiProps {
  pose: PaintedPose;
  /** Scale reference in CSS px (see SHEET_REF_H). */
  size: number;
  /** Gentle breathing. Off under reduced motion. */
  animate?: boolean;
  /** Accessible label; decorative (aria-hidden) when omitted. */
  title?: string;
  className?: string;
  style?: CSSProperties;
  /** Below this size the round face avatar is used instead of the full pose. */
  faceBelow?: number;
  /** Load hint (most Chai is above the fold). */
  loading?: 'eager' | 'lazy';
}

export function PaintedChai({ pose, size, animate = false, title, className, style, faceBelow = 44, loading = 'eager' }: PaintedChaiProps) {
  const reduced = useReducedMotion();
  if (size < faceBelow) return <ChaiFace size={size} title={title} className={className} style={style} />;
  const { w, h } = paintedBox(pose, size);
  const live = animate && !reduced;
  return (
    <span
      className={[s.pose, live ? s.live : '', className].filter(Boolean).join(' ')}
      style={{ width: w, height: h, ...style }}
      data-pose={pose}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <img src={PAINTED[pose].src} width={Math.round(w)} height={Math.round(h)} alt="" draggable={false} decoding="async" loading={loading} className={s.img} />
    </span>
  );
}

/** Round avatar (happy head + yuzu) for very small sizes. */
export function ChaiFace({ size, title, className, style }: { size: number; title?: string; className?: string; style?: CSSProperties }) {
  const h = size * 1.12;
  const w = h * (303 / 312);
  return (
    <span
      className={[s.face, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ...style }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <img src={face} alt="" draggable={false} decoding="async" style={{ width: w, height: h, left: (size - w) / 2, top: size * 0.02 }} />
    </span>
  );
}
