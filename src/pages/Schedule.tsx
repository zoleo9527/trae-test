import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ChefHat,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { useOrderStore } from '../store/useOrderStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { cn } from '../lib/utils';
import { getDayOfWeek, isToday, isTomorrow } from '../utils/dateUtils';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);

export const Schedule: React.FC = () => {
  const { selectedDate, setSelectedDate, schedules, checkCapacity, getSchedulesByDate } = useScheduleStore();
  const { orders, selectOrder, selectedOrder } = useOrderStore();
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);

  const capacity = checkCapacity(selectedDate);
  const daySchedules = getSchedulesByDate(selectedDate);

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  const getDateLabel = (date: string) => {
    if (isToday(date)) return '今天';
    if (isTomorrow(date)) return '明天';
    return getDayOfWeek(date);
  };

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const getScheduleColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-bakery-matcha border-bakery-matcha';
      case 'completed':
        return 'bg-green-500 border-green-500';
      default:
        return 'bg-bakery-brown-400 border-bakery-brown-500';
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">产能排期</h1>
        <p className="text-gray-500">查看和管理每日生产排期</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">
                    {selectedDate}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getDateLabel(selectedDate)}
                  </p>
                </div>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-bakery-brown-600">
                    {capacity.currentOrders}/{capacity.maxOrders}
                  </p>
                  <p className="text-xs text-gray-500">当日订单</p>
                </div>
                <div className="text-center">
                  <p className={cn(
                    'text-2xl font-bold',
                    capacity.remainingCapacity <= 1 ? 'text-orange-500' : 'text-green-500'
                  )}>
                    {capacity.remainingCapacity}
                  </p>
                  <p className="text-xs text-gray-500">剩余产能</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-auto">
            {capacity.remainingCapacity <= 1 && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <p className="text-sm text-orange-700">
                  当日产能即将饱和，请谨慎接单或考虑延期
                </p>
              </div>
            )}

            {daySchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p>当日暂无排期安排</p>
              </div>
            ) : (
              <div className="space-y-4">
                {daySchedules
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((schedule) => {
                    const order = getOrderById(schedule.orderId);
                    if (!order) return null;

                    return (
                      <div
                        key={schedule.id}
                        onClick={() => {
                          selectOrder(order.id);
                          setSelectedSchedule(schedule.id);
                        }}
                        className={cn(
                          'p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md',
                          selectedSchedule === schedule.id
                            ? 'border-bakery-brown-500 shadow-md'
                            : 'border-gray-100 hover:border-bakery-brown-300',
                          schedule.status === 'in_progress' && 'bg-green-50 border-green-200'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center',
                              getScheduleColor(schedule.status)
                            )}>
                              <ChefHat className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-800">
                                  {order.orderNo}
                                </p>
                                <StatusBadge status={order.status} />
                              </div>
                              <p className="text-sm text-gray-600">
                                {order.customerName} - {order.items.map(i => i.productName).join('、')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{schedule.startTime} - {schedule.endTime}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {schedule.status === 'scheduled' && '已排期'}
                              {schedule.status === 'in_progress' && '生产中'}
                              {schedule.status === 'completed' && '已完成'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        <div className="w-72 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">待排期订单</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orders
                .filter((o) => o.status === 'reviewed')
                .map((order) => (
                  <div
                    key={order.id}
                    onClick={() => selectOrder(order.id)}
                    className={cn(
                      'p-3 rounded-xl border cursor-pointer transition-all',
                      selectedOrder?.id === order.id
                        ? 'border-bakery-brown-500 bg-bakery-brown-50'
                        : 'border-gray-100 hover:border-bakery-brown-300 hover:bg-gray-50'
                    )}
                  >
                    <p className="text-sm font-medium text-gray-800">
                      {order.orderNo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      取货：{order.pickupTime}
                    </p>
                  </div>
                ))}
              {orders.filter((o) => o.status === 'reviewed').length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">
                  暂无待排期订单
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">产能说明</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">每日最大订单</span>
                <span className="font-medium text-gray-800">5单</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">工作时间</span>
                <span className="font-medium text-gray-800">7:00-19:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">单均耗时</span>
                <span className="font-medium text-gray-800">2-3小时</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
