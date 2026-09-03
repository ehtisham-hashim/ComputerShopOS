import React from "react";
import { Coins, Receipt, Clock, AlertCircle } from "lucide-react";
import { SaleRecord } from "../../db/schema";
import { StatCard } from "../ui/StatCard";

interface SalesStatsProps {
  sales: SaleRecord[];
}

export const SalesStats: React.FC<SalesStatsProps> = ({ sales }) => {
  const totalRevenue = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const paidRevenue = sales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
  const receivables = sales.reduce((acc, s) => acc + (s.balanceDue || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Invoiced Gross"
        value={`PKR ${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        icon={Coins}
        description="All recorded sales gross volume"
      />
      <StatCard
        title="Collected / Paid Revenue"
        value={`PKR ${paidRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        icon={Receipt}
        description="Liquid cash and card receipts"
      />
      <StatCard
        title="Outstanding Receivables"
        value={`PKR ${receivables.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        icon={AlertCircle}
        variant={receivables > 0 ? "warning" : "default"}
        description={receivables > 0 ? "Uncollected customer debt" : "Zero credit balance due"}
      />
      <StatCard
        title="Total Invoices Count"
        value={sales.length}
        icon={Clock}
        description="Transactions recorded in SQLite"
      />
    </div>
  );
};
