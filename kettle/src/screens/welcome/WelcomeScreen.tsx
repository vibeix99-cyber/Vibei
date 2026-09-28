/** Onboarding — PLACEHOLDER. OWNER: home/onboarding/settings area. */
import { Mascot } from '@/art';
import { Button } from '@/ui';
import { useSettings } from '@/state/settings';

export default function WelcomeScreen() {
  const set = useSettings((s) => s.set);
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gap: 16, padding: 16, alignContent: 'center', justifyItems: 'center' }}>
      <Mascot pose="wave" size={200} />
      <h1>Hi, I’m Chai.</h1>
      <p>Let’s put the kettle on and get cozy.</p>
      <Button size="lg" onClick={() => set({ onboarded: true })}>
        Get started
      </Button>
    </div>
  );
}
