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
          title="Total Sales"
          value={`Rs. ${report.grossSales.toLocaleString()}`}
          icon={DollarSign}
          description={`${report.totalTransactions} transactions this month`}
        />
        <StatCard
          title="Gross Sales Profit"
          value={`Rs. ${report.grossProfit.toLocaleString()}`}
          icon={TrendingUp}
          description={`${report.marginPercent}% profit margin on sales`}
        />
        <StatCard
          title="Shop Expenses"
          value={`Rs. ${report.totalExpenses.toLocaleString()}`}
          icon={Receipt}
          variant={report.totalExpenses > 0 ? "warning" : "default"}
          description="Rent, electricity, staff salaries & tea"
        />
        <StatCard
          title="Final Net Profit"
          value={`Rs. ${report.netProfit.toLocaleString()}`}
          icon={isProfitable ? TrendingUp : TrendingDown}
          variant={isProfitable ? "default" : "warning"}
          description={isProfitable ? "Take-home profit after all expenses" : "Operating at a deficit this month"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Customer Udhaar (To Collect)"
          value={`Rs. ${report.receivables.toLocaleString()}`}
          icon={Clock}
          variant={report.receivables > 0 ? "warning" : "default"}
          description={report.receivables > 0 ? "Pending customer credit dues to recover" : "All customer accounts cleared"}
        />
        <StatCard
          title="Supplier Khata (To Pay)"
          value={`Rs. ${report.payables.toLocaleString()}`}
          icon={Building2}
          variant={report.payables > 0 ? "warning" : "default"}
          description={report.payables > 0 ? "Net balance owed to market vendors" : "All supplier accounts cleared"}
        />
      </div>
    </div>
  );
};
