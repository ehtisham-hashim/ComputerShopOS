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
    return <IconComp className="size-4" />;
  };

  const subText = description || subtitle;

  return (
    <div className="tail-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate pr-2">
          {title}
        </span>
        {icon && (
          <div className="size-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0">
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-col gap-1">
        <p className={`text-2xl font-extrabold tracking-tight tabular-nums ${valueColorClass}`}>{value}</p>
        {subText && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subText}</div>}
      </div>
    </div>
  );
};
