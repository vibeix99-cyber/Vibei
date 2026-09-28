/**
 * Desktop right rail (≥ 1200px): warm streak, daily goal, cozy level, today's recipes.
 * Plus `SidebarStatus`, the compact version shown in the sidebar at 900–1199px.
 * OWNER: design-system area.
 */
import { Icon, LevelBadge, Leaf, QuestIcon, StreakMug, TeaCozy } from '@/art';
import { addDays } from '@/lib/dates';
import { useDayKey, useLevel, useQuests, useStreak, useToday, type Quest } from '@/progress';
import { DAILY_GOALS, useSettings } from '@/state/settings';
import { Card, Counter, Pill, ProgressBar, Ring, WeekStrip, cx } from '@/ui';
import s from './Rail.module.css';


/** Just the word, singular or plural (the number is rendered separately). */
const word = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

function goalLabel(min: number): string {
  return DAILY_GOALS.find((g) => g.min === min)?.label ?? `${min} min a day`;
}

function useWeek() {
  const streak = useStreak();
  const today = useDayKey();
  const start = addDays(today, -6);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    const state = streak.days?.[day];
    const d = new Date(`${day}T12:00:00`);
    return {
      day,
      label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      isToday: day === today,
      state: state === 'done' ? 'done' : state === 'cozy' ? 'cozy' : day === today ? 'today' : 'missed',
    } as const;
  });
}

export function Rail() {
  return (
    <div className={s.rail}>
      <StreakCard />
      <GoalCard />
      <LevelCard />
      <RecipesCard />
    </div>
  );
}

function StreakCard() {
  const streak = useStreak();
  const week = useWeek();
  const n = streak.current;
  return (
    <Card className={s.card} as="section" aria-labelledby="rail-streak">
      <div className={s.streakHead}>
        <span className={s.bigIcon} aria-hidden="true">
          <StreakMug state={n === 0 ? 'cold' : streak.todayDone ? 'warm' : 'atRisk'} size={56} />
        </span>
        <div className={s.streakText}>
          <h2 id="rail-streak" className={s.streakTitle}>
            {n > 0 ? (
              <>
                <Counter value={n} className={s.streakNum} /> {word(n, 'day')} warm
              </>
            ) : (
              'Start a warm streak'
            )}
          </h2>
          <p className={s.caption}>
            {n === 0
              ? 'One brew today warms the mug.'
              : streak.todayDone
                ? 'Kept warm today. Lovely.'
                : streak.atRisk
                  ? 'One brew tonight keeps it warm.'
                  : 'Brew today to keep it warm.'}
          </p>
        </div>
      </div>
      <WeekStrip days={week} label="Last 7 days" />
      <div className={s.streakFoot}>
        <span>
          Best <strong>{streak.best}</strong>
        </span>
        <span className={s.sep} aria-hidden="true" />
        <span className={s.cozies}>
          <TeaCozy size={22} muted={streak.cozies === 0} animate={false} />{' '}
          {streak.cozies > 0
            ? `${streak.cozies} Tea ${word(streak.cozies, 'Cozy', 'Cozies')}`
            : streak.toNextCozy > 0
              ? `Tea Cozy in ${streak.toNextCozy} ${word(streak.toNextCozy, 'day')}`
              : 'No Tea Cozies yet'}
        </span>
      </div>
    </Card>
  );
}

function GoalCard() {
  const today = useToday();
  const minutes = Math.floor(today.focusMs / 60000);
  const left = Math.max(0, today.goalMin - minutes);
  const met = today.goalProgress >= 1;
  return (
    <Card className={s.card} as="section" aria-labelledby="rail-goal">
      <div className={s.goal}>
        <Ring
          value={today.goalProgress}
          size={76}
          thickness={9}
          tone={met ? 'matcha' : 'persimmon'}
          label="Daily goal"
          valueText={`${minutes} of ${today.goalMin} minutes`}
        >
          {met ? (
            <span className={s.ringCheck}>
              <Icon name="check" size={26} />
            </span>
          ) : (
            <span className={s.ringPct}>{Math.round(Math.min(1, today.goalProgress) * 100)}%</span>
          )}
        </Ring>
        <div className={s.goalText}>
          <p className={s.overline} id="rail-goal">
            Daily goal · {goalLabel(today.goalMin)}
          </p>
          <p className={s.goalValue}>
            <Counter value={minutes} /> <span className={s.of}>/ {today.goalMin} min</span>
          </p>
          <p className={s.caption}>{met ? 'Goal met. Enjoy the rest of your day.' : `${left} min to go`}</p>
        </div>
      </div>
    </Card>
  );
}

