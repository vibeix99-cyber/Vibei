import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { CATEGORIES, CONTACT } from '@/lib/store';
import Logo from './Logo';

const HELP_LINKS = [
  { to: '/products', label: 'All Products' },
  { to: '/cart', label: 'Your Cart' },
  { to: '/account', label: 'Order History' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/return-refund-policy', label: 'Return, Refund & Cancellation Policy' },
  { to: '/terms-of-use', label: 'Terms of Use' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
];

const linkClass =
  'inline-block text-parchment/70 hover:text-amber-clay hover:translate-x-0.5 transition-all duration-200';
const headingClass =
  'text-parchment font-heading text-sm uppercase tracking-widest mb-4 inline-flex items-center gap-2 after:h-px after:w-6 after:bg-amber-clay/60 after:content-[""]';

export default function Footer() {
  return (
    <footer className="mt-24 bg-charcoal text-parchment/80 border-t-2 border-amber-clay/40">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand + About + Contact */}
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-parchment/60 max-w-sm">
            Made in Nagaland is a centralized platform promoting local entrepreneurs and their products from Nagaland —
            authentic handicrafts, textiles, fashion, food and more from the heart of the hills.
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-clay mt-0.5 shrink-0" aria-hidden="true" />
              <span className="text-parchment/70">{CONTACT.address}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-amber-clay shrink-0" aria-hidden="true" />
              <a href={CONTACT.phoneHref} className="text-parchment/70 hover:text-amber-clay transition-colors">{CONTACT.phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-amber-clay shrink-0" aria-hidden="true" />
              <a href={`mailto:${CONTACT.email}`} className="text-parchment/70 hover:text-amber-clay transition-colors break-all">{CONTACT.email}</a>
            </li>
          </ul>
        </div>

        {/* Shop */}
        <div>
          <h4 className={headingClass}>Shop</h4>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/products?category=${c.slug}`} className={linkClass}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help / Legal */}
        <div>
          <h4 className={headingClass}>Help</h4>
          <ul className="space-y-2 text-sm">
            {HELP_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkClass}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div>
          <h4 className={headingClass}>Connect</h4>
          <div className="flex gap-3">
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram (opens in a new tab)"
              className="w-10 h-10 rounded-full border border-parchment/25 flex items-center justify-center text-parchment hover:bg-amber-clay hover:border-amber-clay hover:text-white hover:-translate-y-0.5 transition-all duration-200"
            >
              <Instagram className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href={CONTACT.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook (opens in a new tab)"
              className="w-10 h-10 rounded-full border border-parchment/25 flex items-center justify-center text-parchment hover:bg-amber-clay hover:border-amber-clay hover:text-white hover:-translate-y-0.5 transition-all duration-200"
            >
              <Facebook className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              aria-label="Email us"
              className="w-10 h-10 rounded-full border border-parchment/25 flex items-center justify-center text-parchment hover:bg-amber-clay hover:border-amber-clay hover:text-white hover:-translate-y-0.5 transition-all duration-200"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
          <a
            href={CONTACT.phoneHref}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-clay/15 border border-amber-clay/30 px-4 py-2 text-sm text-parchment hover:bg-amber-clay hover:text-white transition-colors"
          >
            <Phone className="w-4 h-4" aria-hidden="true" /> Call us
          </a>
        </div>
      </div>

      <div className="border-t border-parchment/10">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-5 text-xs text-parchment/50 flex flex-col md:flex-row justify-between gap-2 text-center md:text-left">
          <span>© {new Date().getFullYear()} Made in Nagaland. Every piece a celebration.</span>
          <span>Handcrafted in the Naga hills · Prices in ₹ INR</span>
        </div>
      </div>
    </footer>
  );
}
