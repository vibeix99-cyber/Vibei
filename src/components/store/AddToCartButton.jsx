import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useCart } from '@/lib/CartContext';

// Full-width add-to-cart button with a satisfying press animation. Reflects an
// "In Cart" state (green + check) once the product is in the cart.
export default function AddToCartButton({
  product,
  variant = '',
  quantity = 1,
  disabled = false,
  label = 'Add to Cart',
  className = '',
}) {
  const { addItem, isInCart } = useCart();
  const inCart = product && isInCart(product.id);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 600, damping: 15 }}
      onClick={() => !disabled && addItem(product, variant, quantity)}
      disabled={disabled}
      aria-label={inCart ? `${product?.name} is in your cart` : label}
      className={`w-full flex items-center justify-center gap-2 font-semibold uppercase tracking-wider py-4 rounded-full shadow-md transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
        inCart
          ? 'bg-forest text-parchment hover:bg-forest/90'
          : 'bg-amber-clay text-white hover:bg-terracotta'
      } ${className}`}
    >
      {inCart ? (
        <>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="inline-flex"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
          </motion.span>
          In Cart
        </>
      ) : (
        disabled ? label : label
      )}
    </motion.button>
  );
}
