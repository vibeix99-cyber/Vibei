import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/CartContext';
import { formatINR } from '@/lib/store';
import Logo from '@/components/store/Logo';
import { Lock } from 'lucide-react';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', phone: '', address: '', city: '', state: '', pincode: '',
  });

  const shipping = subtotal >= 1500 ? 0 : 80;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-5 py-32 text-center">
        <p className="font-heading text-2xl text-terracotta">Your cart is empty</p>
        <Link to="/products" className="text-amber-clay mt-3 inline-block">← Browse products</Link>
      </div>
    );
  }

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const placeOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const order_number = 'MIN' + Date.now().toString().slice(-8);
    const order = await base44.entities.Order.create({
      order_number,
      items: items.map((i) => ({ product_id: i.product_id, name: i.name, image: i.image, price: i.price, quantity: i.quantity, variant: i.variant })),
      subtotal,
      shipping_fee: shipping,
      total,
      ...form,
      status: 'pending',
    });
    clearCart();
    navigate(`/order-confirmation?id=${order.id}`);
  };

  const inputClass = 'mt-1 w-full bg-white border border-border rounded-md px-4 py-3 outline-none focus:border-amber-clay focus:ring-2 focus:ring-amber-clay/30 transition';
  const labelClass = 'text-sm font-medium text-charcoal';

  return (
    <div className="min-h-screen bg-offwhite">
      <div className="border-b border-border">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Logo />
          <span className="flex items-center gap-1.5 text-sm text-forest font-medium"><Lock className="w-4 h-4" /> Secure Checkout</span>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <form onSubmit={placeOrder} className="lg:col-span-7 space-y-5">
          <h1 className="display-hero text-2xl md:text-3xl text-terracotta">Shipping Details</h1>
          <div>
            <label htmlFor="customer_name" className={labelClass}>Full Name</label>
            <input id="customer_name" name="name" autoComplete="name" required value={form.customer_name} onChange={update('customer_name')} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer_email" className={labelClass}>Email</label>
              <input id="customer_email" name="email" autoComplete="email" required type="email" value={form.customer_email} onChange={update('customer_email')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input id="phone" name="tel" type="tel" autoComplete="tel" inputMode="tel" required value={form.phone} onChange={update('phone')} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>Address</label>
            <input id="address" name="address" autoComplete="street-address" required value={form.address} onChange={update('address')} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className={labelClass}>City</label>
              <input id="city" name="city" autoComplete="address-level2" required value={form.city} onChange={update('city')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="state" className={labelClass}>State</label>
              <input id="state" name="state" autoComplete="address-level1" required value={form.state} onChange={update('state')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="pincode" className={labelClass}>Pincode</label>
              <input id="pincode" name="postal-code" autoComplete="postal-code" inputMode="numeric" required value={form.pincode} onChange={update('pincode')} className={inputClass} />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-terracotta text-parchment font-semibold uppercase tracking-wider py-4 rounded-full shadow-md hover:bg-charcoal transition-colors disabled:opacity-50">
            {submitting ? 'Placing order…' : `Place Order · ${formatINR(total)}`}
          </button>
          <p className="text-xs text-muted-foreground text-center">Cash on delivery & bank transfer available. We'll confirm your order by email.</p>
        </form>

        <div className="lg:col-span-5">
          <div className="bg-white border border-border rounded-lg p-6 shadow-md lg:sticky lg:top-8">
            <h2 className="display-hero text-lg text-terracotta mb-4">Your Order</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {items.map((i) => (
                <div key={i.key} className="flex justify-between text-sm">
                  <span className="text-charcoal">{i.name} {i.variant && <span className="text-muted-foreground">({i.variant})</span>} × {i.quantity}</span>
                  <span className="font-medium whitespace-nowrap ml-2">{formatINR(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="thread-line my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? 'Free' : formatINR(shipping)}</span></div>
              <div className="flex justify-between text-base pt-2"><span className="font-heading font-bold">Total</span><span className="font-heading font-bold text-terracotta">{formatINR(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}