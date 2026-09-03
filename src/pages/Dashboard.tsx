import React, { useEffect, useState } from "react";
import { InventoryItem, SaleRecord } from "../db/schema";
import { getRecentSales } from "../db/posService";
import { getPayablesSummary } from "../db/payablesService";
import { DashboardStats } from "../components/dashboard/DashboardStats";
import { DashboardSalesChart } from "../components/dashboard/DashboardSalesChart";
import { RecentSalesWidget } from "../components/dashboard/RecentSalesWidget";
import { LowStockWidget } from "../components/dashboard/LowStockWidget";

interface DashboardPageProps {
  items: InventoryItem[];
  onNavigateToInventory: () => void;
  onNavigateToSales?: () => void;
  onNavigateToPCBuilder?: () => void;
  onNavigateToRepairs?: () => void;
  onNavigateToAdjustments?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  items,
  onNavigateToSales,
}) => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [totalPayables, setTotalPayables] = useState<number>(0);

  useEffect(() => {
    getRecentSales(500).then(setSales);
    getPayablesSummary().then((p) => setTotalPayables(p.totalOutstanding)).catch(console.error);
  }, []);

  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalValue = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
  const totalReceivables = sales.reduce((acc, s) => acc + Number(s.balanceDue || 0), 0);
  const lowStockItems = items.filter((i) => i.quantity <= 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time store metrics, dynamic sales charts, inventory valuation, and stock alerts
          </p>
        </div>
      </div>

      <DashboardStats
        totalUnits={totalUnits}
        totalValue={totalValue}
        totalRevenue={totalRevenue}
        lowStockCount={lowStockItems.length}
        totalReceivables={totalReceivables}
        totalPayables={totalPayables}
      />

      <DashboardSalesChart sales={sales} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentSalesWidget sales={sales} onNavigateToSales={onNavigateToSales} />
        <LowStockWidget lowStockItems={lowStockItems} />
      </div>
    </div>
  );
};
