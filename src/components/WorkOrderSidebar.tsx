import { useState } from 'react';
import { X, Clock, User, Calendar, AlertTriangle, Package, Send, FileText, Camera, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import {
  workOrderStatusLabels,
  workOrderStatusColors,
  workOrderPriorityLabels,
  workOrderPriorityColors,
  sparePartStatusLabels,
  sparePartStatusColors,
  actionLabels,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { WorkOrderStatus } from '../types';

export default function WorkOrderSidebar() {
  const [remark, setRemark] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'logs' | 'spareparts'>('info');

  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const selectedWorkOrderId = useStore((state) => state.selectedWorkOrderId);
  const workOrders = useStore((state) => state.workOrders);
  const selectWorkOrder = useStore((state) => state.selectWorkOrder);
  const updateWorkOrderStatus = useStore((state) => state.updateWorkOrderStatus);
  const requestSparePart = useStore((state) => state.requestSparePart);
  const getWorkOrderLogs = useStore((state) => state.getWorkOrderLogs);
  const getWorkOrderAlarms = useStore((state) => state.getWorkOrderAlarms);
  const getWorkOrderSpareParts = useStore((state) => state.getWorkOrderSpareParts);
  const getUserName = useStore((state) => state.getUserName);
  const currentUser = useStore((state) => state.currentUser);

  const workOrder = workOrders.find((wo) => wo.id === selectedWorkOrderId);
  const logs = workOrder ? getWorkOrderLogs(workOrder.id) : [];
  const alarms = workOrder ? getWorkOrderAlarms(workOrder.id) : [];
  const spareParts = workOrder ? getWorkOrderSpareParts(workOrder.id) : [];

  const closeSidebar = () => {
    selectWorkOrder(null);
    setRemark('');
  };

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    if (!workOrder || !remark.trim()) return;
    updateWorkOrderStatus(workOrder.id, newStatus, remark);
    setRemark('');
  };

  const handleRequestSparePart = () => {
    if (!workOrder) return;
    requestSparePart(workOrder.id, '熔断器', 'RT18-32/10A', 2, '个');
  };

  const getAvailableActions = (): { status: WorkOrderStatus; label: string; color: string }[] => {
    if (!workOrder) return [];
    
    const role = currentUser?.role;
    const status = workOrder.status;

    if (role === 'engineer') {
      switch (status) {
        case 'pending':
        case 'returned':
          return [{ status: 'processing', label: '开始处理', color: 'bg-blue-600 hover:bg-blue-700' }];
        case 'processing':
          return [
            { status: 'waiting_spare', label: '申请备件', color: 'bg-orange-600 hover:bg-orange-700' },
            { status: 'reviewing', label: '提交完成', color: 'bg-green-600 hover:bg-green-700' },
          ];
        case 'waiting_spare':
          return [{ status: 'processing', label: '备件到位继续', color: 'bg-blue-600 hover:bg-blue-700' }];
        default:
          return [];
      }
    }

    if (role === 'admin') {
      switch (status) {
        case 'reviewing':
          return [
            { status: 'closed', label: '审核通过', color: 'bg-green-600 hover:bg-green-700' },
            { status: 'returned', label: '退回重处理', color: 'bg-red-600 hover:bg-red-700' },
          ];
        default:
          return [];
      }
    }

    if (role === 'staff') {
      return [];
    }

    return [];
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: zhCN });
  };

  if (!sidebarOpen || !workOrder) {
    return null;
  }

  const actions = getAvailableActions();

  return (
    <div
      className={cn(
        'fixed right-0 top-16 bottom-0 w-full lg:w-[480px] bg-white border-l border-slate-200 shadow-xl z-40 flex flex-col transition-transform duration-300 transform',
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-slate-800">工单处理</h3>
          <span
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border font-medium',
              workOrderStatusColors[workOrder.status]
            )}
          >
            {workOrderStatusLabels[workOrder.status]}
          </span>
        </div>
        <button
          onClick={closeSidebar}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        {[
          { id: 'info', label: '详情', icon: FileText },
          { id: 'logs', label: '处理记录', icon: Clock },
          { id: 'spareparts', label: '备件', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">{workOrder.title}</h4>
              <p className="text-sm text-slate-600">{workOrder.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">负责人:</span>
                <span className="text-slate-700 font-medium">{getUserName(workOrder.assigneeId)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">优先级:</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    workOrderPriorityColors[workOrder.priority]
                  )}
                >
                  {workOrderPriorityLabels[workOrder.priority]}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">创建时间:</span>
                <span className="text-slate-700">{formatDate(workOrder.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">截止时间:</span>
                <span className="text-slate-700">{formatDate(workOrder.deadline)}</span>
              </div>
            </div>

            {alarms.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  关联发电预警
                </h5>
                <div className="space-y-2">
                  {alarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-800 text-sm">{alarm.type}</span>
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            alarm.level === 'critical'
                              ? 'bg-red-500'
                              : alarm.level === 'warning'
                              ? 'bg-orange-500'
                              : 'bg-yellow-500'
                          )}
                        />
                      </div>
                      <p className="text-xs text-slate-600">{alarm.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>设备: {alarm.inverterId}</span>
                        <span>当前值: {alarm.currentValue}</span>
                        <span>阈值: {alarm.thresholdValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workOrder.photos.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" />
                  现场照片
                </h5>
                <div className="grid grid-cols-3 gap-2">
                  {workOrder.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center"
                    >
                      <Camera className="w-8 h-8 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-4">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-6">
                {logs.map((log, index) => (
                  <div key={log.id} className="relative pl-10">
                    <div
                      className={cn(
                        'absolute left-2 top-1 w-5 h-5 rounded-full border-2 border-white',
                        index === 0 ? 'bg-blue-500' : 'bg-slate-300'
                      )}
                    />
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-800 text-sm">
                          {actionLabels[log.action] || log.action}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600">{log.remark}</p>
                      <p className="text-xs text-slate-400 mt-1">操作人: {getUserName(log.operatorId)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spareparts' && (
          <div className="p-4">
            {spareParts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>暂无备件领用记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {spareParts.map((sp) => (
                  <div key={sp.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-800">{sp.partName}</span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          sparePartStatusColors[sp.status]
                        )}
                      >
                        {sparePartStatusLabels[sp.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <span>型号: {sp.partCode}</span>
                      <span>数量: {sp.quantity}{sp.unit}</span>
                      <span>申请人: {getUserName(sp.requesterId)}</span>
                      <span>申请时间: {formatDate(sp.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4 bg-slate-50">
        <div className="mb-4">
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="输入处理备注..."
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            rows={3}
          />
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.status}
                onClick={() => handleStatusChange(action.status)}
                disabled={!remark.trim()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  action.color
                )}
              >
                <Send className="w-4 h-4" />
                {action.label}
              </button>
            ))}
          </div>
        )}

        {currentUser?.role === 'engineer' && workOrder.status === 'processing' && (
          <button
            onClick={handleRequestSparePart}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
          >
            <Package className="w-4 h-4" />
            申请备件
          </button>
        )}

        {actions.length === 0 && (
          <p className="text-center text-sm text-slate-500">
            当前状态无可用操作，请等待其他角色处理
          </p>
        )}
      </div>
    </div>
  );
}
