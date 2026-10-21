/**
 * The one summary after a brew (#/done). OWNER: core-loop area.
 *
 * Shown in the session screen's panel, next to (desktop) or under (phone) the same stage the brew ran on —
 * the scene never changes position, so there is no blank hand-off and no cross-fade of whole scenes.
 * Reads the report the progress engine computed once at completion (see ./summaryModel.ts): it grants nothing.
 *
 * Order: minutes brewed + Tea time (the footer never scrolls away) → the task (only if there was one) →
 * the one highlighted milestone (./summaryModel.ts `rankRewards`): a room unlock as its close-up card, or else the
 * biggest milestone leading the rewards list → the optional setup after a first brew → every other reward,
 * compact → the arithmetic, on request.
 * Motion: the panel content rises in a short stagger; reduced motion: one simple fade, nothing moves.
 *
 * Stacked (phones), the scroll area spans the whole screen and the sheet rests just under Chai's feet: scrolling
 * slides the sheet up over the scene, which itself never moves. On arrival the sheet never covers Chai or the kettle
 * (W2R2): it may open higher only by the room between their boxes and its top edge (measured, a few px on phones),
 * and, when the highlight (or, without one, the rewards) would start under the footer, by at most 22% of its resting
 * offset (30% for a highlight) within that room.
 * The fold (Wave-1 #1): on arrival no line may start under the footer. The opening is snapped so the fold falls
 * between two lines: each is wholly clear of the bottom fade or wholly below it (at most its empty top edge peeks
 * into the fade). When no lift within the room does that, the sheet opens with a little more air above its heading
 * and between its blocks (at most MAX_AIR_REM each), an even rhythm, so the fold falls before the next block. The
 * heading ("25 minutes brewed") stays whole whenever any clean opening allows it, then the highlight. Side by side
 * the card does not lift; it ends between two lines instead.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { motion } from 'motion/react';
import { Badge, Icon, Leaf, LevelBadge, StreakMug, TeaCozy, TeaTin } from '@/art';
import { Button, Chip, Ring } from '@/ui';
import { Nook } from '@/scene';
import { ITEM_BY_ID, itemsUnlockedAt, syncFromStorage, useProgress, type CompletionReport, type SessionRecord } from '@/progress';
import { nextBreakKind, useTimer } from '@/timer';
import { useSettings } from '@/state/settings';
import { audio } from '@/audio';
import { ease } from '@/lib/motion';
import { plural } from '@/lib/format';
import { getRoute, navigate } from '@/app/router';
import { setIntentionOutcome } from '@/app/intention';
import { beginBreak, openSetupFromSummary, skipBreakFromDone, useFlow } from '@/app/flow';
import { SaveWarningNote } from '@/app/SaveWarning';
import { usePageVisible } from '../focus/parts/hooks';
import { TagChip } from '../focus/parts/bits';
import { ItemGlyph } from '../nook/ItemGlyph';
import { LeafConfetti } from './LeafConfetti';
import { buildSummary, rankRewards, warmNote, type RewardPill } from './summaryModel';
import s from './Summary.module.css';

const AUTO_BREAK_S = 10;
/** Keep the featured block this far above the footer (clear of the scroll area's bottom fade). */
const FEATURE_CLEAR = 30;
/** The sheet may open at most this share of its resting offset higher over the scene. */
const MAX_LIFT = 0.22;
/** The highlight (an unlock, or the biggest milestone) is the summary's moment: it may open the sheet a little higher. */
const MAX_LIFT_MOMENT = 0.3;
/** The scroll area's bottom fade, px (= the mask in Summary.module.css). */
const FADE = 14;
/** How much of a line's top edge may show in the fade when the fold falls just above it (no text sits that high). */
const PEEK = 6;
/** Stacked, the sheet's top edge (its 2px line) stays this far below Chai's and the kettle's boxes on arrival. */
const FIGURE_CLEAR = 2;
/** When no lift within that room puts the fold between two lines, the sheet may open with up to this much more air
 *  (rem: 24px at 100 % text, 48px at 200 %, where the text is twice as tall but the sheet's px spacing is not) above
 *  its heading and between every two blocks (its padding is 20px and its gap 14px), which moves the lines down
 *  instead, the lower ones more. */
