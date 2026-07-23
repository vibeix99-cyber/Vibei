import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { MapPin } from 'lucide-react';

const STORE_IMAGE = 'https://media.base44.com/images/public/6a60902adcc8c65641dc85b0/faeeec29a_31882923_1490649151046929_8060518403196059648_n.jpg';

const STORE_CATEGORIES = [
  { name: 'Pickles', img: 'https://i0.wp.com/madeinnagalandcenter.in/wp-content/uploads/2023/06/Pickle-section-main-image.jpeg?fit=1024%2C1024&ssl=1', slug: 'gourmet-food' },
  { name: 'Tea', img: 'https://i0.wp.com/madeinnagalandcenter.in/wp-content/uploads/2023/06/WhatsApp-Image-2023-06-01-at-13.33.07-1.jpeg?fit=1024%2C1024&ssl=1', slug: 'gourmet-food' },
  { name: 'Clothing', img: 'https://i0.wp.com/madeinnagalandcenter.in/wp-content/uploads/2023/06/CLOTHING-1.jpeg?fit=1024%2C1024&ssl=1', slug: 'fashion' },
  { name: 'Necklaces', img: 'https://i0.wp.com/madeinnagalandcenter.in/wp-content/uploads/2023/06/NECKLACE-1.jpeg?fit=1024%2C1024&ssl=1', slug: 'handloom' },
  { name: 'Handicraft', img: 'https://i0.wp.com/madeinnagalandcenter.in/wp-content/uploads/2023/06/HANDICRAFT-1.jpeg?fit=1024%2C1024&ssl=1', slug: 'handloom' },
  { name: 'Home Decor', img: 'https://i0.wp.com/madeinnagalandcenter.in/wp-content/uploads/2023/06/HOME-DECOR-1.jpeg?fit=1024%2C1024&ssl=1', slug: 'handloom' },
  { name: 'Fridge Magnets', img: 'https://i0.wp.com/madeinnagalandcenter.in/wp-content/uploads/2023/06/FRIDGE-MAGNETS-1.jpeg?fit=1024%2C1024&ssl=1', slug: 'gifts' },
  { name: 'Handmade Soaps', img: 'https://i0.wp.com/madeinnagalandcenter.in/wp-content/uploads/2023/06/SOAPS-1.jpeg?fit=1024%2C1024&ssl=1', slug: 'cosmetics' },
  { name: 'Gift Section', img: 'https://i0.wp.com/madeinnagalandcenter.in/wp-content/uploads/2023/06/GIFT-1.jpeg?fit=1024%2C1024&ssl=1', slug: 'gifts' },
];

export default function InStore() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[52vh] min-h-[360px] overflow-hidden bg-charcoal">
        <Image src={STORE_IMAGE} alt="Made in Nagaland Centre storefront" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-charcoal/20" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1400px] mx-auto w-full px-5 md:px-8 pb-10">
            <span className="text-amber-300 uppercase tracking-[0.3em] text-xs font-semibold">Visit Us</span>
            <h1 className="font-heading font-bold text-white text-4xl md:text-5xl mt-2 [text-shadow:0_2px_16px_rgba(0,0,0,0.7)]">
              The Made in Nagaland Store
            </h1>
            <p className="flex items-center gap-2 text-white/85 mt-3 text-sm">
              <MapPin className="w-4 h-4" /> Kohima, Nagaland
            </p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-5 md:px-8 py-14 text-center">
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-terracotta">
          Explore the Selection at the Made In Nagaland Store
        </h2>
        <p className="mt-5 text-charcoal/85 leading-relaxed">
          The Made In Nagaland Store in Kohima presents a diverse selection of items. Certain products
          in the store are unique and may not be accessible for online purchase. To acquire these
          exclusive items, we invite you to visit the Made In Nagaland Store in Kohima.
        </p>
      </section>

      {/* Category grid */}
      <section className="max-w-[1400px] mx-auto px-5 md:px-8 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {STORE_CATEGORIES.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            >
              <Link to={`/products?category=${c.slug}`} className="group block">
                <div className="rounded-lg overflow-hidden aspect-square bg-offwhite">
                  <Image src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h3 className="mt-3 text-center font-heading font-semibold text-lg text-charcoal group-hover:text-terracotta transition-colors">
                  {c.name}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Video */}
      <section className="max-w-3xl mx-auto px-5 md:px-8 pb-20">
        <div className="text-center mb-8">
          <span className="text-amber-clay uppercase tracking-[0.3em] text-xs font-semibold">Watch</span>
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-terracotta mt-2">
            Let us promote &amp; build our economy
          </h2>
        </div>
        <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/jwavQ1O4nkU"
            title="Made in Nagaland | Let us promote & build our economy | YouthNet"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-forest text-parchment">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-16 text-center">
          <h2 className="font-heading font-bold text-2xl md:text-4xl">Shop online, or come see us in Kohima</h2>
          <p className="mt-4 max-w-xl mx-auto text-parchment/80">
            Browse our full online collection or plan a visit to experience the hills first-hand.
          </p>
          <Link to="/products" className="inline-block mt-8 bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm px-8 py-3.5 rounded-full hover:bg-terracotta transition-colors">
            Shop the Collection
          </Link>
        </div>
      </section>
    </div>
  );
}