function LevelCard() {
  const level = useLevel();
  const toNext = Math.max(0, level.size - level.into);
  return (
    <Card className={s.card} as="section" aria-labelledby="rail-level">
      <div className={s.levelHead}>
        <span className={s.levelBadge} aria-hidden="true">
          <LevelBadge level={level.level} size={48} />
        </span>
        <div className={s.levelText}>
          <h2 id="rail-level" className={s.levelTitle}>
            Cozy level {level.level}
          </h2>
          <p className={s.caption}>
            {toNext.toLocaleString()} {word(toNext, 'leaf', 'leaves')} to level {level.level + 1}
          </p>
        </div>
        <Pill tone="matcha" icon={<Leaf size={16} />} title="Leaves">
          <Counter value={level.leaves} font="body" />
        </Pill>
      </div>
      <ProgressBar
        value={level.size > 0 ? level.into / level.size : 0}
        tone="honey"
        height={14}
        label={`Progress to cozy level ${level.level + 1}`}
        valueText={`${level.into} of ${level.size} leaves`}
      />
    </Card>
  );
}

function RecipesCard() {
  const quests = useQuests();
  const done = quests.filter((q) => q.done).length;
  return (
    <Card className={s.card} as="section" aria-labelledby="rail-recipes">
      <div className={s.recipesHead}>
        <h2 id="rail-recipes" className={s.sectionTitle}>
          Today’s recipes
        </h2>
        {quests.length > 0 && (
          <span className={s.count}>
            {done}/{quests.length}
          </span>
        )}
      </div>
      {quests.length === 0 ? (
        <p className={s.caption}>Your recipes are steeping. Check back after your first brew.</p>
      ) : (
        <ul className={s.recipes}>
          {quests.slice(0, 3).map((q) => (
            <RecipeRow key={q.id} q={q} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function RecipeRow({ q }: { q: Quest }) {
  return (
    <li className={cx(s.recipe, q.done && s.recipeDone)}>
      <span className={s.recipeIcon} aria-hidden="true">
        <QuestIcon icon={q.icon} done={q.done} size={40} />
      </span>
      <div className={s.recipeBody}>
        <div className={s.recipeTop}>
          <span className={s.recipeTitle}>{q.title}</span>
          <span className={s.reward}>
            <Leaf size={14} />+{q.reward}
            <span className="sr-only"> leaves</span>
          </span>
        </div>
        <ProgressBar
          value={q.target > 0 ? q.progress / q.target : 0}
          tone={q.done ? 'matcha' : 'honey'}
          height={10}
          label={q.title}
          valueText={`${q.progress} of ${q.target}`}
        />
      </div>
    </li>
  );
}

/** Compact status for the sidebar when the rail is hidden (900–1199px). */
export function SidebarStatus() {
  const streak = useStreak();
  const today = useToday();
  const level = useLevel();
  const minutes = Math.floor(today.focusMs / 60000);
  const goalMin = useSettings((st) => st.dailyGoalMin);
  return (
    <div className={s.mini}>
      <div className={s.miniRow}>
        <span className={s.miniStat} title="Warm streak">
          <StreakMug state={streak.current === 0 ? 'cold' : streak.todayDone ? 'warm' : 'atRisk'} size={26} animate={false} />
          <strong aria-hidden="true">{streak.current}</strong>
          <span className="sr-only">{streak.current} {word(streak.current, 'day')} warm streak</span>
        </span>
        <span className={s.miniStat} title="Leaves">
          <Leaf size={22} />
          <strong aria-hidden="true">{level.leaves.toLocaleString()}</strong>
          <span className="sr-only">{level.leaves.toLocaleString()} leaves</span>
        </span>
      </div>
      <ProgressBar
        value={today.goalProgress}
        tone={today.goalProgress >= 1 ? 'matcha' : 'persimmon'}
        height={10}
        label="Daily goal"
        valueText={`${minutes} of ${goalMin} minutes`}
      />
      <p className={s.miniCaption}>
        {minutes} / {goalMin} min today
      </p>
    </div>
  );
}
