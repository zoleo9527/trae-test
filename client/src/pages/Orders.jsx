import { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import dayjs from 'dayjs';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState({ status: '' });
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="page-header">
        <h2>🎫 团单管理</h2>
        <button className="btn btn-primary btn-sm">+ 新增团单</button>
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
                      {(order.status === 'paid' || order.status === 'confirmed') && (
                        <button className="btn btn-danger btn-sm">退票</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
