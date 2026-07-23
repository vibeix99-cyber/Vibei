import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { CATEGORIES, CATEGORY_TAGS, tagHref } from '@/lib/store';
import { useCart } from '@/lib/CartContext';
import Logo from './Logo';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/in-store', label: 'In-Store' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/delivery', label: 'Delivery' },
];

export default function Header() {
  const { count } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [q, setQ] = useState('');
  const [bump, setBump] = useState(0);
  const shopRef = useRef(null);
  const prevCount = useRef(count);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bounce the cart icon whenever the item count increases.
  useEffect(() => {
    if (count > prevCount.current) setBump((b) => b + 1);
    prevCount.current = count;
  }, [count]);

  // Close the mega-menu on outside click / Escape
  useEffect(() => {
    const onDown = (e) => { if (shopRef.current && !shopRef.current.contains(e.target)) setShopOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setShopOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onEsc); };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/products?q=${encodeURIComponent(q)}`);
    setMobileOpen(false);
  };

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const linkClass = (active) =>
    `relative text-[13px] font-medium uppercase tracking-wider transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:bg-terracotta after:transition-all ${
      active ? 'text-terracotta after:w-full' : 'text-charcoal hover:text-terracotta after:w-0 hover:after:w-full'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-parchment/95 backdrop-blur-md shadow-md' : 'bg-parchment'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-[68px]">
          <Logo />

          <nav className="hidden lg:flex items-center gap-7" aria-label="Primary">
            <Link to="/" aria-current={isActive('/') ? 'page' : undefined} className={linkClass(isActive('/'))}>Home</Link>

            {/* Shop mega-menu */}
            <div
              ref={shopRef}
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <button
                type="button"
                onClick={() => setShopOpen((o) => !o)}
                aria-expanded={shopOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 ${linkClass(isActive('/products'))}`}
              >
                Shop
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${shopOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {shopOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 z-50">
                  <div className="w-[760px] max-w-[90vw] bg-offwhite border border-border rounded-xl shadow-lg p-6 grid grid-cols-3 gap-x-6 gap-y-5">
                    {CATEGORIES.map((c) => (
                      <div key={c.slug}>
                        <Link
                          to={`/products?category=${c.slug}`}
                          onClick={() => setShopOpen(false)}
                          className="block font-heading font-semibold text-sm text-terracotta hover:text-amber-clay transition-colors"
                        >
                          {c.name}
                        </Link>
                        <ul className="mt-2 space-y-1.5">
                          {CATEGORY_TAGS[c.slug]?.map((tag) => (
                            <li key={tag}>
                              <Link
                                to={tagHref(tag)}
                                onClick={() => setShopOpen(false)}
                                className="text-[13px] text-muted-foreground hover:text-terracotta transition-colors"
                              >
                                {tag}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className="col-span-3 border-t border-border pt-4">
                      <Link
                        to="/products"
                        onClick={() => setShopOpen(false)}
                        className="group inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-forest hover:text-terracotta transition-colors"
                      >
                        View all products
                        <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {NAV_LINKS.filter((l) => l.to !== '/').map((l) => (
              <Link key={l.to} to={l.to} aria-current={isActive(l.to) ? 'page' : undefined} className={linkClass(isActive(l.to))}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <form
              onSubmit={submitSearch}
              role="search"
              className="hidden md:flex items-center bg-offwhite border border-border rounded-full px-3 py-2 mr-2 focus-within:border-terracotta transition-colors"
            >
              <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <label htmlFor="header-search" className="sr-only">Search products</label>
              <input
                id="header-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the hills…"
                className="bg-transparent outline-none text-sm px-2 w-36"
              />
            </form>
            <Link
              to="/cart"
              aria-label={`Cart${count > 0 ? `, ${count} item${count === 1 ? '' : 's'}` : ', empty'}`}
              className="relative p-2 text-charcoal hover:text-terracotta transition-colors"
            >
              <motion.span
                key={bump}
                animate={bump ? { rotate: [0, -12, 10, -6, 0], scale: [1, 1.18, 1] } : {}}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="block"
              >
                <ShoppingBag className="w-[22px] h-[22px]" aria-hidden="true" />
              </motion.span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.3, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 16 }}
                    className="absolute -top-0.5 -right-0.5 bg-terracotta text-parchment text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button
              type="button"
              className="lg:hidden p-2 text-charcoal"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      <div className="thread-line" />

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="lg:hidden bg-parchment border-t border-border px-5 py-4 max-h-[80vh] overflow-y-auto">
          <form onSubmit={submitSearch} role="search" className="flex items-center bg-offwhite border border-border rounded-full px-3 py-2 mb-3 focus-within:border-terracotta transition-colors">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <label htmlFor="mobile-search" className="sr-only">Search products</label>
            <input
              id="mobile-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the hills…"
              className="bg-transparent outline-none text-sm px-2 flex-1"
            />
          </form>

          <Link to="/" onClick={() => setMobileOpen(false)} aria-current={isActive('/') ? 'page' : undefined} className={`block py-2.5 font-medium uppercase text-sm tracking-wide border-b border-border/60 ${isActive('/') ? 'text-terracotta' : 'text-charcoal'}`}>Home</Link>
          <Link to="/products" onClick={() => setMobileOpen(false)} className="block py-2.5 font-medium uppercase text-sm tracking-wide border-b border-border/60 text-charcoal">All Products</Link>

          {/* Categories + tags */}
          <div className="py-3 space-y-4">
            <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Shop by Category</span>
            {CATEGORIES.map((c) => (
              <div key={c.slug}>
                <Link
                  to={`/products?category=${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block font-heading font-semibold text-sm text-terracotta"
                >
                  {c.name}
                </Link>
                {CATEGORY_TAGS[c.slug]?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {CATEGORY_TAGS[c.slug].map((tag) => (
                      <Link
                        key={tag}
                        to={tagHref(tag)}
                        onClick={() => setMobileOpen(false)}
                        className="text-[12px] text-muted-foreground bg-offwhite border border-border rounded-full px-2.5 py-1 hover:text-terracotta hover:border-terracotta transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {NAV_LINKS.filter((l) => l.to !== '/').map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive(l.to) ? 'page' : undefined}
              className={`block py-2.5 font-medium uppercase text-sm tracking-wide border-b border-border/60 ${isActive(l.to) ? 'text-terracotta' : 'text-charcoal'}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
