import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { ReportData } from "../../db/reportService";

interface ReportSalesChartProps {
  report: ReportData;
}

export const ReportSalesChart: React.FC<ReportSalesChartProps> = ({ report }) => {
  const chartData = report.trendData.length > 0 ? report.trendData : [
    { label: "01", revenue: 0, profit: 0 },
    { label: "02", revenue: 0, profit: 0 },
  ];

  return (
    <div className="tail-card space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="size-4 text-brand-500" />
            Revenue & Profit Trajectory
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sales volume vs estimated net margin</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="reportRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#465fff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#465fff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="reportProfitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "0.75rem", fontSize: "12px", color: "#fff" }}
              formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, ""]}
            />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#465fff" strokeWidth={2.5} fillOpacity={1} fill="url(#reportRevenueGrad)" />
            <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#reportProfitGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
