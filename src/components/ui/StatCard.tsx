import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode | LucideIcon | React.ElementType;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  valueColor?: "default" | "success" | "brand" | "warning";
  variant?: "default" | "success" | "brand" | "warning";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  description,
  valueColor,
  variant = "default",
}) => {
  const finalColor = valueColor || variant;
  const valueColorClass = {
    default: "text-gray-900 dark:text-white",
    success: "text-success-600 dark:text-success-400",
    brand: "text-brand-500 dark:text-brand-400",
    warning: "text-warning-600 dark:text-warning-400",
  }[finalColor];

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp className="size-5" />;
  };

  const subText = description || subtitle;

  return (
    <div className="tail-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </span>
        {icon && <div className="text-gray-400 dark:text-gray-500">{renderIcon()}</div>}
      </div>

      <div className="mt-2 flex flex-col gap-1">
        <p className={`text-2xl font-bold tracking-tight ${valueColorClass}`}>{value}</p>
        {subText && <div className="text-xs text-gray-500 dark:text-gray-400">{subText}</div>}
      </div>
    </div>
  );
};
