import React from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { InventoryItem } from "../../db/schema";
import { BuildSlot } from "./types";

interface BuildSlotRowProps {
  slot: BuildSlot;
  items: InventoryItem[];
  onSelectPart: (category: string, item: InventoryItem) => void;
  onRemovePart: (category: string) => void;
}

export const BuildSlotRow: React.FC<BuildSlotRowProps> = ({
  slot,
  items,
  onSelectPart,
  onRemovePart,
}) => {
  const matchingItems = items.filter((i) => i.title === slot.category);

  return (
    <div className="tail-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{slot.label}</h4>
          <span className="text-xs text-gray-400">Est. {slot.estimatedWatts}W TDP</span>
        </div>
      </div>

      <div className="flex-1 max-w-lg">
        {slot.item ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="flex flex-col truncate pr-2">
              <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">{slot.item.name}</span>
              <span className="font-mono text-[10px] text-gray-400">{slot.item.sku}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                PKR {slot.item.price.toLocaleString()}
              </span>
              <button
                onClick={() => onRemovePart(slot.category)}
                className="text-gray-400 hover:text-error-500"
                title="Remove component"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <select
            onChange={(e) => {
              const it = items.find((i) => i.id === Number(e.target.value));
              if (it) onSelectPart(slot.category, it);
            }}
            defaultValue=""
            className="tail-select text-xs"
          >
            <option value="" disabled>
              Select compatible {slot.label}... ({matchingItems.length} in stock)
            </option>
            {matchingItems.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name} — PKR {it.price.toLocaleString()} ({it.quantity} avail)
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};
