import React, { useState, useEffect } from "react";
import { Banknote, CreditCard, DollarSign } from "lucide-react";
import { SaleRecord, PaymentMethod } from "../../db/schema";
import { processSalePayment } from "../../db/posService";
import { Modal } from "../ui/Modal";

interface PaymentProcProps {
  sale: SaleRecord | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const PaymentProc: React.FC<PaymentProcProps> = ({ sale, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sale) { setAmount(sale.balanceDue); setError(null); }
  }, [sale]);

  if (!sale) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return setError("Payment amount must be greater than 0.");
    if (amount > sale.balanceDue) return setError(`Max amount: PKR ${sale.balanceDue.toLocaleString()}`);

    setIsSubmitting(true);
    setError(null);
    try {
      await processSalePayment(sale.id, amount, paymentMethod);
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={Boolean(sale)} onClose={onClose} title={`Collect Payment • ${sale.invoiceNo}`} description={`Record incoming balance payment from ${sale.customerName}`} icon={<DollarSign className="size-5 text-success-500" />} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <div className="p-3 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-600 dark:text-error-400 font-medium">{error}</div>}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1.5 font-medium">
          <div className="flex justify-between text-gray-500"><span>Total Invoiced:</span><span className="font-bold text-gray-900 dark:text-white font-mono">PKR {sale.totalAmount.toLocaleString()}</span></div>
          <div className="flex justify-between text-gray-500"><span>Already Paid:</span><span className="font-bold text-success-600 dark:text-success-400 font-mono">PKR {sale.paidAmount.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm font-bold text-error-600 dark:text-error-400 pt-1.5 border-t border-gray-200 dark:border-gray-700"><span>Remaining Due:</span><span className="font-mono">PKR {sale.balanceDue.toLocaleString()}</span></div>
        </div>
        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">Payment Amount to Collect (Max: PKR {sale.balanceDue.toLocaleString()}) *</label>
          <input type="number" min="1" max={sale.balanceDue} required value={amount || ""} onChange={(e) => setAmount(Math.min(sale.balanceDue, Math.max(0, parseInt(e.target.value, 10) || 0)))} className="tail-input font-mono font-bold text-sm" placeholder={`Max ${sale.balanceDue}`} />
        </div>
        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPaymentMethod("CASH")} className={`flex items-center justify-center gap-2 py-2 rounded-xl border font-bold ${paymentMethod === "CASH" ? "border-brand-500 bg-brand-500 text-white shadow-theme-xs" : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}><Banknote className="size-4" /> CASH</button>
            <button type="button" onClick={() => setPaymentMethod("CARD")} className={`flex items-center justify-center gap-2 py-2 rounded-xl border font-bold ${paymentMethod === "CARD" ? "border-brand-500 bg-brand-500 text-white shadow-theme-xs" : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}><CreditCard className="size-4" /> CARD</button>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={onClose} className="tail-btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting || amount <= 0} className="tail-btn-primary font-bold">{isSubmitting ? "Processing..." : `Collect PKR ${amount.toLocaleString()}`}</button>
        </div>
      </form>
    </Modal>
  );
};
