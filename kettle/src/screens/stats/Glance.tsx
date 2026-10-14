/**
 * The short summary at the top of Stats: today and the last 7 days, as plain numbers.
 *
 * Every number is one the screen already computes from the brews on record (no new metric):
 * - Today: focused minutes and full brews from the day's records (`dayTotals`), the daily goal from the ledger
 *   (`goal:<day>`, the engine's own truth) or, until it is met, minutes of the goal so far.
 * - Last 7 days: the same series as the "Last 7 days" chart below (`weekSeries`, rolling, today at the right edge;
 *   see docs/areas/progress.md, iteration 2: a calendar week is nearly empty on a Monday), so the two always agree.
 *
 * Minutes are whole focused minutes, rounded down, as the engine counts them for leaves and the goal.
 * A brew belongs to the local day it ended on (`SessionRecord.day`), as everywhere else in Kettle.
 */
import { useId, useMemo } from 'react';
import { Icon } from '@/art';
import type { DayKey } from '@/lib/dates';
import { weekSeries, type DayTotal } from '@/progress/insights';
import { Card, cx } from '@/ui';
import { dayRange, minLabel, plural, shortDay } from './format';
import s from './stats.module.css';

const MIN = 60_000;

interface Props {
  byDay: Map<DayKey, DayTotal>;
  metDays: Set<DayKey>;
  today: DayKey;
  goalMin: number;
}

export function GlanceCard({ byDay, metDays, today, goalMin }: Props) {
  const headingId = useId();
  const t = byDay.get(today);
  const todayMin = t ? Math.floor(t.focusMs / MIN) : 0;
  const todayBrews = t?.brews ?? 0;
  const todayEarly = t?.partial ?? 0;
  const met = metDays.has(today);
  const week = useMemo(() => weekSeries(byDay, metDays, today, null, 0), [byDay, metDays, today]);
  const weekMin = week.reduce((a, b) => a + b.minutes, 0);
  const weekDays = week.filter((b) => byDay.has(b.day)).length;
  const weekMet = week.filter((b) => b.met).length;

  let todayLine: string;
  if (!t) todayLine = 'No brews yet today';
  else {
    const parts = [plural(todayBrews, 'full brew')];
    if (todayEarly) parts.push(`${todayEarly} ended early`);
    todayLine = parts.join(' · ');
  }
  const goalLine = goalMin <= 0 ? null : met ? 'Daily goal met' : `${minLabel(Math.min(todayMin, goalMin))} of your ${minLabel(goalMin)} goal`;

  return (
    <Card as="section" className={cx(s.card, s.glance)} aria-labelledby={headingId} data-area="summary">
      <h2 id={headingId} className="sr-only">
        Today and the last 7 days
      </h2>
      <div className={s.glanceGrid}>
        <div className={s.glanceCol}>
          <p className={s.glanceKicker}>
            Today <span className={s.glanceRange}>{shortDay(today)}</span>
          </p>
          <p className={s.glanceNumber}>
            {minLabel(todayMin)}
            <span className={s.glanceUnit}> focused</span>
          </p>
          <p className={s.glanceFact}>{todayLine}</p>
          {goalLine && (
            <p className={s.glanceFact} data-met={met || undefined}>
              {met && <Icon name="check" size={16} />}
              {goalLine}
            </p>
          )}
        </div>
        <div className={s.glanceCol}>
          <p className={s.glanceKicker}>
            Last 7 days <span className={s.glanceRange}>{dayRange(week[0].day, week[6].day, today)}</span>
          </p>
          <p className={s.glanceNumber}>
            {minLabel(weekMin)}
            <span className={s.glanceUnit}> focused</span>
          </p>
          <p className={s.glanceFact}>Brewed on {weekDays} of 7 days</p>
          {goalMin > 0 && <p className={s.glanceFact}>{plural(weekMet, 'day')} at goal</p>}
        </div>
      </div>
    </Card>
  );
}
