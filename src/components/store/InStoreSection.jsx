import React from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { MapPin, Clock, UtensilsCrossed } from 'lucide-react';

const STORE_IMAGE = 'https://media.base44.com/images/public/6a60902adcc8c65641dc85b0/8a35c4860_image.png';

export default function InStoreSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="lg:col-span-7 rounded-lg overflow-hidden aspect-[16/10]"
        >
          <Image src={STORE_IMAGE} alt="Made in Nagaland Centre & The Food Hub storefront" className="w-full h-full object-cover" />
        </motion.div>

        {/* Copy */}
        <div className="lg:col-span-5">
          <span className="text-amber-clay uppercase tracking-[0.3em] text-xs font-semibold">Visit Us In-Store</span>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-terracotta mt-3 leading-tight">
            The Made in Nagaland Centre
          </h2>
          <p className="mt-4 text-charcoal/85 leading-relaxed">
            Step into our flagship centre and experience the hills first-hand — browse handwoven shawls,
            gourmet pickles and tribal crafts under one roof, then savour local flavours at
            <span className="font-semibold text-forest"> The Food Hub</span>.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-clay shrink-0 mt-0.5" />
              <p className="text-sm text-charcoal/85">Made in Nagaland Centre, Dimapur, Nagaland</p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-clay shrink-0 mt-0.5" />
              <p className="text-sm text-charcoal/85">Open daily · 9:00 AM – 8:00 PM</p>
            </div>
            <div className="flex items-start gap-3">
              <UtensilsCrossed className="w-5 h-5 text-amber-clay shrink-0 mt-0.5" />
              <p className="text-sm text-charcoal/85">The Food Hub — Good Time, Great Taste</p>
            </div>
          </div>

          <a
            href="https://www.google.com/maps/search/?api=1&query=Made+in+Nagaland+Centre+Dimapur"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 bg-forest text-parchment font-semibold uppercase tracking-wider text-sm px-8 py-3.5 rounded-full hover:bg-terracotta transition-colors"
          >
            Get Directions
          </a>
        </div>
      </div>
    </section>
  );
}