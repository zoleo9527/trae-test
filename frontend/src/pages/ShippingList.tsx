import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, ChevronDown, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useRole } from '@/hooks/useRole';
import type { ShippingStatus } from '@/types';

export function ShippingList() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canCreateShipping, canApproveShipping } = useRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShippingStatus | 'all'>('all');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'pending') {
      setStatusFilter('pending_approval');
    } else if (filter && filter !== 'all') {
      setStatusFilter(filter as ShippingStatus);
    }
  }, [searchParams]);

  const filteredOrders = state.shippingOrders.filter(order => {
    const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: state.shippingOrders.length,
    draft: state.shippingOrders.filter(o => o.status === 'draft').length,
    pending_approval: state.shippingOrders.filter(o => o.status === 'pending_approval').length,
    approved: state.shippingOrders.filter(o => o.status === 'approved').length,
    shipped: state.shippingOrders.filter(o => o.status === 'shipped').length,
    received: state.shippingOrders.filter(o => o.status === 'received').length,
    completed: state.shippingOrders.filter(o => o.status === 'completed').length,
    rejected: state.shippingOrders.filter(o => o.status === 'rejected').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">材料发货</h1>
          <p className="text-sm text-gray-500 mt-1">管理材料发货单的创建、审核和追踪</p>
        </div>
        {canCreateShipping && (
          <button
            onClick={() => {}}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建发货单
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as ShippingStatus | 'all')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              statusFilter === status
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? '全部' : 
             status === 'pending_approval' ? '待审核' :
             status === 'draft' ? '草稿' :
             status === 'approved' ? '已批准' :
             status === 'shipped' ? '已发货' :
             status === 'received' ? '已签收' :
             status === 'completed' ? '已完成' :
             status === 'rejected' ? '已驳回' : status}
            <span className="ml-1.5 text-gray-400">({count})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索发货单号或标题..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">筛选</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                发货单号
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标题
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                金额
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/shipping/${order.id}`)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-medium text-gray-800">{order.code}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-700">{order.title}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-gray-800">
                    ¥{order.totalAmount.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.status} type="shipping" />
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {order.status === 'pending_approval' && canApproveShipping && (
                      <>
                        <button
                          className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button className="text-sm text-primary-600 hover:text-primary-700">
                      查看
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">暂无发货单数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
