import React from 'react';
import { Link } from 'react-router-dom';
import { ABOUT_TEXT, CATEGORIES } from '@/lib/store';
import { ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <div>
      {/* Intro */}
      <section className="max-w-[860px] mx-auto px-5 md:px-8 py-16 text-center">
        <span className="eyebrow text-amber-clay justify-center">
          <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
          About Us
          <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
        </span>
        <h1 className="display-hero text-4xl md:text-5xl text-terracotta mt-4">Made in Nagaland</h1>
        <p className="mt-6 text-lg text-charcoal/85 leading-relaxed">{ABOUT_TEXT}</p>
        <Link
          to="/products"
          className="group inline-flex items-center gap-2 mt-8 rounded-full bg-amber-clay px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-terracotta hover:-translate-y-0.5"
        >
          Explore the Collection
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      <div className="max-w-[1400px] mx-auto px-8"><div className="thread-line" /></div>

      {/* Categories */}
      <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-16">
        <h2 className="display-hero text-2xl md:text-3xl text-terracotta text-center mb-8">What You'll Find</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/products?category=${c.slug}`}
              className="group bg-offwhite border border-border rounded-lg p-6 transition-all hover:border-terracotta hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-heading font-semibold text-lg text-charcoal group-hover:text-terracotta transition-colors">{c.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Story band (reuses the home closing band styling) */}
      <section className="bg-forest text-parchment">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-20 text-center">
          <span className="eyebrow text-amber-clay justify-center">
            <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
            Empowering Local Makers
          </span>
          <h2 className="display-hero text-3xl md:text-4xl mt-4 max-w-2xl mx-auto">
            Every purchase supports an artisan and keeps Naga heritage alive
          </h2>
          <Link
            to="/in-store"
            className="inline-block mt-8 bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm px-8 py-3.5 rounded-full transition-all hover:bg-terracotta hover:-translate-y-0.5"
          >
            Visit Our Store
          </Link>
        </div>
      </section>
    </div>
  );
}
