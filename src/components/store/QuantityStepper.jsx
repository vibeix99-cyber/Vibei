import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange, min = 1, max = 99 }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));
  const btn =
    'w-9 h-9 flex items-center justify-center text-charcoal hover:text-terracotta disabled:opacity-30 disabled:pointer-events-none';

  return (
    <div className="inline-flex items-center border border-border rounded-full bg-offwhite">
      <motion.button
        type="button"
        whileTap={{ scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={btn}
      >
        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
      </motion.button>
      <div className="w-9 text-center text-sm font-semibold tabular-nums overflow-hidden" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={btn}
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
      </motion.button>
    </div>
  );
}
