/** "This week" — focused minutes per day vs the daily goal, navigable by week. */
import { useId, useMemo, useState } from 'react';
import type { DayKey } from '@/lib/dates';
import type { DayTotal, WeekBar } from '@/progress/insights';
import { weekSeries } from '@/progress/insights';
import { Card, IconButton } from '@/ui';
import { barPath, ChartTip, useMarks, useWidth } from './chart-kit';
import { dayRange, longDay, minLabel, niceMax, plural, shortDay, weekdayNarrow, weekdayShort } from './format';
import s from './stats.module.css';

interface Props {
  byDay: Map<DayKey, DayTotal>;
  metDays: Set<DayKey>;
  today: DayKey;
  goalMin: number;
  firstDay: DayKey | null;
}

const H = 200;
const PAD = { t: 28, b: 48, l: 34, r: 4 };

export function WeekCard({ byDay, metDays, today, goalMin, firstDay }: Props) {
  const [offset, setOffset] = useState(0);
  const bars = useMemo(() => weekSeries(byDay, metDays, today, null, offset), [byDay, metDays, today, offset]);
  const earliest = firstDay ?? today;
  const canPrev = bars[0].day > earliest;
  const canNext = offset < 0;
  const total = bars.reduce((a, b) => a + b.minutes, 0);
  const elapsed = bars.filter((b) => !b.future).length;
  const metCount = bars.filter((b) => b.met).length;
  const range = dayRange(bars[0].day, bars[6].day, today);
  const title = offset === 0 ? 'Last 7 days' : range;
  const headingId = useId();

  return (
    <Card as="section" className={s.card} aria-labelledby={headingId}>
      <div className={s.cardHead}>
        <div className={s.cardTitles}>
          <h2 id={headingId} className={s.cardTitle}>
            {title}
          </h2>
          <p className={s.cardSub}>{offset === 0 ? range : 'Focused minutes per day'}</p>
        </div>
        <div className={s.nav}>
          <IconButton icon="chevronLeft" label="Earlier 7 days" size="sm" variant="secondary" disabled={!canPrev} onClick={() => setOffset((o) => o - 1)} sfx="tap" />
          <IconButton icon="chevronRight" label="Later 7 days" size="sm" variant="secondary" disabled={!canNext} onClick={() => setOffset((o) => Math.min(0, o + 1))} sfx="tap" />
        </div>
      </div>

      <div className={s.weekSummary}>
        <div>
          <p className={s.bigNumber}>{minLabel(total)}</p>
          <p className={s.bigLabel}>focused</p>
        </div>
        <div className={s.weekFacts}>
          <p>
            <span className={s.factValue}>{metCount}</span> of {elapsed} {elapsed === 1 ? 'day' : 'days'} at goal
          </p>
          <p>
            <span className={s.factValue}>{minLabel(Math.round(total / Math.max(1, elapsed)))}</span> a day on average
          </p>
        </div>
      </div>

      <WeekChart bars={bars} goalMin={goalMin} title={offset === 0 ? `${title}, ${range}` : title} />

      <ul className={s.legend} aria-label="Legend">
        <li>
          <span className={s.swatch} data-kind="met" aria-hidden="true" />
          Goal met
        </li>
        <li>
          <span className={s.swatch} data-kind="under" aria-hidden="true" />
          Under goal
        </li>
        <li>
          <span className={s.swatchLine} aria-hidden="true" />
          Daily goal · {minLabel(goalMin)}
        </li>
      </ul>
    </Card>
  );
}

