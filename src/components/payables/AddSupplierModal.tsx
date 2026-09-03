import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { createPayableParty } from "../../db/payablesService";
import { PayableParty } from "../../db/schema";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (party: PayableParty) => void;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [openingBalance, setOpeningBalance] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Supplier / Party name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createPayableParty({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        openingBalance: typeof openingBalance === "number" ? openingBalance : 0,
      });

      setName("");
      setPhone("");
      setAddress("");
      setNotes("");
      setOpeningBalance("");
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create supplier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Supplier / Creditor"
      description="Register a new party to track purchases, payments, and running ledger"
      icon={<Building2 className="size-5 text-brand-500" />}
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
            Party / Supplier Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tail-input"
            placeholder="e.g. Zafar & Sons RWP, Al-Aziz LHR"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Phone / Contact
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="tail-input"
              placeholder="e.g. 0300-1234567"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Opening Balance (PKR)
            </label>
            <input
              type="number"
              min="0"
              value={openingBalance}
              onChange={(e) =>
                setOpeningBalance(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="tail-input font-mono"
              placeholder="0 (Initial amount owed)"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            Address / City / Plaza
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="tail-input"
            placeholder="e.g. Shop #4, Dubai Plaza, Rawalpindi"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            Notes / Bank Account Details
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="tail-input resize-none"
            placeholder="e.g. BOP Online Account #, payment terms..."
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
            {isSubmitting ? "Saving..." : "Add Supplier"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
