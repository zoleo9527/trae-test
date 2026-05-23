import { useState } from 'react';
import { X, Package, CheckCircle, XCircle, Clock, User, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import {
  actionLabels,
  workOrderStatusLabels,
  workOrderStatusColors,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { SparePartRequest, WorkOrderLog } from '../types';

interface SparePartApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePartRequest | null;
  onSuccess?: (workorderId: string) => void;
}

export default function SparePartApprovalModal({
  isOpen,
  onClose,
  sparePart,
  onSuccess,
}: SparePartApprovalModalProps) {
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const approveSparePart = useStore((state) => state.approveSparePart);
  const rejectSparePart = useStore((state) => state.rejectSparePart);
  const getUserName = useStore((state) => state.getUserName);
  const workOrders = useStore((state) => state.workOrders);
  const getWorkOrderLogs = useStore((state) => state.getWorkOrderLogs);

  const workOrder = sparePart ? workOrders.find((wo) => wo.id === sparePart.workorderId) : null;
  const workOrderLogs = workOrder ? getWorkOrderLogs(workOrder.id).slice(0, 5) : [];

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MM-dd HH:mm', { locale: zhCN });
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!sparePart) return;

    setActionType(action);
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (action === 'approve') {
      approveSparePart(sparePart.id, remark || '已批准');
    } else {
      rejectSparePart(sparePart.id, remark || '已拒绝');
    }

    setIsSubmitting(false);
    setActionType(null);
    setRemark('');
    onSuccess?.(sparePart.workorderId);
    onClose();
  };

  if (!isOpen || !sparePart) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">备件申请审批</h3>
              <p className="text-xs text-slate-500">{sparePart.partCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              备件信息
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">备件名称</span>
                <p className="font-medium text-slate-800">{sparePart.partName}</p>
              </div>
              <div>
                <span className="text-slate-500">申请数量</span>
                <p className="font-medium text-slate-800">{sparePart.quantity} {sparePart.unit}</p>
              </div>
              <div>
                <span className="text-slate-500">申请人</span>
                <p className="font-medium text-slate-800">{getUserName(sparePart.requesterId)}</p>
              </div>
              <div>
                <span className="text-slate-500">申请时间</span>
                <p className="font-medium text-slate-800">{formatDate(sparePart.createdAt)}</p>
              </div>
            </div>
          </div>

          {workOrder && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3 border border-blue-100">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                关联工单
              </h4>
              <div>
                <p className="font-medium text-slate-800">{workOrder.title}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      workOrderStatusColors[workOrder.status]
                    )}
                  >
                    {workOrderStatusLabels[workOrder.status]}
                  </span>
                  <span className="text-xs text-slate-500">
                    负责人: {getUserName(workOrder.assigneeId)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {workOrderLogs.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                最近处理记录
              </h4>
              <div className="space-y-2">
                {workOrderLogs.map((log: WorkOrderLog) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-slate-300 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">
                          {actionLabels[log.action] || log.action}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">
                        {log.remark}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        <User className="w-3 h-3 inline mr-1" />
                        {getUserName(log.operatorId)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <span className="font-medium">提示：</span>
              {actionType === 'approve'
                ? '批准后工单状态将恢复为"处理中"，工程师可继续工作'
                : '拒绝后工单状态将恢复为"处理中"，需重新评估备件需求'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              审批备注
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="输入审批意见..."
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 p-4 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAction('reject')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && actionType === 'reject' ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  处理中...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  拒绝申请
                </>
              )}
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && actionType === 'approve' ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  处理中...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  批准申请
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
