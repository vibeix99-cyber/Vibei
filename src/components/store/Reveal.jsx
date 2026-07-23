import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

// Fade-up used for product cards; `index` gives a subtle stagger without
// waiting on a parent container (works even when cards mount independently).
export function FadeInCard({ index = 0, className, children }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.4, ease: EASE, delay: Math.min((index % 4) * 0.07, 0.28) }}
    >
      {children}
    </motion.div>
  );
}

// Category / content sections slide in from the left as they scroll into view.
export function SlideInLeft({ className, children }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -48 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
