import React from "react";
import { Package, Coins, TrendingUp, AlertTriangle, Building2, ArrowDownLeft } from "lucide-react";
import { StatCard } from "../ui/StatCard";

interface DashboardStatsProps {
  totalUnits: number;
  totalValue: number;
  totalCostValue?: number;
  totalRevenue: number;
  totalDiscounts?: number;
  totalCashCollected?: number;
  lowStockCount: number;
  totalReceivables?: number;
  totalPayables?: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalUnits,
  totalValue,
  totalCostValue,
  totalRevenue,
  totalDiscounts = 0,
  totalCashCollected,
  lowStockCount,
  totalReceivables,
  totalPayables,
}) => {
  const potentialMargin = totalCostValue !== undefined ? totalValue - totalCostValue : 0;
  const marginPercent =
    totalCostValue && totalCostValue > 0 ? Math.round((potentialMargin / totalCostValue) * 100) : 0;

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
          description={
            totalCostValue !== undefined ? (
              <span className="flex flex-col gap-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span>Cost: PKR {totalCostValue.toLocaleString()}</span>
                <span className={potentialMargin >= 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"}>
                  Expected Margin: {potentialMargin >= 0 ? `+PKR ${potentialMargin.toLocaleString()}` : `-PKR ${Math.abs(potentialMargin).toLocaleString()}`} ({marginPercent}%)
                </span>
              </span>
            ) : (
              "Retail inventory worth"
            )
          }
        />
        <StatCard
          title="Total Sales Revenue"
          value={`PKR ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          description={
            totalCashCollected !== undefined ? (
              <span className="flex flex-col gap-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span>Cash In: PKR {totalCashCollected.toLocaleString()}</span>
                {totalDiscounts > 0 && (
                  <span className="text-warning-600 dark:text-warning-400 font-medium">
                    Discounts: -PKR {totalDiscounts.toLocaleString()}
                  </span>
                )}
              </span>
            ) : (
              "Completed orders and invoices"
            )
          }
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
            description={
              totalReceivables > 0
                ? "Uncollected customer balances (deducted from realized profit)"
                : "All customer accounts fully settled"
            }
          />
          <StatCard
            title="Total Payables (Supplier Debts)"
            value={`PKR ${totalPayables.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={Building2}
            variant={totalPayables > 0 ? "warning" : "default"}
            description="Net outstanding balance owed to vendors & suppliers"
          />
        </div>
      )}
    </div>
  );
};

