import React, { useState, useEffect } from "react";
import { ReportPeriod, ReportData, generateFinancialReport } from "../db/reportService";
import { ReportHeader } from "../components/reports/ReportHeader";
import { ReportSummaryCards } from "../components/reports/ReportSummaryCards";
import { ReportSalesChart } from "../components/reports/ReportSalesChart";
import { ReportPieChart } from "../components/reports/ReportPieChart";
import { ReportCategoryBreakdown } from "../components/reports/ReportCategoryBreakdown";
import { ReportFinancialTable } from "../components/reports/ReportFinancialTable";

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadReport = async (p: ReportPeriod) => {
    setLoading(true);
    try {
      const data = await generateFinancialReport(p);
      setReport(data);
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(period);
  }, [period]);

  return (
    <div className="space-y-6">
      <ReportHeader
        period={period}
        onPeriodChange={(p) => setPeriod(p)}
        onPrint={() => window.print()}
      />

      {loading || !report ? (
        <div className="py-20 text-center text-xs text-gray-400">
          Generating financial report data...
        </div>
      ) : (
        <div className="space-y-6">
          <ReportSummaryCards report={report} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReportSalesChart report={report} />
            </div>
            <div className="lg:col-span-1">
              <ReportPieChart report={report} />
            </div>
          </div>
          <ReportCategoryBreakdown report={report} />
          <ReportFinancialTable report={report} />
        </div>
      )}
    </div>
  );
};
