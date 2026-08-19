import React from "react";
import { Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface SelectOptionListProps {
  options: SelectOption[];
  selectedValue: string;
  onSelect: (val: string) => void;
}

export const SelectOptionList: React.FC<SelectOptionListProps> = ({
  options,
  selectedValue,
  onSelect,
}) => {
  if (options.length === 0) {
    return <div className="p-3 text-center text-xs text-gray-400">No matching options</div>;
  }

  return (
    <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
      {options.map((opt) => {
        const isSelected = opt.value === selectedValue;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
              isSelected
                ? "bg-brand-50 font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80"
            }`}
          >
            <div className="flex flex-col truncate pr-2">
              <span className="truncate">{opt.label}</span>
              {opt.sublabel && (
                <span className="text-[10px] text-gray-400 font-mono">{opt.sublabel}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {opt.badge && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold dark:bg-gray-800">
                  {opt.badge}
                </span>
              )}
              {isSelected && <Check className="size-3.5 text-brand-500" />}
            </div>
          </button>
        );
      })}
    </div>
  );
};
