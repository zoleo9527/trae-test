import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useRoleStore } from '@/store/useRoleStore';
import { useProcessingStore } from '@/store/useProcessingStore';
import OrderCard from '@/components/OrderCard';
import { STATUS_LABELS, STATUS_COLORS, type OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

const PIPELINE_STATUSES: OrderStatus[] = [
  'collected',
  'sorting',
  'washing',
  'inspecting',
  'handover',
  'verifying',
];

const SPECIAL_STATUSES: OrderStatus[] = ['completed', 'rejected', 'rewashing', 'damage_claim'];

export default function Pipeline() {
  const { orders } = useOrderStore();
  const { currentRole } = useRoleStore();
  const { openProcessing } = useProcessingStore();
  const [filterMy, setFilterMy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((order) => {
    if (filterMy && order.assignedTo !== currentRole) return false;
    if (searchQuery && !order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !order.storeName.includes(searchQuery) &&
        !order.garmentDesc.includes(searchQuery)) return false;
    return true;
  });

  const getOrdersByStatus = (status: OrderStatus) =>
    filteredOrders.filter((o) => o.status === status);

  const handleCardClick = (orderId: string, status: OrderStatus) => {
    let mode: 'sort' | 'inspect' | 'handover' | 'verify' | 'damage' | 'rewash';
    switch (status) {
      case 'collected':
      case 'sorting':
        mode = 'sort';
        break;
      case 'washing':
      case 'inspecting':
      case 'rewashing':
        mode = 'inspect';
        break;
      case 'handover':
        mode = 'handover';
        break;
      case 'verifying':
      case 'rejected':
      case 'damage_claim':
        mode = 'verify';
        break;
      case 'completed':
        return;
      default:
        mode = 'inspect';
    }
    openProcessing(orderId, mode);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">订单流水线</h1>
          <p className="text-slate-500 mt-1">实时跟踪所有订单处理进度</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索订单号/门店/衣物..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-64"
            />
          </div>
          <button
            onClick={() => setFilterMy(!filterMy)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filterMy
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            <Filter className="w-4 h-4" />
            {filterMy ? '只看我的' : '全部订单'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {PIPELINE_STATUSES.map((status, index) => {
            const statusOrders = getOrdersByStatus(status);
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="w-72 flex-shrink-0 flex flex-col bg-slate-100 rounded-xl overflow-hidden"
              >
                <div className={cn('p-3', STATUS_COLORS[status])}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-sm">{STATUS_LABELS[status]}</span>
                    <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full">
                      {statusOrders.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                  <AnimatePresence mode="popLayout">
                    {statusOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleCardClick(order.id, status)}
                        showBatch
                      />
                    ))}
                  </AnimatePresence>
                  {statusOrders.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      暂无订单
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-4">
          {SPECIAL_STATUSES.map((status, index) => {
            const statusOrders = getOrdersByStatus(status);
            if (statusOrders.length === 0) return null;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className="w-72 flex-shrink-0 flex flex-col bg-slate-100 rounded-xl overflow-hidden"
              >
                <div className={cn('p-3', STATUS_COLORS[status])}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-sm">{STATUS_LABELS[status]}</span>
                    <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full">
                      {statusOrders.length}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {statusOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleCardClick(order.id, status)}
                        showBatch
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
