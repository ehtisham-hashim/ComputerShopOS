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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Repair Ticket"
      description="Log hardware intake, diagnostics, replacement parts, and labor fee"
      icon={<Wrench className="size-5 text-brand-500" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <CustomSelect
            label="Existing Customer"
            value={selectedCustomerId}
            onChange={handleSelectCustomer}
            options={customers.map((c) => ({
              value: String(c.id),
              label: c.name,
              sublabel: c.phone,
            }))}
            placeholder="Select customer..."
            searchable
          />
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="tail-input"
            />
          </div>
        </div>

        {/* Device & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="tail-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Device Model & Serial *
            </label>
            <input
              type="text"
              required
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              placeholder="e.g. Dell XPS 15 9570 / SN: 382910"
              className="tail-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Reported Fault / Diagnostic Request *
          </label>
          <textarea
            required
            value={reportedIssue}
            onChange={(e) => setReportedIssue(e.target.value)}
            placeholder="Describe customer complaint: no display, thermal throttling, liquid spill..."
            rows={2}
            className="tail-input"
          />
        </div>

        {/* Parts Section */}
        <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
            Replacement Parts & Consumables
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <CustomSelect
              value=""
              onChange={handleAddHardwarePart}
              options={items.map((i) => ({
                value: String(i.id),
                label: i.name,
                sublabel: `PKR ${i.price.toLocaleString()}`,
              }))}
              placeholder="+ Add inventory part..."
              searchable
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Custom part name..."
                value={customPartName}
                onChange={(e) => setCustomPartName(e.target.value)}
                className="tail-input flex-1"
              />
              <input
                type="number"
                placeholder="Cost"
                value={customPartCost || ""}
                onChange={(e) => setCustomPartCost(parseInt(e.target.value, 10) || 0)}
                className="tail-input tabular-nums w-24"
              />
              <button
                type="button"
                onClick={handleAddCustomPart}
                className="tail-btn-secondary-sm shrink-0 px-3"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {selectedParts.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {selectedParts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800 text-xs"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{p.name}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="tabular-nums font-bold text-gray-900 dark:text-white">
                      PKR {p.cost.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedParts((prev) => prev.filter((_, i) => i !== idx))}
                      className="size-6 flex items-center justify-center rounded text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                      title="Remove part"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-3.5 p-3 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 items-center">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
              Service Labor Fee (PKR)
            </label>
            <input
              type="number"
              value={laborCost || ""}
              onChange={(e) => setLaborCost(parseInt(e.target.value, 10) || 0)}
              className="tail-input tabular-nums font-bold"
            />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-gray-400">Estimated Total Quote</span>
            <span className="text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400">
              PKR {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={onClose} className="tail-btn-secondary-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="tail-btn-primary-sm"
          >
            {isSubmitting ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
