import React from "react";
import { Sun, Moon, Sparkles, Lock } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface HeaderActionsProps {
  onOpenQuickSale?: () => void;
  onLockSession?: () => void;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  onOpenQuickSale,
  onLockSession,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2.5 sm:gap-3.5">
      {onOpenQuickSale && (
        <button
          onClick={onOpenQuickSale}
          className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition-all hover:bg-brand-700 active:scale-[0.98]"
        >
          <Sparkles className="size-3.5" />
          <span>Quick Sale (F2)</span>
        </button>
      )}

      <button
        onClick={toggleTheme}
        className="flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      >
        {theme === "dark" ? (
          <Sun className="size-5 text-warning-400 transition-transform rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="size-5 text-gray-700 transition-transform rotate-0 hover:-rotate-12" />
        )}
      </button>

      {onLockSession && (
        <button
          onClick={onLockSession}
          className="flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          title="Lock Terminal Screen"
        >
          <Lock className="size-4" />
        </button>
      )}

      <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-800">
        <div className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-theme-xs">
          CS
        </div>
        <div className="hidden flex-col md:flex">
          <span className="text-xs font-semibold text-gray-900 dark:text-white">Admin Store</span>
          <span className="text-[10px] text-success-500 font-medium flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-success-500" /> Online
          </span>
        </div>
      </div>
    </div>
  );
};
