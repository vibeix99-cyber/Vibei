import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProducts } from '@/lib/productsSource';
import { ABOUT_TEXT } from '@/lib/store';
import Hero from '@/components/store/Hero';
import CategoryStrip from '@/components/store/CategoryStrip';
import SectionHeading from '@/components/store/SectionHeading';
import ProductCard from '@/components/store/ProductCard';
import MakersSection from '@/components/store/MakersSection';
import InStoreSection from '@/components/store/InStoreSection';
import { SlideInLeft } from '@/components/store/Reveal';
import { Sparkles, HandHeart, Leaf } from 'lucide-react';

function Row({ eyebrow, title, tagline, products, to }) {
  if (!products.length) return null;
  return (
    <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-12">
      <SlideInLeft>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          tagline={tagline}
          action={
            <Link to={to} className="group text-xs uppercase tracking-widest font-semibold text-forest hover:text-terracotta transition-colors whitespace-nowrap">
              View all <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
          }
        />
      </SlideInLeft>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProducts().then((res) => {
      setProducts(res);
      setLoading(false);
    });
  }, []);

  const byCategory = (cat, n) => products.filter((p) => p.category === cat).slice(0, n);
  const picks100 = products.filter((p) => (p.sale_price ?? p.price) === 100).slice(0, 4);
  const handloom = byCategory('Handloom & Handicrafts', 4);
  const souvenirs = byCategory('Gifts', 4);
  const food = byCategory('Gourmet Food & Staple', 4);
  const featuredGrid = (products.filter((p) => p.featured).length
    ? products.filter((p) => p.featured)
    : products
  ).slice(0, 8);
  const topDeals = products.filter((p) => p.sale_price != null && p.sale_price < p.price);

  const VALUES = [
    { icon: Sparkles, title: 'Authentic & Original', text: 'Sourced directly from Naga makers — every piece is the real thing.' },
    { icon: HandHeart, title: 'Handmade with Care', text: 'Crafted by tribal artisans keeping generations of tradition alive.' },
    { icon: Leaf, title: 'Empowering Local', text: 'Every purchase supports a family, a maker and a community.' },
  ];

  return (
    <div>
      {/* 1 — Hero */}
      <Hero />

      {/* 2 — Category navigation */}
      <CategoryStrip />

      {loading ? (
        <div className="flex justify-center py-24" role="status" aria-live="polite">
          <div className="w-8 h-8 border-4 border-border border-t-terracotta rounded-full animate-spin" />
          <span className="sr-only">Loading products…</span>
        </div>
      ) : (
        <>
          {/* 3 — Pocket-friendly ₹100 picks */}
          <Row eyebrow="Pocket-Friendly Picks" title="Nagaland Souvenirs for ₹100" tagline="Little treasures from the hills — every one of these at just ₹100." products={picks100} to="/products" />
          <div className="max-w-[1400px] mx-auto px-8"><div className="thread-line" /></div>

          {/* 4 — Handmade creations (Handloom) */}
          <Row eyebrow="From the Heart of Nagaland" title="Celebrating Nagaland's Handmade Creations" tagline="Shawls, mufflers and bags handwoven by artisans across the 16 Naga tribes." products={handloom} to="/products?category=handloom" />
          <div className="max-w-[1400px] mx-auto px-8"><div className="thread-line" /></div>

          {/* 5 — Souvenirs (Gifts) */}
          <Row eyebrow="Take a Piece of Nagaland Home" title="Bring Home Exquisite Souvenirs" tagline="Keepsakes, magnets and art to remember the hills by." products={souvenirs} to="/products?category=gifts" />
          <div className="max-w-[1400px] mx-auto px-8"><div className="thread-line" /></div>

          {/* 6 — Top featured (Gourmet Food) */}
          <Row eyebrow="Taste the Hills" title="Our Top Featured Products" tagline="Pickles, teas, coffee and staples straight from Naga kitchens." products={food} to="/products?category=gourmet-food" />

          {/* 7 — Large featured grid */}
          {featuredGrid.length > 0 && (
            <section className="bg-offwhite/60 border-y border-border/60 mt-8">
              <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-14">
                <SlideInLeft>
                  <SectionHeading
                    eyebrow="Curated Favourites"
                    title="Featured Products"
                    tagline="A handpicked selection from across the store."
                    action={
                      <Link to="/products" className="group text-xs uppercase tracking-widest font-semibold text-forest hover:text-terracotta transition-colors whitespace-nowrap">
                        Shop all <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                      </Link>
                    }
                  />
                </SlideInLeft>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
                  {featuredGrid.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 8 — Top Deals (sale items) */}
          {topDeals.length > 0 && (
            <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-14">
              <SlideInLeft>
                <SectionHeading
                  eyebrow="Limited-Time Offers"
                  title="Top Deals!"
                  tagline="Handwoven shawls and neckties, now at special prices."
                  action={
                    <Link to="/products?sort=price-low" className="group text-xs uppercase tracking-widest font-semibold text-forest hover:text-terracotta transition-colors whitespace-nowrap">
                      View all <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  }
                />
              </SlideInLeft>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
                {topDeals.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 9 — In-store */}
      <InStoreSection />

      {/* 10 — Trust / customer love band (original: Google Reviews) */}
      <section className="bg-parchment border-y border-border/60">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-16 text-center">
          <span className="eyebrow text-amber-clay justify-center">
            <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
            Loved Across the Hills &amp; Beyond
            <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
          </span>
          <h2 className="display-hero text-3xl md:text-4xl text-terracotta mt-4">Why Shoppers Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-offwhite border border-border rounded-lg p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <span className="w-11 h-11 rounded-full bg-amber-clay/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-terracotta" aria-hidden="true" />
                </span>
                <h3 className="font-heading font-semibold text-lg text-charcoal mt-4">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11 — About Us */}
      <section className="max-w-[860px] mx-auto px-5 md:px-8 py-16 text-center">
        <span className="eyebrow text-amber-clay justify-center">
          <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
          About Us
          <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
        </span>
        <h2 className="display-hero text-3xl md:text-4xl text-terracotta mt-4">Made in Nagaland</h2>
        <p className="mt-5 text-charcoal/85 leading-relaxed">{ABOUT_TEXT}</p>
        <Link to="/about" className="group inline-flex items-center gap-2 mt-7 text-sm font-semibold uppercase tracking-wider text-forest hover:text-terracotta transition-colors">
          Read our story <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </section>

      {/* 12 — Makers + closing story band */}
      <MakersSection />

      <section className="bg-forest text-parchment mt-16">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-20 text-center">
          <span className="eyebrow text-amber-clay justify-center">
            <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
            Every Piece a Celebration
            <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
          </span>
          <h2 className="display-hero text-3xl md:text-5xl mt-4 max-w-3xl mx-auto">
            Woven, grown and crafted by the hands of the Naga hills
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-parchment/80">
            Behind every product is an artisan, a family and a tribe keeping generations of tradition alive. When you shop, you carry their story home.
          </p>
          <Link to="/products" className="inline-block mt-8 bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm px-8 py-3.5 rounded-full transition-all hover:bg-terracotta hover:-translate-y-0.5">
            Shop the Collection
          </Link>
        </div>
      </section>
    </div>
  );
}
