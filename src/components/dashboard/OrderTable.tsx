import { useNavigate } from 'react-router-dom';
import { Eye, Clock, AlertTriangle, FileText, Coins, ClipboardCheck, GraduationCap, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import type { Order } from '@/types';
import { cn } from '@/lib/utils';

interface OrderTableProps {
  orders: Order[];
  loading?: boolean;
  onProcessOrder?: (orderId: string) => void;
}

export function OrderTable({ orders, loading, onProcessOrder }: OrderTableProps) {
  const navigate = useNavigate();

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'exception': return 'danger';
      case 'cancelled': return 'warning';
      case 'picked_up': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '待取餐';
      case 'picked_up': return '配送中';
      case 'delivered': return '已送达';
      case 'cancelled': return '已取消';
      case 'exception': return '异常';
      default: return status;
    }
  };

  const calculateTimeout = (order: Order) => {
    const promised = new Date(order.promisedTime);
    const delivered = new Date(order.deliveredTime);
    const diff = Math.round((delivered.getTime() - promised.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  };

  const handleProcessClick = (orderId: string) => {
    if (onProcessOrder) {
      onProcessOrder(orderId);
    } else {
      navigate(`/orders/${orderId}/process`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center p-4 border-b border-gray-100">
              <div className="w-24 h-4 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2 ml-4">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-2">暂无订单数据</p>
        <p className="text-sm text-gray-400">请调整筛选条件或稍后重试</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户/商家</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">骑手</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">超时</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联记录</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下单时间</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => {
              const timeout = calculateTimeout(order);
              const isException = order.status === 'exception' || timeout > 0;

              return (
                <tr
                  key={order.id}
                  className={cn(
                    'hover:bg-gray-50 transition-colors',
                    isException && 'bg-red-50/50'
                  )}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-sm text-primary-700 font-medium">{order.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.userName}</p>
                      <p className="text-xs text-gray-500">{order.merchantName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">{order.riderName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">¥{order.amount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={order.status}
                      label={getStatusLabel(order.status)}
                      variant={getStatusVariant(order.status)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {timeout > 0 ? (
                      <div className="flex items-center gap-1 text-accent-red">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-sm font-medium">{timeout}分钟</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {order.hasAppeal && (
                        <Tag variant="warning" title="有申诉">
                          <FileText className="w-3 h-3" />
                        </Tag>
                      )}
                      {order.hasSubsidy && (
                        <Tag variant="success" title="有补贴">
                          <Coins className="w-3 h-3" />
                        </Tag>
                      )}
                      {order.hasAssessment && (
                        <Tag variant="danger" title="有考核">
                          <ClipboardCheck className="w-3 h-3" />
                        </Tag>
                      )}
                      {order.hasTraining && (
                        <Tag variant="info" title="有培训">
                          <GraduationCap className="w-3 h-3" />
                        </Tag>
                      )}
                      {!order.hasAppeal && !order.hasSubsidy && !order.hasAssessment && !order.hasTraining && (
                        <span className="text-xs text-gray-400">无</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500 font-mono">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleProcessClick(order.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      处理
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
