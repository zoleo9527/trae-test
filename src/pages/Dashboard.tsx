import React from 'react';
import {
  ClipboardList, Clock, AlertTriangle, CheckCircle,
  TrendingUp, DollarSign, Package, Users,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {trend && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
      </div>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

interface TodoItemProps {
  title: string;
  count: number;
  type: 'warning' | 'error' | 'info';
  onClick: () => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ title, count, type, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md',
      type === 'warning' && 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      type === 'error' && 'bg-red-50 border-red-200 hover:bg-red-100',
      type === 'info' && 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    )}
  >
    <div className="flex items-center gap-3">
      {type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
      {type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
      {type === 'info' && <Clock className="w-5 h-5 text-blue-500" />}
      <span className="font-medium text-gray-800">{title}</span>
    </div>
    <span className={cn(
      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
      type === 'warning' && 'bg-orange-500 text-white',
      type === 'error' && 'bg-red-500 text-white',
      type === 'info' && 'bg-blue-500 text-white'
    )}>
      {count}
    </span>
  </button>
);

export const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuthStore();
  const { orders, applyFilters } = useOrderStore();
  const { addNotification } = useNotificationStore();

  const pendingReview = orders.filter((o) => o.status === 'pending_review').length;
  const changeRequests = orders.filter(
    (o) => o.status === 'change_requested'
  ).length;
  const refundRequests = orders.filter(
    (o) => o.status === 'refund_requested'
  ).length;
  const overdue = orders.filter((o) => o.isOverdue).length;
  const inProduction = orders.filter((o) => o.status === 'in_production').length;
  const completedToday = orders.filter(
    (o) => o.status === 'completed'
  ).length;

  const totalAmount = orders
    .filter((o) => ['completed', 'in_production', 'scheduled'].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleTodoClick = (filterType: string) => {
    switch (filterType) {
      case 'pending_review':
        applyFilters({ status: 'pending_review' });
        break;
      case 'change_requested':
        applyFilters({ status: 'change_requested' });
        break;
      case 'refund_requested':
        applyFilters({ status: 'refund_requested' });
        break;
      case 'overdue':
        applyFilters({ isOverdue: true });
        break;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          欢迎回来，{user?.name}
        </h1>
        <p className="text-gray-500">
          今天是 {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日订单"
          value={orders.length}
          icon={ClipboardList}
          color="bg-bakery-brown-500"
        />
        <StatCard
          title="生产中"
          value={inProduction}
          icon={Package}
          color="bg-bakery-matcha"
        />
        <StatCard
          title="已完成"
          value={completedToday}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="待收金额"
          value={`¥${totalAmount.toLocaleString()}`}
          icon={DollarSign}
          color="bg-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              待办事项
            </h2>
            <div className="space-y-3">
              {hasPermission(['manager']) && pendingReview > 0 && (
                <TodoItem
                  title="待审核订单"
                  count={pendingReview}
                  type="info"
                  onClick={() => handleTodoClick('pending_review')}
                />
              )}
              {changeRequests > 0 && (
                <TodoItem
                  title="待处理改单申请"
                  count={changeRequests}
                  type="warning"
                  onClick={() => handleTodoClick('change_requested')}
                />
              )}
              {refundRequests > 0 && (
                <TodoItem
                  title="待处理退款申请"
                  count={refundRequests}
                  type="error"
                  onClick={() => handleTodoClick('refund_requested')}
                />
              )}
              {overdue > 0 && (
                <TodoItem
                  title="已逾期订单"
                  count={overdue}
                  type="error"
                  onClick={() => handleTodoClick('overdue')}
                />
              )}
              {pendingReview === 0 &&
                changeRequests === 0 &&
                refundRequests === 0 &&
                overdue === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>太棒了！没有待处理的事项</p>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            最近订单
          </h2>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {order.orderNo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.customerName}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {(changeRequests > 0 || refundRequests > 0 || overdue > 0) && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">
                需要您关注的事项
              </h3>
              <p className="text-sm text-gray-600">
                当前有 {changeRequests} 个改单申请、{refundRequests} 个退款申请和 {overdue} 个逾期订单等待处理。
                请及时处理以避免影响客户体验和原料损耗。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
