import React, { useState, useMemo } from "react";
import { Plus, Tag } from "lucide-react";
import { InventoryItem, ItemTitles, CategoryRecord } from "../../db/schema";
import { SearchInput } from "../ui/SearchInput";

interface CatalogPickerProps {
  items: InventoryItem[];
  categories?: CategoryRecord[];
  search: string;
  onSearchChange: (v: string) => void;
  onAddToCart: (item: InventoryItem) => void;
}

export const CatalogPicker: React.FC<CatalogPickerProps> = ({
  items, categories = [], search, onSearchChange, onAddToCart,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>("ALL");

  const categoryList = useMemo(() => {
    const list: string[] = [];
    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        if (!list.includes(c.name)) list.push(c.name);
      });
    } else {
      ItemTitles.forEach((t) => {
        if (!list.includes(t)) list.push(t);
      });
    }
    items.forEach((it) => {
      if (it.title && !list.includes(it.title)) {
        list.push(it.title);
      }
    });
    return list;
  }, [categories, items]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      counts.set(it.title, (counts.get(it.title) || 0) + 1);
    }
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return items.filter((i) => {
      const matchCat = selectedCat === "ALL" || i.title === selectedCat;
      const matchSearch =
        !s ||
        i.name.toLowerCase().includes(s) ||
        i.sku.toLowerCase().includes(s) ||
        i.title.toLowerCase().includes(s);
      return matchCat && matchSearch;
    });
  }, [items, selectedCat, search]);

  const displayedItems = useMemo(() => filtered.slice(0, 50), [filtered]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = search.trim().toLowerCase();
      if (!query) return;
      const exact = filtered.find(
        (it) => it.quantity > 0 && (it.sku.toLowerCase() === query || it.name.toLowerCase() === query)
      );
      const target = exact || filtered.find((it) => it.quantity > 0);
      if (target) {
        onAddToCart(target);
        onSearchChange("");
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex flex-col gap-2">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or search name/SKU (Press Enter to add)..."
          autoFocus
        />
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCat("ALL")}
            className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors ${
              selectedCat === "ALL"
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All ({items.length})
          </button>
          {categoryList.map((cat) => {
            const count = categoryCounts.get(cat) || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                  selectedCat === cat
                    ? "bg-brand-500 text-white shadow-theme-xs"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 max-h-[380px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            No products match your search
          </div>
        ) : (
          <>
            {displayedItems.map((it) => {
              const isAvail = it.quantity > 0;
              return (
                <div
                  key={it.id}
                  onClick={() => isAvail && onAddToCart(it)}
                  className={`group flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                    isAvail
                      ? "border-gray-200/90 bg-white hover:border-brand-500 hover:shadow-theme-xs cursor-pointer dark:border-gray-800 dark:bg-gray-900/70 dark:hover:border-brand-500/70"
                      : "border-gray-100 bg-gray-50/50 opacity-40 cursor-not-allowed dark:border-gray-800 dark:bg-gray-900/20"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <Tag className="size-2.5 text-brand-500" />
                        {it.title}
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">{it.sku}</span>
                    </div>
                    <span className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {it.name}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Stock:{" "}
                      <span
                        className={`tabular-nums ${
                          !isAvail
                            ? "text-gray-400"
                            : it.quantity <= 3
                            ? "text-error-500 font-bold"
                            : "text-gray-700 dark:text-gray-300 font-semibold"
                        }`}
                      >
                        {it.quantity > 0 ? `${it.quantity} units available` : "Out of stock"}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="font-bold tabular-nums text-xs text-gray-900 dark:text-white">
                        PKR {it.price.toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!isAvail}
                      className="size-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all disabled:opacity-40 disabled:bg-gray-100 disabled:text-gray-400 shadow-theme-xs"
                      title={isAvail ? "Add to invoice" : "Out of stock"}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length > 50 && (
              <div className="p-2 text-center text-[11px] text-gray-400 italic">
                Showing top 50 of {filtered.length} matching products. Refine search for more.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
