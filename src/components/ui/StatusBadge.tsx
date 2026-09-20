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

  const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
    success: {
      bg: "border border-success-500/25 bg-success-50/80 text-success-700 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
      dot: "bg-success-500",
    },
    warning: {
      bg: "border border-warning-500/25 bg-warning-50/80 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
      dot: "bg-warning-500",
    },
    error: {
      bg: "border border-error-500/25 bg-error-50/80 text-error-700 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
      dot: "bg-error-500",
    },
    brand: {
      bg: "border border-brand-500/25 bg-brand-50/80 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20",
      dot: "bg-brand-500",
    },
    neutral: {
      bg: "border border-gray-200 bg-gray-100 text-gray-700 dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-700",
      dot: "bg-gray-400",
    },
  };

  const currentStyle = variantStyles[currentVariant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${currentStyle.bg} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${currentStyle.dot} shrink-0`} />
      <span>{status.replace(/_/g, " ")}</span>
    </span>
  );
};
