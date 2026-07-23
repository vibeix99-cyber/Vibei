import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listProducts } from '@/lib/productsSource';
import ProductCard from '@/components/store/ProductCard';
import { CATEGORIES, categoryBySlug } from '@/lib/store';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(params.get('sort') || 'featured');

  const categorySlug = params.get('category') || '';
  const query = params.get('q') || '';
  const [search, setSearch] = useState(query);
  const activeCategory = categoryBySlug(categorySlug);

  useEffect(() => {
    listProducts().then((res) => {
      setProducts(res);
      setLoading(false);
    });
  }, []);

  useEffect(() => setSearch(query), [query]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory) list = list.filter((p) => p.category === activeCategory.name);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.origin?.toLowerCase().includes(q)
      );
    }
    if (sort === 'price-low') list.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    else if (sort === 'price-high') list.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    else if (sort === 'featured') list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [products, activeCategory, query, sort]);

  const setCategory = (slug) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search) next.set('q', search);
    else next.delete('q');
    setParams(next);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-10">
      <div className="mb-8">
        <span className="eyebrow text-amber-clay">
          <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
          The Artisan's Gallery
        </span>
        <h1 className="display-hero text-4xl md:text-5xl text-terracotta mt-2">
          {activeCategory ? activeCategory.name : query ? `Search: "${query}"` : 'All Products'}
        </h1>
        {activeCategory && <p className="text-muted-foreground mt-2 max-w-xl">{activeCategory.blurb}</p>}
      </div>

      {/* Category pills + search + sort */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2 flex-1" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setCategory('')}
            aria-pressed={!categorySlug}
            className={`px-4 py-2 rounded-full text-[12px] uppercase tracking-wide font-medium border transition-colors ${
              !categorySlug ? 'bg-terracotta text-parchment border-terracotta' : 'border-border text-muted-foreground hover:border-terracotta hover:text-terracotta'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              aria-pressed={categorySlug === c.slug}
              title={c.name}
              className={`px-4 py-2 rounded-full text-[12px] uppercase tracking-wide font-medium border transition-colors ${
                categorySlug === c.slug ? 'bg-terracotta text-parchment border-terracotta' : 'border-border text-muted-foreground hover:border-terracotta hover:text-terracotta'
              }`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={submitSearch} className="flex items-center bg-offwhite border border-border rounded-full px-3 py-2 focus-within:border-terracotta transition-colors">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <label htmlFor="product-search" className="sr-only">Search products</label>
            <input
              id="product-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="bg-transparent outline-none text-sm px-2 w-36"
            />
            <button type="submit" className="sr-only">Search</button>
          </form>
          <div className="flex items-center gap-1.5 text-sm">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="product-sort" className="sr-only">Sort products</label>
            <select
              id="product-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-offwhite border border-border rounded-full px-3 py-2 outline-none text-sm focus:border-terracotta cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-sm text-muted-foreground mb-6" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
          {activeCategory ? ` in ${activeCategory.name}` : ''}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-24" role="status" aria-live="polite">
          <div className="w-8 h-8 border-4 border-border border-t-terracotta rounded-full animate-spin" />
          <span className="sr-only">Loading products…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="font-heading text-2xl text-terracotta">No products found</p>
          <p className="mt-2">Try a different category or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}