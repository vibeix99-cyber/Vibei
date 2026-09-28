/**
 * Audio API — PLACEHOLDER IMPLEMENTATION. OWNER: audio area.
 * Keep this public surface stable (screens call it); replace internals freely.
 */
import type { AmbientKind } from '@/state/settings';

export type SfxName =
  | 'tap' // generic button press
  | 'toggle' // switch / chip select
  | 'start' // put the kettle on
  | 'pause'
  | 'resume'
  | 'complete' // focus done — kettle whistle → chime
  | 'breakOver' // break finished
  | 'addTime'
  | 'cancel' // end early / dismiss
  | 'levelUp'
  | 'badge'
  | 'quest' // recipe complete / tin open
  | 'streak' // streak extended
  | 'streakTick' // number count-up tick
  | 'leaf' // leaf counter tick
  | 'pop' // small appear
  | 'whoosh' // sheet / screen transition
  | 'error';

export interface PlayOptions {
  /** 0..1 multiplier on top of SFX volume */
  volume?: number;
  /** semitone offset (e.g. rising ticks) */
  pitch?: number;
}

let ctx: AudioContext | null = null;

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export const audio = {
  /** Call from a user gesture (first tap) to unlock audio on iOS/Safari. */
  unlock(): void {
    const c = ensure();
    if (c && c.state === 'suspended') void c.resume();
  },
  play(name: SfxName, opts: PlayOptions = {}): void {
    void name;
    void opts;
  },
  setAmbient(kind: AmbientKind, opts: { fadeMs?: number } = {}): void {
    void kind;
    void opts;
  },
  /** Called when settings change (volumes / mute). */
  sync(): void {},
};

export function initAudio(): void {
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock, { once: true, capture: true });
  window.addEventListener('keydown', unlock, { once: true, capture: true });
}

export function useSfx() {
  return audio.play;
}
