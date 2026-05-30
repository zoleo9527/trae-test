import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Clock, CheckCircle, Loader2, ChevronRight, FileText } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { mockBatches } from '@/data/mockData';
import { STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDuration = (start: string, end: string | null) => {
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const hours = Math.floor((endTime - startTime) / 3600000);
  const minutes = Math.floor(((endTime - startTime) % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

export default function Batches() {
  const { orders } = useOrderStore();
  const [selectedBatch, setSelectedBatch] = useState<string | null>(mockBatches[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'washing' | 'completed'>('all');

  const filteredBatches = mockBatches.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (searchQuery && !b.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !b.washType.includes(searchQuery)) return false;
    return true;
  });

  const currentBatch = mockBatches.find((b) => b.id === selectedBatch);
  const batchOrders = currentBatch
    ? orders.filter((o) => currentBatch.orderIds.includes(o.id))
    : [];

  const statusConfig = {
    pending: { label: '等待中', color: 'bg-slate-100 text-slate-600', icon: Clock },
    washing: { label: '洗涤中', color: 'bg-blue-100 text-blue-600', icon: Loader2 },
    completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">批次追踪</h1>
          <p className="text-slate-500 mt-1">管理洗涤批次，追踪单件衣物溯源</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索批次号/洗涤类型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-64"
            />
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {[{ key: 'all', label: '全部' }, { key: 'washing', label: '洗涤中' }, { key: 'completed', label: '已完成' }].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key as typeof filterStatus)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  filterStatus === tab.key
                    ? 'bg-white shadow-sm text-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="w-96 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">批次列表</h3>
            <p className="text-sm text-slate-500 mt-1">共 {filteredBatches.length} 个批次</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredBatches.map((batch, index) => {
              const config = statusConfig[batch.status];
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={batch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => setSelectedBatch(batch.id)}
                  className={cn(
                    'p-4 border-b border-slate-100 cursor-pointer transition-all',
                    selectedBatch === batch.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium text-slate-800">{batch.batchNo}</p>
                      <p className="text-sm text-slate-500 mt-1">{batch.washType}</p>
                    </div>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1', config.color)}>
                      <StatusIcon className={cn('w-3 h-3', batch.status === 'washing' && 'animate-spin')} />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {batch.orderIds.length} 件衣物
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getDuration(batch.washStartTime, batch.washEndTime)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          {currentBatch ? (
            <>
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{currentBatch.batchNo}</h3>
                    <p className="text-slate-500 mt-1">{currentBatch.washType} · {batchOrders.length} 件衣物</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-slate-500">开始时间</p>
                      <p className="font-medium text-slate-700 mt-1">{formatTime(currentBatch.washStartTime)}</p>
                    </div>
                    {currentBatch.washEndTime && (
                      <div>
                        <p className="text-slate-500">完成时间</p>
                        <p className="font-medium text-slate-700 mt-1">{formatTime(currentBatch.washEndTime)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500">耗时</p>
                      <p className="font-medium text-slate-700 mt-1">{getDuration(currentBatch.washStartTime, currentBatch.washEndTime)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <h4 className="font-medium text-slate-700 mb-4">批次内衣物</h4>
                <div className="space-y-3">
                  {batchOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-slate-600">{order.orderNo}</span>
                          {order.isUrgent && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">急</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 mt-1">{order.garmentDesc}</p>
                        <p className="text-xs text-slate-500 mt-1">{order.storeName} · {order.customerName}</p>
                      </div>
                      <span className={cn('px-3 py-1 rounded-full text-xs font-medium text-white', order.isOverdue ? 'bg-red-500' : 'bg-emerald-500')}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>选择一个批次查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
