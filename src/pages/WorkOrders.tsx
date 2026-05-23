import { useState } from 'react';
import { Search, Filter, Plus, ChevronDown, Clock } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import {
  workOrderStatusLabels,
  workOrderStatusColors,
  workOrderPriorityLabels,
  workOrderPriorityColors,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { WorkOrderStatus, WorkOrderPriority } from '../types';
import WorkOrderSidebar from '../components/WorkOrderSidebar';
import CreateWorkOrderModal from '../components/CreateWorkOrderModal';

const statusFilters: { value: WorkOrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'waiting_spare', label: '待备件' },
  { value: 'reviewing', label: '待审核' },
  { value: 'returned', label: '已退回' },
  { value: 'closed', label: '已关闭' },
];

const priorityFilters: { value: WorkOrderPriority | 'all'; label: string }[] = [
  { value: 'all', label: '全部优先级' },
  { value: 'critical', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export default function WorkOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriority | 'all'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const workOrders = useStore((state) => state.workOrders);
  const selectedWorkOrderId = useStore((state) => state.selectedWorkOrderId);
  const selectWorkOrder = useStore((state) => state.selectWorkOrder);
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const getUserName = useStore((state) => state.getUserName);
  const currentUser = useStore((state) => state.currentUser);

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || wo.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MM-dd HH:mm', { locale: zhCN });
  };

  const isOverdue = (deadline: string) => {
    return isBefore(new Date(deadline), new Date());
  };

  return (
    <div className="flex h-full">
      <div className={cn('flex-1 transition-all duration-300', sidebarOpen && 'mr-0')}>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索工单标题或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={currentUser?.role === 'engineer'}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              创建工单
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowPriorityDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {statusFilters.find((f) => f.value === statusFilter)?.label}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[140px]">
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

            <div className="relative">
              <button
                onClick={() => {
                  setShowPriorityDropdown(!showPriorityDropdown);
                  setShowStatusDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {priorityFilters.find((f) => f.value === priorityFilter)?.label}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPriorityDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                  {priorityFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setPriorityFilter(filter.value);
                        setShowPriorityDropdown(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors',
                        priorityFilter === filter.value ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-sm text-slate-500 ml-auto">
              共 {filteredWorkOrders.length} 条工单
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    工单信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    负责人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    截止时间
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkOrders.map((workOrder) => {
                  const overdue = isOverdue(workOrder.deadline) && workOrder.status !== 'closed';
                  return (
                    <tr
                      key={workOrder.id}
                      onClick={() => selectWorkOrder(workOrder.id)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedWorkOrderId === workOrder.id
                          ? 'bg-blue-50'
                          : 'hover:bg-slate-50',
                        overdue && 'bg-red-50/50'
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-800 truncate">
                                {workOrder.title}
                              </p>
                              {overdue && (
                                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3" />
                                  超时
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 truncate mt-1">
                              {workOrder.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                            workOrderStatusColors[workOrder.status]
                          )}
                        >
                          {workOrderStatusLabels[workOrder.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            workOrderPriorityColors[workOrder.priority]
                          )}
                        >
                          {workOrderPriorityLabels[workOrder.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-600">
                          {getUserName(workOrder.assigneeId)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-500">
                          {formatDate(workOrder.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'text-sm',
                            overdue ? 'text-red-600 font-medium' : 'text-slate-500'
                          )}
                        >
                          {formatDate(workOrder.deadline)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredWorkOrders.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>没有找到匹配的工单</p>
            </div>
          )}
        </div>
      </div>

      <WorkOrderSidebar />

      <CreateWorkOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(workOrderId) => {
          selectWorkOrder(workOrderId);
        }}
      />
    </div>
  );
}
