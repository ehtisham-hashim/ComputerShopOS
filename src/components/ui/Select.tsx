import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { SelectOption, SelectOptionList } from "./SelectOptionList";

export type { SelectOption };

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value, onChange, options, placeholder = "Select an option...", label,
  searchable = false, className = "", disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (o) => o.label.toLowerCase().includes(search.toLowerCase()) || (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <button
        type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left text-sm text-gray-900 shadow-theme-xs transition-all hover:border-gray-300 focus:border-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
      >
        <span className={selectedOption ? "font-medium truncate" : "text-gray-400 dark:text-gray-500 truncate"}>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`size-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180 text-brand-500" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-64 w-full min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          {searchable && (
            <div className="border-b border-gray-100 p-2 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Filter options..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2.5 text-xs text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" autoFocus />
              </div>
            </div>
          )}
          <SelectOptionList options={filteredOptions} selectedValue={value} onSelect={(val) => { onChange(val); setIsOpen(false); setSearch(""); }} />
        </div>
      )}
    </div>
  );
};
