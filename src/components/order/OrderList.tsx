import React, { useState } from 'react';
import { Filter, Search, ChevronDown } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { OrderCard } from './OrderCard';
import { cn } from '../../lib/utils';
import type { OrderStatus } from '../../types';

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部订单' },
  { value: 'pending_review', label: '待审核' },
  { value: 'reviewed', label: '已审核' },
  { value: 'scheduled', label: '已排期' },
  { value: 'in_production', label: '生产中' },
  { value: 'completed', label: '已完成' },
  { value: 'change_requested', label: '申请改单' },
  { value: 'refund_requested', label: '申请退款' },
  { value: 'refunded', label: '已退款' },
];

export const OrderList: React.FC = () => {
  const { orders, selectedOrder, filters, applyFilters, getFilteredOrders } = useOrderStore();
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = getFilteredOrders();
  const currentStatusLabel = statusOptions.find(
    (o) => o.value === (filters.status || 'all')
  )?.label || '全部订单';

  const handleStatusChange = (status: OrderStatus | 'all') => {
    applyFilters({ status: status === 'all' ? undefined : status });
    setShowStatusFilter(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    applyFilters({ search: e.target.value || undefined });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="搜索订单号、客户姓名..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bakery-brown-500/20 focus:border-bakery-brown-500 transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowStatusFilter(!showStatusFilter)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">{currentStatusLabel}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showStatusFilter && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors',
                    (filters.status || 'all') === option.value &&
                      'bg-bakery-brown-50 text-bakery-brown-700'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => applyFilters({ isUrgent: true })}
            className={cn(
              'px-3 py-2 text-sm rounded-lg transition-colors',
              filters.isUrgent
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            急单
          </button>
          <button
            onClick={() => applyFilters({ isOverdue: true })}
            className={cn(
              'px-3 py-2 text-sm rounded-lg transition-colors',
              filters.isOverdue
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            逾期
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        共 {filteredOrders.length} 条订单
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p>没有找到匹配的订单</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              selected={selectedOrder?.id === order.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
