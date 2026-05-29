import { useState, useMemo } from 'react';
import { Package, AlertTriangle, Filter } from 'lucide-react';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { getDashboardStats, getOrders } from '@/services/order.service';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app.store';
import type { Order, UserRole } from '@/types';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待取餐' },
  { value: 'picked_up', label: '配送中' },
  { value: 'delivered', label: '已送达' },
  { value: 'cancelled', label: '已取消' },
  { value: 'exception', label: '异常' },
];

const exceptionOptions = [
  { value: 'all', label: '全部订单' },
  { value: 'true', label: '仅异常订单' },
  { value: 'false', label: '仅正常订单' },
];

const rolePageConfig: Record<UserRole, { title: string; description: string }> = {
  manager: { title: '订单管理', description: '查看所有订单，筛选异常订单进入处理流程' },
  dispatcher: { title: '订单处理', description: '处理异常订单，协调配送调度' },
  customer_service: { title: '订单查询', description: '查询订单信息，协助用户申诉' },
};

export function OrdersPage() {
  const navigate = useNavigate();
  const { pendingCounts, userRole } = useAppStore();

  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'all',
    hasException: 'all',
  });
  const [searchValue, setSearchValue] = useState('');

  const stats = useMemo(() => getDashboardStats(), []);
  const allOrders = useMemo(() => getOrders(), []);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      if (userRole === 'dispatcher' && order.status !== 'exception') {
        const timeout = new Date(order.deliveredTime).getTime() - new Date(order.promisedTime).getTime();
        if (timeout <= 0) return false;
      }
      if (filters.status !== 'all' && order.status !== filters.status) return false;
      if (filters.hasException === 'true' && order.status !== 'exception') {
        const timeout = new Date(order.deliveredTime).getTime() - new Date(order.promisedTime).getTime();
        if (timeout <= 0) return false;
      }
      if (filters.hasException === 'false' && order.status !== 'exception') {
        const timeout = new Date(order.deliveredTime).getTime() - new Date(order.promisedTime).getTime();
        if (timeout > 0) return false;
      }
      if (searchValue) {
        const lowerSearch = searchValue.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(lowerSearch);
        const matchesRider = order.riderName.toLowerCase().includes(lowerSearch);
        const matchesMerchant = order.merchantName.toLowerCase().includes(lowerSearch);
        const matchesUser = order.userName.toLowerCase().includes(lowerSearch);
        if (!matchesId && !matchesRider && !matchesMerchant && !matchesUser) return false;
      }
      return true;
    });
  }, [allOrders, filters, searchValue, userRole]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: 'all', hasException: 'all' });
    setSearchValue('');
  };

  const handleProcessOrder = (orderId: string) => {
    navigate(`/orders/${orderId}/process`);
  };

  const pageConfig = userRole ? rolePageConfig[userRole] : rolePageConfig.manager;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageConfig.title}</h1>
          <p className="text-gray-500 mt-1">{pageConfig.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="今日订单总数"
          value={stats.totalOrders}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="异常订单"
          value={stats.exceptionOrders}
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="超时订单"
          value={stats.timeoutOrders}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="准时送达率"
          value={`${stats.onTimeRate}%`}
          icon={Package}
          color="success"
        />
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: '订单状态', options: statusOptions },
          { key: 'hasException', label: '异常筛选', options: exceptionOptions },
        ]}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchPlaceholder="搜索订单号、骑手、商家、用户"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              订单列表
              <span className="text-sm font-normal text-gray-500">（共 {filteredOrders.length} 条）</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent padding="none">
          <OrderTable
            orders={filteredOrders}
            onProcessOrder={handleProcessOrder}
          />
        </CardContent>
      </Card>
    </div>
  );
}
