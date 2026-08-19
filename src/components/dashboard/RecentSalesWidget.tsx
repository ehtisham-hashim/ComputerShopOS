import React from "react";
import { ShoppingCart } from "lucide-react";
import { SaleRecord } from "../../db/schema";
import { StatusBadge } from "../ui/StatusBadge";

interface RecentSalesWidgetProps {
  sales: SaleRecord[];
  onNavigateToSales?: () => void;
}

export const RecentSalesWidget: React.FC<RecentSalesWidgetProps> = ({
  sales,
  onNavigateToSales,
}) => {
  return (
    <div className="tail-card space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest customer invoices</p>
        </div>
        {onNavigateToSales && (
          <button onClick={onNavigateToSales} className="tail-btn-secondary text-xs">View All</button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-500">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-gray-400">
                  <ShoppingCart className="size-6 mx-auto mb-1 opacity-40" />
                  No transactions yet
                </td>
              </tr>
            ) : (
              sales.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-500">{order.invoiceNo}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{order.customerName}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">PKR {Number(order.totalAmount || 0).toLocaleString()}</td>
                  <td className="py-3.5 px-4"><StatusBadge status={order.paymentStatus || "PAID"} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
