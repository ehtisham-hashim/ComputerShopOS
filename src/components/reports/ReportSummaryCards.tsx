import React from "react";
import { DollarSign, TrendingUp, Wallet, Clock } from "lucide-react";
import { ReportData } from "../../db/reportService";
import { StatCard } from "../ui/StatCard";

interface ReportSummaryCardsProps {
  report: ReportData;
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ report }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Gross Sales Invoiced"
        value={`PKR ${report.grossSales.toLocaleString()}`}
        icon={DollarSign}
        description={`${report.totalTransactions} invoices in period`}
      />
      <StatCard
        title="Estimated Gross Profit"
        value={`PKR ${report.grossProfit.toLocaleString()}`}
        icon={TrendingUp}
        description={`${report.marginPercent}% estimated margin`}
      />
      <StatCard
        title="Total Net Store Income"
        value={`PKR ${report.totalNetIncome.toLocaleString()}`}
        icon={Wallet}
        description="Includes sales, repairs & swaps"
      />
      <StatCard
        title="Outstanding Receivables"
        value={`PKR ${report.receivables.toLocaleString()}`}
        icon={Clock}
        variant={report.receivables > 0 ? "warning" : "default"}
        description={report.receivables > 0 ? "Uncollected customer dues" : "Zero unpaid balance"}
      />
    </div>
  );
};
