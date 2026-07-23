import React, { createContext, useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatINR } from '@/lib/store';
import ProductGallery from './ProductGallery';
import VariantPills from './VariantPills';
import QuantityStepper from './QuantityStepper';
import AddToCartButton from './AddToCartButton';

const QuickViewContext = createContext(null);
export const useQuickView = () => useContext(QuickViewContext);

export function QuickViewProvider({ children }) {
  const [product, setProduct] = useState(null);
  const value = useMemo(() => ({ open: setProduct }), []);
  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <QuickViewModal product={product} onClose={() => setProduct(null)} />
    </QuickViewContext.Provider>
  );
}

function QuickViewModal({ product, onClose }) {
  const [selected, setSelected] = useState({});
  const [qty, setQty] = useState(1);

  // Reset selections whenever a new product opens.
  React.useEffect(() => {
    setSelected({});
    setQty(1);
  }, [product?.id]);

  if (!product) return null;

  const onSale = product.sale_price != null && product.sale_price < product.price;
  const hasRange = !onSale && product.price_max != null && product.price_max > product.price;
  const discountPct = onSale ? Math.round((1 - product.sale_price / product.price) * 100) : 0;
  const variants = product.variants || [];
  const missingVariant = variants.some((v) => !selected[v.label]);
  const variantString = Object.values(selected).join(' / ');

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-parchment border-border">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-5 md:p-6">
            <ProductGallery images={product.images} alt={product.name} thumbnails={false} />
          </div>

          <div className="p-5 md:p-6 md:pr-8 flex flex-col">
            <span className="eyebrow text-amber-clay">
              <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
              {product.origin ? `${product.origin} · ` : ''}{product.category}
            </span>
            <DialogTitle className="display-hero text-2xl text-terracotta mt-2 leading-tight">
              {product.name}
            </DialogTitle>

            <div className="flex flex-wrap items-center gap-2.5 mt-3">
              <span className="font-heading font-bold text-xl text-charcoal">
                {hasRange ? `${formatINR(product.price)} – ${formatINR(product.price_max)}` : formatINR(onSale ? product.sale_price : product.price)}
              </span>
              {onSale && (
                <>
                  <span className="text-sm text-muted-foreground line-through">{formatINR(product.price)}</span>
                  <span className="bg-terracotta text-parchment text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full">Save {discountPct}%</span>
                </>
              )}
              {product.organic && (
                <span className="flex items-center gap-1 text-forest text-xs font-semibold uppercase tracking-wide">
                  <Leaf className="w-3.5 h-3.5" aria-hidden="true" /> Organic
                </span>
              )}
            </div>

            {product.description && (
              <DialogDescription className="mt-3 text-sm text-charcoal/80 leading-relaxed">
                {product.description}
              </DialogDescription>
            )}

            {variants.length > 0 && (
              <div className="mt-5">
                <VariantPills
                  variants={variants}
                  selected={selected}
                  onSelect={(label, opt) => setSelected((s) => ({ ...s, [label]: opt }))}
                  idBase="qv"
                />
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <QuantityStepper value={qty} onChange={setQty} />
              <span className="text-xs text-muted-foreground">In stock</span>
            </div>

            <div className="mt-5 mt-auto pt-5">
              <AddToCartButton
                product={product}
                variant={variantString}
                quantity={qty}
                disabled={product.in_stock === false || missingVariant}
                label={missingVariant ? 'Select options' : 'Add to Cart'}
              />
              <Link
                to={`/product/${product.id}`}
                onClick={onClose}
                className="block text-center mt-3 text-sm font-semibold text-forest hover:text-terracotta transition-colors"
              >
                View full details →
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
