import React from 'react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { useCart } from '@/lib/CartContext';
import { formatINR } from '@/lib/store';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-24 text-center">
        <ShoppingBag className="w-14 h-14 mx-auto text-border" aria-hidden="true" />
        <h1 className="display-hero text-3xl text-terracotta mt-6">Your cart is empty</h1>
        <p className="text-muted-foreground mt-2">Discover handcrafted treasures from the Naga hills.</p>
        <Link to="/products" className="inline-block mt-6 bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm px-8 py-3.5 rounded-full hover:bg-terracotta transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 1500 ? 0 : 80;

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-10">
      <h1 className="display-hero text-4xl text-terracotta mb-8">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div key={item.key} className="flex gap-4 bg-offwhite border border-border rounded-lg p-4">
              <div className="w-24 h-24 rounded-md overflow-hidden bg-parchment shrink-0">
                {item.image && <Image src={item.image} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-charcoal leading-snug">{item.name}</h3>
                {item.variant && <p className="text-xs text-muted-foreground mt-0.5">{item.variant}</p>}
                <p className="font-heading font-bold text-terracotta mt-1">{formatINR(item.price)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-border rounded-full">
                    <button type="button" onClick={() => updateQuantity(item.key, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`} className="p-2.5 hover:text-terracotta"><Minus className="w-3.5 h-3.5" aria-hidden="true" /></button>
                    <span className="w-8 text-center text-sm font-medium" aria-live="polite">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.key, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`} className="p-2.5 hover:text-terracotta"><Plus className="w-3.5 h-3.5" aria-hidden="true" /></button>
                  </div>
                  <button type="button" onClick={() => removeItem(item.key)} aria-label={`Remove ${item.name} from cart`} className="text-muted-foreground hover:text-destructive p-2.5">
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-offwhite border border-border rounded-lg p-6 shadow-md lg:sticky lg:top-28">
            <h2 className="display-hero text-xl text-terracotta mb-4">Order Summary</h2>

            {/* Free-shipping progress */}
            <div className="mb-5">
              {shipping === 0 ? (
                <p className="text-xs font-medium text-forest">🎉 You've unlocked free shipping!</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add <span className="font-semibold text-amber-clay">{formatINR(1500 - subtotal)}</span> more for free shipping
                </p>
              )}
              <div className="mt-2 h-1.5 rounded-full bg-border/60 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={1500} aria-valuenow={Math.min(subtotal, 1500)} aria-label="Progress toward free shipping">
                <div className="h-full bg-amber-clay rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (subtotal / 1500) * 100)}%` }} />
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-medium">{shipping === 0 ? 'Free' : formatINR(shipping)}</span></div>
              <div className="thread-line my-3" />
              <div className="flex justify-between text-base"><span className="font-heading font-bold text-charcoal">Total</span><span className="font-heading font-bold text-terracotta">{formatINR(subtotal + shipping)}</span></div>
            </div>
            <Link to="/checkout" className="block text-center mt-5 bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm py-3.5 rounded-full hover:bg-terracotta transition-colors">
              Proceed to Checkout
            </Link>
            <Link to="/products" className="block text-center mt-3 text-sm text-forest hover:text-terracotta">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}