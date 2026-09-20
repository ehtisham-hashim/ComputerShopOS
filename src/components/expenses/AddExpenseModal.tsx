import React, { useState, useEffect } from "react";
import { DollarSign, Pencil } from "lucide-react";
import { ExpenseCategory, ExpenseCategories, ExpenseRecord } from "../../db/schema";
import { createExpense, updateExpense } from "../../db/expenseService";
import { CustomDropdown } from "../ui/CustomDropdown";
import { Modal } from "../ui/Modal";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
  selectedMonth: number;
  monthName: string;
  onExpenseAdded: () => void;
  expenseToEdit?: ExpenseRecord | null;
  initialCategory?: ExpenseCategory;
}

const formatDateToYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  selectedYear,
  selectedMonth,
  monthName,
  onExpenseAdded,
  expenseToEdit,
  initialCategory,
}) => {
  const getDefaultDateStr = () => {
    const now = new Date();
    if (now.getFullYear() === selectedYear && now.getMonth() + 1 === selectedMonth) {
      return formatDateToYMD(now);
    }
    return formatDateToYMD(new Date(selectedYear, selectedMonth - 1, 1));
  };

  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>(initialCategory || "MISC");
  const [dateStr, setDateStr] = useState<string>(getDefaultDateStr());
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setCategory((expenseToEdit.category as ExpenseCategory) || initialCategory || "MISC");
      setAmount(String(expenseToEdit.amount));
      setPaymentMethod(expenseToEdit.paymentMethod || "CASH");
      setNotes(expenseToEdit.notes || "");
      if (expenseToEdit.expenseDate) {
        setDateStr(formatDateToYMD(new Date(expenseToEdit.expenseDate * 1000)));
      } else {
        setDateStr(getDefaultDateStr());
      }
    } else {
      setTitle("");
      setCategory(initialCategory || "MISC");
      setAmount("");
      setPaymentMethod("CASH");
      setNotes("");
      setDateStr(getDefaultDateStr());
    }
  }, [expenseToEdit, isOpen, initialCategory, selectedYear, selectedMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount < 0) return;

    setSubmitting(true);
    try {
      const parts = dateStr.split("-").map(Number);
      const targetYear = parts[0] || selectedYear;
      const targetMonth = parts[1] || selectedMonth;
      const targetDay = parts[2] || 1;
      const dateUnix = Math.floor(new Date(targetYear, targetMonth - 1, targetDay, 12, 0, 0).getTime() / 1000);

      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, {
          year: targetYear,
          month: targetMonth,
          title: title.trim(),
          category,
          amount: parsedAmount,
          expenseDate: dateUnix,
          paymentMethod,
          notes: notes.trim(),
        });
      } else {
        await createExpense({
          year: targetYear,
          month: targetMonth,
          category,
          title: title.trim(),
          amount: parsedAmount,
          expenseDate: dateUnix,
          paymentMethod,
          notes: notes.trim(),
        });
      }
      onExpenseAdded();
      onClose();
    } catch (err) {
      console.error("Failed to save expense:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? "Edit Shop Expense" : "Record Shop Expense"}
      description={`Operating overhead for ${monthName} ${selectedYear}`}
      icon={
        expenseToEdit ? (
          <Pencil className="size-5 text-brand-500" />
        ) : (
          <DollarSign className="size-5 text-brand-500" />
        )
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Expense Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Shop Electricity Bill, Staff Salary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="tail-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Amount (Rs.) *
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tail-input tabular-nums font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Expense Date *
            </label>
            <input
              type="date"
              required
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="tail-input text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Notes / Reference
          </label>
          <textarea
            rows={2}
            placeholder="Optional details or receipt number"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="tail-input resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="tail-btn-secondary-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="tail-btn-primary-sm"
          >
            {submitting
              ? "Saving..."
              : expenseToEdit
              ? "Update Expense"
              : "Save Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
