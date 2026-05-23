import { useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Package,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  workOrderStatusLabels,
  workOrderStatusColors,
  workOrderPriorityLabels,
  workOrderPriorityColors,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { WorkOrder } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const workOrders = useStore((state) => state.workOrders);
  const alarms = useStore((state) => state.alarms);
  const getDashboardStats = useStore((state) => state.getDashboardStats);
  const selectWorkOrder = useStore((state) => state.selectWorkOrder);
  const currentUser = useStore((state) => state.currentUser);

  const stats = getDashboardStats();

  const pendingWorkOrders = workOrders.filter(
    (wo) => wo.status === 'pending' || wo.status === 'processing' || wo.status === 'returned'
  );

  const activeAlarms = alarms.filter((a) => a.status !== 'resolved');

  const statCards = [
    {
      label: '待处理工单',
      value: stats.pendingWorkOrders,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: '活动告警',
      value: stats.activeAlarms,
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      label: '累计停机(小时)',
      value: stats.totalDowntime,
      icon: Clock,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      label: '工单完成率',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  ];

  const handleWorkOrderClick = (workOrder: WorkOrder) => {
    selectWorkOrder(workOrder.id);
    navigate('/workorders');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            早上好，{currentUser?.name}
          </h1>
          <p className="text-slate-500 mt-1">
            今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        {stats.overdueWorkOrders > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">
              {stats.overdueWorkOrders} 个工单已超时
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bgColor)}>
                  <Icon className={cn('w-6 h-6', stat.iconColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              待处理工单
            </h2>
            <button
              onClick={() => navigate('/workorders')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingWorkOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p>暂无待处理工单</p>
              </div>
            ) : (
              pendingWorkOrders.slice(0, 5).map((workOrder) => {
                const isOverdue = new Date(workOrder.deadline) < new Date();
                return (
                  <div
                    key={workOrder.id}
                    onClick={() => handleWorkOrderClick(workOrder)}
                    className={cn(
                      'p-4 hover:bg-slate-50 cursor-pointer transition-colors',
                      isOverdue && 'bg-red-50/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-slate-800 truncate">
                            {workOrder.title}
                          </h3>
                          {isOverdue && (
                            <span className="flex-shrink-0 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              已超时
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1">
                          {workOrder.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full border',
                              workOrderStatusColors[workOrder.status]
                            )}
                          >
                            {workOrderStatusLabels[workOrder.status]}
                          </span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              workOrderPriorityColors[workOrder.priority]
                            )}
                          >
                            {workOrderPriorityLabels[workOrder.priority]}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                发电预警
              </h2>
              <button
                onClick={() => navigate('/alarms')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {activeAlarms.slice(0, 3).map((alarm) => (
                <div
                  key={alarm.id}
                  className="p-3 bg-slate-50 rounded-lg border-l-4 border-orange-500"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-800 text-sm">{alarm.type}</span>
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        alarm.level === 'critical' ? 'bg-red-500' : alarm.level === 'warning' ? 'bg-orange-500' : 'bg-yellow-500'
                      )}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{alarm.inverterId}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-500" />
                备件待审批
              </h2>
              <button
                onClick={() => navigate('/spareparts')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                管理 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-orange-600">2</p>
                <p className="text-sm text-slate-500 mt-1">个申请待审批</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
