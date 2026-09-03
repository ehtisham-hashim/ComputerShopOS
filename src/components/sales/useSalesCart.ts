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
    setCart((prev) => {
      const exists = prev.find((c) => c.item.id === item.id);
      if (exists) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: Math.min(item.quantity, c.quantity + 1) } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((c) => (c.item.id === id ? { ...c, quantity: c.quantity + delta } : c)).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((c) => c.item.id !== id));
  const clearCart = () => setCart([]);

  return { cart, isSaleModalOpen, setIsSaleModalOpen, addToCart, updateCartQty, removeFromCart, clearCart };
}
