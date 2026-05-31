import React, { useState } from 'react';
import { Modal, ModalFooter } from '@/components/shared/Modal';
import type { ReworkOrder } from '@/types';

interface ReworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  rework: ReworkOrder;
  mode: 'start' | 'submit' | 'review' | 'close';
  onConfirm: (data: { remark?: string; passed?: boolean; actualCost?: number }) => void;
}

export function ReworkModal({
  isOpen,
  onClose,
  rework,
  mode,
  onConfirm,
}: ReworkModalProps) {
  const [remark, setRemark] = useState('');
  const [passed, setPassed] = useState(true);
  const [actualCost, setActualCost] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setRemark('');
      setPassed(true);
      setActualCost(rework.estimatedCost?.toString() || '');
    }
  }, [isOpen, rework]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      remark: remark || undefined,
      passed: mode === 'review' ? passed : undefined,
      actualCost: actualCost ? parseFloat(actualCost) : undefined,
    });
    onClose();
  };

  const titles = {
    start: '开始整改',
    submit: '提交复查',
    review: '复查结果',
    close: '闭环确认',
  };

  const descriptions = {
    start: '请确认开始整改工作，开始后将记录整改时间',
    submit: '整改完成后提交复查申请，请上传整改后照片',
    review: '请检查整改质量，给出复查结论',
    close: '确认返工单闭环，相关费用将计入结算',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[mode]} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-800">{rework.title}</p>
          <p className="text-xs text-gray-500 mt-1">{rework.code}</p>
        </div>

        <p className="text-sm text-gray-600">{descriptions[mode]}</p>

        {(mode === 'review' || mode === 'close') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              实际费用 (元)
            </label>
            <input
              type="number"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              placeholder="请输入实际发生费用"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
            {rework.estimatedCost && (
              <p className="text-xs text-gray-500 mt-1">
                预估费用：¥{rework.estimatedCost.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {mode === 'review' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              复查结论
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPassed(true)}
                className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  passed
                    ? 'border-success-500 bg-success-50 text-success-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                复查通过
              </button>
              <button
                type="button"
                onClick={() => setPassed(false)}
                className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  !passed
                    ? 'border-danger-500 bg-danger-50 text-danger-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                需要返工
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            备注说明
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入备注说明..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
          />
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              mode === 'review' && !passed
                ? 'bg-danger-600 hover:bg-danger-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {mode === 'start' && '确认开始'}
            {mode === 'submit' && '提交申请'}
            {mode === 'review' && (passed ? '确认通过' : '要求返工')}
            {mode === 'close' && '确认闭环'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
