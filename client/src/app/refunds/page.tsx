'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

interface Refund {
  id: string;
  refundNo: string;
  order: { orderNo: string; customerName: string; totalAmount: number };
  amount: number;
  reason: string;
  detail?: string;
  status: string;
  createdBy: { name: string };
  approvedBy?: { name: string };
  createdAt: string;
}

const statusMap: Record<string, { label: string; class: string }> = {
  PENDING: { label: '待审批', class: 'badge-pending' },
  APPROVED: { label: '已批准', class: 'badge-confirmed' },
  REJECTED: { label: '已驳回', class: 'badge-rejected' },
  COMPLETED: { label: '已完成', class: 'badge-completed' },
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      const res = await api.get('/refunds');
      setRefunds(res.data.refunds);
    } catch (error) {
      console.error('加载退款失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/refunds/${id}/approve`, {});
      loadRefunds();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/refunds/${id}/reject`, {});
      loadRefunds();
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
        <h2 className="text-xl font-semibold">退款管理</h2>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>退款单号</th>
              <th>关联订单</th>
              <th>客户</th>
              <th>退款金额</th>
              <th>原因</th>
              <th>状态</th>
              <th>申请人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((refund) => (
              <tr key={refund.id}>
                <td className="font-mono text-sm">{refund.refundNo}</td>
                <td className="text-sm">{refund.order.orderNo}</td>
                <td>{refund.order.customerName}</td>
                <td className="text-red-600 font-medium">¥{refund.amount}</td>
                <td className="text-sm">{refund.reason}</td>
                <td>
                  <span className={`badge ${statusMap[refund.status]?.class}`}>
                    {statusMap[refund.status]?.label}
                  </span>
                </td>
                <td className="text-sm">{refund.createdBy.name}</td>
                <td>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSelectedRefund(refund)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="查看详情"
                    >
                      <Eye size={16} />
                    </button>
                    {refund.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleApprove(refund.id)}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="批准"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button 
                          onClick={() => handleReject(refund.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="驳回"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">退款详情</h3>
              <button onClick={() => setSelectedRefund(null)} className="text-gray-500">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-500">退款单号</p>
                <p className="font-mono">{selectedRefund.refundNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">关联订单</p>
                <p>{selectedRefund.order.orderNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">退款金额</p>
                <p className="text-xl font-bold text-red-600">¥{selectedRefund.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">退款原因</p>
                <p>{selectedRefund.reason}</p>
              </div>
              {selectedRefund.detail && (
                <div>
                  <p className="text-sm text-gray-500">详细说明</p>
                  <p className="text-sm">{selectedRefund.detail}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">申请人</p>
                <p>{selectedRefund.createdBy.name}</p>
              </div>
              {selectedRefund.approvedBy && (
                <div>
                  <p className="text-sm text-gray-500">审批人</p>
                  <p>{selectedRefund.approvedBy.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
