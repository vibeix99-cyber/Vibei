/**
 * Rotating tea-break ideas with art. Rotates on its own (pauses while hovered
 * or focused); "Another idea" steps manually. The breathing idea shows a live
 * guide: the circle grows for 4 s (in) and settles for 6 s (out).
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BreakSpot, Icon } from '@/art';
import { ease } from '@/lib/motion';
import { usePageVisible } from '../parts/hooks';
import { BreakArt } from './BreakArt';
import { suggestionsFor, type Suggestion } from './suggestions';
import s from './BreakIdeas.module.css';

export function BreakIdeas({ long, reduced, seed = 0 }: { long: boolean; reduced: boolean; seed?: number }) {
  const list = useMemo(() => suggestionsFor(long), [long]);
  const [i, setI] = useState(() => seed % list.length);
  const [hold, setHold] = useState(false);
  // Only announce ideas the user asked for — auto-rotation stays quiet.
  const [manual, setManual] = useState(false);
  const visible = usePageVisible();
  const current: Suggestion = list[i % list.length];

  useEffect(() => {
    if (hold || !visible) return;
    const t = setTimeout(() => setI((n) => (n + 1) % list.length), (current.dwell ?? 20) * 1000);
    return () => clearTimeout(t);
  }, [i, hold, visible, list.length, current.dwell]);

  return (
    <section
      className={s.card}
      aria-label="Tea-break idea"
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      {/* Old and new ideas overlap (slide past each other) — the card is never empty mid-change. */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={current.id}
          className={s.row}
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0, transition: { duration: reduced ? 0.2 : 0.32, ease: ease.out } }}
          exit={reduced ? { opacity: 0, transition: { duration: 0.2 } } : { opacity: 0, x: -28, transition: { duration: 0.22, ease: ease.out } }}
        >
          <div className={s.art}>
            {current.id === 'breathe' ? (
              <Breathe reduced={reduced} />
            ) : current.id === 'stretch' || current.id === 'water' || current.id === 'eyes' ? (
              <BreakSpot kind={current.id} size={80} backdrop={false} animate={!reduced} />
            ) : (
              <BreakArt kind={current.id} size={72} />
            )}
          </div>
          <div className={s.text}>
            <h3 className={s.title}>{current.title}</h3>
            <p className={s.body}>{current.body}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="sr-only" aria-live="polite">
        {manual ? `${current.title}. ${current.body}` : ''}
      </p>
      <div className={s.foot}>
        <span className={s.dots} aria-hidden="true">
          {list.map((x, n) => (
            <span key={x.id} className={s.dot} data-on={n === i % list.length} />
          ))}
        </span>
        <button
          type="button"
          className={s.next}
          onClick={() => {
            setManual(true);
            setI((n) => (n + 1) % list.length);
          }}
        >
          Another idea
          <Icon name="chevronRight" size={18} />
        </button>
      </div>
    </section>
  );
}

/** Breathing guide: 4 s in, 6 s out. Reduced motion: no scaling, text + tint only. */
function Breathe({ reduced }: { reduced: boolean }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p === 'in' ? 'out' : 'in')), phase === 'in' ? 4000 : 6000);
    return () => clearTimeout(t);
  }, [phase]);
  return (
    <div className={s.breathe} data-phase={phase} data-reduced={reduced}>
      <span className={s.halo} />
      <span className={s.core} />
      <span className={s.breatheLabel}>{phase === 'in' ? 'In' : 'Out'}</span>
    </div>
  );
}
