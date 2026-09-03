import React, { useEffect, useState } from "react";
import { Receipt, Printer } from "lucide-react";
import { SaleRecord, SaleLineItem } from "../../db/schema";
import { getSaleItems } from "../../db/posService";
import { Modal } from "../ui/Modal";
import { StatusBadge } from "../ui/StatusBadge";

interface InvoiceInspectModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
  onPrintReceipt: (sale: SaleRecord) => void;
}

export const InvoiceInspectModal: React.FC<InvoiceInspectModalProps> = ({
  sale,
  onClose,
  onPrintReceipt,
}) => {
  const [items, setItems] = useState<SaleLineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sale) {
      setLoading(true);
      getSaleItems(sale.id)
        .then(setItems)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [sale]);

  if (!sale) return null;

  return (
    <Modal isOpen={Boolean(sale)} onClose={onClose} title={`Invoice ${sale.invoiceNo}`} description="Itemized receipt and payment ledger record" icon={<Receipt className="size-5 text-brand-500" />} size="lg">
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <div><span className="font-bold text-sm text-gray-900 dark:text-white block">{sale.customerName}</span><span className="text-gray-500 font-mono">{sale.customerPhone || "Walk-in"}</span></div>
          <StatusBadge status={sale.paymentStatus || "PAID"} />
        </div>

        <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <tr><th className="p-2.5">Item Name</th><th className="p-2.5 text-center">Qty</th><th className="p-2.5">Price</th><th className="p-2.5 text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400">Loading line items...</td></tr>
              ) : items.map((it) => (
                <tr key={it.id}>
                  <td className="p-2.5 font-medium">{it.itemName}</td>
                  <td className="p-2.5 text-center">{it.quantity}</td>
                  <td className="p-2.5">PKR {Number(it.unitPrice).toLocaleString()}</td>
                  <td className="p-2.5 text-right font-bold">PKR {Number(it.totalPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 space-y-1">
          <div className="flex justify-between"><span>Subtotal:</span><span>PKR {Number(sale.subtotal || 0).toLocaleString()}</span></div>
          {Number(sale.discount || 0) > 0 && <div className="flex justify-between text-success-600"><span>Discount:</span><span>-PKR {Number(sale.discount).toLocaleString()}</span></div>}
          <div className="flex justify-between font-bold text-sm text-brand-700 dark:text-brand-300 pt-1 border-t border-brand-200 dark:border-brand-500/30">
            <span>Total Invoiced:</span><span>PKR {Number(sale.totalAmount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Amount Paid:</span><span>PKR {Number(sale.paidAmount || 0).toLocaleString()}</span></div>
          {Number(sale.balanceDue || 0) > 0 && <div className="flex justify-between font-bold text-error-600"><span>Balance Due:</span><span>PKR {Number(sale.balanceDue).toLocaleString()}</span></div>}
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button onClick={onClose} className="tail-btn-secondary">Close</button>
          <button onClick={() => onPrintReceipt(sale)} className="tail-btn-primary"><Printer className="size-4" /><span>Print Receipt</span></button>
        </div>
      </div>
    </Modal>
  );
};
