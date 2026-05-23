import { useState } from 'react';
import { Search, Package, Clock, CheckCircle, XCircle, Filter, ChevronDown, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import {
  sparePartStatusLabels,
  sparePartStatusColors,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { SparePartStatus } from '../types';

const statusFilters: { value: SparePartStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'issued', label: '已发放' },
  { value: 'returned', label: '已归还' },
  { value: 'rejected', label: '已拒绝' },
];

export default function SpareParts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SparePartStatus | 'all'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const spareParts = useStore((state) => state.spareParts);
  const approveSparePart = useStore((state) => state.approveSparePart);
  const getUserName = useStore((state) => state.getUserName);
  const currentUser = useStore((state) => state.currentUser);

  const filteredSpareParts = spareParts.filter((sp) => {
    const matchesSearch =
      sp.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.partCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MM-dd HH:mm', { locale: zhCN });
  };

  const stats = {
    total: spareParts.length,
    pending: spareParts.filter((sp) => sp.status === 'pending').length,
    approved: spareParts.filter((sp) => sp.status === 'approved' || sp.status === 'issued').length,
  };

  const canApprove = currentUser?.role === 'admin' || currentUser?.role === 'staff';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">全部申请</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-slate-500">待审批</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-xs text-slate-500">已通过</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索备件名称或型号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {statusFilters.find((f) => f.value === statusFilter)?.label}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setStatusFilter(filter.value);
                      setShowStatusDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors',
                      statusFilter === filter.value ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            新建申请
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  备件信息
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  申请人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  关联工单
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  申请时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSpareParts.map((sp) => (
                <tr key={sp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{sp.partName}</p>
                      <p className="text-sm text-slate-500">{sp.partCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-800">
                      {sp.quantity} {sp.unit}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-600">{getUserName(sp.requesterId)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-600 text-sm">{sp.workorderId}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-500 text-sm">{formatDate(sp.createdAt)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        sparePartStatusColors[sp.status]
                      )}
                    >
                      {sparePartStatusLabels[sp.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {sp.status === 'pending' && canApprove && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveSparePart(sp.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="批准"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="拒绝"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    {sp.status !== 'pending' && (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                    {sp.status === 'pending' && !canApprove && (
                      <span className="text-slate-400 text-sm">等待审批</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSpareParts.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>没有找到匹配的备件申请</p>
          </div>
        )}
      </div>
    </div>
  );
}
