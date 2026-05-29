import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { Rental } from '../types';

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    search: '',
  });

  useEffect(() => {
    loadRentals();
  }, [filters]);

  const loadRentals = async () => {
    setLoading(true);
    const result: any = await api.rentals.list({
      ...filters,
      pageSize: 100,
    });
    setRentals(result.data);
    setLoading(false);
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    active: { label: '进行中', class: 'bg-green-100 text-green-700' },
    returned: { label: '已归还', class: 'bg-gray-100 text-gray-700' },
    overdue: { label: '已逾期', class: 'bg-red-100 text-red-700' },
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">租赁管理</h1>
            <p className="text-gray-500 mt-1">查看所有租赁订单</p>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="text"
              placeholder="搜索订单号/客户名..."
              className="input-field max-w-xs"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <select
              className="input-field max-w-xs"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">全部状态</option>
              <option value="active">进行中</option>
              <option value="returned">已归还</option>
              <option value="overdue">已逾期</option>
            </select>
            <select
              className="input-field max-w-xs"
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            >
              <option value="">全部来源</option>
              <option value="retail">散客</option>
              <option value="school_partner">学校合作</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      订单号
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      客户
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      乐器
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      租期
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      押金
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((rental) => (
                    <tr
                      key={rental.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-primary-600">
                          {rental.rentalNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{rental.customerName}</div>
                        <div className="text-sm text-gray-500">
                          {rental.customerPhone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          {rental.items.map((item) => (
                            <div key={item.instrumentId} className="text-sm">
                              {item.instrumentName}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          起: {new Date(rental.startDate).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="text-gray-500">
                          止: {new Date(rental.expectedEndDate).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        ¥{rental.depositAmount}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`badge ${statusLabels[rental.status]?.class}`}
                        >
                          {statusLabels[rental.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
