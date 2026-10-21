/** chai.riv byte patch (pure; unit-tested in clearBackground.test.ts). See riveChai.ts for why. */

/** SolidColor (type 18) colorValue (property 37) = FFFDF9F1, little-endian: the artboard's Background fill. */
const BG_FILL = [0x12, 0x25, 0xf1, 0xf9, 0xfd, 0xff];

/** Sets the artboard Background fill's alpha to 0. Returns false when the file has no such fill (already clear). */
export function clearBackground(bytes: Uint8Array): boolean {
  outer: for (let i = 0; i + BG_FILL.length <= bytes.length; i++) {
    for (let j = 0; j < BG_FILL.length; j++) if (bytes[i + j] !== BG_FILL[j]) continue outer;
    bytes[i + BG_FILL.length - 1] = 0;
    return true;
  }
  return false;
}
