import { Clock, AlertTriangle, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Order } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_BORDER_COLORS } from '@/types';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  showBatch?: boolean;
}

const formatDuration = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function OrderCard({ order, onClick, showBatch = false }: OrderCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border-l-4 border shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]',
        STATUS_BORDER_COLORS[order.status]
      )}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <span className="font-mono text-xs text-slate-500">{order.orderNo}</span>
          {order.isUrgent && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              急
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-slate-800 truncate mb-1">{order.garmentDesc}</p>
        <p className="text-xs text-slate-500">{order.storeName}</p>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <span className={cn('px-2 py-0.5 text-xs rounded text-white', STATUS_COLORS[order.status])}>
            {STATUS_LABELS[order.status]}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {formatDuration(order.updatedAt)}
          </span>
        </div>

        {showBatch && order.batchId && (
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Package className="w-3 h-3" />
            <span>{order.batchId}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
