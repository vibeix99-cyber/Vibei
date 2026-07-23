import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatINR } from '@/lib/store';
import { Package, ShieldCheck } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-amber-clay/20 text-amber-clay',
  processing: 'bg-forest/15 text-forest',
  shipped: 'bg-terracotta/15 text-terracotta',
  delivered: 'bg-forest/20 text-forest',
  cancelled: 'bg-destructive/15 text-destructive',
};

export default function Account() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const all = await base44.entities.Order.filter({ customer_email: me.email }, '-created_date', 100);
        setOrders(all);
      } catch {
        setUser(null);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-border border-t-terracotta rounded-full animate-spin" /></div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center">
        <h1 className="font-heading font-bold text-3xl text-terracotta">Sign in to view your orders</h1>
        <p className="text-muted-foreground mt-2">Log in to track your orders and manage your profile.</p>
        <button onClick={() => base44.auth.redirectToLogin(window.location.pathname)} className="mt-6 bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm px-8 py-3.5 rounded-full hover:bg-terracotta transition-colors">
          Sign In
        </button>
      </div>
    );
  }

  const isStaff = user.role === 'admin' || user.staff_role === 'admin' || user.staff_role === 'staff';

  return (
    <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-4xl text-terracotta">Hello, {user.full_name?.split(' ')[0] || 'friend'}</h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {isStaff && (
            <Link to="/admin" className="flex items-center gap-2 bg-forest text-parchment font-semibold uppercase tracking-wider text-xs px-5 py-3 rounded-full hover:bg-charcoal transition-colors">
              <ShieldCheck className="w-4 h-4" /> Admin Dashboard
            </Link>
          )}
          <button onClick={() => base44.auth.logout()} className="border border-border font-semibold uppercase tracking-wider text-xs px-5 py-3 rounded-full hover:border-terracotta transition-colors">
            Log Out
          </button>
        </div>
      </div>

      <h2 className="font-heading font-bold text-2xl text-terracotta mb-5">Order History</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-offwhite border border-border rounded-lg">
          <Package className="w-12 h-12 mx-auto text-border" />
          <p className="text-muted-foreground mt-4">You haven't placed any orders yet.</p>
          <Link to="/products" className="text-amber-clay mt-2 inline-block font-medium">Start shopping →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-offwhite border border-border rounded-lg p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-heading font-bold text-charcoal">{o.order_number}</span>
                  <span className="text-sm text-muted-foreground ml-3">{new Date(o.created_date).toLocaleDateString('en-IN')}</span>
                </div>
                <span className={`text-[11px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                {o.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
              </div>
              <div className="mt-2 font-heading font-bold text-terracotta">{formatINR(o.total)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}