import React, { useState, useEffect } from "react";
import {
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { PurchaseWithItems, getPurchases } from "../../db/purchaseService";

interface ViewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseNoOrRef: string | null;
  partyId?: number;
}

export const ViewPurchaseModal: React.FC<ViewPurchaseModalProps> = ({
  isOpen,
  onClose,
  purchaseNoOrRef,
  partyId,
}) => {
  const [purchase, setPurchase] = useState<PurchaseWithItems | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && purchaseNoOrRef) {
      setLoading(true);
      getPurchases(partyId)
        .then((all) => {
          const match = all.find(
            (p) =>
              p.purchaseNo === purchaseNoOrRef ||
              p.refNo === purchaseNoOrRef ||
              (purchaseNoOrRef.startsWith("PUR-") && p.purchaseNo.includes(purchaseNoOrRef))
          );
          setPurchase(match || null);
        })
        .catch((err) => {
          console.error("Error loading purchase details:", err);
          setPurchase(null);
        })
        .finally(() => setLoading(false));
    } else {
      setPurchase(null);
    }
  }, [isOpen, purchaseNoOrRef, partyId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Purchase & Stock Inward Bill"
      description="Detailed hardware items, pricing breakdown, and supplier reconciliation"
      icon={<FileText className="size-5 text-brand-600 dark:text-brand-400" />}
      size="3xl"
    >
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : !purchase ? (
        <div className="p-8 text-center text-xs text-gray-500 space-y-2">
          <p>No corresponding purchase inward bill was found for "{purchaseNoOrRef}".</p>
          <p className="text-gray-400">
            This entry may be an opening balance or legacy direct journal transaction.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top Bill Meta */}
          <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-brand-600 dark:text-brand-400">
                    {purchase.purchaseNo}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      purchase.status === "RECEIVED"
                        ? "bg-success-50 text-success-700 dark:bg-success-950/40 dark:text-success-400 border border-success-200 dark:border-success-800"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    {purchase.status === "RECEIVED" ? (
                      <>
                        <CheckCircle2 className="size-3" />
                        <span>RECEIVED (Stock Updated)</span>
                      </>
                    ) : (
                      <>
                        <Clock className="size-3" />
                        <span>ORDERED (Transit Only)</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <Building2 className="size-3.5 text-gray-400" />
                    <span className="font-bold">{purchase.partyName}</span>
                  </div>
                  {purchase.refNo && (
                    <div className="font-mono text-gray-500">
                      Bill Ref: <span className="font-bold">{purchase.refNo}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 font-mono text-gray-500">
                    <Calendar className="size-3.5 text-gray-400" />
                    <span>{new Date(purchase.purchaseDate * 1000).toISOString().split("T")[0]}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="tail-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Printer className="size-3.5" />
                  <span>Print Bill</span>
                </button>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Name & Specs</th>
                  <th className="py-2.5 px-2.5">Category</th>
                  <th className="py-2.5 px-2.5">SKU</th>
                  <th className="py-2.5 px-2.5 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
                {purchase.items.map((it, idx) => (
                  <tr key={it.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                    <td className="py-2.5 px-3 text-gray-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-gray-900 dark:text-white">
                      {it.itemName}
                    </td>
                    <td className="py-2.5 px-2.5 font-sans">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {it.title}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-gray-500">{it.sku || "—"}</td>
                    <td className="py-2.5 px-2.5 text-center font-bold text-gray-900 dark:text-white">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 dark:text-gray-300">
                      PKR {it.costPrice.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-success-600 dark:text-success-400">
                      {it.sellPrice > 0 ? `PKR ${it.sellPrice.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900 dark:text-white">
                      PKR {it.totalCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes if available */}
          {purchase.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/60 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-bold text-gray-700 dark:text-gray-300">Notes: </span>
              {purchase.notes}
            </div>
          )}

          {/* Financial Breakdown Card */}
          <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="text-gray-500 space-y-0.5">
              <div>Total Unique Items: <span className="font-mono font-bold text-gray-900 dark:text-white">{purchase.items.length}</span></div>
              <div>Total Units Inwarded: <span className="font-mono font-bold text-gray-900 dark:text-white">{purchase.items.reduce((s, i) => s + i.quantity, 0)}</span></div>
            </div>

            <div className="flex items-center gap-6 font-mono text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Bill</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  PKR {purchase.totalAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-success-600 dark:text-success-400 block">Upfront Paid</span>
                <span className="text-base font-bold text-success-600 dark:text-success-400">
                  PKR {purchase.paidAmount.toLocaleString()}
                </span>
              </div>
              <div className="pl-4 border-l border-gray-200 dark:border-gray-800">
                <span className="text-[10px] uppercase font-bold text-error-600 dark:text-error-400 block">Balance to Khata</span>
                <span className="text-base font-bold text-error-600 dark:text-error-400">
                  PKR {purchase.balanceDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
