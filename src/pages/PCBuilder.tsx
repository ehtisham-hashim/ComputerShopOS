import React, { useState } from "react";
import {
  Cpu,
  Zap,
  CheckCircle2,
  Trash2,
  FileText,
  ShoppingCart,
} from "lucide-react";
import { InventoryItem } from "../db/schema";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";

interface PCBuilderPageProps {
  items: InventoryItem[];
  onTransferToPOS?: (selectedParts: InventoryItem[]) => void;
}

interface BuildSlot {
  category: string;
  label: string;
  estimatedWatts: number;
  item: InventoryItem | null;
}

export const PCBuilderPage: React.FC<PCBuilderPageProps> = ({ items, onTransferToPOS }) => {
  const [slots, setSlots] = useState<BuildSlot[]>([
    { category: "CPU", label: "Processor (CPU)", estimatedWatts: 105, item: null },
    { category: "MOTHERBOARD", label: "Motherboard", estimatedWatts: 50, item: null },
    { category: "RAM", label: "Memory (RAM)", estimatedWatts: 15, item: null },
    { category: "GPU", label: "Graphics Card (GPU)", estimatedWatts: 285, item: null },
    { category: "STORAGE", label: "Solid State Drive (SSD)", estimatedWatts: 10, item: null },
    { category: "PSU", label: "Power Supply Unit (PSU)", estimatedWatts: 0, item: null },
    { category: "ACCESSORY", label: "PC Cabinet & Fans", estimatedWatts: 20, item: null },
  ]);

  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const handleSelectPart = (category: string, item: InventoryItem) => {
    setSlots((prev) =>
      prev.map((s) => (s.category === category ? { ...s, item } : s))
    );
  };

  const handleRemovePart = (category: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.category === category ? { ...s, item: null } : s))
    );
  };

  const selectedCount = slots.filter((s) => s.item !== null).length;
  const totalPrice = slots.reduce((acc, s) => acc + (s.item?.price || 0), 0);
  const totalWatts = slots.reduce(
    (acc, s) => acc + (s.item ? s.estimatedWatts : 0),
    0
  );
  const recommendedPSUWatts = Math.ceil((totalWatts * 1.3) / 50) * 50;

  const handleCheckoutBuild = () => {
    const parts = slots.map((s) => s.item).filter(Boolean) as InventoryItem[];
    if (parts.length > 0 && onTransferToPOS) {
      onTransferToPOS(parts);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Cpu className="size-6 text-purple-500" />
            Custom PC Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Build custom hardware rigs with real-time TDP wattage check and instant quotation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuotationModalOpen(true)}
            disabled={selectedCount === 0}
            className="tail-btn-secondary text-xs"
          >
            <FileText className="size-4" />
            <span>Generate Quote</span>
          </button>
          <button
            onClick={handleCheckoutBuild}
            disabled={selectedCount === 0}
            className="tail-btn-primary text-xs"
          >
            <ShoppingCart className="size-4" />
            <span>Send to POS Checkout</span>
          </button>
        </div>
      </div>

      {/* Wattage & Cost Summary Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Components Selected"
          value={`${selectedCount} / ${slots.length}`}
          subtitle="Parts Configured"
        />
        <StatCard
          title="Estimated Power (TDP)"
          value={`~${totalWatts} W`}
          valueColor="warning"
          icon={<Zap className="size-4" />}
          subtitle={<span className="text-brand-500 font-semibold">(Recommend {recommendedPSUWatts}W+ PSU)</span>}
        />
        <StatCard
          title="Total Build Cost"
          value={`$${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          valueColor="success"
        />
      </div>

      {/* Component Slots Grid */}
      <div className="space-y-3">
        {slots.map((slot) => {
          const matchingItems = items.filter((i) => i.title === slot.category);

          return (
            <div
              key={slot.category}
              className="tail-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Slot Header */}
              <div className="flex items-center gap-3 min-w-[200px]">
                <div
                  className={`size-10 flex items-center justify-center rounded-xl font-bold text-xs ${
                    slot.item
                      ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                  }`}
                >
                  {slot.item ? <CheckCircle2 className="size-5" /> : slot.category.slice(0, 3)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {slot.label}
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    Est. {slot.estimatedWatts}W TDP
                  </span>
                </div>
              </div>

              {/* Selected Item / Selection Dropdown */}
              <div className="flex-1 max-w-lg">
                {slot.item ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/40">
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                        {slot.item.name}
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">
                        {slot.item.sku}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        ${slot.item.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleRemovePart(slot.category)}
                        className="text-gray-400 hover:text-error-500"
                        title="Remove component"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        const it = items.find((i) => i.id === Number(e.target.value));
                        if (it) handleSelectPart(slot.category, it);
                      }}
                      defaultValue=""
                      className="tail-select text-xs"
                    >
                      <option value="" disabled>
                        Select compatible {slot.label}... ({matchingItems.length} in stock)
                      </option>
                      {matchingItems.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} — ${it.price.toFixed(2)} ({it.quantity} avail)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quotation Dialog */}
      <Modal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        title="Custom PC Build Quotation"
        subtitle="Export official quotation sheet for customer"
        icon={<FileText className="size-5 text-purple-500" />}
        maxWidth="lg"
      >
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Customer Name
          </label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="tail-input"
          />
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-xs font-mono">
          {slots
            .filter((s) => s.item !== null)
            .map((s) => (
              <div key={s.category} className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {s.label}: {s.item?.name}
                </span>
                <span className="font-bold">${s.item?.price.toFixed(2)}</span>
              </div>
            ))}
          <div className="flex justify-between pt-2 font-bold text-sm text-brand-500">
            <span>Total Quotation Estimate:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-4">
          <button
            onClick={() => setIsQuotationModalOpen(false)}
            className="tail-btn-secondary"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="tail-btn-primary"
          >
            Print Quotation
          </button>
        </div>
      </Modal>
    </div>
  );
};
