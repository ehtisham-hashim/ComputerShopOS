import { useState, useEffect } from "react";
import { InventoryItem } from "../../db/schema";
import { CartItem } from "./types";

export function useSalesCart(items: InventoryItem[], initialCartItems?: InventoryItem[]) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  useEffect(() => {
    if (initialCartItems && initialCartItems.length > 0) {
      const map: Record<number, number> = {};
      initialCartItems.forEach((it) => { map[it.id] = (map[it.id] || 0) + 1; });
      setCart(Object.entries(map).map(([id, qty]) => {
        const product = items.find((i) => i.id === Number(id)) || initialCartItems.find((i) => i.id === Number(id))!;
        return { item: product, quantity: qty };
      }));
      setIsSaleModalOpen(true);
    }
  }, [initialCartItems, items]);

  const addToCart = (item: InventoryItem) => {
    if (item.quantity <= 0) return;
    setCart((prev) => {
      const exists = prev.find((c) => c.item.id === item.id);
      if (exists) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: Math.min(item.quantity, c.quantity + 1) } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const setCartItemQty = (id: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((c) => {
        if (c.item.id === id) {
          const clamped = Math.min(c.item.quantity, Math.max(1, Math.round(qty)));
          return { ...c, quantity: clamped };
        }
        return c;
      })
    );
  };

  const addToCartBySku = (query: string): boolean => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return false;
    const match = items.find(
      (it) =>
        it.quantity > 0 &&
        (it.sku.toLowerCase() === trimmed || it.name.toLowerCase() === trimmed)
    ) || items.find(
      (it) =>
        it.quantity > 0 &&
        (it.sku.toLowerCase().includes(trimmed) || it.name.toLowerCase().includes(trimmed))
    );
    if (match) {
      addToCart(match);
      return true;
    }
    return false;
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === id ? { ...c, quantity: Math.min(c.item.quantity, c.quantity + delta) } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((c) => c.item.id !== id));
  const clearCart = () => setCart([]);

  return {
    cart,
    isSaleModalOpen,
    setIsSaleModalOpen,
    addToCart,
    setCartItemQty,
    addToCartBySku,
    updateCartQty,
    removeFromCart,
    clearCart,
  };
}
