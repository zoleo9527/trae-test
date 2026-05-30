import React from "react";
import { getStatusBadgeStyle, getStatusLabel } from "@/lib/mockData";

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(status)}`}
    >
      {customLabel || getStatusLabel(status)}
    </span>
  );
};
