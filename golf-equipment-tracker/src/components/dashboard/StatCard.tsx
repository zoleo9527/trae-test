import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onClick?: () => void;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, icon: Icon, color, bgColor, onClick, trend }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend.isUp ? "text-green-600" : "text-red-600"}`}>
              {trend.isUp ? "↑" : "↓"} {Math.abs(trend.value)}% 较昨日
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </button>
  );
};
