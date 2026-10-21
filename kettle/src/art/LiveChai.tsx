/**
 * The animated Chai layer (Rive) over a painted pose. OWNER: art area. Geometry: `./rive/fit.ts`.
 *
 * Rendered inside `PaintedChai`'s box, absolutely positioned and `pointer-events: none`, so it never changes
 * layout or blocks taps. The painted image stays in the box (it keeps the layout and shows until Rive's first
 * settled frame, or for good if Rive or its wasm fails). The runtime is fetched with `import()` on mount only.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useScene3dRunning } from '@/lib/scene3dLive';
import type { ChaiHandle } from './rive/riveChai';
import { RIVE_POSE, riveCanvasBox, type RiveChaiPose } from './rive/fit';
import s from './painted.module.css';

let loader: Promise<typeof import('./rive/riveChai')> | null = null;
const loadRive = () => (loader ??= import('./rive/riveChai').catch((e) => ((loader = null), Promise.reject(e))));

/** `shown` flips together with the image's visibility (same prop, same React commit): until then the canvas runs
 * hidden, so the entry pose (reading) never draws over a sipping or cheering image. */
export function LiveChai({ pose, w, h, shown, onReady, onFail }: { pose: RiveChaiPose; w: number; h: number; shown: boolean; onReady(): void; onFail(): void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const handle = useRef<ChaiHandle | null>(null);
  const scene3d = useScene3dRunning();
  const [onscreen, setOnscreen] = useState(true);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');
  const running = onscreen && visible && !scene3d;
  const want = useRef({ pose, running, onReady, onFail });
  want.current = { pose, running, onReady, onFail };

  // Mount the runtime once; pose and running flow in below.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let alive = true;
    loadRive()
      .then((m) => {
        if (!alive) return;
        handle.current = m.mountChai(canvas, {
          pose: RIVE_POSE[want.current.pose],
          running: want.current.running,
          onReady: () => alive && want.current.onReady(),
          onError: () => alive && want.current.onFail(),
        });
      })
      .catch(() => alive && want.current.onFail());
    const ro = new ResizeObserver(() => handle.current?.resize());
    ro.observe(canvas);
    const io = new IntersectionObserver((es) => setOnscreen(es.some((e) => e.isIntersecting)));
    io.observe(canvas);
    const onVis = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      handle.current?.destroy();
      handle.current = null;
    };
  }, []);

  useEffect(() => handle.current?.setPose(RIVE_POSE[pose]), [pose]);
  useEffect(() => handle.current?.setRunning(running), [running]);

  const box = riveCanvasBox(pose, w, h);
  const style: CSSProperties = { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%`, visibility: shown ? 'visible' : 'hidden' };
  return <canvas ref={ref} className={s.rive} style={style} aria-hidden data-rive-chai={pose} data-running={running ? '' : undefined} data-shown={shown ? '' : undefined} />;
}
