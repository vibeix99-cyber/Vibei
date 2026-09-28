import { describe, expect, it } from 'vitest';
import { Simmer, createAmbient, prepareVoice, voiceReady, type AmbientVoice } from './ambience';
import { mulberry32 } from './dsp';
import { noiseBuffer } from './instruments';

/** A do-nothing stand-in for any WebAudio node / param (every call returns another stand-in). */
function stub(): unknown {
  const fn = function () {};
  return new Proxy(fn, {
    get: (_t, p) => {
      if (p === 'connect') return (d: unknown) => d;
      if (p === 'value' || p === 'duration' || p === 'length') return 1;
      if (p === Symbol.toPrimitive) return () => 1;
      return stub();
    },
    set: () => true,
    apply: () => stub(),
  });
}

/** Fake context: real `createBuffer` bookkeeping (counted), stubs for everything else. */
function fakeCtx() {
  const created: Float32Array[][] = [];
  const base = {
    sampleRate: 4000,
    currentTime: 0,
    createBuffer: (ch: number, len: number) => {
      const data: Float32Array[] = Array.from({ length: ch }, () => new Float32Array(len));
      created.push(data);
      return { numberOfChannels: ch, length: len, duration: len / 4000, copyToChannel: (d: Float32Array, c: number) => data[c]!.set(d) };
    },
  };
  const ctx = new Proxy(base, {
    get: (t, p) => (p in t ? t[p as keyof typeof t] : () => stub()),
  }) as unknown as BaseAudioContext;
  return { ctx, created };
}

const KINDS = ['rain', 'fire', 'forest', 'brown', 'lofi'] as const;

describe('ambience noise beds are prepared off the critical path', () => {
  for (const kind of [...KINDS, 'simmer'] as const) {
    it(`${kind}: after prepareVoice, start() generates no buffers`, async () => {
      const { ctx, created } = fakeCtx();
      expect(voiceReady(ctx, kind)).toBe(false);
      await prepareVoice(ctx, kind);
      expect(voiceReady(ctx, kind)).toBe(true);
      const before = created.length;
      const d = { ctx, dry: stub() as AudioNode, wet: stub() as AudioNode, rng: mulberry32(1) };
      const v: AmbientVoice = kind === 'simmer' ? new Simmer({ ...d, wet: null }) : createAmbient(kind, d);
      v.start(0);
      // Only the long looping beds matter here; short grain banks are built lazily in schedule().
      expect(created.slice(before)).toEqual([]);
    });
  }

  it('prepared beds are identical to synchronously generated ones', async () => {
    const a = fakeCtx();
    const b = fakeCtx();
    await prepareVoice(a.ctx, 'lofi');
    noiseBuffer(b.ctx, 'pink', 9.7, 61);
    expect(a.created).toHaveLength(1);
    expect(b.created).toHaveLength(1);
    for (let ch = 0; ch < 2; ch++) expect(a.created[0]![ch]).toEqual(b.created[0]![ch]);
    expect(a.created[0]![0]).not.toEqual(a.created[0]![1]);
  });
});
