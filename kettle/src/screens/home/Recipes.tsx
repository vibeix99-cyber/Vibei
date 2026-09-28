/** "Today's recipes" (daily quests) and "Today's brews" timeline. */
import { Icon, Mascot, QuestIcon, Leaf } from '@/art';
import type { Quest, SessionRecord } from '@/progress';
import { formatDuration } from '@/lib/format';
import { Card, ProgressBar } from '@/ui';
import { TAG_LABEL } from './content';
import s from './Home.module.css';

export function RecipesCard({ quests }: { quests: Quest[] }) {
  const done = quests.filter((q) => q.done).length;
  return (
    <Card as="section" className={`${s.recipes} ${s.hideWithRail}`} aria-labelledby="home-recipes">
      <header className={s.cardHead}>
        <span className={s.cardHeadIcon} aria-hidden>
          <Icon name="tin" size={24} />
        </span>
        <h2 id="home-recipes" className={s.cardTitle}>
          Today’s recipes
        </h2>
        <span className={s.cardHeadMeta}>
          {done} of {quests.length}
        </span>
      </header>
      <ul className={s.questList}>
        {quests.map((q) => (
          <li key={q.id} className={s.quest} data-done={q.done || undefined}>
            <QuestIcon icon={q.icon} done={q.done} size={44} className={s.questIcon} />
            <div className={s.questBody}>
              <div className={s.questTop}>
                <p className={s.questTitle}>{q.title}</p>
                <span className={s.questReward}>
                  <Leaf size={18} />+{q.reward}
                  <span className="sr-only"> leaves{q.done ? ', earned' : ''}</span>
                </span>
              </div>
              <div className={s.questBarRow}>
                <ProgressBar value={q.target ? q.progress / q.target : 0} tone={q.done ? 'matcha' : 'honey'} height={14} label={`${q.title}: ${q.progress} of ${q.target}`} className={s.questBar} />
                <span className={s.questCount} aria-hidden>
                  {q.progress}/{q.target}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export function TodayBrews({ sessions }: { sessions: SessionRecord[] }) {
  const total = sessions.reduce((a, x) => a + x.focusedMs, 0);
  return (
    <section className={s.brews} aria-labelledby="home-brews">
      <header className={s.sectionHead}>
        <h2 id="home-brews" className={s.sectionTitle}>
          Today’s brews
        </h2>
        {sessions.length > 0 && (
          <span className={s.sectionMeta}>
            {sessions.length} · {formatDuration(total)}
          </span>
        )}
      </header>
      {sessions.length === 0 ? (
        <div className={s.empty}>
          <Mascot pose="peek" size={72} />
          <p>Nothing brewed yet today. Your first cup is one tap away.</p>
        </div>
      ) : (
        <ol className={s.timeline}>
          {sessions.map((x) => (
            <li key={x.id} className={s.tlItem} data-completed={x.completed || undefined}>
              <time className={s.tlTime} dateTime={new Date(x.startedAt).toISOString()}>
                {timeFmt.format(x.startedAt)}
              </time>
              <span className={s.tlDot} aria-hidden>
                {x.completed && <Icon name="check" size={14} />}
              </span>
              <div className={s.tlBody}>
                <p className={s.tlTitle}>{x.intention || 'A quiet brew'}</p>
                <p className={s.tlMeta}>
                  {x.tag ? `${TAG_LABEL[x.tag]} · ` : ''}
                  {formatDuration(x.focusedMs)}
                  {x.completed ? '' : ' · ended early'}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
