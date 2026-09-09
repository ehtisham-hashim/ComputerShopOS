import React, { useState } from "react";
import { DollarSign } from "lucide-react";
import { ExpenseCategory, ExpenseCategories } from "../../db/schema";
import { createExpense } from "../../db/expenseService";
import { CustomDropdown } from "../ui/CustomDropdown";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
  selectedMonth: number;
  monthName: string;
  onExpenseAdded: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  selectedYear,
  selectedMonth,
  monthName,
  onExpenseAdded,
}) => {
  const [title, setTitle] = useState<string>("" );
  const [category, setCategory] = useState<ExpenseCategory>("MISC");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setSubmitting(true);
    try {
      const dateUnix = Math.floor(new Date(selectedYear, selectedMonth - 1, new Date().getDate()).getTime() / 1000);
      await createExpense({
        year: selectedYear,
        month: selectedMonth,
        category,
        title: title.trim(),
        amount: parsedAmount,
        expenseDate: dateUnix,
        paymentMethod,
        notes: notes.trim(),
      });
      setTitle("");
      setAmount("");
      setNotes("");
      setCategory("MISC");
      onExpenseAdded();
      onClose();
    } catch (err) {
      console.error("Failed to add expense:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-theme-xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <DollarSign className="size-4 text-brand-500" />
            Add New Expense
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Expense Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shop Electricity Bill, Staff Salary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <CustomDropdown
                value={category}
                onChange={(val) => setCategory(val as ExpenseCategory)}
                options={ExpenseCategories.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))}
                className="w-full"
                buttonClassName="w-full py-2 bg-gray-50 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Amount (Rs.) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Payment Method
              </label>
              <CustomDropdown
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
                options={[
                  { value: "CASH", label: "Cash" },
                  { value: "BANK", label: "Bank Transfer" },
                  { value: "EASYPAISA", label: "Easypaisa / JazzCash" },
                ]}
                className="w-full"
                buttonClassName="w-full py-2 bg-gray-50 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Target Month
              </label>
              <input
                type="text"
                disabled
                value={`${monthName} ${selectedYear}`}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Notes / Reference
            </label>
            <textarea
              rows={2}
              placeholder="Optional details or receipt number"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-sm"
            >
              {submitting ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
