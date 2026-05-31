'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { TrendingDown, BarChart3, Plus } from 'lucide-react';

interface WasteRecord {
  id: string;
  material?: { name: string; unit: string };
  production?: { batchNo: string };
  order?: { orderNo: string };
  quantity: number;
  reason: string;
  reasonDetail?: string;
  unitPrice: number;
  totalAmount: number;
  recordedBy: { name: string };
  createdAt: string;
}

const wasteReasonMap: Record<string, string> = {
  OVERBAKE: '烤过了',
  UNDERBAKE: '没烤熟',
  DAMAGE: '损坏',
  EXPIRED: '过期',
  WRONG_RECIPE: '配方错误',
  CUSTOMER_CANCEL: '客户取消',
  OTHER: '其他',
};

export default function WastePage() {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    materialId: '',
    quantity: '',
    reason: 'OTHER',
    reasonDetail: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsRes, analysisRes] = await Promise.all([
        api.get('/waste'),
        api.get('/waste/analysis'),
      ]);
      setRecords(recordsRes.data.records);
      setAnalysis(analysisRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/waste', formData);
      setShowCreateModal(false);
      setFormData({ materialId: '', quantity: '', reason: 'OTHER', reasonDetail: '' });
      loadData();
    } catch (error) {
      alert('创建失败');
    }
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

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">损耗分析</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          记录损耗
        </button>
      </div>

      {analysis && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">损耗总金额</p>
                <p className="text-2xl font-bold text-red-600">¥{analysis.summary.totalWaste.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <BarChart3 className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">损耗次数</p>
                <p className="text-2xl font-bold">{analysis.summary.totalRecords}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingDown className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">平均单次损耗</p>
                <p className="text-2xl font-bold">¥{analysis.summary.averagePerRecord.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">损耗原因分布</h3>
          <div className="space-y-3">
            {analysis?.groupedData && Object.entries(analysis.groupedData).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{wasteReasonMap[key] || key}</span>
                  <span className="text-sm text-gray-500 ml-2">({value.count}次)</span>
                </div>
                <span className="text-red-600 font-medium">¥{value.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">最近损耗记录</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {records.slice(0, 10).map((record) => (
              <div key={record.id} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{record.material?.name || '未关联原料'}</p>
                    <p className="text-xs text-gray-500">
                      {wasteReasonMap[record.reason]} · {record.recordedBy.name}
                    </p>
                  </div>
                  <span className="text-red-600 font-medium">-¥{record.totalAmount}</span>
                </div>
                {record.reasonDetail && (
                  <p className="text-xs text-gray-500 mt-1">备注: {record.reasonDetail}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-4">
            <h3 className="font-semibold mb-4">记录损耗</h3>
            <div className="space-y-4">
              <div>
                <label>损耗数量</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="请输入数量"
                />
              </div>
              <div>
                <label>损耗原因</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                >
                  {Object.entries(wasteReasonMap).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>详细说明</label>
                <textarea
                  value={formData.reasonDetail}
                  onChange={(e) => setFormData({ ...formData, reasonDetail: e.target.value })}
                  placeholder="请输入详细说明..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="btn btn-secondary"
              >
                取消
              </button>
              <button onClick={handleCreate} className="btn btn-primary">
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
