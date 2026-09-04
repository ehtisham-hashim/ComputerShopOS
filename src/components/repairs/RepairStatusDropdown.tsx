import React from "react";
import { RepairStatus, RepairStatuses } from "../../db/schema";
import { CustomDropdown } from "../ui/CustomDropdown";

interface RepairStatusDropdownProps {
  status: RepairStatus;
  onChange: (status: RepairStatus) => void;
}

export const RepairStatusDropdown: React.FC<RepairStatusDropdownProps> = ({ status, onChange }) => {
  const getBadgeStyle = (s: RepairStatus) => {
    if (s === "READY" || s === "DELIVERED")
      return "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/30";
    if (s === "IN_PROGRESS" || s === "WAITING_PARTS")
      return "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/15 dark:text-warning-400 dark:border-warning-500/30";
    return "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-500/30";
  };

  return (
    <CustomDropdown
      value={status}
      onChange={onChange}
      options={RepairStatuses.map((st) => ({
        value: st,
        label: st.replace(/_/g, " "),
      }))}
      variant="badge"
      buttonClassName={`px-2.5 py-1 text-xs font-bold border rounded-lg shadow-theme-xs ${getBadgeStyle(status)}`}
      size="sm"
      minWidth={160}
    />
  );
};
