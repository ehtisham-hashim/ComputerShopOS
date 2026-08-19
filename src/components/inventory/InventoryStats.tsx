import React from "react";
import { Package, Layers, Coins, AlertCircle } from "lucide-react";
import { InventoryItem } from "../../db/schema";
import { StatCard } from "../ui/StatCard";

interface InventoryStatsProps {
  items: InventoryItem[];
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({ items }) => {
  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalValuation = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const lowStockCount = items.filter((i) => i.quantity <= 5).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total SKUs"
        value={items.length}
        icon={Package}
        description="Unique hardware products"
      />
      <StatCard
        title="Total Stock Units"
        value={totalQuantity}
        icon={Layers}
        description="Units available in shop"
      />
      <StatCard
        title="Inventory Valuation"
        value={`PKR ${totalValuation.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        icon={Coins}
        description="Total retail shelf worth"
      />
      <StatCard
        title="Low Stock Alerts"
        value={lowStockCount}
        icon={AlertCircle}
        variant={lowStockCount > 0 ? "warning" : "default"}
        description={lowStockCount > 0 ? "Items with <= 5 units" : "All stock healthy"}
      />
    </div>
  );
};
