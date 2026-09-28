/** "Your rhythm": when you brew (hour-of-day chart) and what you brew (tag breakdown). */
import { useId, useMemo } from 'react';
import { EmptySpot, Icon } from '@/art';
import type { DayKey } from '@/lib/dates';
import { hourHistogram, rhythmOf, tagBreakdown, type Chronotype, type TagSlice } from '@/progress/insights';
import type { SessionRecord } from '@/progress';
import { Card, cx } from '@/ui';
import { barPath, ChartTip, useMarks, useWidth } from './chart-kit';
import { hm, hmLong, hourLabel, minLabel, TAG_META } from './format';
import s from './stats.module.css';

const TYPE_COPY: Record<Chronotype, { title: string; icon: 'sun' | 'moon' | 'mug' }> = {
  early: { title: 'You’re an early bird', icon: 'sun' },
  morning: { title: 'You’re a morning brewer', icon: 'sun' },
  afternoon: { title: 'You find your flow after lunch', icon: 'mug' },
  evening: { title: 'You’re an evening brewer', icon: 'moon' },
  night: { title: 'You’re a moonlit sipper', icon: 'moon' },
};

export function RhythmCard({ sessions, fromDay, scopeLabel }: { sessions: SessionRecord[]; fromDay?: DayKey; scopeLabel: string }) {
  const hist = useMemo(() => hourHistogram(sessions, fromDay), [sessions, fromDay]);
  const rhythm = useMemo(() => rhythmOf(hist), [hist]);
  const count = useMemo(() => sessions.filter((x) => x.phase === 'focus' && (!fromDay || x.day >= fromDay)).length, [sessions, fromDay]);
  const headingId = useId();
  if (!rhythm) {
    return (
      <Card as="section" className={s.card} aria-labelledby={headingId}>
        <p className={s.overline} id={headingId}>
          When you brew
        </p>
        <div className={s.smallEmpty}>
          <EmptySpot kind="stats" size={96} />
          <p className={s.muted}>No brews in the {scopeLabel.toLowerCase()} yet. Chai will spot your rhythm as you brew.</p>
        </div>
      </Card>
    );
  }
  const copy = TYPE_COPY[rhythm.type];
  const window = `${hourLabel(rhythm.peakStart)}–${hourLabel((rhythm.peakStart + 2) % 24)}`;
  const parts: [string, number][] = [
    ['Morning', rhythm.parts.morning],
    ['Afternoon', rhythm.parts.afternoon],
    ['Evening', rhythm.parts.evening],
    ['Night', rhythm.parts.night],
  ];
  return (
    <Card as="section" className={s.card} aria-labelledby={headingId}>
      <p className={s.overline} id={headingId}>
        When you brew
      </p>
      <div className={s.insight}>
        <span className={s.insightIcon} data-tone={copy.icon === 'moon' ? 'plum' : 'honey'} aria-hidden="true">
          <Icon name={copy.icon} size={28} tone="color" />
        </span>
        <div>
          <p className={s.insightTitle}>{copy.title}</p>
          <p className={s.insightSub}>
            Your sweet spot is {window}
            {count < 8 ? ` · based on ${count} ${count === 1 ? 'brew' : 'brews'} so far` : '.'}
          </p>
        </div>
      </div>
      <HourChart hist={hist} peakStart={rhythm.peakStart} scopeLabel={scopeLabel} />
      <ul className={s.partList} aria-label="Share of focus by part of day">
        {parts.map(([label, share]) => (
          <li key={label}>
            <span className={s.partValue}>{Math.round(share * 100)}%</span>
            <span className={s.partLabel}>{label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const HH = 156;
const HP = { t: 14, b: 30, l: 4, r: 4 };

function HourChart({ hist, peakStart, scopeLabel }: { hist: number[]; peakStart: number; scopeLabel: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { active, markProps, onKeyDown } = useMarks(24, peakStart);
  const titleId = useId();
  const max = Math.max(...hist, 1);
  const plotW = Math.max(0, width - HP.l - HP.r);
  const plotH = HH - HP.t - HP.b;
  const band = plotW / 24;
  const bw = Math.max(4, Math.min(16, band - 3));
  const isPeak = (h: number) => h === peakStart || h === (peakStart + 1) % 24;
  const label = (h: number) => `${hourLabel(h)} to ${hourLabel((h + 1) % 24)}: ${minLabel(hist[h])} focused${isPeak(h) ? ' (your sweet spot)' : ''}`;
  return (
    <figure className={s.figure}>
      <div ref={ref} className={s.chartBox} style={{ height: HH }}>
        {width > 0 && (
          <svg width={width} height={HH} role="group" aria-labelledby={titleId} onKeyDown={onKeyDown} className={s.svg}>
            <title id={titleId}>{`Focused minutes by hour of day, ${scopeLabel.toLowerCase()}. Use arrow keys to move between hours.`}</title>
            <line x1={HP.l} x2={width - HP.r} y1={HP.t + plotH} y2={HP.t + plotH} className={s.axis} aria-hidden="true" />
            {hist.map((v, h) => {
              const x = HP.l + band * h + (band - bw) / 2;
              const bh = v > 0 ? Math.max(4, (v / max) * plotH) : 0;
              const top = HP.t + plotH - bh;
              return (
                <g key={h} {...markProps(h)} role="img" aria-label={label(h)} className={s.mark} data-active={active === h || undefined}>
                  <rect x={HP.l + band * h} y={HP.t} width={band} height={plotH + HP.b} fill="transparent" />
                  {bh > 0 ? (
                    <path d={barPath(x, top, bw, bh, 4)} className={cx(s.hourBar, isPeak(h) && s.hourPeak)} style={{ animationDelay: `${h * 18}ms` }} />
                  ) : (
                    <rect x={x} y={HP.t + plotH - 3} width={bw} height={3} rx={1.5} className={s.nub} />
                  )}
                </g>
              );
            })}
            {[0, 6, 12, 18].map((h) => (
              <g key={h} aria-hidden="true">
                <line x1={HP.l + band * h + 0.5} x2={HP.l + band * h + 0.5} y1={HP.t + plotH} y2={HP.t + plotH + 6} className={s.axis} />
                <text x={HP.l + band * h + 2} y={HH - 8} className={s.tick}>
                  {hourLabel(h, true)}
                </text>
              </g>
            ))}
          </svg>
        )}
        {active != null && width > 0 && (
          <ChartTip x={HP.l + band * (active + 0.5)} y={Math.max(0, HP.t + plotH - (hist[active] / max) * plotH - 70)} width={width}>
            <strong>{minLabel(hist[active])}</strong>
            <span>
              {hourLabel(active)}–{hourLabel((active + 1) % 24)}
            </span>
          </ChartTip>
        )}
      </div>
      <div className="sr-only">
        <table>
        <caption>Focused minutes by hour of day, {scopeLabel.toLowerCase()}</caption>
        <thead>
          <tr>
            <th scope="col">Hour</th>
            <th scope="col">Minutes</th>
          </tr>
        </thead>
        <tbody>
          {hist.map((v, h) => (
            <tr key={h}>
              <th scope="row">{hourLabel(h)}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </figure>
  );
}

export function TagsCard({ sessions, fromDay, scopeLabel }: { sessions: SessionRecord[]; fromDay?: DayKey; scopeLabel: string }) {
  const slices = useMemo(() => tagBreakdown(sessions, fromDay), [sessions, fromDay]);
  const headingId = useId();
  const max = Math.max(...slices.map((x) => x.focusMs), 1);
  const top = slices.find((x) => x.tag);
  return (
    <Card as="section" className={s.card} aria-labelledby={headingId}>
      <p className={s.overline} id={headingId}>
        What you brew
      </p>
      {slices.length === 0 ? (
        <div className={s.smallEmpty}>
          <EmptySpot kind="history" size={96} />
          <p className={s.muted}>No brews in the {scopeLabel.toLowerCase()} yet.</p>
        </div>
      ) : (
        <>
          {top?.tag && (
            <p className={s.insightTitle}>
              Mostly {TAG_META[top.tag].label.toLowerCase()}, {Math.round(top.share * 100)}% of your focus
            </p>
          )}
          <ul className={s.tagList}>
            {slices.map((x) => (
              <TagRow key={x.tag ?? 'none'} slice={x} max={max} />
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function TagRow({ slice, max }: { slice: TagSlice; max: number }) {
  const meta = slice.tag ? TAG_META[slice.tag] : null;
  const pct = Math.round(slice.share * 100);
  return (
    <li className={s.tagRow} data-tone={meta?.tone} aria-label={`${meta?.label ?? 'No tag'}: ${hmLong(slice.focusMs)}, ${pct}% of focus, ${slice.sessions} sessions`}>
      <span className={s.tagIcon} data-none={!meta || undefined} aria-hidden="true">
        <Icon name={meta?.icon ?? 'more'} size={20} />
      </span>
      <div className={s.tagMain} aria-hidden="true">
        <div className={s.tagLine}>
          <span className={s.tagName}>{meta?.label ?? 'No tag'}</span>
          <span className={s.tagValue}>
            {hm(slice.focusMs)} <span className={s.tagPct}>· {pct}%</span>
          </span>
        </div>
        <div className={s.tagTrack}>
          <div className={s.tagFill} style={{ width: `${Math.max(2, (slice.focusMs / max) * 100)}%` }} />
        </div>
      </div>
    </li>
  );
}
