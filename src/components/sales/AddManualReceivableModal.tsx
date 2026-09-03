import React, { useState } from "react";
import { UserPlus, AlertCircle } from "lucide-react";
import { Modal } from "../ui/Modal";
import { recordManualReceivable } from "../../db/posService";

interface AddManualReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const AddManualReceivableModal: React.FC<AddManualReceivableModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isBadDebt, setIsBadDebt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }
    const numAmount = typeof amount === "number" ? amount : 0;
    if (numAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await recordManualReceivable({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        amount: numAmount,
        notes: notes.trim(),
        isBadDebt,
      });

      setName("");
      setPhone("");
      setAmount("");
      setNotes("");
      setIsBadDebt(false);
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record manual receivable.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Manual / Legacy Receivable"
      description="Record customer debt or opening receivable without creating a POS cart"
      icon={<UserPlus className="size-5 text-brand-500" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-600 dark:text-error-400 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            Customer Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tail-input"
            placeholder="e.g. C/O Mukrab Shab, Mustaq Bhi"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Cell # / Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="tail-input font-mono"
              placeholder="e.g. 0336-5055167"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Amount Owed (PKR) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="tail-input font-mono font-bold"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            Remarks / Item Details / Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="tail-input resize-none"
            placeholder="e.g. Laptop repair balance, legacy ledger credit..."
          />
        </div>

        {/* Bad debt toggle */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-500" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-300 block">
                Mark as Doubtful / Bad Debt
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                Flag this debt as difficult or unlikely to recover
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isBadDebt}
            onChange={(e) => setIsBadDebt(e.target.checked)}
            className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 size-4"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="tail-btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="tail-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Recording..." : "Record Receivable"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
