/** Settings — PLACEHOLDER. OWNER: home/onboarding/settings area. */
import { useSettings } from '@/state/settings';
import { Card } from '@/ui';

export default function SettingsScreen() {
  const s = useSettings();
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Settings</h1>
      <Card>
        Focus {s.focusMin} min · Break {s.shortBreakMin} min · Theme {s.theme}
      </Card>
    </div>
  );
}
