/** Home — "Today". OWNER: home area. */
import { useTimer } from '@/timer';
import { StatusBar } from './StatusBar';
import { Hero, GoalCard } from './Hero';
import { Composer, ResumeBanner } from './Composer';
import { RecipesCard, TodayBrews } from './Recipes';
import { useHomeData } from './useHomeData';
import s from './Home.module.css';

export default function HomeScreen() {
  const data = useHomeData();
  const active = useTimer((t) => t.status !== 'idle');
  return (
    <div className={s.screen}>
      {/* Two columns on landscape phones (greeting + goal | composer + CTA); one flow elsewhere. */}
      <div className={s.colA}>
        <Hero data={data} status={<StatusBar data={data} />} />
        {active ? <ResumeBanner /> : null}
        <GoalCard data={data} />
      </div>
      <div className={s.colB}>
        {!active && <Composer recent={data.recentIntentions} />}
        <RecipesCard quests={data.quests} />
        <TodayBrews sessions={data.todays} />
      </div>
    </div>
  );
}
