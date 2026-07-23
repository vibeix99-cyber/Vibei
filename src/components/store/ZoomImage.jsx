import React, { useRef, useState } from 'react';
import { Image } from '@/components/ui/image';

// Desktop: hover to reveal a magnified close-up that tracks the cursor.
// Touch devices simply show the image (no hover), so nothing breaks.
export default function ZoomImage({ src, alt, zoom = 2.2 }) {
  const containerRef = useRef(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const handleMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={handleMove}
      className="relative w-full h-full cursor-zoom-in overflow-hidden"
    >
      <Image src={src} alt={alt} className="w-full h-full object-cover" />

      {active && (
        <div
          className="hidden md:block absolute inset-0 pointer-events-none bg-no-repeat"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${pos.x}% ${pos.y}%`,
          }}
        />
      )}
    </div>
  );
}