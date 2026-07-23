import React from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import SectionHeading from './SectionHeading';

const MAKERS = [
  {
    name: 'Imnala Ao',
    craft: 'Master Weaver',
    origin: 'Mokokchung District',
    portrait: 'https://media.base44.com/images/public/6a60902adcc8c65641dc85b0/c6aeebfff_generated_image.png',
    story:
      'For over forty years, Imnala has woven mufflers and shawls on her backstrap loom, keeping the motifs of the Ao tribe alive. Each thread carries a story passed down from her mother and grandmother.',
  },
  {
    name: 'Wangnao Konyak',
    craft: 'Bag & Textile Craftsman',
    origin: 'Mon District',
    portrait: 'https://media.base44.com/images/public/6a60902adcc8c65641dc85b0/d97ca407a_generated_image.png',
    story:
      'From the land of the legendary Konyak, Wangnao blends bold tribal patterns with everyday utility. His sling bags marry heritage with contemporary life, made entirely by hand in his bamboo workshop.',
  },
  {
    name: 'Vethozo Chase',
    craft: 'Highland Farmer',
    origin: 'Nagaland Highlands',
    portrait: 'https://media.base44.com/images/public/6a60902adcc8c65641dc85b0/a8f404742_generated_image.png',
    story:
      'Vethozo tends small terraced plots high in the hills, harvesting wild apples and single-origin coffee cherries. Everything she grows is nurtured naturally, the way her community always has.',
  },
];

export default function MakersSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-20">
      <SectionHeading
        eyebrow="The Hands Behind the Craft"
        title="Meet the Makers"
      />
      <p className="text-muted-foreground max-w-2xl -mt-2 mb-10">
        Every piece in our store begins with a person, a place, and a tradition. These are a few of the artisans and growers whose skill and heritage you carry home.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {MAKERS.map((m, i) => (
          <motion.article
            key={m.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group bg-offwhite border border-border rounded-lg overflow-hidden flex flex-col"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={m.portrait}
                alt={`${m.name}, ${m.craft}`}
                fittingType="fill"
                focalPointX={0.5}
                focalPointY={0.4}
                className="w-full h-full transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-parchment">
                <h3 className="font-heading font-bold text-2xl leading-tight">{m.name}</h3>
                <p className="text-[11px] uppercase tracking-[0.2em] text-amber-clay mt-1">
                  {m.craft} · {m.origin}
                </p>
              </div>
            </div>
            <p className="p-5 text-[15px] leading-relaxed text-muted-foreground flex-1">
              {m.story}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}