import React from "react";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { CartItem } from "./types";

interface CartItemListProps {
  cart: CartItem[];
  onUpdateQty: (inventoryId: number, delta: number) => void;
  onSetQty?: (inventoryId: number, qty: number) => void;
  onRemoveItem: (inventoryId: number) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  cart,
  onUpdateQty,
  onSetQty,
  onRemoveItem,
}) => {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
        <ShoppingBag className="size-8 mb-2 opacity-40 text-brand-500" />
        <span className="font-semibold text-xs text-gray-600 dark:text-gray-300">Cart is empty</span>
        <span className="text-[11px] text-gray-400 mt-0.5">Click products or press Enter to add items</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
      {cart.map((c) => {
        const isMax = c.quantity >= c.item.quantity;
        return (
          <div
            key={c.item.id}
            className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-white text-xs dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
          >
            <div className="flex flex-col truncate pr-2 min-w-0 flex-1">
              <span className="font-bold text-xs text-gray-900 dark:text-white truncate">{c.item.name}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="tabular-nums text-[11px] text-gray-400">PKR {c.item.price.toLocaleString()}</span>
                {isMax && (
                  <span className="text-[10px] font-bold text-warning-600 dark:text-warning-400 bg-warning-500/10 px-1.5 py-0.2 rounded">
                    Max ({c.item.quantity})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 p-0.5">
                <button
                  type="button"
                  onClick={() => onUpdateQty(c.item.id, -1)}
                  className="size-6 flex items-center justify-center rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-theme-xs"
                  title="Decrease quantity"
                >
                  <Minus className="size-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={c.item.quantity}
                  value={c.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      if (onSetQty) onSetQty(c.item.id, val);
                      else onUpdateQty(c.item.id, val - c.quantity);
                    }
                  }}
                  className="w-10 text-center font-bold text-xs tabular-nums text-gray-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                />
                <button
                  type="button"
                  onClick={() => onUpdateQty(c.item.id, 1)}
                  disabled={isMax}
                  className="size-6 flex items-center justify-center rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-theme-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Increase quantity"
                >
                  <Plus className="size-3" />
                </button>
              </div>

              <span className="tabular-nums font-bold text-xs text-gray-900 dark:text-white min-w-[75px] text-right">
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
        );
      })}
    </div>
  );
};
