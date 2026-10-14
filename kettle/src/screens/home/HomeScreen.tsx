/** Home — "Today". OWNER: home area. */
import { useRef } from 'react';
import { useRoute } from '@/app/router';
import { useTimer } from '@/timer';
import { NoticeStrip, useMediaQuery } from '@/ui';
import { useUnlockedItems } from '@/progress';
import { usePrewarmNook } from '@/scene';
import { StatusBar } from './StatusBar';
import { Hero, GoalCard } from './Hero';
import { Composer, ResumeBanner } from './Composer';
import { RecipesCard, TodayBrews } from './Recipes';
import { useHomeData } from './useHomeData';
import { SaveWarningBanner } from '@/app/SaveWarning';
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
  const tablet = useMediaQuery('(min-width: 720px) and (max-width: 899px) and (min-height: 521px)');
  // Desktop: two real columns, start a brew | today (minutes, today's brews, recipes). The shell's right rail
  // steps aside on Today (data-layout="home"), so nothing on this page is shown twice.
  const desk = useMediaQuery('(min-width: 1200px)');
  // Landscape phones lay Today out in two columns too (greeting + goal pinned | composer + CTA scrolling).
  const landscape = useMediaQuery('(max-width: 899px) and (orientation: landscape) and (max-height: 520px)');
  const sideBySide = tablet || landscape;
  // Where the brew length sits (see Composer): in the docked start on portrait phones, heading the column in landscape.
  const phone = useMediaQuery('(max-width: 719px)');
  const lengthAt = landscape ? 'top' : phone ? 'dock' : 'card';
  // Build the 3D nook off-screen while Home idles, so "Put the kettle on" doesn't stall on it.
  usePrewarmNook(useUnlockedItems());
  if (desk) {
    return (
      <div className={s.screen} data-tablet="wide" data-layout="home">
        <div className={s.colA}>
          <Hero data={data} status={<StatusBar data={data} />} />
          {active ? <ResumeBanner /> : <Composer recent={data.recentIntentions} />}
        </div>
        <div className={s.colB}>
          {/* Storage full: in the page, at the head of this column (a banner here moves nothing in the composer). */}
          <SaveWarningBanner home="/" />
          <GoalCard data={data} />
          <TodayBrews sessions={data.todays} />
          <RecipesCard quests={data.quests} />
        </div>
      </div>
    );
  }
  return (
    <div className={s.screen} data-tablet="wide">
      {/* Two columns on landscape phones and tablets (greeting + goal | composer + CTA); one flow elsewhere. */}
      <div className={s.colA}>
        {/* Landscape phones: Today's notice strip heads the pinned column (above the stats and greeting), so a notice
            never pushes the composer column (the task field, Mark done, Brew length) down under the docked start, and is
            in view whenever Today opens. Elsewhere the page's own strip, at the top of Today (src/app/Shell.tsx). */}
        <NoticeStrip prio={1} screen="/" off={!landscape} className={s.notices} />
        <Hero data={data} status={<StatusBar data={data} />} />
        {/* Storage full: in the page flow, under the greeting (src/app/SaveWarning.tsx); side by side, at the head of
            the column that scrolls (the left one is pinned there). */}
        {!sideBySide && <SaveWarningBanner home="/" />}
        {active ? <ResumeBanner /> : null}
        <GoalCard data={data} />
        {/* Tablets balance the two columns with the recipes on the left; elsewhere they follow the composer. */}
        {tablet && <RecipesCard quests={data.quests} />}
      </div>
      <div className={s.colB}>
        {sideBySide && <SaveWarningBanner home="/" />}
        {!active && <Composer recent={data.recentIntentions} lengthAt={lengthAt} />}
        {!tablet && <RecipesCard quests={data.quests} />}
        <TodayBrews sessions={data.todays} />
      </div>
    </div>
  );
}
