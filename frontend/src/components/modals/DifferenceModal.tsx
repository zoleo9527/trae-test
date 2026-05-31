import React, { useState } from 'react';
import { Modal, ModalFooter } from '@/components/shared/Modal';
import {
  DifferenceType,
  DifferenceTypeLabels,
  Responsibility,
  ResponsibilityLabels,
  MaterialItem,
} from '@/types';

interface DifferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialItems: MaterialItem[];
  onConfirm: (data: {
    type: DifferenceType;
    materialId?: string;
    materialName?: string;
    description: string;
    quantity?: number;
    amount: number;
    responsibility: Responsibility;
    evidenceUrls?: string[];
  }) => void;
}

export function DifferenceModal({
  isOpen,
  onClose,
  materialItems,
  onConfirm,
}: DifferenceModalProps) {
  const [type, setType] = useState<DifferenceType>('quantity');
  const [materialId, setMaterialId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [responsibility, setResponsibility] = useState<Responsibility>('logistics');

  React.useEffect(() => {
    if (isOpen) {
      setType('quantity');
      setMaterialId('');
      setDescription('');
      setQuantity('');
      setAmount('');
      setResponsibility('logistics');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMaterial = materialItems.find((m) => m.id === materialId);
    onConfirm({
      type,
      materialId: materialId || undefined,
      materialName: selectedMaterial
        ? `${selectedMaterial.name} ${selectedMaterial.spec}`
        : undefined,
      description,
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      amount: parseInt(amount, 10) || 0,
      responsibility,
    });
    onClose();
  };

  const selectedMaterial = materialItems.find((m) => m.id === materialId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="记录材料差异" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              差异类型
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DifferenceType)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              {Object.entries(DifferenceTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              涉及材料
            </label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="">请选择材料</option>
              {materialItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              差异数量
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="请输入差异数量"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              涉及金额 (元)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入涉及金额"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            初步判定责任方
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(ResponsibilityLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setResponsibility(key as Responsibility)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  responsibility === key
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            差异描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述差异情况..."
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            required
          />
        </div>

        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <p className="text-sm text-warning-800">
            <strong>提示：</strong>
            请务必拍照留证，后续责任判定和结算依据将以此为准。建议拍摄：外包装、损坏部位、整体场景等照片。
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
            disabled={!description.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交差异记录
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
