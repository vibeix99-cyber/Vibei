/**
 * Audio public API. OWNER: audio area.
 *
 * Everything is synthesized with WebAudio (no sample files). Screens call:
 *   audio.play(name, { volume?, pitch?, step?, haptic? })   one-shot SFX (+ paired haptic)
 *   audio.setAmbient(kind, { fadeMs? })                      idempotent; crossfades
 *   audio.preview(kind) / audio.stopPreview()                settings picker audition
 *   audio.setAmbientVolume(v) / setSfxVolume / setMasterVolume / setMuted
 *   audio.unlock()                                           from a user gesture (initAudio wires this)
 *   audio.sync()                                             re-read settings (automatic via subscribe)
 *   AMBIENTS                                                 picker metadata {id,label,icon,description}
 *
 * The session soundscape (ambience in/out with the focus timer, pause dip,
 * end-of-session kettle simmer) is automatic — see session.ts.
 */
import { useSettings, type AmbientKind } from '@/state/settings';
import { engine } from './engine';
import { cancelPreview, initSession, previewAmbient, sessionOverrides } from './session';
import type { PlayOptions, SfxName } from './sfx';

export type { SfxName, PlayOptions } from './sfx';
export { SFX_NAMES } from './sfx';
export { AMBIENTS, type AmbientInfo } from './ambience';

export const audio = {
  /** Call from a user gesture (first tap) to unlock audio on iOS/Safari. */
  unlock(): void {
    engine.unlock();
  },
  /** Play a one-shot sound. Safe to call anywhere; no-ops before the first gesture or when muted. */
  play(name: SfxName, opts: PlayOptions = {}): void {
    engine.play(name, opts);
  },
  /**
   * Switch ambience (idempotent; crossfades). `none` fades out. During a focus
   * session the session's own ambience (settings.ambient) wins — update the
   * setting to change it there.
   */
  setAmbient(kind: AmbientKind, opts: { fadeMs?: number } = {}): void {
    if (sessionOverrides(kind)) return;
    engine.setAmbient(kind, opts.fadeMs ?? 1500);
  },
  /** Audition an ambience for a few seconds (settings). In a focus session, change `settings.ambient` instead. */
  preview(kind: AmbientKind, opts: { ms?: number } = {}): void {
    previewAmbient(kind, opts.ms);
  },
  stopPreview(): void {
    cancelPreview();
  },
  /** Currently requested ambience. */
  get ambient(): AmbientKind {
    return engine.ambient;
  },
  setAmbientVolume(v: number): void {
    useSettings.getState().set({ ambientVolume: clamp01(v) });
  },
  setSfxVolume(v: number): void {
    useSettings.getState().set({ sfxVolume: clamp01(v) });
  },
  setMasterVolume(v: number): void {
    useSettings.getState().set({ masterVolume: clamp01(v) });
  },
  setMuted(muted: boolean): void {
    useSettings.getState().set({ muted });
  },
  /** Called when settings change (volumes / mute). Automatic after initAudio(). */
  sync(): void {
    engine.applyVolumes();
    engine.reconcile();
  },
};

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}

let inited = false;

export function initAudio(): void {
  if (inited || typeof window === 'undefined') return;
  inited = true;
  // Persistent (not once): iOS can "interrupt" the context later; any gesture revives it.
  const unlock = () => engine.unlock();
  window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true, passive: true });
  window.addEventListener('touchend', unlock, { capture: true, passive: true });

  useSettings.subscribe((s, p) => {
    if (s.muted !== p.muted || s.masterVolume !== p.masterVolume || s.sfxVolume !== p.sfxVolume || s.ambientVolume !== p.ambientVolume) {
      audio.sync();
    }
  });
  initSession();

  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
    (window as unknown as { __kettleAudio: unknown }).__kettleAudio = { audio, engine };
  }
}

/** Hook form for components: returns the stable `audio.play`. */
export function useSfx(): (name: SfxName, opts?: PlayOptions) => void {
  return audio.play;
}
