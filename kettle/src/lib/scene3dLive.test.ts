import { describe, expect, it } from 'vitest';
import { isScene3dRunning, setScene3dRunning, subscribeScene3d } from './scene3dLive';

describe('scene3dLive', () => {
  it('is running while any 3D engine runs, and notifies only on changes', () => {
    const a = {};
    const b = {};
    let calls = 0;
    const off = subscribeScene3d(() => calls++);
    expect(isScene3dRunning()).toBe(false);
    setScene3dRunning(a, true);
    setScene3dRunning(b, true);
    setScene3dRunning(a, false);
    expect(isScene3dRunning()).toBe(true);
    setScene3dRunning(b, false);
    expect(isScene3dRunning()).toBe(false);
    setScene3dRunning(b, false); // no change, no notification
    expect(calls).toBe(4);
    off();
    setScene3dRunning(a, true);
    expect(calls).toBe(4);
    setScene3dRunning(a, false);
  });
});
