import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { clearBackground } from './clearBackground';

const shipped = () => new Uint8Array(readFileSync(fileURLToPath(new URL('../chai/chai.riv', import.meta.url))));
const source = () => new Uint8Array(readFileSync(fileURLToPath(new URL('../../../art-src/chai/rive/chai.riv', import.meta.url))));

describe('chai.riv', () => {
  it('ships byte-for-byte the art-src file', () => {
    const a = shipped();
    const b = source();
    expect(a.length).toBe(45395);
    expect(b.length).toBe(a.length);
    expect(a.every((v, i) => v === b[i])).toBe(true);
  });

  it('clears exactly one opaque background fill (alpha byte only) and nothing else', () => {
    const before = shipped();
    const after = shipped();
    expect(clearBackground(after)).toBe(true);
    const diff = [...after.keys()].filter((i) => after[i] !== before[i]);
    expect(diff).toHaveLength(1);
    expect(before[diff[0]]).toBe(0xff);
    expect(after[diff[0]]).toBe(0x00);
    // The ARGB colour FFFDF9F1 (README/gen_scene `bg`) occurs once in the file.
    const hits = [...before.keys()].filter((i) => before[i] === 0xf1 && before[i + 1] === 0xf9 && before[i + 2] === 0xfd && before[i + 3] === 0xff);
    expect(hits).toHaveLength(1);
    // A second pass finds nothing (already clear), so a republished transparent file is left alone.
    expect(clearBackground(after)).toBe(false);
  });
});
