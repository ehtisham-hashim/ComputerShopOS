import React, { useState } from "react";
import { Wrench, Plus, Trash2 } from "lucide-react";
import { Customer, InventoryItem, RepairPartUsed } from "../../db/schema";
import { addRepairTicket } from "../../db/repairsService";
import { Modal } from "../ui/Modal";
import { CustomSelect } from "../ui/Select";

interface AddRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  customers: Customer[];
  onSuccess: () => Promise<void>;
}

export const AddRepairModal: React.FC<AddRepairModalProps> = ({
  isOpen, onClose, items, customers, onSuccess,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [device, setDevice] = useState("");
  const [reportedIssue, setReportedIssue] = useState("");
  const [laborCost, setLaborCost] = useState(500);
  const [selectedParts, setSelectedParts] = useState<RepairPartUsed[]>([]);
  const [customPartName, setCustomPartName] = useState("");
  const [customPartCost, setCustomPartCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectCustomer = (val: string) => {
    setSelectedCustomerId(val);
    const found = customers.find((c) => String(c.id) === val);
    if (found) { setCustomerName(found.name); setCustomerPhone(found.phone); }
  };

  const handleAddHardwarePart = (idStr: string) => {
    const item = items.find((i) => String(i.id) === idStr);
    if (item) setSelectedParts((p) => [...p, { name: item.name, cost: item.price, isHardware: true, inventoryId: item.id }]);
  };

  const handleAddCustomPart = () => {
    if (!customPartName.trim()) return;
    setSelectedParts((p) => [...p, { name: customPartName.trim(), cost: Math.round(Number(customPartCost)) || 0, isHardware: false }]);
    setCustomPartName(""); setCustomPartCost(0);
  };

  const partsTotal = selectedParts.reduce((acc, p) => acc + p.cost, 0);
  const grandTotal = partsTotal + Math.round(Number(laborCost) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !device.trim()) return;
    setIsSubmitting(true);
    try {
      await addRepairTicket({
        customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
        customerName: customerName.trim(), customerPhone: customerPhone.trim(), device: device.trim(),
        reportedIssue: reportedIssue.trim(), partsUsed: selectedParts, laborCost: Math.round(Number(laborCost) || 0),
        estimatedCost: grandTotal, status: "RECEIVED",
      });
      await onSuccess();
      onClose();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Open Repair Ticket" description="Log diagnostic, parts used, and labor" icon={<Wrench className="size-5 text-brand-500" />} size="lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CustomSelect label="Existing Customer" value={selectedCustomerId} onChange={handleSelectCustomer} options={customers.map((c) => ({ value: String(c.id), label: c.name, sublabel: c.phone }))} placeholder="Select customer..." searchable />
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Customer Name *</label><input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="tail-input" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label><input type="text" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="tail-input" /></div>
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Device Model *</label><input type="text" required value={device} onChange={(e) => setDevice(e.target.value)} placeholder="e.g. Dell XPS 15" className="tail-input" /></div>
        </div>
        <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Reported Issue *</label><textarea required value={reportedIssue} onChange={(e) => setReportedIssue(e.target.value)} placeholder="Issue description..." rows={2} className="tail-input" /></div>
        <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <CustomSelect value="" onChange={handleAddHardwarePart} options={items.map((i) => ({ value: String(i.id), label: i.name, sublabel: `PKR ${i.price.toLocaleString()}` }))} placeholder="+ Add inventory part..." searchable />
            <div className="flex gap-2"><input type="text" placeholder="Custom part..." value={customPartName} onChange={(e) => setCustomPartName(e.target.value)} className="tail-input text-xs" /><input type="number" placeholder="Cost" value={customPartCost || ""} onChange={(e) => setCustomPartCost(parseInt(e.target.value, 10) || 0)} className="tail-input text-xs w-20" /><button type="button" onClick={handleAddCustomPart} className="tail-btn-secondary text-xs"><Plus className="size-3.5" /></button></div>
          </div>
          {selectedParts.map((p, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 text-xs"><span>{p.name}</span><div className="flex items-center gap-2"><span>PKR {p.cost.toLocaleString()}</span><button type="button" onClick={() => setSelectedParts((prev) => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-error-500"><Trash2 className="size-3.5" /></button></div></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-gray-800 pt-2">
          <div><label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Labor Fee (PKR)</label><input type="number" value={laborCost || ""} onChange={(e) => setLaborCost(parseInt(e.target.value, 10) || 0)} className="tail-input" /></div>
          <div className="flex flex-col justify-end"><span className="text-xs text-gray-500">Estimated Total:</span><span className="text-base font-bold text-brand-600 dark:text-brand-400">PKR {grandTotal.toLocaleString()}</span></div>
        </div>
        <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={onClose} className="tail-btn-secondary">Cancel</button><button type="submit" disabled={isSubmitting} className="tail-btn-primary">{isSubmitting ? "Creating..." : "Create Ticket"}</button></div>
      </form>
    </Modal>
  );
};
