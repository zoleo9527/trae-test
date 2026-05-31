import React, { useState } from 'react';
import { DollarSign, AlertTriangle, Calculator } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Order } from '../../types';

interface RefundFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

const refundReasons = [
  { value: 'customer_cancel', label: '客户取消订单' },
  { value: 'customer_illness', label: '客户生病/突发情况' },
  { value: 'product_issue', label: '产品质量问题' },
  { value: 'schedule_conflict', label: '排期冲突无法调整' },
  { value: 'material_shortage', label: '原料短缺无法制作' },
  { value: 'other', label: '其他原因' },
];

export const RefundForm: React.FC<RefundFormProps> = ({ isOpen, onClose, order }) => {
  const { requestRefund } = useOrderStore();
  const { user } = useAuthStore();
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [refundAmount, setRefundAmount] = useState(order.deposit.toString());
  const [materialLoss, setMaterialLoss] = useState('0');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculatedRefund = Math.max(0, order.deposit - Number(materialLoss || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!reason) {
      newErrors.reason = '请选择退款原因';
    }
    if (!refundAmount || Number(refundAmount) < 0) {
      newErrors.refundAmount = '请输入有效退款金额';
    }
    if (Number(refundAmount) > order.totalAmount) {
      newErrors.refundAmount = '退款金额不能超过订单总额';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (user) {
      const selectedReason = refundReasons.find((r) => r.value === reason);
      requestRefund(order.id, {
        orderId: order.id,
        requestedBy: user.name,
        requestedAt: new Date().toISOString(),
        reason: selectedReason?.label + (reasonDetail ? ` - ${reasonDetail}` : ''),
        refundAmount: Number(refundAmount),
        status: 'pending',
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="申请退款">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">退款须知</p>
              <p className="text-xs text-red-600 mt-1">
                退款申请需要店长审批。如已采购原料或开始生产，请如实填写损耗费用，从押金中扣除。
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">订单总额</span>
            <span className="font-medium text-gray-800">¥{order.totalAmount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">已收押金</span>
            <span className="font-medium text-gray-800">¥{order.deposit}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              退款原因 *
            </label>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors({ ...errors, reason: '' });
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none bg-white ${
                errors.reason ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">请选择退款原因</option>
              {refundReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原因详情
            </label>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none resize-none"
              placeholder="请补充说明具体情况..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calculator className="w-4 h-4 inline mr-2" />
              原料损耗费用
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
              <input
                type="number"
                value={materialLoss}
                onChange={(e) => setMaterialLoss(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none"
                placeholder="0"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              已采购但无法退回的原料成本，将从押金中扣除
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              实际退款金额 *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => {
                  setRefundAmount(e.target.value);
                  if (errors.refundAmount) setErrors({ ...errors, refundAmount: '' });
                }}
                className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none ${
                  errors.refundAmount ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="0"
                min="0"
              />
            </div>
            {errors.refundAmount && (
              <p className="text-xs text-red-500 mt-1">{errors.refundAmount}</p>
            )}
            {calculatedRefund !== Number(refundAmount) && (
              <p className="text-xs text-orange-600 mt-1">
                建议退款金额：¥{calculatedRefund}（押金 - 原料损耗）
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            提交退款申请
          </button>
        </div>
      </form>
    </Modal>
  );
};
