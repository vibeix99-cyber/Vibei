import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, listByCategory } from '@/lib/productsSource';
import { formatINR, slugForCategory } from '@/lib/store';
import ProductCard from '@/components/store/ProductCard';
import ProductReviews from '@/components/store/ProductReviews';
import ProductGallery from '@/components/store/ProductGallery';
import VariantPills from '@/components/store/VariantPills';
import QuantityStepper from '@/components/store/QuantityStepper';
import AddToCartButton from '@/components/store/AddToCartButton';
import { ChevronLeft, Leaf, Check, Truck } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setLoading(true);
    getProductById(id).then((p) => {
      setProduct(p);
      setSelected({});
      setQty(1);
      setLoading(false);
      if (p) {
        listByCategory(p.category).then((r) =>
          setRelated(r.filter((x) => x.id !== p.id).slice(0, 4))
        );
      }
    });
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-4 border-border border-t-terracotta rounded-full animate-spin" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="text-center py-32">
        <p className="font-heading text-2xl text-terracotta">Product not found</p>
        <Link to="/products" className="text-amber-clay mt-3 inline-block">← Back to products</Link>
      </div>
    );
  }

  const onSale = product.sale_price != null && product.sale_price < product.price;
  const finalPrice = onSale ? product.sale_price : product.price;
  const discountPct = onSale ? Math.round((1 - product.sale_price / product.price) * 100) : 0;
  const hasRange = !onSale && product.price_max != null && product.price_max > product.price;
  const variantString = Object.values(selected).join(' / ');
  const missingVariant = (product.variants || []).some((v) => !selected[v.label]);
  const priceLabel = hasRange
    ? `${formatINR(product.price)} – ${formatINR(product.price_max)}`
    : formatINR(finalPrice);

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-8 pb-28 lg:pb-8">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-terracotta mb-6">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} alt={product.name} />
        </div>

        {/* Sticky narrative */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Link to={`/products?category=${slugForCategory(product.category)}`} className="eyebrow text-amber-clay hover:text-terracotta transition-colors">
              <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
              {product.origin ? `${product.origin} · ` : ''}{product.category}
            </Link>
            <h1 className="display-hero text-3xl md:text-[2.75rem] text-terracotta mt-3 leading-[1.05]">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="font-heading font-bold text-2xl text-charcoal">{priceLabel}</span>
              {onSale && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatINR(product.price)}</span>
                  <span className="bg-terracotta text-parchment text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">
                    Save {discountPct}%
                  </span>
                </>
              )}
              {product.organic && (
                <span className="flex items-center gap-1 text-forest text-xs font-semibold uppercase tracking-wide">
                  <Leaf className="w-3.5 h-3.5" aria-hidden="true" /> Organic
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              {product.in_stock === false ? (
                <span className="text-destructive font-medium">Out of stock</span>
              ) : (
                <span className="flex items-center gap-1.5 text-forest font-medium"><Check className="w-4 h-4" /> In stock</span>
              )}
            </div>

            {product.description && (
              <p className="mt-5 text-charcoal/90 leading-relaxed">{product.description}</p>
            )}

            {/* Variants */}
            {(product.variants || []).length > 0 && (
              <div className="mt-6">
                <VariantPills
                  variants={product.variants}
                  selected={selected}
                  onSelect={(label, opt) => setSelected((s) => ({ ...s, [label]: opt }))}
                  idBase="pd"
                />
              </div>
            )}

            <div className="hidden lg:block mt-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-semibold uppercase tracking-wide text-charcoal">Qty</span>
                <QuantityStepper value={qty} onChange={setQty} />
              </div>
              <AddToCartButton
                product={product}
                variant={variantString}
                quantity={qty}
                disabled={product.in_stock === false || missingVariant}
                label={missingVariant ? 'Select options' : 'Add to Cart'}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 justify-center">
                <Truck className="w-4 h-4" /> Ships across India · Prices in ₹
              </div>
            </div>

            {product.makers_story && (
              <div className="mt-8 bg-offwhite border border-border rounded-lg p-5">
                <h3 className="font-heading font-bold text-terracotta text-lg">The Maker's Story</h3>
                <p className="mt-2 text-sm text-charcoal/85 leading-relaxed">{product.makers_story}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="display-hero text-2xl md:text-3xl text-terracotta mb-6">You may also love</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile floating cart ribbon */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-offwhite border-t border-border px-5 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-terracotta">{priceLabel}</span>
            {onSale && <span className="text-xs text-muted-foreground line-through">{formatINR(product.price)}</span>}
          </div>
        </div>
        <div className="flex-1">
          <AddToCartButton
            product={product}
            variant={variantString}
            quantity={qty}
            disabled={product.in_stock === false || missingVariant}
            label={missingVariant ? 'Select options' : 'Add to Cart'}
            className="!py-3.5 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
