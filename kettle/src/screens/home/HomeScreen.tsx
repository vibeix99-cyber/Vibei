/** Home — "Today". OWNER: home area. */
import { useTimer } from '@/timer';
import { useUnlockedItems } from '@/progress';
import { usePrewarmNook } from '@/scene';
import { StatusBar } from './StatusBar';
import { Hero, GoalCard } from './Hero';
import { Composer, ResumeBanner } from './Composer';
import { RecipesCard, TodayBrews } from './Recipes';
import { useHomeData } from './useHomeData';
import s from './Home.module.css';

export default function HomeScreen() {
  const data = useHomeData();
  const active = useTimer((t) => t.status !== 'idle');
  // Build the 3D nook off-screen while Home idles, so "Put the kettle on" doesn't stall on it.
  usePrewarmNook(useUnlockedItems());
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
