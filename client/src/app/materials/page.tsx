'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { AlertTriangle, Plus, Minus, Eye } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
  supplier: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockType, setStockType] = useState<'in' | 'out'>('in');
  const [stockQty, setStockQty] = useState('');
  const [stockReason, setStockReason] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const res = await api.get('/materials');
      setMaterials(res.data.materials);
    } catch (error) {
      console.error('加载原料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedMaterial || !stockQty) return;
    try {
      const quantity = stockType === 'in' ? parseFloat(stockQty) : -parseFloat(stockQty);
      await api.post(`/materials/${selectedMaterial.id}/stock`, {
        quantity,
        type: stockType === 'in' ? 'PURCHASE' : 'USE',
        reason: stockReason,
      });
      setShowStockModal(false);
      setStockQty('');
      setStockReason('');
      loadMaterials();
    } catch (error) {
      alert('操作失败');
    }
  };

  const isLowStock = (material: Material) => {
    return material.currentStock <= material.minStock;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">加载中...</p>
        </div>
      </Layout>
    );
  }

  const lowStockCount = materials.filter(isLowStock).length;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">原料管理</h2>
          {lowStockCount > 0 && (
            <span className="flex items-center gap-1 text-red-600 text-sm bg-red-50 px-3 py-1 rounded-full">
              <AlertTriangle size={14} />
              {lowStockCount} 种原料库存不足
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>原料名称</th>
              <th>分类</th>
              <th>当前库存</th>
              <th>最低库存</th>
              <th>单价</th>
              <th>供应商</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr key={material.id} className={isLowStock(material) ? 'bg-red-50' : ''}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{material.name}</span>
                    {isLowStock(material) && (
                      <AlertTriangle size={14} className="text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{material.sku}</p>
                </td>
                <td>{material.category}</td>
                <td className={isLowStock(material) ? 'text-red-600 font-medium' : ''}>
                  {material.currentStock} {material.unit}
                </td>
                <td>{material.minStock} {material.unit}</td>
                <td>¥{material.unitPrice}/{material.unit}</td>
                <td className="text-sm">{material.supplier}</td>
                <td>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setSelectedMaterial(material);
                        setStockType('in');
                        setShowStockModal(true);
                      }}
                      className="p-1 hover:bg-green-100 rounded text-green-600"
                      title="入库"
                    >
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedMaterial(material);
                        setStockType('out');
                        setShowStockModal(true);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="出库"
                    >
                      <Minus size={16} />
                    </button>
                    <button 
                      className="p-1 hover:bg-gray-100 rounded"
                      title="查看详情"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showStockModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-4">
            <h3 className="font-semibold mb-4">
              {stockType === 'in' ? '原料入库' : '原料出库'} - {selectedMaterial.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label>数量 ({selectedMaterial.unit})</label>
                <input
                  type="number"
                  step="0.001"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  placeholder="请输入数量"
                />
              </div>
              <div>
                <label>原因</label>
                <input
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder={stockType === 'in' ? '如：采购入库、盘盈' : '如：生产消耗、报损'}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setShowStockModal(false)} 
                className="btn btn-secondary"
              >
                取消
              </button>
              <button onClick={handleUpdateStock} className="btn btn-primary">
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
