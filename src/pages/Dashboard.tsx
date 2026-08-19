import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Package,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ShoppingCart,
  Cpu,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { InventoryItem, SaleRecord } from "../db/schema";
import { getRecentSales } from "../db/posService";

interface DashboardPageProps {
  items: InventoryItem[];
  onNavigateToInventory: () => void;
  onNavigateToPOS?: () => void;
  onNavigateToPCBuilder?: () => void;
  onNavigateToRepairs?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  items,
  onNavigateToInventory,
  onNavigateToPOS,
  onNavigateToPCBuilder,
  onNavigateToRepairs,
}) => {
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);

  useEffect(() => {
    getRecentSales(5).then(setRecentSales);
  }, []);

  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalValue = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const categoriesCount = new Set(items.map((i) => i.title)).size;
  const lowStockItems = items.filter((i) => i.quantity <= 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time store metrics, inventory valuation, and sales velocity
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button onClick={onNavigateToPOS} className="tail-btn-primary">
            <ShoppingCart className="size-4" />
            <span>New Sale (F2)</span>
          </button>
        </div>
      </div>

      {/* TailAdmin Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Value Metric */}
        <div className="tail-card">
          <div className="flex items-center justify-between">
            <div className="tail-metric-icon bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
              <DollarSign className="size-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-600 dark:bg-success-500/15 dark:text-success-400">
              <ArrowUpRight className="size-3.5" /> +14.8%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Inventory Value
            </span>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Total SKUs Metric */}
        <div className="tail-card">
          <div className="flex items-center justify-between">
            <div className="tail-metric-icon bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
              <Package className="size-6" />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {categoriesCount} Categories
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Hardware SKUs
            </span>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {items.length} Products
            </h3>
          </div>
        </div>

        {/* Stock Units Metric */}
        <div className="tail-card">
          <div className="flex items-center justify-between">
            <div className="tail-metric-icon bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400">
              <TrendingUp className="size-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              In Stock
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Physical Stock Units
            </span>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {totalUnits} Units
            </h3>
          </div>
        </div>

        {/* Low Stock Metric */}
        <div className="tail-card">
          <div className="flex items-center justify-between">
            <div
              className={`tail-metric-icon ${
                lowStockItems.length > 0
                  ? "bg-warning-50 text-warning-500 dark:bg-warning-500/15 dark:text-warning-400"
                  : "bg-success-50 text-success-500 dark:bg-success-500/15 dark:text-success-400"
              }`}
            >
              <AlertTriangle className="size-6" />
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                lowStockItems.length > 0
                  ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400"
                  : "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
              }`}
            >
              {lowStockItems.length > 0 ? "Needs Reorder" : "Healthy"}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {lowStockItems.length} Items
            </h3>
          </div>
        </div>
      </div>

      {/* Quick Launchpad */}
      <div className="tail-card">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          Quick Operations Launchpad
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={onNavigateToPOS}
            className="group flex flex-col items-start p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-brand-50/50 hover:border-brand-300 transition-all text-left dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-500 text-white mb-3 shadow-theme-xs group-hover:scale-105 transition-transform">
              <ShoppingCart className="size-5" />
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
              Point of Sale (POS)
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Fast barcode checkout, serial number scan, and receipt printing
            </p>
          </button>

          <button
            onClick={onNavigateToInventory}
            className="group flex flex-col items-start p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-brand-50/50 hover:border-brand-300 transition-all text-left dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500 text-white mb-3 shadow-theme-xs group-hover:scale-105 transition-transform">
              <Package className="size-5" />
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
              Inventory & Serials
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Add products, adjust stock quantities, and inspect serial numbers
            </p>
          </button>

          <button
            onClick={onNavigateToPCBuilder}
            className="group flex flex-col items-start p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-brand-50/50 hover:border-brand-300 transition-all text-left dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500 text-white mb-3 shadow-theme-xs group-hover:scale-105 transition-transform">
              <Cpu className="size-5" />
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
              Custom PC Builder
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Configure PC rigs with dynamic wattage check and instant quotation
            </p>
          </button>

          <button
            onClick={onNavigateToRepairs}
            className="group flex flex-col items-start p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-brand-50/50 hover:border-brand-300 transition-all text-left dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white mb-3 shadow-theme-xs group-hover:scale-105 transition-transform">
              <Wrench className="size-5" />
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
              Repairs & RMA Tickets
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Track customer hardware repair jobs, diagnostics, and RMA claims
            </p>
          </button>
        </div>
      </div>

      {/* Recent Invoices Table & Low Stock List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Invoices Table */}
        <div className="tail-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Recent Store Invoices
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Live sales recorded in SQLite database
              </p>
            </div>

            <button
              onClick={onNavigateToPOS}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Open POS
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-500">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                      No sales recorded yet. Click "New Sale (F2)" to begin.
                    </td>
                  </tr>
                ) : (
                  recentSales.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-gray-900 dark:text-white">
                        {order.invoiceNo}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800 dark:text-gray-200">
                        {order.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold dark:bg-gray-800">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-600 dark:bg-success-500/15 dark:text-success-400">
                          <CheckCircle2 className="size-3" /> PAID
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warning List */}
        <div className="tail-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning-500" />
                Low Stock Alerts
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Items requiring restock soon
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="size-8 text-success-500 mb-2" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  All inventory levels healthy!
                </p>
                <span className="text-[11px] text-gray-400">No items below 5 units</span>
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">{item.sku}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-lg bg-warning-50 px-2 py-1 text-xs font-bold text-warning-600 dark:bg-warning-500/20 dark:text-warning-400">
                      {item.quantity} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
