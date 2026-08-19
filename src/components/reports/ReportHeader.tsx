import React from "react";
import { BarChart3, Printer } from "lucide-react";
import { ReportPeriod } from "../../db/reportService";

interface ReportHeaderProps {
  period: ReportPeriod;
  onPeriodChange: (p: ReportPeriod) => void;
  onPrint: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  period,
  onPeriodChange,
  onPrint,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="size-6 text-brand-500" />
          Financial Reports & Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Store revenue, profit margins, repair income, trade-ins, and financial breakdown
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 text-xs font-bold">
          {(["monthly", "yearly", "lifetime"] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                period === p
                  ? "bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-theme-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {p === "monthly" ? "This Month" : p === "yearly" ? "This Year" : "All Time"}
            </button>
          ))}
        </div>

        <button onClick={onPrint} className="tail-btn-primary text-xs">
          <Printer className="size-4" />
          <span>Print Statement</span>
        </button>
      </div>
    </div>
  );
};
