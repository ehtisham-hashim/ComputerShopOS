import React from "react";
import { ArrowLeftRight, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { AdjustmentRecord } from "../../db/schema";
import { StatCard } from "../ui/StatCard";

interface AdjustmentStatsProps {
  adjustments: AdjustmentRecord[];
}

export const AdjustmentStats: React.FC<AdjustmentStatsProps> = ({ adjustments }) => {
  const pendingCount = adjustments.filter((a) => a.paymentStatus !== "PAID").length;
  const inflow = adjustments.filter((a) => a.netDifference > 0).reduce((acc, a) => acc + a.netDifference, 0);
  const outflow = Math.abs(adjustments.filter((a) => a.netDifference < 0).reduce((acc, a) => acc + a.netDifference, 0));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Swaps Recorded"
        value={adjustments.length}
        icon={ArrowLeftRight}
        description="Trade-ins and exchange deals"
      />
      <StatCard
        title="Customer Net Inflow"
        value={`PKR ${inflow.toLocaleString()}`}
        icon={TrendingUp}
        description="Amount received from customers"
      />
      <StatCard
        title="Store Net Outflow"
        value={`PKR ${outflow.toLocaleString()}`}
        icon={TrendingDown}
        description="Cash refunded / store payouts"
      />
      <StatCard
        title="Pending Adjustments"
        value={pendingCount}
        icon={Clock}
        variant={pendingCount > 0 ? "warning" : "default"}
        description={pendingCount > 0 ? "Unpaid / partial swap balances" : "All balances settled"}
      />
    </div>
  );
};
