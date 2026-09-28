/** Short ambience auditions (onboarding + settings) via `audio.preview`, with a "playing" indicator. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '@/audio';
import type { AmbientKind } from '@/state/settings';

const PREVIEW_MS = 8_000;

export function useAmbientPreview() {
  const [playing, setPlaying] = useState<AmbientKind | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);

  const stop = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    if (active.current) audio.stopPreview();
    active.current = false;
    setPlaying(null);
  }, []);

  const preview = useCallback(
    (kind: AmbientKind) => {
      if (timeout.current) clearTimeout(timeout.current);
      if (kind === 'none') {
        stop();
        return;
      }
      audio.unlock();
      audio.preview(kind, { ms: PREVIEW_MS });
      active.current = true;
      setPlaying(kind);
      timeout.current = setTimeout(() => {
        active.current = false;
        setPlaying(null);
      }, PREVIEW_MS);
    },
    [stop],
  );

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
      if (active.current) audio.stopPreview();
    },
    [],
  );

  return { playing, preview, stop };
}
