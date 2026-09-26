import React, { useState, useEffect } from "react";
import { Zap, Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  ExpenseCategory,
  ExpenseCategories,
  ExpenseRecord,
} from "../../db/schema";
import {
  RecurringTemplate,
  getRecurringTemplates,
  saveRecurringTemplates,
  applyRecurringExpenses,
} from "../../db/expenseService";
import { Modal } from "../ui/Modal";
import { CustomDropdown } from "../ui/CustomDropdown";

interface ApplyRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
  selectedMonth: number;
  monthName: string;
  categoryFilter?: ExpenseCategory | "ALL";
  existingExpenses: ExpenseRecord[];
  onApplied: (applied: number, skipped: number) => void;
}

export const ApplyRecurringModal: React.FC<ApplyRecurringModalProps> = ({
  isOpen,
  onClose,
  selectedYear,
  selectedMonth,
  monthName,
  categoryFilter = "ALL",
  existingExpenses,
  onApplied,
}) => {
  const [allTemplates, setAllTemplates] = useState<RecurringTemplate[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [saveForFuture, setSaveForFuture] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Inline add fields
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ExpenseCategory>(
    categoryFilter !== "ALL" ? categoryFilter : "UTILITIES"
  );
  const [newAmount, setNewAmount] = useState("");

  // Existing titles already recorded this month
  const existingSet = new Set(
    existingExpenses.map((e) => e.title.trim().toUpperCase())
  );

  // Load templates on open
  useEffect(() => {
    if (!isOpen) return;
    getRecurringTemplates().then((templates) => {
      setAllTemplates(templates);

      const scoped =
        categoryFilter === "ALL"
          ? templates
          : templates.filter((t) => t.category === categoryFilter);

      const initialSelected = new Set<string>();
      const initialAmounts: Record<string, number> = {};

      scoped.forEach((t) => {
        initialAmounts[t.title] = t.amount;
        // Pre-select items that haven't been recorded yet this month
        if (!existingSet.has(t.title.trim().toUpperCase())) {
          initialSelected.add(t.title);
        }
      });

      setSelectedTitles(initialSelected);
      setAmounts(initialAmounts);
    });
  }, [isOpen, categoryFilter]);

  if (!isOpen) return null;

  const displayedTemplates =
    categoryFilter === "ALL"
      ? allTemplates
      : allTemplates.filter((t) => t.category === categoryFilter);

  const handleToggleSelect = (title: string) => {
    setSelectedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleAmountChange = (title: string, val: number) => {
    setAmounts((prev) => ({ ...prev, [title]: Math.max(0, val) }));
  };

  const handleDeleteTemplate = (title: string) => {
    setAllTemplates((prev) => prev.filter((t) => t.title !== title));
    setSelectedTitles((prev) => {
      const next = new Set(prev);
      next.delete(title);
      return next;
    });
  };

  const handleAddNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim().toUpperCase();
    const amt = parseInt(newAmount, 10);
    if (!trimmed || isNaN(amt) || amt <= 0) return;

    const exists = allTemplates.some(
      (t) => t.title.trim().toUpperCase() === trimmed
    );
    if (exists) {
      alert("A recurring template with this title already exists.");
      return;
    }

    const newTmpl: RecurringTemplate = {
      title: trimmed,
      category: categoryFilter !== "ALL" ? categoryFilter : newCategory,
      amount: amt,
      paymentMethod: "CASH",
      notes:
        categoryFilter === "SALARY"
          ? "Staff salary"
          : "Monthly recurring overhead",
    };

    setAllTemplates((prev) => [...prev, newTmpl]);
    setSelectedTitles((prev) => new Set([...prev, trimmed]));
    setAmounts((prev) => ({ ...prev, [trimmed]: amt }));

    setNewTitle("");
    setNewAmount("");
  };

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      // 1. Build templates with any edited amounts
      const updatedAllTemplates = allTemplates.map((t) => ({
        ...t,
        amount: amounts[t.title] !== undefined ? amounts[t.title] : t.amount,
      }));

      // 2. Persist updated templates if checked
      if (saveForFuture) {
        await saveRecurringTemplates(updatedAllTemplates);
      }

      // 3. Filter templates to checked ones
      const toApply = updatedAllTemplates.filter((t) =>
        selectedTitles.has(t.title)
      );

      // 4. Record the expenses for the active month
      const res = await applyRecurringExpenses(
        selectedYear,
        selectedMonth,
        toApply
      );

      onApplied(res.applied, res.skipped);
      onClose();
    } catch (err) {
      console.error("Failed to apply recurring templates:", err);
      alert("Failed to apply recurring expenses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = selectedTitles.size;
  const selectedSum = displayedTemplates
    .filter((t) => selectedTitles.has(t.title))
    .reduce((sum, t) => sum + (amounts[t.title] ?? t.amount), 0);

  const isSalaryMode = categoryFilter === "SALARY";
  const modalTitle = isSalaryMode
    ? "Edit Staff Salaries"
    : "Recurring Expenses & Overheads";
  const modalDesc = isSalaryMode
    ? `Adjust salary amounts, add or remove staff, and pay out for ${monthName} ${selectedYear}`
    : `Review, adjust amounts, or add items for ${monthName} ${selectedYear}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={modalDesc}
      icon={<Zap className="size-5 text-amber-500" />}
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Templates Checklist */}
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {displayedTemplates.length === 0 ? (
            <div className="text-center py-6 text-gray-500 border border-dashed rounded-xl dark:border-gray-800">
              No recurring templates configured. Add your first item below!
            </div>
          ) : (
            displayedTemplates.map((t) => {
              const isAlreadyRecorded = existingSet.has(
                t.title.trim().toUpperCase()
              );
              const isChecked = selectedTitles.has(t.title);
              const currentAmount = amounts[t.title] ?? t.amount;

              return (
                <div
                  key={t.title}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                    isChecked
                      ? "bg-brand-50/40 border-brand-200 dark:bg-brand-950/20 dark:border-brand-900/50"
                      : "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 opacity-75"
                  }`}
                >
                  {/* Checkbox and Details */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelect(t.title)}
                      className="size-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 dark:text-white truncate">
                          {t.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 uppercase font-medium">
                          {t.category.replace(/_/g, " ")}
                        </span>
                        {isAlreadyRecorded && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="size-3" />
                            Already recorded
                          </span>
                        )}
                      </div>
                      {t.notes && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {t.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inline Amount Input */}
                  <div className="flex items-center gap-2">
                    <div className="tail-currency-box w-28">
                      <span className="pl-2 text-[10px] font-bold text-gray-400 select-none">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={currentAmount}
                        onChange={(e) =>
                          handleAmountChange(
                            t.title,
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="w-full bg-transparent py-1.5 pl-1 pr-2 text-right tail-num-input text-xs font-bold text-gray-900 focus:outline-none dark:text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.title)}
                      title={isSalaryMode ? "Remove staff member" : "Remove recurring item"}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inline Add New Item Box */}
        <form
          onSubmit={handleAddNewTemplate}
          className="p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 space-y-2"
        >
          <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
            + Add New {isSalaryMode ? "Staff Member" : "Recurring Item"}
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              required
              placeholder={
                isSalaryMode
                  ? "e.g. HAMZA SALARY"
                  : "e.g. WATER DISPENSER, GENERATOR FUEL"
              }
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="tail-input h-8 text-xs uppercase flex-1"
            />

            {!isSalaryMode && (
              <CustomDropdown
                value={newCategory}
                onChange={(val) => setNewCategory(val as ExpenseCategory)}
                options={ExpenseCategories.map((c) => ({
                  value: c,
                  label: c.replace(/_/g, " "),
                }))}
                size="sm"
                className="w-full sm:w-36"
              />
            )}

            <div className="tail-currency-box h-8 w-full sm:w-28">
              <span className="pl-2 text-[10px] font-bold text-gray-400 select-none">
                Rs.
              </span>
              <input
                type="number"
                required
                min="1"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full bg-transparent py-1 pl-1 pr-2 text-right tail-num-input text-xs font-bold text-gray-900 focus:outline-none dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="tail-btn-primary-sm h-8 w-full sm:w-auto px-3 whitespace-nowrap"
            >
              <Plus className="size-3" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Total Summary & Controls */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveForFuture}
              onChange={(e) => setSaveForFuture(e.target.checked)}
              className="size-3.5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-700 dark:bg-gray-800"
            />
            <span className="text-gray-600 dark:text-gray-400 text-[11px]">
              Save changes for future months
            </span>
          </label>

          <div className="text-right">
            <span className="text-gray-500 text-[11px] block">
              Total to record ({selectedCount} selected):
            </span>
            <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400">
              Rs. {selectedSum.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="tail-btn-secondary-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isSubmitting || selectedCount === 0}
            className="tail-btn-primary-sm flex items-center gap-1.5"
          >
            <Zap className="size-3.5" />
            <span>
              {isSubmitting
                ? "Applying..."
                : isSalaryMode
                ? `Pay Out Selected (${selectedCount})`
                : `Apply to ${monthName} (${selectedCount})`}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
