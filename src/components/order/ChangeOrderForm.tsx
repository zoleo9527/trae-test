import React, { useState } from 'react';
import { Calendar, Package, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Order } from '../../types';

interface ChangeOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const ChangeOrderForm: React.FC<ChangeOrderFormProps> = ({ isOpen, onClose, order }) => {
  const { requestChange } = useOrderStore();
  const { user } = useAuthStore();
  const [pickupTime, setPickupTime] = useState(order.pickupTime);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!reason.trim()) {
      newErrors.reason = '请填写改单原因';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const changes = [];
    if (pickupTime !== order.pickupTime) {
      changes.push({
        field: 'pickupTime',
        oldValue: order.pickupTime,
        newValue: pickupTime,
      });
    }

    if (changes.length === 0) {
      setErrors({ form: '请至少修改一项内容' });
      return;
    }

    if (user) {
      requestChange(order.id, {
        orderId: order.id,
        requestedBy: user.name,
        requestedAt: new Date().toISOString(),
        reason,
        changes,
        status: 'pending',
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="申请改单">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">改单须知</p>
              <p className="text-xs text-orange-600 mt-1">
                改单申请需要店长审批通过后生效。如已开始生产，可能会产生原料损耗费用。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              取货时间
            </label>
            <input
              type="text"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none"
              placeholder="格式：YYYY-MM-DD HH:MM"
            />
            <p className="text-xs text-gray-500 mt-1">
              当前：{order.pickupTime}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              改单原因 *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors({ ...errors, reason: '' });
              }}
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none resize-none ${
                errors.reason ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="请详细说明改单原因..."
            />
            {errors.reason && (
              <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              补充说明
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none resize-none"
              placeholder="其他需要说明的内容..."
            />
          </div>
        </div>

        {errors.form && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
            {errors.form}
          </div>
        )}

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
            className="flex-1 py-3 bg-bakery-brown-500 text-white rounded-xl font-medium hover:bg-bakery-brown-600 transition-colors"
          >
            提交改单申请
          </button>
        </div>
      </form>
    </Modal>
  );
};
