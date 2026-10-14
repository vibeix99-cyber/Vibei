/** Top status bar on Today: warm days · leaves · cozy level, each opening a detail sheet. */
import { useLayoutEffect, useRef, useState } from 'react';
import { Mascot, StreakMug, Leaf, LevelBadge, TeaCozy, Icon } from '@/art';
import { navigate } from '@/app/router';
import { ITEMS, BONUS } from '@/progress';
import { Button, ProgressBar, Sheet } from '@/ui';
import type { HomeData } from './useHomeData';
import { cozyNote, warmSheetLine, warmState } from './warm';
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
  const warm = warmState(streak, data.day);
  const left = Math.max(0, level.size - level.into);
  const next = ITEMS.find((i) => i.unlockLevel > level.level);
  const barRef = useWrapWhenCrowded();

  return (
    <>
      <nav ref={barRef} className={s.statusBar} aria-label="Your progress">
        <button
          type="button"
          className={s.stat}
          data-kind="streak"
          aria-label={`${n} ${n === 1 ? 'day' : 'days'} warm${mugState === 'atRisk' ? ', today not brewed yet' : ''}. Show details`}
          onClick={() => setOpen('streak')}
        >
          <StreakMug size={34} state={mugState} animate={false} title="" />
          <span className={s.statText}>
            <span className={s.statNum}>{n}</span>
            <span className={s.statLabel}>{n === 1 ? 'day warm' : 'days warm'}</span>
          </span>
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
        description={warmSheetLine(warm)}
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
              <span className={s.factLabel}>Warmest run</span>
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
            <p>{cozyNote(warm, streak.toNextCozy)}</p>
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
 * The three stats sit on one line. On a phone they only just fit: at 375 px the row needs 360-368 px of a 359 px
 * bar, depending on the numbers (e.g. "2,361" vs "2,296" leaves). Ladder, decided by measurement:
 *   1. as designed (12 px pill padding) when every stat ends inside the screen;
 *   2. else the 6 px padding the 320 px layout already uses (`data-tight`), same row, same height;
 *   3. else (very large text: 110 px of sideways scroll at 390 px with 200 % text) the row wraps (`data-wrap`).
 * Only real fonts decide a near miss (a wider fallback font would wrap the row for a moment and then unwrap it,
 * shifting all of Today: measured CLS 0.26 on phone loads when this was plain `flex-wrap`); a measurement that lands
 * while fonts load (Chromium reports "loading" for a moment on every resize/rotation) is retried when they finish,
 * never dropped. A row more than 40 px too wide even when tight (large text) wraps at once, before it is painted.
 * Neither step 2 nor a font swap changes the row's height.
 * Measuring never widens the page: at large text the unwrapped row is wider than the screen (475-511 px at 200 %), and
 * laid out as is it would widen its column, the document and, on a phone, the layout viewport for the length of the
 * measurement. During a live resize Chromium's mobile page scale could settle on that transient width and leave Today
 * zoomed in (I04 R4-D2). So while it measures, the bar is size-contained in the inline axis and clips what overflows
 * it: nothing outside the bar moves, and the stats' own positions (what is measured) are the same.
 */
function useWrapWhenCrowded() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let live = true;
    // Run a measurement with the bar contained (see above), wherever that leaves what is measured as it is: the stats
    // start at the bar's left edge (left-packed or spread rows, as on every phone), and containment does not move that
    // edge. A row too wide for the bar then runs on from the same left edge, exactly as when it widened the bar. A
    // right-packed bar sized to its content (some desktop layouts, not mobile pages) is measured as before.
    const measuring = (fn: () => void) => {
      const st = el.style;
      const left = el.getBoundingClientRect().left;
      const packed = getComputedStyle(el).justifyContent;
      st.contain = 'inline-size';
      st.overflowX = 'clip';
      if (!/^(normal|flex-start|start|left|space-between)$/.test(packed) || Math.abs(el.getBoundingClientRect().left - left) > 0.5) {
        st.contain = '';
        st.overflowX = '';
      }
      try {
        fn();
      } finally {
        st.contain = '';
        st.overflowX = '';
      }
    };
    const fit = () => {
      if (!live) return;
      // Does any stat (or the bar itself, which a crowded row widens) reach past the screen's edge, and by how much?
      const over = () =>
        Math.max(el.getBoundingClientRect().right, ...[...el.children].map((c) => c.getBoundingClientRect().right)) -
        (document.documentElement.clientWidth + 0.5);
      if (document.fonts && document.fonts.status !== 'loaded') {
        // Fonts still loading (also for a moment on every resize/rotation in Chromium): a fallback font must not decide
        // a near miss, and the decision must not be dropped: it is made again once they finish (re-armed promise, and
        // `loadingdone` below). Only a row far too wide for any font (very large text) wraps now, before it is painted.
        document.fonts.ready.then(fit);
        if (el.dataset.wrap !== undefined) return;
        measuring(() => {
          const wasTight = el.dataset.tight !== undefined;
          el.dataset.tight = '';
          const far = over() > 40;
          if (!wasTight || far) delete el.dataset.tight;
          if (far) el.dataset.wrap = '';
        });
        return;
      }
      measuring(() => {
        delete el.dataset.wrap;
        delete el.dataset.tight;
        if (over() <= 0) return;
        el.dataset.tight = '';
        if (over() <= 0) return;
        delete el.dataset.tight;
        el.dataset.wrap = '';
      });
    };
    fit();
    document.fonts?.addEventListener('loadingdone', fit);
    // The screen's width, not only the bar's: narrowing a window below ~385 px no longer changes the bar's own box
    // (it is already at its min-content width), so its observer alone would never call `fit` again.
    window.addEventListener('resize', fit);
    window.visualViewport?.addEventListener('resize', fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    ro.observe(document.documentElement);
    for (const c of el.children) ro.observe(c);
    return () => {
      live = false;
      document.fonts?.removeEventListener('loadingdone', fit);
      window.removeEventListener('resize', fit);
      window.visualViewport?.removeEventListener('resize', fit);
      ro.disconnect();
    };
  }, []);
  return ref;
}
