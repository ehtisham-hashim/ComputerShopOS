import React, { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { SaleRecord, SaleLineItem } from "../../db/schema";
import { StoreSettings } from "../../db/settingsService";
import { getSaleItems } from "../../db/posService";
import { Modal } from "../ui/Modal";

interface ReceiptModalProps {
  sale: SaleRecord | null;
  storeSettings: StoreSettings | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, storeSettings, onClose }) => {
  const [items, setItems] = useState<SaleLineItem[]>([]);

  useEffect(() => {
    if (sale) {
      getSaleItems(sale.id).then(setItems).catch(console.error);
    }
  }, [sale]);

  if (!sale) return null;

  return (
    <Modal isOpen={Boolean(sale)} onClose={onClose} title="Receipt Print Preview" description="Thermal 80mm format customer invoice receipt" size="sm">
      <div className="space-y-4">
        <div id="thermal-receipt" className="p-4 bg-white text-gray-900 font-mono text-[11px] border border-gray-200 rounded-lg space-y-2">
          <div className="text-center pb-2 border-b border-dashed border-gray-300">
            <h3 className="font-bold text-sm uppercase">{storeSettings?.storeName || "ComputerShopOS"}</h3>
            <p className="text-[10px] text-gray-600">{storeSettings?.storeAddress}</p>
            <p className="text-[10px] text-gray-600">{storeSettings?.storePhone}</p>
          </div>

          <div className="flex justify-between text-[10px]">
            <span>Inv: {sale.invoiceNo}</span>
            <span>{new Date((sale.createdAt || 0) * 1000).toLocaleDateString()}</span>
          </div>
          <div className="text-[10px]">Cust: {sale.customerName}</div>

          <div className="border-t border-b border-dashed border-gray-300 py-1.5 space-y-1">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between">
                <span className="truncate max-w-[140px]">{it.quantity}x {it.itemName}</span>
                <span className="font-bold">PKR {Number(it.totalPrice).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="space-y-0.5 pt-1">
            <div className="flex justify-between"><span>Subtotal:</span><span>PKR {Number(sale.subtotal || 0).toLocaleString()}</span></div>
            {Number(sale.discount || 0) > 0 && <div className="flex justify-between"><span>Discount:</span><span>-PKR {Number(sale.discount).toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-gray-300">
              <span>TOTAL:</span><span>PKR {Number(sale.totalAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between"><span>Paid ({sale.paymentMethod}):</span><span>PKR {Number(sale.paidAmount || 0).toLocaleString()}</span></div>
            {Number(sale.balanceDue || 0) > 0 && <div className="flex justify-between font-bold"><span>Balance Due:</span><span>PKR {Number(sale.balanceDue).toLocaleString()}</span></div>}
          </div>

          <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[9px] text-gray-500">
            Thank you for your business!
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="tail-btn-secondary text-xs">Close</button>
          <button onClick={() => window.print()} className="tail-btn-primary text-xs"><Printer className="size-3.5" /><span>Print</span></button>
        </div>
      </div>
    </Modal>
  );
};