const MAX_AIR_REM = 1.5;
/** Side by side, the card may end at most this share of its scroll area earlier, so the fold falls between lines. */
const MAX_TRIM = 0.25;
/** How long the summary steps aside before handing off to the break / home. */
const LEAVE_MS = 180;

export function Summary({ reduced }: { reduced: boolean }) {
  const liveReport = useProgress((p) => p.lastReport);
  // Keep showing the summary while we leave (the flow clears the report as it hands off).
  const kept = useRef<CompletionReport | null>(liveReport);
  if (liveReport) kept.current = liveReport;
  const report = liveReport ?? kept.current;
  const visible = usePageVisible();
  const autoStart = useSettings((st) => st.autoStartBreaks);
  const setupPending = useSettings((st) => st.setupPending);
  const shortMin = useSettings((st) => st.shortBreakMin);
  const longMin = useSettings((st) => st.longBreakMin);
  const every = useSettings((st) => Math.max(1, st.longBreakEvery));
  const headingId = useId();

  // Arrived with nothing to summarise → home. When another tab finished the brew, its timer write reaches us
  // a moment before its progress write: re-read storage, and if a summary is expected give it a moment.
  useEffect(() => {
    if (liveReport || kept.current || getRoute() !== '/done') return;
    syncFromStorage();
    if (useProgress.getState().lastReport) return;
    const ended = useTimer.getState().lastEnded;
    const unrecorded = !!ended && ended.phase === 'focus' && ended.reason === 'complete' && !useProgress.getState().sessions.some((x) => x.id === ended.sessionId);
    const expecting = unrecorded || useFlow.getState().celebration != null;
    const t = setTimeout(() => {
      if (!useProgress.getState().lastReport && getRoute() === '/done') navigate('/', { replace: true });
    }, expecting ? 2000 : 0);
    return () => clearTimeout(t);
  }, [liveReport]);

  const model = useMemo(() => (report ? buildSummary(report) : null), [report]);
  const ranked = useMemo(() => (model && report ? rankRewards(model, report) : null), [model, report]);
  const featured: 'unlock' | 'highlight' | 'pills' = model?.unlock ? 'unlock' : ranked?.highlight?.pill ? 'highlight' : 'pills';
  const breakKind = nextBreakKind(useTimer.getState().completedInCycle);
  const isLong = breakKind === 'longBreak';
  const breakMin = isLong ? longMin : shortMin;

  // Screen readers land on the headline and hear the whole summary once.
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const headingFocus = useCallback((el: HTMLHeadingElement | null) => {
    headingRef.current = el;
    if (el) requestAnimationFrame(() => el.focus({ preventScroll: true }));
  }, []);
  const [said, setSaid] = useState('');
  useEffect(() => {
    if (!model || !visible) return;
    const t = setTimeout(() => setSaid(model.announce), 600);
    return () => clearTimeout(t);
  }, [model, visible]);

  // A major room unlock gets its moment: the level-up sound once, when the summary is first seen.
  const cued = useRef(false);
  useEffect(() => {
    if (!model?.unlock || !visible || cued.current) return;
    cued.current = true;
    const t = setTimeout(() => audio.play('levelUp'), 700);
    return () => clearTimeout(t);
  }, [model, visible]);

  // Open the sheet high enough to show the highlight (or the rewards) whole, with the fold between two lines; set
  // before paint, so nothing jumps.
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLElement | null>(null);
  const opened = useRef(false);
  useLayoutEffect(() => {
    const sc = scrollRef.current;
    const sheet = sheetRef.current;
    const el = featureRef.current;
    if (!model || opened.current || !sc || !sheet || !el) return;
    opened.current = true;
    const rest = sheet.offsetTop; // the sheet's resting distance from the top (0 beside the stage)
    const h = sc.clientHeight;
    const lines = foldLines(sc, sheet);
    if (rest > 0) {
      const cap = Math.max(0, Math.min(rest * (featured === 'pills' ? MAX_LIFT : MAX_LIFT_MOMENT), figureRoom(sc, sheet)));
      const over = rest + el.offsetTop + el.offsetHeight + FEATURE_CLEAR - h;
      // Kept whole if any clean opening allows it, in this order: the heading, then the highlight (the routine
      // rewards just need a clean fold).
      const blocks = blocksOf(sheet);
      const must = (x: HTMLElement): [number, number, number] => [rest + x.offsetTop, rest + x.offsetTop + x.offsetHeight, Math.max(0, blocks.indexOf(blockOf(sheet, x)))];
      const musts: [number, number, number][] = [];
      if (headingRef.current) musts.push(must(headingRef.current));
      if (featured !== 'pills') musts.push(must(el));
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const { lift, air } = cleanOpen(lines, h, over > 0 ? Math.min(over, cap) : 0, cap, Math.round(MAX_AIR_REM * rem), musts);
      if (air > 0) sheet.style.setProperty('--air', `${air}px`);
      if (lift > 0) sc.scrollTop = lift;
    } else if (sc.scrollHeight > h + 1) {
      const end = cleanEnd(lines, h);
      if (end < h) sc.style.maxHeight = `${end}px`;
    }
  }, [model, featured]);
  // A trimmed card (side by side) was measured for this size: let it fill again when the window changes.
  useEffect(() => {
    const reset = () => scrollRef.current?.style.removeProperty('max-height');
    window.addEventListener('resize', reset);
    return () => window.removeEventListener('resize', reset);
  }, []);
  const feature = (kind: 'unlock' | 'highlight' | 'pills') => (el: HTMLElement | null) => {
    if (el && kind === featured) featureRef.current = el;
  };

  const leaving = useRef(false);
  const [exit, setExit] = useState(false);
  const leave = useCallback(
    (to: 'break' | 'home' | 'setup') => {
      if (leaving.current) return;
      leaving.current = true;
      setExit(true);
      window.setTimeout(() => (to === 'break' ? beginBreak() : to === 'home' ? skipBreakFromDone() : openSetupFromSummary()), reduced ? 60 : LEAVE_MS);
    },
    [reduced],
  );

  // Enter / Space from anywhere that isn't another control starts tea time.
  const ctaRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('button, a, input, textarea, select, summary, [role="button"], [role="dialog"]')) return;
      e.preventDefault();
      ctaRef.current?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Optional auto-start of the break (settings), paused while the tab is hidden; "Wait" stops it.
  const [autoLeft, setAutoLeft] = useState<number | null>(null);
  const [autoCancelled, setAutoCancelled] = useState(false);
  const autoOn = !!liveReport && autoStart && !autoCancelled && visible;
  useEffect(() => {
    if (!autoOn) {
      if (autoCancelled || !autoStart) setAutoLeft(null);
      return;
    }
    setAutoLeft((n) => n ?? AUTO_BREAK_S);
    const id = setInterval(() => setAutoLeft((n) => (n == null ? n : n - 1)), 1000);
    return () => clearInterval(id);
  }, [autoOn, autoCancelled, autoStart]);
  useEffect(() => {
    if (autoOn && autoLeft != null && autoLeft <= 0) leave('break');
  }, [autoOn, autoLeft, leave]);

  if (!report || !model) return <div className={s.summary} />;
  const r = report;
  const hl = ranked?.highlight ?? null;
  const sub = r.whileAway
    ? `The kettle whistled while you were away. Tea’s ready${isLong ? '' : ' when you are'}.`
    : isLong
      ? `${plural(every, 'brew')} done. Put your feet up: a long tea break, ${breakMin} min.`
      : `Tea’s ready. Take ${breakMin === 5 ? 'five' : `${breakMin} minutes`} before the next one.`;

  const enter = (i: number) =>
    reduced
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.22 } }
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.42, ease: ease.out, delay: 0.06 + i * 0.06 } };

  return (
    <div className={s.summary} data-exit={exit || undefined} aria-labelledby={headingId} role="region">
      <div className={s.scroll} ref={scrollRef}>
        <div className={s.sheet} ref={sheetRef}>
          <motion.header className={s.head} {...enter(0)}>
            <h1 id={headingId} ref={headingFocus} tabIndex={-1} className={s.title} data-fold="lines">
              {model.headline}
            </h1>
            <p className={s.sub} data-fold="lines">
              {sub}
            </p>
          </motion.header>

          {/* Saving failed: this brew is only in this tab. One line, in the page, with the way to keep it. */}
          <SaveWarningNote />

          {r.record.intention.trim() && (
            <motion.section className={s.task} aria-label="Your task" {...enter(1)}>
              <p className={s.taskName} data-fold="">
                <Icon name="edit" size={16} />
                <span className={s.taskText}>{r.record.intention}</span>
                {r.record.tag && <TagChip tag={r.record.tag} />}
              </p>
              <TaskChoice record={r.record} />
            </motion.section>
          )}

          {model.unlock && <Unlock ref={feature('unlock')} ids={model.unlock.ids} level={model.unlock.level} reduced={reduced} visible={visible} enter={enter(2)} />}

          {setupPending && r.firstEver && (
            <motion.section className={s.setup} aria-labelledby={`${headingId}-setup`} data-fold="" {...enter(3)}>
              <div>
                <h2 id={`${headingId}-setup`} className={s.setupTitle}>
                  Make Kettle yours
                </h2>
                <p className={s.setupSub}>Your name, daily goal, rhythm and sounds. About a minute, now or later in Settings.</p>
              </div>
              <Button variant="soft" size="sm" onClick={() => leave('setup')}>
                Set up
              </Button>
            </motion.section>
          )}

          <motion.ul ref={feature('pills')} className={s.pills} aria-label="Rewards" {...enter(4)}>
            {hl?.pill && (
              <li ref={feature('highlight')} className={s.highlight} data-kind={hl.pill.kind} data-milestone={hl.kind} data-highlight="" data-fold="">
                <span className={s.highlightArt} aria-hidden="true">
                  <PillArt pill={hl.pill} report={r} big />
                </span>
                <span className={s.highlightText}>
                  <span className={s.highlightTitle} aria-hidden={hl.pill.sr ? true : undefined}>
                    {hl.pill.text}
                  </span>
                  {hl.pill.sr && <span className="sr-only">{hl.pill.sr}</span>}
                  {hl.note && <span className={s.highlightNote}>{hl.note}</span>}
                </span>
              </li>
            )}
            {(ranked?.secondary ?? model.pills).map((p, i) => (
              <li key={`${p.kind}-${p.id ?? ''}-${i}`} className={s.pill} data-kind={p.kind} data-fold="">
                <span className={s.pillArt} aria-hidden="true">
                  <PillArt pill={p} report={r} />
                </span>
                <span aria-hidden={p.sr ? true : undefined}>{p.text}</span>
                {p.sr && <span className="sr-only">{p.sr}</span>}
              </li>
            ))}
          </motion.ul>

          <motion.div {...enter(5)}>
            <Details model={model} warmDays={r.streak.after} />
          </motion.div>
        </div>
      </div>

      <motion.footer className={s.footer} {...enter(3)} data-toast-above="">
        <Button ref={ctaRef} size="lg" variant="sky" sfx="start" icon={<Icon name="cup" size={22} />} onClick={() => leave('break')} className={s.cta} data-done-cta="">
          {isLong ? `Long tea break · ${breakMin} min` : `Tea time · ${breakMin} min`}
        </Button>
        <div className={s.second} data-auto={autoLeft != null || undefined}>
          {autoLeft != null && (
            <p className={s.auto}>
              <span aria-hidden="true" className={s.autoRing} style={{ ['--p' as string]: `${(autoLeft / AUTO_BREAK_S) * 100}%` }} />
              <span aria-live="off">Starts in {Math.max(0, autoLeft)}s</span>
              <button type="button" className={s.autoStop} onClick={() => setAutoCancelled(true)}>
                Wait
              </button>
            </p>
          )}
          <Button variant="ghost" sfx="cancel" onClick={() => leave('home')} className={s.skip}>
            Skip break
          </Button>
        </div>
      </motion.footer>
      <p className="sr-only" role="status" aria-live="polite">
        {said}
      </p>
    </div>
  );
}

