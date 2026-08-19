import React from "react";
import { Coins, ShoppingCart, Wrench } from "lucide-react";
import { Customer, SaleRecord, RepairTicketRecord } from "../../db/schema";
import { Modal } from "../ui/Modal";

interface CustomerHistoryModalProps {
  customer: Customer | null;
  onClose: () => void;
  loading: boolean;
  sales: SaleRecord[];
  repairs: RepairTicketRecord[];
  totalSpent: number;
}

export const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  customer, onClose, loading, sales, repairs, totalSpent,
}) => {
  return (
    <Modal isOpen={Boolean(customer)} onClose={onClose} title={`${customer?.name || ""} (History)`} description={`${customer?.phone || ""} • ${customer?.address || "No address"}`} size="lg">
      {loading ? (
        <p className="py-8 text-center text-xs text-gray-400">Loading customer history...</p>
      ) : (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between rounded-xl bg-brand-50/60 p-3 dark:bg-brand-500/10">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300">
              <Coins className="size-4" /> Lifetime Store Spend
            </div>
            <span className="font-bold text-sm text-brand-700 dark:text-brand-300">PKR {Math.round(totalSpent || 0).toLocaleString()}</span>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><ShoppingCart className="size-3.5 text-brand-500" /> Sales Invoices ({sales.length})</h4>
            {sales.length === 0 ? <p className="text-xs text-gray-400 py-2">No past sales invoices.</p> : (
              <div className="space-y-1.5">
                {sales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-xs dark:border-gray-800 dark:bg-gray-800/40">
                    <div><span className="font-mono font-bold text-gray-900 dark:text-white">{s.invoiceNo}</span><span className="text-gray-400 ml-2">{new Date((s.createdAt || 0) * 1000).toLocaleDateString()}</span></div>
                    <div className="flex items-center gap-2"><span className="font-bold text-gray-900 dark:text-white">PKR {Number(s.totalAmount || 0).toLocaleString()}</span><span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800">{s.paymentMethod}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><Wrench className="size-3.5 text-emerald-500" /> Repair Jobs ({repairs.length})</h4>
            {repairs.length === 0 ? <p className="text-xs text-gray-400 py-2">No repair tickets recorded.</p> : (
              <div className="space-y-1.5">
                {repairs.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-xs dark:border-gray-800 dark:bg-gray-800/40">
                    <div><span className="font-mono font-bold text-gray-900 dark:text-white">{r.ticketNo}</span><span className="text-gray-700 dark:text-gray-300 ml-2">{r.device}</span></div>
                    <div className="flex items-center gap-2"><span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/15">{r.status}</span><span className="font-bold text-gray-900 dark:text-white">PKR {Number(r.finalCost || r.estimatedCost || 0).toLocaleString()}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
        <button onClick={onClose} className="tail-btn-secondary text-xs">Close</button>
      </div>
    </Modal>
  );
};
