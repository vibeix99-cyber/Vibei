/**
 * Stats — your brewing story. OWNER: progress area.
 *
 * Overview tiles → cozy level → this week (bars vs goal) → warm streak
 * calendar (joined runs, Tea Cozy days) → rhythm (time of day, tags) →
 * badges → editable history. Two columns when the content area is wide.
 */
import { useId, useMemo, useState } from 'react';
import { Icon, Leaf, LevelBadge, Mascot, StreakMug, type MascotPose } from '@/art';
import { addDays } from '@/lib/dates';
import { ITEMS, localeWeekStart, useBadges, useDayKey, useHour, useLevel, useProgress, useStreak } from '@/progress';
import { dayTotals, goalMetDays, totals } from '@/progress/insights';
import { useSettings } from '@/state/settings';
import { useTimer } from '@/timer';
import { Button, Card, EmptyState, ProgressBar, ScreenHeader, SegmentedControl, Stat, cx } from '@/ui';
import { BadgesSection } from './Badges';
import { hm, monthDay } from './format';
import { HistorySection } from './History';
import { PersonalBestsCard } from './PersonalBests';
import { RhythmCard, TagsCard } from './PatternCards';
import { StreakCard } from './StreakCard';
import { WeekCard } from './WeekCard';
import s from './stats.module.css';

type Scope = '30d' | 'all';

export default function StatsScreen() {
  const sessions = useProgress((st) => st.sessions);
  const ledger = useProgress((st) => st.ledger);
  const streak = useStreak();
  const level = useLevel();
  const badges = useBadges();
  const today = useDayKey();
  const goalMin = useSettings((st) => st.dailyGoalMin);
  const name = useSettings((st) => st.name);
  const weekStartsOn = useMemo(() => localeWeekStart(), []);

  const t = useMemo(() => totals(sessions), [sessions]);
  const byDay = useMemo(() => dayTotals(sessions), [sessions]);
  const metDays = useMemo(() => goalMetDays(ledger), [ledger]);
  const recent = useMemo(() => {
    const from = addDays(today, -29);
    return sessions.filter((x) => x.phase === 'focus' && x.day >= from).length;
  }, [sessions, today]);
  const [scopeChoice, setScope] = useState<Scope | null>(null);
  const scope: Scope = scopeChoice ?? (recent >= 5 || t.sessions === recent ? '30d' : 'all');
  const fromDay = scope === '30d' ? addDays(today, -29) : undefined;
  const scopeLabel = scope === '30d' ? 'Last 30 days' : 'All time';
  const rhythmId = useId();

  const empty = t.sessions === 0;
  const hour = useHour();
  const chaiPose: MascotPose = streak.todayDone ? 'proud' : streak.atRisk ? 'think' : hour >= 22 || hour < 5 ? 'sleep' : 'idle';
  const subtitle = empty
    ? 'Your brewing story starts here.'
    : `${name ? `${name} · ` : ''}brewing since ${t.firstDay ? monthDay(t.firstDay, today) : 'today'}`;

  return (
    <div className={s.screen}>
      <ScreenHeader
        title="Stats"
        subtitle={subtitle}
        actions={empty ? undefined : <Mascot pose={chaiPose} size={76} animate className={s.headerChai} />}
      />

      {empty && <EmptyHero />}

      <section aria-label="Overview" className={s.area} data-area="overview">
        <div className={s.tiles}>
          <Stat
            icon={<StreakMug size={34} state={streak.current === 0 ? 'cold' : streak.todayDone ? 'warm' : 'atRisk'} animate={false} title="" />}
            tone="persimmon"
            value={streak.current.toLocaleString()}
            label="Day streak"
            hint={streak.atRisk ? <span className={s.riskHint}>Brew tonight</span> : undefined}
          />
          <Stat icon={<Icon name="trophy" size={26} tone="color" />} tone="honey" value={streak.best.toLocaleString()} label="Best streak" />
          <Stat icon="clock" tone="sky" value={hm(t.focusMs)} label="Total focus" />
          <Stat icon="cup" tone="matcha" value={t.brews.toLocaleString()} label="Full brews" />
        </div>
      </section>

      <div className={s.area} data-area="level">
        <LevelCard level={level.level} leaves={level.leaves} into={level.into} size={level.size} />
      </div>

      {!empty && (
        <>
          <div className={s.area} data-area="week">
            <WeekCard byDay={byDay} metDays={metDays} today={today} goalMin={goalMin} firstDay={t.firstDay} />
          </div>
          <div className={s.area} data-area="streak">
            <StreakCard streak={streak} byDay={byDay} today={today} weekStartsOn={weekStartsOn} firstDay={t.firstDay} />
          </div>
          <div className={s.area} data-area="bests">
            <PersonalBestsCard sessions={sessions} today={today} weekStartsOn={weekStartsOn} />
          </div>
        </>
      )}

      <div className={s.area} data-area="badges">
        <BadgesSection badges={badges} today={today} />
      </div>

      {!empty && (
        <>
          <section className={cx(s.area, s.patterns)} data-area="rhythm" aria-labelledby={rhythmId}>
            <div className={s.sectionHead}>
              <h2 id={rhythmId} className={s.sectionTitle}>
                Your rhythm
              </h2>
              <SegmentedControl<Scope>
                label="Time range"
                value={scope}
                onChange={setScope}
                options={[
                  { value: '30d', label: '30 days' },
                  { value: 'all', label: 'All time' },
                ]}
                className={s.scope}
              />
            </div>
            <div className={s.patternGrid}>
              <RhythmCard sessions={sessions} fromDay={fromDay} scopeLabel={scopeLabel} />
              <TagsCard sessions={sessions} fromDay={fromDay} scopeLabel={scopeLabel} />
            </div>
          </section>
        </>
      )}


      {!empty && (
        <div className={s.area} data-area="history">
          <HistorySection sessions={sessions} metDays={metDays} today={today} />
        </div>
      )}
    </div>
  );
}

