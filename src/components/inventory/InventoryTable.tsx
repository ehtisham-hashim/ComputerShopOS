import React, { useState, useEffect, useMemo } from "react";
import { Tag, Barcode, Eye, Trash2, RefreshCw, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { InventoryItem, ItemTitles, CategoryRecord } from "../../db/schema";
import { SearchInput } from "../ui/SearchInput";

interface InventoryTableProps {
  items: InventoryItem[];
  categories?: CategoryRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTitleFilter: string;
  onTitleFilterChange: (t: string) => void;
  isLoading: boolean;
  onAdjustQuantity: (id: number, current: number, delta: number) => Promise<void>;
  onViewSerials: (item: InventoryItem) => void;
  onInspectItem: (item: InventoryItem) => void;
  onDeleteItem: (id: number) => Promise<void>;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items, categories = [], searchQuery, onSearchChange, selectedTitleFilter, onTitleFilterChange,
  isLoading, onAdjustQuantity, onViewSerials, onInspectItem, onDeleteItem,
}) => {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedTitleFilter]);

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
    const map = new Map<string, number>();
    for (const it of items) {
      if (it.title) {
        map.set(it.title, (map.get(it.title) || 0) + 1);
      }
    }
    return map;
  }, [items]);

  const filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return (selectedTitleFilter === "ALL" || item.title === selectedTitleFilter) && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="tail-card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Search by name, SKU..." className="flex-1 max-w-md" />
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button onClick={() => onTitleFilterChange("ALL")} className={`rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0 ${selectedTitleFilter === "ALL" ? "bg-brand-500 text-white font-semibold shadow-theme-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}>All Items ({items.length})</button>
          {categoryList.map((title) => {
            const count = categoryCounts.get(title) || 0;
            if (count === 0) return null;
            return (<button key={title} onClick={() => onTitleFilterChange(title)} className={`rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0 ${selectedTitleFilter === title ? "bg-brand-500 text-white font-semibold shadow-theme-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}>{title} ({count})</button>);
          })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-sm whitespace-nowrap">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-500">
            <tr><th className="py-3.5 px-4">Category</th><th className="py-3.5 px-4">Product Name</th><th className="py-3.5 px-4">SKU</th><th className="py-3.5 px-4">Price</th><th className="py-3.5 px-4 text-center">Stock Units</th><th className="py-3.5 px-4">Total Value</th><th className="py-3.5 px-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-xs"><RefreshCw className="size-6 animate-spin mx-auto mb-2 text-brand-500" />Loading products...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-xs"><Package className="size-8 mx-auto mb-2 text-gray-400 opacity-60" />No inventory products found</td></tr>
            ) : (
              paginated.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4"><span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-bold text-gray-700 dark:text-gray-300"><Tag className="size-3" />{item.title}</span></td>
                  <td className="py-3.5 px-4"><div className="flex items-center gap-2"><span className="font-semibold text-gray-900 dark:text-white max-w-[200px] truncate block" title={item.name}>{item.name}</span>{item.isSerialized === 1 && <button type="button" onClick={() => onViewSerials(item)} className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 shrink-0">SN</button>}</div></td>
                  <td className="py-3.5 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{item.sku}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">PKR {item.price.toLocaleString()}</td>
                  <td className="py-3.5 px-4"><div className="flex items-center justify-center gap-1.5"><button onClick={() => onAdjustQuantity(item.id, item.quantity, -1)} disabled={item.quantity <= 0} className="flex size-7 items-center justify-center rounded-lg border border-gray-200 bg-white font-bold text-gray-600 shadow-theme-xs hover:bg-gray-100 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">-</button><span className={`min-w-8 text-center text-xs font-bold ${item.quantity <= 5 ? "text-warning-600 dark:text-warning-400" : "text-gray-900 dark:text-white"}`}>{item.quantity}</span><button onClick={() => onAdjustQuantity(item.id, item.quantity, 1)} className="flex size-7 items-center justify-center rounded-lg border border-gray-200 bg-white font-bold text-gray-600 shadow-theme-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">+</button></div></td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">PKR {(item.price * item.quantity).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => onInspectItem(item)} className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400" title="View Details"><Eye className="size-4" /></button>{item.isSerialized === 1 && <button onClick={() => onViewSerials(item)} className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400" title="Manage Serials"><Barcode className="size-4" /></button>}<button onClick={() => onDeleteItem(item.id)} className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15 dark:hover:text-error-400" title="Delete product"><Trash2 className="size-4" /></button></div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-3 text-xs text-gray-500">
          <span>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} products
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="size-3.5 inline mr-1" /> Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next <ChevronRight className="size-3.5 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
