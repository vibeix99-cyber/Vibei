import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

const SLIDES = [
  {
    img: 'https://media.base44.com/images/public/6a60902adcc8c65641dc85b0/a81a2269e_generated_image.png',
    eyebrow: 'Handloom & Handicrafts',
    title: 'Woven by\nGenerations',
    text: 'Richly patterned shawls and textiles, each thread carrying the heritage of the Naga hills.',
  },
  {
    img: 'https://media.base44.com/images/public/6a60902adcc8c65641dc85b0/3ff210068_generated_image.png',
    eyebrow: 'Gourmet Food & Staple',
    title: 'Flavours of\nthe Hills',
    text: 'Handmade pickles, smoked spices and organic produce from Naga kitchens to yours.',
  },
  {
    img: 'https://media.base44.com/images/public/6a60902adcc8c65641dc85b0/47bc95c9b_generated_image.png',
    eyebrow: 'A Living Archive of the 16 Tribes',
    title: 'Crafted\nby Hand',
    text: 'Every shawl, spice and souvenir carries the hands, hills and heritage of the Naga people.',
  },
];

const AUTOPLAY_MS = 6000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const timer = useRef(null);

  useEffect(() => {
    if (reducedMotion || paused) return undefined;
    timer.current = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => clearInterval(timer.current);
  }, [reducedMotion, paused, active]);

  const slide = SLIDES[active];

  return (
    <section
      className="relative min-h-[86vh] overflow-hidden bg-charcoal"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity [transition-duration:1200ms] ease-out ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={i === active ? undefined : true}
        >
          <Image
            src={s.img}
            alt={s.eyebrow}
            className={`w-full h-full object-cover ${
              i === active && !reducedMotion ? 'animate-ken-burns' : ''
            }`}
          />
        </div>
      ))}

      {/* Cinematic scrim: darkest at the bottom where copy sits, soft vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/55 to-charcoal/20" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_15%,transparent_35%,rgba(42,38,34,0.55)_100%)]" />

      {/* Copy */}
      <div className="relative z-10 min-h-[86vh] flex flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <span className="eyebrow text-amber-clay">
              <span className="h-px w-8 bg-amber-clay/70" aria-hidden="true" />
              {slide.eyebrow}
              <span className="h-px w-8 bg-amber-clay/70" aria-hidden="true" />
            </span>
            <h1 className="display-hero mt-6 text-white text-5xl md:text-7xl whitespace-pre-line [text-shadow:0_2px_30px_rgba(0,0,0,0.55)]">
              {slide.title}
            </h1>
            <p className="mt-6 mx-auto max-w-lg text-lg text-parchment/90 leading-relaxed [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
              {slide.text}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 rounded-full bg-amber-clay px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-terracotta hover:-translate-y-0.5"
          >
            Explore Collection
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/in-store"
            className="inline-flex items-center rounded-full border border-parchment/40 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-parchment backdrop-blur-sm transition-colors hover:border-parchment/80 hover:bg-white/10"
          >
            Visit the Store
          </Link>
        </div>
      </div>

      {/* Slide controls: counter + expanding indicators */}
      <div className="absolute bottom-9 inset-x-0 z-20 flex items-center justify-center gap-5">
        <span className="font-display text-sm tabular-nums text-parchment/70">
          {String(active + 1).padStart(2, '0')}
          <span className="mx-1 text-parchment/30">/</span>
          {String(SLIDES.length).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-2.5" role="tablist" aria-label="Choose slide">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-9 bg-amber-clay' : 'w-3 bg-parchment/40 hover:bg-parchment/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
