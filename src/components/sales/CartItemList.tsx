import React from "react";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { CartItem } from "./types";

interface CartItemListProps {
  cart: CartItem[];
  onUpdateQty: (inventoryId: number, delta: number) => void;
  onRemoveItem: (inventoryId: number) => void;
  onSelectSerial: (inventoryId: number, serial: string) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  cart,
  onUpdateQty,
  onRemoveItem,
}) => {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
        <ShoppingBag className="size-8 mb-2 opacity-40 text-brand-500" />
        <span className="font-semibold text-xs text-gray-600 dark:text-gray-300">Cart is empty</span>
        <span className="text-[11px] text-gray-400 mt-0.5">Click products on the left to add items to invoice</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
      {cart.map((c) => (
        <div
          key={c.item.id}
          className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white text-xs dark:border-gray-800 dark:bg-gray-900/80 shadow-theme-xs"
        >
          <div className="flex flex-col truncate pr-2 min-w-0">
            <span className="font-bold text-xs text-gray-900 dark:text-white truncate">{c.item.name}</span>
            <span className="font-mono text-[10px] text-gray-400 mt-0.5">PKR {c.item.price.toLocaleString()} each</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => onUpdateQty(c.item.id, -1)}
                className="size-6 flex items-center justify-center rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-theme-xs"
              >
                <Minus className="size-3" />
              </button>
              <span className="w-6 text-center font-bold text-gray-900 dark:text-white">{c.quantity}</span>
              <button
                type="button"
                onClick={() => onUpdateQty(c.item.id, 1)}
                className="size-6 flex items-center justify-center rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-theme-xs"
              >
                <Plus className="size-3" />
              </button>
            </div>

            <span className="font-mono font-bold text-sm text-gray-900 dark:text-white min-w-[80px] text-right">
              PKR {(c.item.price * c.quantity).toLocaleString()}
            </span>

            <button
              type="button"
              onClick={() => onRemoveItem(c.item.id)}
              className="size-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/15 dark:hover:text-error-400 transition-colors"
              title="Remove item"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
