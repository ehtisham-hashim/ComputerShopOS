import React from "react";
import { ArrowLeftRight, Printer } from "lucide-react";
import { AdjustmentRecord } from "../../db/schema";
import { Modal } from "../ui/Modal";
import { StatusBadge } from "../ui/StatusBadge";

interface AdjustmentInspectModalProps {
  adjustment: AdjustmentRecord | null;
  onClose: () => void;
}

export const AdjustmentInspectModal: React.FC<AdjustmentInspectModalProps> = ({ adjustment, onClose }) => {
  if (!adjustment) return null;

  return (
    <Modal
      isOpen={Boolean(adjustment)}
      onClose={onClose}
      title={`Trade-In Swap • ${adjustment.adjustmentNo}`}
      description="Customer hardware exchange, inward inventory specs, and receipt breakdown"
      icon={<ArrowLeftRight className="size-5 text-brand-500" />}
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Customer Header */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <div>
            <span className="font-bold text-sm text-gray-900 dark:text-white block">
              {adjustment.customerName}
            </span>
            <span className="text-gray-500 font-mono">{adjustment.customerPhone || "No phone provided"}</span>
          </div>
          <div className="text-right">
            <StatusBadge status={adjustment.paymentStatus} />
            <span className="text-[11px] text-gray-400 block mt-1 font-mono">
              {new Date(adjustment.createdAt * 1000).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Swap Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Taken In */}
          <div className="p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                Item Taken In (Added to Stock)
              </span>
              {adjustment.itemTakenInventoryId && (
                <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                  Inv #{adjustment.itemTakenInventoryId}
                </span>
              )}
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white block">
              {adjustment.itemTakenName}
            </span>
            <div className="text-gray-500 font-mono text-[11px] pt-1">
              Valuation Credited:{" "}
              <strong className="text-gray-900 dark:text-white">
                PKR {adjustment.itemTakenValue.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Given Out */}
          <div className="p-3.5 rounded-xl border border-brand-200/60 dark:border-brand-500/20 bg-brand-50/30 dark:bg-brand-500/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-brand-700 dark:text-brand-400 font-bold uppercase tracking-wider text-[10px]">
                Item Given Out (Stock Decremented)
              </span>
              {adjustment.itemGivenInventoryId && (
                <span className="font-mono text-[10px] bg-brand-100 dark:bg-brand-500/20 text-brand-800 dark:text-brand-300 px-1.5 py-0.5 rounded">
                  Inv #{adjustment.itemGivenInventoryId}
                </span>
              )}
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white block">
              {adjustment.itemGivenName}
            </span>
            <div className="text-gray-500 font-mono text-[11px] pt-1">
              Selling Price:{" "}
              <strong className="text-gray-900 dark:text-white">
                PKR {Number(adjustment.itemGivenPrice || 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="p-3.5 rounded-xl bg-gray-900 text-white dark:bg-gray-950 border border-gray-800 space-y-2">
          <div className="flex justify-between font-bold text-sm">
            <span className="text-gray-300">Net Financial Difference:</span>
            <span className={adjustment.netDifference > 0 ? "text-success-400" : adjustment.netDifference < 0 ? "text-amber-400" : "text-gray-300"}>
              {adjustment.netDifference > 0
                ? `Customer Pays: PKR ${adjustment.netDifference.toLocaleString()}`
                : adjustment.netDifference < 0
                ? `Store Refunds: PKR ${Math.abs(adjustment.netDifference).toLocaleString()}`
                : "Even Swap (PKR 0)"}
            </span>
          </div>

          <div className="flex justify-between text-xs text-gray-300 pt-2 border-t border-gray-800">
            <span>Amount Paid Upfront:</span>
            <span className="font-mono font-bold">
              PKR {Number(adjustment.paidAmount || 0).toLocaleString()}
            </span>
          </div>

          {adjustment.balanceDue > 0 && (
            <div className="flex justify-between text-xs text-amber-400 font-bold">
              <span>Balance Due:</span>
              <span className="font-mono">PKR {adjustment.balanceDue.toLocaleString()}</span>
            </div>
          )}

          {adjustment.notes && (
            <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-800 italic">
              Note: {adjustment.notes}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="tail-btn-secondary">
            Close
          </button>
          <button onClick={() => window.print()} className="tail-btn-primary">
            <Printer className="size-4" />
            <span>Print Swap Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
