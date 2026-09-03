import React, { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { SaleRecord } from "../../db/schema";

type Timeframe = "weekly" | "monthly" | "yearly";

export const DashboardSalesChart: React.FC<{ sales: SaleRecord[] }> = ({ sales }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

  const chartData = useMemo(() => {
    const now = new Date();
    if (timeframe === "weekly") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dataMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(now.getDate() - i); dataMap[days[d.getDay()]] = 0; }
      sales.forEach((s) => {
        const sDate = new Date((s.createdAt || 0) * 1000);
        if (Math.floor((now.getTime() - sDate.getTime()) / 86400000) <= 7) dataMap[days[sDate.getDay()]] = (dataMap[days[sDate.getDay()]] || 0) + Number(s.totalAmount || 0);
      });
      return Object.entries(dataMap).map(([name, amount]) => ({ name, revenue: Math.round(amount) }));
    }
    if (timeframe === "monthly") {
      const dataMap: Record<string, number> = { "Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0 };
      sales.forEach((s) => {
        const diff = Math.floor((now.getTime() - (s.createdAt || 0) * 1000) / 86400000);
        if (diff <= 7) dataMap["Week 4"] += Number(s.totalAmount || 0);
        else if (diff <= 14) dataMap["Week 3"] += Number(s.totalAmount || 0);
        else if (diff <= 21) dataMap["Week 2"] += Number(s.totalAmount || 0);
        else if (diff <= 28) dataMap["Week 1"] += Number(s.totalAmount || 0);
      });
      return ["Week 1", "Week 2", "Week 3", "Week 4"].map((name) => ({ name, revenue: Math.round(dataMap[name] || 0) }));
    }
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataMap: Record<string, number> = {};
    months.forEach((m) => { dataMap[m] = 0; });
    sales.forEach((s) => {
      const sDate = new Date((s.createdAt || 0) * 1000);
      if (sDate.getFullYear() === now.getFullYear()) dataMap[months[sDate.getMonth()]] += Number(s.totalAmount || 0);
    });
    return months.map((name) => ({ name, revenue: Math.round(dataMap[name] || 0) }));
  }, [sales, timeframe]);

  const totalPeriodRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);

  return (
    <div className="tail-card space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2"><BarChart3 className="size-5 text-brand-500" /><h2 className="text-base font-bold text-gray-900 dark:text-white">Revenue Trends</h2></div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total for period: <span className="font-bold text-brand-600 dark:text-brand-400">PKR {totalPeriodRevenue.toLocaleString()}</span></p>
        </div>
        <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {(["weekly", "monthly", "yearly"] as Timeframe[]).map((tf) => (
            <button key={tf} onClick={() => setTimeframe(tf)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${timeframe === tf ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-gray-400"}`}>{tf}</button>
          ))}
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
            <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
            <Tooltip cursor={{ fill: "currentColor", opacity: 0.04 }} contentStyle={{ backgroundColor: "rgb(17 24 39)", borderColor: "rgb(31 41 55)", borderRadius: "0.75rem", color: "#fff", fontSize: "12px" }} formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, "Revenue"]} />
            <Bar dataKey="revenue" fill="currentColor" className="text-brand-500" radius={[6, 6, 0, 0]} maxBarSize={45} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