/** Done or Carry forward — clearly about the task; changeable; stored on the record (reloads/tabs agree). */
function TaskChoice({ record }: { record: SessionRecord }) {
  const outcome = useProgress((st) => st.sessions.find((x) => x.id === record.id)?.outcome);
  return (
    <>
      <div className={s.choiceChips} data-fold="" role="group" aria-label={`“${record.intention}”: done, or carry it forward to your next brew?`}>
        <Chip tone="matcha" icon={outcome === 'done' ? undefined : 'check'} selected={outcome === 'done'} onClick={() => setIntentionOutcome(record, outcome === 'done' ? null : 'done')}>
          Done
        </Chip>
        <Chip tone="honey" icon={outcome === 'carried' ? undefined : 'refresh'} selected={outcome === 'carried'} onClick={() => setIntentionOutcome(record, outcome === 'carried' ? null : 'carried')}>
          Carry forward
        </Chip>
      </div>
      {/* The chips' state is the visible answer; screen readers also hear what it means. */}
      <p className="sr-only" aria-live="polite">
        {outcome === 'done' ? 'Crossed off. Your next brew starts fresh.' : outcome === 'carried' ? 'It’ll be waiting for your next brew.' : ''}
      </p>
    </>
  );
}

/** A reward's drawing: compact in a pill, larger (`big`) when it is the highlighted milestone. */
function PillArt({ pill, report, big = false }: { pill: RewardPill; report: CompletionReport; big?: boolean }): ReactNode {
  const k = big ? 1.2 : 1;
  switch (pill.kind) {
    case 'leaves':
      return <Leaf size={Math.round(20 * k)} />;
    case 'goal':
      return (
        <Ring value={pill.value ?? 0} size={Math.round(20 * k)} thickness={4} tone={(pill.value ?? 0) >= 1 ? 'matcha' : 'persimmon'} label="">
          {null}
        </Ring>
      );
    case 'streak':
      return <StreakMug state="warm" count={report.streak.after} size={Math.round(26 * k)} animate={false} />;
    case 'cozy':
      return <TeaCozy size={Math.round(24 * k)} animate={false} />;
    case 'recipes':
      return <TeaTin state="open" size={Math.round(24 * k)} animate={false} />;
    case 'level':
      return <LevelBadge level={pill.value ?? report.level.after} size={Math.round(22 * k)} />;
    case 'badge':
      return <Badge id={pill.id ?? ''} tier={pill.tier ?? 1} size={Math.round(26 * k)} />;
  }
}

