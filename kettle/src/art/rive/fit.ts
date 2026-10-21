/**
 * Where the Rive Chai sits over a painted pose box. OWNER: art area. Pure (unit-tested in fit.test.ts).
 *
 * Footprint: Chai's body in the artboard (1312x1586) is scaled by HEIGHT onto the painted image's ink, feet on
 * its baseline and centred on its ink. `RIVE_FIT` holds, per pose, the scale (sheet px per artboard px) and the
 * painted ink's bottom/centre (sheet px, in the `PAINTED` box), measured from the shipped WebP files and the
 * artboard (feet at y 1452, body centre x 656; body tops at rest 51 / 44 / 80). The extra side margins
 * (cheering arms) overflow the box. Scaling by height keeps baseline, height and centre within 1 CSS px of the
 * painted image; widths follow the Rive art (reading/sipping within ~1.5 px, the W3R3 stretch of the WebP; cheering's
 * Rive body is ~11 % wider than the painted cheering at the same height).
 */
import type { RivePose } from './pose';

export type RiveChaiPose = 'reading' | 'sipping' | 'cheering';
export const RIVE_POSE: Record<RiveChaiPose, RivePose> = { reading: 0, sipping: 1, cheering: 2 };

const ARTBOARD = { w: 1312, h: 1586, cx: 656, feet: 1452 };

/** k = painted ink height / artboard body height; bottom, cx = painted ink baseline and centre (sheet px). */
export const RIVE_FIT: Record<RiveChaiPose, { k: number; bottom: number; cx: number }> = {
  reading: { k: 479.0 / 1401, bottom: 483.0, cx: 155.1 },
  sipping: { k: 481.4 / 1408, bottom: 487.0, cx: 151.0 },
  cheering: { k: 419.2 / 1372, bottom: 424.0, cx: 156.0 },
};

/** Where the canvas sits, as % of the pose box (`w` x `h` sheet px). */
export function riveCanvasBox(pose: RiveChaiPose, w: number, h: number) {
  const { k, bottom, cx } = RIVE_FIT[pose];
  return {
    left: ((cx - ARTBOARD.cx * k) / w) * 100,
    top: ((bottom - ARTBOARD.feet * k) / h) * 100,
    width: ((ARTBOARD.w * k) / w) * 100,
    height: ((ARTBOARD.h * k) / h) * 100,
  };
}

