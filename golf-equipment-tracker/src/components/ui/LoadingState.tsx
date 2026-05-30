import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "加载中...",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Loader2 className={`${sizeClasses[size]} text-blue-500 animate-spin mb-4`} />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
};
