/** Stats — PLACEHOLDER. OWNER: progress area. */
import { useProgress, useStreak, useLevel } from '@/progress';
import { Card } from '@/ui';

export default function StatsScreen() {
  const sessions = useProgress((s) => s.sessions);
  const streak = useStreak();
  const level = useLevel();
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Stats</h1>
      <Card>{sessions.length} sessions · best streak {streak.best} · level {level.level}</Card>
    </div>
  );
}
