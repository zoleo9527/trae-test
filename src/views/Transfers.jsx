import React, { useState } from 'react'
import { useStore } from '../store'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const Transfers = () => {
  const { transferOrders, updateTransferStatus, setShowTransferModal, currentRole, loading } = useStore()
  const [filterStatus, setFilterStatus] = useState('all')

  const statusLabels = {
    pending: '待发货',
    shipped: '运输中',
    received: '已签收',
    lost: '已丢失',
  }

  const filteredOrders = filterStatus === 'all' 
    ? transferOrders 
    : transferOrders.filter(t => t.status === filterStatus)

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: zhCN })
    } catch {
      return dateStr
    }
  }

  const canUpdateStatus = () => {
    return currentRole === 'manager' || currentRole === 'processor'
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>🚚 调拨记录</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
            >
              <option value="all">全部状态</option>
              <option value="pending">待发货</option>
              <option value="shipped">运输中</option>
              <option value="received">已签收</option>
              <option value="lost">已丢失</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTransferModal(true)}>
              + 新建调拨
            </button>
          </div>
        </div>
        <div className="card-content" style={{ maxHeight: 'none', padding: 0 }}>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>调拨单号</th>
                <th>关联验光单</th>
                <th>路线</th>
                <th>镜片</th>
                <th>数量</th>
                <th>状态</th>
                <th>创建人</th>
                <th>创建时间</th>
                <th>物流单号</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{order.id}</td>
                  <td>{order.optometry_id || '-'}</td>
                  <td>
                    <span style={{ color: '#64748b' }}>{order.from_store}</span>
                    <span style={{ margin: '0 8px' }}>→</span>
                    <span style={{ fontWeight: 500 }}>{order.to_store}</span>
                  </td>
                  <td>{order.lens_name}</td>
                  <td>x{order.quantity}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td>{order.created_by}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{formatDate(order.created_at)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {order.tracking_no || '-'}
                  </td>
                  <td>
                    {canUpdateStatus() && order.status !== 'received' && order.status !== 'lost' && (
                      <div className="action-buttons">
                        {order.status === 'pending' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => updateTransferStatus(order.id, 'shipped')}
                          >
                            发货
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => updateTransferStatus(order.id, 'received')}
                            >
                              签收
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => updateTransferStatus(order.id, 'lost')}
                            >
                              丢失
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {!canUpdateStatus() && <span style={{ color: '#94a3b8' }}>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3>📊 调拨统计</h3>
        </div>
        <div className="card-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{transferOrders.length}</div>
              <div className="stat-label">总调拨单数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#f59e0b' }}>
                {transferOrders.filter(t => t.status === 'pending').length}
              </div>
              <div className="stat-label">待发货</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#3b82f6' }}>
                {transferOrders.filter(t => t.status === 'shipped').length}
              </div>
              <div className="stat-label">运输中</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#ef4444' }}>
                {transferOrders.filter(t => t.status === 'lost').length}
              </div>
              <div className="stat-label">已丢失</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Transfers
