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
  prefillData?: Partial<ExpenseRecord> | null;
  initialCategory?: ExpenseCategory;
  titleOverride?: string;
  descriptionOverride?: string;
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
  prefillData,
  initialCategory,
  titleOverride,
  descriptionOverride,
}) => {
  const getDefaultDateStr = () => {
    const now = new Date();
    if (now.getFullYear() === selectedYear && now.getMonth() + 1 === selectedMonth) {
      return formatDateToYMD(now);
    }
    return formatDateToYMD(new Date(selectedYear, selectedMonth - 1, 1));
  };

  const isEditing = Boolean(expenseToEdit && expenseToEdit.id > 0);

  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>(initialCategory || "MISC");
  const [dateStr, setDateStr] = useState<string>(getDefaultDateStr());
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const data =
      expenseToEdit && expenseToEdit.id > 0
        ? expenseToEdit
        : prefillData || (expenseToEdit && expenseToEdit.id === 0 ? expenseToEdit : null);

    if (data) {
      setTitle(data.title || "");
      setCategory((data.category as ExpenseCategory) || initialCategory || "MISC");
      setAmount(data.amount !== undefined && data.amount !== null ? String(data.amount) : "");
      setPaymentMethod(data.paymentMethod || "CASH");
      setNotes(data.notes || "");
      if (data.expenseDate) {
        setDateStr(formatDateToYMD(new Date(data.expenseDate * 1000)));
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
  }, [expenseToEdit, prefillData, isOpen, initialCategory, selectedYear, selectedMonth]);

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

      if (isEditing && expenseToEdit) {
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

  const modalTitle =
    titleOverride ||
    (isEditing
      ? category === "SALARY"
        ? "Edit Staff Salary"
        : "Edit Shop Expense"
      : category === "SALARY"
      ? "Record Staff Salary"
      : "Record Shop Expense");

  const modalDesc =
    descriptionOverride ||
    (category === "SALARY"
      ? `Salary disbursement for ${monthName} ${selectedYear}`
      : `Operating overhead for ${monthName} ${selectedYear}`);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={modalDesc}
      icon={
        isEditing ? (
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
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 transition-colors min-h-[56px] resize-none"
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
              : isEditing
              ? category === "SALARY"
                ? "Update Salary"
                : "Update Expense"
              : category === "SALARY"
              ? "Confirm & Record Salary"
              : "Save Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
