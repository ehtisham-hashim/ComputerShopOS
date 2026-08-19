import React from "react";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center p-6">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 mb-3">
        <Icon className="size-6" />
      </div>
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{title}</h3>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
