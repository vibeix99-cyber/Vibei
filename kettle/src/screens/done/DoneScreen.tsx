/** Session-complete celebration sequence — PLACEHOLDER. OWNER: core-loop area. */
import { Mascot } from '@/art';
import { Button, Card } from '@/ui';
import { useProgress } from '@/progress';
import { useTimer } from '@/timer';
import { navigate } from '@/app/router';

export default function DoneScreen() {
  const report = useProgress((s) => s.lastReport);
  const startBreak = useTimer((s) => s.startBreak);
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gap: 16, padding: 16, alignContent: 'center', justifyItems: 'center' }}>
      <Mascot pose="cheer" size={180} />
      <h1>The kettle’s whistling!</h1>
      {report && (
        <Card>
          +{report.leaves.total} leaves · streak {report.streak.after}
        </Card>
      )}
      <Button size="lg" onClick={() => startBreak()}>
        Start tea break
      </Button>
      <Button variant="ghost" onClick={() => navigate('/')}>
        Back home
      </Button>
    </div>
  );
}
