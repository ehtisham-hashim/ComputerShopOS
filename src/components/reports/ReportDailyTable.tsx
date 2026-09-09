import React, { useState } from "react";
import { DailyReportRow } from "../../db/schema";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface ReportDailyTableProps {
  dailyData: DailyReportRow[];
  totalSales: number;
  totalGrossProfit: number;
}

export const ReportDailyTable: React.FC<ReportDailyTableProps> = ({
  dailyData,
  totalSales,
  totalGrossProfit,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const activeDays = dailyData.filter((d) => d.sales > 0 || d.grossProfit > 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs overflow-hidden">
      {/* Table Header / Collapse Toggle */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Calendar className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Daily Sales & Gross Profit Calendar Detail
            </h3>
            <p className="text-xs text-gray-400">
              {activeDays.length} active sales days • Total Sales: Rs. {totalSales.toLocaleString()} • Total GP: Rs. {totalGrossProfit.toLocaleString()}
            </p>
          </div>
        </div>

        <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          {isCollapsed ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/90 backdrop-blur-sm text-gray-500 font-bold uppercase tracking-wider text-[10px] z-10">
              <tr>
                <th className="px-5 py-3">Day #</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Day</th>
                <th className="px-5 py-3 text-right">Daily Sale</th>
                <th className="px-5 py-3 text-right">Gross Profit (GP)</th>
                <th className="px-5 py-3 text-right">Margin %</th>
                <th className="px-5 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {dailyData.map((row) => {
                const margin = row.sales > 0 ? Math.round((row.grossProfit / row.sales) * 100) : 0;
                const hasActivity = row.sales > 0 || row.grossProfit > 0;

                return (
                  <tr
                    key={row.day}
                    className={`transition-colors ${
                      hasActivity
                        ? "hover:bg-brand-50/30 dark:hover:bg-brand-950/20"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <td className="px-5 py-2.5 font-bold text-gray-500">{row.day}</td>
                    <td className="px-5 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                      {row.date}
                    </td>
                    <td className="px-5 py-2.5 font-medium text-gray-500">{row.dayOfWeek}</td>
                    <td className="px-5 py-2.5 text-right font-bold text-gray-900 dark:text-white">
                      {row.sales > 0 ? `Rs. ${row.sales.toLocaleString()}` : "0"}
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {row.grossProfit > 0 ? `Rs. ${row.grossProfit.toLocaleString()}` : "0"}
                    </td>
                    <td className="px-5 py-2.5 text-right text-gray-400 text-[11px]">
                      {row.sales > 0 ? `${margin}%` : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-gray-400 text-[11px]">
                      {row.remarks || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 font-bold border-t-2 border-gray-200 dark:border-gray-700 text-xs">
              <tr>
                <td colSpan={3} className="px-5 py-3 text-gray-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Total for Month
                </td>
                <td className="px-5 py-3 text-right text-gray-900 dark:text-white">
                  Rs. {totalSales.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400">
                  Rs. {totalGrossProfit.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right text-gray-500">
                  {totalSales > 0 ? `${Math.round((totalGrossProfit / totalSales) * 100)}%` : "0%"}
                </td>
                <td className="px-5 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
