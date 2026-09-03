import React from "react";
import { Users, ShieldCheck, Coins } from "lucide-react";
import { Customer } from "../../db/schema";
import { StatCard } from "../ui/StatCard";

interface CustomerStatsProps {
  customers: Customer[];
}

export const CustomerStats: React.FC<CustomerStatsProps> = ({ customers }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title="Total Customer Records"
        value={customers.length}
        icon={Users}
        description="Profiles registered in SQLite CRM"
      />
      <StatCard
        title="Active CRM Profiles"
        value={customers.filter((c) => c.phone).length}
        icon={ShieldCheck}
        description="Profiles with verified phone lines"
      />
      <StatCard
        title="Database Status"
        value="Offline & Safe"
        icon={Coins}
        description="Zero external cloud dependencies"
      />
    </div>
  );
};
