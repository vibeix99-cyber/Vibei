/** Desktop right rail (streak, leaves, goal, recipes). INITIAL. OWNER: design-system area. */
import { useLevel, useStreak, useToday } from '@/progress';
import { Card, ProgressBar } from '@/ui';

export function Rail() {
  const streak = useStreak();
  const level = useLevel();
  const today = useToday();
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <strong>{streak.current} day warm streak</strong>
      </Card>
      <Card>
        <strong>Level {level.level}</strong> · {level.leaves} leaves
      </Card>
      <Card>
        <p>Daily goal</p>
        <ProgressBar value={today.goalProgress} label="Daily goal progress" />
      </Card>
    </div>
  );
}
