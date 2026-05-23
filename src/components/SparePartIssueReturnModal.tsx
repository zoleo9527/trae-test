import { useState } from 'react';
import { X, Package, Send, ArrowLeftRight, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import {
  workOrderStatusLabels,
  workOrderStatusColors,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { SparePartRequest } from '../types';

interface SparePartIssueReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePartRequest | null;
  mode: 'issue' | 'return';
  onSuccess?: () => void;
}

export default function SparePartIssueReturnModal({
  isOpen,
  onClose,
  sparePart,
  mode,
  onSuccess,
}: SparePartIssueReturnModalProps) {
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueSparePart = useStore((state) => state.issueSparePart);
  const returnSparePart = useStore((state) => state.returnSparePart);
  const getUserName = useStore((state) => state.getUserName);
  const workOrders = useStore((state) => state.workOrders);
  const currentUser = useStore((state) => state.currentUser);

  const workOrder = sparePart ? workOrders.find((wo) => wo.id === sparePart.workorderId) : null;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MM-dd HH:mm', { locale: zhCN });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sparePart || isSubmitting) return;

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (mode === 'issue') {
      issueSparePart(sparePart.id, remark || '已发放');
    } else {
      returnSparePart(sparePart.id, remark || '已归还');
    }

    setIsSubmitting(false);
    setRemark('');
    onSuccess?.();
    onClose();
  };

  if (!isOpen || !sparePart) return null;

  const isIssue = mode === 'issue';
  const canPerform = isIssue
    ? (currentUser?.role === 'staff' || currentUser?.role === 'admin')
    : (currentUser?.role === 'engineer' || currentUser?.role === 'staff' || currentUser?.role === 'admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isIssue ? 'bg-blue-100' : 'bg-green-100'
            )}>
              {isIssue ? (
                <Send className={cn('w-5 h-5', isIssue ? 'text-blue-600' : 'text-green-600')} />
              ) : (
                <ArrowLeftRight className={cn('w-5 h-5', isIssue ? 'text-blue-600' : 'text-green-600')} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                {isIssue ? '备件发放' : '备件归还'}
              </h3>
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

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                <span className="text-slate-500">数量</span>
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
            <div className="p-4 bg-blue-50 rounded-lg space-y-2 border border-blue-100">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                关联工单
              </h4>
              <p className="font-medium text-slate-800">{workOrder.title}</p>
              <div className="flex items-center gap-3">
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
          )}

          {isIssue && sparePart.approvedAt && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  已由 <span className="font-medium">{getUserName(sparePart.approverId!)}</span> 于 {formatDate(sparePart.approvedAt)} 批准
                </span>
              </p>
            </div>
          )}

          {!isIssue && sparePart.issuedAt && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>
                  由 <span className="font-medium">{getUserName(sparePart.issuerId!)}</span> 于 {formatDate(sparePart.issuedAt)} 发放
                </span>
              </p>
              {sparePart.issueRemark && (
                <p className="text-xs text-slate-500 mt-1">发放备注: {sparePart.issueRemark}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {isIssue ? '发放备注' : '归还备注'}
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder={isIssue ? '输入发放备注，如：已签字确认领取...' : '输入归还备注，如：已检查完好归还...'}
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canPerform || isSubmitting}
              className={cn(
                'flex-1 px-4 py-2.5 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                isIssue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
              )}
            >
              {isSubmitting ? (
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
                isIssue ? '确认发放' : '确认归还'
              )}
            </button>
          </div>

          {!canPerform && (
            <p className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
              {isIssue
                ? '只有运维内勤或站长可以发放备件'
                : '没有权限执行此操作'}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
