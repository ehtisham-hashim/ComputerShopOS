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
    <Modal isOpen={Boolean(adjustment)} onClose={onClose} title={`Trade-In ${adjustment.adjustmentNo}`} description="Hardware swap details and receipt overview" icon={<ArrowLeftRight className="size-5 text-brand-500" />} size="md">
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <div><span className="font-bold text-sm text-gray-900 dark:text-white block">{adjustment.customerName}</span><span className="text-gray-500 font-mono">{adjustment.customerPhone}</span></div>
          <StatusBadge status={adjustment.paymentStatus} />
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
          <div><span className="text-gray-400 block mb-0.5">Item Taken In</span><span className="font-bold text-gray-900 dark:text-white block">{adjustment.itemTakenName}</span><span className="font-mono text-gray-500">Valued: PKR {adjustment.itemTakenValue.toLocaleString()}</span></div>
          <div><span className="text-gray-400 block mb-0.5">Item Given Out</span><span className="font-bold text-gray-900 dark:text-white block">{adjustment.itemGivenName}</span><span className="font-mono text-gray-500">Price: PKR {Number(adjustment.itemGivenPrice || 0).toLocaleString()}</span></div>
        </div>

        <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 space-y-1">
          <div className="flex justify-between font-bold text-sm text-brand-700 dark:text-brand-300">
            <span>Net Financial Difference:</span>
            <span>{adjustment.netDifference >= 0 ? `+PKR ${adjustment.netDifference.toLocaleString()}` : `-PKR ${Math.abs(adjustment.netDifference).toLocaleString()}`}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300 pt-1 border-t border-brand-200 dark:border-brand-500/30">
            <span>Amount Paid:</span>
            <span>PKR {Number(adjustment.paidAmount || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button onClick={onClose} className="tail-btn-secondary">Close</button>
          <button onClick={() => window.print()} className="tail-btn-primary"><Printer className="size-4" /><span>Print Swap Receipt</span></button>
        </div>
      </div>
    </Modal>
  );
};
