import React from "react";
import { BarChart3, Printer, History, ArrowLeft } from "lucide-react";

interface ReportHeaderProps {
  monthLabel: string;
  isArchiveDetail?: boolean;
  onOpenHistory?: () => void;
  onBackToHistory?: () => void;
  onPrint: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  monthLabel,
  isArchiveDetail = false,
  onOpenHistory,
  onBackToHistory,
  onPrint,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          {isArchiveDetail && onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Back to History Archive"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="size-6 text-brand-500" />
            <span>Monthly Report — {monthLabel}</span>
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {isArchiveDetail
            ? `Viewing archived financial statement and day-by-day performance for ${monthLabel}`
            : `Live sales, gross profits, shop expenses, and true net earnings for ${monthLabel}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {!isArchiveDetail && onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 transition-all shadow-sm"
          >
            <History className="size-4" />
            <span>History (Past Months) ➔</span>
          </button>
        )}

        <button onClick={onPrint} className="tail-btn-primary text-xs flex items-center gap-1.5">
          <Printer className="size-4" />
          <span>Print Statement</span>
        </button>
      </div>
    </div>
  );
};
