import React from "react";
import { Barcode } from "lucide-react";
import { InventoryItem, InventorySerial } from "../../db/schema";
import { Modal } from "../ui/Modal";
import { StatusBadge } from "../ui/StatusBadge";

interface SerialViewerModalProps {
  item: InventoryItem | null;
  serials: InventorySerial[];
  loading: boolean;
  onClose: () => void;
}

export const SerialViewerModal: React.FC<SerialViewerModalProps> = ({ item, serials, loading, onClose }) => {
  return (
    <Modal isOpen={Boolean(item)} onClose={onClose} title="Serial Numbers (Barcode Tracker)" description={item ? `${item.name} (${item.sku})` : ""} icon={<Barcode className="size-5 text-brand-500" />} size="md">
      {loading ? (
        <p className="py-8 text-center text-xs text-gray-400">Loading serial records...</p>
      ) : serials.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">No serial numbers found for this product.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {serials.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-xs dark:border-gray-800 dark:bg-gray-800/40">
              <span className="font-mono font-bold text-gray-900 dark:text-white">{s.serialNumber}</span>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
        <button onClick={onClose} className="tail-btn-secondary text-xs">Close</button>
      </div>
    </Modal>
  );
};
