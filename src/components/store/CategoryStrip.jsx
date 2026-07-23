import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '@/lib/store';

export default function CategoryStrip() {
  return (
    <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-16">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-lg overflow-hidden">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            to={`/products?category=${c.slug}`}
            className="group bg-offwhite hover:bg-parchment transition-colors p-6 md:p-8"
          >
            <h3 className="font-heading font-bold text-lg md:text-xl text-terracotta group-hover:translate-x-1 transition-transform">
              {c.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.blurb}</p>
            <span className="inline-block mt-3 text-[11px] uppercase tracking-widest text-amber-clay font-semibold">
              Browse →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}