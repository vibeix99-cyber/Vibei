import { base44 } from '@/api/base44Client';
import { PRODUCTS } from '@/data/products';

// The app ships a local catalog (mirrored from madeinnagalandcenter.in) so the
// storefront always has content. If a Base44 backend is connected and returns
// products, that live data takes precedence; otherwise we fall back to the
// local catalog. A short timeout keeps the UI snappy when no backend responds.
const withTimeout = (promise, ms = 3000) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

export async function listProducts() {
  try {
    const res = await withTimeout(base44.entities.Product.list('-created_date', 300));
    if (Array.isArray(res) && res.length > 0) return res;
  } catch {
    /* fall through to local catalog */
  }
  return PRODUCTS;
}

export async function getProductById(id) {
  try {
    const p = await withTimeout(base44.entities.Product.get(id));
    if (p && p.id) return p;
  } catch {
    /* fall through to local catalog */
  }
  return PRODUCTS.find((p) => p.id === id) || null;
}

export async function listByCategory(category, limit) {
  const all = await listProducts();
  const filtered = all.filter((p) => p.category === category);
  return typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
}
