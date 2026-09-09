import React, { useState, useEffect } from "react";
import {
  getMonthlyReport,
  getMonthlyReportsHistory,
  MonthlyReportViewData,
} from "../db/reportService";
import { ReportHeader } from "../components/reports/ReportHeader";
import { ReportSummaryCards } from "../components/reports/ReportSummaryCards";
import { ReportDailyTable } from "../components/reports/ReportDailyTable";
import { ReportSalesChart } from "../components/reports/ReportSalesChart";
import { ReportPieChart } from "../components/reports/ReportPieChart";
import { ReportCategoryBreakdown } from "../components/reports/ReportCategoryBreakdown";
import { ReportFinancialTable } from "../components/reports/ReportFinancialTable";
import { ReportHistoryList, MonthlyHistoryItem } from "../components/reports/ReportHistoryList";

export type ReportViewMode = "current" | "history" | "archive_detail";

export const ReportsPage: React.FC = () => {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ReportViewMode>("current");
  const [selectedArchive, setSelectedArchive] = useState<{ year: number; month: number } | null>(null);

  // Current or Detail Report state
  const [report, setReport] = useState<MonthlyReportViewData | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(true);

  // History state
  const [history, setHistory] = useState<MonthlyHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const loadReportData = async (year: number, month: number) => {
    setLoadingReport(true);
    try {
      const data = await getMonthlyReport(year, month);
      setReport(data);
    } catch (err) {
      console.error("Failed to generate monthly report:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  const loadHistoryData = async () => {
    setLoadingHistory(true);
    try {
      const data = await getMonthlyReportsHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load monthly history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // View state transitions
  useEffect(() => {
    if (viewMode === "current") {
      loadReportData(now.getFullYear(), now.getMonth() + 1);
    } else if (viewMode === "history") {
      loadHistoryData();
    } else if (viewMode === "archive_detail" && selectedArchive) {
      loadReportData(selectedArchive.year, selectedArchive.month);
    }
  }, [viewMode, selectedArchive]);

  // If in history view, show single-line scrollable containers
  if (viewMode === "history") {
    return (
      <ReportHistoryList
        history={history}
        loading={loadingHistory}
        onBackToCurrent={() => setViewMode("current")}
        onSelectMonth={(year, month) => {
          setSelectedArchive({ year, month });
          setViewMode("archive_detail");
        }}
      />
    );
  }

  // Active / Archive Detail Report View
  const isArchive = viewMode === "archive_detail";

  return (
    <div className="space-y-6">
      <ReportHeader
        monthLabel={report?.monthLabel || "Loading..."}
        isArchiveDetail={isArchive}
        onOpenHistory={() => setViewMode("history")}
        onBackToHistory={() => setViewMode("history")}
        onPrint={() => window.print()}
      />

      {loadingReport || !report ? (
        <div className="py-20 text-center text-xs text-gray-400">
          Generating monthly financial report data...
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <ReportSummaryCards report={report} />

          {/* Daily Calendar Breakdown (Matching Real Shop Excel Sheet) */}
          <ReportDailyTable
            dailyData={report.dailyData}
            totalSales={report.grossSales}
            totalGrossProfit={report.grossProfit}
          />

          {/* Revenue & Margin Visualizations */}
          {report.trendData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ReportSalesChart report={report} />
              </div>
              <div className="lg:col-span-1">
                <ReportPieChart report={report} />
              </div>
            </div>
          )}

          {/* Categories & Full Financial Statement */}
          {report.categoryBreakdown.length > 0 && (
            <ReportCategoryBreakdown report={report} />
          )}

          <ReportFinancialTable report={report} />
        </div>
      )}
    </div>
  );
};
