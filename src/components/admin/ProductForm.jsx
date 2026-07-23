import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CATEGORIES } from '@/lib/store';
import { UploadCloud, X } from 'lucide-react';

export default function ProductForm({ product, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || CATEGORIES[0].name,
    origin: product?.origin || '',
    price: product?.price || '',
    sale_price: product?.sale_price || '',
    description: product?.description || '',
    makers_story: product?.makers_story || '',
    images: product?.images || [],
    in_stock: product?.in_stock !== false,
    featured: product?.featured || false,
    organic: product?.organic || false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('images', [...form.images, file_url]);
    setUploading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : undefined,
    };
    if (product?.id) await base44.entities.Product.update(product.id, payload);
    else await base44.entities.Product.create(payload);
    setSaving(false);
    onSaved();
  };

  const input = 'w-full bg-white border border-border rounded-md px-3 py-2 outline-none focus:border-amber-clay';

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Product Name</label>
        <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={input} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)} className={input}>
            {CATEGORIES.map((c) => <option key={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Origin / District</label>
          <input value={form.origin} onChange={(e) => set('origin', e.target.value)} className={input} placeholder="e.g. Mokokchung" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Price (₹)</label>
          <input required type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} className={input} />
        </div>
        <div>
          <label className="text-sm font-medium">Sale Price (₹, optional)</label>
          <input type="number" step="0.01" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} className={input} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={input} />
      </div>
      <div>
        <label className="text-sm font-medium">The Maker's Story</label>
        <textarea value={form.makers_story} onChange={(e) => set('makers_story', e.target.value)} rows={2} className={input} />
      </div>
      <div>
        <label className="text-sm font-medium">Images</label>
        <div className="flex flex-wrap gap-3 mt-2">
          {form.images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => set('images', form.images.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-charcoal/70 text-white rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-amber-clay">
            {uploading ? <div className="w-4 h-4 border-2 border-border border-t-terracotta rounded-full animate-spin" /> : <UploadCloud className="w-5 h-5 text-muted-foreground" />}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.in_stock} onChange={(e) => set('in_stock', e.target.checked)} /> In stock</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.organic} onChange={(e) => set('organic', e.target.checked)} /> Organic</label>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="bg-terracotta text-parchment font-semibold uppercase tracking-wider text-sm px-6 py-2.5 rounded-full hover:bg-charcoal transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Product'}
        </button>
        <button type="button" onClick={onCancel} className="border border-border font-semibold uppercase tracking-wider text-sm px-6 py-2.5 rounded-full hover:border-terracotta transition-colors">Cancel</button>
      </div>
    </form>
  );
}