import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  valueColor?: "default" | "success" | "brand" | "warning";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  valueColor = "default",
}) => {
  const valueColorClass = {
    default: "text-gray-900 dark:text-white",
    success: "text-success-600 dark:text-success-400",
    brand: "text-brand-500 dark:text-brand-400",
    warning: "text-warning-600 dark:text-warning-400",
  }[valueColor];

  return (
    <div className="tail-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </span>
        {icon && <div className="text-gray-400 dark:text-gray-500">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className={`text-2xl font-bold tracking-tight ${valueColorClass}`}>
          {value}
        </p>
        {subtitle && <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>}
      </div>
    </div>
  );
};
