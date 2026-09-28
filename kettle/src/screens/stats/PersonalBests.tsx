/** Personal bests — the records worth being a little proud of. */
import { useId, useMemo } from 'react';
import { Icon, type IconName } from '@/art';
import { addDays, type DayKey } from '@/lib/dates';
import { personalBests } from '@/progress/insights';
import type { SessionRecord } from '@/progress';
import { Card, cx } from '@/ui';
import { dayRange, hm, monthDay } from './format';
import s from './stats.module.css';

interface Item {
  icon: IconName;
  value: string;
  label: string;
  when: string;
}

export function PersonalBestsCard({ sessions, today, weekStartsOn }: { sessions: SessionRecord[]; today: DayKey; weekStartsOn: number }) {
  const pb = useMemo(() => personalBests(sessions, weekStartsOn), [sessions, weekStartsOn]);
  const headingId = useId();
  const items: Item[] = [];
  if (pb.bestDay) items.push({ icon: 'sun', value: hm(pb.bestDay.focusMs), label: 'Best day', when: monthDay(pb.bestDay.day, today) });
  if (pb.bestWeek) items.push({ icon: 'calendar', value: hm(pb.bestWeek.focusMs), label: 'Best week', when: dayRange(pb.bestWeek.start, addDays(pb.bestWeek.start, 6), today) });
  if (pb.longestBrew) items.push({ icon: 'kettle', value: hm(pb.longestBrew.focusMs), label: 'Longest brew', when: monthDay(pb.longestBrew.day, today) });
  if (pb.mostBrews) items.push({ icon: 'cup', value: String(pb.mostBrews.brews), label: 'Brews in a day', when: monthDay(pb.mostBrews.day, today) });
  if (!items.length) return null;
  return (
    <Card as="section" className={cx(s.card, s.pbCard)} aria-labelledby={headingId}>
      <h2 id={headingId} className={s.cardTitle}>
        Personal bests
      </h2>
      <ul className={s.pbGrid}>
        {items.map((it) => (
          <li key={it.label} className={s.pb}>
            <span className={s.pbIcon} aria-hidden="true">
              <Icon name={it.icon} size={22} tone="color" />
            </span>
            <span className={s.pbText}>
              <span className={s.pbValue}>{it.value}</span>
              <span className={s.pbLabel}>{it.label}</span>
              <span className={s.pbWhen}>{it.when}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
