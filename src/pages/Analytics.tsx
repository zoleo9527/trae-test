import React from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle,
  PieChart, BarChart3, Clock,
} from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color,
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {trend && (
          <p
            className={cn(
              'text-xs mt-1 flex items-center gap-1',
              trendUp ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trendUp ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
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

export const Analytics: React.FC = () => {
  const { orders } = useOrderStore();

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const cancelledOrders = orders.filter(
    (o) => o.status === 'refunded' || o.status === 'cancelled'
  ).length;
  const changeRequestCount = orders.filter((o) => o.changeRequest).length;
  const refundRequestCount = orders.filter((o) => o.refundRequest).length;
  const overdueCount = orders.filter((o) => o.isOverdue).length;

  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const refundAmount = orders
    .filter((o) => o.status === 'refunded')
    .reduce((sum, o) => sum + (o.refundRequest?.refundAmount || 0), 0);

  const completionRate = totalOrders > 0 
    ? Math.round((completedOrders / totalOrders) * 100) 
    : 0;

  const refundReasons = [
    { reason: '客户取消', count: 2, amount: 500 },
    { reason: '原料问题', count: 0, amount: 0 },
    { reason: '改单失败', count: 1, amount: 250 },
    { reason: '其他', count: 0, amount: 0 },
  ];

  const productStats = [
    { name: '生日蛋糕', count: 3, revenue: 1582 },
    { name: '面包套餐', count: 2, revenue: 273 },
    { name: '礼盒装', count: 3, revenue: 460 },
    { name: '其他', count: 1, revenue: 256 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">数据复盘</h1>
        <p className="text-gray-500">查看业务数据和原料损耗分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总订单数"
          value={totalOrders}
          icon={Package}
          color="bg-bakery-brown-500"
        />
        <StatCard
          title="完成率"
          value={`${completionRate}%`}
          icon={PieChart}
          trend="较上周 +5%"
          trendUp
          color="bg-green-500"
        />
        <StatCard
          title="营业收入"
          value={`¥${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="较上周 +12%"
          trendUp
          color="bg-blue-500"
        />
        <StatCard
          title="退款金额"
          value={`¥${refundAmount}`}
          icon={AlertTriangle}
          trend="较上周 -8%"
          trendUp={false}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-bakery-brown-500" />
            商品销量统计
          </h3>
          <div className="space-y-4">
            {productStats.map((product, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{product.name}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {product.count} 单 / ¥{product.revenue}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-bakery-brown-500 rounded-full transition-all"
                    style={{ width: `${(product.count / 3) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            退款原因分析
          </h3>
          <div className="space-y-3">
            {refundReasons.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {item.reason}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.count} 次 / ¥{item.amount}
                  </p>
                </div>
                {item.count > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-lg">
                    需要关注
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">异常统计</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">改单申请</p>
                  <p className="text-xs text-gray-500">已处理 / 待处理</p>
                </div>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {changeRequestCount}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">退款申请</p>
                  <p className="text-xs text-gray-500">已处理 / 待处理</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">
                {refundRequestCount}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">逾期订单</p>
                  <p className="text-xs text-gray-500">需尽快处理</p>
                </div>
              </div>
              <span className="text-lg font-bold text-yellow-600">
                {overdueCount}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">原料损耗预估</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">奶油（已采购未使用）</span>
                <span className="text-sm text-red-600">预计损耗 ¥150</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: '30%' }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                原因：订单 BK20250531004 退款，芒果夹心蛋糕原料已采购
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">面粉（库存积压）</span>
                <span className="text-sm text-yellow-600">预计损耗 ¥80</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl mt-4">
              <p className="text-sm text-blue-800">
                <strong>建议：</strong>本周退款导致的原料损耗约 ¥230，
                建议优化退款流程，在确认原料采购前与客户充分沟通。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
