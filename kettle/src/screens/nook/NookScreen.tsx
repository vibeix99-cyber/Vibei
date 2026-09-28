/** Nook (3D room collection) — PLACEHOLDER. OWNER: scene area. */
import { Nook } from '@/scene';
import { useUnlockedItems } from '@/progress';

export default function NookScreen() {
  const items = useUnlockedItems();
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Your nook</h1>
      <div style={{ height: 360 }}>
        <Nook mode="showcase" items={items} interactive />
      </div>
    </div>
  );
}
