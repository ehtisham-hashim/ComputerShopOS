import React from "react";
import { Wrench, Clock, CheckCircle2, Package } from "lucide-react";
import { RepairTicketRecord } from "../../db/schema";
import { StatCard } from "../ui/StatCard";

interface RepairStatsProps {
  tickets: RepairTicketRecord[];
}

export const RepairStats: React.FC<RepairStatsProps> = ({ tickets }) => {
  const activeCount = tickets.filter((t) => t.status !== "DELIVERED").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const readyCount = tickets.filter((t) => t.status === "READY").length;
  const deliveredCount = tickets.filter((t) => t.status === "DELIVERED").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active RMA Tickets"
        value={activeCount}
        icon={Wrench}
        description="In-shop repair and service jobs"
      />
      <StatCard
        title="In Progress / Bench"
        value={inProgressCount}
        icon={Clock}
        variant={inProgressCount > 0 ? "warning" : "default"}
        description="Currently under diagnostic or repair"
      />
      <StatCard
        title="Ready for Pickup"
        value={readyCount}
        icon={CheckCircle2}
        variant={readyCount > 0 ? "default" : "default"}
        description="Completed & awaiting customer pickup"
      />
      <StatCard
        title="Delivered / Closed"
        value={deliveredCount}
        icon={Package}
        description="Completed service tickets"
      />
    </div>
  );
};
