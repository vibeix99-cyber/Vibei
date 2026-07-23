import React from 'react';
import { motion } from 'framer-motion';

// Renders each variant group (e.g. Size / Fragrance) as a row of pills with a
// smooth highlight that animates between the selected option.
export default function VariantPills({ variants = [], selected, onSelect, idBase = 'v' }) {
  if (!variants.length) return null;
  return (
    <div className="space-y-5">
      {variants.map((v) => (
        <div key={v.label}>
          <span className="text-sm font-semibold uppercase tracking-wide text-charcoal">
            {v.label}
            {selected[v.label] && (
              <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground">
                {selected[v.label]}
              </span>
            )}
          </span>
          <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label={`Choose ${v.label}`}>
            {(v.options || []).map((opt) => {
              const active = selected[v.label] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onSelect(v.label, opt)}
                  aria-pressed={active}
                  className={`relative px-4 py-2 rounded-full text-sm border transition-colors duration-200 ${
                    active ? 'text-parchment border-terracotta' : 'border-border text-charcoal hover:border-terracotta'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={`${idBase}-${v.label}-highlight`}
                      className="absolute inset-0 rounded-full bg-terracotta"
                      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
