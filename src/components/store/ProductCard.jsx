import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { formatINR } from '@/lib/store';
import { useCart } from '@/lib/CartContext';
import { useQuickView } from './QuickView';
import { FadeInCard } from './Reveal';
import { Plus, Leaf, Check, Eye } from 'lucide-react';

export default function ProductCard({ product, index = 0 }) {
  const { addItem, isInCart } = useCart();
  const quickView = useQuickView();
  const hasVariants = product.variants && product.variants.length > 0;
  const soldOut = product.in_stock === false;
  const onSale = product.sale_price != null && product.sale_price < product.price;
  const displayPrice = onSale ? product.sale_price : product.price;
  const discountPct = onSale ? Math.round((1 - product.sale_price / product.price) * 100) : 0;
  const hasRange = !onSale && product.price_max != null && product.price_max > product.price;
  const inCart = isInCart(product.id);

  return (
    <FadeInCard index={index} className="group flex flex-col">
      <div className="relative overflow-hidden bg-offwhite rounded-md aspect-square">
        <Link to={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={product.name}>
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07] ${soldOut ? 'opacity-70' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          {onSale && (
            <span className="bg-terracotta text-parchment text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full">
              {discountPct}% Off
            </span>
          )}
          {soldOut && (
            <span className="bg-charcoal/85 text-parchment text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full">
              Sold out
            </span>
          )}
        </div>

        {product.organic && (
          <span className="absolute top-3 right-3 z-20 bg-forest text-parchment w-7 h-7 rounded-full flex items-center justify-center" role="img" aria-label="Organic product" title="Organic">
            <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        )}

        {/* Quick View on hover */}
        {quickView && (
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
            <button
              type="button"
              onClick={() => quickView.open(product)}
              className="inline-flex items-center gap-1.5 bg-parchment/95 backdrop-blur-sm border border-border text-charcoal text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-full shadow-sm hover:bg-parchment hover:scale-[1.03] transition-all"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Quick View
            </button>
          </div>
        )}
      </div>

      <div className="pt-3 pb-4 border-b border-terracotta/30 flex flex-col flex-1">
        {product.origin && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-amber-clay font-medium mb-1">
            {product.origin}
          </span>
        )}
        <Link to={`/product/${product.id}`}>
          <h3 className="font-heading font-semibold text-[15px] leading-snug text-charcoal hover:text-terracotta transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-terracotta group-hover:text-amber-clay transition-colors duration-200">
              {hasRange ? `${formatINR(product.price)} – ${formatINR(product.price_max)}` : formatINR(displayPrice)}
            </span>
            {onSale && (
              <span className="text-xs text-muted-foreground line-through">{formatINR(product.price)}</span>
            )}
          </div>
          {hasVariants ? (
            <button
              type="button"
              onClick={() => quickView && quickView.open(product)}
              className="text-[11px] uppercase tracking-wide font-semibold text-forest hover:text-terracotta transition-colors"
            >
              Options
            </button>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 600, damping: 15 }}
              onClick={() => addItem(product)}
              disabled={soldOut}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                inCart ? 'bg-forest text-white' : 'bg-amber-clay text-white hover:bg-terracotta'
              }`}
              aria-label={soldOut ? `${product.name} is sold out` : inCart ? `${product.name} is in your cart — add another` : `Add ${product.name} to cart`}
              title={soldOut ? 'Sold out' : inCart ? 'In cart' : 'Add to cart'}
            >
              {inCart ? <Check className="w-4 h-4" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
            </motion.button>
          )}
        </div>
      </div>
    </FadeInCard>
  );
}
