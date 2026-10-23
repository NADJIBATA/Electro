import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "webstar_cart_v1";

const read = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((i) => i && i._id && i.quantity > 0) : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* stockage indisponible : le panier reste en mémoire */
    }
  }, [items]);

  const add = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const max = Math.min(product.stock ?? 20, 20);
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        return prev.map((i) => (i._id === product._id ? { ...i, quantity: Math.min(i.quantity + quantity, max), stock: product.stock } : i));
      }
      return [
        ...prev,
        {
          _id: product._id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.url || "",
          category: product.category?.slug || "",
          stock: product.stock,
          quantity: Math.min(quantity, max),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((id, quantity) => {
    setItems((prev) =>
      prev.map((i) => (i._id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, Math.min(i.stock ?? 20, 20))) } : i))
    );
  }, []);

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i._id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, subtotal, add, setQuantity, remove, clear, setItems };
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