function EmptyHero() {
  const lastTag = useSettings((st) => st.lastTag);
  return (
    <Card className={cx(s.card, s.emptyCard)} data-area="empty">
      <EmptyState
        art={<Mascot pose="peek" size={148} title="Chai peeking over the counter" />}
        title="Nothing brewed yet."
        action={
          <Button size="lg" sfx="start" icon="kettle" onClick={() => useTimer.getState().startFocus({ tag: lastTag })}>
            Put the kettle on
          </Button>
        }
      >
        Your first cup is one tap away. Your streak, charts and badges will fill in as you brew.
      </EmptyState>
    </Card>
  );
}

function LevelCard({ level, leaves, into, size }: { level: number; leaves: number; into: number; size: number }) {
  const next = ITEMS.find((i) => i.unlockLevel > level);
  const unlocked = ITEMS.filter((i) => i.unlockLevel <= level).length;
  const toGo = size - into;
  return (
    <Card as="section" className={cx(s.card, s.levelCard)} aria-label={`Cozy level ${level}`}>
      <div className={s.levelTop}>
        <LevelBadge level={level} size={68} title="" className={s.levelArt} />
        <div className={s.levelText}>
          <h2 className={s.levelTitle}>Cozy level {level}</h2>
          <p className={s.levelLeaves}>
            <Leaf size={18} />
            {leaves.toLocaleString()} leaves earned
          </p>
        </div>
      </div>
      <div className={s.levelProgress}>
        <ProgressBar value={size > 0 ? into / size : 0} tone="honey" height={18} label={`Progress to level ${level + 1}`} valueText={`${into} of ${size} leaves`} />
        <div className={s.levelFoot}>
          <span>
            <strong>{toGo.toLocaleString()}</strong> leaves to level {level + 1}
          </span>
          <span className={s.levelFrac}>
            {into.toLocaleString()} / {size.toLocaleString()}
          </span>
        </div>
      </div>
      <p className={s.nextUnlock}>
        <span className={s.nextIcon} aria-hidden="true">
          <Icon name="nook" size={20} />
        </span>
        <span>
          {next ? (
            <>
              Next for your nook: <strong>{next.name}</strong> at level {next.unlockLevel}
            </>
          ) : (
            <>Your nook is complete. Every item is yours.</>
          )}
          <span className={s.nextSub}>
            {unlocked} of {ITEMS.length} nook items unlocked
          </span>
        </span>
      </p>
    </Card>
  );
}
