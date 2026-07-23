import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatINR } from '@/lib/store';
import ProductForm from '@/components/admin/ProductForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package, ShoppingCart, ArrowLeft } from 'lucide-react';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-amber-clay/20 text-amber-clay',
  processing: 'bg-forest/15 text-forest',
  shipped: 'bg-terracotta/15 text-terracotta',
  delivered: 'bg-forest/20 text-forest',
  cancelled: 'bg-destructive/15 text-destructive',
};

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadProducts = () => base44.entities.Product.list('-created_date', 300).then(setProducts);
  const loadOrders = () => base44.entities.Order.list('-created_date', 300).then(setOrders);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        await Promise.all([loadProducts(), loadOrders()]);
      } catch {
        setUser(null);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-border border-t-terracotta rounded-full animate-spin" /></div>;

  const isAdmin = user && (user.role === 'admin' || user.staff_role === 'admin');
  const isStaff = user && (isAdmin || user.staff_role === 'staff');

  if (!isStaff) {
    return (
      <div className="max-w-md mx-auto px-5 py-32 text-center">
        <h1 className="font-heading font-bold text-3xl text-terracotta">Restricted Area</h1>
        <p className="text-muted-foreground mt-2">This dashboard is for store team members only.</p>
        <Link to="/" className="text-amber-clay mt-4 inline-block">← Back to store</Link>
      </div>
    );
  }

  const saveEdit = () => { setShowForm(false); setEditing(null); loadProducts(); };
  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    await base44.entities.Product.delete(id);
    loadProducts();
  };
  const updateStatus = async (id, status) => {
    await base44.entities.Order.update(id, { status });
    loadOrders();
  };

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-10">
      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-terracotta mb-4"><ArrowLeft className="w-4 h-4" /> Back to store</Link>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-4xl text-terracotta">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Signed in as {user.email} · {isAdmin ? 'Admin' : 'Staff'}</p>
        </div>
        {tab === 'products' && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm px-5 py-3 rounded-full hover:bg-terracotta transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-8 border-b border-border">
        <button onClick={() => setTab('products')} className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 -mb-px transition-colors ${tab === 'products' ? 'border-terracotta text-terracotta' : 'border-transparent text-muted-foreground'}`}>
          <Package className="w-4 h-4" /> Products ({products.length})
        </button>
        <button onClick={() => setTab('orders')} className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 -mb-px transition-colors ${tab === 'orders' ? 'border-terracotta text-terracotta' : 'border-transparent text-muted-foreground'}`}>
          <ShoppingCart className="w-4 h-4" /> Orders ({orders.length})
        </button>
      </div>

      {tab === 'products' ? (
        <div className="overflow-x-auto bg-offwhite border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="w-10 h-10 rounded object-cover" />}
                      <span className="font-medium text-charcoal">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{p.category}</td>
                  <td className="p-4">{formatINR(p.sale_price || p.price)}</td>
                  <td className="p-4">{p.in_stock === false ? <span className="text-destructive">Out</span> : <span className="text-forest">In stock</span>}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-2 hover:text-terracotta"><Pencil className="w-4 h-4" /></button>
                      {isAdmin && <button onClick={() => deleteProduct(p.id)} className="p-2 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products yet. Add your first product.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-offwhite border border-border rounded-lg p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-charcoal">{o.order_number}</span>
                    <span className="text-sm text-muted-foreground">{new Date(o.created_date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-sm text-charcoal mt-1">{o.customer_name} · {o.customer_email} · {o.phone}</p>
                  <p className="text-sm text-muted-foreground">{o.address}, {o.city}, {o.state} {o.pincode}</p>
                  <p className="text-sm text-muted-foreground mt-2">{o.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
                </div>
                <div className="text-right">
                  <div className="font-heading font-bold text-terracotta text-lg">{formatINR(o.total)}</div>
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className={`mt-2 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border-0 outline-none ${STATUS_COLORS[o.status] || ''}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="text-center py-16 text-muted-foreground bg-offwhite border border-border rounded-lg">No orders yet.</div>}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-parchment">
          <DialogHeader>
            <DialogTitle className="font-heading text-terracotta text-2xl">{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm product={editing} onSaved={saveEdit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}