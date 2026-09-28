/** Small presentational bits shared by the focus / break / done screens. */
import type { IconName } from '@/art';
import { Tag } from '@/ui';
import type { TagId } from '@/state/settings';
import s from './bits.module.css';

/** "Brew 2 of 4" dots. `filled` = completed brews in this cycle; `current` = 1-based brew in progress (0 = none). */
export function CycleDots({ total, filled, current, label }: { total: number; filled: number; current: number; label: string }) {
  return (
    <span className={s.cycle}>
      <span className={s.dots} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const state = n <= filled ? 'done' : n === current ? 'now' : 'todo';
          return <span key={n} className={s.dot} data-state={state} />;
        })}
      </span>
      <span className={s.cycleLabel}>{label}</span>
    </span>
  );
}

/** Same labels + icons as the Today screen's tag chips. */
const TAG_INFO: Record<TagId, { label: string; icon: IconName }> = {
  work: { label: 'Work', icon: 'target' },
  study: { label: 'Study', icon: 'edit' },
  read: { label: 'Read', icon: 'info' },
  create: { label: 'Create', icon: 'sparkle' },
  life: { label: 'Life', icon: 'home' },
};

export function TagChip({ tag }: { tag: TagId }) {
  const t = TAG_INFO[tag];
  if (!t) return null;
  return (
    <Tag size="sm" icon={t.icon}>
      {t.label}
    </Tag>
  );
}
