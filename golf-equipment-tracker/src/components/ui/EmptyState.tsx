import React from "react";
import { FileX, Search, PackageOpen } from "lucide-react";

interface EmptyStateProps {
  type?: "no-data" | "no-results" | "no-items";
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = "no-data",
  title,
  description,
  icon,
  action,
}) => {
  const defaultIcons = {
    "no-data": <PackageOpen className="w-12 h-12 text-gray-400" />,
    "no-results": <Search className="w-12 h-12 text-gray-400" />,
    "no-items": <FileX className="w-12 h-12 text-gray-400" />,
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">{icon || defaultIcons[type]}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
