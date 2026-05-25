import { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState({ status: '' });
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundForm, setRefundForm] = useState({ ticketCount: 0, refundAmount: 0, refundReason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status) params.status = filter.status;
      const res = await orderApi.getAll(params);
      setOrders(res.data);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusNames = {
    pending: '待确认',
    confirmed: '已确认',
    paid: '已付款',
    partial_refund: '部分退款',
    refunded: '已退款',
    cancelled: '已取消'
  };

  const canRefund = user?.role === 'theater_manager' || user?.role === 'ticket_supervisor';

  const openRefundModal = (order) => {
    setSelectedOrder(order);
    setRefundForm({
      ticketCount: order.ticketCount,
      refundAmount: order.paidAmount,
      refundReason: ''
    });
    setShowRefundModal(true);
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    if (refundForm.refundAmount > selectedOrder.paidAmount) {
      alert('退款金额不能超过已支付金额');
      return;
    }
    if (refundForm.ticketCount > selectedOrder.ticketCount) {
      alert('退票数量不能超过购票数量');
      return;
    }
    if (!refundForm.refundReason.trim()) {
      alert('请填写退票原因');
      return;
    }
    
    try {
      setSubmitting(true);
      await orderApi.requestRefund(selectedOrder.id, {
        ticketCount: refundForm.ticketCount,
        refundAmount: refundForm.refundAmount,
        refundReason: refundForm.refundReason
      });
      setShowRefundModal(false);
      alert('退票申请已提交，等待审批');
    } catch (err) {
      alert('提交失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>🎫 团单管理</h2>
        {canRefund && (
          <button className="btn btn-primary btn-sm">+ 新增团单</button>
        )}
      </div>

      <div className="filter-bar">
        <select 
          className="filter-select" 
          value={filter.status} 
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">全部状态</option>
          <option value="pending">待确认</option>
          <option value="confirmed">已确认</option>
          <option value="paid">已付款</option>
          <option value="partial_refund">部分退款</option>
          <option value="refunded">已退款</option>
        </select>
      </div>

      <div className="main-panel" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>团体名称</th>
              <th>联系人</th>
              <th>票数</th>
              <th>金额</th>
              <th>状态</th>
              <th>链条ID</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon">🎫</div><div>暂无团单数据</div></div></td></tr>
            ) : (
              orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{order.orderNo}</td>
                  <td>{order.groupName}</td>
                  <td>
                    <div>{order.contactPerson}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{order.contactPhone}</div>
                  </td>
                  <td>{order.ticketCount}张</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>¥{order.totalAmount.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>已付: ¥{order.paidAmount.toLocaleString()}</div>
                  </td>
                  <td>
                    <span className={`status-badge status-${order.status === 'paid' ? 'ticketing' : order.status}`}>
                      {statusNames[order.status]}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{order.chainId}</td>
                  <td style={{ fontSize: 13 }}>{dayjs(order.createdAt).format('MM-DD HH:mm')}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm">查看</button>
                      {canRefund && (order.status === 'paid' || order.status === 'confirmed') && (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => openRefundModal(order)}
                        >退票</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showRefundModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>申请退票 - {selectedOrder.groupName}</h3>
              <button className="close-btn" onClick={() => setShowRefundModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitRefund}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>订单号:</span>
                    <span style={{ fontFamily: 'monospace' }}>{selectedOrder.orderNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>购票数量:</span>
                    <span>{selectedOrder.ticketCount}张</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>已付金额:</span>
                    <span style={{ fontWeight: 600 }}>¥{selectedOrder.paidAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>退票数量</label>
                  <input 
                    type="number" 
                    className="form-control"
                    min="1"
                    max={selectedOrder.ticketCount}
                    value={refundForm.ticketCount}
                    onChange={e => setRefundForm({...refundForm, ticketCount: parseInt(e.target.value) || 0})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>退款金额 (元)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    min="0"
                    max={selectedOrder.paidAmount}
                    value={refundForm.refundAmount}
                    onChange={e => setRefundForm({...refundForm, refundAmount: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>退票原因</label>
                  <textarea 
                    className="form-control"
                    value={refundForm.refundReason}
                    onChange={e => setRefundForm({...refundForm, refundReason: e.target.value})}
                    rows="3"
                    placeholder="请详细说明退票原因，将作为审批依据"
                    required
                  />
                </div>

                <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, fontSize: 13 }}>
                  <strong>⚠️ 注意：</strong>
                  <div>• 只有已确认或已付款的团单可以申请退票</div>
                  <div>• 退票申请将由票务主管审批</div>
                  <div>• 审批结果将通过系统通知告知</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRefundModal(false)}>取消</button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
