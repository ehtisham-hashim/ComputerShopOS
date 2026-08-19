import React, { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { InventoryItem, ItemTitles } from "../../db/schema";
import { SearchInput } from "../ui/SearchInput";

interface CatalogPickerProps {
  items: InventoryItem[];
  search: string;
  onSearchChange: (v: string) => void;
  onAddToCart: (item: InventoryItem) => void;
}

export const CatalogPicker: React.FC<CatalogPickerProps> = ({
  items, search, onSearchChange, onAddToCart,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>("ALL");

  const filtered = items.filter((i) => {
    const matchCat = selectedCat === "ALL" || i.title === selectedCat;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()) || i.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex flex-col gap-2">
        <SearchInput value={search} onChange={onSearchChange} placeholder="Search catalog by name, SKU, or type..." />
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <button type="button" onClick={() => setSelectedCat("ALL")} className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${selectedCat === "ALL" ? "bg-brand-500 text-white shadow-theme-xs" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"}`}>All ({items.length})</button>
          {ItemTitles.map((cat) => {
            const count = items.filter((i) => i.title === cat).length;
            if (count === 0) return null;
            return (
              <button key={cat} type="button" onClick={() => setSelectedCat(cat)} className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${selectedCat === cat ? "bg-brand-500 text-white shadow-theme-xs" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"}`}>{cat} ({count})</button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 max-h-[380px] overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">No products match your search</div>
        ) : (
          filtered.map((it) => {
            const isAvail = it.quantity > 0;
            return (
              <div
                key={it.id}
                onClick={() => isAvail && onAddToCart(it)}
                className={`group flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                  isAvail
                    ? "border-gray-200/80 bg-white hover:border-brand-400 hover:shadow-theme-xs cursor-pointer dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-brand-500/50"
                    : "border-gray-100 bg-gray-50/50 opacity-40 cursor-not-allowed dark:border-gray-800 dark:bg-gray-900/20"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"><Tag className="size-2.5" />{it.title}</span>
                    <span className="font-mono text-[10px] text-gray-400">{it.sku}</span>
                  </div>
                  <span className="font-bold text-sm text-gray-900 dark:text-white leading-snug line-clamp-2">{it.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[11px] font-bold ${it.quantity <= 3 ? "text-warning-600 dark:text-warning-400" : "text-gray-500 dark:text-gray-400"}`}>{it.quantity > 0 ? `${it.quantity} in stock` : "Out of stock"}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                  <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">PKR {it.price.toLocaleString()}</span>
                  <button type="button" disabled={!isAvail} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 text-white font-bold text-xs shadow-theme-xs group-hover:bg-brand-600 transition-colors">
                    <Plus className="size-3.5" /><span>Add</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
