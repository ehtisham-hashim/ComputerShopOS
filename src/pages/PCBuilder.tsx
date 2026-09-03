import React, { useState } from "react";
import { InventoryItem } from "../db/schema";
import { BuildSlot } from "../components/pcBuilder/types";
import { BuildHeader } from "../components/pcBuilder/BuildHeader";
import { BuildSummaryCard } from "../components/pcBuilder/BuildSummaryCard";
import { BuildSlotRow } from "../components/pcBuilder/BuildSlotRow";
import { QuotationModal } from "../components/pcBuilder/QuotationModal";

interface PCBuilderPageProps {
  items: InventoryItem[];
  onTransferToSales?: (selectedParts: InventoryItem[]) => void;
}

export const PCBuilderPage: React.FC<PCBuilderPageProps> = ({ items, onTransferToSales }) => {
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

  const handleSelectPart = (category: string, item: InventoryItem) => {
    setSlots((prev) => prev.map((s) => (s.category === category ? { ...s, item } : s)));
  };

  const handleRemovePart = (category: string) => {
    setSlots((prev) => prev.map((s) => (s.category === category ? { ...s, item: null } : s)));
  };

  const selectedCount = slots.filter((s) => s.item !== null).length;
  const totalPrice = slots.reduce((acc, s) => acc + (s.item?.price || 0), 0);
  const totalWatts = slots.reduce((acc, s) => acc + (s.item ? s.estimatedWatts : 0), 0);
  const recommendedPSUWatts = Math.ceil((totalWatts * 1.3) / 50) * 50;

  const handleCheckoutBuild = () => {
    const parts = slots.map((s) => s.item).filter(Boolean) as InventoryItem[];
    if (parts.length > 0 && onTransferToSales) {
      onTransferToSales(parts);
    }
  };

  return (
    <div className="space-y-6">
      <BuildHeader
        selectedCount={selectedCount}
        onOpenQuotation={() => setIsQuotationModalOpen(true)}
        onCheckout={handleCheckoutBuild}
      />

      <BuildSummaryCard
        selectedCount={selectedCount}
        totalSlots={slots.length}
        totalWatts={totalWatts}
        recommendedPSUWatts={recommendedPSUWatts}
        totalPrice={totalPrice}
      />

      <div className="space-y-3">
        {slots.map((slot) => (
          <BuildSlotRow
            key={slot.category}
            slot={slot}
            items={items}
            onSelectPart={handleSelectPart}
            onRemovePart={handleRemovePart}
          />
        ))}
      </div>

      <QuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        slots={slots}
        totalPrice={totalPrice}
      />
    </div>
  );
};
