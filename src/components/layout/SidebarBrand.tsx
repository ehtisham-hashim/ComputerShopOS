import React from "react";
import { Sparkles, PanelLeftClose } from "lucide-react";

interface SidebarBrandProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

export const SidebarBrand: React.FC<SidebarBrandProps> = ({ isExpanded, toggleSidebar }) => {
  return (
    <div
      className={`flex h-20 items-center border-b border-gray-200 dark:border-gray-800 ${
        isExpanded ? "justify-between px-5" : "justify-center px-0"
      }`}
    >
      <div
        onClick={() => !isExpanded && toggleSidebar()}
        className="flex items-center gap-3 cursor-pointer select-none group"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-theme-xs group-hover:scale-105 transition-transform shrink-0">
          <Sparkles className="size-5" />
        </div>
        {isExpanded && (
          <div className="flex flex-col truncate">
            <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
              ComputerShop<span className="text-brand-500">OS</span>
            </span>
            <span className="text-[11px] font-medium text-gray-400">Pro Store Edition</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700 lg:flex dark:border-gray-800 dark:hover:bg-gray-900 dark:hover:text-gray-200 transition-colors"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="size-4" />
        </button>
      )}
    </div>
  );
};
