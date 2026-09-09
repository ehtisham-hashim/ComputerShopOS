import React from "react";

interface ExpenseSummaryCardsProps {
  totalExpenseAmount: number;
  fixedOverheads: number;
  variableExpenses: number;
  expenseCount: number;
  monthName: string;
}

export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({
  totalExpenseAmount,
  fixedOverheads,
  variableExpenses,
  expenseCount,
  monthName,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Expenses ({monthName})</p>
        <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
          Rs. {totalExpenseAmount.toLocaleString()}
        </p>
        <p className="mt-1 text-[11px] text-gray-400">{expenseCount} entries recorded</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fixed Overheads (Rent & Salaries)</p>
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          Rs. {fixedOverheads.toLocaleString()}
        </p>
        <p className="mt-1 text-[11px] text-gray-400">
          {totalExpenseAmount > 0 ? `${Math.round((fixedOverheads / totalExpenseAmount) * 100)}% of total` : "0%"}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Daily & Variable Expenses</p>
        <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
          Rs. {variableExpenses.toLocaleString()}
        </p>
        <p className="mt-1 text-[11px] text-gray-400">Tea, transport, repairs, misc</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Monthly Target Impact</p>
        <p className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
          {expenseCount} Items
        </p>
        <p className="mt-1 text-[11px] text-gray-400">Deducted directly from Net Profit</p>
      </div>
    </div>
  );
};
