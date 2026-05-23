import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle, XCircle, Filter, ChevronDown, Plus, ExternalLink, AlertTriangle, Send, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import {
  sparePartStatusLabels,
  sparePartStatusColors,
  workOrderStatusLabels,
  workOrderStatusColors,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { SparePartStatus, SparePartRequest } from '../types';
import SparePartApprovalModal from '../components/SparePartApprovalModal';
import SparePartIssueReturnModal from '../components/SparePartIssueReturnModal';

const statusFilters: { value: SparePartStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'issued', label: '已发放' },
  { value: 'returned', label: '已归还' },
  { value: 'rejected', label: '已拒绝' },
];

export default function SpareParts() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SparePartStatus | 'all'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showIssueReturnModal, setShowIssueReturnModal] = useState(false);
  const [issueReturnMode, setIssueReturnMode] = useState<'issue' | 'return'>('issue');
  const [selectedSparePart, setSelectedSparePart] = useState<SparePartRequest | null>(null);

  const spareParts = useStore((state) => state.spareParts);
  const workOrders = useStore((state) => state.workOrders);
  const alarms = useStore((state) => state.alarms);
  const getUserName = useStore((state) => state.getUserName);
  const selectWorkOrder = useStore((state) => state.selectWorkOrder);
  const currentUser = useStore((state) => state.currentUser);

  const getWorkOrderInfo = (workorderId: string) => {
    return workOrders.find((wo) => wo.id === workorderId);
  };

  const getAlarmInfo = (workorderId: string) => {
    return alarms.find((a) => a.workorderId === workorderId);
  };

  const handleViewWorkOrder = (workorderId: string) => {
    selectWorkOrder(workorderId);
    navigate('/workorders');
  };

  const filteredSpareParts = spareParts.filter((sp) => {
    const workOrder = getWorkOrderInfo(sp.workorderId);
    const matchesSearch =
      sp.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workOrder?.title.toLowerCase().includes(searchTerm.toLowerCase()));
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
  const canIssue = currentUser?.role === 'admin' || currentUser?.role === 'staff';
  const canReturn = currentUser?.role === 'admin' || currentUser?.role === 'staff' || currentUser?.role === 'engineer';

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
            placeholder="搜索备件名称、型号或关联工单..."
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
                  来源告警
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
              {filteredSpareParts.map((sp) => {
                const workOrder = getWorkOrderInfo(sp.workorderId);
                const alarm = getAlarmInfo(sp.workorderId);
                return (
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
                      {workOrder ? (
                        <div>
                          <button
                            onClick={() => handleViewWorkOrder(sp.workorderId)}
                            className="group flex items-center gap-1 text-left hover:text-blue-600 transition-colors"
                          >
                            <span className="font-medium text-slate-800 truncate max-w-[180px] group-hover:text-blue-600">
                              {workOrder.title}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                          </button>
                          <span
                            className={cn(
                              'inline-block mt-1 text-xs px-2 py-0.5 rounded-full',
                              workOrderStatusColors[workOrder.status]
                            )}
                          >
                            {workOrderStatusLabels[workOrder.status]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">
                          {sp.workorderId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {alarm ? (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={cn(
                            'w-4 h-4 flex-shrink-0 mt-0.5',
                            alarm.level === 'critical' ? 'text-red-500' :
                            alarm.level === 'warning' ? 'text-orange-500' : 'text-yellow-500'
                          )} />
                          <div className="min-w-0">
                            <p className="text-sm text-slate-700 truncate max-w-[150px]">
                              {alarm.type}
                            </p>
                            <p className="text-xs text-slate-500">
                              {alarm.inverterId}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
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
                      <div className="flex items-center gap-1">
                        {sp.status === 'pending' && canApprove && (
                          <button
                            onClick={() => {
                              setSelectedSparePart(sp);
                              setShowApprovalModal(true);
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="审批"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        {sp.status === 'approved' && canIssue && (
                          <button
                            onClick={() => {
                              setSelectedSparePart(sp);
                              setIssueReturnMode('issue');
                              setShowIssueReturnModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="发放"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                        {sp.status === 'issued' && canReturn && (
                          <button
                            onClick={() => {
                              setSelectedSparePart(sp);
                              setIssueReturnMode('return');
                              setShowIssueReturnModal(true);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="归还"
                          >
                            <ArrowLeftRight className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewWorkOrder(sp.workorderId)}
                          className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                          title="查看工单"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      <SparePartApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedSparePart(null);
        }}
        sparePart={selectedSparePart}
        onSuccess={(workorderId) => {
          handleViewWorkOrder(workorderId);
        }}
      />

      <SparePartIssueReturnModal
        isOpen={showIssueReturnModal}
        onClose={() => {
          setShowIssueReturnModal(false);
          setSelectedSparePart(null);
        }}
        sparePart={selectedSparePart}
        mode={issueReturnMode}
        onSuccess={() => {
          if (selectedSparePart) {
            handleViewWorkOrder(selectedSparePart.workorderId);
          }
        }}
      />
    </div>
  );
}
