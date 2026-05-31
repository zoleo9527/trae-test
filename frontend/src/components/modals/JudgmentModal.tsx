import React, { useState } from 'react';
import { Modal, ModalFooter } from '@/components/shared/Modal';
import { Responsibility, ResponsibilityLabels, DifferenceRecord } from '@/types';

interface JudgmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  difference: DifferenceRecord;
  onConfirm: (responsibility: Responsibility, resolution: string) => void;
}

export function JudgmentModal({
  isOpen,
  onClose,
  difference,
  onConfirm,
}: JudgmentModalProps) {
  const [responsibility, setResponsibility] = useState<Responsibility>(
    difference.responsibility
  );
  const [resolution, setResolution] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setResponsibility(difference.responsibility);
      setResolution('');
    }
  }, [isOpen, difference]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolution.trim()) return;
    onConfirm(responsibility, resolution);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="责任判定" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">
              {difference.materialName}
            </span>
            <span className="text-sm text-danger-600 font-medium">
              ¥{difference.amount.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600">{difference.description}</p>
          {difference.evidenceUrls && difference.evidenceUrls.length > 0 && (
            <div className="flex gap-2 mt-2">
              {difference.evidenceUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`凭证${idx + 1}`}
                  className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            最终责任判定
          </label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(ResponsibilityLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setResponsibility(key as Responsibility)}
                className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  responsibility === key
                    ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            处理方案
          </label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="请详细说明处理方案和结算方式..."
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            required
          />
        </div>

        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-800">
            <strong>重要提示：</strong>
            责任判定结果将直接影响结算金额和责任方考核，请谨慎裁定。判定后将自动流转至结算环节。
          </p>
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
            disabled={!resolution.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认判定
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
