import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
    label: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  className?: string;
}

const colorStyles: Record<string, {
  bg: string;
  icon: string;
  text: string;
  border: string;
}> = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'bg-primary-100 text-primary-600',
    text: 'text-primary-600',
    border: 'border-primary-100',
  },
  success: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
    border: 'border-green-100',
  },
  warning: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    text: 'text-amber-600',
    border: 'border-amber-100',
  },
  danger: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
    border: 'border-red-100',
  },
  info: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-100',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  onClick,
  className,
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      padding="md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={cn('text-2xl font-bold', styles.text)}>{value}</p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs',
              trend.isUp ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.isUp ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', styles.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
