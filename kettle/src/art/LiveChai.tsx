/**
 * The animated Chai layer (Rive) over a painted pose. OWNER: art area.
 *
 * Rendered inside `PaintedChai`'s box, absolutely positioned and `pointer-events: none`, so it never changes
 * layout or blocks taps. The painted image stays in the box (it keeps the layout and shows until Rive's first
 * settled frame, or for good if Rive or its wasm fails). The runtime is fetched with `import()` on mount only.
 *
 * Footprint: Chai's body in the artboard (1312x1586) is scaled by HEIGHT onto the painted image's ink, feet on
 * its baseline and centred on its ink. `RIVE_FIT` holds, per pose, the scale (sheet px per artboard px) and the
 * painted ink's bottom/centre (sheet px, in the `PAINTED` box), measured from the shipped WebP files and the
 * artboard (feet at y 1452, body centre x 656; body tops at rest 51 / 44 / 80). The extra side margins
 * (cheering arms) overflow the box.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useScene3dRunning } from '@/lib/scene3dLive';
import type { ChaiHandle, RivePose } from './rive/riveChai';
import s from './painted.module.css';

export type RiveChaiPose = 'reading' | 'sipping' | 'cheering';
export const RIVE_POSE: Record<RiveChaiPose, RivePose> = { reading: 0, sipping: 1, cheering: 2 };

const ARTBOARD = { w: 1312, h: 1586, cx: 656, feet: 1452 };

/** k = painted ink height / artboard body height; bottom, cx = painted ink baseline and centre (sheet px). */
export const RIVE_FIT: Record<RiveChaiPose, { k: number; bottom: number; cx: number }> = {
  reading: { k: 479.0 / 1401, bottom: 483.0, cx: 155.1 },
  sipping: { k: 481.4 / 1408, bottom: 487.0, cx: 151.0 },
  cheering: { k: 419.2 / 1372, bottom: 424.0, cx: 156.0 },
};

/** Where the canvas sits, as % of the pose box (`w` x `h` sheet px). */
export function riveCanvasBox(pose: RiveChaiPose, w: number, h: number) {
  const { k, bottom, cx } = RIVE_FIT[pose];
  return {
    left: ((cx - ARTBOARD.cx * k) / w) * 100,
    top: ((bottom - ARTBOARD.feet * k) / h) * 100,
    width: ((ARTBOARD.w * k) / w) * 100,
    height: ((ARTBOARD.h * k) / h) * 100,
  };
}

let loader: Promise<typeof import('./rive/riveChai')> | null = null;
const loadRive = () => (loader ??= import('./rive/riveChai').catch((e) => ((loader = null), Promise.reject(e))));

export function LiveChai({ pose, w, h, onReady, onFail }: { pose: RiveChaiPose; w: number; h: number; onReady(): void; onFail(): void }) {
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
  const style: CSSProperties = { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` };
  return <canvas ref={ref} className={s.rive} style={style} aria-hidden data-rive-chai={pose} data-running={running ? '' : undefined} />;
}
