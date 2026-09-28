/**
 * Warm streak card: current streak, Tea Cozies, and a month calendar where
 * consecutive warm days join into one pill (cozy days bridge the pill).
 */
import { useId, useMemo, useState } from 'react';
import { Icon, StreakMug, TeaCozy } from '@/art';
import { addDays, type DayKey } from '@/lib/dates';
import type { DayTotal } from '@/progress/insights';
import { monthGrid, monthOf } from '@/progress/insights';
import type { StreakInfo } from '@/progress';
import { Card, IconButton, cx } from '@/ui';
import { longDay, minLabel, monthTitle, plural, weekdayNames } from './format';
import s from './stats.module.css';

interface Props {
  streak: StreakInfo;
  byDay: Map<DayKey, DayTotal>;
  today: DayKey;
  weekStartsOn: number;
  firstDay: DayKey | null;
}

const warm = (st: string | undefined) => st === 'done' || st === 'cozy';

export function StreakCard({ streak, byDay, today, weekStartsOn, firstDay }: Props) {
  const now = monthOf(today);
  const [offset, setOffset] = useState(0);
  const { year, month0 } = useMemo(() => {
    const d = new Date(now.year, now.month0 + offset, 1);
    return { year: d.getFullYear(), month0: d.getMonth() };
  }, [now.year, now.month0, offset]);
  const rows = useMemo(() => monthGrid(year, month0, weekStartsOn), [year, month0, weekStartsOn]);
  const names = weekdayNames(weekStartsOn);
  const first = firstDay ? monthOf(firstDay) : now;
  const canPrev = year > first.year || (year === first.year && month0 > first.month0);
  const canNext = offset < 0;
  const headingId = useId();
  const monthName = monthTitle(year, month0);

  const inMonth = rows.flat().filter((d): d is DayKey => !!d);
  const warmCount = inMonth.filter((d) => streak.days[d] === 'done').length;
  const cozyCount = inMonth.filter((d) => streak.days[d] === 'cozy').length;

  const alive = streak.current > 0;
  const headline = alive ? `${plural(streak.current, 'day')} warm` : 'Start a new streak';
  let line: string;
  if (!alive) line = streak.best > 0 ? 'One brew today warms the kettle again.' : 'Finish a brew to start your warm streak.';
  else if (streak.atRisk) line = streak.cozies > 0 ? 'Brew tonight — or a Tea Cozy will keep it warm.' : 'One brew before midnight keeps it warm.';
  else if (streak.todayDone) line = `You kept the kettle warm ${plural(streak.current, 'day')} in a row.`;
  else line = 'Brew today to keep it going.';

  return (
    <Card as="section" className={cx(s.card, s.streakCard)} aria-labelledby={headingId}>
      <div className={s.streakTop}>
        <StreakMug state={!alive ? 'cold' : streak.todayDone ? 'warm' : 'atRisk'} size={76} title="" className={s.streakMugArt} />
        <div className={s.streakText}>
          <h2 id={headingId} className={s.streakHeadline}>
            {headline}
          </h2>
          <p className={s.streakLine} data-risk={streak.atRisk || undefined}>
            {line}
          </p>
        </div>
      </div>

      <div className={s.cozyRow}>
        <div className={s.cozyIcons} aria-hidden="true">
          {Array.from({ length: streak.maxCozies }, (_, i) => (
            <span key={i} className={s.cozySlot} data-full={i < streak.cozies || undefined}>
              <TeaCozy size={34} muted={i >= streak.cozies} animate={false} title="" />
            </span>
          ))}
        </div>
        <div className={s.cozyText}>
          <p className={s.cozyTitle}>
            {streak.cozies === 0 ? 'No Tea Cozies yet' : `${plural(streak.cozies, 'Tea Cozy', 'Tea Cozies')} ready`}
          </p>
          <p className={s.cozySub}>
            {streak.cozies >= streak.maxCozies
              ? 'Fully stocked · each covers one missed day'
              : streak.cozies === 0
                ? `Earn one in ${plural(streak.toNextCozy, 'warm day')} · each covers one missed day`
                : `Next in ${plural(streak.toNextCozy, 'warm day')} · each covers one missed day`}
          </p>
        </div>
      </div>

      <div className={s.calHead}>
        <h3 className={s.calTitle} aria-live="polite">
          {monthName}
        </h3>
        <div className={s.nav}>
          <IconButton icon="chevronLeft" label="Previous month" size="sm" variant="secondary" disabled={!canPrev} onClick={() => setOffset((o) => o - 1)} />
          <IconButton icon="chevronRight" label="Next month" size="sm" variant="secondary" disabled={!canNext} onClick={() => setOffset((o) => Math.min(0, o + 1))} />
        </div>
      </div>

      <table className={s.cal}>
        <caption className="sr-only">Warm streak calendar for {monthName}</caption>
        <thead>
          <tr>
            {names.map((n) => (
              <th key={n.long} scope="col" abbr={n.long}>
                <span aria-hidden="true">{n.narrow}</span>
                <span className="sr-only">{n.long}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((day, ci) => {
                if (!day) return <td key={ci} aria-hidden="true" />;
                const st = streak.days[day];
                const isWarm = warm(st);
                const joinL = isWarm && ci > 0 && warm(streak.days[addDays(day, -1)]) && row[ci - 1] !== null;
                const joinR = isWarm && ci < 6 && warm(streak.days[addDays(day, 1)]) && row[ci + 1] !== null;
                const t = byDay.get(day);
                const future = day > today;
                const isToday = day === today;
                const label = [
                  longDay(day),
                  isToday ? 'today' : '',
                  st === 'done' ? 'warm day' : st === 'cozy' ? 'kept warm by a Tea Cozy' : '',
                  t ? `${minLabel(Math.floor(t.focusMs / 60000))} focused` : future ? '' : 'no brews',
                ]
                  .filter(Boolean)
                  .join(', ');
                return (
                  <td key={ci}>
                    <div
                      className={s.calDay}
                      data-state={st ?? (future ? 'future' : 'none')}
                      data-join-l={joinL || undefined}
                      data-join-r={joinR || undefined}
                      data-today={isToday || undefined}
                      aria-label={label}
                      role="img"
                    >
                      <span className={s.calNum} aria-hidden="true">
                        {Number(day.slice(8))}
                      </span>
                      {st === 'cozy' && (
                        <span className={s.calCozy} aria-hidden="true">
                          <Icon name="cozy" size={14} />
                        </span>
                      )}
                      {!isWarm && t && t.focusMs > 0 && <span className={s.calDot} aria-hidden="true" />}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className={s.calFoot}>
        <ul className={s.legend} aria-label="Calendar legend">
          <li>
            <span className={s.calKey} data-state="done" aria-hidden="true" />
            Warm day
          </li>
          <li>
            <span className={s.calKey} data-state="cozy" aria-hidden="true" />
            Tea Cozy
          </li>
          <li>
            <span className={s.calKey} data-state="today" aria-hidden="true" />
            Today
          </li>
        </ul>
        <p className={s.calSummary}>
          {warmCount === 0 && cozyCount === 0 ? 'A fresh month to fill' : plural(warmCount, 'warm day')}
          {cozyCount ? ` · ${plural(cozyCount, 'cozy day')}` : ''}
        </p>
      </div>
    </Card>
  );
}
