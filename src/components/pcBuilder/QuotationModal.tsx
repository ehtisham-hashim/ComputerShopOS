import React, { useState } from "react";
import { FileText } from "lucide-react";
import { Modal } from "../ui/Modal";
import { BuildSlot } from "./types";

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: BuildSlot[];
  totalPrice: number;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  slots,
  totalPrice,
}) => {
  const [customerName, setCustomerName] = useState("");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Custom PC Build Quotation"
      description="Export official quotation sheet for customer"
      icon={<FileText className="size-5 text-purple-500" />}
      size="lg"
    >
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
          Customer Name
        </label>
        <input
          type="text"
          placeholder="e.g. John Doe"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="tail-input"
        />
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-xs font-mono">
        {slots
          .filter((s) => s.item !== null)
          .map((s) => (
            <div key={s.category} className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {s.label}: {s.item?.name}
              </span>
              <span className="font-bold">PKR {s.item?.price.toLocaleString()}</span>
            </div>
          ))}
        <div className="flex justify-between pt-2 font-bold text-sm text-brand-500">
          <span>Total Quotation Estimate:</span>
          <span>PKR {Math.round(totalPrice).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2.5 mt-4">
        <button onClick={onClose} className="tail-btn-secondary">
          Close
        </button>
        <button onClick={() => window.print()} className="tail-btn-primary">
          Print Quotation
        </button>
      </div>
    </Modal>
  );
};
