import React, { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Customer, InventoryItem, PaymentStatus } from "../../db/schema";
import { createAdjustment } from "../../db/adjustmentsService";
import { Modal } from "../ui/Modal";
import { CustomSelect } from "../ui/Select";

interface CreateAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  customers: Customer[];
  onSuccess: () => Promise<void>;
}

export const CreateAdjustmentModal: React.FC<CreateAdjustmentModalProps> = ({
  isOpen, onClose, items, customers, onSuccess,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [itemTakenName, setItemTakenName] = useState("");
  const [itemTakenValue, setItemTakenValue] = useState(0);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [itemGivenName, setItemGivenName] = useState("");
  const [itemGivenPrice, setItemGivenPrice] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [isCustomPaidSet, setIsCustomPaidSet] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectCustomer = (val: string) => {
    setSelectedCustomerId(val);
    const found = customers.find((c) => String(c.id) === val);
    if (found) { setCustomerName(found.name); setCustomerPhone(found.phone); }
  };

  const handleSelectInventoryItem = (val: string) => {
    setSelectedInventoryId(val);
    const item = items.find((i) => String(i.id) === val);
    if (item) {
      setItemGivenName(item.name); setItemGivenPrice(item.price);
      if (!isCustomPaidSet) setPaidAmount(Math.max(0, item.price - (itemTakenValue || 0)));
    }
  };

  const netDifference = Math.round((itemGivenPrice || 0) - (itemTakenValue || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !itemTakenName.trim() || !itemGivenName.trim()) return;
    setIsSubmitting(true);
    try {
      const targetDue = Math.abs(netDifference);
      const paid = paidAmount !== undefined ? Math.round(Number(paidAmount)) : targetDue;
      const status: PaymentStatus = netDifference === 0 || paid >= targetDue ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
      await createAdjustment({
        customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined, customerName: customerName.trim(), customerPhone: customerPhone.trim(),
        itemTakenName: itemTakenName.trim(), itemTakenValue: Math.round(Number(itemTakenValue)) || 0, itemGivenInventoryId: selectedInventoryId ? Number(selectedInventoryId) : undefined,
        itemGivenName: itemGivenName.trim(), itemGivenPrice: Math.round(Number(itemGivenPrice)) || 0, netDifference, paidAmount: paid, balanceDue: Math.max(0, targetDue - paid),
        paymentStatus: status, notes: notes.trim(),
      });
      await onSuccess();
      onClose();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record PC Trade-In / Swap" description="Exchange customer hardware and calculate financial difference" icon={<ArrowLeftRight className="size-5 text-brand-500" />} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CustomSelect label="Customer Profile" value={selectedCustomerId} onChange={handleSelectCustomer} options={customers.map((c) => ({ value: String(c.id), label: c.name, sublabel: c.phone }))} placeholder="Select customer..." searchable />
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Customer Name *</label><input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="tail-input" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Item Taken In *</label><input type="text" required value={itemTakenName} onChange={(e) => setItemTakenName(e.target.value)} placeholder="GTX 1070 Rig" className="tail-input" /></div>
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Valuation (PKR) *</label><input type="number" required value={itemTakenValue || ""} onChange={(e) => { const v = parseInt(e.target.value, 10) || 0; setItemTakenValue(v); if (!isCustomPaidSet) setPaidAmount(Math.max(0, (itemGivenPrice || 0) - v)); }} className="tail-input" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CustomSelect label="Item Given Out" value={selectedInventoryId} onChange={handleSelectInventoryItem} options={items.map((i) => ({ value: String(i.id), label: i.name, sublabel: `PKR ${i.price.toLocaleString()}` }))} placeholder="Select inventory..." searchable />
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Price (PKR) *</label><input type="number" required value={itemGivenPrice || ""} onChange={(e) => { const v = parseInt(e.target.value, 10) || 0; setItemGivenPrice(v); if (!isCustomPaidSet) setPaidAmount(Math.max(0, v - (itemTakenValue || 0))); }} className="tail-input" /></div>
        </div>
        <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 flex justify-between items-center text-xs">
          <span>Net Difference:</span><span className="font-bold text-sm text-brand-700 dark:text-brand-300">{netDifference >= 0 ? `Customer pays: PKR ${netDifference.toLocaleString()}` : `Store refunds: PKR ${Math.abs(netDifference).toLocaleString()}`}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Amount Paid (PKR)</label><input type="number" value={paidAmount || ""} onChange={(e) => { setIsCustomPaidSet(true); setPaidAmount(parseInt(e.target.value, 10) || 0); }} className="tail-input" /></div>
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Internal Notes</label><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condition, serials..." className="tail-input" /></div>
        </div>
        <div className="flex justify-end gap-2.5 pt-2"><button type="button" onClick={onClose} className="tail-btn-secondary">Cancel</button><button type="submit" disabled={isSubmitting} className="tail-btn-primary">{isSubmitting ? "Recording..." : "Record Swap"}</button></div>
      </form>
    </Modal>
  );
};
