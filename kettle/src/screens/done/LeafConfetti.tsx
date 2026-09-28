/**
 * Lightweight leaf confetti: ~26 SVG leaves burst up from an origin, then
 * flutter down with sway + spin. Pure transforms (GPU-friendly), no canvas.
 * Reduced motion: a few leaves simply fade in around the origin and stay.
 */
import { useMemo } from 'react';
import { motion } from 'motion/react';
import s from './Done.module.css';

const COLORS = [
  ['#4F9E3D', '#3A7A2C'],
  ['#8FD17B', '#4F9E3D'],
  ['#6FB25C', '#3A7A2C'],
  ['#FFC23D', '#D6950F'],
  ['#FF9D68', '#E8612B'],
];

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LeafConfettiProps {
  /** Changing the key re-fires the burst. */
  burstKey: number | string;
  count?: number;
  reduced: boolean;
  /** Spread multiplier (1 = hero-sized burst). */
  spread?: number;
  delay?: number;
  palette?: 'tea' | 'gold';
}

export function LeafConfetti({ burstKey, count = 26, reduced, spread = 1, delay = 0, palette = 'tea' }: LeafConfettiProps) {
  const leaves = useMemo(() => {
    const r = rand(String(burstKey).length * 977 + count);
    return Array.from({ length: reduced ? 6 : count }, (_, i) => {
      const angle = (-90 + (r() - 0.5) * 150) * (Math.PI / 180);
      const dist = (110 + r() * 170) * spread;
      // Stay inside the hero: never drift across the headline or past the card edges.
      const dx = Math.max(-150, Math.min(150, Math.cos(angle) * dist));
      const up = Math.sin(angle) * dist; // negative = up
      const fall = Math.min(60 + r() * 120, 85 - up);
      const colors = palette === 'gold' ? COLORS[3 + (i % 2)] : COLORS[Math.floor(r() * (r() < 0.8 ? 3 : 5))];
      return {
        dx,
        up,
        fall,
        sway: (r() - 0.5) * 60,
        rot: (r() - 0.5) * 720,
        size: 14 + r() * 14,
        dur: 1.9 + r() * 1.1,
        wait: delay + r() * 0.12,
        colors,
        // static positions for reduced motion
        sx: (i % 3 - 1) * 90 + (r() - 0.5) * 30,
        sy: -60 - (i % 2) * 50 + (r() - 0.5) * 20,
      };
    });
  }, [burstKey, count, reduced, spread, delay, palette]);

  return (
    <div className={s.confetti} aria-hidden="true">
      {leaves.map((l, i) => (
        <motion.span
          key={`${burstKey}-${i}`}
          className={s.leaf}
          style={{ width: l.size, height: l.size, marginLeft: -l.size / 2, marginTop: -l.size / 2 }}
          initial={reduced ? { opacity: 0, x: l.sx, y: l.sy, rotate: l.rot / 8 } : { opacity: 0, x: 0, y: 0, scale: 0.3, rotate: 0 }}
          animate={
            reduced
              ? { opacity: [0, 0.9, 0.9, 0], transition: { duration: 2.4, delay: l.wait, times: [0, 0.2, 0.75, 1] } }
              : {
                  opacity: [0, 1, 1, 0],
                  x: [0, l.dx, l.dx + l.sway, l.dx - l.sway * 0.6],
                  y: [0, l.up, l.up + l.fall * 0.55, l.up + l.fall],
                  scale: [0.3, 1, 1, 0.9],
                  rotate: [0, l.rot * 0.4, l.rot * 0.8, l.rot],
                  transition: {
                    duration: l.dur,
                    delay: l.wait,
                    times: [0, 0.28, 0.7, 1],
                    ease: ['circOut', 'easeInOut', 'easeIn'],
                  },
                }
          }
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z" fill={l.colors[0]} />
            <path d="M20 4c0 10-6 16-16 16 5-3 11-9 16-16z" fill={l.colors[1]} opacity="0.6" />
          </svg>
        </motion.span>
      ))}
    </div>
  );
}
