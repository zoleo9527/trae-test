import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, RotateCcw, ArrowRight, Clock3 } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useRoleStore } from '@/store/useRoleStore';
import { useProcessingStore } from '@/store/useProcessingStore';
import { STATUS_LABELS, ROLE_LABELS, type ActivityLog, type ProcessingContext } from '@/types';
import { mockActivityLogs } from '@/data/mockData';
import { cn } from '@/lib/utils';

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}天前`;
  if (hours > 0) return `${hours}小时前`;
  return `${minutes}分钟前`;
};

const getHoursDiff = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / 3600000);
};

export default function Home() {
  const { orders, receipts } = useOrderStore();
  const { currentRole } = useRoleStore();
  const { openProcessing } = useProcessingStore();
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('mine');

  const myOrders = orders.filter((o) => o.assignedTo === currentRole);
  const displayOrders = activeTab === 'mine' ? myOrders : orders;

  const stats = {
    pending: displayOrders.filter((o) => !['completed', 'rejected'].includes(o.status)).length,
    rejected: displayOrders.filter((o) => o.status === 'rejected').length,
    needReview: displayOrders.filter((o) => o.status === 'damage_claim' || o.status === 'rewashing').length,
    completedToday: displayOrders.filter(
      (o) => o.status === 'completed' && getHoursDiff(o.updatedAt) < 24
    ).length,
  };

  const overdueOrders = displayOrders.filter((o) => o.isOverdue);
  const recentLogs = mockActivityLogs.slice(0, 8);

  const todoItems = myOrders
    .filter((o) => !['completed', 'rejected'].includes(o.status))
    .slice(0, 6)
    .sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime();
    });

  const statCards = [
    { label: '待处理', value: stats.pending, color: 'amber', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    { label: '已驳回', value: stats.rejected, color: 'red', icon: RotateCcw, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    { label: '需回查', value: stats.needReview, color: 'purple', icon: AlertTriangle, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    { label: '今日完成', value: stats.completedToday, color: 'emerald', icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            欢迎回来，{ROLE_LABELS[currentRole]}
          </h1>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('mine')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === 'mine' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            我的任务
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            全局视图
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-4 gap-6"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn('p-6 rounded-xl border', stat.bg, stat.border)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm">{stat.label}</p>
                <p className={cn('text-3xl font-bold mt-2', stat.text)}>{stat.value}</p>
              </div>
              <div className={cn('p-3 rounded-lg', stat.bg.replace('50', '100'))}>
                <stat.icon className={cn('w-6 h-6', stat.text)} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {overdueOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">超时预警 - {overdueOrders.length} 笔订单已超时</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {overdueOrders.map((order) => {
              const getProcessingMode = (): ProcessingContext['mode'] => {
                switch (order.status) {
                  case 'collected':
                  case 'sorting':
                    return 'sort';
                  case 'washing':
                  case 'inspecting':
                    return 'inspect';
                  case 'rewashing':
                    return 'rewash';
                  case 'handover':
                    return 'handover';
                  case 'verifying':
                    return 'verify';
                  case 'damage_claim':
                    return 'damage';
                  case 'rejected': {
                    const receipt = receipts.find((r) => r.orderId === order.id);
                    if (receipt?.isRejected) return 'rejected_review';
                    if (order.assignedTo === 'factory_manager') return 'damage';
                    return 'rejected_review';
                  }
                  default:
                    return 'inspect';
                }
              };
              return (
                <motion.div
                  key={order.id}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  onClick={() => {
                    if (order.assignedTo === currentRole) {
                      openProcessing(order.id, getProcessingMode());
                    }
                  }}
                  className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 cursor-pointer hover:bg-white/30 transition-colors"
                >
                  <p className="text-white font-medium text-sm">{order.orderNo}</p>
                  <p className="text-white/80 text-xs mt-1">{order.storeName} · {order.garmentType}</p>
                  <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                    <Clock3 className="w-3 h-3" />
                    已超时 {getHoursDiff(order.deadlineAt)} 小时
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="col-span-2 bg-white rounded-xl border border-slate-200 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">今日待办</h2>
          {todoItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无待办任务</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todoItems.map((order, index) => {
                const getProcessingMode = (): ProcessingContext['mode'] => {
                  switch (order.status) {
                    case 'collected':
                    case 'sorting':
                      return 'sort';
                    case 'washing':
                    case 'inspecting':
                      return 'inspect';
                    case 'rewashing':
                      return 'rewash';
                    case 'handover':
                      return 'handover';
                    case 'verifying':
                      return 'verify';
                    case 'damage_claim':
                      return 'damage';
                    case 'rejected': {
                      const receipt = receipts.find((r) => r.orderId === order.id);
                      if (receipt?.isRejected) return 'rejected_review';
                      if (order.assignedTo === 'factory_manager') return 'damage';
                      return 'rejected_review';
                    }
                    default:
                      return 'inspect';
                  }
                };
                return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  onClick={() => {
                    openProcessing(order.id, getProcessingMode());
                  }}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                    order.isUrgent ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="w-1 h-12 rounded-full bg-slate-200 flex-shrink-0">
                    <div
                      className={cn(
                        'w-full rounded-full transition-all',
                        order.isUrgent ? 'bg-amber-500 h-full' : 'bg-slate-300 h-1/2'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-600">{order.orderNo}</span>
                      {order.isUrgent && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">紧急</span>
                      )}
                    </div>
                    <p className="text-slate-800 font-medium mt-1 truncate">
                      {order.storeName} · {order.garmentDesc}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      {STATUS_LABELS[order.status]} · 停留 {formatTime(order.updatedAt)}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300" />
                </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">最近活动</h2>
          <div className="space-y-4">
            {recentLogs.map((log: ActivityLog, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  {index < recentLogs.length - 1 && <div className="w-px h-full bg-slate-200 mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{log.action}</span>
                    <span className="text-xs text-slate-400">{formatTime(log.timestamp)}</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{log.detail}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {ROLE_LABELS[log.role]} · {log.operator}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
