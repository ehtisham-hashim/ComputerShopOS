import React, { useState, useEffect } from "react";
import {
  Banknote,
  Users,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Zap,
  Check,
  X,
  CreditCard,
  Building2,
  DollarSign,
} from "lucide-react";
import { ExpenseRecord } from "../db/schema";
import {
  getExpensesByMonth,
  createExpense,
  updateExpense,
  deleteExpense,
  RECURRING_EXPENSE_TEMPLATES,
} from "../db/expenseService";
import { MONTH_NAMES } from "../components/expenses/ExpenseHeader";
import { AddExpenseModal } from "../components/expenses/AddExpenseModal";
import { CustomDropdown } from "../components/ui/CustomDropdown";
import { SearchInput } from "../components/ui/SearchInput";

export const SalariesPage: React.FC = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [salaries, setSalaries] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingSalary, setEditingSalary] = useState<ExpenseRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Inline editing of amount
  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlineAmountVal, setInlineAmountVal] = useState<string>("");
  const [isSavingInline, setIsSavingInline] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const allExpenses = await getExpensesByMonth(selectedYear, selectedMonth);
      const salaryExpenses = allExpenses.filter((e) => e.category === "SALARY");
      setSalaries(salaryExpenses);
    } catch (err) {
      console.error("Failed to load salaries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaries();
  }, [selectedYear, selectedMonth]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) return;
    try {
      await deleteExpense(id);
      showToast("Salary record deleted");
      await loadSalaries();
    } catch (err) {
      console.error("Failed to delete salary record:", err);
    }
  };

  const handleEdit = (rec: ExpenseRecord) => {
    setEditingSalary(rec);
    setShowAddModal(true);
  };

  const handleSaveInline = async (id: number) => {
    const val = parseInt(inlineAmountVal, 10);
    if (isNaN(val) || val < 0) {
      setInlineEditId(null);
      return;
    }
    setIsSavingInline(true);
    try {
      await updateExpense(id, { amount: val });
      showToast("Salary amount updated");
      setInlineEditId(null);
      await loadSalaries();
    } catch (err) {
      console.error("Failed to update salary:", err);
    } finally {
      setIsSavingInline(false);
    }
  };

  // Quick apply recurring staff salaries
  const staffTemplates = RECURRING_EXPENSE_TEMPLATES.filter((t) => t.category === "SALARY");

  const handleApplyStaffRoster = async () => {
    let appliedCount = 0;
    let skippedCount = 0;
    const nowSec = Math.floor(Date.now() / 1000);

    for (const t of staffTemplates) {
      const exists = salaries.some((s) => s.title.trim().toLowerCase() === t.title.trim().toLowerCase());
      if (!exists) {
        await createExpense({
          year: selectedYear,
          month: selectedMonth,
          category: "SALARY",
          title: t.title,
          amount: t.amount,
          expenseDate: nowSec,
          paymentMethod: t.paymentMethod,
          notes: t.notes,
        });
        appliedCount++;
      } else {
        skippedCount++;
      }
    }

    if (appliedCount > 0) {
      showToast(`Applied ${appliedCount} staff salary payouts (${skippedCount} already recorded)`);
    } else {
      showToast(`All ${skippedCount} staff salaries are already recorded for this month`);
    }
    await loadSalaries();
  };

  const handlePayQuickStaff = (title: string, defaultAmount: number) => {
    const existing = salaries.find(
      (s) => s.title.trim().toLowerCase() === title.trim().toLowerCase()
    );

    if (existing) {
      // If already recorded for this month, open the existing salary record to view/edit
      setEditingSalary(existing);
    } else {
      // Pre-fill a new salary record with all details
      const dateUnix = Math.floor(
        new Date(selectedYear, selectedMonth - 1, new Date().getDate(), 12, 0, 0).getTime() / 1000
      );
      setEditingSalary({
        id: 0,
        year: selectedYear,
        month: selectedMonth,
        category: "SALARY",
        title,
        amount: defaultAmount,
        expenseDate: dateUnix,
        paymentMethod: "CASH",
        notes: `Monthly staff salary for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
      });
    }
    setShowAddModal(true);
  };

  // KPIs
  const totalSalaries = salaries.reduce((acc, s) => acc + s.amount, 0);
  const staffCount = salaries.length;
  const avgSalary = staffCount > 0 ? Math.round(totalSalaries / staffCount) : 0;
  const maxSalary = salaries.reduce((max, s) => Math.max(max, s.amount), 0);

  const filtered = salaries.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = methodFilter === "ALL" || s.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const monthName = MONTH_NAMES[selectedMonth - 1];

  return (
    <div className="space-y-6 animate-in fade-in">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl shadow-theme-lg text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="size-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Banknote className="size-6 text-brand-500" />
            Staff Salaries & Payroll
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage staff payroll, monthly wage disbursements, and individual payout records
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-2 py-1 shadow-sm">
            <Calendar className="size-4 text-gray-400 shrink-0 ml-1" />
            <CustomDropdown
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(Number(val))}
              options={MONTH_NAMES.map((m, idx) => ({ value: idx + 1, label: m }))}
              variant="minimal"
              size="sm"
              minWidth={130}
            />
            <div className="h-4 w-px bg-gray-200 dark:border-gray-800" />
            <CustomDropdown
              value={selectedYear}
              onChange={(val) => setSelectedYear(Number(val))}
              options={[2025, 2026, 2027, 2028].map((y) => ({ value: y, label: String(y) }))}
              variant="minimal"
              size="sm"
              minWidth={80}
            />
          </div>

          <button
            onClick={handleApplyStaffRoster}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all"
            title="Auto-record salaries for standard shop staff"
          >
            <Zap className="size-3.5" />
            <span>Apply Staff Roster</span>
          </button>

          <button
            onClick={() => {
              setEditingSalary(null);
              setShowAddModal(true);
            }}
            className="tail-btn-primary-sm"
          >
            <Plus className="size-3.5" />
            <span>Pay Staff Salary</span>
          </button>
        </div>
      </div>

      {/* Quick Staff Roster Payout Chips */}
      {staffTemplates.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-gray-50/60 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-200/80 dark:border-gray-800">
          <span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
            <Users className="size-3.5 text-brand-500" />
            Quick Payout:
          </span>
          {staffTemplates.map((t) => {
            const isPaid = salaries.some((s) => s.title.trim().toLowerCase() === t.title.trim().toLowerCase());
            return (
              <button
                key={t.title}
                onClick={() => handlePayQuickStaff(t.title, t.amount)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                  isPaid
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-500"
                }`}
              >
                <span>{t.title}</span>
                <span className="font-mono text-[11px] opacity-75">Rs. {t.amount.toLocaleString()}</span>
                {isPaid && <Check className="size-3 text-emerald-500 ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Salaries Paid
            </p>
            <div className="size-8 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Banknote className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rs. {totalSalaries.toLocaleString()}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">For {monthName} {selectedYear}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Staff Members Paid
            </p>
            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {staffCount}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Individual disbursements</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Average Salary
            </p>
            <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rs. {avgSalary.toLocaleString()}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Per staff member</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Top Salary Disbursement
            </p>
            <div className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rs. {maxSalary.toLocaleString()}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Highest single payout</p>
          </div>
        </div>
      </div>

      {/* Salaries Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden shadow-theme-xs">
        {/* Table Filter / Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search staff name or notes..."
            size="sm"
            className="w-full sm:w-72"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CreditCard className="size-4 text-gray-400 shrink-0" />
            <CustomDropdown
              value={methodFilter}
              onChange={(val) => setMethodFilter(String(val))}
              options={[
                { value: "ALL", label: "All Payment Methods" },
                { value: "CASH", label: "Cash" },
                { value: "BANK", label: "Bank Transfer" },
                { value: "EASYPAISA", label: "Easypaisa / JazzCash" },
              ]}
              size="sm"
              minWidth={160}
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto max-h-[500px] scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/90 backdrop-blur-sm text-gray-500 font-bold uppercase tracking-wider text-[10px] z-10 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3">Disbursement Date</th>
                <th className="px-5 py-3">Staff Name / Title</th>
                <th className="px-5 py-3">Payment Method</th>
                <th className="px-5 py-3">Notes / Designation</th>
                <th className="px-5 py-3 text-right">Salary Amount</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                    Loading salary records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                    No salary records found for {monthName} {selectedYear}. Click "Apply Staff Roster" or "Pay Staff Salary" to record.
                  </td>
                </tr>
              ) : (
                filtered.map((sal) => (
                  <tr key={sal.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(sal.expenseDate * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 text-[10px] font-bold">
                          {sal.title.charAt(0).toUpperCase()}
                        </div>
                        <span>{sal.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 uppercase">
                        {sal.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 max-w-xs truncate">
                      {sal.notes || "Staff Salary"}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {inlineEditId === sal.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-gray-400 font-bold">Rs.</span>
                          <input
                            type="number"
                            autoFocus
                            min="0"
                            value={inlineAmountVal}
                            onChange={(e) => setInlineAmountVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveInline(sal.id);
                              if (e.key === "Escape") setInlineEditId(null);
                            }}
                            disabled={isSavingInline}
                            className="w-24 px-2 py-0.5 text-xs text-right font-bold border border-brand-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                          <button
                            onClick={() => handleSaveInline(sal.id)}
                            disabled={isSavingInline}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            title="Save (Enter)"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setInlineEditId(null)}
                            disabled={isSavingInline}
                            className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Cancel (Esc)"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setInlineEditId(sal.id);
                            setInlineAmountVal(String(sal.amount));
                          }}
                          className="font-bold text-gray-900 dark:text-white cursor-pointer hover:underline hover:text-brand-600"
                          title="Click to quick-edit amount"
                        >
                          Rs. {sal.amount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(sal)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                          title="Edit Salary Details"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sal.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 font-bold border-t-2 border-gray-200 dark:border-gray-700 text-xs">
                <tr>
                  <td colSpan={4} className="px-5 py-3 text-gray-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Total Salaries for {monthName} {selectedYear} ({filtered.length} staff)
                  </td>
                  <td className="px-5 py-3 text-right text-brand-600 dark:text-brand-400 font-bold">
                    Rs. {filtered.reduce((acc, s) => acc + s.amount, 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Salary Modal (reusing AddExpenseModal with initialCategory="SALARY") */}
      {showAddModal && (
        <AddExpenseModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingSalary(null);
          }}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          monthName={monthName}
          onExpenseAdded={() => {
            showToast(
              editingSalary && editingSalary.id > 0
                ? "Salary updated"
                : "Salary payout recorded"
            );
            loadSalaries();
          }}
          expenseToEdit={editingSalary && editingSalary.id > 0 ? editingSalary : null}
          prefillData={editingSalary && editingSalary.id === 0 ? editingSalary : null}
          initialCategory="SALARY"
          titleOverride={
            editingSalary && editingSalary.id > 0
              ? `Edit Salary: ${editingSalary.title}`
              : editingSalary && editingSalary.id === 0
              ? `Quick Payout: ${editingSalary.title}`
              : "Pay Staff Salary"
          }
          descriptionOverride={
            editingSalary && editingSalary.id === 0
              ? `Verify details and confirm payout of Rs. ${editingSalary.amount?.toLocaleString()} for ${monthName} ${selectedYear}`
              : undefined
          }
        />
      )}
    </div>
  );
};
