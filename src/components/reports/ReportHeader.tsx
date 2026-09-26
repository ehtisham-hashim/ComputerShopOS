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
        <div className="flex items-center gap-2.5">
          {isArchiveDetail && onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="tail-btn-secondary-sm p-2"
              title="Back to History Archive"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="size-6 text-brand-500" />
            <span>Monthly Report — {monthLabel}</span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isArchiveDetail
            ? `Viewing archived financial statement and day-by-day performance for ${monthLabel}`
            : `Live sales, gross profits, shop expenses, and true net earnings for ${monthLabel}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {!isArchiveDetail && onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="tail-btn-secondary-sm flex items-center gap-1.5"
          >
            <History className="size-4 text-brand-500" />
            <span>Monthly Archive</span>
          </button>
        )}

        <button onClick={onPrint} className="tail-btn-primary-sm flex items-center gap-1.5">
          <Printer className="size-4" />
          <span>Print Statement</span>
        </button>
      </div>
    </div>
  );
};
