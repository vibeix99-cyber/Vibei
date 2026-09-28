/** Dev-only gallery: `#/kit?part=ui|art` (debug builds). Shows every component & artwork in isolation. */
import { lazy, Suspense } from 'react';

const UiGallery = lazy(() => import('@/ui/Gallery'));
const ArtGallery = lazy(() => import('@/art/Gallery'));

export default function KitRoute() {
  const part = new URLSearchParams(location.hash.split('?')[1] ?? '').get('part');
  return (
    <div style={{ padding: 24, display: 'grid', gap: 48 }}>
      <Suspense fallback={null}>
        {part !== 'art' && <UiGallery />}
        {part !== 'ui' && <ArtGallery />}
      </Suspense>
    </div>
  );
}
