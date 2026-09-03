import React from "react";
import { Search, Command, Menu } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

interface HeaderSearchBarProps {
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export const HeaderSearchBar: React.FC<HeaderSearchBarProps> = ({
  searchTerm = "",
  onSearchChange,
}) => {
  const { toggleMobileSidebar } = useSidebar();

  return (
    <div className="flex flex-1 items-center gap-3 md:gap-4">
      <button
        onClick={toggleMobileSidebar}
        className="flex size-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 lg:hidden dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
        title="Open Menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="relative w-full max-w-md">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search items, SKU, serials, invoices (Ctrl+K)..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pr-11 pl-10 text-sm text-gray-800 transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-500 dark:focus:bg-gray-950"
        />
        <kbd className="absolute top-1/2 right-3 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          <Command className="size-3" />K
        </kbd>
      </div>
    </div>
  );
};
