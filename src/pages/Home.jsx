import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProducts } from '@/lib/productsSource';
import { ABOUT_TEXT } from '@/lib/store';
import { HOME_SECTIONS } from '@/data/homeSections';
import Hero from '@/components/store/Hero';
import SectionHeading from '@/components/store/SectionHeading';
import ProductCard from '@/components/store/ProductCard';
import { SlideInLeft } from '@/components/store/Reveal';

function ProductSection({ section, byId, divider }) {
  const products = section.ids.map((id) => byId[id]).filter(Boolean);
  if (!products.length) return null;
  return (
    <>
      <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-12">
        <SlideInLeft>
          <SectionHeading eyebrow={section.eyebrow} title={section.title} tagline={section.tagline} />
        </SlideInLeft>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
          {products.map((p, i) => (
            <ProductCard key={`${p.id}-${i}`} product={p} index={i} />
          ))}
        </div>
      </section>
      {divider && (
        <div className="max-w-[1400px] mx-auto px-8"><div className="thread-line" /></div>
      )}
    </>
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

  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  return (
    <div>
      {/* Hero */}
      <Hero />

      {loading ? (
        <div className="flex justify-center py-24" role="status" aria-live="polite">
          <div className="w-8 h-8 border-4 border-border border-t-terracotta rounded-full animate-spin" />
          <span className="sr-only">Loading products…</span>
        </div>
      ) : (
        // Product sections — exact order, titles and products from the original homepage.
        HOME_SECTIONS.map((section, i) => (
          <ProductSection
            key={section.title}
            section={section}
            byId={byId}
            divider={i < HOME_SECTIONS.length - 1}
          />
        ))
      )}

      {/* About Us (present on the original homepage) */}
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
    </div>
  );
}
