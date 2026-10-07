/** Top status bar on Today: warm streak · leaves · cozy level, each opening a detail sheet. */
import { useLayoutEffect, useRef, useState } from 'react';
import { Mascot, StreakMug, Leaf, LevelBadge, TeaCozy, Icon } from '@/art';
import { navigate } from '@/app/router';
import { ITEMS, BONUS } from '@/progress';
import { plural } from '@/lib/format';
import { Button, ProgressBar, Sheet } from '@/ui';
import type { HomeData } from './useHomeData';
import s from './Home.module.css';

type Open = 'streak' | 'leaves' | 'level' | null;
const fmt = new Intl.NumberFormat();
const weekdayLong = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' });

export function StatusBar({ data }: { data: HomeData }) {
  const [open, setOpen] = useState<Open>(null);
  const { streak, level } = data;
  const close = () => setOpen(null);
  const mugState = streak.current === 0 ? 'cold' : streak.todayDone ? 'warm' : 'atRisk';
  const n = streak.current;
  const left = Math.max(0, level.size - level.into);
  const next = ITEMS.find((i) => i.unlockLevel > level.level);
  const barRef = useWrapWhenCrowded();

  return (
    <>
      <nav ref={barRef} className={s.statusBar} aria-label="Your progress">
        <button type="button" className={s.stat} data-kind="streak" onClick={() => setOpen('streak')}>
          <StreakMug size={34} state={mugState} animate={false} title="" />
          <span className={s.statText}>
            <span className={s.statNum}>{n}</span>
            <span className={s.statLabel}>{n === 1 ? 'day warm' : 'days warm'}</span>
          </span>
          <span className="sr-only">streak{mugState === 'atRisk' ? ', brew today to keep it' : ''}. Show details</span>
        </button>
        <button type="button" className={s.stat} data-kind="leaves" onClick={() => setOpen('leaves')}>
          <Leaf size={28} title="" />
          <span className={s.statText}>
            <span className={s.statNum}>{fmt.format(level.leaves)}</span>
            <span className={s.statLabel}>leaves</span>
          </span>
          <span className="sr-only">Show details</span>
        </button>
        <button type="button" className={s.stat} data-kind="level" onClick={() => setOpen('level')}>
          <LevelBadge level={level.level} size={36} title="" />
          <span className={s.statLevel} aria-hidden>
            <span className={s.statLabel}>Level {level.level}</span>
            <ProgressBar value={level.size ? level.into / level.size : 0} tone="honey" height={8} className={s.statLevelBar} />
          </span>
          <span className="sr-only">
            Cozy level {level.level}, {fmt.format(left)} leaves to the next. Show details
          </span>
        </button>
      </nav>

      <Sheet
        open={open === 'streak'}
        onClose={close}
        title={`${n} ${n === 1 ? 'day' : 'days'} warm`}
        description={n === 0 ? 'Brew today to start a new streak. Every streak begins with one brew.' : streak.todayDone ? `You kept the kettle warm ${plural(n, 'day')} in a row.` : 'Brew once today to keep it warm.'}
        hero={<StreakMug size={112} state={mugState} count={n} />}
        footer={
          <Button block onClick={close}>
            Got it
          </Button>
        }
      >
        <div className={s.sheetBody}>
          <ol className={s.week} aria-label="This week">
            {data.week.map((d) => (
              <li key={d.day} className={s.weekDay} data-state={d.state} data-today={d.isToday || undefined}>
                <span className={s.weekLabel} aria-hidden>
                  {d.label}
                </span>
                <span className={s.weekDot} aria-hidden>
                  {d.state === 'done' ? <Icon name="check" size={18} /> : d.state === 'cozy' ? <TeaCozy size={24} animate={false} title="" /> : null}
                </span>
                <span className="sr-only">
                  {weekdayLong(d.day)}: {d.state === 'done' ? 'brewed' : d.state === 'cozy' ? 'kept warm by a Tea Cozy' : d.state === 'future' ? 'still to come' : d.state === 'today' ? 'today, not brewed yet' : 'no brew'}
                </span>
              </li>
            ))}
          </ol>
          <div className={s.factRow}>
            <div className={s.fact}>
              <span className={s.factNum}>{streak.best}</span>
              <span className={s.factLabel}>Best streak</span>
            </div>
            <div className={s.fact}>
              <span className={s.factNum}>
                {streak.cozies}
                {streak.maxCozies ? <span className={s.factOf}>/{streak.maxCozies}</span> : null}
              </span>
              <span className={s.factLabel}>Tea {streak.cozies === 1 ? 'Cozy' : 'Cozies'}</span>
            </div>
          </div>
          <div className={s.cozyNote}>
            <TeaCozy size={56} muted={streak.cozies === 0} title="" />
            <p>
              <strong>Tea Cozy.</strong> Keeps your streak warm for one missed day. It’s used automatically, so there’s nothing to remember.
              {streak.toNextCozy > 0 ? ` You’ll earn the next one in ${plural(streak.toNextCozy, 'day')}.` : ''}
            </p>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={open === 'leaves'}
        onClose={close}
        title={`${fmt.format(level.leaves)} leaves`}
        description="Tea leaves grow as you focus. They fill your cozy level and your nook."
        hero={<Leaf size={80} />}
        footer={
          <Button block onClick={close}>
            Lovely
          </Button>
        }
      >
        <ul className={s.earnList}>
          <li>
            <span className={s.earnAmt}>+1</span> for every minute you focus
          </li>
          <li>
            <span className={s.earnAmt}>+{BONUS.fullBrew}</span> when a brew runs to the whistle
          </li>
          <li>
            <span className={s.earnAmt}>+{BONUS.firstBrew}</span> for your first brew of the day
          </li>
          <li>
            <span className={s.earnAmt}>+{BONUS.goal}</span> when you meet your daily goal
          </li>
          <li>
            <span className={s.earnAmt}>
              <Icon name="tin" size={16} />
            </span>
            and more from today’s recipes
          </li>
        </ul>
      </Sheet>

      <Sheet
        open={open === 'level'}
        onClose={close}
        title={`Cozy level ${level.level}`}
        description={`${fmt.format(left)} leaves to level ${level.level + 1}.`}
        hero={<LevelBadge size={96} level={level.level} />}
        footer={
          <Button
            block
            icon="nook"
            onClick={() => {
              close();
              navigate('/nook');
            }}
          >
            Visit your nook
          </Button>
        }
      >
        <div className={s.sheetBody}>
          <ProgressBar value={level.size ? level.into / level.size : 0} tone="honey" label={`Progress to level ${level.level + 1}`} />
          {next && (
            <div className={s.cozyNote} data-tone="honey">
              <Mascot pose="peek" size={56} />
              <p>
                <strong>Coming to your nook:</strong> {next.name.toLowerCase()} at level {next.unlockLevel}. {next.story}
              </p>
            </div>
          )}
        </div>
      </Sheet>
    </>
  );
}

/**
 * The three stats sit on one line. When they can't (very large text: measured 110 px of sideways scroll at 390 px with
 * 200 % text; 14 px at 360 px), the row wraps instead. Decided by measuring the screen edge, not the bar's box: at
 * 375 px the stats fit only by using the bar's negative side margins, and plain `flex-wrap` broke the row there.
 */
function useWrapWhenCrowded() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const fit = () => {
      // Decide with the real fonts only: a wider fallback font would wrap the row for a moment and then unwrap it,
      // shifting all of Today (measured CLS 0.26 on phone loads when this was plain `flex-wrap`).
      if (document.fonts && document.fonts.status !== 'loaded') return;
      delete el.dataset.wrap;
      // On one line, does any stat (or the bar itself, which a crowded row widens) reach past the screen's edge?
      const right = Math.max(el.getBoundingClientRect().right, ...[...el.children].map((c) => c.getBoundingClientRect().right));
      if (right > document.documentElement.clientWidth + 0.5) el.dataset.wrap = '';
    };
    fit();
    let live = true;
    document.fonts?.ready.then(() => live && fit());
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    for (const c of el.children) ro.observe(c);
    return () => {
      live = false;
      ro.disconnect();
    };
  }, []);
  return ref;
}
