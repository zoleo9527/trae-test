import React from 'react';
import { Clock, User, Phone, AlertTriangle, Zap } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { StatusBadge } from '../common/StatusBadge';
import { cn } from '../../lib/utils';
import type { Order } from '../../types';

interface OrderCardProps {
  order: Order;
  selected?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, selected }) => {
  const { selectOrder } = useOrderStore();

  const productSummary = order.items
    .map((item) => `${item.productName} x${item.quantity}`)
    .join('、');

  return (
    <div
      onClick={() => selectOrder(order.id)}
      className={cn(
        'p-4 bg-white rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md',
        selected
          ? 'border-bakery-brown-500 shadow-md'
          : 'border-gray-100 hover:border-bakery-brown-300',
        order.isOverdue && 'border-red-300 bg-red-50/30',
        order.isUrgent && !order.isOverdue && 'border-orange-300 bg-orange-50/30'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800">
              {order.orderNo}
            </span>
            {order.isUrgent && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                <Zap className="w-3 h-3" />
                急单
              </span>
            )}
            {order.isOverdue && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full animate-pulse-slow">
                <AlertTriangle className="w-3 h-3" />
                逾期
              </span>
            )}
          </div>
          <StatusBadge status={order.status} />
        </div>
        <span className="text-lg font-bold text-bakery-brown-600">
          ¥{order.totalAmount}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4" />
          <span>{order.customerName}</span>
          <span className="text-gray-400">|</span>
          <span>{order.customerPhone}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>取货：{order.pickupTime}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 truncate">
          {productSummary}
        </p>
      </div>

      {(order.changeRequest || order.refundRequest) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {order.changeRequest?.status === 'pending' && (
            <div className="flex items-center gap-2 text-orange-600 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>待处理改单申请</span>
            </div>
          )}
          {order.refundRequest?.status === 'pending' && (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>待处理退款申请</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
