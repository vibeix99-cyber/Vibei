/** Home ("Today") — PLACEHOLDER. OWNER: home/onboarding/settings area. */
import { Mascot } from '@/art';
import { Button, Card, ProgressBar } from '@/ui';
import { useStreak, useToday, useLevel } from '@/progress';
import { useSettings } from '@/state/settings';
import { useTimer } from '@/timer';

export default function HomeScreen() {
  const name = useSettings((s) => s.name);
  const focusMin = useSettings((s) => s.focusMin);
  const today = useToday();
  const streak = useStreak();
  const level = useLevel();
  const startFocus = useTimer((s) => s.startFocus);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Good day{name ? `, ${name}` : ''}</h1>
      <Mascot pose="wave" size={140} />
      <Card>
        {streak.current} day streak · Level {level.level} · {level.leaves} leaves
      </Card>
      <Card>
        <p>Today: {Math.round(today.focusMs / 60000)} / {today.goalMin} min</p>
        <ProgressBar value={today.goalProgress} label="Daily goal" />
      </Card>
      <Button size="lg" block sfx="start" onClick={() => startFocus()}>
        Put the kettle on · {focusMin} min
      </Button>
    </div>
  );
}
