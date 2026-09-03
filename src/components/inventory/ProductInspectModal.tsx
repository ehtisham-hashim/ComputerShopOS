import React from "react";
import { Package, Tag } from "lucide-react";
import { InventoryItem } from "../../db/schema";
import { Modal } from "../ui/Modal";

interface ProductInspectModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const ProductInspectModal: React.FC<ProductInspectModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const margin = item.price - item.costPrice;
  const marginPercent = item.costPrice > 0 ? Math.round((margin / item.costPrice) * 100) : 100;

  return (
    <Modal isOpen={Boolean(item)} onClose={onClose} title={item.name} description={`Category: ${item.title} • SKU: ${item.sku}`} icon={<Package className="size-5 text-brand-500" />} size="md">
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <div><span className="text-gray-400 block mb-0.5">Category</span><span className="font-bold flex items-center gap-1"><Tag className="size-3 text-brand-500" />{item.title}</span></div>
          <div><span className="text-gray-400 block mb-0.5">In Stock</span><span className={`font-bold text-sm ${item.quantity <= 5 ? "text-warning-500" : "text-gray-900 dark:text-white"}`}>{item.quantity} Units</span></div>
          <div><span className="text-gray-400 block mb-0.5">Cost Price</span><span className="font-mono font-bold text-gray-700 dark:text-gray-300">PKR {item.costPrice.toLocaleString()}</span></div>
          <div><span className="text-gray-400 block mb-0.5">Retail Selling Price</span><span className="font-mono font-bold text-brand-600 dark:text-brand-400">PKR {item.price.toLocaleString()}</span></div>
          <div><span className="text-gray-400 block mb-0.5">Profit Margin / Unit</span><span className="font-mono font-bold text-success-600 dark:text-success-400">PKR {margin.toLocaleString()} ({marginPercent}%)</span></div>
          <div><span className="text-gray-400 block mb-0.5">Total Shelf Value</span><span className="font-mono font-bold text-gray-900 dark:text-white">PKR {(item.price * item.quantity).toLocaleString()}</span></div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button onClick={onClose} className="tail-btn-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
};
