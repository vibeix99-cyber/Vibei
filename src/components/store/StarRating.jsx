import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0, size = 16, onChange, className = '' }) {
  const interactive = typeof onChange === 'function';
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const StarEl = (
          <Star
            style={{ width: size, height: size }}
            className={filled ? 'fill-amber-clay text-amber-clay' : 'text-border'}
          />
        );
        return interactive ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="hover:scale-110 transition-transform"
          >
            {StarEl}
          </button>
        ) : (
          <span key={n}>{StarEl}</span>
        );
      })}
    </div>
  );
}