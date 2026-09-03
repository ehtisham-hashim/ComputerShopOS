import React from "react";
import { Building2, ArrowDownLeft, ArrowUpRight, AlertTriangle } from "lucide-react";
import { StatCard } from "../ui/StatCard";

interface PayablesStatsProps {
  totalOutstanding: number;
  totalPurchases: number;
  totalPaid: number;
  activeSuppliersCount: number;
}

export const PayablesStats: React.FC<PayablesStatsProps> = ({
  totalOutstanding,
  totalPurchases,
  totalPaid,
  activeSuppliersCount,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Payables Owed"
        value={`PKR ${totalOutstanding.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        icon={AlertTriangle}
        variant={totalOutstanding > 0 ? "warning" : "default"}
        description={totalOutstanding > 0 ? "Net balance owed to suppliers" : "All supplier accounts cleared"}
      />
      <StatCard
        title="Total Purchases (Credit)"
        value={`PKR ${totalPurchases.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        icon={ArrowDownLeft}
        description="Total billed inventory & parts"
      />
      <StatCard
        title="Total Paid / Returned (Debit)"
        value={`PKR ${totalPaid.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        icon={ArrowUpRight}
        description="Money paid or goods returned"
      />
      <StatCard
        title="Active Creditors"
        value={activeSuppliersCount}
        icon={Building2}
        description="Suppliers with outstanding balances"
      />
    </div>
  );
};
