/** Small presentational bits shared by the focus / break / done screens. */
import { Tag } from '@/ui';
import { TAG_BY_ID } from '@/state/tags';
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
      <span className={s.cycleLabel} data-cycle-label="">
        {label}
      </span>
    </span>
  );
}

/** The intention's tag, same label / icon / tone as everywhere else (`@/state/tags`). */
export function TagChip({ tag }: { tag: TagId }) {
  const t = TAG_BY_ID[tag];
  if (!t) return null;
  return (
    <Tag size="sm" icon={t.icon} tone={t.tone}>
      {t.label}
    </Tag>
  );
}
