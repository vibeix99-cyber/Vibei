/**
 * The Focus still life. OWNER: core-loop area.
 *
 * One scene, one light:
 *   back   the nook's own window (engine `window` view: the user's room, weather and time of day), held as a
 *          still frame and quieted so it supplies atmosphere without competing;
 *   middle one wooden counter spanning the stage (the room's wood palette) that the kettle and Chai share;
 *   front  contact shadows drawn once, in one style, for both; then one lighting layer over everything.
 * Light follows the window: by day its light spills forward across the counter (the pane shape, split by the
 * mullion) and shadows fall toward the viewer; at dusk and night the window is dim and the stove is the key
 * light — a warm pool on the counter that also warms Chai's near side. Paused or resting: the stove light is out.
 *
 * Sizing: everything is laid out in `--u` units (min(container width, height) / 400, capped so the painted
 * Chai is never enlarged much beyond its source pixels on a 2× screen). The stage never changes position
 * between Focus, the whistle, the summary and the tea break, so nothing jumps or cross-fades.
 */
import { useMemo, type CSSProperties } from 'react';
import { PaintedChai, PAINTED, SHEET_MARGIN, SHEET_REF_H, type PaintedPose } from '@/art';
import { Nook } from '@/scene';
import { useSceneTime } from '@/scene/resolve';
import { Kettle, KETTLE_FOOT, KETTLE_VIEW, type KettleState } from './Kettle';
import s from './Stage.module.css';

export interface StageProps {
  state: KettleState;
  /** 0..1 through the current brew. */
  progress: number;
  /** Where added time begins on the gauge (see Kettle). */
  addedFrom?: number;
  chai: PaintedPose;
  /** Unlocked nook items (the window view shows the user's own room). */
  items: string[];
  weather: 'rain' | 'snow' | 'clear';
  reduced: boolean;
  /** Hold the window as a still frame (always, in practice: it is quieter and costs nothing while you focus). */
  still?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Room items kept out of the window backdrop: the tea set's teapot (and its steam) would stand right behind
 *  the stage's kettle and read as a second kettle. It stays in the Nook itself. */
const NOT_IN_BACKDROP = new Set(['teaSet']);

/** Design units (see header). Kettle and Chai sizes are expressed in `--u`. */
const KETTLE_W = 290; // kettle svg width
const CHAI_SIZE = 186; // PaintedChai `size`

export function Stage({ state, progress, addedFrom = 1, chai, items, weather, reduced, still = true, className, style }: StageProps) {
  const time = useSceneTime('auto');
  const night = time === 'night' || time === 'dusk';
  const heat = state === 'paused' || state === 'rest' ? 0 : state === 'whistle' ? 1 : 0.25 + 0.75 * Math.min(1, Math.max(0, progress));
  const pose = PAINTED[chai];
  // Chai's feet sit on the same line as the kettle's burner; the pose image carries a small margin below them.
  const chaiH = (pose.h / SHEET_REF_H) * CHAI_SIZE;
  const chaiW = (pose.w / SHEET_REF_H) * CHAI_SIZE;
  const chaiDrop = (SHEET_MARGIN / SHEET_REF_H) * CHAI_SIZE;
  const kH = (KETTLE_W * KETTLE_VIEW.h) / KETTLE_VIEW.w;
  const kFootX = ((KETTLE_FOOT.cx - KETTLE_VIEW.x) / KETTLE_VIEW.w) * KETTLE_W;
  const kFootY = ((KETTLE_FOOT.bottom - KETTLE_VIEW.y) / KETTLE_VIEW.h) * kH;
  const plate = (KETTLE_FOOT.halfWidth / KETTLE_VIEW.w) * KETTLE_W;
  const backdropItems = useMemo(() => items.filter((id) => !NOT_IN_BACKDROP.has(id)), [items]);
  return (
    <div
      className={[s.stage, className].filter(Boolean).join(' ')}
      style={
        {
          ...style,
          '--heat': heat,
          '--k-w': KETTLE_W,
          '--k-h': kH,
          '--k-foot-x': kFootX,
          '--k-foot-y': kFootY,
          '--plate': plate,
          '--chai-w': chaiW,
          '--chai-h': chaiH,
          '--chai-drop': chaiDrop,
        } as CSSProperties
      }
      data-night={night || undefined}
      data-state={state}
      data-reduced={reduced || undefined}
      aria-hidden="true"
    >
      <div className={s.back}>
        <Nook mode="window" items={backdropItems} weather={weather} timeOfDay="auto" paused={still} backdrop className={s.window} />
        <div className={s.quiet} />
      </div>

      <div className={s.counter}>
        <div className={s.top}>
          <span className={s.grain} />
          <span className={s.spill} />
          <span className={s.pool} />
        </div>
        <div className={s.edge} />
        <div className={s.face} />
      </div>

      <div className={s.set}>
        <span className={`${s.shadow} ${s.kShadow}`} />
        <span className={`${s.shadow} ${s.cShadow}`} />
        <Kettle className={s.kettle} progress={progress} state={state} addedFrom={addedFrom} night={night} reduced={reduced} width={KETTLE_W} />
        <div className={s.chai} data-pose={chai}>
          <PaintedChai pose={chai} size={CHAI_SIZE} faceBelow={0} />
        </div>
      </div>

      <div className={s.light} />
    </div>
  );
}
