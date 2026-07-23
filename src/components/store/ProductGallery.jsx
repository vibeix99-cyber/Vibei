import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

// Swipeable product gallery (Embla) with optional thumbnails. Works on desktop
// (arrows + thumbnail clicks) and mobile (touch swipe).
export default function ProductGallery({ images = [], alt = '', thumbnails = true, rounded = 'rounded-lg' }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: images.length > 1, align: 'center' });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return undefined;
    onSelect();
    embla.on('select', onSelect);
    embla.on('reInit', onSelect);
    return () => embla.off('select', onSelect);
  }, [embla, onSelect]);

  const scrollTo = useCallback((i) => embla && embla.scrollTo(i), [embla]);
  const list = images.length ? images : [null];

  return (
    <div>
      <div className={`relative bg-offwhite overflow-hidden ${rounded}`}>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {list.map((img, i) => (
              <div key={i} className="min-w-0 flex-[0_0_100%] aspect-square">
                <Image src={img} alt={`${alt}${list.length > 1 ? ` — image ${i + 1}` : ''}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => embla && embla.scrollPrev()}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-parchment/90 border border-border flex items-center justify-center text-charcoal hover:bg-parchment hover:scale-105 transition-all"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => embla && embla.scrollNext()}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-parchment/90 border border-border flex items-center justify-center text-charcoal hover:bg-parchment hover:scale-105 transition-all"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {thumbnails && list.length > 1 && (
        <div className="flex gap-3 mt-3">
          {list.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={selected === i}
              className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                selected === i ? 'border-terracotta' : 'border-transparent hover:border-terracotta/50'
              }`}
            >
              <Image src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
