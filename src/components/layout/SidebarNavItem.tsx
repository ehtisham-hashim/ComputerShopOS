import React from "react";
import { LucideIcon } from "lucide-react";
import { NavTab } from "./navTypes";

export interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeType?: "warning" | "brand" | "neutral";
  hotkey?: string;
}

interface SidebarNavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  isActive,
  isExpanded,
  onClick,
}) => {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      type="button"
      className={`group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
        isActive
          ? "bg-brand-500 text-white shadow-theme-xs shadow-brand-500/20"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-200"
      } ${!isExpanded ? "justify-center px-0" : ""}`}
      title={!isExpanded ? item.label : undefined}
    >
      <Icon
        className={`size-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
          isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
        }`}
      />

      {isExpanded && (
        <div className="flex flex-1 items-center justify-between truncate">
          <span className="truncate">{item.label}</span>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {item.badge && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : item.badgeType === "warning"
                    ? "bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
                    : item.badgeType === "brand"
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {item.badge}
              </span>
            )}
            {item.hotkey && (
              <kbd
                className={`text-[9px] font-mono px-1 rounded ${
                  isActive ? "bg-white/20 text-white" : "text-gray-400 bg-gray-100 dark:bg-gray-900"
                }`}
              >
                {item.hotkey}
              </kbd>
            )}
          </div>
        </div>
      )}
    </button>
  );
};
