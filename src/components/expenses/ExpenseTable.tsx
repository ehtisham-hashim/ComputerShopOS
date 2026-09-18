import React, { useState, useEffect, useMemo } from "react";
import { Search, Tag, Trash2, Pencil, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ExpenseRecord, ExpenseCategories } from "../../db/schema";
import { CustomDropdown } from "../ui/CustomDropdown";

interface ExpenseTableProps {
  expenses: ExpenseRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  onDelete: (id: number) => void;
  onEdit: (exp: ExpenseRecord) => void;
  onQuickUpdateAmount?: (id: number, newAmount: number) => Promise<void>;
  onApplyRecurring: () => void;
  loading: boolean;
  monthName: string;
  selectedYear: number;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  onDelete,
  onEdit,
  onQuickUpdateAmount,
  onApplyRecurring,
  loading,
  monthName,
  selectedYear,
}) => {
  const [editingAmountId, setEditingAmountId] = useState<number | null>(null);
  const [editingAmountVal, setEditingAmountVal] = useState<string>("");
  const [isSavingInline, setIsSavingInline] = useState<boolean>(false);

  const startEditAmount = (exp: ExpenseRecord) => {
    setEditingAmountId(exp.id);
    setEditingAmountVal(String(exp.amount));
  };

  const cancelEditAmount = () => {
    setEditingAmountId(null);
    setEditingAmountVal("");
  };

  const saveInlineAmount = async (id: number) => {
    const val = parseInt(editingAmountVal, 10);
    if (isNaN(val) || val < 0) {
      cancelEditAmount();
      return;
    }
    setIsSavingInline(true);
    try {
      if (onQuickUpdateAmount) {
        await onQuickUpdateAmount(id, val);
      }
      cancelEditAmount();
    } catch (err) {
      console.error("Failed to quick update expense amount:", err);
    } finally {
      setIsSavingInline(false);
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter, selectedYear, monthName]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedExpenses = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden shadow-theme-xs">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Tag className="size-4 text-gray-400 shrink-0" />
          <CustomDropdown
            value={categoryFilter}
            onChange={onCategoryFilterChange}
            options={[
              { value: "ALL", label: "All Categories" },
              ...ExpenseCategories.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))
            ]}
            size="sm"
            minWidth={150}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400">Loading monthly expenses...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-gray-400">
          No expenses found for {monthName} {selectedYear}.
          <div className="mt-2">
            <button onClick={onApplyRecurring} className="text-brand-500 font-bold hover:underline">
              Click to apply standard monthly overheads
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {paginatedExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(exp.expenseDate * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">
                    {exp.title}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {exp.category.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 uppercase text-[11px] font-medium">
                    {exp.paymentMethod}
                  </td>
                  <td className="px-5 py-3 text-gray-400 max-w-xs truncate">
                    {exp.notes || "—"}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {editingAmountId === exp.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-gray-400 font-bold">Rs.</span>
                        <input
                          type="number"
                          autoFocus
                          min="0"
                          value={editingAmountVal}
                          onChange={(e) => setEditingAmountVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveInlineAmount(exp.id);
                            if (e.key === "Escape") cancelEditAmount();
                          }}
                          disabled={isSavingInline}
                          className="w-24 px-2 py-0.5 text-xs text-right font-bold border border-brand-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <button
                          onClick={() => saveInlineAmount(exp.id)}
                          disabled={isSavingInline}
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          title="Save amount (Enter)"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          onClick={cancelEditAmount}
                          disabled={isSavingInline}
                          className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Cancel (Esc)"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEditAmount(exp)}
                        className="inline-flex items-center gap-1.5 cursor-pointer group py-0.5 px-1.5 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
                        title="Click to change amount value"
                      >
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          Rs. {exp.amount.toLocaleString()}
                        </span>
                        <Pencil className="size-3 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-rose-500 transition-opacity" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(exp)}
                        className="p-1 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                        title="Edit Expense"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => onDelete(exp.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-5 py-3 text-xs text-gray-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, filtered.length)} of {filtered.length} expenses
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