function WeekChart({ bars, goalMin, title }: { bars: WeekBar[]; goalMin: number; title: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const todayIndex = bars.findIndex((b) => b.isToday);
  const { active, markProps, onKeyDown } = useMarks(7, todayIndex >= 0 ? todayIndex : 6);
  const titleId = useId();
  const maxV = Math.max(goalMin * 1.2, ...bars.map((b) => b.minutes * 1.08), 20);
  const { max, step } = niceMax(maxV);
  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = H - PAD.t - PAD.b;
  const band = plotW / 7;
  const bw = Math.min(34, band * 0.58);
  const y = (v: number) => PAD.t + plotH - (v / max) * plotH;
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  const goalY = y(goalMin);
  const best = bars.reduce((bi, b, i) => (b.minutes > bars[bi].minutes ? i : bi), 0);

  const describe = (b: WeekBar) => {
    const day = longDay(b.day);
    if (b.future) return `${day}: still to come`;
    const status = b.met ? 'goal met' : b.minutes > 0 ? `${minLabel(Math.max(0, goalMin - b.minutes))} short of goal` : 'no brews';
    return `${day}${b.isToday ? ' (today)' : ''}: ${minLabel(b.minutes)}, ${plural(b.brews, 'full brew')}, ${status}`;
  };

  return (
    <figure className={s.figure}>
      <div ref={ref} className={s.chartBox} style={{ height: H }}>
        {width > 0 && (
          <svg width={width} height={H} role="group" aria-labelledby={titleId} onKeyDown={onKeyDown} className={s.svg}>
            <title id={titleId}>{`Focused minutes per day — ${title}. Use arrow keys to move between days.`}</title>
            {ticks.map((t) => {
              const ty = y(t);
              const nearGoal = Math.abs(ty - goalY) < 12;
              return (
                <g key={t} aria-hidden="true">
                  <line x1={PAD.l} x2={width - PAD.r} y1={ty} y2={ty} className={t === 0 ? s.axis : s.grid} />
                  {!nearGoal && (
                    <text x={PAD.l - 8} y={ty + 4} className={s.tick} textAnchor="end">
                      {t}
                    </text>
                  )}
                </g>
              );
            })}
            {bars.map((b, i) => {
              const cx = PAD.l + band * (i + 0.5);
              const x = cx - bw / 2;
              const h = b.minutes > 0 ? Math.max(6, (b.minutes / max) * plotH) : 0;
              const top = PAD.t + plotH - h;
              const on = active === i;
              const showValue = !b.future && b.minutes > 0 && (b.isToday || i === best || on);
              return (
                <g key={b.day} {...markProps(i)} role="img" aria-label={describe(b)} className={s.mark} data-active={on || undefined}>
                  <rect x={PAD.l + band * i} y={PAD.t - 20} width={band} height={plotH + 20 + PAD.b} fill="transparent" />
                  {h > 0 ? (
                    <path d={barPath(x, top, bw, h, 7)} className={s.bar} data-kind={b.met ? 'met' : 'under'} style={{ animationDelay: `${i * 45}ms` }} />
                  ) : !b.future ? (
                    <rect x={x} y={PAD.t + plotH - 4} width={bw} height={4} rx={2} className={s.nub} />
                  ) : null}
                  {b.met && h >= 24 && (
                    <g transform={`translate(${cx - 8}, ${top + 5})`} aria-hidden="true">
                      <circle cx={8} cy={8} r={8} className={s.checkDot} />
                      <path d="M4.5 8.3l2.3 2.3 4.7-5" className={s.checkMark} />
                    </g>
                  )}
                  {showValue && (
                    <text x={cx} y={top - 8} textAnchor="middle" className={s.value}>
                      {b.minutes}
                    </text>
                  )}
                  <text x={cx} y={H - PAD.b + 20} textAnchor="middle" className={b.isToday ? s.xToday : b.future ? s.xFuture : s.x}>
                    {band >= 46 ? (b.isToday ? 'Today' : weekdayShort(b.day)) : weekdayNarrow(b.day)}
                  </text>
                  <text x={cx} y={H - PAD.b + 38} textAnchor="middle" className={b.isToday ? s.xSubToday : s.xSub}>
                    {Number(b.day.slice(8))}
                  </text>
                </g>
              );
            })}
            <g aria-hidden="true">
              <line x1={PAD.l} x2={width - PAD.r} y1={goalY} y2={goalY} className={s.goalLine} />
              <text x={PAD.l - 8} y={goalY + 4} textAnchor="end" className={s.goalTick}>
                {goalMin}
              </text>
            </g>
          </svg>
        )}
        {active != null && width > 0 && (
          <ChartTip x={PAD.l + band * (active + 0.5)} y={Math.max(0, y(bars[active].minutes) - 64)} width={width}>
            <strong>{bars[active].future ? 'Still to come' : minLabel(bars[active].minutes)}</strong>
            <span>
              {shortDay(bars[active].day)}
              {!bars[active].future && (bars[active].met ? ' · goal met' : bars[active].brews ? ` · ${plural(bars[active].brews, 'brew')}` : '')}
            </span>
          </ChartTip>
        )}
      </div>
      <div className="sr-only">
        <table>
        <caption>Focused minutes per day, {title}. Daily goal {goalMin} minutes.</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Minutes</th>
            <th scope="col">Full brews</th>
            <th scope="col">Goal</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((b) => (
            <tr key={b.day}>
              <th scope="row">{longDay(b.day)}</th>
              <td>{b.future ? '—' : b.minutes}</td>
              <td>{b.future ? '—' : b.brews}</td>
              <td>{b.future ? 'upcoming' : b.met ? 'met' : 'not met'}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </figure>
  );
}