/** A major unlock: a close-up of the item in the room (the 3D camera frames it), or its drawing while that loads. */
function Unlock({ ref, ids, level, reduced, visible, enter }: { ref?: Ref<HTMLElement>; ids: string[]; level: number; reduced: boolean; visible: boolean; enter: object }) {
  const items = ids.map((id) => ITEM_BY_ID[id]).filter(Boolean);
  const first = items[0];
  if (!first) return null;
  const names = items.map((i) => i.name);
  const title = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)} are in your nook` : `${names[0]} is in your nook`;
  return (
    <motion.section ref={ref} className={s.unlock} aria-label={`Cozy level ${level}: ${title}`} {...enter}>
      <div className={s.unlockScene} data-fold="">
        {visible && (
          <Nook
            mode="showcase"
            items={itemsUnlockedAt(level)}
            highlightItem={first.id}
            timeOfDay="auto"
            weather="clear"
            className={s.unlockNook}
            still={
              <span className={s.unlockStill}>
                <ItemGlyph id={first.id} size={96} />
              </span>
            }
          />
        )}
        {visible && <LeafConfetti burstKey={`unlock-${level}`} reduced={reduced} palette="gold" count={18} delay={0.5} spread={0.8} />}
      </div>
      <div className={s.unlockText}>
        <h2 className={s.unlockTitle} data-fold="lines">
          {title}
        </h2>
        <p className={s.unlockSub} data-fold="lines">
          <LevelBadge level={level} size={22} /> Cozy level {level} · {first.story}
        </p>
      </div>
    </motion.section>
  );
}

function Details({ model, warmDays }: { model: ReturnType<typeof buildSummary>; warmDays: number }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const d = model.details;
  const pct = d.size > 0 ? Math.min(100, (d.into / d.size) * 100) : 0;
  return (
    <section className={s.details} data-open={open || undefined}>
      <button type="button" className={s.detailsToggle} data-fold="" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        How your leaves added up
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={18} />
      </button>
      <div id={id} className={s.detailsBody} hidden={!open}>
        <ul className={s.rows}>
          {d.rows.map((row, i) => (
            <li key={`${row.label}-${i}`} className={s.row}>
              <span>{row.label}</span>
              <span className={s.amount}>+{row.amount}</span>
            </li>
          ))}
          <li className={`${s.row} ${s.total}`}>
            <span>This brew</span>
            <span className={s.amount}>
              <Leaf size={15} /> +{d.total}
            </span>
          </li>
        </ul>
        <div className={s.levelRow}>
          <span>
            Cozy level {d.level} → {d.level + 1}
          </span>
          <span>{plural(d.toNext, 'leaf', 'leaves')} to go</span>
        </div>
        <span className={s.bar} aria-hidden="true">
          <span className={s.barFill} style={{ width: `${pct}%` }} />
        </span>
        <p className={s.note}>
          {warmNote(warmDays)}
        </p>
      </div>
    </section>
  );
}

// ---------- the fold (Wave-1 #1) ----------
/**
 * A line of the sheet in the scroll area's content coordinates: [top, bottom, how much of its top may peek, its block]
 * (the block is its sheet child's place among the sheet's laid-out children: air moves block i down by (i + 1) × air).
 */
type FoldLine = [number, number, number, number];

let inkCtx: CanvasRenderingContext2D | null | undefined;
/**
 * How far a text line's ink sits inside its line box (the box is the font's full ascent + descent; capitals and
 * descenders stop short of it), from the font's own metrics. A text line counts by its ink: no glyph may be cut.
 */
function inkInsets(el: HTMLElement): { top: number; bottom: number } {
  inkCtx ??= document.createElement('canvas').getContext('2d');
  const text = el.textContent?.trim();
  if (!inkCtx || !text) return { top: 0, bottom: 0 };
  const cs = getComputedStyle(el);
  inkCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = inkCtx.measureText(text);
  if (!m.fontBoundingBoxAscent) return { top: 0, bottom: 0 };
  return { top: Math.max(0, m.fontBoundingBoxAscent - m.actualBoundingBoxAscent), bottom: Math.max(0, m.fontBoundingBoxDescent - m.actualBoundingBoxDescent) };
}

/** The sheet's laid-out children, in order (the grid items the sheet's gap falls between). */
const blocksOf = (sheet: HTMLElement) => [...sheet.children].filter((c) => getComputedStyle(c).display !== 'none');

/** The sheet child holding `el`. */
function blockOf(sheet: HTMLElement, el: HTMLElement): HTMLElement {
  let block: HTMLElement = el;
  while (block.parentElement && block.parentElement !== sheet) block = block.parentElement;
  return block;
}

/** Every line of the sheet (marked `data-fold`), where it will rest once the entrance motion has finished. */
function foldLines(sc: HTMLElement, sheet: HTMLElement): FoldLine[] {
  const origin = sc.getBoundingClientRect().top - sc.scrollTop;
  const blocks = blocksOf(sheet);
  const out: FoldLine[] = [];
  for (const el of sheet.querySelectorAll<HTMLElement>('[data-fold]')) {
    // The entrance transform sits on the sheet's own children (motion); measure where the line will rest.
    const block = blockOf(sheet, el);
    const i = Math.max(0, blocks.indexOf(block));
    const t = getComputedStyle(block).transform;
    const dy = t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0;
    if (el.dataset.fold === 'lines') {
      const ink = inkInsets(el);
      const range = document.createRange();
      range.selectNodeContents(el);
      const rows: { top: number; bottom: number }[] = [];
      for (const r of [...range.getClientRects()].filter((x) => x.width > 0.5 && x.height > 0.5).sort((a, b) => a.top - b.top)) {
        const last = rows.at(-1);
        if (last && r.top < last.bottom - Math.min(r.height, last.bottom - last.top) / 2) last.bottom = Math.max(last.bottom, r.bottom);
        else rows.push({ top: r.top, bottom: r.bottom });
      }
      for (const r of rows) out.push([r.top - origin - dy + ink.top, r.bottom - origin - dy - ink.bottom, 0, i]);
    } else {
      const r = el.getBoundingClientRect();
      if (r.height > 0.5) out.push([r.top - origin - dy, r.bottom - origin - dy, PEEK, i]);
    }
  }
  return out;
}

/** With the fold at `fold` px (scroll coordinates): every line wholly clear of the fade, or wholly below it. */
const cleanAt = (lines: FoldLine[], fold: number) => lines.every(([t, b, peek]) => b <= fold - FADE + 0.5 || t >= fold - peek - 0.5);

/** The lines as they lie with `air` px more above the heading and between every two blocks. */
const aired = (lines: FoldLine[], air: number): FoldLine[] => (air ? lines.map(([t, b, p, i]) => [t + air * (i + 1), b + air * (i + 1), p, i]) : lines);

/**
 * How the sheet opens (stacked): a lift in [0, cap] (it scrolls up, over the scene) and, only when no lift alone puts
 * the fold between two lines, `air` in [0, maxAir]: that much more room above the heading and between every two
 * blocks, which moves the lines down, the lower ones more, so the fold falls before the next block while the sheet
 * keeps an even rhythm. The fold sits at `h + lift` in the sheet's resting coordinates.
 * `musts` (the heading, then the highlight: [top, bottom, block]) are kept wholly clear of the fade when some clean
 * opening can — first all of them, then all but the last, and so on — and, for each, the least air wins, then the
 * lift nearest `want`. When nothing is clean: `want`, no air.
 */
function cleanOpen(lines: FoldLine[], h: number, want: number, cap: number, maxAir: number, musts: [number, number, number][]): { lift: number; air: number } {
  const pick = (need: [number, number, number][], air: number) => {
    const ls = aired(lines, air);
    const cands = [want, 0, cap];
    for (const [t, b, peek] of ls) cands.push(b - h + FADE, t - h + peek);
    let best: number | null = null;
    for (const c of cands)
      for (const v of [Math.floor(c), Math.ceil(c)]) {
        if (v < 0 || v > cap || !cleanAt(ls, v + h)) continue;
        if (need.some(([, b, i]) => b + air * (i + 1) - v > h - FADE + 0.5)) continue;
        if (best == null || Math.abs(v - want) < Math.abs(best - want) || (Math.abs(v - want) === Math.abs(best - want) && v > best)) best = v;
      }
    return best;
  };
  for (let k = musts.length; k >= 0; k--)
    for (let air = 0; air <= maxAir; air++) {
      const v = pick(musts.slice(0, k), air);
      if (v != null) return { lift: Math.round(v), air };
    }
  return { lift: Math.round(want), air: 0 };
}

/**
 * How far the sheet may rise from its rest before its top edge reaches Chai's or the kettle's box (stacked; the
 * stage marks them `data-stage-figure`). Measured where everything will rest: without the summary's entrance
 * transform or Chai's hop. No figures (no stage): no limit.
 */
function figureRoom(sc: HTMLElement, sheet: HTMLElement): number {
  const figs = sc.closest('[data-focus-view]')?.querySelectorAll<Element>('[data-stage-figure]') ?? [];
  let bottom = -Infinity;
  for (const f of figs) bottom = Math.max(bottom, f.getBoundingClientRect().bottom - shiftY(f));
  if (bottom === -Infinity) return Infinity;
  const restTop = sc.getBoundingClientRect().top - shiftY(sc) + sheet.offsetTop;
  return Math.floor(restTop - FIGURE_CLEAR - bottom);
}

/** The vertical translation an element and its ancestors carry right now (entrance motion, Chai's hop). */
function shiftY(el: Element): number {
  let dy = 0;
  for (let e: Element | null = el; e && e !== document.documentElement; e = e.parentElement) {
    const t = getComputedStyle(e).transform;
    if (t && t !== 'none') dy += new DOMMatrixReadOnly(t).m42;
  }
  return dy;
}

/** Side by side (no lift): the tallest scroll area, at most MAX_TRIM shorter, that ends between two lines. */
function cleanEnd(lines: FoldLine[], h: number): number {
  if (cleanAt(lines, h)) return h;
  const cands: number[] = [];
  for (const [t, b, peek] of lines) cands.push(Math.ceil(b + FADE), Math.floor(t + peek));
  const ok = cands.filter((v) => v < h && v >= h * (1 - MAX_TRIM) && cleanAt(lines, v));
  return ok.length ? Math.max(...ok) : h;
}
