import { describe, expect, it } from 'vitest';
import { PAINTED_BOXES } from './fit.fixture';
import { RIVE_FIT, RIVE_POSE, riveCanvasBox } from './fit';

describe('Rive Chai fit', () => {
  it('maps poses to the file values: reading 0, sipping 1, cheering 2', () => {
    expect(RIVE_POSE).toEqual({ reading: 0, sipping: 1, cheering: 2 });
  });

  for (const pose of ['reading', 'sipping', 'cheering'] as const)
    it(`${pose}: the artboard feet land on the painted baseline and the body centre on the painted centre`, () => {
      const { w, h } = PAINTED_BOXES[pose];
      const b = riveCanvasBox(pose, w, h);
      const k = RIVE_FIT[pose].k;
      // canvas (%) -> sheet px, then artboard feet (y 1452) and centre (x 656) back into the box
      const top = (b.top / 100) * h;
      const left = (b.left / 100) * w;
      const scale = ((b.height / 100) * h) / 1586;
      expect(scale).toBeCloseTo(k, 10);
      expect(((b.width / 100) * w) / 1312).toBeCloseTo(k, 10); // uniform: no stretch
      expect(top + 1452 * scale).toBeCloseTo(RIVE_FIT[pose].bottom, 6);
      expect(left + 656 * scale).toBeCloseTo(RIVE_FIT[pose].cx, 6);
    });

  it('reading and sipping share one scale (same body size), cheering is the painted one (smaller)', () => {
    expect(RIVE_FIT.reading.k).toBeCloseTo(RIVE_FIT.sipping.k, 4);
    expect(RIVE_FIT.cheering.k).toBeLessThan(RIVE_FIT.reading.k);
  });
});
