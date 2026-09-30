/**
 * Round-6 MOCKUP: the approved Chai art (assets/chai/source/chai-sheet-approved.webp), used as painted raster
 * poses, not redrawn. Poses are extracted by extract-chai.py at the sheet's native scale, so one scale factor
 * keeps every pose the same size relative to the others (cheering is shorter because the pose is lower).
 *   reading → Focus · sipping → the tea break · cheering → the whistle / completion
 *   concerned → gentle support only · happy → Home greeting
 * Format: WebP with alpha (≈19 KB each, alpha identical to the PNG master; mean colour error 1.5/255).
 */
const A = '../assets/chai';

export type ChaiPose = 'reading' | 'sipping' | 'cheering' | 'concerned' | 'happy';

/** native pixel size of each extracted pose (4 px transparent margin on every side) */
export const CHAI: Record<ChaiPose, { w: number; h: number }> = {
  reading: { w: 311, h: 487 },
  sipping: { w: 302, h: 491 },
  cheering: { w: 312, h: 428 },
  concerned: { w: 298, h: 474 },
  happy: { w: 303, h: 496 },
};
const REF_H = CHAI.reading.h;

/** CSS size of a pose when the reading pose is `height` px tall (keeps poses on one scale) */
export function chaiSize(pose: ChaiPose, height: number) {
  const s = height / REF_H;
  return { w: CHAI[pose].w * s, h: CHAI[pose].h * s, margin: 4 * s };
}

export function ChaiArt({ pose, height, style, alt }: { pose: ChaiPose; height: number; style?: React.CSSProperties; alt?: string }) {
  const { w, h } = chaiSize(pose, height);
  return <img src={`${A}/chai-${pose}.webp`} width={w} height={h} alt={alt ?? `Chai, ${pose}`} style={{ display: 'block', width: w, height: h, ...style }} />;
}

/**
 * Round avatar for very small sizes (a full pose stops reading below about 40 px): the happy pose's head and yuzu,
 * framed by a circle so the crop has a finished edge instead of a cut-off chest.
 */
export function ChaiFace({ size, style }: { size: number; style?: React.CSSProperties }) {
  const h = size * 1.12;
  const w = h * (303 / 312);
  return (
    <span style={{ position: 'relative', display: 'block', width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: 'var(--honey-soft)', ...style }}>
      <img src={`${A}/chai-happy-face.webp`} alt="Chai" style={{ position: 'absolute', width: w, height: h, left: (size - w) / 2, top: size * 0.02 }} />
    </span>
  );
}
