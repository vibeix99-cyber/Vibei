/** Home — "Today". OWNER: home area. */
import { useRef } from 'react';
import { useRoute } from '@/app/router';
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
  // While Today is the outgoing layer of "Put the kettle on", keep the frame you tapped from:
  // don't swap the composer for the "kettle's on" banner mid-dissolve.
  const route = useRoute();
  const live = useTimer((t) => t.status !== 'idle');
  const shown = useRef(live);
  if (route === '/') shown.current = live;
  const active = shown.current;
  // Build the 3D nook off-screen while Home idles, so "Put the kettle on" doesn't stall on it.
  usePrewarmNook(useUnlockedItems());
  return (
    <div className={s.screen} data-tablet="wide">
      {/* Two columns on landscape phones and tablets (greeting + goal | composer + CTA); one flow elsewhere. */}
      <div className={s.colA}>
        <Hero data={data} status={<StatusBar data={data} />} />
        {active ? <ResumeBanner /> : null}
        <GoalCard data={data} />
        {/* Tablets balance the two columns with the recipes on the left; elsewhere they follow the composer. */}
        <div className={s.recipesLeft}>
          <RecipesCard quests={data.quests} />
        </div>
      </div>
      <div className={s.colB}>
        {!active && <Composer recent={data.recentIntentions} />}
        <div className={s.recipesRight}>
          <RecipesCard quests={data.quests} />
        </div>
        <TodayBrews sessions={data.todays} />
      </div>
    </div>
  );
}
