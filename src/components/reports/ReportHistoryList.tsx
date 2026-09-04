import React from "react";
import { ArrowLeft, ChevronRight, Calendar, TrendingUp, TrendingDown } from "lucide-react";

export interface MonthlyHistoryItem {
  year: number;
  month: number;
  monthLabel: string;
  grossSales: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  status: "OPEN" | "CLOSED";
}

interface ReportHistoryListProps {
  history: MonthlyHistoryItem[];
  onSelectMonth: (year: number, month: number) => void;
  onBackToCurrent: () => void;
  loading: boolean;
}

export const ReportHistoryList: React.FC<ReportHistoryListProps> = ({
  history,
  onSelectMonth,
  onBackToCurrent,
  loading,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCurrent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-theme-xs"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Current Month</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Monthly Reports Archive
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Select any past month to view its complete financial statement, daily breakdown, and charts
            </p>
          </div>
        </div>
      </div>

      {/* History List Containers */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading historical reports...</div>
      ) : history.length === 0 ? (
        <div className="py-20 text-center text-xs text-gray-400">No monthly archives recorded yet.</div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const isProfitable = item.netProfit >= 0;
            const margin = item.grossSales > 0 ? Math.round((item.grossProfit / item.grossSales) * 100) : 0;

            return (
              <div
                key={`${item.year}-${item.month}`}
                onClick={() => onSelectMonth(item.year, item.month)}
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-theme-xs hover:border-brand-500/50 hover:shadow-theme-md transition-all cursor-pointer gap-4"
              >
                {/* Month & Status */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="size-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
                    <Calendar className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                      {item.monthLabel}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === "OPEN"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {item.status === "OPEN" ? "Active Month" : "Archived"}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {margin}% GP Margin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics Row (Single-line container) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Sales</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      Rs. {item.grossSales.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Gross Profit</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {item.grossProfit.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Expenses</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      Rs. {item.totalExpenses.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Net Profit</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {isProfitable ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                      Rs. {item.netProfit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Arrow Action */}
                <div className="flex items-center justify-end md:justify-center">
                  <div className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform">
                    <span>View Report</span>
                    <ChevronRight className="size-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
