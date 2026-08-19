import React from "react";
import { Banknote, CreditCard, Split } from "lucide-react";
import { ReportData } from "../../db/reportService";

interface ReportCategoryBreakdownProps {
  report: ReportData;
}

export const ReportCategoryBreakdown: React.FC<ReportCategoryBreakdownProps> = ({ report }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="tail-card space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Top Selling Products</h3>
            <p className="text-xs text-gray-400">Best performers by volume and revenue</p>
          </div>
        </div>
        <div className="space-y-2">
          {report.topProducts.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No sales recorded in this period.</p>
          ) : (
            report.topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-brand-50 font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 shrink-0">{idx + 1}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-gray-400 font-medium">{p.quantity} units</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">PKR {p.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="tail-card space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Payment Methods Tendered</h3>
            <p className="text-xs text-gray-400">Cash vs digital card vs split collection</p>
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-xs">
            <span className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300"><Banknote className="size-4" /> Physical Cash</span>
            <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">PKR {report.paymentBreakdown.cash.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-xs">
            <span className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300"><CreditCard className="size-4" /> Debit / Credit Card</span>
            <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300">PKR {report.paymentBreakdown.card.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 text-xs">
            <span className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300"><Split className="size-4" /> Split Payment</span>
            <span className="font-mono font-bold text-sm text-purple-700 dark:text-purple-300">PKR {report.paymentBreakdown.split.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
