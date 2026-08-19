import React from "react";
import { Cpu, FileText, ShoppingCart } from "lucide-react";

interface BuildHeaderProps {
  selectedCount: number;
  onOpenQuotation: () => void;
  onCheckout: () => void;
}

export const BuildHeader: React.FC<BuildHeaderProps> = ({
  selectedCount,
  onOpenQuotation,
  onCheckout,
}) => {
  return (
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
          onClick={onOpenQuotation}
          disabled={selectedCount === 0}
          className="tail-btn-secondary text-xs"
        >
          <FileText className="size-4" />
          <span>Generate Quote</span>
        </button>
        <button
          onClick={onCheckout}
          disabled={selectedCount === 0}
          className="tail-btn-primary text-xs"
        >
          <ShoppingCart className="size-4" />
          <span>Send to Sales Checkout</span>
        </button>
      </div>
    </div>
  );
};
