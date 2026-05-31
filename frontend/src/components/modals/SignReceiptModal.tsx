import React, { useState } from 'react';
import { Modal, ModalFooter } from '@/components/shared/Modal';
import type { Receipt, ShippingOrder } from '@/types';

interface SignReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt;
  shipping: ShippingOrder;
  onConfirm: (location: string, quantities: Record<string, number>) => void;
}

export function SignReceiptModal({
  isOpen,
  onClose,
  receipt,
  shipping,
  onConfirm,
}: SignReceiptModalProps) {
  const [location, setLocation] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  React.useEffect(() => {
    if (isOpen) {
      const initial: Record<string, number> = {};
      shipping.materialItems.forEach((item) => {
        initial[item.id] = item.quantity;
      });
      setQuantities(initial);
      setLocation('');
    }
  }, [isOpen, shipping]);

  const handleQuantityChange = (materialId: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setQuantities((prev) => ({ ...prev, [materialId]: num }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    onConfirm(location, quantities);
    onClose();
  };

  const hasDifferences = shipping.materialItems.some(
    (item) => (quantities[item.id] ?? item.quantity) !== item.quantity
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="材料签收" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            签收地点
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="请输入签收地点"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              实收数量
            </label>
            {hasDifferences && (
              <span className="text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded">
                存在数量差异
              </span>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                    材料名称
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                    规格
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">
                    发货数量
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">
                    实收数量
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">
                    差异
                  </th>
                </tr>
              </thead>
              <tbody>
                {shipping.materialItems.map((item) => {
                  const received = quantities[item.id] ?? item.quantity;
                  const diff = received - item.quantity;
                  return (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-800">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.spec}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-800">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={received}
                          onChange={(e) =>
                            handleQuantityChange(item.id, e.target.value)
                          }
                          min="0"
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {diff !== 0 ? (
                          <span
                            className={
                              diff < 0
                                ? 'text-danger-600 font-medium'
                                : 'text-success-600 font-medium'
                            }
                          >
                            {diff > 0 ? '+' : ''}
                            {diff} {item.unit}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
            disabled={!location.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认签收
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
