import React from "react";
import { Package, Coins, TrendingUp, AlertTriangle, Building2, ArrowDownLeft } from "lucide-react";
import { StatCard } from "../ui/StatCard";

interface DashboardStatsProps {
  totalUnits: number;
  totalValue: number;
  totalRevenue: number;
  lowStockCount: number;
  totalReceivables?: number;
  totalPayables?: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalUnits,
  totalValue,
  totalRevenue,
  lowStockCount,
  totalReceivables,
  totalPayables,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Stock Units"
          value={totalUnits.toLocaleString()}
          icon={Package}
          description="Active items across all categories"
        />
        <StatCard
          title="Inventory Valuation"
          value={`PKR ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={Coins}
          description="Retail inventory worth"
        />
        <StatCard
          title="Total Sales Revenue"
          value={`PKR ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          description="Completed orders and invoices"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          icon={AlertTriangle}
          variant={lowStockCount > 0 ? "warning" : "default"}
          description={lowStockCount > 0 ? "Requires restock attention" : "All items well stocked"}
        />
      </div>

      {totalReceivables !== undefined && totalPayables !== undefined && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title="Total Receivables (Customer Dues)"
            value={`PKR ${totalReceivables.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={ArrowDownLeft}
            variant={totalReceivables > 0 ? "warning" : "default"}
            description="Outstanding balance to be collected from customers"
          />
          <StatCard
            title="Total Payables (Supplier Debts)"
            value={`PKR ${totalPayables.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={Building2}
            variant={totalPayables > 0 ? "warning" : "default"}
            description="Net amount owed to suppliers & vendors"
          />
        </div>
      )}
    </div>
  );
};

