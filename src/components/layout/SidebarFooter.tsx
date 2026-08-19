import React from "react";
import { Database } from "lucide-react";

interface SidebarFooterProps {
  isExpanded: boolean;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ isExpanded }) => {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
      {isExpanded ? (
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <Database className="size-4 text-brand-500 shrink-0" />
          <div className="flex flex-col truncate">
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
              Local SQLite DB
            </span>
            <span className="text-[9px] text-success-500 font-medium">Encrypted & Active</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Database className="size-4 text-brand-500" />
        </div>
      )}
    </div>
  );
};
