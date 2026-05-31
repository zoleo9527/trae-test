'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { Plus, Eye, CheckCircle, XCircle, Play, Archive, MessageSquare } from 'lucide-react';

interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  pickupDate: string;
  pickupTime: string;
  deliveryType: string;
  rejectReason?: string;
  items: any[];
  notes: any[];
  createdBy: { name: string };
}

const statusMap: Record<string, { label: string; class: string }> = {
  PENDING: { label: '待确认', class: 'badge-pending' },
  CONFIRMED: { label: '已确认', class: 'badge-confirmed' },
  IN_PRODUCTION: { label: '生产中', class: 'badge-in-production' },
  COMPLETED: { label: '已完成', class: 'badge-completed' },
  REJECTED: { label: '已驳回', class: 'badge-rejected' },
  CANCELLED: { label: '已取消', class: 'badge-cancelled' },
  REFUNDED: { label: '已退款', class: 'badge-refunded' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await api.post(`/orders/${id}/confirm`, {});
      loadOrders();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('请输入驳回原因:');
    if (!reason) return;
    try {
      await api.post(`/orders/${id}/reject`, { rejectReason: reason });
      loadOrders();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleStartProduction = async (id: string) => {
    try {
      await api.post(`/orders/${id}/start-production`, {});
      loadOrders();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.post(`/orders/${id}/complete`, {});
      loadOrders();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleAddNote = async () => {
    if (!selectedOrder || !noteContent) return;
    try {
      await api.post(`/orders/${selectedOrder.id}/notes`, { content: noteContent, type: 'GENERAL' });
      setNoteContent('');
      setShowNoteModal(false);
      loadOrders();
      if (selectedOrder) {
        const res = await api.get(`/orders/${selectedOrder.id}`);
        setSelectedOrder(res.data);
      }
    } catch (error) {
      alert('添加备注失败');
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
        <h2 className="text-xl font-semibold">订单管理</h2>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          新建订单
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>金额</th>
              <th>状态</th>
              <th>取货时间</th>
              <th>创建人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="font-mono text-sm">{order.orderNo}</td>
                <td>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.customerPhone}</p>
                </td>
                <td>¥{order.totalAmount}</td>
                <td>
                  <span className={`badge ${statusMap[order.status]?.class}`}>
                    {statusMap[order.status]?.label}
                  </span>
                </td>
                <td>
                  <p className="text-sm">{new Date(order.pickupDate).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{order.pickupTime}</p>
                </td>
                <td className="text-sm">{order.createdBy.name}</td>
                <td>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="查看详情"
                    >
                      <Eye size={16} />
                    </button>
                    {order.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleConfirm(order.id)}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="确认订单"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button 
                          onClick={() => handleReject(order.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="驳回订单"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button 
                        onClick={() => handleStartProduction(order.id)}
                        className="p-1 hover:bg-amber-100 rounded text-amber-600"
                        title="开始生产"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    {order.status === 'IN_PRODUCTION' && (
                      <button 
                        onClick={() => handleComplete(order.id)}
                        className="p-1 hover:bg-green-100 rounded text-green-600"
                        title="完成订单"
                      >
                        <Archive size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-3/4 max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">订单详情 - {selectedOrder.orderNo}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">客户姓名</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">联系电话</p>
                  <p className="font-medium">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">取货日期</p>
                  <p className="font-medium">{new Date(selectedOrder.pickupDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">取货时间</p>
                  <p className="font-medium">{selectedOrder.pickupTime}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">订单商品</h4>
                <table className="text-sm">
                  <thead>
                    <tr>
                      <th>商品</th>
                      <th>数量</th>
                      <th>单价</th>
                      <th>小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.product.name}</td>
                        <td>{item.quantity}</td>
                        <td>¥{item.unitPrice}</td>
                        <td>¥{item.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-right font-medium">总计:</td>
                      <td className="font-bold">¥{selectedOrder.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedOrder.rejectReason && (
                <div className="mb-4 p-3 bg-red-50 rounded">
                  <p className="text-sm text-red-600 font-medium">驳回原因:</p>
                  <p className="text-sm">{selectedOrder.rejectReason}</p>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">备注记录</h4>
                  <button 
                    onClick={() => setShowNoteModal(true)}
                    className="btn btn-secondary text-sm flex items-center gap-1"
                  >
                    <MessageSquare size={14} />
                    添加备注
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedOrder.notes?.map((note, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                      <p>{note.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {note.createdBy.name} · {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {(!selectedOrder.notes || selectedOrder.notes.length === 0) && (
                    <p className="text-gray-400 text-sm">暂无备注</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-4">
            <h3 className="font-semibold mb-4">添加备注</h3>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="请输入备注内容..."
              className="w-full h-24 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNoteModal(false)} className="btn btn-secondary">
                取消
              </button>
              <button onClick={handleAddNote} className="btn btn-primary">
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
