import React from 'react';
import { MapPin, Mail, Phone, Clock, Share2, Instagram, Facebook } from 'lucide-react';
import { CONTACT } from '@/lib/store';

export default function Contact() {
  return (
    <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-14">
      <div className="text-center mb-12">
        <span className="text-amber-clay uppercase tracking-[0.3em] text-xs font-semibold">Get in Touch</span>
        <h1 className="font-heading font-bold text-3xl md:text-5xl text-terracotta mt-2">Contact Us</h1>
        <p className="mt-4 text-charcoal/80 max-w-xl mx-auto">
          Have a question about a product, an order, or a visit to our store in Kohima? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-offwhite border border-border rounded-lg p-7 space-y-6">
          <div className="flex items-start gap-4">
            <MapPin className="w-5 h-5 text-terracotta mt-0.5 shrink-0" />
            <div>
              <h3 className="font-heading font-semibold text-charcoal">Visit the Store</h3>
              <p className="text-sm text-charcoal/80 mt-1">{CONTACT.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="w-5 h-5 text-terracotta mt-0.5 shrink-0" />
            <div>
              <h3 className="font-heading font-semibold text-charcoal">Phone</h3>
              <a href={CONTACT.phoneHref} className="text-sm text-amber-clay hover:text-terracotta transition-colors">
                {CONTACT.phone}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Mail className="w-5 h-5 text-terracotta mt-0.5 shrink-0" />
            <div>
              <h3 className="font-heading font-semibold text-charcoal">Email</h3>
              <a href={`mailto:${CONTACT.email}`} className="text-sm text-amber-clay hover:text-terracotta transition-colors">
                {CONTACT.email}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock className="w-5 h-5 text-terracotta mt-0.5 shrink-0" />
            <div>
              <h3 className="font-heading font-semibold text-charcoal">Store Hours</h3>
              <p className="text-sm text-charcoal/80 mt-1">Monday – Saturday · 9:00 AM – 6:00 PM</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Share2 className="w-5 h-5 text-terracotta mt-0.5 shrink-0" />
            <div>
              <h3 className="font-heading font-semibold text-charcoal">Follow Us</h3>
              <div className="flex gap-3 mt-2">
                <a href={CONTACT.instagram} target="_blank" rel="noreferrer" aria-label="Instagram (opens in a new tab)" className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-amber-clay hover:text-white hover:border-amber-clay hover:-translate-y-0.5 transition-all">
                  <Instagram className="w-4 h-4" aria-hidden="true" />
                </a>
                <a href={CONTACT.facebook} target="_blank" rel="noreferrer" aria-label="Facebook (opens in a new tab)" className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-amber-clay hover:text-white hover:border-amber-clay hover:-translate-y-0.5 transition-all">
                  <Facebook className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden border border-border min-h-[320px]">
          <iframe
            title="Made in Nagaland Centre location"
            className="w-full h-full min-h-[320px]"
            src="https://www.google.com/maps?q=Made+in+Nagaland+Centre+Kohima&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}