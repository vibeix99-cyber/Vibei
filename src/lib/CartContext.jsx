import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'min_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Fires whenever something is added — drives the toast + cart-icon animation.
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, variant = '', quantity = 1) => {
    setLastAdded({ id: product.id, name: product.name, at: Date.now() });
    setItems((prev) => {
      const key = `${product.id}__${variant}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      const price =
        product.sale_price != null && product.sale_price < product.price
          ? product.sale_price
          : product.price;
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          name: product.name,
          image: product.images?.[0] || '',
          price,
          variant,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (key, quantity) => {
    if (quantity <= 0) return removeItem(key);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)));
  };

  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clearCart = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const isInCart = (productId) => items.some((i) => i.product_id === productId);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, count, subtotal, isInCart, lastAdded }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}