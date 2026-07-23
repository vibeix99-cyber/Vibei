import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatINR } from '@/lib/store';
import { CheckCircle2 } from 'lucide-react';

export default function OrderConfirmation() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const id = new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    base44.entities.Order.get(id).then((o) => { setOrder(o); setLoading(false); });
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-border border-t-terracotta rounded-full animate-spin" /></div>;
  }
  if (!order) {
    return (
      <div className="text-center py-32">
        <p className="font-heading text-2xl text-terracotta">Order not found</p>
        <Link to="/" className="text-amber-clay mt-3 inline-block">← Back home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-16 text-center">
      <CheckCircle2 className="w-16 h-16 mx-auto text-forest" />
      <h1 className="font-heading font-bold text-3xl md:text-4xl text-terracotta mt-6">Thank you, {order.customer_name?.split(' ')[0]}!</h1>
      <p className="text-muted-foreground mt-3">Your order has been placed. A piece of Nagaland is on its way to you.</p>
      <p className="mt-2 text-sm">Order number: <span className="font-heading font-bold text-charcoal">{order.order_number}</span></p>

      <div className="bg-offwhite border border-border rounded-lg p-6 mt-8 text-left">
        <h2 className="font-heading font-bold text-lg text-terracotta mb-4">Order Summary</h2>
        <div className="space-y-3">
          {order.items?.map((i, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{i.name} {i.variant && <span className="text-muted-foreground">({i.variant})</span>} × {i.quantity}</span>
              <span className="font-medium">{formatINR(i.price * i.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="thread-line my-4" />
        <div className="flex justify-between font-heading font-bold text-terracotta">
          <span>Total</span><span>{formatINR(order.total)}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-4">Shipping to: {order.address}, {order.city}, {order.state} {order.pincode}</p>
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <Link to="/products" className="bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm px-8 py-3.5 rounded-full hover:bg-terracotta transition-colors">Continue Shopping</Link>
        <Link to="/account" className="border border-border font-semibold uppercase tracking-wider text-sm px-8 py-3.5 rounded-full hover:border-terracotta transition-colors">My Orders</Link>
      </div>
    </div>
  );
}