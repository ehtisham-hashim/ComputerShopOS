import React from "react";
import { DollarSign, TrendingUp, TrendingDown, Receipt, Clock, Building2 } from "lucide-react";
import { ReportData } from "../../db/reportService";
import { StatCard } from "../ui/StatCard";

interface ReportSummaryCardsProps {
  report: ReportData;
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ report }) => {
  const isProfitable = report.netProfit >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gross Sales Invoiced"
          value={`Rs. ${report.grossSales.toLocaleString()}`}
          icon={DollarSign}
          description={`${report.totalTransactions} transactions in month`}
        />
        <StatCard
          title="Estimated Gross Profit"
          value={`Rs. ${report.grossProfit.toLocaleString()}`}
          icon={TrendingUp}
          description={`${report.marginPercent}% gross margin`}
        />
        <StatCard
          title="Total Operating Expenses"
          value={`Rs. ${report.totalExpenses.toLocaleString()}`}
          icon={Receipt}
          variant={report.totalExpenses > 0 ? "warning" : "default"}
          description="Rent, salaries, bills & overheads"
        />
        <StatCard
          title="True Net Profit"
          value={`Rs. ${report.netProfit.toLocaleString()}`}
          icon={isProfitable ? TrendingUp : TrendingDown}
          variant={isProfitable ? "default" : "warning"}
          description={isProfitable ? "Gross Profit − Operating Expenses" : "Operating at a deficit this month"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Customer Receivables (Uncollected)"
          value={`Rs. ${report.receivables.toLocaleString()}`}
          icon={Clock}
          variant={report.receivables > 0 ? "warning" : "default"}
          description={report.receivables > 0 ? "Outstanding customer invoice dues" : "All customer accounts cleared"}
        />
        <StatCard
          title="Supplier Payables (Vendor Debts)"
          value={`Rs. ${report.payables.toLocaleString()}`}
          icon={Building2}
          variant={report.payables > 0 ? "warning" : "default"}
          description={report.payables > 0 ? "Net balance owed to suppliers" : "All vendor accounts settled"}
        />
      </div>
    </div>
  );
};
