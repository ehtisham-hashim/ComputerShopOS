import React, { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Cpu,
  Wrench,
  CheckCircle2,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { InventoryItem, SaleRecord } from "../db/schema";
import { getRecentSales } from "../db/posService";
import { StatCard } from "../components/ui/StatCard";

interface DashboardPageProps {
  items: InventoryItem[];
  onNavigateToInventory: () => void;
  onNavigateToSales?: () => void;
  onNavigateToPCBuilder?: () => void;
  onNavigateToRepairs?: () => void;
  onNavigateToAdjustments?: () => void;
}

type Timeframe = "weekly" | "monthly" | "yearly";

export const DashboardPage: React.FC<DashboardPageProps> = ({
  items,
  onNavigateToInventory,
  onNavigateToSales,
  onNavigateToPCBuilder,
  onNavigateToRepairs,
  onNavigateToAdjustments,
}) => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

  useEffect(() => {
    getRecentSales(100).then(setSales);
  }, []);

  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalValue = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const lowStockItems = items.filter((i) => i.quantity <= 5);

  // Recharts Sales Bar Chart Aggregation
  const chartData = useMemo(() => {
    const now = new Date();

    if (timeframe === "weekly") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dataMap: Record<string, number> = {};
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayKey = days[d.getDay()];
        dataMap[dayKey] = 0;
      }

      sales.forEach((s) => {
        const sDate = new Date(s.createdAt * 1000);
        const diffDays = Math.floor((now.getTime() - sDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 7) {
          const dayKey = days[sDate.getDay()];
          dataMap[dayKey] = (dataMap[dayKey] || 0) + s.totalAmount;
        }
      });

      return Object.entries(dataMap).map(([name, amount]) => ({
        name,
        revenue: Math.round(amount),
      }));
    }

    if (timeframe === "monthly") {
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const dataMap: Record<string, number> = { "Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0 };

      sales.forEach((s) => {
        const sDate = new Date(s.createdAt * 1000);
        const diffDays = Math.floor((now.getTime() - sDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 28) {
          if (diffDays <= 7) dataMap["Week 4"] += s.totalAmount;
          else if (diffDays <= 14) dataMap["Week 3"] += s.totalAmount;
          else if (diffDays <= 21) dataMap["Week 2"] += s.totalAmount;
          else dataMap["Week 1"] += s.totalAmount;
        }
      });

      return weeks.map((name) => ({
        name,
        revenue: Math.round(dataMap[name] || 0),
      }));
    }

    // Yearly
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataMap: Record<string, number> = {};
    months.forEach((m) => (dataMap[m] = 0));

    sales.forEach((s) => {
      const sDate = new Date(s.createdAt * 1000);
      if (sDate.getFullYear() === now.getFullYear()) {
        const monthKey = months[sDate.getMonth()];
        dataMap[monthKey] = (dataMap[monthKey] || 0) + s.totalAmount;
      }
    });

    return months.map((name) => ({
      name,
      revenue: Math.round(dataMap[name] || 0),
    }));
  }, [sales, timeframe]);

  const totalPeriodRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time store metrics, dynamic sales charts, inventory valuation, and quick actions
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button onClick={onNavigateToSales} className="tail-btn-primary">
            <ShoppingCart className="size-4" />
            <span>New Sale (F2)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Stock Value"
          value={`PKR ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          valueColor="success"
          icon={<DollarSign className="size-5" />}
          subtitle={<span className="text-success-600 dark:text-success-400 font-semibold">+14.8% vs last month</span>}
        />
        <StatCard
          title="Catalog SKUs"
          value={items.length}
          icon={<Package className="size-5" />}
          subtitle={`${items.filter((i) => i.isSerialized === 1).length} serialized items`}
        />
        <StatCard
          title="Shelf Inventory"
          value={totalUnits}
          valueColor="brand"
          icon={<TrendingUp className="size-5" />}
          subtitle="Physical Units in Stock"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          valueColor={lowStockItems.length > 0 ? "warning" : "default"}
          icon={<AlertTriangle className="size-5" />}
          subtitle={lowStockItems.length > 0 ? "Requires restock" : "Levels healthy"}
        />
      </div>

      {/* Recharts Sales Revenue Bar Chart */}
      <div className="tail-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="size-5 text-brand-500" />
              Sales Revenue Velocity
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total period sales: <span className="font-bold text-gray-900 dark:text-white">PKR {totalPeriodRevenue.toLocaleString()}</span>
            </p>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="flex items-center rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {(["weekly", "monthly", "yearly"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                  timeframe === tf
                    ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Render */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.25} vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `Rs.${val}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  borderRadius: "0.75rem",
                  color: "#f4f4f5",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
                formatter={(value: any) => [`PKR ${Number(value).toFixed(2)}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Operations Launchpad */}
      <div className="tail-card">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          Quick Operations Launchpad
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <button
            onClick={onNavigateToSales}
            className="group flex flex-col items-start p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-brand-50/50 hover:border-brand-300 transition-all text-left dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-500 text-white mb-3 shadow-theme-xs group-hover:scale-105 transition-transform">
              <ShoppingCart className="size-5" />
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
              Sales & Orders
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Checkout hardware & track Paid/Partial/Unpaid invoices
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
              Manage items, stock counts, cost margins, and serials
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
              Repairs & RMA
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Track parts used, labor fees, and repair job status
            </p>
          </button>

          <button
            onClick={onNavigateToAdjustments}
            className="group flex flex-col items-start p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-brand-50/50 hover:border-brand-300 transition-all text-left dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/30"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500 text-white mb-3 shadow-theme-xs group-hover:scale-105 transition-transform">
              <ArrowLeftRight className="size-5" />
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
              Swaps & Trade-Ins
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Calculate upgrade difference & cash refund payouts
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
              Wattage check & 1-click send to sales checkout
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
              onClick={onNavigateToSales}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Open Sales
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm whitespace-nowrap">
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
                {sales.slice(0, 5).map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-gray-900 dark:text-white">
                      {order.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800 dark:text-gray-200">
                      <span className="max-w-[140px] truncate block" title={order.customerName}>
                        {order.customerName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold dark:bg-gray-800">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      PKR {order.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        order.paymentStatus === "PAID"
                          ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                          : order.paymentStatus === "PARTIAL"
                          ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400"
                          : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                      }`}>
                        {order.paymentStatus || "PAID"}
                      </span>
                    </td>
                  </tr>
                ))}
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
