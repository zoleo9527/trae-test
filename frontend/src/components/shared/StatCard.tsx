import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

const colorClasses = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
};

export function StatCard({ title, value, icon: Icon, trend, color = 'primary', onClick }: StatCardProps) {
  return (
    <div
      className={`card p-5 cursor-pointer transition-all hover:shadow-md ${onClick ? 'hover:border-primary-300' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isUp ? 'text-success-600' : 'text-danger-600'}`}>
              <span>{trend.isUp ? '↑' : '↓'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
              <span className="text-gray-500 ml-1">vs 上月</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
