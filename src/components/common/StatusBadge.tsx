import React from 'react';
import type { OrderStatus } from '../../types';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending_review: {
    label: '待审核',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  reviewed: {
    label: '已审核',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  scheduled: {
    label: '已排期',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  in_production: {
    label: '生产中',
    className: 'bg-bakery-matcha/20 text-bakery-matcha border-bakery-matcha/30',
  },
  completed: {
    label: '已完成',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  change_requested: {
    label: '申请改单',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  refund_requested: {
    label: '申请退款',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  refunded: {
    label: '已退款',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
