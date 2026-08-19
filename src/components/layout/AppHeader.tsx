import React from "react";
import {
  Search,
  Sun,
  Moon,
  Menu,
  Sparkles,
  Command,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useSidebar } from "../../context/SidebarContext";

interface AppHeaderProps {
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onOpenQuickSale?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  searchTerm = "",
  onSearchChange,
  onOpenQuickSale,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md transition-colors sm:px-6 md:px-8 dark:border-gray-800 dark:bg-gray-900/80">
      {/* Left side: Mobile Toggle & Global Search */}
      <div className="flex flex-1 items-center gap-3 md:gap-4">
        <button
          onClick={toggleMobileSidebar}
          className="flex size-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 lg:hidden dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
            className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pr-11 pl-10 text-sm text-gray-800 transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700/80 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-400 dark:focus:bg-gray-900"
          />
          <kbd className="absolute top-1/2 right-3 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <Command className="size-3" />K
          </kbd>
        </div>
      </div>

      {/* Right side: Quick Action + Theme Switcher + User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {onOpenQuickSale && (
          <button
            onClick={onOpenQuickSale}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition-all hover:bg-brand-600 active:scale-[0.98]"
          >
            <Sparkles className="size-3.5" />
            <span>Quick Sale (F2)</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="size-5 text-warning-400 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="size-5 text-gray-700 transition-transform rotate-0 hover:-rotate-12" />
          )}
        </button>

        {/* Store Profile Badge */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-800">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 text-xs font-bold text-white shadow-theme-xs">
            CS
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Admin Store</span>
            <span className="text-[10px] text-success-500 font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-success-500"></span> Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
