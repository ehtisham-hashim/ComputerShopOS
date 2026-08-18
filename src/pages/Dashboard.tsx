import React from "react";
import { Layers, Package, TrendingUp, DollarSign } from "lucide-react";
import { InventoryItem } from "../db/schema";

interface DashboardPageProps {
  items: InventoryItem[];
  onNavigateToInventory: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  items,
  onNavigateToInventory,
}) => {
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalValue = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const categoriesCount = new Set(items.map((i) => i.title)).size;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">ComputerShopOS Operations & Statistics</p>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total SKUs</span>
            <Package size={18} className="metric-icon-small" />
          </div>
          <span className="metric-value">{items.length}</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Stock Units</span>
            <TrendingUp size={18} className="metric-icon-small" />
          </div>
          <span className="metric-value">{totalUnits}</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Categories</span>
            <Layers size={18} className="metric-icon-small" />
          </div>
          <span className="metric-value">{categoriesCount}</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Value</span>
            <DollarSign size={18} className="metric-icon-small" />
          </div>
          <span className="metric-value highlight">
            ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="dashboard-content-box">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-cards">
          <div className="action-card" onClick={onNavigateToInventory}>
            <Package size={28} className="action-card-icon" />
            <h3>Manage Inventory</h3>
            <p>Add new stock, review categories, and update product quantities in SQLite database.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
