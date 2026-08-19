import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { ReportData } from "../../db/reportService";

interface ReportPieChartProps {
  report: ReportData;
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];

export const ReportPieChart: React.FC<ReportPieChartProps> = ({ report }) => {
  const data = [
    { name: "Cash", value: report.paymentBreakdown.cash },
    { name: "Card", value: report.paymentBreakdown.card },
    { name: "Split", value: report.paymentBreakdown.split },
  ].filter((d) => d.value > 0);

  const chartData = data.length > 0 ? data : [{ name: "No Data", value: 1 }];

  return (
    <div className="tail-card space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <PieIcon className="size-4 text-brand-500" />
            Payment Distribution
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Cash vs card vs split settlement</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "0.75rem", fontSize: "12px", color: "#fff" }}
              formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, ""]}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
