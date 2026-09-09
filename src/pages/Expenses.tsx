import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { ExpenseRecord } from "../db/schema";
import { getExpensesByMonth, deleteExpense, applyRecurringExpenses } from "../db/expenseService";
import { ExpenseHeader, MONTH_NAMES } from "../components/expenses/ExpenseHeader";
import { ExpenseSummaryCards } from "../components/expenses/ExpenseSummaryCards";
import { ExpenseTable } from "../components/expenses/ExpenseTable";
import { AddExpenseModal } from "../components/expenses/AddExpenseModal";

export const ExpensesPage: React.FC = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadExpenses = async () => {
    setLoading(true);
    try { setExpenses(await getExpensesByMonth(selectedYear, selectedMonth)); }
    catch (err) { console.error("Failed to load expenses:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadExpenses(); }, [selectedYear, selectedMonth]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await deleteExpense(id);
      showToast("Expense deleted");
      await loadExpenses();
    } catch (err) { console.error("Failed to delete expense:", err); }
  };

  const handleApplyRecurring = async () => {
    try {
      const res = await applyRecurringExpenses(selectedYear, selectedMonth);
      showToast(`Applied ${res.applied} recurring overheads (${res.skipped} already existed)`);
      await loadExpenses();
    } catch (err) { console.error("Failed to apply recurring expenses:", err); }
  };

  const total = expenses.reduce((acc, e) => acc + e.amount, 0);
  const fixed = expenses
    .filter((e) => ["RENT", "SALARY", "SECURITY_GUARD", "INTERNET", "UTILITIES"].includes(e.category))
    .reduce((acc, e) => acc + e.amount, 0);
  const monthName = MONTH_NAMES[selectedMonth - 1];

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl shadow-theme-lg text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="size-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <ExpenseHeader
        selectedYear={selectedYear} selectedMonth={selectedMonth}
        onYearChange={setSelectedYear} onMonthChange={setSelectedMonth}
        onApplyRecurring={handleApplyRecurring} onOpenAddModal={() => setShowAddModal(true)}
      />

      <ExpenseSummaryCards
        totalExpenseAmount={total} fixedOverheads={fixed}
        variableExpenses={total - fixed} expenseCount={expenses.length} monthName={monthName}
      />

      <ExpenseTable
        expenses={expenses} searchQuery={searchQuery} onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter} onCategoryFilterChange={setCategoryFilter}
        onDelete={handleDelete} onApplyRecurring={handleApplyRecurring}
        loading={loading} monthName={monthName} selectedYear={selectedYear}
      />

      <AddExpenseModal
        isOpen={showAddModal} onClose={() => setShowAddModal(false)}
        selectedYear={selectedYear} selectedMonth={selectedMonth} monthName={monthName}
        onExpenseAdded={() => { showToast("Expense recorded successfully"); loadExpenses(); }}
      />
    </div>
  );
};
