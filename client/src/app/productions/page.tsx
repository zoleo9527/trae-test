'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { Play, CheckCircle, RotateCcw, MessageSquare, Calendar } from 'lucide-react';

interface Production {
  id: string;
  batchNo: string;
  order: any;
  scheduledDate: string;
  status: string;
  startTime?: string;
  endTime?: string;
  yieldQuantity: number;
  defectiveQuantity: number;
  operator?: { name: string };
  notes: any[];
}

const statusMap: Record<string, { label: string; class: string }> = {
  PENDING: { label: '待生产', class: 'badge-pending' },
  IN_PROGRESS: { label: '生产中', class: 'badge-in-production' },
  COMPLETED: { label: '已完成', class: 'badge-completed' },
  REWORK: { label: '待返工', class: 'badge-warning' },
};

export default function ProductionsPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, scheduleRes] = await Promise.all([
        api.get('/productions'),
        api.get('/productions/schedule'),
      ]);
      setProductions(prodRes.data.productions);
      setSchedule(scheduleRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.post(`/productions/${id}/start`, {});
      loadData();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleComplete = async (id: string) => {
    const yieldQty = prompt('请输入合格数量:');
    const defectiveQty = prompt('请输入不合格数量:');
    if (!yieldQty || !defectiveQty) return;
    
    try {
      await api.post(`/productions/${id}/complete`, {
        yieldQuantity: parseInt(yieldQty),
        defectiveQuantity: parseInt(defectiveQty),
      });
      loadData();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleRework = async (id: string) => {
    try {
      await api.post(`/productions/${id}/rework`, {});
      loadData();
    } catch (error) {
      alert('操作失败');
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
        <h2 className="text-xl font-semibold">生产排期</h2>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-500" />
          <span className="text-sm text-gray-600">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {schedule && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-500">今日任务</p>
            <p className="text-2xl font-bold">{schedule.summary.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">待生产</p>
            <p className="text-2xl font-bold text-amber-600">{schedule.summary.pending}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">生产中</p>
            <p className="text-2xl font-bold text-blue-600">{schedule.summary.inProgress}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">已完成</p>
            <p className="text-2xl font-bold text-green-600">{schedule.summary.completed}</p>
          </div>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>批次号</th>
              <th>订单</th>
              <th>排期</th>
              <th>状态</th>
              <th>负责人</th>
              <th>产出/损耗</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {productions.map((prod) => (
              <tr key={prod.id}>
                <td className="font-mono text-sm">{prod.batchNo}</td>
                <td>
                  <p className="font-medium">{prod.order.customerName}</p>
                  <p className="text-xs text-gray-500">{prod.order.orderNo}</p>
                </td>
                <td>{new Date(prod.scheduledDate).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${statusMap[prod.status]?.class}`}>
                    {statusMap[prod.status]?.label}
                  </span>
                </td>
                <td className="text-sm">{prod.operator?.name || '-'}</td>
                <td>
                  {prod.status === 'COMPLETED' ? (
                    <span>
                      <span className="text-green-600">{prod.yieldQuantity}</span>
                      {' / '}
                      <span className="text-red-600">{prod.defectiveQuantity}</span>
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <div className="flex gap-1">
                    {prod.status === 'PENDING' && (
                      <button 
                        onClick={() => handleStart(prod.id)}
                        className="p-1 hover:bg-green-100 rounded text-green-600"
                        title="开始生产"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    {prod.status === 'IN_PROGRESS' && (
                      <button 
                        onClick={() => handleComplete(prod.id)}
                        className="p-1 hover:bg-green-100 rounded text-green-600"
                        title="完成生产"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {prod.status === 'COMPLETED' && (
                      <button 
                        onClick={() => handleRework(prod.id)}
                        className="p-1 hover:bg-amber-100 rounded text-amber-600"
                        title="返工"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedProduction(prod)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="查看备注"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProduction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">生产备注 - {selectedProduction.batchNo}</h3>
              <button onClick={() => setSelectedProduction(null)} className="text-gray-500">✕</button>
            </div>
            <div className="p-4 max-h-60 overflow-y-auto">
              {selectedProduction.notes?.map((note, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded mb-2 text-sm">
                  <p>{note.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {note.createdBy?.name} · {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {(!selectedProduction.notes || selectedProduction.notes.length === 0) && (
                <p className="text-gray-400 text-center py-4">暂无备注</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
