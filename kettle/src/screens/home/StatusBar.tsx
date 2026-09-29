/** Top status bar on Today: warm streak · leaves · cozy level, each opening a detail sheet. */
import { useState } from 'react';
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

  return (
    <>
      <nav className={s.statusBar} aria-label="Your progress">
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
        description={n === 0 ? 'Brew today to start a new streak. Every streak begins with one cup.' : streak.todayDone ? `You kept the kettle warm ${plural(n, 'day')} in a row.` : 'Brew once today to keep it warm.'}
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
