import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useCart } from '@/lib/CartContext';

export default function CartToast() {
  const { lastAdded } = useCart();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!lastAdded) return undefined;
    setToast(lastAdded);
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [lastAdded]);

  return (
    <div className="fixed top-5 right-5 z-[100] pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.at}
            initial={{ opacity: 0, x: 40, y: -8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex items-center gap-3 bg-charcoal text-parchment rounded-xl shadow-lg pl-3 pr-5 py-3 max-w-xs"
          >
            <span className="w-7 h-7 rounded-full bg-forest flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Added to cart ✓</p>
              <p className="text-xs text-parchment/70 truncate">{toast.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
