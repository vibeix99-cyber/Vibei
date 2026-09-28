/**
 * Speech bubble for Chai. Tail points at the speaker. OWNER: design-system area.
 *   <div style={{display:'flex', alignItems:'center'}}><Mascot/><SpeechBubble tail="left">Hi!</SpeechBubble></div>
 */
import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'motion/react';
import { spring } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cx, type Tone } from './util';
import s from './SpeechBubble.module.css';

export interface SpeechBubbleProps {
  children: ReactNode;
  /** Which side the tail sits on (towards the speaker). Default 'left'. */
  tail?: 'left' | 'top' | 'bottom' | 'right' | 'none';
  /** Tail position along its side (px or %). Default: 50% for left/right, 36px for top/bottom. */
  tailAt?: number | string;
  tone?: 'plain' | Tone;
  size?: 'md' | 'lg';
  /** Pop in on mount ("everything that appears, arrives"). Default true. */
  arrive?: boolean;
  /** Announce changes politely (for Chai lines that update in place). */
  live?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function SpeechBubble({
  children,
  tail = 'left',
  tailAt,
  tone = 'plain',
  size = 'md',
  arrive = true,
  live,
  className,
  style,
}: SpeechBubbleProps) {
  const reduced = useReducedMotion();
  const at = tailAt ?? (tail === 'left' || tail === 'right' ? '50%' : 36);
  const origin = { left: '0% 50%', right: '100% 50%', top: '30% 0%', bottom: '30% 100%', none: '50% 50%' }[tail];
  return (
    <motion.div
      className={cx(s.bubble, s[size], s[`tail-${tail}`], className)}
      data-tone={tone === 'plain' ? undefined : tone}
      style={{ ...style, ['--tail-at' as string]: typeof at === 'number' ? `${at}px` : at, transformOrigin: origin }}
      initial={arrive ? (reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }) : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0.16 } : spring.cozy}
      aria-live={live ? 'polite' : undefined}
    >
      {children}
    </motion.div>
  );
}
