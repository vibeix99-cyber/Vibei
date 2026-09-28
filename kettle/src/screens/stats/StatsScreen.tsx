/**
 * Stats — your brewing story. OWNER: progress area.
 *
 * Left column: overview tiles → cozy level → last 7 days (bars vs goal) → warm
 * streak calendar (joined runs, Tea Cozy days) → personal bests.
 * Right column: badges (6 + view all) → your rhythm (collapsible) → history.
 * Phones stack left then right; ≥ 760px content width shows both columns.
 */
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Icon, Leaf, LevelBadge, Mascot, StreakMug, type MascotPose } from '@/art';
import { ITEMS, localeWeekStart, useBadges, useDayKey, useHour, useLevel, useProgress, useStreak } from '@/progress';
import { dayTotals, goalMetDays, totals } from '@/progress/insights';
import { useSettings } from '@/state/settings';
import { useTimer } from '@/timer';
import { Button, Card, EmptyState, ProgressBar, ScreenHeader, Stat, cx, useMediaQuery } from '@/ui';
import { BadgesSection } from './Badges';
import { hm, monthDay } from './format';
import { HistorySection } from './History';
import { PersonalBestsCard } from './PersonalBests';
import { RhythmSection } from './PatternCards';
import { StreakCard } from './StreakCard';
import { WeekCard } from './WeekCard';
import s from './stats.module.css';

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
  const wide = useMediaQuery('(min-width: 900px)');
  const headerRef = useRef<HTMLDivElement>(null);

  const t = useMemo(() => totals(sessions), [sessions]);
  const byDay = useMemo(() => dayTotals(sessions), [sessions]);
  const metDays = useMemo(() => goalMetDays(ledger), [ledger]);

  const empty = t.sessions === 0;
  const hour = useHour();
  const chaiPose: MascotPose = streak.todayDone ? 'proud' : streak.atRisk ? 'think' : hour >= 22 || hour < 5 ? 'sleep' : 'idle';
  const subtitle = empty
    ? 'Your brewing story starts here.'
    : `${name ? `${name} · ` : ''}brewing since ${t.firstDay ? monthDay(t.firstDay, today) : 'today'}`;

  return (
    // data-layout="wide": the shell widens the column (and lets the rail yield) for this dashboard.
    <div className={s.screen} data-layout="wide">
      <CompactBar streak={streak.current} alive={streak.current > 0} todayDone={streak.todayDone} watch={headerRef} />
      <div ref={headerRef} className={s.headerWrap}>
      <ScreenHeader
        title="Stats"
        subtitle={subtitle}
        actions={empty ? undefined : <Mascot pose={chaiPose} size={76} animate className={s.headerChai} />}
        className={s.header}
      />
      </div>

      {empty && <EmptyHero />}

      <div className={s.columns}>
        {/* Left: how you're doing — overview, level, week, streak calendar, records. */}
        <div className={s.col}>
          <section aria-label="Overview" className={s.area}>
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
          <LevelCard level={level.level} leaves={level.leaves} into={level.into} size={level.size} />
          {!empty && (
            <>
              <WeekCard byDay={byDay} metDays={metDays} today={today} goalMin={goalMin} firstDay={t.firstDay} />
              <StreakCard streak={streak} byDay={byDay} today={today} weekStartsOn={weekStartsOn} firstDay={t.firstDay} />
              <PersonalBestsCard sessions={sessions} today={today} weekStartsOn={weekStartsOn} />
            </>
          )}
        </div>

        {/* Right: what you've collected and how you brew — badges, rhythm, history. */}
        <div className={s.col}>
          <BadgesSection badges={badges} today={today} />
          {!empty && (
            <>
              <RhythmSection sessions={sessions} today={today} defaultOpen={wide} />
              <HistorySection sessions={sessions} metDays={metDays} today={today} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact title bar that fades in once the big header scrolls away, so the top of the
 * page always reads cleanly (large-title collapse). Decorative for AT: the h1 stays put.
 */
function CompactBar({ streak, alive, todayDone, watch }: { streak: number; alive: boolean; todayDone: boolean; watch: RefObject<HTMLDivElement | null> }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = watch.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);
  return (
    <div className={s.compactBar} data-show={show || undefined} aria-hidden="true">
      <span className={s.compactTitle}>Stats</span>
      <span className={s.compactStreak}>
        <StreakMug size={26} state={!alive ? 'cold' : todayDone ? 'warm' : 'atRisk'} animate={false} title="" />
        {streak}
      </span>
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
