import React from "react";

type BadgeVariant = "success" | "warning" | "error" | "brand" | "neutral";

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  className = "",
}) => {
  const getVariant = (): BadgeVariant => {
    if (variant) return variant;
    const s = status.toUpperCase();
    if (["PAID", "READY", "DELIVERED", "AVAILABLE"].includes(s)) return "success";
    if (["PARTIAL", "IN_PROGRESS", "WAITING_PARTS"].includes(s)) return "warning";
    if (["UNPAID", "DEFECTIVE"].includes(s)) return "error";
    if (["RECEIVED", "SOLD"].includes(s)) return "brand";
    return "neutral";
  };

  const currentVariant = getVariant();

  const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
    error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${variantStyles[currentVariant]} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};
