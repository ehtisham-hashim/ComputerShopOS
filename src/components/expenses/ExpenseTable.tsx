import React from "react";
import { Search, Tag, Trash2 } from "lucide-react";
import { ExpenseRecord, ExpenseCategories } from "../../db/schema";
import { CustomDropdown } from "../ui/CustomDropdown";

interface ExpenseTableProps {
  expenses: ExpenseRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  onDelete: (id: number) => void;
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
  onApplyRecurring,
  loading,
  monthName,
  selectedYear,
}) => {
  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
              {filtered.map((exp) => (
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
                  <td className="px-5 py-3 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    Rs. {exp.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => onDelete(exp.id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete Expense"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
