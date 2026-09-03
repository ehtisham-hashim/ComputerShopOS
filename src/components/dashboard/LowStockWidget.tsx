import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { InventoryItem } from "../../db/schema";

interface LowStockWidgetProps {
  lowStockItems: InventoryItem[];
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({ lowStockItems }) => {
  return (
    <div className="tail-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning-500" />
            Low Stock Alerts
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Items requiring restock soon</p>
        </div>
      </div>

      <div className="space-y-3">
        {lowStockItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="size-8 text-success-500 mb-2" />
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">All inventory levels healthy!</p>
            <span className="text-[11px] text-gray-400">No items below 5 units</span>
          </div>
        ) : (
          lowStockItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30"
            >
              <div className="flex flex-col truncate pr-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</span>
                <span className="text-[11px] font-mono text-gray-400">{item.sku}</span>
              </div>
              <span className="rounded-lg bg-warning-50 px-2 py-1 text-xs font-bold text-warning-600 dark:bg-warning-500/20 dark:text-warning-400 shrink-0">
                {item.quantity} left
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
