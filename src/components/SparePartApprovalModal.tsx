import { useState } from 'react';
import { X, Package, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { SparePartRequest } from '../types';

interface SparePartApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePartRequest | null;
}

export default function SparePartApprovalModal({
  isOpen,
  onClose,
  sparePart,
}: SparePartApprovalModalProps) {
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const approveSparePart = useStore((state) => state.approveSparePart);
  const rejectSparePart = useStore((state) => state.rejectSparePart);
  const getUserName = useStore((state) => state.getUserName);
  const workOrders = useStore((state) => state.workOrders);

  const workOrder = sparePart ? workOrders.find((wo) => wo.id === sparePart.workorderId) : null;

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
    onClose();
  };

  if (!isOpen || !sparePart) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
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

        <div className="p-4 space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">备件名称</span>
              <span className="font-medium text-slate-800">{sparePart.partName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">申请数量</span>
              <span className="font-medium text-slate-800">{sparePart.quantity} {sparePart.unit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">申请人</span>
              <span className="font-medium text-slate-800">{getUserName(sparePart.requesterId)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">关联工单</span>
              <span className="font-medium text-slate-800">{workOrder?.title || sparePart.workorderId}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <span className="font-medium">提示：</span>
              {actionType === 'approve' ? '批准后工单状态将恢复为"处理中"，工程师可继续工作' : '拒绝后工单状态将恢复为"处理中"，需重新评估备件需求'}
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

          <div className="flex items-center gap-3 pt-2">
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
