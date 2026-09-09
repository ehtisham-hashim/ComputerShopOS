import React from "react";
import { Receipt, Plus, Zap, Calendar } from "lucide-react";
import { CustomDropdown } from "../ui/CustomDropdown";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface ExpenseHeaderProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onApplyRecurring: () => void;
  onOpenAddModal: () => void;
}

export const ExpenseHeader: React.FC<ExpenseHeaderProps> = ({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onApplyRecurring,
  onOpenAddModal,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Receipt className="size-6 text-brand-500" />
          Expenses & Shop Overheads
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Record shop rent, staff salaries, electricity bills, security guard, and daily operational expenses
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-2 py-1 shadow-sm">
          <Calendar className="size-4 text-gray-400 shrink-0 ml-1" />
          <CustomDropdown
            value={selectedMonth}
            onChange={onMonthChange}
            options={MONTH_NAMES.map((m, idx) => ({ value: idx + 1, label: m }))}
            variant="minimal"
            size="sm"
            minWidth={130}
          />
          <div className="h-4 w-px bg-gray-200 dark:border-gray-800" />
          <CustomDropdown
            value={selectedYear}
            onChange={onYearChange}
            options={[2025, 2026, 2027, 2028].map((y) => ({ value: y, label: String(y) }))}
            variant="minimal"
            size="sm"
            minWidth={80}
          />
        </div>

        <button
          onClick={onApplyRecurring}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
          title="Auto-fill standard Rent, Salaries, Electricity, Chokidara & Internet for this month"
        >
          <Zap className="size-3.5" />
          <span>Apply Recurring</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-sm shadow-brand-500/20"
        >
          <Plus className="size-4" />
          <span>Add Expense</span>
        </button>
      </div>
    </div>
  );
};
