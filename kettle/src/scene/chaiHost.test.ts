/** I06 policy: which tiers ask for the Blender Chai (Vibei's W2R2 sign-off: the low tier too). */
import { describe, expect, it } from 'vitest';
import { MODEL_ON_LOW, chaiModelWanted } from './chaiHost';

describe('chaiModelWanted', () => {
  it('asks for the model on the high and the low tier, never with 3D off', () => {
    expect(MODEL_ON_LOW).toBe(true);
    expect(chaiModelWanted('high')).toBe(true);
    expect(chaiModelWanted('low')).toBe(true);
    expect(chaiModelWanted('off')).toBe(false);
  });
});
