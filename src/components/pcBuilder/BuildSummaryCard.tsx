import React from "react";
import { Zap } from "lucide-react";
import { StatCard } from "../ui/StatCard";

interface BuildSummaryCardProps {
  selectedCount: number;
  totalSlots: number;
  totalWatts: number;
  recommendedPSUWatts: number;
  totalPrice: number;
}

export const BuildSummaryCard: React.FC<BuildSummaryCardProps> = ({
  selectedCount,
  totalSlots,
  totalWatts,
  recommendedPSUWatts,
  totalPrice,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title="Components Selected"
        value={`${selectedCount} / ${totalSlots}`}
        description="Parts Configured"
      />
      <StatCard
        title="Estimated Power (TDP)"
        value={`~${totalWatts} W`}
        icon={Zap}
        variant="warning"
        description={`(Recommend ${recommendedPSUWatts}W+ PSU)`}
      />
      <StatCard
        title="Total Build Cost"
        value={`PKR ${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        variant="default"
        description="Combined retail price"
      />
    </div>
  );
};
